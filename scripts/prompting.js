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