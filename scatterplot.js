// Chart function: compare annual energy consumption with star rating.
const createScatterPlot = (data) => {
    const container = d3.select("#scatterplot");
    const filters = d3.select("#scatter-filters");
    const colours = d3.scaleOrdinal()
        .domain(["LCD", "LED", "OLED"])
        .range(["#0072b2", "#d62728", "#f2c811"]);

    const drawChart = () => {
        // Checkboxes allow any combination, including LED and OLED together.
        const selectedTechnologies = new Set(filters.selectAll("input:checked")
            .nodes().map(input => input.value));
        const visibleData = data.filter(d => selectedTechnologies.has(d.technology));

        // Sizes: redraw at the container's current width to keep labels readable.
        const viewW = container.node().clientWidth;
        if (viewW <= 0) return;
        const viewH = 350;
        const margin = { top: 28, right: 18, bottom: 48, left: 55 };
        const chartW = viewW - margin.left - margin.right;
        const chartH = viewH - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${viewW} ${viewH}`)
            .attr("role", "img")
            .attr("aria-label", "Scatter plot with star rating on the horizontal axis and annual TV energy consumption on the vertical axis, coloured by screen technology.");

        svg.append("title").text("Star rating and annual energy consumption");
        svg.append("desc")
            .text(`${visibleData.length} of ${data.length} grouped TV records shown. Selected technologies: ${[...selectedTechnologies].join(", ") || "none"}. Each point shows star rating and annual energy consumption in kilowatt-hours.`);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Scales stay fixed while filtering so selections remain comparable.
        // Ratings are horizontal; annual energy consumption is vertical.
        const xScale = d3.scaleLinear()
            .domain([0, 10])
            .range([0, chartW]);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energy)])
            .nice()
            .range([chartH, 0]);

        // Axes and light horizontal grid lines.
        chart.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-chartW).tickFormat(""));
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${chartH})`)
            .call(d3.axisBottom(xScale).ticks(viewW < 400 ? 5 : 10).tickSizeOuter(0));
        chart.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(",.0f")).tickSizeOuter(0));

        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left)
            .attr("y", 15)
            .text("Annual energy (kWh/year)");
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left + chartW / 2)
            .attr("y", viewH - 8)
            .attr("text-anchor", "middle")
            .text("Star rating");

        // Bind one point per CSV row; native titles show details on hover.
        chart.selectAll("circle")
            .data(visibleData)
            .join("circle")
            .attr("cx", d => xScale(d.stars))
            .attr("cy", d => yScale(d.energy))
            .attr("r", 3.5)
            .attr("fill", d => colours(d.technology))
            .attr("fill-opacity", 0.8)
            .attr("stroke", "#fffefa")
            .attr("stroke-width", 0.5)
            .append("title")
            .text(d => `${d.brand} · ${d.technology} · ${d.screenSize}-inch\n${d.stars} stars · ${d3.format(",.1f")(d.energy)} kWh/year\nCount represented: ${d.count}`);

        if (visibleData.length === 0) {
            chart.append("text")
                .attr("class", "chart-empty")
                .attr("x", chartW / 2)
                .attr("y", chartH / 2)
                .attr("text-anchor", "middle")
                .text("Select a technology above.");
        }
    };

    container.select(".chart-status").remove();
    container.attr("aria-busy", "false");
    filters.property("disabled", false);
    filters.selectAll("input").on("change", drawChart);
    drawChart();

    // Observe this chart rather than depending on a fixed browser width.
    const resizeObserver = new ResizeObserver(drawChart);
    resizeObserver.observe(container.node());
};

// Load the CSV, convert numeric fields, then hand the rows to the chart function.
d3.csv("data/Ex5_TV_energy.csv", d => {
    return {
        brand: d.brand,
        technology: d.screen_tech === "LCD (LED)" ? "LED" : d.screen_tech,
        screenSize: +d.screensize,
        energy: d.energy_consumpt.trim() === "" ? NaN : +d.energy_consumpt,
        stars: d.star2.trim() === "" ? NaN : +d.star2,
        count: +d.count
    };
}).then(data => {
    const validRows = data.filter(d => Number.isFinite(d.energy) && d.energy >= 0
        && Number.isFinite(d.stars) && d.stars >= 0);
    if (validRows.length === 0) throw new Error("No valid TV records were found.");
    createScatterPlot(validRows);
}).catch(error => {
    d3.select("#scatterplot").attr("aria-busy", "false")
        .select(".chart-status").attr("class", "chart-status chart-error")
        .text("The TV data could not be loaded. Please open the page through a local web server and check the CSV path.");
    console.error("Scatter plot:", error);
});
