/* global d3 */
/* global addFileShortcut */
/* global addFolderShortcut */
/* global launchShortcut */
/* global removeShortcut */
/* global renameShortcut */
/* global moveShortcut */
/* global setupDragAndDrop */
/* global toggleAccordion */
/* global toggleAccordionTray */
/* global updateCategorySettings */

const ellipsesSVG = `
  <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; pointer-events: none;">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
`;

// BE WARY OF CHANGING THIS VARIABLE
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

function clearView() {
	d3.select('#categories').html('');
}

function populateCategory({ database, category }) {
	const categoryData = database[category];
	const isOpen = categoryData.defaultOpen;

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
		.html(ellipsesSVG)
		.attr('id', toMoreActionsId(category))
		.attr('class', 'more-actions')
		.on('click', () => toggleAccordionTray({ isOpen: false, category }));

	const tray = main.append('ul')
		.attr('id', toAccordionTrayId(category))
		.attr('class', 'accordion-tray is-closed');
	tray.append('li')
		.text('+ File')
		.on('click', () => addFileShortcut(category));
	tray.append('li')
		.text('+ Folder')
		.on('click', () => addFolderShortcut(category));
	tray.append('li')
		.text('Settings')
		.on('click', () => updateCategorySettings(categoryData));

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

function toAccordionTrayId(category) {
	return `${category.split(' ').join('_')}-accordion-tray`;
}

function toMoreActionsId(category) {
	return `${category.split(' ').join('_')}-more-actions`;
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
					.style('display', 'flex');

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
