# T05 — TV energy, in perspective

A single responsive page with four D3 charts. It uses plain HTML, CSS and JavaScript, following the T04 pattern: load a CSV with `d3.csv`, convert numeric fields with `+`, then pass the data to a named chart function. Scales, axes and marks are commented separately.

## Files

- `index.html` — page structure, introductory text, chart containers and script order.
- `styles.css` — layout, colours, legends and responsive styles.
- `scatterplot.js` — annual energy consumption versus star rating.
- `donut-chart.js` — toggle between count-weighted energy totals and supplied means by screen technology across all sizes.
- `bar-chart.js` — supplied mean annual consumption for 55-inch TVs by technology.
- `line-chart.js` — supplied average spot prices from 1998 to 2024.
- `data/` — the original supplied CSV files, left unchanged.

Each chart script contains its own CSV loading and chart function. D3 loads before these scripts, using `defer` so the HTML containers exist first. Each SVG has a `viewBox`, and `ResizeObserver` redraws the chart when its container changes width. The page uses two columns on large screens and one on smaller screens. Chart marks have native hover titles; SVG descriptions and CSV links provide additional context.

The scatterplot has star rating on the horizontal axis and annual energy consumption on the vertical axis. Its three checkboxes allow any combination of LCD, LED and OLED, with all selected initially. Uncheck LCD to compare LED and OLED alone. The axes stay fixed when filtering, and an empty selection displays a prompt. Other charts are unaffected by these controls.

The donut's radio buttons switch between **Combined energy** (the default) and **Mean per TV**. Both datasets load once; changing the measure updates the arcs, legend, title, notes and source link. The selected measure is retained on resize. Mean mode labels each technology's supplied mean directly and displays no combined total or share percentages.

The line chart labels start at 1998 at the left edge, then increase in four-year intervals (1998, 2002, …, 2022). One available-region average is drawn as two solid segments: red for 1998–2004 (7 observations), and blue for 2005–2024 (20 observations). The segments are deliberately disconnected between 2004 and 2005, when Tasmania joins. Snowy is included in the average for every year it is recorded (1998–2007). Both segments share the same axes and resize together. There is no toggle or separate Tasmania/Snowy line.

## Run locally

Open the project through XAMPP/localhost or VS Code Live Server. Fetching CSV files requires an HTTP server; opening `index.html` directly with `file://` may fail. No dependency installation or build step is required. D3 v7 loads from `https://d3js.org/d3.v7.min.js`, so an internet connection is required.

For the current XAMPP workspace, the page is at:

`http://localhost/Data%20Visualisation/T05/`

## Data and calculations

The supplied files do not establish the original publisher, TV collection date, or full processing workflow. Findings describe these files rather than current market availability.

- **Scatter plot:** uses `energy_consumpt` and `star2` in `Ex5_TV_energy.csv`. There are 587 grouped rows representing a combined `count` of 3,703. Each point represents one row, not necessarily one TV. Energy is displayed as annual consumption in kWh/year, consistent with the supplied energy summaries; confirm the field definition against the original workflow if needed.
- **Donut:** groups the same CSV by technology and sums `energy_consumpt × count`. This estimates combined annual consumption assuming the row energy value applies to each item represented by its count. Totals are LCD: 94,738; LED: 1,434,343; OLED: 129,569 kWh/year (1,658,650 overall). These are dataset-weighted estimates, not measured household use or sales-weighted market demand. `LCD (LED)` is displayed as `LED` to match the summary files.
- **55-inch bars:** uses the existing `Mean(Labelled energy consumption (kWh/year))` column in `Ex5_TV_energy_55inchtv_byScreenType.csv`: LCD 326.0, LED 330.3 and OLED 386.5 kWh/year after rounding. These supplied means are displayed directly; they are not recalculated from the grouped TV CSV, whose weighting may differ.
- **Spot-price line:** calculates the arithmetic mean directly from the Queensland, NSW, Victoria, South Australia, Tasmania and Snowy columns in `Ex5_ARE_Spot_Prices.csv`, using only the values available in each year. It averages five regions in 1998–2004 (the four states plus Snowy), six in 2005–2007 (including Tasmania and Snowy), and five in 2008–2024 (the five states, with Snowy missing). Each available region has equal weight; this is not demand-weighted. Blank cells are excluded from both the sum and count, rather than treated as zero. The supplied `Average Price (notTas-Snowy)` column is no longer used. Prices are AUD/MWh and are wholesale spot prices, not household retail rates. The CSV itself is unchanged.

`Ex5_TV_energy_Allsizes_byScreenType.csv` supplies the donut's **Mean per TV** mode: LCD 306.5, LED 355.7 and OLED 533.1 kWh/year after rounding. These are the supplied technology means, not values recalculated using `count` from the grouped TV CSV. Mean-mode arc sizes are proportional to these means; they do not represent shares of combined TV energy. The centre labels the measure rather than displaying the sum of the means as a total or an overall average.

Blank numeric values are treated as missing. Non-finite chart values are excluded, and CSV loading errors show a message in the affected chart. The supplied files currently have valid values for the fields used in these charts.

## References and acknowledgement

Built with [D3](https://d3js.org/), including [CSV loading](https://d3js.org/d3-fetch), [linear scales](https://d3js.org/d3-scale/linear) and [pie angles](https://d3js.org/d3-shape/pie). OpenAI ChatGPT assisted with code, layout and explanatory content. Calculations should be checked against the original data-processing workflow before treating them as findings about the wider market.
