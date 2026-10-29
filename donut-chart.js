// Chart function: switch between combined totals and supplied technology means.
const createDonutChart = (datasets) => {
    const container = d3.select("#donut-chart");
    const controls = d3.select("#donut-controls");
    let selectedTechnology = null;
    const colours = d3.scaleOrdinal()
        .domain(["LCD", "LED", "OLED"])
        .range(["#0072b2", "#d62728", "#f2c811"]);

    // Selecting a slice or its legend button performs the same action.
    const selectTechnology = (technology) => {
        selectedTechnology = selectedTechnology === technology ? null : technology;
        drawChart();
    };

    const drawChart = () => {
        // Keep the selected measure when resizing the chart.
        const metric = controls.select("input:checked").property("value");
        const isMean = metric === "mean";
        const data = datasets[metric];
        const totalEnergy = d3.sum(data, d => d.energy);
        const formatEnergy = d3.format(isMean ? ",.1f" : ",.0f");
        const selected = data.find(d => d.technology === selectedTechnology);

        d3.select("#donut-heading").text(isMean
            ? "Mean energy by technology" : "Combined energy by technology");
        d3.select("#donut-intro").text(isMean
            ? "Mean annual energy consumption per TV for each screen technology across all screen sizes, from the supplied summary."
            : "A count-weighted estimate of annual energy across the TVs represented in the dataset, grouped by screen technology.");
        d3.select("#donut-note").text(isMean
            ? "Each arc is proportional to its technology’s supplied mean. These are comparisons of means, not shares of combined TV energy."
            : "Calculated by energy consumption to the number of TV entries.");

        // Keyed joins keep the native buttons and keyboard focus during redraws.
        const legend = d3.select("#donut-legend");
        const legendItems = legend.selectAll("li")
            .data(data, d => d.technology)
            .join("li");
        const legendButtons = legendItems.selectAll("button")
            .data(d => [d])
            .join("button")
            .attr("type", "button")
            .attr("class", "donut-option")
            .classed("is-selected", d => d.technology === selectedTechnology)
            .attr("aria-pressed", d => String(d.technology === selectedTechnology))
            .on("click", (event, d) => selectTechnology(d.technology));
        legendButtons.selectAll(".swatch")
            .data(d => [d])
            .join("span")
            .attr("class", d => `swatch ${d.technology.toLowerCase()}`)
            .attr("aria-hidden", "true");
        legendButtons.selectAll(".donut-label")
            .data(d => [d])
            .join("span")
            .attr("class", "donut-label")
            .text(d => d.technology === "LED" ? "LED / LCD (LED)" : d.technology);
        legendButtons.selectAll(".donut-value")
            .data(d => [d])
            .join("span")
            .attr("class", "donut-value")
            .text(d => isMean ? `${formatEnergy(d.energy)} kWh/yr`
                : `${formatEnergy(d.energy)} kWh/yr · ${d3.format(".1%")(d.energy / totalEnergy)}`);

        const detailText = selected
            ? `${selected.technology}: ${formatEnergy(selected.energy)} kWh/year${isMean ? " (mean)" : ` · ${d3.format(".1%")(selected.energy / totalEnergy)} of combined energy`}`
            : "";
        const detail = d3.select("#donut-detail");
        if (detail.text() !== detailText) detail.text(detailText);
        d3.select("#donut-reset").property("hidden", !selected);

        // Sizes: the ring adapts to the available width.
        const viewW = container.node().clientWidth;
        if (viewW <= 0) return;
        const viewH = 320;
        const radius = Math.min(viewW, viewH) / 2 - 18;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${viewW} ${viewH}`)
            .attr("role", "img");
        svg.append("desc")
            .text(data.map(d => isMean
                ? `${d.technology}: mean ${formatEnergy(d.energy)} kilowatt-hours per TV per year.`
                : `${d.technology}: ${formatEnergy(d.energy)} kilowatt-hours per year, ${d3.format(".1%")(d.energy / totalEnergy)}.`).join(" "));

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
            .attr("class", "donut-slice")
            .attr("d", arc)
            .attr("fill", d => colours(d.data.technology))
            .attr("opacity", d => !selectedTechnology || d.data.technology === selectedTechnology ? 1 : 0.3)
            .attr("stroke", d => d.data.technology === selectedTechnology ? "#292f2a" : "none")
            .attr("stroke-width", 2)
            .on("click", (event, d) => selectTechnology(d.data.technology));

        chart.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -23)
            .attr("class", "axis-label")
            .text(selected ? selected.technology : "");
        chart.append("text")
            .attr("text-anchor", "middle")
            .attr("y", selected ? 5 : -3)
            .attr("fill", "#292f2a")
            .attr("font-size", isMean ? Math.min(23, radius * 0.2) : Math.min(30, radius * 0.25))
            .attr("font-weight", 700)
            .text(selected ? (isMean ? formatEnergy(selected.energy) : d3.format(".3s")(selected.energy))
                : (isMean ? "Mean energy" : d3.format(".3s")(totalEnergy)));
        chart.append("text")
            .attr("text-anchor", "middle")
            .attr("y", selected ? 28 : 20)
            .attr("class", "axis-label")
            .text(isMean ? "kWh/year" : "kWh/year · weighted");
    };

    container.select(".chart-status").remove();
    container.attr("aria-busy", "false");
    controls.property("disabled", false);
    controls.selectAll("input").on("change", drawChart);
    d3.select("#donut-reset").on("click", () => {
        selectedTechnology = null;
        drawChart();
        d3.select("#donut-legend button").node().focus();
    });
    drawChart();
    const resizeObserver = new ResizeObserver(drawChart);
    resizeObserver.observe(container.node());
};

// Load both measures once: totals from grouped rows, means from the summary CSV.
Promise.all([
    d3.csv("data/Ex5_TV_energy.csv", d => {
        return {
            technology: d.screen_tech === "LCD (LED)" ? "LED" : d.screen_tech,
            energy: d.energy_consumpt.trim() === "" ? NaN : +d.energy_consumpt,
            count: d.count.trim() === "" ? NaN : +d.count
        };
    }),
    d3.csv("data/Ex5_TV_energy_Allsizes_byScreenType.csv", d => {
        const energy = d["Mean(Labelled energy consumption (kWh/year))"];
        return {
            technology: d.Screen_Tech,
            energy: energy.trim() === "" ? NaN : +energy
        };
    })
]).then(([data, means]) => {
    const validRows = data.filter(d => Number.isFinite(d.energy) && d.energy >= 0
        && Number.isFinite(d.count) && d.count > 0);
    const totals = d3.rollups(validRows,
        rows => d3.sum(rows, d => d.energy * d.count),
        d => d.technology);
    const chartData = totals.map(([technology, energy]) => ({ technology, energy }));
    chartData.sort((a, b) => d3.ascending(a.technology, b.technology));
    if (!(d3.sum(chartData, d => d.energy) > 0)) throw new Error("No positive energy totals were found.");
    const validMeans = means.filter(d => Number.isFinite(d.energy) && d.energy >= 0);
    validMeans.sort((a, b) => d3.ascending(a.technology, b.technology));
    if (!(d3.sum(validMeans, d => d.energy) > 0)) throw new Error("No positive technology means were found.");
    createDonutChart({ total: chartData, mean: validMeans });
}).catch(error => {
    d3.select("#donut-chart").attr("aria-busy", "false")
        .select(".chart-status").attr("class", "chart-status chart-error")
        .text("The technology data could not be loaded. Please check the TV and all-sizes summary CSV paths and use a local web server.");
    console.error("Donut chart:", error);
});
