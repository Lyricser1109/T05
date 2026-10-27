// Chart function: show the supplied four-state average from 1998 to 2024.
const createLineChart = (data) => {
    const container = d3.select("#line-chart");

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
            .attr("aria-label", "Line chart of annual average spot prices for Queensland, New South Wales, Victoria and South Australia, 1998 to 2024, in Australian dollars per megawatt-hour.");
        svg.append("title").text("Annual average electricity spot prices, 1998–2024");
        const firstYear = data[0];
        const lastYear = data[data.length - 1];
        svg.append("desc")
            .text(`${data.length} annual values. The supplied average is ${firstYear.price} AUD per MWh in ${firstYear.year} and ${lastYear.price} in ${lastYear.year}. Tasmania and Snowy are excluded.`);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Scales: years are evenly spaced, and prices start from zero.
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
                .tickValues(viewW < 400 ? [1998, 2010, 2024] : [1998, 2005, 2010, 2015, 2020, 2024])
                .tickFormat(d3.format("d"))
                .tickSizeOuter(0));
        chart.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0));

        // Join annual observations with a straight line, without smoothing peaks.
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.price));
        chart.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#d62728")
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("d", line);
        chart.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.price))
            .attr("r", 3)
            .attr("fill", "#d62728")
            .attr("stroke", "#fffefa")
            .attr("stroke-width", 1)
            .append("title")
            .text(d => `${d.year}: $${d3.format(".2f")(d.price)} AUD/MWh`);

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

// Use the provided average column; blank prices are missing rather than zero.
d3.csv("data/Ex5_ARE_Spot_Prices.csv", d => {
    const price = d["Average Price (notTas-Snowy)"];
    return {
        year: +d.Year,
        price: price.trim() === "" ? NaN : +price
    };
}).then(data => {
    const validRows = data.filter(d => Number.isFinite(d.year) && d.year >= 1998
        && d.year <= 2024 && Number.isFinite(d.price));
    validRows.sort((a, b) => d3.ascending(a.year, b.year));
    if (validRows.length === 0) throw new Error("No valid annual spot prices were found.");
    createLineChart(validRows);
}).catch(error => {
    d3.select("#line-chart").attr("aria-busy", "false")
        .select(".chart-status").attr("class", "chart-status chart-error")
        .text("The annual prices could not be loaded. Please check the price CSV path and use a local web server.");
    console.error("Line chart:", error);
});
