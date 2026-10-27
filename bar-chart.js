// Chart function: compare the supplied mean energy values for 55-inch TVs.
const createBarChart = (data) => {
    const container = d3.select("#bar-chart");
    const colours = d3.scaleOrdinal()
        .domain(["LCD", "LED", "OLED"])
        .range(["#0072b2", "#d62728", "#f2c811"]);

    const drawChart = () => {
        // Sizes and margins: reserve space for technology and value labels.
        const viewW = container.node().clientWidth;
        if (viewW <= 0) return;
        const viewH = 320;
        const margin = { top: 32, right: 52, bottom: 50, left: 48 };
        const chartW = viewW - margin.left - margin.right;
        const chartH = viewH - margin.top - margin.bottom;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${viewW} ${viewH}`)
            .attr("role", "img")
            .attr("aria-label", "Horizontal bar chart comparing mean annual energy consumption of 55-inch LCD, LED and OLED TVs.");
        svg.append("title").text("Mean annual energy consumption for 55-inch TVs");
        svg.append("desc")
            .text(data.map(d => `${d.technology}: ${d3.format(".1f")(d.energy)} kilowatt-hours per year.`).join(" "));

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Scales: a zero baseline makes bar lengths comparable.
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.energy)])
            .nice()
            .range([0, chartW]);
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.technology))
            .range([0, chartH])
            .padding(0.38);

        chart.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${chartH})`)
            .call(d3.axisBottom(xScale).ticks(viewW < 400 ? 4 : 5).tickSize(-chartH).tickFormat(""));
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, ${chartH})`)
            .call(d3.axisBottom(xScale).ticks(viewW < 400 ? 4 : 5).tickSizeOuter(0));
        chart.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale).tickSize(0).tickPadding(8))
            .select(".domain").remove();

        // Bind the technology rows to bars and numeric labels.
        const barAndLabel = chart.selectAll(".bar-row")
            .data(data)
            .join("g")
            .attr("class", "bar-row")
            .attr("transform", d => `translate(0, ${yScale(d.technology)})`);

        barAndLabel.append("rect")
            .attr("width", d => xScale(d.energy))
            .attr("height", yScale.bandwidth())
            .attr("rx", 3)
            .attr("fill", d => colours(d.technology))
            .append("title")
            .text(d => `${d.technology}: ${d3.format(".1f")(d.energy)} kWh/year`);
        barAndLabel.append("text")
            .attr("class", "value-label")
            .attr("x", d => xScale(d.energy) + 7)
            .attr("y", yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d3.format(".1f")(d.energy));

        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", margin.left + chartW / 2)
            .attr("y", viewH - 9)
            .attr("text-anchor", "middle")
            .text("Mean annual energy (kWh/year)");
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
