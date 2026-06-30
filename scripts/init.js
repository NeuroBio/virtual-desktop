/* global populateCategories */

async function init() {
	const database = await window.electronAPI.init();
	populateCategories(database);
}

window.addEventListener('DOMContentLoaded', init);