/* global populateCategory */
/* global setupInputPrompt */
/* global categoryNames */

async function addCategory() {
	setupInputPrompt({
		message: `Create New Category`,
		label: 'Name',
		defaultValue: '',
		callBack: async (response, category) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.addCategory({ category });

				if (success) {
					categoryNames.push(category);
					populateCategory({ database, category });
				}
			}
		}
	});
}
