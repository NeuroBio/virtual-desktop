const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const AutoLaunch = require('auto-launch');

function createWindow() {
	const win = new BrowserWindow({
		width: 200,
		height: 800
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
	const databasePath = path.join(app.getPath('userData'), 'shortcuts.json');

	if (!fs.existsSync(databasePath)) {
		fs.writeFileSync(databasePath, JSON.stringify({ shortcuts: [] }, null, 2), 'utf-8');
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