async function addFileShortcut() {
	const category = "Writing";

	const response = await window.electronAPI.addFileShortcut({ category });

	if (response.success) {
		console.log("Shortcut successfully saved!", response.updatedData);
	}
}

async function addFolderShortcut() {
	const category = "Writing";

	const response = await window.electronAPI.addFolderShortcut({ category });

	if (response.success) {
		console.log("Shortcut successfully saved!", response.updatedData);
	}
}