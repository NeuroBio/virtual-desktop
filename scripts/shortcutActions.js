/* global d3 */
/* global repopulateIcons */
/* global setupConfirmPrompt */
/* global setupInputPrompt */

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
	const result = await window.electronAPI.launch(path);
	if (!result.success) {
		console.error(`Could not launch asset: ${result.error}`);
	}
}

async function removeShortcut({ event, category, shortcut }) {
	setupConfirmPrompt({
		message: `Remove ${shortcut.name} from ${category}?`,
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
	setupInputPrompt({
		message: `Rename ${shortcut.name} from ${category}:`,
		label: 'Name',
		defaultValue: shortcut.name,
		callBack: async (response, name) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.renameShortcut({
					category,
					shortcutId: shortcut.id,
					name,
				});

				if (success) {
					repopulateIcons({ database, category });
				}
			}
		}
	});

	dismissContextMenu();
}

function dismissContextMenu() {
	d3.select('#context-menu').style('display', 'none');
}
