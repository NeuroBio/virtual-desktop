/* global populateCategories */
/* global setupAppSettingsPrompt */
let appSettings;
async function init() {
	const { database, settings } = await window.electronAPI.init();
	appSettings = settings;
	populateCategories(database);
}

async function updateAppSettings() {
	setupAppSettingsPrompt({
		callBack: async (response, formData) => {
			if (response === 'submit') {
				const { success, settings: appSettings } = await window.electronAPI.updateAppSettings(formData);
			}
		}
	});
}

window.addEventListener('DOMContentLoaded', init, { once: true });