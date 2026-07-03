/* global d3 */
/* global addFileShortcut */
/* global addFolderShortcut */

/* global launchShortcut */

/* global removeShortcut */
/* global renameShortcut */
/* global moveShortcut */
/* global modifyIcon */

/* global setupDragAndDrop */

/* global toggleAccordion */
/* global toggleAccordionTray */
/* global updateCategorySettings */
/* global deleteCategory */

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
	categoryNames.forEach((category) => createCategory({ category, database }));

}

function clearView() {
	d3.select('#categories').html('');
}

function createCategory({ category, database }) {
	const container = d3.select('#categories');
	const main = container
		.append('section')
		.attr('id', toAccordionHeaderId(category));
	populateCategory({ main, database, category });
}

function populateCategory({ main, database, category }) {
	const categoryData = database[category];
	const isOpen = categoryData.defaultOpen;

	main.classed('accordion', true)
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
	tray.append('li')
		.text('Delete')
		.on('click', () => deleteCategory(categoryData));

	main.append('div')
		.attr('class', 'accordion-body')
		.append('div')
		.attr('class', 'shortcut-container')
		.attr('id', `${toCategoryId(category)}`);

	populateIcons(database, category);
}

function repopulateCategory({ database, category }) {
	const main = d3.select(`#${toAccordionHeaderId(category)}`).html('');
	populateCategory({ main, database, category });
}

function removeCategory(category) {
	d3.select(`#${toAccordionHeaderId(category.name)}`).remove();
}

function sanitize(category) {
	return category
		.split(' ')
		.join('_')
		.replace('.', '');
}

function toCategoryId(category) {
	return `${sanitize(category)}-shortcuts`;
}

function toAccordionHeaderId(category) {
	return `${sanitize(category)}-accordion`;
}

function toAccordionTrayId(category) {
	return `${sanitize(category)}-accordion-tray`;
}

function toMoreActionsId(category) {
	return `${sanitize(category)}-more-actions`;
}

function toAccordionButtonId(category) {
	return `${sanitize(category)}-button`;
}

function toShortcutId(shortcutId) {
	return `shortcut-${shortcutId}`;
}

function toShortcutIconId(shortcutId) {
	return `shortcut-${shortcutId}-icon`;
}

function toShortcutNameId(shortcutId) {
	return `shortcut-${shortcutId}-name`;
}

function populateIcons(database, category) {
	const categoryElement = d3.select(`#${toCategoryId(category)}`);
	database[category].shortcuts.forEach((shortcut) => {
		const entry = categoryElement.append('div')
			.attr('id', toShortcutId(shortcut.id));
		populateIcon(entry, shortcut, category, database);
	});
}

function repopulateIcon({ shortcut, category, database }) {
	const entry = d3.select(`#${toShortcutId(shortcut.id)}`).html('');
	populateIcon(entry, shortcut, category, database);
}

function populateIcon(entry, shortcut, category, database) {
	entry
		.on('dblclick', () => launchShortcut(shortcut.path))
		.on('contextmenu', () => {
			const event = d3.event;
			event.preventDefault();
			event.stopPropagation();
			const menu = d3.select('#context-menu');
			const { leftPos, topPos } = calculateContextPosition({ menu, event });

			menu.style('left', `${leftPos}px`)
				.style('top', `${topPos}px`)
				.style('display', 'flex');

			d3.select('#context-menu-name').text(shortcut.name);
			d3.select('#remove-shortcut')
				.on('click', () => removeShortcut({ event, category, shortcut }));
			d3.select('#modify-icon')
				.on('click', () => modifyIcon({ event, category, shortcut }));
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
		.attr('id', toShortcutIconId(shortcut.id))
		.attr('src', shortcut.icon);

	entry.append('span')
		.attr('class', 'icon-name')
		.attr('id', toShortcutNameId(shortcut.id))
		.text(shortcut.alias);
}

function calculateContextPosition({ menu, event }) {
	const menuNode = menu.node();
	const menuWidth = menuNode.offsetWidth;
	const menuHeight = menuNode.offsetHeight;

	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;

	let leftPos = event.pageX;
	if (event.clientX + menuWidth > windowWidth) {
		leftPos = event.pageX - menuWidth;
	}

	let topPos = event.pageY;
	if (event.clientY + menuHeight > windowHeight) {
		topPos = event.pageY - menuHeight;
	}

	return { leftPos, topPos };
}

function repopulateIcons({ database, category }) {
	d3.select(`#${toCategoryId(category)}`).html(''); // should be #categories
	populateIcons(database, category);
}
