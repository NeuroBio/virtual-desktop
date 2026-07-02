/* global populateCategory */
/* global setupInputPrompt */
/* global categoryNames */
/* global setupCategorySettingsPrompt */

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

async function updateCategorySettings(category) {
	setupCategorySettingsPrompt({
		category,
		message: `Update settings for ${category.name}`,
		callBack: async (response, formData) => {
			console.log(formData);
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.updateCategorySettings(formData);

				if (success) {
					populateCategory({ database, category: database[formData.name] });
				}
			}
		}
	});
}
