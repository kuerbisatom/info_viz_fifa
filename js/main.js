var data;

var margin = {top: 10, right: 30, bottom: 30, left: 40},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

var dispatch;

var svg_line_chart, svg_violin_chart;

$(document).ready(function(){
  d3.csv("./res/FIFA_players_15_20.csv").then(function(dataset){
    data = dataset;

    create_button_row();

    create_chloropletMap();

    create_violinChart();

    create_lineChart();

    create_sankeyDiagram();


    //prepare_event();

  });
});

function create_button_row() {
    var button_row = d3.select('#player')
      .append('select')
      .attr('class', 'selectpicker show-tick')
      .attr('data-live-search', 'true')
      .attr('data-width', '350')
      .attr('data-style', 'btn-primary')
      .selectAll("option")
      .data(data)
        .join("option")
          .attr("data-tokens", d => d.sofifa_id)
          .text(d => d.long_name);

      //$('.selectpicker').selectpicker('refresh');

      var button_row = d3.select('#team')
        .append('select')
        .attr('class', 'selectpicker show-tick')
        .attr('data-live-search', 'true')
        .attr('data-width', '350')
        .attr('data-style', 'btn-primary')
        .selectAll("option")
        .data(data)
          .join("option")
            .attr("data-tokens", d => d.sofifa_id)
            .text(d => d.long_name);

      //$('.selectpicker').selectpicker('refresh');

        var button_row = d3.select('#country')
          .append('select')
          .attr('class', 'selectpicker show-tick')
          .attr('data-live-search', 'true')
          .attr('data-width', '350')
          .attr('data-style', 'btn-primary')
          .selectAll("option")
          .data(data)
            .join("option")
              .attr("data-tokens", d => d.sofifa_id)
              .text(d => d.long_name);

      $('.selectpicker').selectpicker('refresh');
};

function create_chloropletMap(){
  var svg_1 = d3.select('#choropleth')
    .append('svg')
    .attr("width", 2.5*(width) + margin.left + margin.right)
    .attr("height", 1.3*(height) + margin.left + margin.right)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");
};

function create_lineChart (){
  // Line Chart
  var svg_2 = d3.select('#line')
  .append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.left + margin.right)
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");


  var y = d3.scaleLinear()
  .domain([0,100])
  .range([height,0])
  .nice();
  var x = d3.scaleTime()
  .domain([new Date(2015, 0, 1, 0), new Date(2020, 0, 1, 0)])
  .range([0, width])
  .nice();

  svg_2.append("g").call(d3.axisLeft(y));

  svg_2.append("g")
  .call(d3.axisBottom(x))
  .attr("transform", "translate(0, " + height + ")");

  var years = [15,16,17,18,19,20];
  var attributes = ['overall','Defending_Mean','Attacking_Mean','Gk_Mean', 'Mentality_Mean', 'Movement_Mean','Skill_Mean', 'potential'];

  // attrib = attributes.map(d=> ({
  //   name: d,
  //   series: years.map( x=> ({
  //     year: x,
  //   }))
  // }));
  //
  // line = d3.line()
  //   .y(d => y(data[0][d.var])})
  //   .x(d => x(new Date(d.year, 0, 1, 0))})
  //   .curve(d3.curveCatmullRom.alpha(0.5));


  const path = svg_2.append("g")
  .attr("fill", "none")
  .attr("stroke", "grey")
  .attr("stroke-width", 1.5)
  .attr("stroke-linejoin", "round")
  .selectAll("path")
  .data(attributes)
    .join("path")
    .style("mix-blend-mode", "multiply")
    // .attr("d", d => line(d))
    .attr("d", d => d3.line().curve(d3.curveCatmullRom.alpha(0.5))
              ([[x(new Date(2015,0,1,0)),y(data[0][d + '_15'])],
              [x(new Date(2016,0,1,0)),y(data[0][d + '_16'])],
              [x(new Date(2017,0,1,0)),y(data[0][d + '_17'])],
              [x(new Date(2018,0,1,0)),y(data[0][d + '_18'])],
              [x(new Date(2019,0,1,0)),y(data[0][d + '_19'])],
              [x(new Date(2020,0,1,0)),y(data[0][d + '_20'])],
            ]
          )
        );
};

function create_violinChart (){
  var attack_position = ["RW", "LW", "ST", "LF", "RF", "CF", "RS", "LS"];
  var center_position = ["LM", "CM", "RM", "CAM", "RCM", "CDM", "LCM", "LDM", "RDM", "LAM", "RAM"];
  var defend_position = ["LCB", "RCB", "LB", "RB", "CB", "LWB", "RWB" ];

  selected_data = data.filter(function(d){ if (d.nationality == 'Portugal') {return d;}});
  gk_data = selected_data.filter(function(d){if (d.team_position_20 == "GK") {return d;}})
  def_data = selected_data.filter(function(d){if (defend_position.includes(d.team_position_20)) {return d;}})
  cen_data = selected_data.filter(function(d){if (center_position.includes(d.team_position_20)) {return d;}})
  att_data = selected_data.filter(function(d){if (attack_position.includes(d.team_position_20)) {return d;}})

  // Add SVG to Violin Row
  var svg = d3.select('#violin')
  .append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.left + margin.right)
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");

  // Y-Scale
  var y = d3.scaleLinear()
  .domain(d3.extent(data.map(d => d.height_cm)))
  .range([height,0])
  .nice();

  var x = d3.scaleBand()
  .domain(["Goalkeeper", "Defender", "Center", "Attack"])
  .range([0, width])

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
  .call(d3.axisBottom(x))
  .attr("transform", "translate(0, " + height + ")");

  create_areaChart(att_data, 4, svg, x, y);
  create_areaChart(cen_data, 2, svg, x, y);
  create_areaChart(def_data, 3, svg, x, y);
  create_areaChart(gk_data, 1, svg, x, y);

  svg_violin_chart = svg;
};

function create_sankeyDiagram() {
  var svg = d3.select('#sankey')
  .append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.left + margin.right)
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");

};

function create_areaChart(data, index, node, x, y){
  // Create BarChart
  var myColor = d3.scaleSequential().domain([1, 10])
  .interpolator(d3.interpolatePuRd);

  let bins =  d3.bin().thresholds(20)(data.map(d=>d.height_cm))
  var l_bins_max = d3.max(bins.map(d => d.length))

  var xNum = d3.scaleLinear()
    .range([(index-1)*x.bandwidth(), x.bandwidth()*index])
    .domain([-l_bins_max,l_bins_max]);

  var g = node.append("g")
  g.append("g")
    .append("path")
    .datum(bins)
    .attr("fill", "grey")
    //.attr("stroke", "#69b3a2")
    //.attr("stroke-width", 1.5)
    .attr("d", d3.area()
        .x0(d => xNum(d.length))
        .x1(d => xNum(-d.length))
        .y(d => y((d.x0)))
        .curve(d3.curveCatmullRom)
    );

  // Add the Boxplot
  var data_sorted = data.map(d => d.height_cm).sort(d3.ascending);
  console.log(data_sorted);
  var q1 = d3.quantile(data_sorted, .25);
  var median = d3.quantile(data_sorted, .5);
  var q3 = d3.quantile(data_sorted, .75);
  var interQuantileRange = q3 - q1;
  var min = q1 - 1.5 * interQuantileRange;
  var max = q1 + 1.5 * interQuantileRange;

  var center = x.bandwidth()*index - x.bandwidth()/2;
  var width = x.bandwidth()/8;

  var g_b = g.append("g")

  g_b.append("line")
    .attr("x1", center)
    .attr("x2", center)
    .attr("y1", y(min))
    .attr("y2", y(q1))
    .attr("stroke", "black");
  g_b.append("line")
      .attr("x1", center)
      .attr("x2", center)
      .attr("y1", y(q3))
      .attr("y2", y(max))
      .attr("stroke", "black");

  g_b.append("rect")
  .attr("x", center - width/2)
  .attr("y", y(q3) )
  .attr("height", (y(q1)-y(q3)) )
  .attr("width", width )
  .attr("fill", "transparent")
  .attr("stroke", "black");

  g_b.selectAll("toto")
    .data([min, median, max])
    .enter()
    .append("line")
      .attr("x1", center-width/2)
      .attr("x2", center+width/2)
      .attr("y1", function(d){ return(y(d))} )
      .attr("y2", function(d){ return(y(d))} )
      .attr("stroke", "black");

}


function prepare_event() {

  dispatch = d3.dispatch("lineEvent");

  svg_line_chart.selectAll("path").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_violin_chart.selectAll("path").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  dispatch.on("lineEvent", function (category) {
    if (selected_line != null) {
      d3.select("highlight").remove()
    }

    if (selectedBar != null) {
      selectedBar.attr("fill", function (d) {
        return "gray";
      });
    }

    selectedBar = d3.selectAll("rect").filter(function (d) {
    return d.title == movie.title;
    });
  });
};

/*
world = d3.json("./../res/countries-50m.json").then(function(data) {
//countries = topojson.feature(data, data.objects.countries);
//console.log(countries);

countries = new Map(data.objects.countries.geometries.map(d => [d.id, d.properties]));

format = d => `${d}%`;

path = d3.geoPath();
var projection = d3.geoMercator()
.scale(70)
.center([0,20])
.translate([width / 2, height / 3]);

color = d3.scaleQuantize([1, 10], d3.schemeBlues[9]);


var svg = d3.select("#test").append("svg")
.style("display","block")
.attr("viewBox", [0, 0, width, height]);

svg.append("g")
.attr("transform", "translate(610, 20)");
//       .append(() => legend({color, title: "test",  width: 260}));

svg.append("g")
.selectAll("path")
.data(topojson.feature(data, data.objects.countries).features)
.join("path")
//                              //.attr("fill", d => color(data.get(d.id)))
.attr("fill", "grey")
.attr("d", path)
.append("title")
//                                .text(d => `${d.properties.name}, ${countries.get(d.id.slice(0, 2)).name}
//                        ${format(data.get(d.id))}`);

svg.append("path")
.datum(topojson.mesh(data, data.objects.countries, (a, b) => a !== b))
.attr("fill", "none")
.attr("stroke", "white")
.attr("stroke-linekoin", "round")
.attr("d", path);

});
*/
