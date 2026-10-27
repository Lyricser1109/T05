# T05 — TV energy, in perspective

A single responsive page with four D3 charts. It uses plain HTML, CSS and JavaScript, following the T04 pattern: load a CSV with `d3.csv`, convert numeric fields with `+`, then pass the data to a named chart function. Scales, axes and marks are commented separately.

## Files

- `index.html` — page structure, introductory text, chart containers and script order.
- `styles.css` — layout, colours, legends and responsive styles.
- `scatterplot.js` — annual energy consumption versus star rating.
- `donut-chart.js` — count-weighted energy totals by screen technology across all sizes.
- `bar-chart.js` — supplied mean annual consumption for 55-inch TVs by technology.
- `line-chart.js` — supplied average spot prices from 1998 to 2024.
- `data/` — the original supplied CSV files, left unchanged.

Each chart script contains its own CSV loading and chart function. D3 loads before these scripts, using `defer` so the HTML containers exist first. Each SVG has a `viewBox`, and `ResizeObserver` redraws the chart when its container changes width. The page uses two columns on large screens and one on smaller screens. Chart marks have native hover titles; SVG descriptions and CSV links provide additional context.

The scatterplot has star rating on the horizontal axis and annual energy consumption on the vertical axis. Its three checkboxes allow any combination of LCD, LED and OLED, with all selected initially. Uncheck LCD to compare LED and OLED alone. The axes stay fixed when filtering, a status line reports the visible record count, and an empty selection displays a prompt. Other charts are unaffected by these controls.

## Run locally

Open the project through XAMPP/localhost or VS Code Live Server. Fetching CSV files requires an HTTP server; opening `index.html` directly with `file://` may fail. No dependency installation or build step is required. D3 v7 loads from `https://d3js.org/d3.v7.min.js`, so an internet connection is required.

For the current XAMPP workspace, the page is at:

`http://localhost/Data%20Visualisation/T05/`

## Data and calculations

The supplied files do not establish the original publisher, TV collection date, or full processing workflow. Findings describe these files rather than current market availability.

- **Scatter plot:** uses `energy_consumpt` and `star2` in `Ex5_TV_energy.csv`. There are 587 grouped rows representing a combined `count` of 3,703. Each point represents one row, not necessarily one TV. Energy is displayed as annual consumption in kWh/year, consistent with the supplied energy summaries; confirm the field definition against the original workflow if needed.
- **Donut:** groups the same CSV by technology and sums `energy_consumpt × count`. This estimates combined annual consumption assuming the row energy value applies to each item represented by its count. Totals are LCD: 94,738; LED: 1,434,343; OLED: 129,569 kWh/year (1,658,650 overall). These are dataset-weighted estimates, not measured household use or sales-weighted market demand. `LCD (LED)` is displayed as `LED` to match the summary files.
- **55-inch bars:** uses the existing `Mean(Labelled energy consumption (kWh/year))` column in `Ex5_TV_energy_55inchtv_byScreenType.csv`: LCD 326.0, LED 330.3 and OLED 386.5 kWh/year after rounding. These supplied means are displayed directly; they are not recalculated from the grouped TV CSV, whose weighting may differ.
- **Spot-price line:** uses `Year` and `Average Price (notTas-Snowy)` in `Ex5_ARE_Spot_Prices.csv`. There are 27 annual observations from 1998 through 2024. The provided average covers Queensland, NSW, Victoria and South Australia, excluding Tasmania and Snowy. Prices are AUD/MWh and are wholesale spot prices, not household retail rates.

`Ex5_TV_energy_Allsizes_byScreenType.csv` contains technology **means**, not totals. It is retained as supplied but is not used for the combined-energy donut. Summing or pie-charting these means would describe a different measure from total energy across the represented TVs.

Blank numeric values are treated as missing. Non-finite chart values are excluded, and CSV loading errors show a message in the affected chart. The supplied files currently have valid values for the fields used in these charts.

## References and acknowledgement

Built with [D3](https://d3js.org/), including [CSV loading](https://d3js.org/d3-fetch), [linear scales](https://d3js.org/d3-scale/linear) and [pie angles](https://d3js.org/d3-shape/pie). OpenAI ChatGPT assisted with code, layout and explanatory content. Calculations should be checked against the original data-processing workflow before treating them as findings about the wider market.
