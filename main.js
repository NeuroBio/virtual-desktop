const { app, BrowserWindow, ipcMain, dialog, screen, shell, nativeImage, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const IconStrategy = require('./consts/IconStrategy.js');
const AutoLaunch = require('auto-launch');
let databasePath = '';
let configPath = '';
const appPath = path.dirname(process.execPath);
let win;
const iconCache = {};

function createWindow() {
	win = new BrowserWindow({
		...getConfig(),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		}
	});

	win.loadFile(path.join(__dirname, 'index.html'));
}

function getConfig() {
	if (fs.existsSync(configPath)) {
		try {
			return JSON.parse(fs.readFileSync(configPath, 'utf8'));
		} catch (error) {
			console.error('Error parsing app settings json:', error);
		}
	}


	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	const panelWidth = Math.round(screenWidth / 5);
	return {
		width: panelWidth,
		height: screenHeight,
		x: screenWidth - panelWidth,
		y: 0,
		showExtensions: false,
		iconNameLines: 2,
	};
}

const appLauncher = new AutoLaunch({
	name: 'Virtual Desktop',
	path: process.execPath,
});

app.whenReady().then(() => {
	Menu.setApplicationMenu(null);

	if (app.isPackaged) {
		app.setLoginItemSettings({
			openAtLogin: true,
			path: app.getPath('exe')
		});
	}

	databasePath = path.join(app.getPath('userData'), 'shortcuts.json');
	configPath = path.join(app.getPath('userData'), 'app-config.json');


	if (!fs.existsSync(databasePath)) {
		fs.writeFileSync(databasePath, JSON.stringify({}, null, 2), 'utf-8');
		console.log(`Created Shortcuts Database: ${databasePath}`);
	} else {
		console.log(`Loading Shortcuts Database: ${databasePath}`);
	}

	if (!fs.existsSync(configPath)) {
		fs.writeFileSync(configPath, JSON.stringify(getConfig(), null, 2), 'utf-8');
		console.log(`Created App Settings: ${configPath}`);
	} else {
		console.log(`Loading App Settings: ${configPath}`);
	}

	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

ipcMain.on('constants', (event) => {
	event.returnValue = { IconStrategy };
});

ipcMain.handle('add-file-shortcut', async (event, data) => {
	const { category } = data;
	const result = await dialog.showOpenDialog({ properties: ['openFile'] });

	if (result.canceled || result.filePaths.length === 0) {
		return { success: false, reason: 'canceled' };
	}
	const filePath = result.filePaths[0];
	const database = loadDatabase();
	addToDatabase({
		database,
		category,
		filePath,
		isFile: true,
		isWebsite: false,
	});

	await readyForUi(database);
	return { success: true, database };
});

ipcMain.handle('add-folder-shortcut', async (event, data) => {
	const { category } = data;
	const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

	if (result.canceled || result.filePaths.length === 0) {
		return { success: false, reason: 'canceled' };
	}
	const folderPath = result.filePaths[0];
	const database = loadDatabase();
	addToDatabase({
		database,
		category,
		filePath: folderPath,
		isFile: false,
		isWebsite: false,
	});

	await readyForUi(database);
	return { success: true, database };
});

ipcMain.handle('add-website-shortcut', async (event, data) => {
	const { category, website } = data;
	const database = loadDatabase();
	addToDatabase({
		database,
		category,
		filePath: website,
		isFile: false,
		isWebsite: true,
	});

	await readyForUi(database);
	return { success: true, database };
});

ipcMain.handle('init', async () => {
	try {
		const database = loadDatabase();
		// For Migrations
		// Object.values(database).forEach((category) => {
		// 	Object.values(category.shortcuts).forEach((shortcut) => {
		// 	});
		// });
		// saveDataBase(database);
		await readyForUi(database);
		const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));

		return {
			success: true,
			database,
			settings,
			paths: {
				shortcuts: databasePath,
				config: configPath,
				app: appPath,
			},
		};
	} catch (error) {
		console.error("Failed to read database:", error);
		return { success: false };
	}
});

ipcMain.handle('launch-shortcut', async (event, data) => {
	const { filePath } = data;
	try {
		const errorMessage = await shell.openPath(filePath);

		if (errorMessage) {
			console.error(`Windows shell launch failed: ${errorMessage}`);
			return { success: false, error: errorMessage };
		}
		return { success: true };
	} catch (error) {
		console.error("Execution handler crash:", error);
		return { success: false, error: error.message };
	}
});

ipcMain.handle('launch-website', async (event, data) => {
	const { website } = data;
	try {
		shell.openExternal(website);
	} catch (error) {
		console.error("Failed to launch website:", error);
		return { success: false, error: error.message };
	}


});
ipcMain.handle('delete-shortcut', async (event, data) => {
	const { category, shortcutId } = data;
	try {
		const database = loadDatabase();

		delete database[category].shortcuts[shortcutId];
		saveDataBase(database);

		await readyForUi(database);
		return { success: true, database };
	} catch (error) {
		console.error("Failed to delete shortcut:", error);
		return { success: false, error: error.message };
	}
});

ipcMain.handle('reorder', async (event, data) => {
	const { category, dragId, dropId } = data;
	try {
		const database = loadDatabase();
		database[category].shortcuts = moveByPosition({
			oldPosition: dragId,
			array: database[category].shortcuts,
			newPosition: dropId,
			key: 'id',
		});

		saveDataBase(database);
		await readyForUi(database);
		return { success: true, database };
	} catch (error) {
		console.error("Failed to save sort order:", error);
		return { success: false };
	}
});

ipcMain.handle('rename-shortcut', async (event, data) => {
	const { category, shortcutId, alias } = data;
	try {
		const database = loadDatabase();
		const shortcut = database[category].shortcuts[shortcutId];
		shortcut.alias = alias;

		saveDataBase(database);
		await readyForUi(database);
		return { success: true, shortcut, database };
	} catch (error) {
		console.error("Failed to update name:", error);
		return { success: false };
	}
});

ipcMain.handle('add-category', async (event, data) => {
	const { name, defaultOpen } = data;
	try {
		const database = loadDatabase();

		database[name] = {
			name,
			defaultOpen,
			position: Object.keys(database).length,
			shortcuts: {},
		};

		saveDataBase(database);
		await readyForUi(database);
		return { success: true, database };
	} catch (error) {
		console.error("Failed to add new category:", error);
		return { success: false };
	}
});

ipcMain.handle('update-category-settings', async (event, data) => {
	const { oldName, name, defaultOpen, position } = data;
	try {
		let database = loadDatabase();

		const category = database[oldName];

		if (oldName !== name) {
			delete database[oldName];
			category.name = name;

		}

		if (position !== category.position) {
			database = moveByPosition({
				array: database,
				oldPosition: category.position,
				newPosition: +position,
				key: 'name',
			});
		}

		category.defaultOpen = defaultOpen;
		database[name] = category;

		saveDataBase(database);
		await readyForUi(database);
		return { success: true, database };
	} catch (error) {
		console.error("Failed to update category settings:", error);
		return { success: false };
	}
});

ipcMain.handle('moveShortcut', async (event, data) => {
	const { newCategory, oldCategory, shortcutId } = data;
	try {
		const database = loadDatabase();
		const shortcut = database[oldCategory].shortcuts[shortcutId];
		delete database[oldCategory].shortcuts[shortcutId];
		shortcut.position = database[newCategory].shortcuts.length;
		database[newCategory].shortcuts[shortcutId] = shortcut;

		saveDataBase(database);
		await readyForUi(database);
		return { success: true, database };
	} catch (error) {
		console.error("Failed to move shortcut:", error);
		return { success: false };
	}
});

ipcMain.handle('get-icon', async (event, data) => {
	const { shortcut, iconStrategy } = data;
	try {
		const icon = await getIcon({ ...shortcut, iconStrategy });
		return {
			success: true,
			icon,
		};
	} catch (error) {
		console.error("Failed to get icon:", error);
		return { success: false };
	}
});

ipcMain.handle('modify-icon', async (event, data) => {
	const { category, shortcutId, iconStrategy, iconPath } = data;
	try {
		const database = loadDatabase();

		const shortcut = database[category].shortcuts[shortcutId];
		shortcut.iconStrategy = iconStrategy;
		shortcut.iconPath = iconStrategy === IconStrategy.CUSTOM ? iconPath : '';

		saveDataBase(database);

		delete iconCache[shortcutId];
		shortcut.icon = await getIcon(shortcut);

		await readyForUi(database);
		return { success: true, shortcut, database };

	} catch (error) {
		console.error("Failed to get icon:", error);
		return { success: false };
	}
});

ipcMain.handle('delete-category', async (event, data) => {
	const { category } = data;
	try {
		const database = loadDatabase();
		delete database[category];

		saveDataBase(database);
		await readyForUi(database);
		return { success: true, database };
	} catch (error) {
		console.error("Failed to update category settings:", error);
		return { success: false };
	}
});

ipcMain.handle('get-app-settings', async () => {
	try {
		return {
			success: true,
			settings: JSON.parse(fs.readFileSync(configPath, 'utf8')),
		};
	} catch (error) {
		console.error('Error loading or parsing app settings json:', error);
		return { success: false };
	}
});

ipcMain.handle('update-app-settings', async (event, data) => {
	const { width, height, x, y, showExtensions, iconNameLines } = data;
	try {
		const config = {
			width: +width,
			height: +height,
			x: +x,
			y: +y,
			showExtensions,
			iconNameLines: +iconNameLines,
		};
		win.setBounds(config);
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
		const database = loadDatabase();
		await readyForUi(database);
		return { success: true, settings: config, database };
	} catch (error) {
		console.error('Error saving app settings json:', error);
		return { success: false };
	}
});

function moveByPosition({ array, oldPosition, newPosition, key }) {
	const sorted = Object.values(array)
		.sort((a, b) => a.position - b.position);
	const [movedItem] = sorted.splice(oldPosition, 1);
	sorted.splice(newPosition, 0, movedItem);

	return sorted.reduce((keyed, s, i) => {
		s.position = i;
		keyed[s[key]] = s;
		return keyed;
	}, {});
}

function loadDatabase() {
	const rawData = fs.readFileSync(databasePath, 'utf-8');
	return JSON.parse(rawData);
}

function saveDataBase(database) {
	fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf-8');
}

function addToDatabase({ database, category, filePath, isFile, isWebsite }) {
	database[category] ??= { shortcuts: {} };
	const id = Date.now().toString();
	const name = getShortcutName(filePath);

	database[category].shortcuts[id] = {
		id,
		path: filePath,
		isFile,
		isWebsite,
		name,
		alias: name,
		position: Object.keys(database[category].shortcuts).length,
		iconStrategy: getDefaultIconStrategy({ isFile, filePath }),
		iconPath: '',
		extension: path.extname(filePath)
	};
	saveDataBase(database);
}

function getDefaultIconStrategy({ isFile, filePath }) {
	if (!isFile) {
		return IconStrategy.STANDARD;
	}

	if (filePath.toLowerCase().endsWith('.url')) {
		return IconStrategy.STEAM;
	}

	if (filePath.toLowerCase().endsWith('.pdf')) {
		return IconStrategy.PDF;
	}

	return IconStrategy.STANDARD;
}

async function applyIcons(database) {
	// must be for loop because async badness
	for (const category of Object.keys(database)) {
		for (const shortcutId of Object.keys(database[category].shortcuts)) {
			const shortcut = database[category].shortcuts[shortcutId];
			let icon = iconCache[shortcutId];
			if (!icon) {
				icon = await getIcon(shortcut);
				iconCache[shortcutId] = icon;
			}
			shortcut.icon = icon;
		};
	};
}

async function getIcon({ isFile, isWebsite, path, iconStrategy, iconPath }) {
	try {
		switch (iconStrategy) {
			case IconStrategy.STANDARD: {
				if (isFile) {
					const nativeIcon = await app.getFileIcon(path, { size: 'large' });
					return nativeIcon.toDataURL();
				}

				return isWebsite
					? `data:image/png;base64,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`
					: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBmaWxsPSIjRkZDQTI4IiBkPSJNMTAgNEg0Yy0xLjEgMC0xLjk5LjktMS45OSAyTDIgMThjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+';
			}
			case IconStrategy.STEAM: {
				const steamIcon = await getSteamIcon(path);
				return steamIcon;
			}
			case IconStrategy.CUSTOM: {
				return iconPath;
			}
			case IconStrategy.PDF: {
				return nativeImage.createThumbnailFromPath(path, { width: 48, height: 48 })
					.then(thumbnail => thumbnail.toDataURL());
			}
		}
	} catch (error) {
		console.error(`Failed to get icon for: ${path}`, error);
		const nativeIcon = await app.getFileIcon('', { size: 'large' });
		return nativeIcon.toDataURL();
	}
}

function getShortcutName(filePath) {
	return path.parse(filePath).name;
}

async function getSteamIcon(path) {
	const fileContents = fs.readFileSync(path, 'utf-8');
	const iconMatch = fileContents.match(/IconFile=(.+)/i);

	if (iconMatch && iconMatch[1]) {
		const localIconPath = iconMatch[1].replace(/\r/g, '').trim();

		const iconBuffer = fs.readFileSync(localIconPath);
		return `data:image/x-icon;base64,${iconBuffer.toString('base64')}`;
	}
}

async function readyForUi(database) {
	await applyIcons(database);
	Object.values(database).forEach((category) => {
		category.shortcuts = Object.values(category.shortcuts)
			.sort((a, b) => a.position - b.position);
	});
}

