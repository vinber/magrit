"use strict";

var display_discretization_links_discont = function(layer_name, field_name, nb_class, type){
    var func_switch = {to: function(name){return this.target[name];},
        target: {
            "Jenks": "serie.getJenks(nb_class)",
            "Equal interval": "serie.getEqInterval(nb_class)",
            "Standard deviation": "serie.getStdDeviation(nb_class)",
            "Quantiles": "serie.getQuantile(nb_class)",
            "Arithmetic progression": "serie.getArithmeticProgression(nb_class)",
            "Q6": "getBreaksQ6(values)"
        }
    }

    var make_box_histo_option = function(){
        var histo_options = newBox.append('div').attr("id", "histo_options");

        var a = histo_options.append("p").style("margin", 0).style("display", "inline");
        var b = histo_options.append("p").style("margin", 0).style("display", "inline");
        var c = histo_options.append("p").style("margin", 0).style("display", "inline");

        a.insert("input")
            .attrs({type: "checkbox", value: "mean"})
            .on("change", function(){
                    if(line_mean.classed("active")){
                        line_mean.style("stroke-width", 0)
                        txt_mean.style("fill", "none")
                        line_mean.classed("active", false)
                    } else {
                        line_mean.style("stroke-width", 2)
                        txt_mean.style("fill", "red")
                        line_mean.classed("active", true)
                    }
                });

        b.insert("input")
            .attrs({type: "checkbox", value: "median"})
            .on("change", function(){
                    if(line_median.classed("active")){
                        line_median.style("stroke-width", 0)
                        txt_median.style("fill", "none")
                        line_median.classed("active", false)
                    } else {
                        line_median.style("stroke-width", 2)
                        txt_median.style("fill", "blue")
                        line_median.classed("active", true)
                    }
                });

        c.insert("input")
            .attrs({type: "checkbox", value: "std"})
            .on("change", function(){
                    if(line_std_left.classed("active")){
                        line_std_left.style("stroke-width", 0)
                        line_std_left.classed("active", false)
                        line_std_right.style("stroke-width", 0)
                        line_std_right.classed("active", false)
                    } else {
                        line_std_left.style("stroke-width", 2)
                        line_std_left.classed("active", true)
                        line_std_right.style("stroke-width", 2)
                        line_std_right.classed("active", true)
                    }
                })
        a.append("label_it_inline")
            .attr("class", "label_it_inline")
            .html(i18next.t("disc_box.disp_mean") + "<br>");
        b.append("label_it_inline")
            .attr("class", "label_it_inline")
            .html(i18next.t("disc_box.disp_median") + "<br>");
        c.append("label_it_inline")
            .attr("class", "label_it_inline")
            .html(i18next.t("disc_box.disp_sd") + "<br>");

    };

    var display_ref_histo = function(){
        var svg_h = h / 7.25 > 75 ? h / 7.25 : 75,
            svg_w = w / 4.75,
            nb_bins = 81 < (values.length / 3) ? 80 : Math.ceil(Math.sqrt(values.length)) + 1;

        nb_bins = nb_bins < 3 ? 3 : nb_bins;
        nb_bins = nb_bins > values.length ? nb_bins : values.length;

        var margin = {top: 5, right: 7.5, bottom: 15, left: 22.5},
            width = svg_w - margin.right - margin.left;
            height = svg_h - margin.top - margin.bottom;

        var ref_histo = newBox.append('div').attr("id", "ref_histo_box");
        ref_histo.append('p').style("margin", "auto")
                  .html('<b>Distribution reference histogram</b>');

        var svg_ref_histo = ref_histo.append("svg").attr("id", "svg_ref_histo")
            .attr("width", svg_w + margin.left + margin.right)
            .attr("height", svg_h + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear()
            .domain([serie.min(), serie.max()])
            .rangeRound([0, width]);

        var data = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(nb_bins))
            (values);

        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d.length; })])
            .range([height, 0]);

        var bar = svg_ref_histo.selectAll(".bar")
            .data(data)
          .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 1)
            .attr("width", x(data[1].x1) - x(data[1].x0))
            .attr("height",  d => height - y(d.length))
            .attr("transform", function(d){return "translate(" + x(d.x0) + "," + y(d.length) + ")";})
            .styles({fill: "beige", stroke: "black", "stroke-width": "0.4px"});

        svg_ref_histo.append("g")
            .attr("class", "x axis")
            .style("font-size", "10px")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom()
                .scale(x)
                .ticks(4))
            .selectAll("text")
                .attr("y", 4).attr("x", -4)
                .attr("dy", ".45em")
                .attr("transform", "rotate(-40)")
                .style("text-anchor", "end");

        svg_ref_histo.append("g")
            .attr("class", "y axis")
            .style("font-size", "10px")
            .call(d3.axisLeft()
                .scale(y)
                .ticks(5));
    }

    var make_summary = function(){
        let content_summary = (serie.info()).split("-").join("<br>").split("\n").join("<br>");
        newBox.append("div").attr("id","summary")
                        .style("font-size", "10px").style("float", "right")
                        .styles({"margin-left": "25px", "margin-right": "50px"})
                        .insert("p").html(["<b>Summary</b><br>", content_summary].join(""));
    }

    var update_breaks = function(user_defined){
        if(!user_defined){
            make_min_max_tableau(values, nb_class, type, last_min, last_max, "sizes_div");
        }
        let tmp_breaks = fetch_min_max_table_value("sizes_div");
        breaks_info = [];
        last_min = tmp_breaks.sizes[0];
        last_max = tmp_breaks.sizes[tmp_breaks.sizes.length - 1];
        for(let i = 0; i<tmp_breaks.sizes.length; i++)
            breaks_info.push([[tmp_breaks.mins[i], tmp_breaks.maxs[i]], tmp_breaks.sizes[i]]);
        breaks = [breaks_info[0][0][0]].concat(breaks_info.map(ft => ft[0][1]));
        if(user_defined){
            make_min_max_tableau(null, nb_class, type, last_min, last_max, "sizes_div", breaks_info);
        }
    }

    var redisplay = {
        compute: function(old_nb_class){
            bins = [];
            for(let i = 0, len = breaks_info.length; i < len; i++){
                let bin = {};
//                bin.val = stock_class[i] + 1;
                bin.offset = i == 0 ? 0 : (bins[i-1].width + bins[i-1].offset);
                bin.width = breaks[i+1] - breaks[i];
                bin.height = breaks_info[i][1];
                bins[i] = bin;
            }
            return true;
        },
        draw: function(){
                // Clean-up previously made histogram :
            d3.select("#svg_discretization").selectAll(".bar").remove();
            d3.select("#svg_discretization").selectAll(".y.axis").remove();

            for(let i=0, len = bins.length; i<len; ++i)
                bins[i].color = ColorsSelected.random();

            var x = d3.scaleLinear()
                .range([0, svg_w]);

            var y = d3.scaleLinear()
                .range([svg_h, 0]);

            x.domain([0, d3.max(bins.map(function(d) { return d.offset + d.width; }))]);
            y.domain([0, d3.max(bins.map(function(d) { return d.height + d.height / 5; }))]);

            var bar = svg_histo.selectAll(".bar")
                .data(bins)
              .enter().append("rect")
                .attr("class", "bar")
                .attr("transform", "translate(0, -17.5)")
                .style("fill", function(d){return d.color;})
                .styles({"opacity": 0.5, "stroke-opacity":1})
                .attr("x", function(d){ return x(d.offset);})
                .attr("width", function(d){ return x(d.width);})
                .attr("y", function(d){ return y(d.height) - margin.bottom;})
                .attr("height", function(d){ return svg_h - y(d.height);});

            svg_histo.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0, -" + (margin.top + margin.bottom) +")")
                .call(d3.axisLeft()
                    .scale(y)
                    .ticks(5));

            return true;
        },
    };

    //////////////////////////////////////////////////////////////////////////

    var formatCount = d3.format(",.0f");

    var newBox = d3.select("body").append("div")
                     .style("font-size", "12px")
                     .attr("id", "discretiz_charts")
                     .attr("title", ["Discretization panel - ", layer_name, " - ", field_name].join(''));

    if(result_data.hasOwnProperty(layer_name)) var db_data = result_data[layer_name];
    else if(user_data.hasOwnProperty(layer_name)) var db_data = user_data[layer_name];

    var color_array = [],
        nb_values = db_data.length,
        indexes = [],
        values = [],
        no_data;

    for(let i=0; i<nb_values; i++){
        if(db_data[i][field_name] != null){
            values.push(+db_data[i][field_name]);
            indexes.push(i);
        }
    }

    if(nb_values == values.length){
        no_data = 0;
    } else {
        no_data = nb_values - values.length;
        nb_values = values.length;
    }

    var serie = new geostats(values),
        breaks_info = [].concat(current_layers[layer_name].breaks),
        breaks = [+breaks_info[0][0][0]],
        stock_class = [],
        bins = [],
        max_nb_class = 22 < nb_values ? 22 : nb_values,
        sizes = current_layers[layer_name].breaks.map(el => el[1]),
        last_min = min_fast(sizes),
        last_max = max_fast(sizes);

    breaks_info.forEach(elem => { breaks.push(elem[0][1]) });

    if(serie.variance() == 0 && serie.stddev() == 0){
        var serie = new geostats(values);
    }

    values = serie.sorted();
    serie.setPrecision(6);
    var available_functions = ["Jenks", "Quantiles", "Equal interval", "Standard deviation", "Q6", "Arithmetic progression", "User defined"];
    if(!serie._hasZeroValue()){
        available_functions.push("Geometric progression");
        func_switch.target["Geometric progression"] = "serie.getGeometricProgression(nb_class)"
    }

    var discretization = newBox.append('div') // .styles({"margin-top": "30px", "padding-top": "10px"})
                                .attr("id", "discretization_panel")
                                .insert("p").html("Type ")
                                .insert("select").attr("class", "params")
                                .on("change", function(){
                                    type = this.value;
                                    if(type === "Q6"){
                                        nb_class = 6;
                                        txt_nb_class.html(6 + " class");
                                        d3.select("#nb_class_range").node().value = 6;
                                    }
                                    update_breaks();
                                    redisplay.compute();
                                    redisplay.draw();
                                    });

    available_functions.forEach(function(name){
        discretization.append("option").text(name).attr("value", name);
    });

    discretization.node().value = type;
    make_box_histo_option();
    make_summary();
    display_ref_histo();

    var txt_nb_class = d3.select("#discretization_panel").insert("p").style("display", "inline").html(nb_class+" class"),
        disc_nb_class = d3.select("#discretization_panel")
                            .insert("input")
                            .style("display", "inline")
                            .attr("id", "nb_class_range")
                            .attr("type", "range")
                            .attrs({min: 2, max: max_nb_class, value: nb_class, step:1})
                            .on("change", function(){
                                type = discretization.node().value;
                                if(type == "User defined"){
                                    type = "Equal interval";
                                    discretization.node().value = "Equal interval";
                                    }
                                var old_nb_class = nb_class;
                                if(type === "Q6"){
                                    this.value = 6;
                                    return;
                                }
                                nb_class = this.value;
                                txt_nb_class.html(nb_class+" class");
                                update_breaks();
                                redisplay.compute();
                                redisplay.draw();
                            });

    var svg_h = h / 5 > 90 ? h / 5 : 90,
        svg_w = w - (w / 8),
        margin = {top: 17.5, right: 30, bottom: 7.5, left: 30},
        height = svg_h - margin.top - margin.bottom;

    var div_svg = newBox.append('div')
        .append("svg").attr("id", "svg_discretization")
        .attr("width", svg_w + margin.left + margin.right)
        .attr("height", svg_h + margin.top + margin.bottom);

    var svg_histo = div_svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var overlay_svg = div_svg.append("g");

    var x = d3.scaleLinear()
        .domain([serie.min(), serie.max()])
        .range([0, svg_w]);

    let mean_val = serie.mean(),
        stddev = serie.stddev();

    var line_mean = overlay_svg.append("line")
        .attr("class", "line_mean")
        .attr("x1", x(mean_val))
        .attr("y1", 10)
        .attr("x2", x(mean_val))
        .attr("y2", svg_h - margin.bottom)
        .styles({"stroke-width": 0, stroke: "red", fill: "none"})
        .classed("active", false);

    var txt_mean = overlay_svg.append("text")
        .attr("y", 0)
        .attr("dy", "0.75em")
        .attr("x", x(mean_val))
        .style("fill", "none")
        .attr("text-anchor", "middle")
        .text("Mean");

    var line_median = overlay_svg.append("line")
        .attr("class", "line_med")
        .attr("x1", x(serie.median()))
        .attr("y1", 10)
        .attr("x2", x(serie.median()))
        .attr("y2", svg_h - margin.bottom)
        .styles({"stroke-width": 0, stroke: "blue", fill: "none"})
        .classed("active", false);

    var txt_median = overlay_svg.append("text")
        .attr("y", 0)
        .attr("dy", "0.75em")
        .attr("x", x(serie.median()))
        .style("fill", "none")
        .attr("text-anchor", "middle")
        .text("Median");

    var line_std_left = overlay_svg.append("line")
        .attr("class", "lines_std")
        .attr("x1", x(mean_val - stddev))
        .attr("y1", 10)
        .attr("x2", x(mean_val - stddev))
        .attr("y2", svg_h - margin.bottom)
        .styles({"stroke-width": 0, stroke: "grey", fill: "none"})
        .classed("active", false);

    var line_std_right = overlay_svg.append("line")
        .attr("class", "lines_std")
        .attr("x1", x(mean_val + stddev))
        .attr("y1", 10)
        .attr("x2", x(mean_val + stddev))
        .attr("y2", svg_h - margin.bottom)
        .styles({"stroke-width": 0, stroke: "grey", fill: "none"})
        .classed("active", false);


    // As the x axis and the mean didn't change, they can be drawn only once :
    svg_histo.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom()
        .scale(x));

    var box_content = newBox.append("div").attr("id", "box_content");
    box_content.append("h3").style("margin", "0").html("<b>Line size</b>");
    var sizes_div =  d3.select("#box_content")
                            .append("div").attr("id", "sizes_div");
    make_min_max_tableau(null, nb_class, type, null, null, "sizes_div", breaks_info);
    box_content.append("p")
            .insert("button")
            .attr("class", "button_st3")
            .html("Apply changes")
            .on("click", function(){
                discretization.node().value = type;
                update_breaks(true);
                redisplay.compute();
                redisplay.draw();
            });
    redisplay.compute();
    redisplay.draw();

    var deferred = Q.defer();
    $("#discretiz_charts").dialog({
        modal:true,
        resizable: true,
        width: +w - 10,
        height: +h + 60,
        buttons:[{
            text: "Confirm",
            click: function(){
                    breaks[0] = serie.min();
                    breaks[nb_class] = serie.max();
//                    if(breaks[0] < serie.min())
//                        breaks[0] = serie.min();
//
//                    if(breaks[nb_class] > serie.max())
//                        breaks[nb_class] = serie.max();

                    deferred.resolve([serie, breaks_info, breaks]);
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
