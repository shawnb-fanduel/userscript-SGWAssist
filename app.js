// ==UserScript==
// @name         SGW Assist
// @namespace    fanduel.com
// @version      0.7.0
// @description  Highlights possible concerns in SGW
// @author       Shawn Brooker
// @match        http*://*racing-sgw.prd.use2.racing.fndlint.net/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
	'use strict';

	// Settings
	const colorLevels = {
		info: "#00aaff",
		warning: "#cca000",
		caution: "#cc6600",
		error: "#fe5f55",
		success: "#008844",
	};
	const validTrackCodes = {
		'GPX': ['GPM', 'GPT'],
		'LRX': ['LRM'],
		'PRX': ['PIM']
	};
	const trackAssoc = {
		'ArenaRC': ['GB - Ascot', 'GB - Bangor-on-Dee', 'GB - Bath', 'GB - Brighton', 'GB - Chepstow', 'GB - Chester', '	GB - Doncaster',
			'GB - FFos Las', 'GB - Fontwell Park', 'GB - Hereford', 'GB - Hexham', 'GB - Lingfield', 'GB - Newbury', 'GB - Newcastle',
			'GB - Newton Abbot', 'GB - Plumpton', 'GB - Ripon', 'GB - Sedgefield', 'GB - Southwell', 'GB - Uttoxeter', 'GB - Windsor',
			'GB - Wolverhampton', 'GB - Worcester', 'GB - Yarmouth']
	}

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
		try {
			initTrackSettingsManager()
			fn_matchTrackRowsToSettings(window.customTrackSettings || []);
		} catch (error) {
			console.error('Error running fn_matchTrackRowsToSettings:', error);
		}
		try {
			fn_saveTrackData();
		} catch (error) {
			console.error('Error running fn_saveTrackData:', error);
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
	if (location.href.toLowerCase().includes('racebettype')) {
		// used to highlight PlacePickAll
	}
	if (location.href.toLowerCase().includes('reportdifferentrunners')) {
		try {
			fn_highlightRunnerDiff();
		} catch (error) {
			console.error('Error running highlightRunnerDiff:', error);
		}
		try {
			fn_addTrackNameColumn();
			fn_addCutOffTextButton();
		} catch (error) {
			console.error('Error running fn_addTrackNameColumn:', error);
		}

	}

	// ALL FUNCTIONS
	function fn_HighlightDates() {
		try {
			console.log('Highlight dates & times started');
			const table = document.querySelector('#datatable_TVG_Race_List');
			if (!table) {
				console.log('Table not found');
				return;
			}
			const headers = table.querySelectorAll('thead th');
			let postTimeColIndex = -1;
			headers.forEach((header, index) => {
				const normalized = header.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
				if (normalized === 'tvg race post time') {
					postTimeColIndex = index + 1; // nth-child is 1-based
				}
			});
			if (postTimeColIndex === -1) {
				console.warn('Could not find "TVG Race Post Time" column.');
				return;
			}
			const tbody = table.querySelector('tbody');
			if (!tbody) {
				console.log('Tbody not found');
				return;
			}
			const cardDate = document.querySelector(
				'body > div.container-fluid > div:nth-child(1) > div > h6 > a:nth-child(1)'
			)?.innerText.trim();
			const rows = Array.from(tbody.querySelectorAll("tr"));
			let prevTime = null;
			rows.forEach((row) => {
				const cell = row.querySelector(`td:nth-child(${postTimeColIndex})`);
				if (!cell) return;

				const cellText = cell.textContent.trim();
				if (!cellText) return;

				const todayDate = new Date().toISOString().slice(0, 10);
				if (cellText.includes(todayDate) && !cellText.includes(cardDate)) {
					cell.style.backgroundColor = colorLevels.warning;
				}

				const dateObj = new Date(cellText);
				if (isNaN(dateObj)) return;

				const hours = dateObj.getHours();
				const minutes = dateObj.getMinutes();
				const seconds = dateObj.getSeconds();
				const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

				if (hours >= 2 && hours < 4) {
					cell.style.backgroundColor = colorLevels.caution;
				}

				if (prevTime !== null && dateObj < prevTime) {
					cell.style.backgroundColor = colorLevels.info;
				}
				prevTime = dateObj;
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
		const table = document.querySelector('#datatable_TVG_Race_List');
		if (!table) return;

		const headers = table.querySelectorAll('thead th');
		let configColIndex = -1;
		let conditionsColIndex = -1;

		headers.forEach((header, index) => {
			const text = header.textContent.trim().toLowerCase();
			if (text.includes("special cards config")) configColIndex = index;
			if (text.includes("tvg race conditions")) conditionsColIndex = index;
		});

		if (configColIndex === -1 || conditionsColIndex === -1) return;

		// Insert new header after the config column
		const headerRow = table.querySelector('thead tr');
		const newHeader = document.createElement('th');
		newHeader.textContent = "Race Ref";
		headerRow.insertBefore(newHeader, headerRow.children[configColIndex + 1]);

		const rows = table.querySelectorAll('tbody tr');

		rows.forEach(row => {
			const cells = row.querySelectorAll('td');

			// --- Highlight "Add New Config" Cells ---
			if (cells.length > configColIndex) {
				const configCell = cells[configColIndex];
				const link = configCell.querySelector('a');
				const linkText = link ? link.textContent.trim().toLowerCase() : "";
				if (linkText.includes('add new config')) {
					configCell.style.backgroundColor = colorLevels.warning;
				}
			}

			// --- Extract "IND R4" or similar from TVG Race Conditions ---
			let raceRefText = "";
			if (cells.length > conditionsColIndex) {
				const conditionText = cells[conditionsColIndex].textContent.trim();
				const match = conditionText.match(/\b([A-Z]{2,4})\s*[-–]\s*(?:RACE\s*)?R\s*([0-9]{1,2})\b/i);
				if (match) {
					raceRefText = `${match[1]} R${match[2]}`;
				}
			}

			// --- Insert Race Ref Cell after config column ---
			const newCell = document.createElement('td');
			newCell.textContent = raceRefText;
			row.insertBefore(newCell, cells[configColIndex + 1]);
		});
	}

	function fn_matchTrackRowsToSettings(trackSettings) {
		const table = document.querySelector("#datatable_TVG_Card_List");
		if (!table) return;

		const headers = table.querySelectorAll("thead th");
		const colIndex = {};

		headers.forEach((th, i) => {
			const label = th.getAttribute("aria-label") || "";
			if (label.includes("TVG Track Code")) colIndex.tvg = i;
			else if (label.includes("ITSP Track Code")) colIndex.itsp = i;
			else if (label.includes("Track File Code")) colIndex.file = i;
			else if (label.includes("Advance Code")) colIndex.adv = i;
			else if (label.includes("TVG Stream Track Code")) colIndex.stream = i;
			else if (label.includes("Replay Track Code")) colIndex.replay = i;
		});

		const rows = table.querySelectorAll("tbody tr");
		const seenTVGCodes = new Set();

		rows.forEach((row, rowIndex) => {
			const tds = row.querySelectorAll("td");
			if (tds.length === 0) return;

			const tvgCell = tds[colIndex.tvg];
			const itspCell = tds[colIndex.itsp];
			const fileCell = tds[colIndex.file];
			const advCell = colIndex.adv !== undefined ? tds[colIndex.adv] : null;
			const streamCell = colIndex.stream !== undefined ? tds[colIndex.stream] : null;
			const replayCell = colIndex.replay !== undefined ? tds[colIndex.replay] : null;

			const tvgText = tvgCell?.innerText.trim() || "";
			const itspText = itspCell?.innerText.trim() || "";
			const fileText = fileCell?.innerText.trim() || "";
			const advText = advCell?.innerText.trim() || "";
			const streamText = streamCell?.innerText.trim() || "";
			const replayText = replayCell?.innerText.trim() || "";

			seenTVGCodes.add(tvgText);

			const setting = trackSettings.find(s => tvgText === s.tvgTrackCode);
			if (!setting) return;

			let hasError = false;

			// ITSP Code
			if (itspText !== setting.itspTrackCode) {
				itspCell.style.backgroundColor = colorLevels.error;
				hasError = true;
			} else {
				itspCell.style.backgroundColor = colorLevels.success;
			}

			// Track File Code
			if (fileText !== setting.trackFileCode) {
				fileCell.style.backgroundColor = colorLevels.error;
				hasError = true;
			} else {
				fileCell.style.backgroundColor = colorLevels.success;
			}

			// Advance Code
			if (setting.advanceCode !== undefined && advCell) {
				if (advText !== setting.advanceCode) {
					advCell.style.backgroundColor = colorLevels.error;
					hasError = true;
				} else {
					advCell.style.backgroundColor = colorLevels.success;
				}
			} else if (advCell) {
				advCell.style.backgroundColor = "";
			}

			// Stream Track Code
			if (setting.streamTrackCode !== undefined && streamCell) {
				if (streamText !== setting.streamTrackCode) {
					streamCell.style.backgroundColor = colorLevels.error;
					hasError = true;
				} else {
					streamCell.style.backgroundColor = colorLevels.success;
				}
			}

			// Replay Code
			if (setting.replayCode !== undefined && replayCell) {
				if (replayText !== setting.replayCode) {
					replayCell.style.backgroundColor = colorLevels.error;
					hasError = true;
				} else {
					replayCell.style.backgroundColor = colorLevels.success;
				}
			}

			if (!hasError) {
				console.log(`✅ Row ${rowIndex + 1} passed validation.`);
			} else {
				console.warn(`❌ Row ${rowIndex + 1} failed validation.`);
			}
		});

		// Alert if any trackSettings didn't match any row
		const unusedSettings = trackSettings
			.filter(setting => !seenTVGCodes.has(setting.tvgTrackCode))
			.map(s => s.tvgTrackCode);

		if (unusedSettings.length > 0) {
			alert("⚠️ These track settings were not matched to any row:\n" + unusedSettings.join(", "));
		}
	}

	// add things to the page
	function initTrackSettingsManager() {
		const LOCAL_STORAGE_KEY = "customTrackSettings";

		// Load custom settings from localStorage
		let trackSettings = [];
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) {
				trackSettings = JSON.parse(stored);
				console.log("✅ Loaded saved trackSettings from localStorage");
			}
		} catch (e) {
			console.error("❌ Failed to parse stored trackSettings:", e);
		}

		// Make available globally
		window.customTrackSettings = trackSettings;

		// Inject button if not already there
		const buttonContainer = document.querySelector(".dt-buttons");
		if (buttonContainer && !document.getElementById("loadTrackSettingsBtn")) {
			const btn = document.createElement("button");
			btn.id = "loadTrackSettingsBtn";
			btn.className = "dt-button"; // match existing style
			btn.textContent = "Load trackSettings";
			buttonContainer.appendChild(btn);

			btn.addEventListener("click", () => {
				const input = prompt("Paste your updated trackSettings JSON:");

				if (!input) return;

				try {
					const parsed = JSON.parse(input);
					if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");

					localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
					window.customTrackSettings = parsed;

					alert("✅ New trackSettings saved. Reapplying settings...");
					fn_matchTrackRowsToSettings(window.customTrackSettings || []);
				} catch (err) {
					alert("❌ Invalid JSON:\n" + err.message);
				}
			});
		}
	}
})();



// Function 1: Save track data with 30-day expiration
function fn_saveTrackData() {
	const table = document.querySelector("#datatable_TVG_Card_List");
	if (!table) return;

	const headers = table.querySelectorAll("thead th");
	const colIndex = {};

	headers.forEach((th, i) => {
		const label = th.getAttribute("aria-label") || "";
		if (label.includes("TVG Track Code")) colIndex.tvg = i;
		else if (label.includes("Track Name")) colIndex.name = i;
		else if (label.includes("ITSP Track Code")) colIndex.itsp = i;
	});

	if (colIndex.tvg === undefined || colIndex.name === undefined || colIndex.itsp === undefined) {
		console.warn("Could not find all required columns for track data");
		return;
	}

	// Get existing data from GM storage
	let trackData = {};
	try {
		const stored = GM_getValue('sgw_track_data', '{}');
		trackData = JSON.parse(stored);
	} catch (e) {
		console.error("Error parsing stored track data:", e);
		trackData = {};
	}

	const now = Date.now();
	const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

	// Clean out data older than 30 days
	Object.keys(trackData).forEach(key => {
		if (trackData[key].timestamp < thirtyDaysAgo) {
			delete trackData[key];
		}
	});

	// Extract new data from table
	const tbody = table.querySelector("tbody");
	if (tbody) {
		const rows = tbody.querySelectorAll("tr");
		rows.forEach(row => {
			const cells = row.querySelectorAll("td");
			if (cells.length > Math.max(colIndex.tvg, colIndex.name, colIndex.itsp)) {
				const tvgCode = cells[colIndex.tvg]?.textContent.trim();
				const trackName = cells[colIndex.name]?.textContent.trim();
				const itspCode = cells[colIndex.itsp]?.textContent.trim();

				if (tvgCode && trackName && itspCode) {
					trackData[tvgCode] = {
						tvgCode: tvgCode,
						trackName: trackName,
						itspCode: itspCode,
						timestamp: now
					};
				}
			}
		});
	}

	// Save back to GM storage
	try {
		GM_setValue('sgw_track_data', JSON.stringify(trackData));
		console.log(`Saved ${Object.keys(trackData).length} track entries`);
	} catch (e) {
		console.error("Error saving track data:", e);
	}
}

// Function 2: Retrieve stored track data
function fn_getTrackData(tvgCode = null) {
	try {
		const stored = GM_getValue('sgw_track_data', '{}');
		const trackData = JSON.parse(stored);
		const now = Date.now();
		const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

		// Clean expired data
		Object.keys(trackData).forEach(key => {
			if (trackData[key].timestamp < thirtyDaysAgo) {
				delete trackData[key];
			}
		});

		if (tvgCode) {
			return trackData[tvgCode] || null;
		}

		return trackData;
	} catch (e) {
		console.error("Error retrieving track data:", e);
		return tvgCode ? null : {};
	}
}

function fn_addTrackNameColumn() {
	const table = document.querySelector("#datatable_Report_Different_Runners");
	if (!table) {
		console.warn("Different Runners table not found");
		return;
	}

	// Get stored track data
	const trackData = fn_getTrackData();

	// Find the TVG Track Code column index
	const headers = table.querySelectorAll("thead th");
	let tvgCodeIndex = -1;

	headers.forEach((th, i) => {
		const text = th.textContent.trim();
		if (text === "TVG Track Code") {
			tvgCodeIndex = i;
		}
	});

	if (tvgCodeIndex === -1) {
		console.warn("TVG Track Code column not found");
		return;
	}

	// Add header for Track Name column (insert after TVG Track Code)
	const headerRow = table.querySelector("thead tr");
	const newHeader = document.createElement("th");
	newHeader.textContent = "Track Name";
	newHeader.className = "sorting";
	newHeader.tabIndex = 0;
	newHeader.setAttribute("aria-controls", "datatable_Report_Different_Runners");
	newHeader.setAttribute("rowspan", "1");
	newHeader.setAttribute("colspan", "1");
	newHeader.setAttribute("aria-label", "Track Name: activate to sort column ascending");

	// Insert after TVG Track Code header
	const tvgHeader = headers[tvgCodeIndex];
	tvgHeader.parentNode.insertBefore(newHeader, tvgHeader.nextSibling);

	// Add Track Name cells to each row
	const tbody = table.querySelector("tbody");
	if (tbody) {
		const rows = tbody.querySelectorAll("tr");
		rows.forEach(row => {
			const cells = row.querySelectorAll("td");
			if (cells.length > tvgCodeIndex) {
				const tvgCode = cells[tvgCodeIndex].textContent.trim();
				const trackInfo = trackData[tvgCode];

				// Create new cell
				const newCell = document.createElement("td");
				if (trackInfo && trackInfo.trackName) {
					newCell.textContent = trackInfo.trackName;
				} else {
					newCell.textContent = "—"; // Em dash for unknown
					newCell.style.color = "#999";
					newCell.title = "Track name not found in saved data";
				}

				// Insert after TVG Track Code cell
				const tvgCell = cells[tvgCodeIndex];
				tvgCell.parentNode.insertBefore(newCell, tvgCell.nextSibling);
			}
		});
	}

	console.log("Track Name column added to Different Runners report");
}


function fn_addCutOffTextButton() {
	const buttonContainer = document.querySelector(".dt-buttons");
	if (buttonContainer && !document.getElementById("createCutOffTextBtn")) {
		const btn = document.createElement("button");
		btn.id = "createCutOffTextBtn";
		btn.className = "dt-button"; // match existing style
		btn.textContent = "Create CutOff Text";
		btn.onclick = function () {
			fn_createCutOffText();
		};
		buttonContainer.appendChild(btn);
		console.log("Create CutOff Text button added");
	}
}

function fn_createCutOffText() {
	const table = document.querySelector("#datatable_Report_Different_Runners");
	if (!table) {
		console.warn("Different Runners table not found");
		return;
	}

	// Find column indexes
	const headers = table.querySelectorAll("thead th");
	let tvgCodeIndex = -1;
	let trackNameIndex = -1;
	let raceNumberIndex = -1;
	let utRunnersIndex = -1;

	headers.forEach((th, i) => {
		const text = th.textContent.trim();
		if (text === "TVG Track Code") tvgCodeIndex = i;
		else if (text === "Track Name") trackNameIndex = i;
		else if (text === "TVG Race Number") raceNumberIndex = i;
		else if (text === "Number Of UT Runners") utRunnersIndex = i;
	});

	if (tvgCodeIndex === -1 || raceNumberIndex === -1 || utRunnersIndex === -1) {
		console.warn("Required columns not found");
		alert("Error: Could not find required columns in table");
		return;
	}

	// Collect data by track
	const trackMap = {};
	const tbody = table.querySelector("tbody");
	if (tbody) {
		const rows = tbody.querySelectorAll("tr");
		rows.forEach(row => {
			const cells = row.querySelectorAll("td");
			if (cells.length > Math.max(tvgCodeIndex, raceNumberIndex, utRunnersIndex)) {
				const tvgCode = cells[tvgCodeIndex].textContent.trim();
				const trackName = trackNameIndex !== -1 ? cells[trackNameIndex].textContent.trim() : tvgCode;
				const raceNumber = parseInt(cells[raceNumberIndex].textContent.trim());
				const utRunners = cells[utRunnersIndex].textContent.trim();

				if (!trackMap[tvgCode]) {
					trackMap[tvgCode] = {
						trackName: trackName,
						races: []
					};
				}

				trackMap[tvgCode].races.push({
					number: raceNumber,
					hasUT: utRunners !== "" && utRunners !== "—"
				});
			}
		});
	}

	// Generate cutoff text for each track
	const outputLines = ["LATE NIGHT RACING:"];

	Object.keys(trackMap).forEach(tvgCode => {
		const track = trackMap[tvgCode];
		track.races.sort((a, b) => a.number - b.number);

		// Find the last race with UT runners
		let lastOfferedRace = 0;
		track.races.forEach(race => {
			if (race.hasUT) {
				lastOfferedRace = Math.max(lastOfferedRace, race.number);
			}
		});

		if (lastOfferedRace > 0) {
			let raceText;
			if (lastOfferedRace === 1) {
				raceText = "Race 1 offered";
			} else {
				raceText = `Races 1 - ${lastOfferedRace} offered`;
			}

			outputLines.push(`${track.trackName}; ${raceText}`);
		}
	});

	// Join and copy to clipboard
	const outputText = outputLines.join("\n");

	// Copy to clipboard
	navigator.clipboard.writeText(outputText).then(() => {
		console.log("Cutoff text copied to clipboard:");
		console.log(outputText);
		alert("Cutoff text copied to clipboard!");
	}).catch(err => {
		console.error("Failed to copy to clipboard:", err);
		// Fallback: show in alert
		alert("Copy failed. Text:\n\n" + outputText);
	});
}
