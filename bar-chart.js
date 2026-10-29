// Chart function: compare the supplied mean energy values for 55-inch TVs.
const createBarChart = (data) => {
    const container = d3.select("#bar-chart");
    const colours = d3.scaleOrdinal()
        .domain(["LCD", "LED", "OLED"])
        .range(["#0072b2", "#d62728", "#f2c811"]);

    const drawChart = () => {
        // Sizes and margins: energy is vertical, technology is horizontal.
        const viewW = container.node().clientWidth;
        if (viewW <= 0) return;
        const viewH = 320;
        const margin = { top: 32, right: 18, bottom: 50, left: 48 };
        const chartW = viewW - margin.left - margin.right;
        const chartH = viewH - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${viewW} ${viewH}`)
            .attr("role", "img");
        svg.append("desc")
            .text(data.map(d => `${d.technology}: ${d3.format(".1f")(d.energy)} kilowatt-hours per year.`).join(" "));

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Scales: categories across the bottom, energy from a zero baseline.
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.technology))
            .range([0, chartW])
            .padding(0.28);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energy)])
            .nice()
            .range([chartH, 0]);

        chart.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-chartW).tickFormat(""));
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${chartH})`)
            .call(d3.axisBottom(xScale).tickSizeOuter(0));
        chart.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(",.0f")).tickSizeOuter(0));

        // Bind the technology rows to bars and numeric labels.
        const barAndLabel = chart.selectAll(".bar-row")
            .data(data)
            .join("g")
            .attr("class", "bar-row")
            .attr("transform", d => `translate(${xScale(d.technology)}, 0)`);

        barAndLabel.append("rect")
            .attr("y", d => yScale(d.energy))
            .attr("width", xScale.bandwidth())
            .attr("height", d => chartH - yScale(d.energy))
            .attr("rx", 3)
            .attr("fill", d => colours(d.technology));
        barAndLabel.append("text")
            .attr("class", "value-label")
            .attr("x", xScale.bandwidth() / 2)
            .attr("y", d => (yScale(d.energy) + chartH) / 2)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .style("fill", d => d.technology === "OLED" ? "#292f2a" : "#fffefa")
            .text(d => d3.format(".1f")(d.energy));

        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left)
            .attr("y", 15)
            .text("Mean annual energy (kWh/year)");
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left + chartW / 2)
            .attr("y", viewH - 9)
            .attr("text-anchor", "middle")
            .text("Screen technology");
    };

    container.select(".chart-status").remove();
    container.attr("aria-busy", "false");
    drawChart();
    const resizeObserver = new ResizeObserver(drawChart);
    resizeObserver.observe(container.node());
};

// Bracket notation accesses the original CSV header, including its punctuation.
d3.csv("data/Ex5_TV_energy_55inchtv_byScreenType.csv", d => {
    const energy = d["Mean(Labelled energy consumption (kWh/year))"];
    return {
        technology: d.Screen_Tech,
        energy: energy.trim() === "" ? NaN : +energy
    };
}).then(data => {
    const validRows = data.filter(d => Number.isFinite(d.energy) && d.energy >= 0);
    if (validRows.length === 0) throw new Error("No valid 55-inch summary values were found.");
    createBarChart(validRows);
}).catch(error => {
    d3.select("#bar-chart").attr("aria-busy", "false")
        .select(".chart-status").attr("class", "chart-status chart-error")
        .text("The 55-inch summary could not be loaded. Please check its CSV path and use a local web server.");
    console.error("Bar chart:", error);
});
