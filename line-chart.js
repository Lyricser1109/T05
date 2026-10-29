// Chart function: average the available regions, with a visual break in 2005.
const createLineChart = (data) => {
    const container = d3.select("#line-chart");
    const earlyRows = data.filter(d => d.year <= 2004);
    const laterRows = data.filter(d => d.year >= 2005);
    const averageRows = data.filter(d => Number.isFinite(d.price));
    let selectedPeriod = null;
    let selectedYear = null;
    const tooltip = d3.select("#line-tooltip");

    const hideTooltip = () => tooltip.property("hidden", true);

    // A visible HTML popup replaces the browser's plain point-title tooltip.
    const showTooltip = (point, row) => {
        tooltip.select(".line-tooltip-year").text(row.year);
        tooltip.select(".line-tooltip-price strong").text(`$${d3.format(".2f")(row.price)}`);
        tooltip.style("--point-colour", row.year <= 2004 ? "#d62728" : "#0072b2")
            .property("hidden", false);

        // Place the popup beside the point and keep it within the chart on mobile.
        const bounds = container.node().getBoundingClientRect();
        const dot = point.getBoundingClientRect();
        const popup = tooltip.node().getBoundingClientRect();
        const x = dot.left + dot.width / 2 - bounds.left;
        const y = dot.top - bounds.top;
        let left = x + 12;
        if (left + popup.width > bounds.width - 8) left = x - popup.width - 12;
        left = Math.max(8, Math.min(left, bounds.width - popup.width - 8));
        let top = y - popup.height - 12;
        if (top < 8) top = y + dot.height + 12;
        top = Math.max(8, Math.min(top, bounds.height - popup.height - 8));
        tooltip.style("left", `${left}px`).style("top", `${top}px`);
    };

    const selectPeriod = (period) => {
        selectedPeriod = selectedPeriod === period ? null : period;
        selectedYear = null;
        drawChart();
    };

    const selectYear = (year) => {
        selectedYear = selectedYear === year ? null : year;
        selectedPeriod = selectedYear === null ? null : (selectedYear <= 2004 ? "early" : "later");
        drawChart();
    };

    const drawChart = () => {
        const activePoint = document.activeElement;
        const focusedYear = activePoint && activePoint.matches("#line-chart .line-point")
            ? activePoint.__data__.year : null;
        hideTooltip();
        // Native controls stay in place so focus is preserved during redraws.
        d3.select("#line-legend").selectAll("button")
            .classed("is-selected", function() { return this.value === selectedPeriod; })
            .attr("aria-pressed", function() { return String(this.value === selectedPeriod); });
        const selected = averageRows.find(d => d.year === selectedYear);
        let detailText = "";
        if (selected) {
            detailText = `${selected.year}: $${d3.format(".2f")(selected.price)} AUD/MWh · ${selected.regionCount} regions`;
        } else if (selectedPeriod) {
            const rows = (selectedPeriod === "early" ? earlyRows : laterRows)
                .filter(d => Number.isFinite(d.price));
            const periodLabel = selectedPeriod === "early" ? "1998–2004" : "2005–2024";
            detailText = `${periodLabel}: $${d3.format(".2f")(d3.min(rows, d => d.price))}–$${d3.format(".2f")(d3.max(rows, d => d.price))} AUD/MWh`;
        }
        const detail = d3.select("#line-detail");
        if (detail.text() !== detailText) detail.text(detailText);
        d3.select("#line-reset").property("hidden", selectedPeriod === null);

        // Sizes: scale the plot to the card and keep text at a readable size.
        const viewW = container.node().clientWidth;
        if (viewW <= 0) return;
        const viewH = 320;
        const margin = { top: 30, right: 18, bottom: 47, left: 44 };
        const chartW = viewW - margin.left - margin.right;
        const chartH = viewH - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${viewW} ${viewH}`)
            .attr("role", "group");
        const firstYear = averageRows[0];
        const lastYear = averageRows[averageRows.length - 1];
        svg.append("desc")
            .text(`${averageRows.length} annual average values, from ${firstYear.price} AUD per MWh in ${firstYear.year} to ${lastYear.price} in ${lastYear.year}. Each available region has equal weight: five regions in 1998–2004, six in 2005–2007 and five in 2008–2024. Snowy is included through 2007 and Tasmania from 2005. Missing regional prices are omitted. The segments are not connected between 2004 and 2005.`);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Share scales across both periods; 1998 is at x = 0.
        const xScale = d3.scaleLinear()
            .domain([1998, 2024])
            .range([0, chartW]);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.price)])
            .nice()
            .range([chartH, 0]);

        chart.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-chartW).tickFormat(""));
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${chartH})`)
            .call(d3.axisBottom(xScale)
                .tickValues(d3.range(1998, 2025, 4)) // 1998, 2002, ... 2022
                .tickFormat(d3.format("d"))
                .tickSizeOuter(0));
        chart.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0));

        // Draw separate solid paths, leaving no connector from 2004 to 2005.
        // Defined also leaves gaps if a price is missing within either period.
        const drawSegment = (rows, label, colour, className, period) => {
            const series = chart.append("g")
                .attr("class", className)
                .attr("opacity", !selectedPeriod || selectedPeriod === period ? 1 : 0.25);
            const line = d3.line()
                .defined(d => Number.isFinite(d.price))
                .x(d => xScale(d.year))
                .y(d => yScale(d.price));

            series.append("path")
                .attr("class", "line-segment")
                .datum(rows)
                .attr("fill", "none")
                .attr("stroke", colour)
                .attr("stroke-width", selectedPeriod === period ? 3.5 : 2.5)
                .attr("stroke-linejoin", "round")
                .attr("d", line)
                .on("click", () => selectPeriod(period));
            series.selectAll("circle")
                .data(rows.filter(d => Number.isFinite(d.price)))
                .join("circle")
                .attr("class", "line-point")
                .attr("tabindex", 0)
                .attr("role", "button")
                .attr("aria-describedby", "line-tooltip")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.price))
                .attr("r", d => d.year === selectedYear ? 6 : 4)
                .attr("fill", colour)
                .attr("stroke", d => d.year === selectedYear ? "#292f2a" : "#fffefa")
                .attr("stroke-width", d => d.year === selectedYear ? 2 : 1)
                .on("pointerenter", function(event, d) { showTooltip(this, d); })
                .on("pointerleave", hideTooltip)
                .on("focus", function(event, d) { showTooltip(this, d); })
                .on("blur", hideTooltip)
                .on("click", (event, d) => activatePoint(d))
                .on("keydown", function(event, d) {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        activatePoint(d);
                    } else if (event.key === "Escape") {
                        hideTooltip();
                    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                        event.preventDefault();
                        const points = container.selectAll(".line-point").nodes();
                        const next = points.indexOf(this) + (event.key === "ArrowRight" ? 1 : -1);
                        if (points[next]) points[next].focus({ preventScroll: true });
                    }
                });
        };

        drawSegment(earlyRows, "Available-region average", "#d62728", "early-series", "early");
        drawSegment(laterRows, "Available-region average", "#0072b2", "later-series", "later");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left)
            .attr("y", 15)
            .text("Spot price (AUD/MWh)");
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left + chartW / 2)
            .attr("y", viewH - 7)
            .attr("text-anchor", "middle")
            .text("Year");

        // Preserve focus if a redraw replaces the point being inspected.
        if (focusedYear !== null) {
            const point = container.selectAll(".line-point")
                .filter(d => d.year === focusedYear).node();
            if (point) point.focus({ preventScroll: true });
        }
    };

    const activatePoint = (row) => {
        selectYear(row.year);
        const point = container.selectAll(".line-point")
            .filter(d => d.year === row.year).node();
        point.focus({ preventScroll: true });
        showTooltip(point, row);
    };

    container.select(".chart-status").remove();
    container.attr("aria-busy", "false");
    d3.select("#line-legend").selectAll("button")
        .property("disabled", false)
        .on("click", function() { selectPeriod(this.value); });
    container.on("pointerleave", hideTooltip);
    d3.select("#line-reset").on("click", () => {
        selectedPeriod = null;
        selectedYear = null;
        drawChart();
        d3.select("#line-legend button").node().focus();
    });
    drawChart();
    const resizeObserver = new ResizeObserver(drawChart);
    resizeObserver.observe(container.node());
};

// Calculate the mean directly from the regional columns, including Snowy.
// Each available region has equal weight; blank cells do not count as zero.
d3.csv("data/Ex5_ARE_Spot_Prices.csv", d => {
    const regionalColumns = [
        "Queensland ($ per megawatt hour)",
        "New South Wales ($ per megawatt hour)",
        "Victoria ($ per megawatt hour)",
        "South Australia ($ per megawatt hour)",
        "Tasmania ($ per megawatt hour)",
        "Snowy ($ per megawatt hour)"
    ];
    const prices = regionalColumns
        .map(column => d[column].trim() === "" ? NaN : +d[column])
        .filter(value => Number.isFinite(value));
    return {
        year: +d.Year,
        price: prices.length > 0 ? d3.mean(prices) : NaN,
        regionCount: prices.length
    };
}).then(data => {
    const validRows = data.filter(d => Number.isFinite(d.year) && d.year >= 1998 && d.year <= 2024);
    validRows.sort((a, b) => d3.ascending(a.year, b.year));
    if (!validRows.some(d => Number.isFinite(d.price))) throw new Error("No valid annual average spot prices were found.");
    createLineChart(validRows);
}).catch(error => {
    d3.select("#line-chart").attr("aria-busy", "false")
        .select(".chart-status").attr("class", "chart-status chart-error")
        .text("The annual prices could not be loaded. Please check the price CSV path and use a local web server.");
    console.error("Line chart:", error);
});
