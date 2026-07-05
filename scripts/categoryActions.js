/* global createCategory */
/* global categoryNames */
/* global setupCategorySettingsPrompt */
/* global populateCategories */
/* global setupConfirmPrompt */
/* global removeCategory */
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
					createCategory({ database, category });
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

async function deleteCategory(category) {
	setupConfirmPrompt({
		message: `Remove ${category.name}?`,
		callBack: async (response) => {
			if (response === 'submit') {
				const { success } = await window.electronAPI.deleteCategory({ category: category.name });

				if (success) {
					removeCategory(category);
				}
			}
		}
	});
}
