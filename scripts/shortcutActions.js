/* global repopulateIcons */
/* global setupConfirmPrompt */
/* global setupShortcutNamePrompt */
/* global setupSelectPrompt */
/* global categoryNames */
/* global setupIconPrompt */
/* global repopulateIcon */
/* global dismissContextMenu */

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

async function launchShortcut(path) {
	const result = await window.electronAPI.launchShortcut(path);
	if (!result.success) {
		console.error(`Could not launch asset: ${result.error}`);
	}
}

async function removeShortcut({ event, category, shortcut }) {
	setupConfirmPrompt({
		message: `Remove ${shortcut.alias} from ${category}?`,
		callBack: async (response) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.deleteShortcut({
					category,
					shortcutId: shortcut.id,
				});

				if (success) {
					repopulateIcons({ database, category });
				}
			}
		}
	});
	dismissContextMenu();
}

async function renameShortcut({ event, category, shortcut }) {
	setupShortcutNamePrompt({
		message: `Rename ${shortcut.alias} from ${category}:`,
		label: 'Name',
		defaultValue: shortcut.alias,
		callBack: async (response, alias) => {
			if (response === 'submit') {
				const { success, shortcut: updated, database } = await window.electronAPI.renameShortcut({
					category,
					shortcutId: shortcut.id,
					alias,
				});

				if (success) {
					repopulateIcon({ shortcut: updated, category, database });
				}
			}
		}
	});

	dismissContextMenu();
}

async function moveShortcut({ event, oldCategory, shortcut }) {
	setupSelectPrompt({
		message: `Move ${shortcut.alias} from ${oldCategory} to:`,
		options: categoryNames.filter((name) => name !== oldCategory),
		callBack: async (response, newCategory) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.moveShortcut({
					newCategory,
					oldCategory,
					shortcutId: shortcut.id,
				});

				if (success) {
					repopulateIcons({ database, category: oldCategory });
					repopulateIcons({ database, category: newCategory });
				}
			}
		}
	});

	dismissContextMenu();
}

async function modifyIcon({ event, category, shortcut }) {
	setupIconPrompt({
		shortcut,
		category,
		callBack: async (response, formData) => {
			if (response === 'submit') {
				const shortcutId = shortcut.id;
				const { success, shortcut: updated, database } = await window.electronAPI.modifyIcon({
					category,
					shortcutId,
					...formData
				});

				if (success) {
					repopulateIcon({ shortcut: updated, category, database });
				}
			}
		}
	});
	dismissContextMenu();
}

