const { app, BrowserWindow, ipcMain, dialog, screen, shell, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const IconStrategy = require('./consts/IconStrategy.js');
const AutoLaunch = require('auto-launch');
let databasePath = '';
const iconCache = {};

function createWindow() {
	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	const panelWidth = screenWidth / 5;
	const win = new BrowserWindow({
		width: panelWidth,
		height: screenHeight,
		x: screenWidth - panelWidth,
		y: 0,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		}
	});

	win.loadFile(path.join(__dirname, 'index.html'));
}

// Configure the app to start up with Windows
const appLauncher = new AutoLaunch({
	name: 'Task Assistant',
	path: process.execPath, // Points to the app execution path
});

// Launches the window once Electron is ready
app.whenReady().then(() => {
	Menu.setApplicationMenu(null);
	databasePath = path.join(app.getPath('userData'), 'shortcuts.json');

	if (!fs.existsSync(databasePath)) {
		fs.writeFileSync(databasePath, JSON.stringify({}, null, 2), 'utf-8');
		console.log(`Created Shortcuts Database: ${databasePath}`);
	} else {
		console.log(`Loading Shortcuts Database: ${databasePath}`);
	}


	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Closes the app completely when you close the window
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
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
		path: filePath,
		isFile: true,
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
		path: folderPath,
		isFile: false,
	});

	await readyForUi(database);
	return { success: true, database };
});

ipcMain.handle('init', async () => {
	try {
		const database = loadDatabase();
		await readyForUi(database);
		return database;
	} catch (error) {
		console.error("Failed to read database:", error);
		return {};
	}
});

ipcMain.handle('launch-shortcut', async (event, filePath) => {
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
		const sortedShortcuts = Object.values(database[category].shortcuts)
			.sort((a, b) => a.position - b.position);
		const [movedItem] = sortedShortcuts.splice(dragId, 1);
		sortedShortcuts.splice(dropId, 0, movedItem);

		database[category].shortcuts = sortedShortcuts.reduce((keyed, s, i) => {
			s.position = i;
			keyed[s.id] = s;
			return keyed;
		}, {});

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
	const { oldName, name, defaultOpen } = data;
	try {
		const database = loadDatabase();

		const category = database[oldName];
		delete database[oldName];
		category.name = name;
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
		return {
			success: true,
			icon: await getIcon({ ...shortcut, iconStrategy }),
		};
	} catch (error) {
		console.error("Failed to get icon:", error);
		return { success: false };
	}
});

ipcMain.handle('modify-icon', async (event, data) => {
	const { category, shortcutId, iconStrategy } = data;
	try {
		const database = loadDatabase();

		const shortcut = database[category].shortcuts[shortcutId];
		shortcut.iconStrategy = iconStrategy;

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


function loadDatabase() {
	const rawData = fs.readFileSync(databasePath, 'utf-8');
	return JSON.parse(rawData);
}

function saveDataBase(database) {
	fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf-8');
}

function addToDatabase({ database, category, path, isFile }) {
	database[category] ??= { shortcuts: {} };
	const id = Date.now().toString();
	const name = getShortcutName(path);
	const looksLikeSteam = isFile && path.toLowerCase().endsWith('.url');

	database[category].shortcuts[id] = {
		id,
		path,
		isFile,
		name,
		alias: name,
		position: Object.keys(database[category].shortcuts).length,
		iconStrategy: looksLikeSteam ? IconStrategy.STEAM : IconStrategy.STANDARD,
	};
	saveDataBase(database);
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

async function getIcon({ isFile, path, iconStrategy, iconPath }) {
	try {
		switch (iconStrategy) {
			case IconStrategy.STANDARD: {
				if (isFile) {
					const nativeIcon = await app.getFileIcon(path, { size: 'large' });
					return nativeIcon.toDataURL();
				}
				return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBmaWxsPSIjRkZDQTI4IiBkPSJNMTAgNEg0Yy0xLjEgMC0xLjk5LjktMS45OSAyTDIgMThjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+';
			}
			case IconStrategy.STEAM: {
				const steamIcon = await getSteamIcon(path);
				return steamIcon;
			}
			case IconStrategy.CUSTOM: {
				return iconPath;
			}
		}
	} catch (iconError) {
		console.error(`Failed to get icon for: ${path}`, iconError);
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

