/* global repopulateIcons */

async function addFileShortcut(category) {
	const { success, database } = await window.electronAPI.addFileShortcut({ category });

	if (success) {
		console.log("Shortcut successfully saved!", database);
		repopulateIcons(database);
	}
}

async function addFolderShortcut(category) {
	const { success, database } = await window.electronAPI.addFolderShortcut({ category });

	if (success) {
		console.log("Shortcut successfully saved!", database);
		repopulateIcons(database);
	}
}

