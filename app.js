// ==UserScript==
// @name         SGW Assist
// @namespace    fanduel.com
// @version      0.2.0
// @description  Highlights problems in SGW
// @author       Shawn Brooker
// @match        http*://*sgw.gcp-prod.tvg.com/*
// @match        http*://*sgw.gcp-dev.tvg.com/*
// ==/UserScript==

(function() {
	'use strict';

	// Settings
	const colorLevels = {
		info: "#00aaff",
		warning: "#cca000",
		caution: "#cc6600",
		error: "#fe5f55",
		success: "#00cc66",
	};
	const validTrackCodes = {
		'GPX': ['GPM', 'GPT'],
		'LRX': ['LRM']
	};

	// Calls to functions wrapped in try-catch
	if (location.href.toLowerCase().includes('carddate')) {
		try {
			fn_HighlightSpecialCharactersInTrackName();
		} catch (error) {
			console.error('Error running fn_HighlightSpecialCharactersInTrackName:', error);
		}
		try {
			fn_ValidateTrackCodes();
		} catch (error) {
			console.error('Error running fn_ValidateTrackCodes:', error);
		}
	}
	if (location.href.toLowerCase().includes('tvgcardid')) {
		try {
			fn_HighlightDates();
		} catch (error) {
			console.error('Error running fn_HighlightDates:', error);
		}
        try {
            fn_ShortenCells();
        } catch (error) {
			console.error('Error running fn_ShortenCells:', error);
		}
	}
	// ALL FUNCTIONS
	function fn_HighlightDates() {
		try {
			// Move everything into the try block to catch all potential errors
			console.log('Highlight dates & times started');

			const tbody = document.querySelector('#datatable_TVG_Race_List tbody');
			if (!tbody) {
				console.log('Tbody not found');
				return;
			}

			const cardDate = document.querySelector('body > div.container-fluid > div:nth-child(1) > div > h6 > a:nth-child(1)').innerText.trim();
			const rows = tbody.querySelectorAll("tr");
			const today = new Date();
			const todayDate = today.toISOString().slice(0, 10);

			rows.forEach(row => {
				const cells = row.querySelectorAll("td:nth-child(8)"); // Adjust the column index as needed
				cells.forEach(cell => {
					const cellText = cell.textContent.trim();

					if (cellText.includes(todayDate) && !cellText.includes(cardDate)) {
						cell.style.backgroundColor = colorLevels.warning;
					}

					const timeString = cellText.split(' ')[1]; // Extracting the time part after the space
					const timeParts = timeString.split(':');

					if (timeParts.length === 3) {
						const hours = parseInt(timeParts[0], 10);
						if (!isNaN(hours) && hours >= 2 && hours < 4) {
							cell.style.backgroundColor = colorLevels.caution;
						}
					}
				});
			});

		} catch (error) {
			console.error('Error in fn_HighlightDates:', error);
		}
	}

	// Function Definitions
	function fn_HighlightSpecialCharactersInTrackName() {
		// Define a list of special characters to look for
		const specialCharsRegex = /[\\\/<>&%]/g;

		// Get the table headers to find the "TVG Card TVG Track Name" column
		const headers = document.querySelectorAll('#datatable_TVG_Card_List th');
		let trackNameColIndex = -1;

		headers.forEach((header, index) => {
			if (header.textContent.trim() === 'TVG Card TVG Track Name') {
				trackNameColIndex = index + 1; // Since nth-child is 1-based
			}
		});

		if (trackNameColIndex === -1) {
			console.log('Track Name column not found');
			return;
		}

		// Get the tbody from the table with id="datatable_TVG_Card_List"
		const tbody = document.querySelector('#datatable_TVG_Card_List tbody');
		if (!tbody) {
			console.log('Tbody not found');
			return;
		}

		// Loop through each row in the table body
		const rows = tbody.querySelectorAll("tr");
		rows.forEach(row => {
			// Locate the specific cell(s) where track names are stored based on the dynamic index
			const trackNameCell = row.querySelector(`td:nth-child(${trackNameColIndex})`);
			if (trackNameCell) {
				const cellText = trackNameCell.textContent.trim();
				// Check if the cell contains any special characters
				if (specialCharsRegex.test(cellText)) {
					// Highlight the cell by changing its background color
					trackNameCell.style.backgroundColor = colorLevels.warning;
				}
			}
		});
	}

	function fn_ValidateTrackCodes() {

		// Find the index for the TVG Track Code column
		const headers = document.querySelectorAll('#datatable_TVG_Card_List th');
		let tvgTrackCodeColIndex = -1;
		let itspTrackCodeColIndex = -1;

		headers.forEach((header, index) => {
			const headerText = header.textContent.trim();
			if (headerText === 'TVG Track Code') {
				tvgTrackCodeColIndex = index + 1; // Adjust for nth-child being 1-based
			} else if (headerText === 'ITSP Track Code') {
				itspTrackCodeColIndex = index + 1; // Adjust for nth-child being 1-based
			}
		});

		if (tvgTrackCodeColIndex === -1 || itspTrackCodeColIndex === -1) {
			console.log('TVG or ITSP Track Code column not found');
			return;
		}

		// Get the tbody from the table with id="datatable_TVG_Card_List"
		const tbody = document.querySelector('#datatable_TVG_Card_List tbody');
		if (!tbody) {
			console.log('Tbody not found');
			return;
		}

		// Loop through each row in the table body
		const rows = tbody.querySelectorAll("tr");
		rows.forEach(row => {
			// Get the TVG Track Code cell based on the column index
			const tvgTrackCodeCell = row.querySelector(`td:nth-child(${tvgTrackCodeColIndex})`);
			const itspTrackCodeCell = row.querySelector(`td:nth-child(${itspTrackCodeColIndex})`);

			if (tvgTrackCodeCell && itspTrackCodeCell) {
				const tvgTrackCode = tvgTrackCodeCell.textContent.trim();
				const itspTrackCode = itspTrackCodeCell.textContent.trim();

				// Check if the TVG Track Code exists in the configuration object
				if (validTrackCodes[tvgTrackCode]) {
					// Validate if ITSP Track Code is in the allowed list for this TVG Track Code
					if (!validTrackCodes[tvgTrackCode].includes(itspTrackCode)) {
						// Highlight the invalid ITSP Track Code cell
						itspTrackCodeCell.style.backgroundColor = colorLevels.error;
					}
				}
			}
		});
	}

    function fn_ShortenCells() {
        const table = document.querySelector('#datatable_TVG_Race_List'); // Target the correct table
        if (!table) return; // Exit if the table is not found

        const headers = table.querySelectorAll('th'); // Find all table header cells
        const columnsToCheck = ['TVG Race Conditions', 'Analyst Verdict']; // Array of column names to check
        let columnIndices = {}; // Object to store column indices

        // Find the index for each column name in the array
        headers.forEach((header, index) => {
            const columnName = header.textContent.trim();
            if (columnsToCheck.includes(columnName)) {
                columnIndices[columnName] = index;
            }
        });

        if (Object.keys(columnIndices).length === 0) return; // Exit if none of the columns are found

        const rows = table.getElementsByTagName("tr");

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName("td");

            // Loop through each column that needs to be checked
            for (const columnName of columnsToCheck) {
                const columnIndex = columnIndices[columnName];

                if (cells.length > columnIndex) {
                    let cellText = cells[columnIndex].innerText;

                    // If the cell text is longer than 30 characters, truncate and append "[...]"
                    if (cellText.length > 30) {
                        cellText = cellText.slice(0, 30) + "[...]";
                        // Update the cell text
                        cells[columnIndex].innerText = cellText;
                    }
                }
            }
        }
    }
})();
