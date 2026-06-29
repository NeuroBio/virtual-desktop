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
		if (incomingId === shortcut.id) return;

		const shortcuts = database[category].shortcuts;
		const dragIdx = shortcuts.findIndex(s => s.id === incomingId);
		const dropIdx = shortcuts.findIndex(s => s.id === shortcut.id);

		const [movedItem] = shortcuts.splice(dragIdx, 1);
		shortcuts.splice(dropIdx, 0, movedItem);

		const { success } = await window.electronAPI.reorder({ category, shortcuts });
		if (success) {
			repopulateIcons(database);
		}
	};
}


