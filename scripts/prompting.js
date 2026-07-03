/* global d3 */

function setupConfirmPrompt({ message, callBack }) {
	d3.select('#confirm-text').text(message);
	const prompt = d3.select('#confirm-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue),
		{ once: true }
	);
}

function setupInputPrompt({ message, label, defaultValue, callBack }) {
	d3.select('#input-text').text(message);
	d3.select('#input-prompt-label').text(label);
	const input = d3.select('#input-prompt-input')
		.property('value', defaultValue || '');
	const prompt = d3.select('#input-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, input.property('value')),
		{ once: true }
	);
}

function setupSelectPrompt({ message, options, callBack }) {
	d3.select('#select-text').text(message);
	const select = d3.select('#select-prompt-select')
		.html('')
		.on('focus', function () { this.size = options.length; })
		.on('blur', function () { this.size = 0; })
		.on('change', function () {
			this.size = 1;
			this.blur();
		});
	options.forEach(option =>
		select.append('option')
			.text(option)
			.attr('value', option));
	const prompt = d3.select('#select-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, select.property('value')),
		{ once: true }
	);
}

function setupCategorySettingsPrompt({ category, message, callBack }) {
	d3.select('#category-settings-text').text(message);
	const input = d3.select('#category-settings-input')
		.property('value', category?.name || '');
	const checkbox = d3.select('#category-settings-checkbox')
		.property('checked', category?.defaultOpen || false);
	const prompt = d3.select('#category-settings-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, {
			name: input.property('value'),
			defaultOpen: checkbox.property('checked'),
		}),
		{ once: true }
	);
}

const iconOptions = Object.values(window.electronAPI.constants().IconStrategy);
function setupIconPrompt({ category, shortcut, callBack }) {
	d3.select('#icon-prompt-text').text(`Update Icon for ${shortcut.name} in ${category}`);

	const previewIcon = d3.select('#icon-prompt-preview')
		.attr('src', shortcut.icon);
	const select = d3.select('#icon-prompt-select')
		.html('')
		.on('focus', function () { this.size = iconOptions.length; })
		.on('blur', function () { this.size = 0; })
		.on('change', async function () {
			const iconStrategy = d3.select(this).property('value');
			this.size = 1;
			this.blur();

			const response = await window.electronAPI.getIcon({ shortcut, iconStrategy });
			previewIcon.attr('src', response.icon);
		});
	iconOptions.forEach(option =>
		select.append('option')
			.text(option)
			.attr('value', option));
	const prompt = d3.select('#icon-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, { iconStrategy: select.property('value') }),
		{ once: true }
	);

}
