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

The scatterplot has star rating on the horizontal axis and annual energy consumption on the vertical axis. Its three checkboxes allow any combination of LCD, LED and OLED, with all selected initially. Uncheck LCD to compare LED and OLED alone. The axes stay fixed when filtering, and an empty selection displays a prompt. Other charts are unaffected by these controls.

The donut's radio buttons switch between **Combined energy** (the default) and **Mean per TV**. Both datasets load once; changing the measure updates the arcs, legend, title, notes and source link. The selected measure is retained on resize. Mean mode labels each technology's supplied mean directly and displays no combined total or share percentages.

Donut slices and native legend buttons are clickable. Selecting a technology highlights its slice and displays its value in the centre, with the exact value below the legend. Click the same technology again or use **Clear selection** to reset. The selection persists when switching measures or resizing.  

The line chart's points, line segments and period legend buttons are clickable. Hovering over or focusing a point opens a styled popup with the year, average price and region count. The popup stays within the chart bounds and replaces each point's native browser title tooltip. Points can be reached with Tab, inspected using left/right arrow keys, and selected with Enter/Space; Escape closes the popup. Clicking or tapping a point also shows its details, with the selection retained below the plot. Selecting a period highlights that segment and shows its price range. Click the selected point/period again or use **Clear selection** to reset. 

The line chart labels start at 1998 at the left edge, then increase in four-year intervals (1998, 2002, …, 2022). One available-region average is drawn as two solid segments: red for 1998–2004 (7 observations), and blue for 2005–2024 (20 observations). The segments are deliberately disconnected between 2004 and 2005, when Tasmania joins. Snowy is included in the average for every year it is recorded (1998–2007). Both segments share the same axes and resize together. 

`Ex5_TV_energy_Allsizes_byScreenType.csv` supplies the donut's **Mean per TV** mode: LCD 306.5, LED 355.7 and OLED 533.1 kWh/year after rounding. These are the supplied technology means, not values recalculated using `count` from the grouped TV CSV. Mean-mode arc sizes are proportional to these means; they do not represent shares of combined TV energy. The centre labels the measure rather than displaying the sum of the means as a total or an overall average.

Blank numeric values are treated as missing. Non-finite chart values are excluded, and CSV loading errors show a message in the affected chart. The supplied files currently have valid values for the fields used in these charts.

## References and acknowledgement
OpenAI ChatGPT assisted with code, layout and explanatory content. 
