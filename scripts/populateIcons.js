/* global d3 */

function populateIcons(database) {
	console.log(database);
	const category = d3.select('#writing-shortcuts');
	database['Writing'].shortcuts.forEach((shortcut) => {
		const entry = category.append('div')
			.on('click', () => launch(shortcut.path));

		entry.attr('class', 'icon-entry')
			.append('img')
			.attr('src', shortcut.icon);

		entry.append('span')
			.attr('class', 'icon-name')
			.text(shortcut.name);
	});
}

async function launch(path) {
	const result = await window.electronAPI.launch(path);
	if (!result.success) {
		console.error(`Could not launch asset: ${result.error}`);
	}
}
