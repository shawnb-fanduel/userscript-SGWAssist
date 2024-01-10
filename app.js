// ==UserScript==
// @name         Highlight dates&times
// @namespace    fanduel.com
// @version      0.3.0
// @description  Highlights table cells in SGW
// @author       Shawn Brooker
// @match        *tvg.com/ITOps/cardSummary/TVGRaceList?TVGCardID=*
// ==/UserScript==

(function() {
	'use strict';

	console.log('Script started');
	const tbody = document.querySelector('#datatable_TVG_Race_List tbody');
	if (!tbody) {
		console.log('Tbody not found');
		return;
	}

	const rows = tbody.querySelectorAll("tr");

	const today = new Date();
	const todayDate = today.toISOString().slice(0, 10);
	// console.log('Today\'s Date:', todayDate);

	rows.forEach(row => {
		const cells = row.querySelectorAll("td:nth-child(8)"); // Adjust the column index as needed
		cells.forEach(cell => {
			const cellText = cell.textContent.trim();
			// console.log('Cell Text:', cellText);
			if (cellText.includes(todayDate)) {
				cell.style.backgroundColor = 'orange';
			}
			const timeString = cellText.split(' ')[1]; // Extracting the time part after the space
			const timeParts = timeString.split(':');
			if (timeParts.length === 3) {
				const hours = parseInt(timeParts[0], 10);
				if (!isNaN(hours) && hours >= 1 && hours < 3) {
					cell.style.backgroundColor = '#cc6600';
				}
			}
		});
	});
})();
