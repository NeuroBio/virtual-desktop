/* global populateIcons */

async function init() {
	const database = await window.electronAPI.init();
	populateIcons(database);
}

window.addEventListener('DOMContentLoaded', init);