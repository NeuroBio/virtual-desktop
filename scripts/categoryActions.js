/* global populateCategory */
/* global setupInputPrompt */

async function addCategory() {
	setupInputPrompt({
		message: `Create New Category`,
		label: 'Name',
		defaultValue: '',
		callBack: async (response, category) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.addCategory({ category });

				if (success) {
					populateCategory({ database, category });
				}
			}
		}
	});
}
