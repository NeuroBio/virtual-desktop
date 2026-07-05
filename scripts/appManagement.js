/* global populateCategories */
/* global setupAppSettingsPrompt */
/* global setupAppInfoPrompt */
/* global clearView */


let appSettings;
let appPaths;
async function init() {
	const { database, settings, paths } = await window.electronAPI.init();
	appSettings = settings;
	appPaths = paths;
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
					if (requiresReload({ appSettings, priorSettings })) {
						clearView();
						populateCategories(database);
					}
				}
			}
		}
	});
}

async function updateAppInfo() {
	setupAppInfoPrompt();
}

function requiresReload({ appSettings, priorSettings }) {
	return appSettings.showExtensions !== priorSettings.showExtensions
		|| appSettings.iconNameLines !== priorSettings.iconNameLines;
}

async function openGithub() {
	await window.electronAPI.launchWebsite({
		website: 'https://github.com/NeuroBio/virtual-desktop',
	});
}

async function openShortcutsData() {
	await window.electronAPI.launchShortcut({ filePath: appPaths.shortcuts });
}

async function openConfigData() {
	await window.electronAPI.launchShortcut({ filePath: appPaths.config });
}

window.addEventListener('DOMContentLoaded', init, { once: true });