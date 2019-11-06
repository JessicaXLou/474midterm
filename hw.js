'use strict';

(function() {

  let data = "no data";
  let filteredData = "no data"
  let svgContainer = ""; // keep SVG reference in global scope
  let genFilter = "all";
  let legFilter = "all";
  const colors = {
    "Bug": "#4E79A7",
    "Dark": "#A0CBE8",
    "Dragon": "#FBFF00",
    "Electric": "#F28E2B",
    "Fairy": "#FFBE&D",
    "Fighting": "#59A14F",
    "Fire": "#8CD17D",
    "Ghost": "#B6992D",
    "Grass": "#499894",
    "Ground": "#86BCB6",
    "Ice": "#86BCB6",
    "Normal": "#E15759",
    "Poison": "#FF9D9A",
    "Psychic": "#79706E",
    "Rock": "#460095",
    "Steel": "#BAB0AC",
    "Water": "#D37295"
  }

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("pokemon.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData; // assign data as global variable
    filteredData = csvData;

    // get arrays of fertility rate data and life Expectancy data
    let sp_def_data = data.map((row) => parseFloat(row["Sp. Def"]));
    let total_data = data.map((row) => parseFloat(row["Total"]));

    // find data limits
    let axesLimits = findMinMax(sp_def_data, total_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "Sp. Def", "Total");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();

    // add dropdown menu
    let dropDownGeneration = d3.select("#filter-generation").append("select")
        .attr("name", "Generation");

    let dropDownLegendary = d3.select("#filter-legendary").append("select")
        .attr("name", "Legendary");

    // add options to dropdown menu
    var generations = ["all", 1, 2, 3, 4, 5, 6];

    generations.forEach( function(gen) {
      dropDownGeneration.append('option').text(gen);
    })
    
    var legendaries = ["all", "True", "False"];

    legendaries.forEach( function(leg) {
      dropDownLegendary.append('option').text(leg);
    })

    // add filter functionality to dropdown menu
    dropDownGeneration.on("change", function() {
      // remove previous points & tooltip
      svgContainer.selectAll('.point').remove();
      svgContainer.selectAll(".tooltip").remove();

      // change filtered data
      genFilter = this.value; 
      if (genFilter == legFilter) { // both have all selected
        filteredData = csvData;
      } else if (genFilter == "all") { // generation has all selected
        filteredData = csvData.filter((row) => row["Legendary"] == legFilter);
      } else if (legFilter == "all") { // legendary has all selected
        filteredData = csvData.filter((row) => row["Generation"] == genFilter);
      } else { // neither have all selected
        filteredData = csvData.filter((row) => (row["Generation"] == genFilter && row["Legendary"] == legFilter));
      }
      
      // plot new points
      plotData(mapFunctions);
    });

    dropDownLegendary.on("change", function() {
      // remove previous points & tooltip
      svgContainer.selectAll('.point').remove();
      svgContainer.selectAll(".tooltip").remove();

      // change filtered data
      legFilter = this.value;
      if (genFilter == legFilter) { // both have all selected
        filteredData = csvData;
      } else if (genFilter == "all") { // generation has all selected
        filteredData = csvData.filter((row) => row["Legendary"] == legFilter);
      } else if (legFilter == "all") { // legendary has all selected
        filteredData = csvData.filter((row) => row["Generation"] == genFilter);
      } else { // neither have all selected
        filteredData = csvData.filter((row) => (row["Generation"] == genFilter && row["Legendary"] == legFilter));
      }

      //plot new points
      plotData(mapFunctions);
    });

    // add legend
    // add dots
    let legend = d3.select("#legend")
      .append("svg")
      .attr('width', 500)
      .attr('height', 200);

    let i = 0;
    Object.values(colors).forEach( function(color) {
      legend.append("circle")
          .attr("cx", 0)
          .attr("cy", (i*25))
          .attr("r", 7)
          .style("fill", color);
      i++;
    })

    // add labels
    i = 0;
    Object.keys(colors).forEach( function(type) {
      legend.append("text")
          .attr("x", 20)
          .attr("y", (d,i) => ( i*25 ))
          .text(type)
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle");
      i++;
    })
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Pokemon: Special Defense vs Total Stats");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Sp. Def');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Total');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = filteredData.map((row) => +row["Name"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(filteredData)
      .enter()
      .append('circle')
        .attr('class', 'point')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', 5)
        .attr('fill', (d) => colors[d["Type 1"]])
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          let content = "Pokemon: " + d["Name"] + 
                        "<br/>";
          if (d["Type 2"] == "") {
            content += "Type: " + d["Type 1"];
          } else {
            content += "Types: " + d["Type 1"] + 
                        " & " + d["Type 2"];
          }
          div.html(content)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();