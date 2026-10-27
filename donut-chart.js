// Chart function: show count-weighted energy totals across all screen sizes.
const createDonutChart = (data) => {
    const container = d3.select("#donut-chart");
    const totalEnergy = d3.sum(data, d => d.energy);
    const colours = d3.scaleOrdinal()
        .domain(["LCD", "LED", "OLED"])
        .range(["#0072b2", "#d62728", "#f2c811"]);

    // Legend values are HTML so they stay readable on narrow screens.
    const legendItems = d3.select("#donut-legend")
        .selectAll("li")
        .data(data)
        .join("li");
    legendItems.append("span")
        .attr("class", d => `swatch ${d.technology.toLowerCase()}`)
        .attr("aria-hidden", "true");
    legendItems.append("span")
        .text(d => d.technology === "LED" ? "LED / LCD (LED)" : d.technology);
    legendItems.append("span")
        .attr("class", "donut-value")
        .text(d => `${d3.format(",.0f")(d.energy)} kWh/yr · ${d3.format(".1%")(d.energy / totalEnergy)}`);

    const drawChart = () => {
        // Sizes: the ring adapts to the available width.
        const viewW = container.node().clientWidth;
        if (viewW <= 0) return;
        const viewH = 320;
        const radius = Math.min(viewW, viewH) / 2 - 18;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${viewW} ${viewH}`)
            .attr("role", "img")
            .attr("aria-label", "Donut chart showing estimated annual energy shares by screen technology across all represented TVs.");
        svg.append("title").text("Combined energy by screen technology");
        svg.append("desc")
            .text(data.map(d => `${d.technology}: ${d3.format(",.0f")(d.energy)} kilowatt-hours per year, ${d3.format(".1%")(d.energy / totalEnergy)}.`).join(" "));

        const chart = svg.append("g")
            .attr("transform", `translate(${viewW / 2}, ${viewH / 2})`);

        // Pie calculates angles; arc uses an inner radius to create the hole.
        const pie = d3.pie()
            .sort(null)
            .value(d => d.energy);
        const arc = d3.arc()
            .innerRadius(radius * 0.66)
            .outerRadius(radius)
            .padAngle(0.025)
            .cornerRadius(4);

        chart.selectAll("path")
            .data(pie(data))
            .join("path")
            .attr("d", arc)
            .attr("fill", d => colours(d.data.technology))
            .append("title")
            .text(d => `${d.data.technology}: ${d3.format(",.0f")(d.data.energy)} kWh/year (${d3.format(".1%")(d.data.energy / totalEnergy)})`);

        chart.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -3)
            .attr("fill", "#292f2a")
            .attr("font-size", Math.min(30, radius * 0.25))
            .attr("font-weight", 700)
            .text(d3.format(".3s")(totalEnergy));
        chart.append("text")
            .attr("text-anchor", "middle")
            .attr("y", 20)
            .attr("class", "axis-label")
            .text("kWh/year · weighted");
    };

    container.select(".chart-status").remove();
    container.attr("aria-busy", "false");
    drawChart();
    const resizeObserver = new ResizeObserver(drawChart);
    resizeObserver.observe(container.node());
};

// The all-sizes summary contains means, so derive totals from the grouped TV CSV.
d3.csv("data/Ex5_TV_energy.csv", d => {
    return {
        technology: d.screen_tech === "LCD (LED)" ? "LED" : d.screen_tech,
        energy: d.energy_consumpt.trim() === "" ? NaN : +d.energy_consumpt,
        count: d.count.trim() === "" ? NaN : +d.count
    };
}).then(data => {
    const validRows = data.filter(d => Number.isFinite(d.energy) && d.energy >= 0
        && Number.isFinite(d.count) && d.count > 0);
    const totals = d3.rollups(validRows,
        rows => d3.sum(rows, d => d.energy * d.count),
        d => d.technology);
    const chartData = totals.map(([technology, energy]) => ({ technology, energy }));
    chartData.sort((a, b) => d3.ascending(a.technology, b.technology));
    if (!(d3.sum(chartData, d => d.energy) > 0)) throw new Error("No positive energy totals were found.");
    createDonutChart(chartData);
}).catch(error => {
    d3.select("#donut-chart").attr("aria-busy", "false")
        .select(".chart-status").attr("class", "chart-status chart-error")
        .text("The technology totals could not be loaded. Please check the TV CSV and use a local web server.");
    console.error("Donut chart:", error);
});
