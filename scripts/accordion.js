/* global d3 */
/* global toAccordionHeaderId */
/* global toAccordionButtonId */

function toggleAccordion({ isOpen, category }) {
	console.log({ isOpen, category });
	d3.select(`#${toAccordionHeaderId(category)}`)
		.classed('is-open', !isOpen)
		.classed('is-closed', isOpen);

	d3.select(`#${toAccordionButtonId(category)}`)
		.on('click', () => toggleAccordion({ isOpen: !isOpen, category }));
}