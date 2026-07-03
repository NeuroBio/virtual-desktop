/* global d3 */
/* global toAccordionHeaderId */
/* global toAccordionButtonId */
/* global toAccordionTrayId */
/* global toMoreActionsId */
/* global toCategoryId */

function toggleAccordion({ isOpen, category }) {
	d3.select(`#${toAccordionHeaderId(category)}`)
		.classed('is-open', !isOpen)
		.classed('is-closed', isOpen);

	d3.select(`#${toAccordionButtonId(category)}`)
		.on('click', () => toggleAccordion({ isOpen: !isOpen, category }));
}

function toggleAccordionTray({ isOpen, category }) {
	d3.select(`#${toAccordionTrayId(category)}`)
		.classed('is-open', !isOpen)
		.classed('is-closed', isOpen);

	d3.select(`#${toMoreActionsId(category)}`)
		.on('click', () => toggleAccordionTray({ isOpen: !isOpen, category }));

	d3.select(`#${toCategoryId(category)}`)
		.classed('leave-menu-space', !isOpen);

}