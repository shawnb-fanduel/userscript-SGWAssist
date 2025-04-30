// ==UserScript==
// @name         SGW Assist
// @namespace    fanduel.com
// @version      0.4.0
// @description  Highlights possible concerns in SGW
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
	if (location.href.toLowerCase().includes('tvgcardlist')) {
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
		try {
			fn_highlightSpecialCardsConfigMissing();
		} catch (error) {
			console.error('Error running fn_highlightSpecialCardsConfigMissing:', error);
		}
	}
	if (location.href.toLowerCase().includes('reportdifferentrunners')) {
		try {
			fn_highlightRunnerDiff();
		} catch (error) {
			console.error('Error running highlightRunnerDiff:', error);
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

	function fn_highlightRunnerDiff() {
		// Get the table headers to find the relevant columns
		const headers = document.querySelectorAll('#datatable_Report_Different_Runners th');
		let tvgHorsesColIndex = -1;
		let utRunnersColIndex = -1;

		// Find column indices by looking at aria-label attributes
		for (let i = 0; i < headers.length; i++) {
			const ariaLabel = headers[i].getAttribute('aria-label');
			if (ariaLabel && ariaLabel.includes('Number Of TVG Horses')) {
				tvgHorsesColIndex = i + 1; // nth-child is 1-based
			} else if (ariaLabel && ariaLabel.includes('Number Of UT Runners')) {
				utRunnersColIndex = i + 1;
			}
		}

		// Check if both columns were found
		if (tvgHorsesColIndex == -1 || utRunnersColIndex == -1) {
			console.log('Column(s) not found:', 'TVG Horses:', tvgHorsesColIndex, 'UT Runners:', utRunnersColIndex);
			return;
		}

		// Get the tbody from the table
		const tbody = document.querySelector('#datatable_Report_Different_Runners tbody');
		if (!tbody) {
			console.log('Tbody not found');
			return;
		}

		// Loop through each row in the table body
		const rows = tbody.querySelectorAll('tr');
		let warningRows = 0;
		let errorRows = 0;

		for (let j = 0; j < rows.length; j++) {
			const row = rows[j];

			// Get the cells for both columns
			const tvgHorsesCell = row.children[tvgHorsesColIndex - 1]; // Convert to 0-based for children
			const utRunnersCell = row.children[utRunnersColIndex - 1];

			if (tvgHorsesCell && utRunnersCell) {
				// Get text content of UT Runners cell
				const utRunnersText = utRunnersCell.textContent.trim();
				// Check if UT Runners is blank
				const isUtRunnersBlank = utRunnersText == '';

				// Get the numeric values from the cells
				const tvgHorsesCount = parseInt(tvgHorsesCell.textContent.trim(), 10) || 0;
				const utRunnersCount = isUtRunnersBlank ? 0 : parseInt(utRunnersText, 10) || 0;

				// Calculate absolute difference
				const diff = Math.abs(tvgHorsesCount - utRunnersCount);

				// Apply different highlight colors based on difference magnitude and blank status
				if (diff == 1 || isUtRunnersBlank) {
					// Yellow for difference of exactly 1 or blank UT Runners
					tvgHorsesCell.style.backgroundColor = colorLevels.warning;
					utRunnersCell.style.backgroundColor = colorLevels.warning;
					warningRows++;
				} else if (diff >= 2) {
					// Red for difference of 2 or more (but not blank)
					tvgHorsesCell.style.backgroundColor = colorLevels.error;
					utRunnersCell.style.backgroundColor = colorLevels.error;
					errorRows++;
				}
			}
		}
		console.log(`Runner difference check completed. Found ${warningRows} rows with difference of 1 or blank UT Runners, and ${errorRows} rows with difference >= 2.`);
	}

	function fn_highlightSpecialCardsConfigMissing() {
		const table = document.querySelector('#datatable_TVG_Race_List'); // Target the correct table
		if (!table) return; // Exit if the table is not found

		const headers = table.querySelectorAll('th'); // Find all table header cells
		let configColumnIndex = -1; // Initialize the column index to -1

		// Loop through each header to find the "Special Cards Config" column
		headers.forEach((header, index) => {
			const headerText = header.textContent.trim().toLowerCase();
			if (headerText.includes("special cards config")) {
				configColumnIndex = index; // Store the index if found
			}
		});

		if (configColumnIndex === -1) return; // Exit if the column is not found

		const rows = table.querySelectorAll('tbody tr'); // Get all table rows

		// Loop through each row to check the cell in the config column
		rows.forEach(row => {
			const cells = row.querySelectorAll('td'); // Get all cells in the row

			if (cells.length > configColumnIndex) {
				const cell = cells[configColumnIndex];
				const link = cell.querySelector('a'); // Check for any anchor tag inside the cell
				const linkText = link ? link.textContent.trim().toLowerCase() : "";

				// If the link text includes "add new config", highlight the cell
				if (linkText.includes('add new config')) {
					cell.style.backgroundColor = colorLevels.warning; // Apply the warning color
				}
			}
		});
	}
})();
