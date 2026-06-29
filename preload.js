const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	addFileShortcut: (data) => ipcRenderer.invoke('add-file-shortcut', data),
	addFolderShortcut: (data) => ipcRenderer.invoke('add-folder-shortcut', data),
	init: () => ipcRenderer.invoke('init'),
	launch: (data) => ipcRenderer.invoke('launch', data),
});