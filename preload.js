const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	init: () => ipcRenderer.invoke('init'),
	addFileShortcut: (data) => ipcRenderer.invoke('add-file-shortcut', data),
	addFolderShortcut: (data) => ipcRenderer.invoke('add-folder-shortcut', data),
	launchShortcut: (data) => ipcRenderer.invoke('launch-shortcut', data),
	deleteShortcut: (data) => ipcRenderer.invoke('delete-shortcut', data),
	reorder: (data) => ipcRenderer.invoke('reorder', data),
	renameShortcut: (data) => ipcRenderer.invoke('rename-shortcut', data),
	moveShortcut: (data) => ipcRenderer.invoke('moveShortcut', data),
	addCategory: (data) => ipcRenderer.invoke('add-category', data),
	updateCategorySettings: (data) => ipcRenderer.invoke('update-category-settings', data),
	constants: () => ipcRenderer.sendSync('constants'),
});