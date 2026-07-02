/* global populateCategory */
/* global setupInputPrompt */
/* global categoryNames */
/* global setupCategorySettingsPrompt */
/* global populateCategories */
/* global clearView */

async function addCategory() {
	setupCategorySettingsPrompt({
		message: `Create New Category`,
		callBack: async (response, formData) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.addCategory(formData);

				if (success) {
					const category = formData.name;
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
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.updateCategorySettings({
					oldName: category.name,
					...formData,
				});

				if (success) {
					clearView();
					populateCategories(database);
				}
			}
		}
	});
}
