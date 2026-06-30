/* global repopulateIcons */

async function addFileShortcut(category) {
	const { success, database } = await window.electronAPI.addFileShortcut({ category });

	if (success) {
		repopulateIcons({ database, category });
	}
}

async function addFolderShortcut(category) {
	const { success, database } = await window.electronAPI.addFolderShortcut({ category });

	if (success) {
		repopulateIcons({ database, category });
	}
}

