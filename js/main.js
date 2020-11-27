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


  // var button_row = d3.select('#player')
  // .append('select')
  // .attr('id','p')
  // .attr('class', 'selectpicker show-tick')
  // .attr('data-live-search', 'true')
  // .attr('data-width', '350')
  // .attr('data-style', 'btn-primary')
  // .selectAll("option")
  // .data(data)
  // .join("option")
  // .attr("data-tokens", d => d.sofifa_id)
  // .text(d => d.long_name);


  var button_row = d3.select('#team')
  .append('select')
  .attr('id','t')
  .attr('class', 'selectpicker show-tick')
  .attr('data-live-search', 'true')
  .attr('data-width', '350')
  .attr('data-size','8')
  .attr('data-style', 'btn-primary')
  .selectAll("option")
  .data(team)
  .join("option")
  .attr("data-tokens", d => d)
  .text(d => d);



  // var button_row = d3.select('#country')
  // .append('select')
  // .attr('id','c')
  // .attr('class', 'selectpicker show-tick')
  // .attr('data-live-search', 'true')
  // .attr('data-width', '350')
  // .attr('data-style', 'btn-primary')
  // .selectAll("option")
  // .data(country)
  // .join("option")
  // .attr("data-tokens", d => d)
  // .text(d => d);




  // $('#p').on('change', function(e){
  //   //$("select option:selected").css('backgroundColor', '#FFFFF');
  //   console.log(this.value,
  //     this.options[this.selectedIndex].value,
  //     $(this).find("option:selected").val(),);
  //   });

  $('#t').on('change', function(e){
      console.log(this.value,
      this.options[this.selectedIndex].value,
      $(this).find("option:selected").val(),);
      prepare_button('club_20',this.value)
  });


  // $('#c').on('change', function(e){
  //     console.log(this.value,
  //     this.options[this.selectedIndex].value,
  //     $(this).find("option:selected").val(),);
  // });

  $('.selectpicker').selectpicker('refresh');

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
  test = create_lineChart_data(country);
  const g = svg.append("g")
  const path = g.attr("id","line_g")
  .selectAll("path")
  .data(test).enter()
    path.append("path")
    .style("mix-blend-mode", "multiply")
    .attr("fill", "none")
    .attr("stroke", "grey")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("d", d => d3.line().curve(d3.curveCatmullRom.alpha(0.5))
              ([[x(new Date(2015,0,1,0)),y(d[2015])],
              [x(new Date(2016,0,1,0)),y(d[2016])],
              [x(new Date(2017,0,1,0)),y(d[2017])],
              [x(new Date(2018,0,1,0)),y(d[2018])],
              [x(new Date(2019,0,1,0)),y(d[2019])],
              [x(new Date(2020,0,1,0)),y(d[2020])],
            ]
          )
        )

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
          "transform",
          "translate(-30 ,-10)"
        )
        .attr("class", "label")
        .attr("style","font-size:12px")
        .text("Skill Points");
    svg_line_chart = svg;
};

function create_violinChart () {
  selected_data = data.filter(function(d){ if (d.club_20 == 'Real Madrid') {return d;}});

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
      "transform",
      "translate(-30 ,-10)"
    )
    .attr("class", "label")
    .attr("style","font-size:12px")
    .text("Height [cm]");

  svg_line_chart = svg;

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

function prepare_button(selector,attribute) {
  var dataset = create_data(selector,attribute);

  var ndataset = create_lineChart_data(dataset);

  var y_line = d3.scaleLinear()
  .domain([0,100])
  .range([height,0])
  .nice();
  var x_line = d3.scaleTime()
  .domain([new Date(2015, 0, 1, 0), new Date(2020, 0, 1, 0)])
  .range([0, width])
  .nice();

  var g_l = svg_line_chart.selectAll("#line_g");
  g_l.selectAll("path").remove();
  g_l.selectAll("path")
    .data(ndataset)
      .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("fill", "none")
      .attr("stroke", "grey")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      // .attr("d", d => line(d))
      .attr("d", d => d3.line().curve(d3.curveCatmullRom.alpha(0.5))
                ([[x_line(new Date(2015,0,1,0)),y_line(d[2015])],
                [x_line(new Date(2016,0,1,0)),y_line(d[2016])],
                [x_line(new Date(2017,0,1,0)),y_line(d[2017])],
                [x_line(new Date(2018,0,1,0)),y_line(d[2018])],
                [x_line(new Date(2019,0,1,0)),y_line(d[2019])],
                [x_line(new Date(2020,0,1,0)),y_line(d[2020])],
              ]
            )
          );

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

    update_area_Chart(y,x,4,att_data,g_b,g_a);

    update_area_Chart(y,x,3,cen_data,g_b,g_a);

    update_area_Chart(y,x,2,def_data,g_b,g_a);
    update_area_Chart(y,x,1,gk_data,g_b,g_a);

    prepare_event();
}

function prepare_event() {
  dispatch = d3.dispatch("lineEvent");

  svg_line_chart.select("#line_g").selectAll("path").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_violin_chart.selectAll("#area").on("mouseover", function (event, d) {
    dispatch.call("lineEvent", this, d);
  });

  svg_line_chart.select("#line_g").selectAll("path").on("mousemove", moved);
  svg_line_chart.select("#line_g").selectAll("path").on("mousleave", left);

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
  function left() {
    dot.attr("display", "none");
  }

  dispatch.on("lineEvent", function (category) {
    // Remove highlight
    //if (selectedLine != null) {
    //  d3.select("highlight").remove()
    //}

    // Update Line Chart
    if (selectedLine != null) {
      selectedLine.attr("stroke","grey");
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

    selectedLine.attr("stroke", "blue");

    // Update Area Chart
    if(selectedViolin = null) {
       selectedViolin.attr("fill", function(d) {
         return "grey"
       })
    };

    selectedViolin = svg_violin_chart.selectAll("#area").filter(function (d) {
        return (d[0].type.includes(category.type)) || category == d;
    });

    selectedViolin.attr("fill", "blue");

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
}
