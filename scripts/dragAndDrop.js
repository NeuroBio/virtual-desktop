/* global repopulateIcons */

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
