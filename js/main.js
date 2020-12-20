var data, data_w, data_c;
var margin = {top: 20, right: 30, bottom: 30, left: 60},
width = 460 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;
var dispatch;
var svg_line_chart, svg_violin_chart, svg_choropleth,svg_sankey;
var selectedLine, selectedViolin, selectedPath, selectedCountry;
var temp;
var attack_position = ["RW", "LW", "ST", "LF", "RF", "CF", "RS", "LS"];
var center_position = ["LM", "CM", "RM", "CAM", "RCM", "CDM", "LCM", "LDM", "RDM", "LAM", "RAM"];
var defend_position = ["LCB", "RCB", "LB", "RB", "CB", "LWB", "RWB" ];

var x_line, y_line;

var line_color,countryColor, sankeyColor;

var year = [15,16,17,18,19,20];

$(document).ready(function(){
  d3.csv("./res/FIFA_players_15_20.csv").then(function(dataset){
    d3.json("./../res/countries-50m.json").then(function(world) {
      d3.csv("./../res/country_clubs.csv").then(function(club) {
    data_c = club
    data_w = world;
    data = dataset;
    create_button_row();

    create_chloropletMap();

    create_violinChart();

    create_lineChart();

    create_sankeyDiagram();

    prepare_event();
  });

    });
  });
});

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
      if (selectedCountry != null){
        selectedCountry.style("stroke", "black");
        selectedCountry.style("stroke-width", "0.3px");
      };

      temp = this.value
      selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
        return d.properties.name == temp;
      });
      selectedCountry.style("stroke", "white");
      selectedCountry.style("stroke-width", "2px");

    prepare_button('nationality',this.value, "c");
  });

  $('.selectpicker').selectpicker('render');

};

function create_chloropletMap() {
  var svg = d3.select('#choropleth')
  .append('svg')
  .attr("width", 2.5*(width) + margin.left + margin.right)
  .attr("height", 1.3*(height) + margin.left + margin.right)
  //.append("g")
  //.attr("transform",
  //"translate(" + margin.left + "," + margin.top + ")");

  var projection = d3.geoMercator();

  var path = d3.geoPath()
    .projection(projection);

    svg.selectAll("path")
    .data(topojson.feature(data_w, data_w.objects.countries).features)
    .enter()
    .append("path")
    .attr("d",path)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .style("fill", d => getValue(d.properties.name,"wage_eur_20"))
    .attr("id", function(datum, index) {
      return datum.properties.name;
    });
    //addZoom();

  function addZoom(){
    d3.select("#choropleth").select("svg").call(
      d3
        .zoom()
        .scaleExtent([1,10])
        .on("zoom", zoomed)
    );
  }
  function zoomed({ transform}){
    //console.log(transform);
    d3.select("#choropleth").selectAll("path").attr("transform",transform);
  }


  svg_choropleth = svg;

};

function getValue(country, attribute) {
  nat = create_data("nationality", country);

  wage  = nat.map(d => d.wage_eur_20);
  var myColor = d3.scaleSequential()
  .domain([d3.min(wage),d3.max(wage)])
  .interpolator(d3.interpolatePuRd);

  mean = d3.mean(wage);

  d3.select("#nationality")
  .select("g")
  .datum(mean)
  .join("g")

  countryColor = myColor;
  return myColor(mean);
}

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

  country = create_data("nationality","Portugal");
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
  .text("Portugal");

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

function create_data(selector,attribute) {
  return data.filter(function (d) { if (d[selector] == attribute) {return d} })
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


  const color = d3.scaleOrdinal(d3.schemeCategory10);
  // return d => color(d.category === undefined ? d.name : d.category);

  sankeyColor = color;

  var s_data = create_sankey_data("Portugal")

  const sankey = d3
    .sankey()
    .size([width, height])
    .nodeId(d => d.name)
    .nodeWidth(20)
    .nodePadding(10)
    .nodeAlign(d3.sankeyCenter);
let graph = sankey(s_data);

let links = svg
    .append("g")
    .classed("links", true)
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .classed("link", true)
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("id", function(d,i){
        d.id = i;
        return "link-"+i;
      })
    .attr("stroke", "#606060")
    .attr("stroke-width", d => d.width)
    .attr("stroke-opacity", 0.5);

let nodes = svg
    .append("g")
    .classed("nodes", true)
    .selectAll("rect")
    .data(graph.nodes)
    .enter()
    .append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => color(d.name))
    .attr("opacity", 0.8);

    svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll("text")
    .data(graph.nodes)
    .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name);


    svg_sankey = svg;

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
  var country;
  if ("t" === type){
    country = data_c.filter(function (d) {if (d.Club == attribute) {return d}})
  }
  svg_line_chart.select("#l_display").text(attribute);
  attribute = type == "p" ? dataset[0].nationality : type == "t" ? country[0].Country : attribute;
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


  //Creates the Violin Chart + boxplot
  if (att_data.length != 0) {update_area_Chart(y,x,4,att_data,g_b,g_a);};

  if (cen_data.length != 0) {update_area_Chart(y,x,3,cen_data,g_b,g_a);};

  if (def_data.length != 0) {update_area_Chart(y,x,2,def_data,g_b,g_a);};

  if (gk_data.length != 0) {update_area_Chart(y,x,1,gk_data,g_b,g_a);};

  if (type == "p"){
    attribute = data_c.filter(function (d)  {if (d.Club == dataset[0].club_20) {return d;}})[0].Country
  }
  update_sankey_diagram(attribute);
  prepare_event();
}

function update_sankey_diagram(country){

  svg_sankey.selectAll("g").remove();
  var s_data = create_sankey_data(country)

  if (s_data.nodes.length == 0) {

    svg_sankey.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("dy", "0.35em")
      .style("color", "red")
      //.attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(`No data for ${country} available`);

  } else {
  const sankey = d3
    .sankey()
    .size([width, height])
    .nodeId(d => d.name)
    .nodeWidth(20)
    .nodePadding(10)
    .nodeAlign(d3.sankeyCenter);
let graph = sankey(s_data);

let links = svg_sankey
    .append("g")
    .classed("links", true)
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .classed("link", true)
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("id", function(d,i){
        d.id = i;
        return "link-"+i;
      })
    .attr("fill", "none")
    .attr("stroke", "#606060")
    .attr("stroke-width", d => d.width)
    .attr("stroke-opacity", 0.5);

let nodes = svg_sankey
    .append("g")
    .classed("nodes", true)
    .selectAll("rect")
    .data(graph.nodes)
    .enter()
    .append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => sankeyColor(d.name))
    .attr("opacity", 0.8);

    svg_sankey.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll("text")
    .data(graph.nodes)
    .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name);
    }
}

function prepare_event() {
  dispatch = d3.dispatch("lineEvent");

  dispatch_w = d3.dispatch("choroplethEvent");

  dispatch_s = d3.dispatch("choroplethSelect");

  dispatch_sa = d3.dispatch("sankeyEvent");

  svg_sankey.select("g.links").selectAll("path").on("mouseover", function (event, d) {
    dispatch_sa.call("sankeyEvent", this, d);
  });
  svg_sankey.select("g.nodes").selectAll("rect").on("mouseover", function (event, d) {
    dispatch_sa.call("sankeyEvent", this, d);
  });

  svg_line_chart.select("#line_g").selectAll("g").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_violin_chart.selectAll("#area").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_choropleth.selectAll("path").on("mouseover", function (event, d) {
    dispatch_w.call("choroplethEvent", this, d);
  });

  svg_choropleth.selectAll("path").on("click", function (event, d) {
    dispatch_s.call("choroplethSelect", this, d);
  });

dispatch_s.on("choroplethSelect", function (country) {
  if (selectedCountry != null){
    selectedCountry.style("stroke", "black");
    selectedCountry.style("stroke-width", "0.3px");
  };

  selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
    return d == country;
  });

  temp = country.properties.name;
  selectedCountry.style("stroke", "white");
  selectedCountry.style("stroke-width", "2px");

  prepare_button('nationality',country.properties.name, "c");

});

dispatch_w.on("choroplethEvent", function (country){
  if (selectedPath != null && selectedPath.datum().properties.name != temp) {
    selectedPath.style("stroke", "black");
    selectedPath.style("stroke-width", "0.3px");
  };

  selectedPath = svg_choropleth.selectAll("path").filter(function (d) {
    return d == country
  });
  if (selectedPath.datum().properties.name != temp){
  selectedPath.style("stroke", "white");
    selectedPath.style("stroke-width", "1px");
    }
});

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

dispatch_sa.on("sankeyEvent", function (data) {
})
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

function create_sankey_data(country) {
  graph = {"nodes" : [], "links" : []};
  // graph.nodes.push({ "name": "5"});
  // graph.nodes.push({ "name": "4"});
  // graph.nodes.push({ "name": "3"});
  // graph.nodes.push({ "name": "2"});
  // graph.nodes.push({ "name": "1"});
  // graph.nodes.push({ "name": "Attacker"});
  // graph.nodes.push({ "name": "Center"});
  // graph.nodes.push({ "name": "Defender"});
  // graph.nodes.push({ "name": "Goalkeeper"});
  // graph.nodes.push({ "name": "Substitute"});


  foo = data_c.filter(function (d) { if (d["Country"] === country) {return d;}});

  var fish = foo.map(d => d.Club);

  var temp = data.filter(function (d) {if (fish.includes(d["club_20"])) {return d;}})


  var temp_club = [];
  var temp_pos = [];
  var temp_srat = [];
  temp.forEach(function (d){
    if (!temp_club.includes(d.club_20)){
      graph.nodes.push({name: d.club_20});
      temp_club.push(d.club_20);
    }
    let pos = attack_position.includes(d.team_position_20) ? "Attacker" :
                center_position.includes(d.team_position_20) ? "Center" :
                defend_position.includes(d.team_position_20) ? "Defender" :
                d.team_position_20 === "GK" ? "Goalkeeper" : "Substitute"
    if (!temp_pos.includes(pos)){
      graph.nodes.push({name: pos});
      temp_pos.push(pos);
    }
    if (!temp_srat.includes(d.Star_rating_20)){
      graph.nodes.push({name: d.Star_rating_20});
      temp_srat.push(d.Star_rating_20);
    }
    flag = true;
    if (graph.links.length > 0) {
      for (x = 0;  x < graph.links.length; x++){
        if (graph.links[x].source === d.club_20 && graph.links[x].target === d.Star_rating_20){
          graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d.value_eur_20);
          flag = false;
          break;
        }
      }
    }
    if (flag) {
      graph.links.push({
        "source": d.club_20,
        "target": d.Star_rating_20,
        "value": +d.value_eur_20
          });
      };

      flag2 = true;
      for (x = 0;  x < graph.links.length; x++){
        if(attack_position.includes(d.team_position_20)){
            if (graph.links[x].source === d.Star_rating_20 && graph.links[x].target === "Attacker"){
                graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d.value_eur_20);
                flag2=false;
                break;
              }
        } else  if(center_position.includes(d.team_position_20)) {
          if (graph.links[x].source === d.Star_rating_20 && graph.links[x].target === "Center"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d.value_eur_20);
              flag2=false;
              break;
            }
        } else if(defend_position.includes(d.team_position_20)) {
          if (graph.links[x].source === d.Star_rating_20 && graph.links[x].target === "Defender"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d.value_eur_20);
              flag2=false;
              break;
            }
        } else if("GK" === d.team_position_20) {
          if (graph.links[x].source === d.Star_rating_20 && graph.links[x].target === "Goalkeeper"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d.value_eur_20);
              flag2=false;
              break;
            }
        } else {
          if (graph.links[x].source === d.Star_rating_20 && graph.links[x].target === "Substitute"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d.value_eur_20);
              flag2=false;
              break;
            }
      };}
      if (flag2)  {
      if(attack_position.includes(d.team_position_20)){
      graph.links.push({
        "source": d.Star_rating_20,
        "target": "Attacker",
        "value": +d.value_eur_20
      })
    } else
    if(center_position.includes(d.team_position_20)){
      graph.links.push({
        "source": d.Star_rating_20,
        "target": "Center",
        "value": +d.value_eur_20
      })
    } else
    if(defend_position.includes(d.team_position_20)){
      graph.links.push({
        "source": d.Star_rating_20,
        "target": "Defender",
        "value": +d.value_eur_20
      })
    } else
    if("GK" === d.team_position_20){
      graph.links.push({
        "source": d.Star_rating_20,
        "target": "Goalkeeper",
        "value": +d.value_eur_20
      })
    } else {
      graph.links.push({
        "source": d.Star_rating_20,
        "target": "Substitute",
        "value": +d.value_eur_20
    })

    };}

   });
  return graph;
}
