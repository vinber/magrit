var display_discretization = function(layer_name, field_name, nb_class, type){

    var func_switch = function(name){
        var obj = {
            "Jenks": serie.getJenks(nb_class),
            "Equal interval": serie.getEqInterval(nb_class),
            "Standard deviation": serie.getStdDeviation(nb_class),
            "Geometric progression": serie.getGeometricProgression(nb_class),
            "Arithmetic progression": serie.getArithmeticProgression(nb_class)
        }
        return obj[name];
    }

    var redisplay = function(){
        if(type==="Q4") {
            nb_class = 4;
            disc_nb_class.node().value = nb_class;
            txt_nb_class.html(nb_class+" class");
            breaks = serie.getQuantiles(nb_class);
        } else if(type==="Q6"){
            nb_class = 6;
            disc_nb_class.node().value = nb_class;
            txt_nb_class.html(nb_class+" class");
            breaks = serie.getQuantiles(nb_class);
        } else{
            breaks = func_switch[type]
        }
        d3.selectAll(".bar").remove()
        d3.selectAll(".text_bar").remove()
        //d3.selectAll(".x.axis").remove()
        var data = d3.layout.histogram()
            .bins(x.ticks(nb_class))
            (values);
        
        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.y; })])
            .range([svg_h, 0]);
        
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
    
        var bar = svg_histo.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
        
        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - 1)
            .attr("height", function(d) { return height - y(d.y); })
            .style("fill", "beige");
        
        bar.append("text")
            .attr("dy", ".75em")
            .attr("y", 6)
            .attr("x", x(data[0].dx) / 2)
            .attr("text-anchor", "middle")
            .attr("class", "text_bar")
            .text(function(d) { return formatCount(d.y); });
        
        svg_histo.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    
        var resume = ["<b>Summary</b><br><br>",  serie.info(),
                      "<br><b>Current break values : </b>", JSON.stringify(breaks)].join('')
        summary.html(resume)
    };

    var newBox = d3.select("body").append("div")
                     .style({"font-size":"12px"})
                     .attr("id", "discretiz_charts")
                     .attr("title", layer_name);

    newBox.append('h2').html("Discretization panel");
    var discretization = newBox.append('div')
                                .attr("id", "discretization_panel")
                                .insert("p").html("Type")
                                .insert("select").attr("class", "params")
                                .on("change", function(){
                                    type = this.value;
                                    redisplay();
                                    });

    ["Jenks", "Q4", "Q6", "Equal interval", "Standard deviation", "Geometric progression"].forEach(function(name){
        discretization.append("option").text(name).attr("value", name);
    });
    discretization.node().value = type;

    var values = [],
        nb_values = user_data[layer_name].length,
        txt_nb_class = d3.select("#discretization_panel").insert("p").html(nb_class+" class"),
        disc_nb_class = d3.select("#discretization_panel")
                            .insert('p').style("display", "inline")
                            .html("Number of class")
                            .append("input")
                            .attr("type", "range")
                            .attr({min: 0, max: 20, value: nb_class, step:1})
                            .on("change", function(){
                                nb_class = this.value;
                                txt_nb_class.html(nb_class+" class");
                                redisplay();
                                });

    for(var i=0; i<nb_values; i++){values.push(Number(user_data[layer_name][i][field_name]));}
    console.log([values, nb_values])

    var serie = new geostats(values),
        breaks = [];
    serie.setPrecision(4);

    var svg_h = h - 185,
        svg_w = w - 200;

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = svg_w - margin.left - margin.right,
        height = svg_h - margin.top - margin.bottom;

    var formatCount = d3.format(",.0f");
    
    var svg_histo = newBox.append("svg")
        .attr("width", svg_w + margin.left + margin.right)
        .attr("height", svg_h + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var summary = newBox.append('p').attr("id", "summary").html("");

    var x = d3.scale.linear()
        .domain([0, serie.max()])
        .range([0, svg_w]);

    redisplay();
    var deferred = Q.defer();
    $("#discretiz_charts").dialog({
        modal:true,
        resizable: true,
        width: w-30,
        height: h+30,
        buttons:[{
            text: "Confirm",
            click: function(){
                    deferred.resolve([nb_class, type, breaks]);
                    $(this).dialog("close");
                    }
                },
           {
            text: "Cancel",
            click: function(){
                $(this).dialog("close");
                $(this).remove();}
           }],
        close: function(event, ui){
                $(this).dialog("destroy").remove();
                if(deferred.promise.isPending()){
                    deferred.resolve(false);
                }
            }
      });
    return deferred.promise;
}
