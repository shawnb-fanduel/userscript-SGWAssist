// ==UserScript==
// @name         Highlight dates&times
// @namespace    fanduel.com
// @version      0.5.0
// @description  Highlights table cells in SGW
// @author       Shawn Brooker
// @match        http*://sgw.gcp-prod.tvg.com/ITOps/cardSummary/TvgRaceList?TVGCardID=*
// @match        http*://sgw.gcp-dev.tvg.com/ITOps/cardSummary/TvgRaceList?TVGCardID=*
// ==/UserScript==

(function() {
	'use strict';

	const wrongDateColor = "#cca000"
	const wrongTimeColor = "#cc6600"

	console.log('Script started');
	const tbody = document.querySelector('#datatable_TVG_Race_List tbody');
	if (!tbody) {
		console.log('Tbody not found, script exiting');
		return;
	}
	const today = new Date();
	const todayDate = today.toISOString().slice(0, 10);
	const cardDate = document.querySelector('body > div.container-fluid > div:nth-child(1) > div > h6 > a:nth-child(1)').innerText.trim();
	const rows = tbody.querySelectorAll("tr");
	// console.log('Today\'s Date:', todayDate);

	rows.forEach(row => {
		const cells = row.querySelectorAll("td:nth-child(8)"); // Adjust the column index as needed
		cells.forEach(cell => {
			const cellText = cell.textContent.trim();
			// console.log('Cell Text:', cellText);
			if (cellText.includes(todayDate) && !cellText.includes(cardDate)) {
				cell.style.backgroundColor = wrongDateColor;
			}
			const timeString = cellText.split(' ')[1]; // Extracting the time part after the space
			const timeParts = timeString.split(':');
			if (timeParts.length === 3) {
				const hours = parseInt(timeParts[0], 10);
				if (!isNaN(hours) && hours >= 1 && hours < 3) {
					cell.style.backgroundColor = wrongTimeColor;
				}
			}
		});
	});
})();
