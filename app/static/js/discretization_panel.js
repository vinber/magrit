var display_discretization = function(layer_name, field_name, nb_class, type){

    var func_switch = function(name, n_class){
        var obj = {
            "Jenks": serie.getJenks(n_class),
            "Equal interval": serie.getEqInterval(n_class),
            "Standard deviation": serie.getStdDeviation(n_class),
            "Arithmetic progression": serie.getArithmeticProgression(n_class)
        }
        return obj[name];
    }

    var display_ref_histo = function(){
        var svg_h = h/8,
            svg_w = w/5,
            nb_bins = 151 < (values.length / 3) ? 150 : Math.round(values.length / 3);

        nb_bins = nb_bins < 3 ? 3 : nb_bins;

        var margin = {top: 5, right: 5, bottom: 5, left: 5},
            height = svg_h - margin.top - margin.bottom;
         
        var svg_ref_histo = newBox.append("svg").attr("id", "svg_ref_histo")
            .attr("width", svg_w + margin.left + margin.right)
            .attr("height", svg_h + margin.top + margin.bottom)
            .style({position: "absolute", top: "5px", right: "10px"})
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .domain([0, serie.max()])
            .range([0, svg_w]);

        var data = d3.layout.histogram()
            .bins(x.ticks(nb_bins))
            (values);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.y; })])
            .range([svg_h, 0]);

        console.log([x, data, y])

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
    
        var bar = svg_ref_histo.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - 1)
            .attr("height", function(d) { return height - y(d.y); })
            .style({fill: "beige", stroke: "black", "stroke-width": "0.5px"});

        svg_ref_histo.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
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
            breaks = func_switch(type, nb_class);
        }

        d3.select("#svg_discretization").selectAll(".bar").remove();
        d3.select("#svg_discretization").selectAll(".text_bar").remove();
        d3.select("#svg_discretization").selectAll(".x.axis").remove();

        var x = d3.scale.linear()
            .range([0, svg_w]);

        var y = d3.scale.linear()
            .range([svg_h, 0]);

        var bins = [];
        for(var i = 0, len = values.length; i < len; i++){
            bin = {};
            bin.val = values[i];
            bin.offset = values[i - 1];
            bin.width = bin.val - bin.offset;
            bin.height = bin.val / bin.width;
            bins[i] = bin;
        }

        bins.shift();

        x.domain([0, d3.max(bins.map(function(d) { return d.offset + d.width; }))]);
        y.domain([0, d3.max(bins.map(function(d) { return d.height; }))]);

        var bar = svg_histo.selectAll(".bar")
            .data(bins)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d){ return x(d.offset);})
            .attr("width", function(d){ return x(d.width) - 1;})
            .attr("y", function(d){ return y(d.height);})
            .attr("height", function(d){ return height - y(d.height);})
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        svg_histo.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis()
            .scale(x)
            .orient("bottom"));

        var resume = ["<b>Summary</b><br><br>",  serie.info(),
                      "<br><i>Current break values</i> : <b>", breaks.join(', '), " <b>"].join('')
        summary.html(resume)
    };


//    var redisplay = function(){
//        if(type==="Q4") {
//            nb_class = 4;
//            disc_nb_class.node().value = nb_class;
//            txt_nb_class.html(nb_class+" class");
//            breaks = serie.getQuantiles(nb_class);
//        } else if(type==="Q6"){
//            nb_class = 6;
//            disc_nb_class.node().value = nb_class;
//            txt_nb_class.html(nb_class+" class");
//            breaks = serie.getQuantiles(nb_class);
//        } else{
//            breaks = func_switch(type, nb_class);
//        }
//        d3.select("#svg_discretization").selectAll(".bar").remove();
//        d3.select("#svg_discretization").selectAll(".text_bar").remove()
//        d3.select("#svg_discretization").selectAll(".x.axis").remove()
//
//        var data = d3.layout.histogram()
//            .bins(x.ticks(nb_class))
//            (values);
//        if(data.length != nb_class){
//            nb_class = data.length;
//            disc_nb_class.node().value = nb_class;
//            txt_nb_class.html(nb_class+" class");
//            //breaks = func_switch(type, nb_class);
//        }
//        var y = d3.scale.linear()
//            .domain([0, d3.max(data, function(d) { return d.y; })])
//            .range([svg_h, 0]);
//        
//        var xAxis = d3.svg.axis()
//            .scale(x)
//            .orient("bottom");
//    
//        var bar = svg_histo.selectAll(".bar")
//            .data(data)
//          .enter().append("g")
//            .attr("class", "bar")
//            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
//
//        bar.append("rect")
//            .attr("x", 1)
//            .attr("width", x(data[0].dx) - 1)
//            .attr("height", function(d) { return height - y(d.y); })
//            .style({fill: "beige", stroke: "black", "stroke-width": "0.5px"});
//
//        bar.append("text")
//            .attr("dy", ".75em")
//            .attr("y", 1)
//            .attr("x", x(data[0].dx) / 2)
//            .attr("text-anchor", "middle")
//            .attr("class", "text_bar")
//            .text(function(d) { return formatCount(d.y); });
//
//        svg_histo.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis);
//
//        var resume = ["<b>Summary</b><br><br>",  serie.info(),
//                      "<br><i>Current break values</i> : <b>", breaks.join(', '), " <b>"].join('')
//        summary.html(resume)
//    };

    var formatCount = d3.format(",.0f");

    var newBox = d3.select("body").append("div")
                     .style({"font-size":"12px"})
                     .attr("id", "discretiz_charts")
                     .attr("title", layer_name);

    var values = [],
        nb_values = user_data[layer_name].length;

    for(var i=0; i<nb_values; i++){values.push(Number(user_data[layer_name][i][field_name]));}

    var serie = new geostats(values),
        breaks = [];

    serie.setPrecision(4);

    newBox.append('h2').html("Discretization panel");
    var discretization = newBox.append('div')
                                .attr("id", "discretization_panel")
                                .insert("p").html("Type")
                                .insert("select").attr("class", "params")
                                .on("change", function(){
                                    type = this.value;
                                    redisplay();
                                    });

    ["Jenks", "Q4", "Q6", "Equal interval", "Standard deviation"].forEach(function(name){
        discretization.append("option").text(name).attr("value", name);
    });
    discretization.node().value = type;
    display_ref_histo();

    var txt_nb_class = d3.select("#discretization_panel").insert("p").html(nb_class+" class"),
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

    var svg_h = h/5,
        svg_w = w - (w/8);

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        height = svg_h - margin.top - margin.bottom;
  
    var svg_histo = newBox.append("svg").attr("id", "svg_discretization")
        .attr("width", svg_w + margin.left + margin.right)
        .attr("height", svg_h + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var summary = newBox.append('p').attr("id", "summary").html("");

    var x = d3.scale.linear()
        .domain([serie.min(), serie.max()])
        .range([0, svg_w]);

    redisplay();
    var deferred = Q.defer();
    $("#discretiz_charts").dialog({
        modal:true,
        resizable: true,
        width: w-30,
        height: h+60,
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
