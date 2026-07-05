/* global populateCategories */
/* global setupAppSettingsPrompt */
/* global clearView */


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
				const priorSettings = { ...appSettings };
				const { success, settings, database } = await window.electronAPI.updateAppSettings(formData);
				if (success) {
					appSettings = settings;
					if (appSettings.showExtensions !== priorSettings.showExtensions) {
						clearView();
						populateCategories(database);
					}
				}
			}
		}
	});
}

window.addEventListener('DOMContentLoaded', init, { once: true });