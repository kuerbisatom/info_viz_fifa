// Get Data from Wikidata
// https://query.wikidata.org/

// SELECT DISTINCT ?countryLabel ?languageLabel
// {
//   ?country wdt:P31 wd:Q6256 ;
//            wdt:P37 ?language .
//   SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
// }
// ORDER BY ?countryLabel
var margin = {top: 100, right: 20, bottom: 10, left: 100},
width = 800 - margin.left - margin.right,
height = 1000 - margin.top - margin.bottom;

var svg_bar_chart;
var line;

var full_dataset;

var color_scale;

data = [
  {"Label":"Trying","languageLabel":[
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
  ]},
  {"Label":"to","languageLabel":[
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
  ]},
  {"Label":"Figure","languageLabel":[
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
  ]},
  {"Label":"Something","languageLabel":[
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
  ]},
  {"Label":"out","languageLabel":[
    {"Label":"Trying","size":5},
    {"Label":"Trying","size":5},
  ]},

]

$(document).ready(function(){
    language = data.map(d => d.Label);
    language.reverse();

    yscale = d3.scaleBand()
    .domain(language)
    .rangeRound([height,0]);
    //yscale.paddingInner(0.5);

    xscale = d3.scaleLinear()
    .domain([0,60])
    .rangeRound([margin.left,width])
    .nice();

    svg_bar_chart = d3
    .select("#lolipop_chart")
    .append("svg") // we are appending an svg to the div 'bar_chart'
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.left + margin.right);

    var yaxis = d3
    .axisLeft() // we are creating a d3 axis
    .scale(yscale); // fit to our scale


    var xAxis = d3
    .axisBottom() // we are creating a d3 axis
    .scale(xscale); // fit to our scale

    svg_bar_chart
    .append("g") // we are creating a 'g' element to match our yaxis
    .attr("class", "yaxis") // we are giving it a css style
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(yaxis);

    svg_bar_chart
    .append("g") // we are creating a 'g' element to match our yaxis
    .attr("class", "xaxis") // we are giving it a css style
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg_bar_chart.append("g")
    .selectAll("g")
    .data(data,d => console.log(d))
    .join("g") // for each item, we are appending a rectangle
    .attr("id", "data")
    .selectAll("rect")
    .data(d => d.languageLabel)
    .join("rect")
    .attr("width", function(d) {return xscale(d.count) - margin.left})
    .attr("height", function (d) {
      return 10
    })
    .attr("fill","grey")
    .attr("x", margin.left)
    .attr("y", function (d) {
      return yscale(d.language) + yscale.bandwidth()/2 - 1;
    })
});
