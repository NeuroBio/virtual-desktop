const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const AutoLaunch = require('auto-launch');
let databasePath = '';

function createWindow() {
	const win = new BrowserWindow({
		width: 200,
		height: 800,
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


ipcMain.handle('add-file-shortcut', async (event, data) => {
	const { category } = data;
	const result = await dialog.showOpenDialog({ properties: ['openFile'] });

	if (result.canceled || result.filePaths.length === 0) {
		return { success: false, reason: 'canceled' };
	}
	const filePath = result.filePaths[0];
	const database = loadDatabase();
	addToDatabase({ database, category, filePath });

	return { success: true, updatedData: database };
});

ipcMain.handle('add-folder-shortcut', async (event, data) => {
	const { category } = data;
	const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

	if (result.canceled || result.filePaths.length === 0) {
		return { success: false, reason: 'canceled' };
	}
	const filePath = result.filePaths[0];
	const database = loadDatabase();
	addToDatabase({ database, category, filePath });

	return { success: true, updatedData: database };
});

function loadDatabase() {
	const rawData = fs.readFileSync(databasePath, 'utf-8');
	return JSON.parse(rawData);
}

function saveDataBase(database) {
	fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf-8');
}

function addToDatabase({ database, category, filePath }) {
	database[category] ??= { shortcuts: [] };
	database[category].shortcuts.push({
		id: Date.now().toString(),
		path: filePath
	});
	saveDataBase(database);
}