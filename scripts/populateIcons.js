/* global d3 */

d3.select('body').on('click contextmenu', () => {
	d3.select('#context-menu').style('display', 'none');
});

function populateIcons(database) {
	console.log(database);
	const categoryElement = d3.select('#writing-shortcuts');
	const category = 'Writing';
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


function repopulateIcons(database) {
	d3.select('#writing-shortcuts').html(''); // should be #categories
	populateIcons(database);
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
					repopulateIcons(database);
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
		callBack: async (response, name) => {
			if (response === 'submit') {
				const { success, database } = await window.electronAPI.renameShortcut({
					category,
					shortcutId: shortcut.id,
					name,
				});

				if (success) {
					repopulateIcons(database);
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
			repopulateIcons(reordered);
		}
	};
}

function setupConfirmPrompt({ message, callBack }) {
	d3.select('#confirm-text').text(message);
	const prompt = d3.select('#confirm-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close', () => callBack(prompt.returnValue));
}

function setupInputPrompt({ message, label, callBack }) {
	d3.select('#input-text').text(message);
	const input = d3.select('#input-prompt-input').text(label);
	const prompt = d3.select('#input-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close', () => callBack(prompt.returnValue, input.property('value')));
}


