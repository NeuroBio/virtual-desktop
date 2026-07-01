/* global d3 */
/* global addFileShortcut */
/* global addFolderShortcut */
/* global launchShortcut */
/* global removeShortcut */
/* global renameShortcut */
/* global moveShortcut */
/* global setupDragAndDrop */
/* global toggleAccordion */


// BE WARY OF THIS VARIABLE
let categoryNames = [];
d3.select('body').on('click contextmenu', () => {
	d3.select('#context-menu').style('display', 'none');
});

function populateCategories(database) {
	console.log(database);

	categoryNames = Object.keys(database);
	categoryNames.forEach((category) =>
		populateCategory({ database, category }));
}

function populateCategory({ database, category }) {
	const isOpen = category.defaultOpen;
	const main = d3.select('#categories')
		.append('section')
		.attr('id', toAccordionHeaderId(category))
		.classed('accordion', true)
		.classed('is-open', isOpen)
		.classed('is-closed', !isOpen);
	const header = main.append('h2')
		.attr('class', 'accordion-header');

	const headerText = header.append('div');
	headerText.append('button')
		.attr('class', 'accordion-icon')
		.attr('id', toAccordionButtonId(category))
		.on('click', () => toggleAccordion({ isOpen, category }));
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

function toAccordionHeaderId(category) {
	return `${category.split(' ').join('_')}-accordion`;
}

function toAccordionButtonId(category) {
	return `${category.split(' ').join('_')}-button`;
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

				d3.select('#context-menu-name').text(shortcut.name);
				d3.select('#remove-shortcut')
					.on('click', () => removeShortcut({ event, category, shortcut }));
				d3.select('#rename-shortcut')
					.on('click', () => renameShortcut({ event, category, shortcut }));
				d3.select('#move-shortcut')
					.on('click', () => moveShortcut({ event, oldCategory: category, shortcut }));
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
			.text(shortcut.alias);
	});
}

function repopulateIcons({ database, category }) {
	d3.select(`#${toCategoryId(category)}`).html(''); // should be #categories
	populateIcons(database, category);
}
