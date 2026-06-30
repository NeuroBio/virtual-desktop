/* global d3 */
/* global addFileShortcut */
/* global addFolderShortcut */
/* global launchShortcut */
/* global removeShortcut */
/* global renameShortcut */



d3.select('body').on('click contextmenu', () => {
	d3.select('#context-menu').style('display', 'none');
});

function populateCategories(database) {
	console.log(database);

	Object.keys(database).forEach((category) =>
		populateCategory({ database, category }));
}

function populateCategory({ database, category }) {
	const main = d3.select('#categories')
		.append('section')
		.classed('accordion', true)
		.classed('is-open', true);
	const header = main.append('h2')
		.attr('class', 'accordion-header');

	const headerText = header.append('div');
	headerText.append('button').attr('class', 'accordion-icon');
	headerText.append('span').text(category);

	const headerButtons = header.append('div')
		.attr('class', 'add-buttons');
	headerButtons.append('button')
		.text('+ File')
		.on('click', () => addFileShortcut(category));

	headerButtons.append('button')
		.text('+ Folder')
		.on('click', () => addFolderShortcut(category));

	main.append('div')
		.attr('class', 'accordion-body')
		.append('div')
		.attr('class', 'shortcut-container')
		.attr('id', `${toCategoryId(category)}`);

	populateIcons(database, category);
}

function toCategoryId(category) {
	return `${category.split(' ').join('_')}-shortcuts`;
}

function populateIcons(database, category) {
	const categoryElement = d3.select(`#${toCategoryId(category)}`);
	database[category].shortcuts.forEach((shortcut) => {
		const entry = categoryElement.append('div')
			.on('dblclick', () => launchShortcut(shortcut.path))
			.on('contextmenu', () => {
				const event = d3.event;
				event.preventDefault();
				event.stopPropagation();
				d3.select('#context-menu')
					.style('left', `${event.pageX}px`)
					.style('top', `${event.pageY}px`)
					.style('display', 'block');

				d3.select('#remove-shortcut')
					.on('click', () => removeShortcut({ event, category, shortcut }));
				d3.select('#rename-shortcut')
					.on('click', () => renameShortcut({ event, category, shortcut }));
			});

		setupDragAndDrop({
			database,
			node: entry.node(),
			shortcut,
			category,
		});

		entry.attr('class', 'icon-entry')
			.append('img')
			.attr('src', shortcut.icon);

		entry.append('span')
			.attr('class', 'icon-name')
			.text(shortcut.name);
	});
}

function repopulateIcons({ database, category }) {
	d3.select(`#${toCategoryId(category)}`).html(''); // should be #categories
	populateIcons(database, category);
}

function setupDragAndDrop({ node, database, shortcut, category }) {
	node.setAttribute('draggable', 'true');

	node.ondragstart = (event) => {
		event.dataTransfer.setData('text/plain', shortcut.id);
	};

	node.ondragover = (event) => {
		event.preventDefault();
	};

	node.ondrop = async (event) => {
		const incomingId = event.dataTransfer.getData('text/plain');
		if (incomingId === shortcut.id) {
			return;
		}

		const shortcuts = database[category].shortcuts;
		const dragId = shortcuts.findIndex(s => s.id === incomingId);
		const dropId = shortcuts.findIndex(s => s.id === shortcut.id);

		const { success, database: reordered } = await window.electronAPI.reorder({ category, dragId, dropId });
		if (success) {
			repopulateIcons({ database: reordered, category });
		}
	};
}
