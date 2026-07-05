/* global d3 */
/* global categoryNames */
/* global appSettings */
/* global addExtension */
/* global openGithub */
/* global openShortcutsData */
/* global openConfigData */
/* global openAppData */

function setupConfirmPrompt({ message, callBack }) {
	d3.select('#confirm-text').text(message);
	const prompt = d3.select('#confirm-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue),
		{ once: true }
	);
}

function setupShortcutNamePrompt({ message, shortcut, callBack }) {
	d3.select('#rename-text').text(message);
	d3.select('#rename-original').text(`Original Name: ${shortcut.name}${addExtension(shortcut)}`);
	d3.select('#shortcut-rename-extension').text(addExtension(shortcut));
	const input = d3.select('#rename-prompt-input')
		.property('value', shortcut.alias);
	const prompt = d3.select('#shortcut-rename-prompt').node();
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
	const position = d3.select('#category-settings-position')
		.property('value', category?.position + 1 || categoryNames.length);
	d3.select('#position-field').classed('hide-position', !category);
	const prompt = d3.select('#category-settings-prompt').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, {
			name: input.property('value'),
			defaultOpen: checkbox.property('checked'),
			position: +position.property('value') - 1,
		}),
		{ once: true }
	);
}

function setupAppSettingsPrompt({ callBack }) {
	const width = d3.select('#settings-width').property('value', appSettings.width);
	const height = d3.select('#settings-height').property('value', appSettings.height);
	const x = d3.select('#settings-x').property('value', appSettings.x);
	const y = d3.select('#settings-y').property('value', appSettings.y);
	const showExtensions = d3.select('#app-settings-checkbox')
		.property('checked', appSettings.showExtensions);
	const iconNameLines = d3.select('#icon-name-lines-y').property('value', appSettings.iconNameLines);

	const prompt = d3.select('#app-settings-dialog').node();
	prompt.showModal();
	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, {
			width: width.property('value'),
			height: height.property('value'),
			x: x.property('value'),
			y: y.property('value'),
			showExtensions: showExtensions.property('checked'),
			iconNameLines: iconNameLines.property('value'),
		}),
		{ once: true }
	);
}

function setupAppInfoPrompt() {
	d3.select('#info-github').on('click', () => openGithub());
	d3.select('#info-see-shortcuts').on('click', () => openShortcutsData());
	d3.select('#info-see-config').on('click', () => openConfigData());
	d3.select('#info-see-app').on('click', () => openAppData());
	const prompt = d3.select('#app-info-dialog').node();
	prompt.showModal();
}


const IconStrategy = window.electronAPI.constants().IconStrategy;
const iconOptions = Object.values(IconStrategy);
function setupIconPrompt({ category, shortcut, callBack }) {
	let iconPath = shortcut.iconPath;
	const customIconInput = d3.select('#icon-prompt-custom-input');
	const previewIcon = d3.select('#icon-prompt-preview');

	d3.select('#icon-prompt-text').text(`Update Icon for ${shortcut.alias}${addExtension(shortcut)} in ${category}`);

	previewIcon.attr('src', shortcut.icon);
	const select = d3.select('#icon-prompt-select')
		.html('')
		.on('focus', function () { this.size = iconOptions.length; })
		.on('blur', function () { this.size = 0; })
		.on('change', async function () {
			const iconStrategy = d3.select(this).property('value');
			this.size = 1;
			this.blur();
			showOrHideCustom({ iconStrategy, customIconInput });

			await updateIcon({ shortcut, iconPath, iconStrategy, previewIcon });
		});
	customIconInput.on('change', async () => {
		const event = d3.event;
		iconPath = await fileToBase64(event);
		updateIcon({
			shortcut: {},
			iconPath,
			iconStrategy: IconStrategy.CUSTOM,
			previewIcon,
		});
	});
	iconOptions.forEach(option =>
		select.append('option')
			.text(option)
			.attr('value', option));
	select.property('value', shortcut.iconStrategy);
	showOrHideCustom({ iconStrategy: shortcut.iconStrategy, customIconInput });
	const prompt = d3.select('#icon-prompt').node();

	prompt.showModal();
	document.getElementById('icon-prompt-uploader').value = '';

	prompt.addEventListener('close',
		() => callBack(prompt.returnValue, {
			iconStrategy: select.property('value'),
			iconPath,
		}),
		{ once: true }
	);
}

function fileToBase64(event) {
	const file = event.target.files[0];
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = e => resolve(e.target.result);
		reader.readAsDataURL(file);
	});
}

function showOrHideCustom({ iconStrategy, customIconInput }) {
	customIconInput.classed('show-custom', iconStrategy === IconStrategy.CUSTOM);
}

async function updateIcon({ shortcut, iconPath, iconStrategy, previewIcon }) {
	const relay = { ...shortcut, iconPath };
	const { icon } = await window.electronAPI.getIcon({ shortcut: relay, iconStrategy });
	previewIcon.attr('src', icon);
}
