const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	init: () => ipcRenderer.invoke('init'),
	addFileShortcut: (data) => ipcRenderer.invoke('add-file-shortcut', data),
	addFolderShortcut: (data) => ipcRenderer.invoke('add-folder-shortcut', data),
	addWebsiteShortcut: (data) => ipcRenderer.invoke('add-website-shortcut', data),
	launchShortcut: (data) => ipcRenderer.invoke('launch-shortcut', data),
	launchWebsite: (data) => ipcRenderer.invoke('launch-website', data),
	deleteShortcut: (data) => ipcRenderer.invoke('delete-shortcut', data),
	reorder: (data) => ipcRenderer.invoke('reorder', data),
	renameShortcut: (data) => ipcRenderer.invoke('rename-shortcut', data),
	moveShortcut: (data) => ipcRenderer.invoke('moveShortcut', data),
	addCategory: (data) => ipcRenderer.invoke('add-category', data),
	updateCategorySettings: (data) => ipcRenderer.invoke('update-category-settings', data),
	getIcon: (data) => ipcRenderer.invoke('get-icon', data),
	modifyIcon: (data) => ipcRenderer.invoke('modify-icon', data),
	deleteCategory: (data) => ipcRenderer.invoke('delete-category', data),
	getAppSettings: (data) => ipcRenderer.invoke('get-app-settings', data),
	updateAppSettings: (data) => ipcRenderer.invoke('update-app-settings', data),

	// sync
	constants: () => ipcRenderer.sendSync('constants'),
});