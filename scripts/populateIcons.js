/* global d3 */
/* global addFileShortcut */
/* global addFolderShortcut */

d3.select('body').on('click contextmenu', () => {
	d3.select('#context-menu').style('display', 'none');
});

function populateCategories(database) {
	console.log(database);

	Object.keys(database).forEach((category) => {
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
	});
}

function toCategoryId(category) {
	return `${category.split(' ').join('_')}-shortcuts`;
}

function populateIcons(database, category) {
	const categoryElement = d3.select(`#${toCategoryId(category)}`);
	database[category].shortcuts.forEach((shortcut) => {
		const entry = categoryElement.append('div')
			.on('dblclick', () => launch(shortcut.path))
			.on('contextmenu', () => {
				const event = d3.event;
				event.preventDefault();
				event.stopPropagation();
				d3.select('#context-menu')
					.style('left', `${event.pageX}px`)
					.style('top', `${event.pageY}px`)
					.style('display', 'block');

				d3.select('#remove-shortcut')
					.on('click', () => remove({ event, category, shortcut }));
				d3.select('#rename-shortcut')
					.on('click', () => rename({ event, category, shortcut }));
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

function dismissContextMenu() {
	d3.select('#context-menu').style('display', 'none');
}


function repopulateIcons({ database, category }) {
	d3.select(`#${toCategoryId(category)}`).html(''); // should be #categories
	populateIcons(database, category);
}

async function launch(path) {
	const result = await window.electronAPI.launch(path);
	if (!result.success) {
		console.error(`Could not launch asset: ${result.error}`);
	}
}

async function remove({ event, category, shortcut }) {
	setupConfirmPrompt({
		message: `Remove ${shortcut.name} from ${category}?`,
		callBack: async (response) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.deleteShortcut({
					category,
					shortcutId: shortcut.id,
				});

				if (success) {
					repopulateIcons({ database, category });
				}
			}
		}
	});
	dismissContextMenu();
}

async function rename({ event, category, shortcut }) {
	setupInputPrompt({
		message: `Rename ${shortcut.name} from ${category}:`,
		label: 'Name',
		defaultValue: shortcut.name,
		callBack: async (response, name) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.renameShortcut({
					category,
					shortcutId: shortcut.id,
					name,
				});

				if (success) {
					repopulateIcons({ database, category });
				}
			}
		}
	});

	dismissContextMenu();
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

function setupConfirmPrompt({ message, callBack }) {
	d3.select('#confirm-text').text(message);
	const prompt = d3.select('#confirm-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close', () => callBack(prompt.returnValue));
}

function setupInputPrompt({ message, label, defaultValue, callBack }) {
	d3.select('#input-text').text(message);
	d3.select('#input-prompt-label').text(label);
	const input = d3.select('#input-prompt-input')
		.attr('value', defaultValue || '');
	const prompt = d3.select('#input-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close', () => callBack(prompt.returnValue, input.property('value')));
}


