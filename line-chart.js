// Chart function: average the available regions, with a visual break in 2005.
const createLineChart = (data) => {
    const container = d3.select("#line-chart");
    const earlyRows = data.filter(d => d.year <= 2004);
    const laterRows = data.filter(d => d.year >= 2005);
    const averageRows = data.filter(d => Number.isFinite(d.price));

    const drawChart = () => {
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
            .attr("role", "img")
            .attr("aria-label", "Annual average spot prices across available regions, including Snowy where recorded. The red segment covers 1998 to 2004 and the blue segment covers 2005 to 2024, with a break between them. Prices are Australian dollars per megawatt-hour.");
        svg.append("title").text("Annual average electricity spot prices, 1998–2024");
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
        const drawSegment = (rows, label, colour, className) => {
            const series = chart.append("g")
                .attr("class", className);
            const line = d3.line()
                .defined(d => Number.isFinite(d.price))
                .x(d => xScale(d.year))
                .y(d => yScale(d.price));

            series.append("path")
                .datum(rows)
                .attr("fill", "none")
                .attr("stroke", colour)
                .attr("stroke-width", 2.5)
                .attr("stroke-linejoin", "round")
                .attr("d", line);
            series.selectAll("circle")
                .data(rows.filter(d => Number.isFinite(d.price)))
                .join("circle")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.price))
                .attr("r", 4)
                .attr("fill", colour)
                .attr("stroke", "#fffefa")
                .attr("stroke-width", 1)
                .append("title")
                .text(d => `${label}, ${d.year}: $${d3.format(".2f")(d.price)} AUD/MWh (${d.regionCount} regions)`);
        };

        drawSegment(earlyRows, "Available-region average", "#d62728", "early-series");
        drawSegment(laterRows, "Available-region average", "#0072b2", "later-series");

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
    };

    container.select(".chart-status").remove();
    container.attr("aria-busy", "false");
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
