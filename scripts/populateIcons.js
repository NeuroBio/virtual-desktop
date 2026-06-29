/* global d3 */

function populateIcons(database) {
	console.log(database);
	const category = d3.select('#writing-shortcuts');
	database['Writing'].shortcuts.forEach((shortcut) => {
		const entry = category.append('div')
			.on('click', () => launch(shortcut.path))
			.on('contextmenu', (event) => remove({
				event,
				category: 'Writing',
				shortcut,
			}));

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

async function remove({ event, category, shortcut }) {
	if (event && typeof event.preventDefault === 'function') {
		event.preventDefault();
	} else if (window.event) {
		window.event.preventDefault();
	}

	const confirmDelete = confirm(`Remove "${shortcut.name}" from ${category}?`);
	if (confirmDelete) {
		const { success, database } = await window.electronAPI.deleteShortcut({
			category,
			shortcutId: shortcut.id,
		});

		if (success) {
			repopulateIcons(database);
		}
	}
}





function repopulateIcons(database) {
	d3.select('#writing-shortcuts').html(''); // should be #categories
	populateIcons(database);
}
