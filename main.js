const { app, BrowserWindow } = require('electron');
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
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Closes the app completely when you close the window
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});