var data, data_w, data_c;
var margin = {top: 20, right: 50, bottom: 5, left: 90},
width = 600 - margin.left - margin.right,
height = 350 - margin.top - margin.bottom;
var dispatch;
var svg_line_chart, svg_violin_chart, svg_choropleth,svg_sankey;
var selectedLine, selectedViolin, selectedPath, selectedCountry, selectedLink;
var temp;
var attack_position = ["RW", "LW", "ST", "LF", "RF", "CF", "RS", "LS"];
var center_position = ["LM", "CM", "RM", "CAM", "RCM", "CDM", "LCM", "LDM", "RDM", "LAM", "RAM"];
var defend_position = ["LCB", "RCB", "LB", "RB", "CB", "LWB", "RWB" ];

var x_line, y_line;

var line_color,countryColor, sankeyColor;
var show = false;

var years = [15,16,17,18,19,20];
var current_year = 20;
var current_type = "c";
var current_value= "Portugal";
var current_attribute= "nationality";
var current_check = "wage_eur_";
var div;

$(document).ready(function(){
  d3.csv("./res/FIFA_players_15_20.csv").then(function(dataset){
    d3.json("./../res/countries-50m.json").then(function(world) {
      d3.csv("./../res/country_clubs.csv").then(function(club) {
       div = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

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
  team20 = data.map (d => d.club_20)
  team19= data.map (d => d.club_19)
  team18= data.map (d => d.club_18)
  team17= data.map (d => d.club_17)
  team16= data.map (d => d.club_16)
  team15= data.map (d => d.club_15)

  var team = team20.concat(team19).concat(team18).concat(team17).concat(team16).concat(team15);
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

  var dataTime = d3.range(0, 6).map(function(d) {
   return new Date(2015 + d, 10, 3);
 });

 var sliderTime = d3
   .sliderBottom()
   .min(d3.min(dataTime))
   .max(d3.max(dataTime))
   .step(1000 * 60 * 60 * 24 * 365)
   .width(width/1.5)
   .tickFormat(d3.timeFormat('%Y'))
   .tickValues(dataTime)
   .default(new Date(2020, 10, 3))
   .on('onchange', val => {
      value = d3.timeFormat("%Y")(val)
      current_year = value.slice(-2)
      prepare_button(current_attribute, current_value, current_type, current_year,true)
      update_choropleth(current_check);
   });

 var gTime = d3
   .select('div#slider-time')
   .append('svg')
   .attr('width', width + 50)
   .attr('height', 100)
   .append('g')
   .attr('transform', 'translate(15,30)');

 gTime.call(sliderTime);

  $('#formControlRange').on('change', function(e){
    current_year = this.value;
    prepare_button(current_attribute, current_value, current_type, this.value);
    update_choropleth(current_check);
  });

  $('#p').on('change', function(e){
    current_attribute = "long_name";
    current_type = "p";
    current_value = this.value;
    temp = data.filter(function (d) {if (d["long_name"] == current_value) {return d;} });
    if (selectedCountry != null){
      selectedCountry.style("stroke", "black");
      selectedCountry.style("stroke-width", "0.3px");
    };
    selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
      return d.properties.name == temp[0]["nationality"];
    });
    selectedCountry.style("stroke", "black");
    selectedCountry.style("stroke-width", "2px");
    $('select[id=c]').val(temp[0]["nationality"]);
    $('select[id=t]').val(temp[0]["club_"+ current_year]);
    $('.selectpicker').selectpicker('refresh')
    prepare_button('long_name',this.value, "p", current_year)
  });

  $('#t').on('change', function(e){
    current_attribute = "club_" + current_year ;
    current_type = "t";
    current_value = this.value;
    temp = data_c.filter(function (d) {
      if(d["Club"] === current_value)
      {return d;}
    });
    console.log(temp);
    if (selectedCountry != null){
      selectedCountry.style("stroke", "black");
      selectedCountry.style("stroke-width", "0.3px");
    };
    selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
      return d.properties.name == temp[0].Country
    });
    selectedCountry.style("stroke", "black");
    selectedCountry.style("stroke-width", "2px");
    $('select[id=c]').val(temp[0].Country);
    $('.selectpicker').selectpicker('refresh')

    prepare_button(current_attribute,this.value, "t", current_year);
  });


  $('#c').on('change', function(e){
      if (selectedCountry != null){
        selectedCountry.style("stroke", "black");
        selectedCountry.style("stroke-width", "0.3px");
      };

      current_value = this.value
      selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
        return d.properties.name == current_value;
      });
      selectedCountry.style("stroke", "black");
      selectedCountry.style("stroke-width", "2px");

      current_attribute = "nationality" ;
      current_type = "c";
      current_value = this.value;

    prepare_button('nationality',this.value, "c", current_year);
  });

  $("input[name='exampleRadios").click(function(){
            var radioValue = $("input[name='exampleRadios']:checked").val();
            current_check = radioValue;
            update_choropleth(radioValue);
        });

  $('.selectpicker').selectpicker('render');

};

function create_chloropletMap() {

  var svg = d3.select('#choropleth')
  .append('svg')
  .attr('id', 'c_svg')
  .attr("width", 3.7*(width) + margin.left + margin.right)
  .attr("height", (height) + margin.left + margin.right)

  var projection = d3.geoMercator()
    .center([-150, 0])
    .scale(100)
    //.rotate([123,0]);

  var path = d3.geoPath()
    .projection(projection);

    svg_choropleth = svg;

    var temp = data.map(d => d["nationality"]);


    function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
    }

    var list = [];

    x_uni = temp.filter(onlyUnique);
    for (y= 0; y < x_uni.length; y++){
      value  = data.map(function(d) {if(d["nationality"] == x_uni[y]) {return parseInt(d[current_check + current_year]) }});
      list.push({
        key: x_uni[y],
        val: d3.mean(value),
      })
    };

    list = list.sort(function (a, b) {
      return b.val - a.val
    });

    var myColor = d3.scaleLinear()
    .domain([list[list.length-1].val,list[0].val])
    .range([0.05,1]);

    countryColor = myColor;

    svg.selectAll("path")
    .data(topojson.feature(data_w, data_w.objects.countries).features)
    .enter()
    .append("path")
    .attr("d",path)
    .attr("title", "Top Players and Clubs")
    .attr("data-toggle","popover")
    .style("stroke", "white")
    .style("stroke-width", "0.3px")
    .style("fill", d => getValue(d.properties.name,list))
    .attr("id", function(datum, index) {
      return datum.properties.name;
    })

    addZoom();

  function addZoom(){
    d3.select("#choropleth").select("svg").call(
      d3
        .zoom()
        //.translateExtent([[0,0],[width,height]])
        .scaleExtent([0,20])
        .on("zoom", zoomed)
        //.center(zoomed);
    );
  }
  function zoomed({ transform}){
    //console.log(transform)
    // console.log($('#svg_c').width())
    // console.log($("#c_svg").width())
     var width = $("#c_svg").width()/2
     var height = $("#c_svg").height()

    //
     tx = Math.min(0, Math.max(transform.x, width - width * transform.k));
    ty = Math.min(0, Math.max(transform.y, height - height * transform.k));
    //
    //      svg.attr("transform", [
    //        "translate(" + [tx, ty] + ")",
    //        "scale(" + e.k + ")"
    //      ].join(" "));

    d3.select("#choropleth").selectAll("path").attr("transform", [
           "translate(" + [tx, ty] + ")",
           "scale(" + transform.k + ")"
         ].join(" "));
  };

    //d3.select("#choropleth").selectAll("path").attr("transform",transform);


  svg_choropleth = svg;

};

function getValue(country,list) {
  nat = create_data("nationality", country);
  wage  = nat.map(d => parseInt(d[current_check + current_year]));
  categories = ["overall_" + current_year, "Defending_Mean_" + current_year,
  "Attacking_Mean_" + current_year, "Gk_Mean_" + current_year, "Mentality_Mean_" + current_year,
  "Movement_Mean_" + current_year, "Skill_Mean_" + current_year, "potential_" + current_year,
  "wage_eur_" + current_year, "value_eur_" + current_year];


  var color_line = d3.scaleOrdinal()
  .domain(categories)
  .range(['#1f78b4','#a6cee3','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6',"#6a3d9a"])

  color = d3.hsl(color_line(current_check + current_year));

  mean = Math.trunc(d3.mean(wage))

  //Append a defs (for definition) element to your SVG
  svg_choropleth.selectAll("defs").remove();
  svg_choropleth.select("g").remove();
  var defs = svg_choropleth
  .append("defs");

  //Append a linearGradient element to the defs and give it a unique id
  var linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

  linearGradient
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "0%")
  .attr("y2", "100%");


  color.s = 0.05
  //Set the color for the start (0%)
  linearGradient.append("stop")
  .attr("offset", "0%")
  .attr("stop-color", color ); //light blue
  color.s = 1

  //Set the color for the end (100%)
  linearGradient.append("stop")
  .attr("offset", "100%")
  .attr("stop-color", color); //dark blue

  //Draw the rectangle and fill with gradient
  g = svg_choropleth.append("g")
  g.append("rect")
  .attr("width", 10)
  .attr("x", 30)
  .attr("height", height*2)
  .style("fill", "url(#linear-gradient)");

  g
  .append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 15)
  .attr("text-anchor", "middle")
  .attr("x", 80)
  .attr("y", 20)
  .text(list[list.length -1].val);

  g
  .append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 15)
  .attr("text-anchor", "middle")
  .attr("x", 80)
  .attr("y", 460)
  .text(list[0].val);

  g
  .append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 15)
  .attr("text-anchor", "middle")
  .attr("x", 80)
  .attr("y", 240)
  .text(Math.trunc(list[0].val/2));


  g.append("rect")
  .attr("width", 10)
  .attr("x", 3.9 * width )
  .attr("height", height*2)
  .style("fill", "url(#linear-gradient)");

  g
  .append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 15)
  .attr("text-anchor", "middle")
  .attr("x", 3.9 * width - 40)
  .attr("y", 20)
  .text(list[list.length -1].val);

  g
  .append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 15)
  .attr("text-anchor", "middle")
  .attr("x", 3.9 * width - 40)
  .attr("y", 460)
  .text(list[0].val);

  g
  .append("text")
  .attr("font-family", "sans-serif")
  .attr("font-size", 15)
  .attr("text-anchor", "middle")
  .attr("x", 3.9 * width - 40)
  .attr("y", 240)
  .text(Math.trunc(list[0].val/2));


  // d3.select("#" + country)
  // .selectAll("g")
  // .datum(mean)
  // .join("g")

  color.s = countryColor(mean);

  return color;
}

function create_lineChart () {
  // Line Chart
  var svg = d3.select('#line')
  .append('svg')
  .attr("width", width + margin.left + margin.right )
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
    .attr("cy",d => y(d));
  });

  svg
  .append("text")
  .attr(
    "transform",
    "translate(" + width / 2 + " ," + (height + margin.bottom + 20) + ")"
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

      svg
      .append("text")
      .attr("id","l_display")
      .attr(
        "transform",
        "translate(" + width/3 + "," + 0 + ")"
      )
      .attr("class", "label")
      .attr("style","font-size:12px")
      .text("Flow of Money(Wage in Euro)");


    svg_sankey = svg;

};

function create_areaChart(data, index, node, x, y){
  bins =  d3.bin().thresholds(20)(data.map(d=>d.height_cm))
  bins.map(function (d) {
    switch(index) {
      case 1:
      d.type = ["Goalkeeper"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
      break;
      case 2:
      d.type = ["Defender"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
      break;
      case 3:
      d.type = ["Center"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
      break;
      case 4:
      d.type = ["Attacker"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
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
min = d3.min(data_sorted);
max = d3.max(data_sorted);

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

function prepare_button(selector,attribute, type, year,flag) {
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
  dataset = type == "p" ? create_data("nationality" , dataset[0].nationality) : type == "t" ? create_data("nationality",country[0].Country) : dataset

  var y_line = d3.scaleLinear()
  .domain([0,100])
  .range([height,0])
  .nice();
  var x_line = d3.scaleTime()
  .domain([new Date(2015, 0, 1, 0), new Date(2020, 0, 1, 0)])
  .range([0, width])
  .nice();


if (!flag) {  draw = d3.line()
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
    svg_line_chart.select("#line_g").selectAll("#" + dat.type).selectAll("circle")
    .data(dat.values)
    .join("circle")
    .attr("id", "highlight")
    .attr("r", 5)
    .attr("fill", line_color(dat.type))
    .attr("cx",(d, i) => x_line(new Date("20" + line_data.dates[i], 0,1,0)))
    .attr("cy",d => y_line(d));
  });

  g_l.attr("style","opacity: 0;");

  g_l.transition().duration(3000).attr("style","opacity: 1;");

}

  gk_data = dataset.filter(function(d){if (d["team_position_" + year] == "GK") {return d;}});
  def_data = dataset.filter(function(d){if (defend_position.includes(d["team_position_" + year])) {return d;}});
  cen_data = dataset.filter(function(d){if (center_position.includes(d["team_position_" + year])) {return d;}});
  att_data = dataset.filter(function(d){if (attack_position.includes(d["team_position_" + year])) {return d;}});

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
    var index = t_data[0]["team_position_"+ year] == "GK" ? 1 :
    defend_position.includes(t_data[0]["team_position_"+ year]) ? 3 :
    center_position.includes(t_data[0]["team_position_"+ year]) ? 5 :
    attack_position.includes(t_data[0]["team_position_"+ year]) ? 7: null;
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
    gk = dataset.filter(function(d){if (d["team_position_"+ year] == "GK") {return d;}});
    def = dataset.filter(function(d){if (defend_position.includes(d["team_position_"+ year])) {return d;}});
    cen = dataset.filter(function(d){if (center_position.includes(d["team_position_"+ year])) {return d;}});
    att = dataset.filter(function(d){if (attack_position.includes(d["team_position_"+ year])) {return d;}});
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
    attribute = data_c.filter(function (d)  {if (d.Club == dataset[0]["club_" + year]) {return d;}})[0].Country
  }
  update_sankey_diagram(attribute);
  prepare_event();
}

function update_sankey_diagram(country){

  svg_sankey.selectAll("g").remove();
  var s_data = create_sankey_data(country)

  if (s_data.nodes.length == 0 || current_year == 15) {

    svg_sankey.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .append("text")
      .attr("x", width / 2 -50)
      .attr("y", height / 2)
      .attr("dy", "0.35em")
      .style("color", "red")
      //.attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(`No data for ${country} in the year 20${current_year} available`);

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

  dispatch_a = d3.dispatch("areaEvent");

  dispatch_w = d3.dispatch("choroplethEvent");

  dispatch_s = d3.dispatch("choroplethSelect");

  dispatch_sa = d3.dispatch("sankeyEvent");

  dispatch_l = d3.dispatch("choro");

  dispatch_k = d3.dispatch("lineSelect");

  dispatch_m = d3.dispatch("sankeyClick");

  svg_line_chart.select("#line_g").selectAll("g").on("click", function (event, d) {
    dispatch_k.call("lineSelect", this, d);
  });
  svg_sankey.select("g.links").selectAll("path").on("mouseover", function (event, d) {
    dispatch_sa.call("sankeyEvent", this, d);
  });
  svg_sankey.select("g.nodes").selectAll("rect").on("mouseover", function (event, d) {
    dispatch_sa.call("sankeyEvent", this, d);
  });

  svg_sankey.select("g.nodes").selectAll("rect").on("click", function (event, d) {
    dispatch_m.call("sankeyClick", this, d);
  });

  svg_line_chart.select("#line_g").selectAll("g").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_violin_chart.selectAll("#area").on("mouseover", function (event, d) {
    dispatch_a.call("areaEvent", this, d);
  });

  svg_choropleth.selectAll("path").on("mouseover", function (event, d) {
    dispatch_w.call("choroplethEvent", this, d);
  });

  svg_choropleth.selectAll("path").on("mouseout", function (event, d) {
    dispatch_l.call("choro", this, d);
  });

  svg_choropleth.selectAll("path").on("click", function (event, d) {
    dispatch_s.call("choroplethSelect", this, d);
  });

  dispatch_l.on("choro", function(d) {
    div.transition()
      .duration(500)
      .style("opacity", 0);
    });
dispatch_s.on("choroplethSelect", function (country) {
  if (selectedCountry != null){
    selectedCountry.style("stroke", "white");
    selectedCountry.style("stroke-width", "0.3px");
  };

  selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
    return d == country;
  });

  if (show) {
    $(`#${temp}`).popover('hide');
    show = false;
  } else {
      show = true;
    top_p = get_top_player(country.properties.name);
    top_c = get_top_clubs(country.properties.name);

    content = create_content(top_p, top_c);
    selectedCountry
    .attr("data-html","true")
    .attr("data-content", content)
      $(`#${country.properties.name}`).popover('show');


      $('#p1').click(function(e){
        show = false
        $(`#${country.properties.name}`).popover('hide');
        current_attribute = "long_name";
        current_type = "p";
        current_value = top_p[0]["key"]
        prepare_button("long_name",top_p[0]["key"],"p",current_year);
      });
      $('#p2').click(function(e){
        show = false
        $(`#${country.properties.name}`).popover('hide');
        current_attribute = "long_name";
        current_type = "p";
        current_value = top_p[1]["key"]
        prepare_button("long_name",top_p[1]["key"],"p",current_year);
      });
      $('#p3').click(function(e){
        show = false
        $(`#${country.properties.name}`).popover('hide');
        current_attribute = "long_name";
        current_type = "p";
        current_value = top_p[2]["key"]
        prepare_button("long_name",top_p[2]["key"],"p",current_year);
      });
      $('#c1').click(function(e){
        show = false
        $(`#${country.properties.name}`).popover('hide');
        current_attribute = "club_" + current_year ;
        current_type = "t";
        current_value = top_c[0]["key"];
        prepare_button("club_" + current_year ,top_c[0]["key"],"t",current_year);
      });
      $('#c2').click(function(e){
        show = false
        $(`#${country.properties.name}`).popover('hide');
        current_attribute = "club_" + current_year ;
        current_type = "t";
        current_value = top_c[1]["key"];
        prepare_button("club_" + current_year,top_c[1]["key"],"t",current_year);
      });
      $('#c3').click(function(e){
        show = false
        $(`#${country.properties.name}`).popover('hide');
        current_attribute = "club_" + current_year ;
        current_type = "t";
        current_value = top_c[2]["key"];
        prepare_button("club_20" + current_year,top_c[2]["key"],"t",current_year);
      });
    };



  temp = country.properties.name;
  selectedCountry.style("stroke", "black");
  selectedCountry.style("stroke-width", "2px");
  current_type = "c";
  current_value = country.properties.name;
  current_attribute = "nationality";
  $('select[id=c]').val(country.properties.name);
  $('.selectpicker').selectpicker('refresh')
  prepare_button('nationality',country.properties.name, "c", current_year);


});

dispatch_k.on("lineSelect", function(line) {

  current_check = line.type + "_";

  document.querySelector("input[value='" + current_check + "']").checked = true;
  update_choropleth(current_check);

});
dispatch_m.on("sankeyClick", function (node) {
  console.log(node);
  if(node.targetLinks.length == 0){
    current_value = node.name;

    current_attribute = "club_" + current_year ;
    current_type = "t";
    temp = data_c.filter(function (d) {
      if(d["Club"] === current_value)
      {return d;}
    });
    console.log(temp);
    if (selectedCountry != null){
      selectedCountry.style("stroke", "black");
      selectedCountry.style("stroke-width", "0.3px");
    };
    selectedCountry = svg_choropleth.selectAll("path").filter(function (d) {
      return d.properties.name == temp[0].Country
    });
    selectedCountry.style("stroke", "black");
    selectedCountry.style("stroke-width", "2px");
    $('select[id=t]').val(current_value);
    $('select[id=c]').val(temp[0].Country);
    $('.selectpicker').selectpicker('refresh')

    prepare_button(current_attribute,current_value, "t", current_year);
  }
});

dispatch_w.on("choroplethEvent", function (country){
  if (selectedPath != null && selectedPath.datum().properties.name != temp) {
    selectedPath.style("stroke", "white");
    selectedPath.style("stroke-width", "0.3px");
  };
  selectedPath = svg_choropleth.selectAll("path").filter(function (d) {
    return d == country
  });
  //value  = svg_choropleth.select("#"+country.properties.name).select("g").data()
   div.transition()
     .duration(200)
     .style("opacity", .9);
   div.html(country.properties.name)
      .style("left", (event.pageX) + "px")
      .style("top", (event.pageY - 28) + "px");


  if (selectedPath.datum().properties.name != temp){
  selectedPath.style("stroke", "black");
    selectedPath.style("stroke-width", "1px");
    }
});

dispatch.on("lineEvent", function (category) {
  // Update Line Chart

  if (selectedLine != null) {
    selectedLine.attr("stroke-width","1.5");
  }

  if (selectedViolin != null) {
    selectedViolin.attr("fill", "grey")
  };

  selectedLine = svg_line_chart.select("#line_g").selectAll("path").filter(function (d) {
      return d == category
  });

  selectedLine.attr("stroke-width","4");

  // Update Area Chart
  if(selectedViolin = null) {
    selectedViolin.attr("fill", function(d) {
      return "grey"
    })
  };
  list_1 = [];
  svg_violin_chart.selectAll("#area").data().forEach((item, i) => {
    var list = item[0]["sk"];
    for (x = 0; x < list.length; x++){
      if (list[x]["key"] == category.type){
        list_1.push(list[x]["val"])
      }
    }
  });
  max = 0;
  for (x = 0; x < list_1.length; x++){
    if (max < list_1[x]){
      max = list_1[x];
    }
  }
  selectedViolin = svg_violin_chart.selectAll("#area").filter(function (d) {
    if (max == 0) {
      return true;
    } else {
      list = d[0].sk
      for (x = 0; x < list.length; x++){
        if (list[x]["val"] == max){
          return true;
        }
      }
    }
  });

  selectedViolin.attr("fill", function(d) {
    return line_color(category.type);
  });

});

dispatch_a.on("areaEvent", function (category) {
  list = category[0].sk;
  list = list.sort(function (a, b) {
    return b.val - a.val
  });
  //$('.selectpicker').val()

  if (selectedLine != null) {
    selectedLine.attr("stroke-width","1.5");
  }

  if (selectedViolin != null) {
    selectedViolin.attr("fill", "grey")
  };

  selectedLine = svg_line_chart.select("#line_g").selectAll("path").filter(function (d) {
    return list[0]["key"] === d.type;
  });

  selectedLine.attr("stroke-width","4");

  // Update Area Chart
  if(selectedViolin = null) {
    selectedViolin.attr("fill", function(d) {
      return "grey"
    })
  };


  selectedViolin = svg_violin_chart.selectAll("#area").filter(function (d) {
    return category == d;
  });

  selectedViolin.attr("fill", function(d) {
    return line_color(list[0]["key"]);
  });

});

dispatch_sa.on("sankeyEvent", function (data) {
  if (selectedLink != null){
      selectedLink.attr("stroke-opacity",0.5);
  }
  index_list = []

  try{
    if(data.sourceLinks.length == 0){
      elements = data.targetLinks;
      for (x in elements){
        index_list.push(elements[x]["index"]);
        if (elements[x].source.sourceLinks.length > 0){
          for (y = 0; y < elements[x].source.targetLinks.length; y++){
            index_list.push(elements[x].source.targetLinks[y].index);
          }
        }
      }
    } else if (data.targetLinks.length == 0){
      elements = data.sourceLinks;
      for (x in elements){
        index_list.push(elements[x]["index"]);
        if (elements[x].target.sourceLinks.length > 0){
          for (y = 0; y < elements[x].target.sourceLinks.length; y++){
            index_list.push(elements[x].target.sourceLinks[y].index);
          }
        }
      }
    } else {
        elements = data.sourceLinks;
        for (x in elements){
          index_list.push(elements[x]["index"]);
        }
        elements = data.targetLinks;
        for (x in elements){
          index_list.push(elements[x]["index"]);
        }
    }
  } catch (error) {
    index_list.push(data["index"]);
    if (data.source.sourceLinks.length > 0){
      for (x = 0; x < data.source.targetLinks.length; x++){
        index_list.push(data.source.targetLinks[x].index);
      }
    }
    if (data.target.sourceLinks.length > 0){
      for (x = 0; x < data.target.sourceLinks.length; x++){
        index_list.push(data.target.sourceLinks[x].index);
      }
    }
  }

  selectedLink = svg_sankey.selectAll("path").filter(function (d) {
    return index_list.includes(d["index"]);
  });

  selectedLink.attr("stroke-opacity",1);

})
};
function create_content(player, clubs){
 var attri = "";
  switch (current_check) {
    case "wage_eur_": attri = "Wage in €: ";break;
    case "value_eur_": attri = "Value in €: ";break;
    case "overall_": attri = "Overall: ";break;
    case "Skill_Mean_": attri = "Skill: ";break;
    case "Defending_Mean_": attri = "Defending: ";break;
    case "Attacking_Mean_": attri = "Attacking: ";break;
    case "Movement_Mean_": attri = "Movement: ";break;
    case "Mentality_Mean_": attri = "Mentality: ";break;
    case "Gk_Mean_": attri = "Goalkeeping: ";break;
    case "potential_": attri = "Potential: ";break;
  };
  if (player.length == 3 && clubs.length == 3){
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
      <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[1]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[2]["key"]} <br> ${attri} ${Math.trunc(player[2]["val"])}</div>
     <a href="#" id="p3" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[2]["key"]}<br>${attri} ${Math.trunc(clubs[2]["val"])}</div>
      <a href="#" id="c3" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 3 && clubs.length == 2) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[1]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[2]["key"]} <br> ${attri} ${Math.trunc(player[2]["val"])}</div>
     <a href="#" id="p3" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="p2" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 3 && clubs.length == 1) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[1]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[2]["key"]} <br> ${attri} ${Math.trunc(player[2]["val"])}</div>
     <a href="#" id="p3" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 3 && clubs.length == 0) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[1]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[2]["key"]} <br> ${attri} ${Math.trunc(player[2]["val"])}</div>
     <a href="#" id="p3" class="btn btn-link">Select</a>
     </div>
     </div>
      </div>
      </div>
    `
  }
  else if (player.length == 2 && clubs.length == 3){
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[1]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[2]["key"]}<br>${attri} ${Math.trunc(clubs[2]["val"])}</div>
      <a href="#" id="c3" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 2 && clubs.length == 2) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[1]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 2 && clubs.length == 1) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[1]["key"]} <br> ${attri} ${Math.trunc(player[2]["val"])}</div>
     <a href="#" id="p2" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 2 && clubs.length == 0) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" class="btn btn-link">Select</a>
     </div>
     </div>
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
     <div class="card-text">${player[2]["key"]} <br> ${attri} ${Math.trunc(player[2]["val"])}</div>
     <a href="#" class="btn btn-link">Select</a>
     </div>
     </div>
      </div>
      </div>
    `
  }
  else if (player.length == 1 && clubs.length == 3){
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[2]["key"]}<br>${attri} ${Math.trunc(clubs[2]["val"])}</div>
      <a href="#" id="c3" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 1 && clubs.length == 2) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 1 && clubs.length == 1) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
     </div>
         <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 1 && clubs.length == 0) {
    string = `
    <div class="container">
    <b>Player</b><hr>
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text">${player[0]["key"]} <br> ${attri} ${Math.trunc(player[0]["val"])}</div>
     <a href="#" id="p1" class="btn btn-link">Select</a>
     </div>
     </div>
      </div>
      </div>
    `
  }
  else if (player.length == 0 && clubs.length == 3){
    string = `
    <div class="container">
        <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[2]["key"]}<br>${attri} ${Math.trunc(clubs[2]["val"])}</div>
      <a href="#" id="c3" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 0 && clubs.length == 2) {
    string = `
    <div class="container">
        <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      <div class="card text=center" style="width: 10rem;">
      <div class="card-body">
      <div class="card-text">${clubs[1]["key"]}<br>${attri} ${Math.trunc(clubs[1]["val"])}</div>
      <a href="#" id="c2" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else if( player.length == 0 && clubs.length == 1) {
    string = `
    <div class="container">
    <b>Club</b><hr>
     <div class="col-sm">
     <div class="card text=center" style="width: 10rem;">
     <div class="card-body">
      <div class="card-text">${clubs[0]["key"]}<br>${attri} ${Math.trunc(clubs[0]["val"])}</div>
      <a href="#" id="c1" class="btn btn-link">Select</a>
      </div>
      </div>
      </div>
      </div>
    `
  }
  else {
    string = `
    <div class="container">
    <div class="col-sm">
    <div class="card text=center" style="width: 10rem;">
    <div class="card-body">
     <div class="card-text"> No Data available</div>
     </div>
      </div>
      </div>
    `
  }

  return string;
}
function get_top_player(country){
  var temp = create_data("nationality", country);

  var list = []

  temp.forEach((item, i) => {
    list.push({
      key: item["long_name"],
      val: item[current_check + current_year]
    })
  });
  list = list.sort(function (a, b) {
    return b.val - a.val
  });
  return list.slice(0,3)
}
function get_top_clubs(country){
  function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
  }


  foo = data_c.filter(function (d) { if (d["Country"] === country) {return d;}});

  var fish = foo.map(d => d["Club"]);

  var temp = data.filter(function (d) {if (fish.includes(d["club_" + current_year])) {return d;}})

  var list = [];

  x = temp.map(d => d["club_" + current_year]);
  x_uni = x.filter(onlyUnique);
  for (y= 0; y < x_uni.length; y++){
    value  = temp.map(function(d) {if(d["club_" + current_year] == x_uni[y]) {return d[current_check + current_year] }});
    list.push({
      key: x_uni[y],
      val: d3.mean(value),
    })
  }
  list = list.sort(function (a, b) {
    return b.val - a.val
  });

  return list.slice(0,3)
}

function update_area_Chart(y,x,index,data,node_b, node_a) {
  bins =  d3.bin().thresholds(20)(data.map(d=>d.height_cm))
  bins.map(function (d) {
    switch(index) {
      case 1:
      d.type = ["Goalkeeper"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
      break;
      case 2:
      d.type = ["Defender"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
      break;
      case 3:
      d.type = ["Center"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
      break;
      case 4:
      d.type = ["Attacker"];
      d.sk = [{
        key: "Attacking_Mean",
        val: d3.mean( data.map(d => parseInt(d["Attacking_Mean_" + current_year])))
        },
        {key: "Defending_Mean",
      val: d3.mean( data.map(d => parseInt(d["Defending_Mean_" + current_year])))
      },
      {key: "Movement_Mean",
      val: d3.mean( data.map(d => parseInt(d["Movement_Mean_" + current_year])))
      },
      {key: "Skill_Mean",
      val: d3.mean( data.map(d => parseInt(d["Skill_Mean_" + current_year])))
      },
      {key: "Mentality_Mean",
      val: d3.mean( data.map(d => parseInt(d["Mentality_Mean_" + current_year])))
      },
      {key: "Gk_Mean",
      val: d3.mean(data.map(d => parseInt(d["Gk_Mean_" + current_year])))
      },
    ];
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
min = d3.min(data_sorted);
max = d3.max(data_sorted);

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

function update_choropleth(attribute){

  var temp = data.map(d => d["nationality"]);


  function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
  }

  var list = [];

  x_uni = temp.filter(onlyUnique);
  for (y= 0; y < x_uni.length; y++){
    value  = data.map(function(d) {if(d["nationality"] == x_uni[y]) {return parseInt(d[current_check + current_year]) }});
    list.push({
      key: x_uni[y],
      val: d3.mean(value),
    })
  };

  list = list.sort(function (a, b) {
    return b.val - a.val
  });

  var myColor = d3.scaleLinear()
  .domain([list[list.length-1].val,list[0].val])
  .range([0.05,1]);

  countryColor = myColor;

  svg_choropleth.selectAll("path")
    .style("fill", d => getValue(d.properties.name, list));
}

function create_lineChart_data (data) {
  return {
    "series": [{
      type: "overall",
      values: years.map(y => d3.mean(data, d => d["overall_" +y]))
    },
    {
      type: "Defending_Mean",
      values: years.map(y => d3.mean(data, d => d["Defending_Mean_" +y]))
    },

    {
      type: "Attacking_Mean",
      values: years.map(y => d3.mean(data, d => d["Attacking_Mean_" +y]))
    },

    {
      type: "Gk_Mean",
      values: years.map(y => d3.mean(data, d => d["Gk_Mean_" +y]))
    },

    {
      type: "Mentality_Mean",
      values: years.map(y => d3.mean(data, d => d["Mentality_Mean_" +y]))
    },

    {
      type: "Movement_Mean",
      values: years.map(y => d3.mean(data, d => d["Movement_Mean_" +y]))
    },

    {
      type: "Skill_Mean",
      values: years.map(y => d3.mean(data, d => d["Skill_Mean_" +y]))
    },

    {
      type: "potential",
      values: years.map(y => d3.mean(data, d => d["potential_" +y]))
    },

  ],
  dates: years
};
}

function create_sankey_data(country) {
  graph = {"nodes" : [], "links" : []};

  foo = data_c.filter(function (d) { if (d["Country"] === country) {return d;}});

  var fish = foo.map(d => d.Club);

  var temp = data.filter(function (d) {if (fish.includes(d["club_" + current_year])) {return d;}})


  function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
  }

  var list = [];

  x = temp.map(d => d["club_" + current_year]);
  x_uni = x.filter(onlyUnique);
  for (y= 0; y < x_uni.length; y++){
    value  = temp.map(function(d) {if(d["club_" + current_year] == x_uni[y]) {return d[current_check + current_year] }});
    list.push({
      key: x_uni[y],
      val: d3.mean(value),
    })
  }
  list = list.sort(function (a, b) {
    return b.val - a.val
  });
  list = list.slice(15)


  var temp_c = [];
  for ( z = 0; z< list.length; z++){
    temp_c.push(list[z]["key"])
  };
  var temp_club = [];
  var temp_pos = [];
  var temp_srat = [];


  temp.forEach(function (d){
    if (!temp_club.includes(d["club_" + current_year]) && !temp_c.includes(d["club_" + current_year])){
      graph.nodes.push({name: d["club_" + current_year]});
      temp_club.push(d["club_" + current_year]);
    }
    let pos = attack_position.includes(d["team_position_" + current_year]) ? "Attacker" :
                center_position.includes(d["team_position_" + current_year]) ? "Center" :
                defend_position.includes(d["team_position_" + current_year]) ? "Defender" :
                d["team_position_" + current_year] === "GK" ? "Goalkeeper" : "Substitute"
    if (!temp_pos.includes(pos)){
      graph.nodes.push({name: pos});
      temp_pos.push(pos);
    }
    if (!temp_srat.includes(d["Star_rating_" + current_year])){
      graph.nodes.push({name: d["Star_rating_" + current_year]});
      temp_srat.push(d["Star_rating_" + current_year]);
    }
    flag = true;
    if (graph.links.length > 0) {
      for (x = 0;  x < graph.links.length; x++){
        if (graph.links[x].source === d["club_" + current_year] && graph.links[x].target === d["Star_rating_" + current_year]){
          graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d["value_eur_" + current_year]);
          flag = false;
          break;
        }
      }
    }
    if (flag) {
      if (!temp_c.includes(d["club_" + current_year])) {
      graph.links.push({
        "source": d["club_" + current_year],
        "target": d["Star_rating_" + current_year],
        "value": +d["value_eur_" + current_year]
          });
        }
      };

      flag2 = true;
      for (x = 0;  x < graph.links.length; x++){
        if(attack_position.includes(d["team_position_" + current_year])){
            if (graph.links[x].source === d["Star_rating_" + current_year] && graph.links[x].target === "Attacker"){
                graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d["value_eur_" + current_year]);
                flag2=false;
                break;
              }
        } else  if(center_position.includes(d["team_position_" + current_year])) {
          if (graph.links[x].source === d["Star_rating_" + current_year] && graph.links[x].target === "Center"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d["value_eur_" + current_year]);
              flag2=false;
              break;
            }
        } else if(defend_position.includes(d["team_position_" + current_year])) {
          if (graph.links[x].source === d["Star_rating_" + current_year] && graph.links[x].target === "Defender"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d["value_eur_" + current_year]);
              flag2=false;
              break;
            }
        } else if("GK" === d["team_position_" + current_year]) {
          if (graph.links[x].source === d["Star_rating_" + current_year] && graph.links[x].target === "Goalkeeper"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d["value_eur_" + current_year]);
              flag2=false;
              break;
            }
        } else {
          if (graph.links[x].source === d["Star_rating_" + current_year] && graph.links[x].target === "Substitute"){
              graph.links[x].value = parseInt(graph.links[x].value) + parseInt(d["value_eur_" + current_year]);
              flag2=false;
              break;
            }
      };}
      if (flag2)  {
      if(attack_position.includes(d["team_position_" + current_year])){
      graph.links.push({
        "source": d["Star_rating_" + current_year],
        "target": "Attacker",
        "value": +d["value_eur_" + current_year]
      })
    } else
    if(center_position.includes(d["team_position_" + current_year])){
      graph.links.push({
        "source": d["Star_rating_" + current_year],
        "target": "Center",
        "value": +d["value_eur_" + current_year]
      })
    } else
    if(defend_position.includes(d["team_position_" + current_year])){
      graph.links.push({
        "source": d["Star_rating_" + current_year],
        "target": "Defender",
        "value": +d["value_eur_" + current_year]
      })
    } else
    if("GK" === d["team_position_" + current_year]){
      graph.links.push({
        "source": d["Star_rating_" + current_year],
        "target": "Goalkeeper",
        "value": +d["value_eur_" + current_year]
      })
    } else {
      graph.links.push({
        "source": d["Star_rating_" + current_year],
        "target": "Substitute",
        "value": +d["value_eur_" + current_year]
    })

    };}

   });
  return graph;
}
