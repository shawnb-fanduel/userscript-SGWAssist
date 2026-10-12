# SGW Assist

<img alt="user-script header" src="https://github.com/shawnb-fanduel/ops-highlightdates/blob/main/assets/header.png?raw=true"/>


This UserScript enhances the SGW site by highlighting tables, post times, and other cells based on specific criteria. It uses JavaScript to dynamically modify the appearance of tables after the page has loaded completely.

It works on both production and development SGW sites.


## Functionality Overview

SGW Assist adds highlighting, validation, and shortcuts to SGW pages.

### Card List
- Highlights track names with URL-breaking characters (`\ / < > & %`)
- Highlights ITSP Track Codes that don't match the expected TVG Track Code
- Highlights mismatches between Track File Code and TVG Card Track Name (both cells turn red; hover to see the expected value)
- Auto-fills Track Name when a known Axcis track code is selected in the Add/Edit form
- Saves track names for 30 days, for use on other pages

### Card (Race List)
- Highlights post times dated today on a card for a different date
- Highlights post times between 2 AM and 4 AM
- Highlights post times that are out of order
- Shortens long Race Conditions and Analyst Verdict cells (truncated with `[...]`)
- Highlights races with no Special Cards Config ("Add New Config")
- Adds a Race Ref column pulled from the race conditions (e.g. `IND R4`)

### Report Different Runners
- Highlights runner discrepencies

### Daily Overrides (Wager Profile)
- **List Enabled Tracks** button: copies an alphabetical list of enabled tracks to the clipboard

### Favorite Races
- Live character counter on **Description** (max 20), which turns yellow near the limit and red when over


## Usage

1. Install with any UserScript extension in your browser (e.g., Tampermonkey, Greasemonkey).

## Notes

- Errors are always highlighted in Red.
- Cautions are always highlighted in Yellow.
