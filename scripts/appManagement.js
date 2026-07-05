/* global populateCategories */
/* global setupAppSettingsPrompt */

async function init() {
	const database = await window.electronAPI.init();
	populateCategories(database);
}

async function updateAppSettings() {
	const { settings } = await window.electronAPI.getAppSettings();
	setupAppSettingsPrompt({
		settings,
		callBack: async (response, formData) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.updateAppSettings(formData);
			}
		}
	});
}

window.addEventListener('DOMContentLoaded', init, { once: true });