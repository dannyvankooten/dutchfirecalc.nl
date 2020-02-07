// set the dimensions and margins of the graph
var el = document.getElementById('graph');
var margin = { top: 4, right: 4, bottom: 20, left: 40 },
    width = el.clientWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select(el)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var parseDate = d3.timeParse("%Y.%m");
var data, x, y;

function parseRow(d, i) {
    // ignore all rows except every 12th  
    if (i % 12 > 0) {
        return;
    }

    return {
        date: parseDate(d.Date.replace(/\.1$/, ".10")),
        price: +d.P,
        dividend: +d.D,
        cpi: +d.CPI
    }
}

d3.csv("/data.csv", parseRow).then(function (rawData) {
    // adjust prices for inflation
    var current_cpi = rawData[rawData.length - 1].cpi;
    data = rawData.map(function (d) {
        d.price = current_cpi / d.cpi * d.price;
        return d;
    })

    // add X-axis
    x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.date; }))
        .range([0, width]);

    // Add Y axis
    y = d3.scaleLog()
        .domain(d3.extent(data, function (d) { return d.price; }))
        .range([height, 0])

    y.ticks(4)

    // add X-grid
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(x)
            .tickSize(height)
            .tickFormat("")
        )

    // add Y-grid    
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .ticks(3)
            .tickSize(-width)
            .tickFormat("")
        )

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add Y-axis   
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y)
            .ticks(5, "$d")
        );

    // Add the line
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", d3.line()
            .x(function (d) { return x(d.date) })
            .y(function (d) { return y(d.price) })
        )
});

document.body.addEventListener('mouseover', function(evt) {
    if (evt.target.parentElement.dataset.start) {
        let data = evt.target.parentElement.dataset;
        highlightPeriod(data.start, data.end)
    } else {
        clearHighlight();
    }
}, true);

function clearHighlight() {
    svg.select('.highlight').remove();
}

function highlightPeriod(start, end) {
    clearHighlight();

    start = start.split('-')[0];
    end = end.split('-')[0];

    svg.append("path")
        .datum(data.filter(function(d) {
            return d.date.getFullYear() > start && d.date.getFullYear() < end;
        }))
        .attr("class", "line highlight")
        .attr("d", d3.line()
            .x(function (d) { return x(d.date) })
            .y(function (d) { return y(d.price) })
        )
}