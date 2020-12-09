var data, country_data, team_data;
var margin = {top: 20, right: 30, bottom: 30, left: 60},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;
var dispatch;
var svg_line_chart, svg_violin_chart;
var selectedLine, selectedViolin;
var attack_position = ["RW", "LW", "ST", "LF", "RF", "CF", "RS", "LS"];
var center_position = ["LM", "CM", "RM", "CAM", "RCM", "CDM", "LCM", "LDM", "RDM", "LAM", "RAM"];
var defend_position = ["LCB", "RCB", "LB", "RB", "CB", "LWB", "RWB" ];

var x_line, y_line;

var line_color;

var year = [15,16,17,18,19,20];

$(document).ready(function(){
  d3.csv("./res/FIFA_players_15_20.csv").then(function(dataset){
    data = dataset;

    create_button_row();

    create_chloropletMap();

    create_violinChart();

    create_lineChart();

    create_sankeyDiagram();

    prepare_event();

  });
});

function create_data(selector,attribute) {
  return data.filter(function (d) { if (d[selector] == attribute) {return d} })
};

function create_button_row() {
  var country = data.map(d => d.nationality)
  var team = data.map (d => d.club_20)

  team = team.filter((v, i, a) => a.indexOf(v) === i);
  country = country.filter((v, i, a) => a.indexOf(v) === i);


  var button_row1 = d3.select('#player')
  .append('select')
  .attr('id','p')
  .attr('class', 'selectpicker show-tick')
  .attr('data-live-search', 'true')
  .attr('data-width', '350')
  .attr('data-size','8')
  .attr('data-style', 'btn-primary')
  .attr('title', 'Select Player')
  .selectAll("option")
  .data(data)
  .join("option")
  .attr("data-tokens", d => d.sofifa_id)
  .text(d => d.long_name);

  var button_row2 = d3.select('#team')
  .append('select')
  .attr('id','t')
  .attr('class', 'selectpicker show-tick')
  .attr('data-live-search', 'true')
  .attr('data-width', '350')
  .attr('data-size','8')
  .attr('data-style', 'btn-primary')
  .attr('title', 'Select Team')
  .selectAll("option")
  .data(team)
  .join("option")
  .attr("data-tokens", d => d)
  .text(d => d);



  var button_row3 = d3.select('#country')
  .append('select')
  .attr('id','c')
  .attr('class', 'selectpicker show-tick')
  .attr('data-live-search', 'true')
  .attr('data-width', '350')
  .attr('data-size','8')
  .attr('data-style', 'btn-primary')
  .attr('title', 'Select Country')
  .selectAll("option")
  .data(country)
  .join("option")
  .attr("data-tokens", d => d)
  .text(d => d);


  $('#p').on('change', function(e){
    prepare_button('long_name',this.value, "p")
  });

  $('#t').on('change', function(e){
    prepare_button('club_20',this.value, "t");
  });


  $('#c').on('change', function(e){
    // console.log(this.value,
    // this.options[this.selectedIndex].value,
    // $(this).find("option:selected").val(),);
    prepare_button('nationality',this.value, "c");
  });

  $('.selectpicker').selectpicker('render');

};

function create_chloropletMap() {
  var svg_1 = d3.select('#choropleth')
  .append('svg')
  .attr("width", 2.5*(width) + margin.left + margin.right)
  .attr("height", 1.3*(height) + margin.left + margin.right)
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");

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
};

function create_lineChart () {
  // Line Chart
  var svg = d3.select('#line')
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

  x_line = x;
  y_line = y;

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
  .call(d3.axisBottom(x))
  .attr("transform", "translate(0, " + height + ")");

  country = create_data("club_20","Real Madrid");
  line_data = create_lineChart_data(country);

  categories = line_data.series.map(d => d.type);

  line_color = d3.scaleOrdinal().domain(categories)
  .range(['#1f78b4','#a6cee3','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00'])

  // legend
  var size = 5
  svg.selectAll("mydots")
  .data(categories)
  .enter()
  .append("rect")
  .attr("x", function(d,i){ return 6 + i*(size*8+5)})
  .attr("y",  2) // 100 is where the first dot appears. 25 is the distance between dots
  .attr("width", size)
  .attr("height", size)
  .style("fill", function(d){ return line_color(d)})

  // Add one dot in the legend for each name.
  svg.selectAll("mylabels")
  .data(categories)
  .enter()
  .append("text")
  .attr("style","font-size:8px")
  .attr("x", function(d,i){ return 6 + i*(size*8+5)})
  .attr("y", 2 + size*2) // 100 is where the first dot appears. 25 is the distance between dots
  .style("fill", function(d){ return line_color(d)})
  .text(function(d){ return d.split("_")[0]})
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle")


  draw = d3.line()
  .defined(d => !isNaN(d))
  .x((d, i) => x(new Date("20" + line_data.dates[i], 0,1,0)))
  .y(d => y(d))
  .curve(d3.curveCatmullRom.alpha(0.5));

  const g = svg.append("g")
  const path = g.attr("id","line_g")
  .selectAll("g")
  .data(line_data.series)
  .join("g")
  .attr("id", d=> d.type)
  .insert("path")
  .style("mix-blend-mode", "multiply")
  .attr("fill", "none")
  .attr("stroke", d => line_color(d.type))
  .attr("stroke-width", 1.5)
  .attr("stroke-linejoin", "round")
  .attr("d",d => draw(d.values))


  svg.select("#line_g").selectAll("path").each(function(dat) {
    //for (i=2015; i<=2020; i++)
    svg.select("#line_g").selectAll("#" + dat.type).selectAll("circle")
    .data(dat.values)
    .join("circle")
    .attr("id", "highlight")
    .attr("r", 5)
    .attr("fill", line_color(dat.type))
    .attr("cx",(d, i) => x(new Date("20" + line_data.dates[i], 0,1,0)))
    //.attr("d", d=> console.log(d))
    .attr("cy",d => y(d));
  });

  svg
  .append("text")
  .attr(
    "transform",
    "translate(" + width / 2 + " ," + (height + margin.bottom) + ")"
  )
  .attr("class", "label")
  .attr("style","font-size:12px")
  .text("Year");

  svg
  .append("text")
  .attr(
    `transform`,
    `rotate(-90)`
  )
  .attr("y",-30)
  .attr("x", 0-height/2)
  .attr("class", "label")
  .attr("style","font-size:12px")
  .text("Skill Points");

  svg
  .append("text")
  .attr("id","l_display")
  .attr(
    "transform",
    "translate(" + width / 2 + " ,0)"
  )
  .attr("class", "label")
  .attr("style","font-size:12px")
  .text("Christiano Ronaldo");

  svg_line_chart = svg;


};

function create_violinChart () {


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
  .range([0, width]);

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
  .call(d3.axisBottom(x))
  .attr("transform", "translate(0, " + height + ")");

  create_areaChart(att_data, 4, svg, x, y);
  create_areaChart(cen_data, 2, svg, x, y);
  create_areaChart(def_data, 3, svg, x, y);
  create_areaChart(gk_data, 1, svg, x, y);



  svg
  .append("text")
  .attr(
    `transform`,
    `rotate(-90)`
  )
  .attr("y",-30)
  .attr("x", 0-height/2)
  .attr("class", "label")
  .attr("style","font-size:12px")
  .text("Height [cm]");

  svg
  .append("text")
  .attr("id","v_display")
  .attr(
    "transform",
    "translate(" + width / 2 + " ,0)"
  )
  .attr("class", "label")
  .attr("style","font-size:12px")
  .text("Portugal");



  g_b = svg.select("#boxplot")


  g_b.append("circle")
  .attr("r", 2.5)
  .attr("cx", x.bandwidth()*3.5)
  .attr("cy", y(create_data("long_name","Cristiano Ronaldo dos Santos Aveiro")[0].height_cm))

  g_b.append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .attr("text-anchor", "middle")
  .attr("x", x.bandwidth()*3.5)
  .attr("y", y(create_data("long_name","Cristiano Ronaldo dos Santos Aveiro")[0].height_cm)-10)
  .text("Christiano Ronaldo");

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

  // create sankey data
  s_data = create_sankey_data(data)
  console.log(s_data)
  // create sankey

};

function create_areaChart(data, index, node, x, y){

  bins =  d3.bin().thresholds(5)(data.map(d=>d.height_cm))
  bins.map(function (d) {
    switch(index) {
      case 1:
      d.type = ["overall",'potential','Gk_Mean'];
      break;
      case 2:
      d.type = ["overall",'potential','Defending_Mean','Mentality_Mean']
      break;
      case 3:
      d.type = ["overall",'potential','Movement_Mean']
      break;
      case 4:
      d.type = ["overall",'potential','Skill_Mean','Attacking_Mean']
      break;
    }
  });
  var l_bins_max = d3.max(bins.map(d => d.length))

  var xNum = d3.scaleLinear()
  .range([(index-1)*x.bandwidth(), x.bandwidth()*index])
  .domain([-l_bins_max,l_bins_max]);

  var g = node.append("g")
  g.append("g").attr("id","violin-area")
  .append("path")
  .datum(bins)
  .attr("fill", "grey")
  .attr("id","area")
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
var q1 = d3.quantile(data_sorted, .25);
var median = d3.quantile(data_sorted, .5);
var q3 = d3.quantile(data_sorted, .75);
var interQuantileRange = q3 - q1;
var min = q1 - 1.5 * interQuantileRange;
var max = q1 + 1.5 * interQuantileRange;

var center = x.bandwidth()*index - x.bandwidth()/2;
var width = x.bandwidth()/8;

var g_b = g.append("g").attr("id","boxplot")

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

function prepare_button(selector,attribute, type) {
  var temp = attribute;
  var dataset = create_data(selector,attribute);
  var t_data = dataset;
  var ndataset = create_lineChart_data(dataset);

  svg_line_chart.select("#l_display").text(attribute);
  attribute = type == "p" ? dataset[0].nationality : type == "t" ? dataset[0].nationality : attribute;
  svg_violin_chart.select("#v_display").text(attribute);

  dataset = type == "p" ? create_data("nationality" , dataset[0].nationality) : type == "t" ? create_data("nationality",dataset[0].nationality) : dataset
  var y_line = d3.scaleLinear()
  .domain([0,100])
  .range([height,0])
  .nice();
  var x_line = d3.scaleTime()
  .domain([new Date(2015, 0, 1, 0), new Date(2020, 0, 1, 0)])
  .range([0, width])
  .nice();


  draw = d3.line()
  .defined(d => !isNaN(d))
  .x((d, i) => x_line(new Date("20" + ndataset.dates[i], 0,1,0)))
  .y(d => y_line(d))
  .curve(d3.curveCatmullRom.alpha(0.5));


  var g_l = svg_line_chart.selectAll("#line_g");
  g_l.selectAll("g").remove();
  g_l.selectAll("g")
  .data(ndataset.series)
  .join("g")
  .attr("id", d=> d.type)
  .insert("path")
  .style("mix-blend-mode", "multiply")
  .attr("fill", "none")
  .attr("stroke",d => line_color(d.type))
  .attr("stroke-width", 1.5)
  .attr("stroke-linejoin", "round")
  .attr("d",d => draw(d.values));

  svg_line_chart.select("#line_g").selectAll("path").each(function(dat) {
    //for (i=2015; i<=2020; i++)
    svg_line_chart.select("#line_g").selectAll("#" + dat.type).selectAll("circle")
    .data(dat.values)
    .join("circle")
    .attr("id", "highlight")
    .attr("r", 5)
    .attr("fill", line_color(dat.type))
    .attr("cx",(d, i) => x_line(new Date("20" + line_data.dates[i], 0,1,0)))
    //.attr("d", d=> console.log(d))
    .attr("cy",d => y_line(d));
  });

  g_l.attr("transform","translate(-" + width + " 0)");

  g_l.transition().duration(5000).attr("transform","translate(0, 0)");

  gk_data = dataset.filter(function(d){if (d.team_position_20 == "GK") {return d;}});
  def_data = dataset.filter(function(d){if (defend_position.includes(d.team_position_20)) {return d;}});
  cen_data = dataset.filter(function(d){if (center_position.includes(d.team_position_20)) {return d;}});
  att_data = dataset.filter(function(d){if (attack_position.includes(d.team_position_20)) {return d;}});

  var y = d3.scaleLinear()
  .domain(d3.extent(data.map(d => d.height_cm)))
  .range([height,0])
  .nice();

  var x = d3.scaleBand()
  .domain(["Goalkeeper", "Defender", "Center", "Attack"])
  .range([0, width]);

  var g_a = svg_violin_chart.selectAll("#violin-area");
  var g_b = svg_violin_chart.selectAll("#boxplot");
  g_a.selectAll("path").remove();
  g_b.selectAll("line").remove();
  g_b.selectAll("rect").remove();
  g_b.selectAll("toto").remove();
  g_b.selectAll("circle").remove();
  g_b.selectAll("text").remove();

  console.log(t_data)
  console.log(d3.mean(t_data,d => d.height_cm))
  //Creates the points
  switch (type) {
    case "p":
    var index = t_data[0].team_position_20 == "GK" ? 1 :
    defend_position.includes(t_data[0].team_position_20) ? 3 :
    center_position.includes(t_data[0].team_position_20) ? 5 :
    attack_position.includes(t_data[0].team_position_20) ? 7: null;
    g_b.append("circle")
    .attr("r", 2.5)
    .attr("cx", (x.bandwidth()/2)*index)
    .attr("cy", y(d3.mean(t_data,d => d.height_cm)))

    g_b.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("x", (x.bandwidth()/2)*index)
    .attr("y", y(d3.mean(t_data,d => d.height_cm))-10)
    .text(temp);
    break;
    case "t":
    gk = dataset.filter(function(d){if (d.team_position_20 == "GK") {return d;}});
    def = dataset.filter(function(d){if (defend_position.includes(d.team_position_20)) {return d;}});
    cen = dataset.filter(function(d){if (center_position.includes(d.team_position_20)) {return d;}});
    att = dataset.filter(function(d){if (attack_position.includes(d.team_position_20)) {return d;}});
    g_b.append("circle")
    .attr("r", 2.5)
    .attr("cx", x.bandwidth()*0.5)
    .attr("cy", y(d3.mean(gk,d => d.height_cm)))

    g_b.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("x", x.bandwidth()*0.5)
    .attr("y", y(d3.mean(gk,d => d.height_cm))-10)
    .text(temp);

    g_b.append("circle")
    .attr("r", 2.5)
    .attr("cx", x.bandwidth()*1.5)
    .attr("cy", y(d3.mean(def,d => d.height_cm)))

    g_b.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("x", x.bandwidth()*1.5)
    .attr("y", y(d3.mean(def,d => d.height_cm))-10)
    .text(temp);

    g_b.append("circle")
    .attr("r", 2.5)
    .attr("cx", x.bandwidth()*2.5)
    .attr("cy", y(d3.mean(cen,d => d.height_cm)));

    g_b.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("x", x.bandwidth()*2.5)
    .attr("y", y(d3.mean(cen,d => d.height_cm))-10)
    .text(temp);

    g_b.append("circle")
    .attr("r", 2.5)
    .attr("cx", x.bandwidth()*3.5)
    .attr("cy", y(d3.mean(att,d => d.height_cm)));

    g_b.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("x", x.bandwidth()*3.5)
    .attr("y", y(d3.mean(att,d => d.height_cm))-10)
    .text(temp);
  }


  //Creates the Violun Chart + boxplot
  if (att_data.length != 0) {update_area_Chart(y,x,4,att_data,g_b,g_a);};

  if (cen_data.length != 0) {update_area_Chart(y,x,3,cen_data,g_b,g_a);};

  if (def_data.length != 0) {update_area_Chart(y,x,2,def_data,g_b,g_a);};

  if (gk_data.length != 0) {update_area_Chart(y,x,1,gk_data,g_b,g_a);};


  prepare_event();
}

function prepare_event() {
  dispatch = d3.dispatch("lineEvent");

  svg_line_chart.select("#line_g").selectAll("g").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_violin_chart.selectAll("#area").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_line_chart.selectAll("circle").on("mouseover",show);

  function show(event,d) {
    //Show Value of Circle

  }
  /*
  svg_line_chart.select("#line_g").selectAll("path").on("mousemove", moved);
  svg_line_chart.select("#line_g").selectAll("path").on("mouseleave", left);

  const dot = svg_line_chart.append("g")
  .attr("display", "none");

  dot.append("circle")
  .attr("r", 2.5);

  dot.append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .attr("text-anchor", "middle")
  .attr("y", -8);

  function moved(event,d) {
  event.preventDefault();
  const pointer = d3.pointer(event, this);
  const xm = x_line.invert(pointer[0]);
  const ym = y_line.invert(pointer[1]);
  dot.attr("display","green")
  // const i = d3.bisectCenter(data.dates, xm);
  // const s = d3.least(data.series, d => Math.abs(d.values[i] - ym));
  // path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
  dot.attr("transform", `translate(${pointer[0]},${pointer[1]})`);
  dot.select("text").text(d.type);
}
function left(event,d) {
console.log("Leave")
dot.attr("display", "none");
}
*/
dispatch.on("lineEvent", function (category) {
  // Remove highlight
  //if (selectedLine != null) {
  //  d3.select("highlight").remove()
  //}

  // Update Line Chart
  if (selectedLine != null) {
    selectedLine.attr("stroke-width","1.5");
  }

  if (selectedViolin != null) {
    selectedViolin.attr("fill", "grey")
  };

  selectedLine = svg_line_chart.select("#line_g").selectAll("path").filter(function (d) {

    try {
      return (category[0].type.includes(d.type))
    } catch (e) {
      return d == category
    }
  });

  selectedLine.attr("stroke-width","4");

  // Update Area Chart
  if(selectedViolin = null) {
    selectedViolin.attr("fill", function(d) {
      return "grey"
    })
  };

  selectedViolin = svg_violin_chart.selectAll("#area").filter(function (d) {
    // console.log(d);
    // console.log(category);
    return (d[0].type.includes(category.type)) || category == d;
  });

  selectedViolin.attr("fill", function(d) {
    return line_color(category.type);
  });

});
};

function update_area_Chart(y,x,index,data,node_b, node_a) {
  bins =  d3.bin().thresholds(20)(data.map(d=>d.height_cm))
  bins.map(function (d) {
    switch(index) {
      case 1:
      d.type = ["overall",'potential','Gk_Mean'];
      break;
      case 2:
      d.type = ["overall",'potential','Defending_Mean','Mentality_Mean']
      break;
      case 3:
      d.type = ["overall",'potential','Movement_Mean']
      break;
      case 4:
      d.type = ["overall",'potential','Skill_Mean','Attacking_Mean']
      break;
    }
  });

  var l_bins_max = d3.max(bins.map(d => d.length))

  var xNum = d3.scaleLinear()
  .range([(index-1)*x.bandwidth(), x.bandwidth()*index])
  .domain([-l_bins_max,l_bins_max]);

  node_a.attr("id","violin-area")
  .append("path")
  .datum(bins)
  .attr("fill", "grey")
  .attr("id","area")
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
var q1 = d3.quantile(data_sorted, .25);
var median = d3.quantile(data_sorted, .5);
var q3 = d3.quantile(data_sorted, .75);
var interQuantileRange = q3 - q1;
var min = q1 - 1.5 * interQuantileRange;
var max = q1 + 1.5 * interQuantileRange;

var center = x.bandwidth()*index - x.bandwidth()/2;
var width = x.bandwidth()/8;

test = node_b.attr("id","boxplot");

test.append("line")
.attr("x1", center)
.attr("x2", center)
.attr("y1", y(min))
.attr("y2", y(q1))
.attr("stroke", "black");
test.append("line")
.attr("x1", center)
.attr("x2", center)
.attr("y1", y(q3))
.attr("y2", y(max))
.attr("stroke", "black");

test.append("rect")
.attr("x", center - width/2)
.attr("y", y(q3) )
.attr("height", (y(q1)-y(q3)) )
.attr("width", width )
.attr("fill", "transparent")
.attr("stroke", "black");

test.selectAll("toto")
.data([min, median, max])
.enter()
.append("line")
.attr("x1", center-width/2)
.attr("x2", center+width/2)
.attr("y1", function(d){ return(y(d))} )
.attr("y2", function(d){ return(y(d))} )
.attr("stroke", "black");
}

function create_lineChart_data (data) {
  return {
    "series": [{
      type: "overall",
      values: year.map(y => d3.mean(data, d => d["overall_" +y]))
    },
    {
      type: "Defending_Mean",
      values: year.map(y => d3.mean(data, d => d["Defending_Mean_" +y]))
    },

    {
      type: "Attacking_Mean",
      values: year.map(y => d3.mean(data, d => d["Attacking_Mean_" +y]))
    },

    {
      type: "Gk_Mean",
      values: year.map(y => d3.mean(data, d => d["Gk_Mean_" +y]))
    },

    {
      type: "Mentality_Mean",
      values: year.map(y => d3.mean(data, d => d["Mentality_Mean_" +y]))
    },

    {
      type: "Movement_Mean",
      values: year.map(y => d3.mean(data, d => d["Movement_Mean_" +y]))
    },

    {
      type: "Skill_Mean",
      values: year.map(y => d3.mean(data, d => d["Skill_Mean_" +y]))
    },

    {
      type: "potential",
      values: year.map(y => d3.mean(data, d => d["potential_" +y]))
    },

  ],
  dates: year
};
}

function create_sankey_data(data) {
  Array.prototype.inArray = function(comparer) {
    for(var i=0; i < this.length; i++) {
        if(comparer(this[i])) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function(element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};

  graph = {"nodes" : [], "links" : []};
  graph.nodes.push({ "name": "Overall"})
  graph.nodes.push({ "name": "Potential"})
  graph.nodes.push({ "name": "Movement"})
  graph.nodes.push({ "name": "GK"})
  graph.nodes.push({ "name": "Attack"})
  graph.nodes.push({ "name": "Skill"})
  graph.nodes.push({ "name": "Defending"})
  graph.nodes.push({ "name": "Mentality"})

  data.forEach(function (d,i ){
    if (i == 0) console.log(d);
    // var element = { "name": d.club_20 }
    // graph.nodes.pushIfNotExist(element, function(e) {
    // return e.name === element.name;
    // });
    graph.nodes.push({"name": d.club_20});
    graph.nodes.push({ "name": d.Star_rating_20 });
    //graph.nodes.push({ "name": d.team_position_20 });

    // graph.links.push({ "source": d.source,
    //                    "target": d.target,
    //                    "value": +d.value });
   });
   // return only the distinct / unique nodes
  // graph.nodes = d3.keys(d3.group((function (d) { return d.name; }))
  //   .object(graph.nodes));
  console.log(graph.nodes)
   return graph
}
/* function create_lineChart_data (data) {
return [{
type: "overall",
2015:d3.mean(data, d => d.overall_15),
2016:d3.mean(data, d => d.overall_16),
2017:d3.mean(data, d => d.overall_17),
2018:d3.mean(data, d => d.overall_18),
2019:d3.mean(data, d => d.overall_19),
2020:d3.mean(data, d => d.overall_20),
},
{
type: "Defending_Mean",
2015:d3.mean(data, d => d.Defending_Mean_15),
2016:d3.mean(data, d => d.Defending_Mean_16),
2017:d3.mean(data, d => d.Defending_Mean_17),
2018:d3.mean(data, d => d.Defending_Mean_18),
2019:d3.mean(data, d => d.Defending_Mean_19),
2020:d3.mean(data, d => d.Defending_Mean_20),
},

{
type: "Attacking_Mean",
2015:d3.mean(data, d => d.Attacking_Mean_15),
2016:d3.mean(data, d => d.Attacking_Mean_16),
2017:d3.mean(data, d => d.Attacking_Mean_17),
2018:d3.mean(data, d => d.Attacking_Mean_18),
2019:d3.mean(data, d => d.Attacking_Mean_19),
2020:d3.mean(data, d => d.Attacking_Mean_20),
},

{
type: "Gk_Mean",
2015:d3.mean(data, d => d.Gk_Mean_15),
2016:d3.mean(data, d => d.Gk_Mean_16),
2017:d3.mean(data, d => d.Gk_Mean_17),
2018:d3.mean(data, d => d.Gk_Mean_18),
2019:d3.mean(data, d => d.Gk_Mean_19),
2020:d3.mean(data, d => d.Gk_Mean_20),
},

{
type: "Mentality_Mean",
2015:d3.mean(data, d => d.Mentality_Mean_15),
2016:d3.mean(data, d => d.Mentality_Mean_16),
2017:d3.mean(data, d => d.Mentality_Mean_17),
2018:d3.mean(data, d => d.Mentality_Mean_18),
2019:d3.mean(data, d => d.Mentality_Mean_19),
2020:d3.mean(data, d => d.Mentality_Mean_20),
},

{
type: "Movement_Mean",
2015:d3.mean(data, d => d.Movement_Mean_15),
2016:d3.mean(data, d => d.Movement_Mean_16),
2017:d3.mean(data, d => d.Movement_Mean_17),
2018:d3.mean(data, d => d.Movement_Mean_18),
2019:d3.mean(data, d => d.Movement_Mean_19),
2020:d3.mean(data, d => d.Movement_Mean_20),
},

{
type: "Skill_Mean",
2015:d3.mean(data, d => d.Skill_Mean_15),
2016:d3.mean(data, d => d.Skill_Mean_16),
2017:d3.mean(data, d => d.Skill_Mean_17),
2018:d3.mean(data, d => d.Skill_Mean_18),
2019:d3.mean(data, d => d.Skill_Mean_19),
2020:d3.mean(data, d => d.Skill_Mean_20),
},

{
type: "potential",
2015:d3.mean(data, d => d.potential_15),
2016:d3.mean(data, d => d.potential_16),
2017:d3.mean(data, d => d.potential_17),
2018:d3.mean(data, d => d.potential_18),
2019:d3.mean(data, d => d.potential_19),
2020:d3.mean(data, d => d.potential_20),
},

];
} */
