"use strict";

//function get_color_array(col_scheme, nb_class, selected_palette){
//    var color_array = new Array;
//    if(col_scheme === "Sequential"){
//        color_array = getColorBrewerArray(nb_class, selected_palette);
//    } else if(col_scheme === "Diverging"){
//        var left_palette = selected_palette.left,
//            right_palette = selected_palette.right,
//            ctl_class_value = selected_palette.ctl_class,
//            class_right = nb_class - ctl_class_value;
//
//        if(ctl_class_value <= class_right){
//            var right_pal = getColorBrewerArray(class_right, right_palette),
//                left_pal = getColorBrewerArray(class_right, left_palette);
//            left_pal = left_pal.slice(0, ctl_class_value)
//        } else {
//            var right_pal = getColorBrewerArray(ctl_class_value, right_palette),
//                left_pal = getColorBrewerArray(ctl_class_value, left_palette);
//            right_pal = right_pal.slice(0, ctl_class_value);
//        }
//        left_pal = left_pal.reverse()
//        color_array = left_pal.concat(right_pal);
//    }
//    return color_array;
//}

function discretize_to_size(values, type, nb_class, min_size, max_size){
    var func_switch = {
        to: function(name){return this.target[name];},
        target: {
            "Jenks": "serie.getJenks(nb_class)",
            "Equal interval": "serie.getEqInterval(nb_class)",
            "Standard deviation": "serie.getStdDeviation(nb_class)",
            "Quantiles": "serie.getQuantile(nb_class)",
            "Arithmetic progression": "serie.getArithmeticProgression(nb_class)",
            "Q6": "getBreaksQ6(values)",
        }
    }

    var serie = new geostats(values),
        nb_class = +nb_class || Math.floor(1 + 3.3 * Math.log10(values.length)),
        step = (max_size - min_size) / (nb_class - 1),
        breaks = new Array(),
        class_size = Array(nb_class).fill(0).map((d,i) => min_size + (i * step)),
        breaks_prop = new Array(),
        rendering_params = new Object(),
        tmp, ir;

    var val = func_switch.to(type);
    if(type === "Q6"){
        tmp = eval(val);
        breaks = tmp.breaks;
        serie.setClassManually(breaks);
    } else {
        breaks = eval(val);
//        // In order to avoid class limit falling out the serie limits with Std class :
//        breaks[0] = breaks[0] < serie.min() ? serie.min() : breaks[0];
        ir = serie.getInnerRanges();
        if(!ir) return false;
    }
    for(let i = 0; i<breaks.length-1; ++i)
        breaks_prop.push([[breaks[i], breaks[i+1]], class_size[i]]);
    return [nb_class, type, breaks_prop];
}


function discretize_to_colors(values, type, nb_class, col_ramp_name){
    var func_switch = {
        to: function(name){return this.target[name];},
        target: {
            "Jenks": "serie.getJenks(nb_class)",
            "Equal interval": "serie.getEqInterval(nb_class)",
            "Standard deviation": "serie.getStdDeviation(nb_class)",
            "Quantiles": "serie.getQuantile(nb_class)",
            "Arithmetic progression": "serie.getArithmeticProgression(nb_class)",
            "Q6": "getBreaksQ6(values)",
        }
    }

    var serie = new geostats(values),
        sorted_values = serie.sorted(),
        nb_class = nb_class || Math.floor(1 + 3.3 * Math.log10(values.length)),
        col_ramp_name = col_ramp_name || "Reds",
        breaks = new Array(),
        stock_class = new Array(),
        bounds = new Array(),
        rendering_params = new Object(),
        colors_map = new Array(),
        tmp, color_array, ir;

    var val = func_switch.to(type);
    if(type === "Q6"){
        tmp = eval(val);
        stock_class = tmp.stock_class;
        breaks = tmp.breaks;
        serie.setClassManually(breaks);
    } else {
        breaks = eval(val);
        // In order to avoid class limit falling out the serie limits with Std class :
        breaks[0] = breaks[0] < serie.min() ? serie.min() : breaks[0];
        ir = serie.getInnerRanges();
        if(!ir) return false;
    }

    color_array = getColorBrewerArray(nb_class, col_ramp_name);
    for(let j=0; j<sorted_values.length; ++j){
        var idx = serie.getClass(values[j])
        colors_map.push(color_array[idx])
    }
    return [nb_class, type, breaks, color_array, colors_map];
}

var display_discretization = function(layer_name, field_name, nb_class, type){
    var func_switch = {
        to: function(name){return this.target[name];},
        target: {
            "Jenks": "serie.getJenks(nb_class)",
            "Equal interval": "serie.getEqInterval(nb_class)",
            "Standard deviation": "serie.getStdDeviation(nb_class)",
            "Quantiles": "serie.getQuantile(nb_class)",
            "Arithmetic progression": "serie.getArithmeticProgression(nb_class)",
            "Q6": "getBreaksQ6(values)",
            "user_defined": "getBreaks_userDefined(values, user_break_list)"
        }
    }

    var make_sequ_button = function(){
        var col_div = d3.select("#color_div");
        col_div.selectAll('.color_params').remove();
        col_div.selectAll('.color_txt').remove();
        col_div.selectAll('.color_txt2').remove();
        col_div.selectAll('.central_class').remove();
        col_div.selectAll('#reverse_pal_btn').remove();
        var sequential_color_select = col_div.insert("p")
                                                .attr("class", "color_txt")
                                                .html("Color palette ")
                                             .insert("select")
                                                .attr("class", "color_params")
                                                .on("change", function(){
                                                    redisplay.draw() });

        ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd',
         'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn',
         'Greens', 'Greys', 'Oranges', 'Purples',
         'Reds'].forEach(function(name){
            sequential_color_select.append("option").text(name).attr("value", name);
        });
        var button_reverse = d3.select(".color_txt").insert("button")
                                .style({"display": "inline", "margin-left": "10px"})
                                .attr({"class": "button_st3", "id": "reverse_pal_btn"})
                                .html("Reverse palette")
                                .on("click", function(){
                                    to_reverse = true;
                                    redisplay.draw();
                                    });
    };

    var make_diverg_button = function(){
        var col_div = d3.select("#color_div");
        col_div.selectAll('.color_params').remove();
        col_div.selectAll('.color_txt').remove();
        col_div.selectAll('.color_txt2').remove();
        col_div.selectAll('#reverse_pal_btn').remove();
        col_div.insert('p')
                .attr("class", "central_class")
                .html("Central class : ")
               .insert("input").attr({
                   type: "number", class: "central_class", id: "centr_class",
                   min: 1, max: nb_class-1, step: 1, value: Math.round(nb_class / 2)
                   })
               .on("change", function(){redisplay.draw();});

        var pal_names = ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd',
                         'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn',
                         'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'];
        var left_color_select = col_div.insert("p")
                        .attr("class", "color_txt")
                        .style("display", "inline")
                        .html("Left-side color ramp ")
                        .insert("select").attr("class", "color_params_left")
                        .on("change", function(){ redisplay.draw() });
        var right_color_select = col_div.insert("p")
                        .style({display: "inline", "margin-left": "70px"})
                        .attr("class", "color_txt2")
                        .html("Right-side color ramp ")
                        .insert("select").attr("class", "color_params_right")
                        .on("change", function(){ redisplay.draw() });
        pal_names.forEach(function(name){
            left_color_select.append("option").text(name).attr("value", name);
            right_color_select.append("option").text(name).attr("value", name)
        });
        document.getElementsByClassName("color_params_right")[0].selectedIndex = 14;
    };

    var make_box_histo_option = function(){
        var histo_options = newBox.append('div').attr("id", "histo_options");

        var a = histo_options.append("p").style("margin", 0);
        var b = histo_options.append("p").style("margin", 0);
        var c = histo_options.append("p").style("margin", 0);

        a.insert("input")
            .attr({type: "checkbox", value: "mean"})
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
            .attr({type: "checkbox", value: "median"})
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
            .attr({type: "checkbox", value: "std"})
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
            .html("Display mean<br>");
        b.append("label_it_inline")
            .attr("class", "label_it_inline")
            .html("Display median<br>");
        c.append("label_it_inline")
            .attr("class", "label_it_inline")
            .html("Display standard deviation<br>");
    };

    var display_ref_histo = function(){
        var svg_h = h / 7.75,
            svg_w = w / 4.75,
            nb_bins = 81 < (values.length / 3) ? 80 : Math.ceil(Math.sqrt(values.length)) + 1;

        nb_bins = nb_bins < 3 ? 3 : nb_bins;
        nb_bins = nb_bins > values.length ? nb_bins : values.length;

        console.log(nb_bins)

        var margin = {top: 5, right: 7.5, bottom: 15, left: 22.5},
            width = svg_w - margin.right - margin.left;
            height = svg_h - margin.top - margin.bottom;

        var ref_histo = newBox.append('div').attr("id", "ref_histo_box");
        ref_histo.append('p').html('<i>Distribution reference histogram</i>');

        var svg_ref_histo = ref_histo.append("svg").attr("id", "svg_ref_histo")
            .attr("width", svg_w + margin.left + margin.right)
            .attr("height", svg_h + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .domain([serie.min(), serie.max()])
            .range([0, width]);

        var data = d3.layout.histogram()
            .bins(x.ticks(nb_bins))
            (values);

        console.log(data)

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.y + 2.5; })])
            .range([height, 0]);

        var bar = svg_ref_histo.selectAll(".bar")
            .data(data)
          .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.x))
            .attr("y", d =>  y(d.y) - margin.bottom)
            .attr("width", x(data[1].x) - x(data[0].x))
            .attr("height", d => height - y(d.y))
            .attr("transform", "translate(0, "+ margin.bottom +")")
            .style({fill: "beige", stroke: "black", "stroke-width": "0.4px"});

        svg_ref_histo.append("g")
            .attr("class", "x axis")
            .style("font-size", "10px")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis()
                .scale(x)
                .ticks(4)
                .orient("bottom"))
            .selectAll("text")
                .attr("y", 4).attr("x", -4)
                .attr("dy", ".45em")
                .attr("transform", "rotate(-40)")
                .style("text-anchor", "end");

        svg_ref_histo.append("g")
            .attr("class", "y axis")
            .style("font-size", "10px")
            .call(d3.svg.axis()
                .scale(y)
                .ticks(5)
                .orient("left"));
    }

    var redisplay = {
        compute: function(old_nb_class){
            serie = new geostats(values);
            breaks = []
            values = serie.sorted()
            var val = func_switch.to(type);
            if(type === "Q6"){
                var tmp = eval(val);
                stock_class = tmp.stock_class;
                breaks = tmp.breaks;
                serie.setClassManually(breaks);
            } else if (type === "user_defined") {
                var tmp = eval(val);
                console.log(tmp)
                stock_class = tmp.stock_class;
                breaks = tmp.breaks;
                serie.setClassManually(breaks);
            } else {
                breaks = eval(val);
                let ir = serie.getInnerRanges();
                if(!ir){ nb_class = old_nb_class; return false; }
                ir = ir.map(function(el){let tmp=el.split(' - ');return [+tmp[0], +tmp[1]]});
                stock_class = [];
                let _min = undefined, _max = undefined;
                for(let j=0, len_j=ir.length; j < len_j; j++){
                    _min=values.lastIndexOf(ir[j][0]);
                    _max=values.lastIndexOf(ir[j][1]);
                    stock_class.push(_max - _min);
                }
            }

            // In order to avoid class limit falling out the serie limits with Std class :
//            breaks[0] = breaks[0] < serie.min() ? serie.min() : breaks[0];
//            ^^^ well finally not ?
            bins = [];
            for(let i = 0, len = stock_class.length, offset=0; i < len; i++){
                let bin = {};
                bin.val = stock_class[i] + 1;
                bin.offset = i == 0 ? 0 : (bins[i-1].width + bins[i-1].offset);
                bin.width = breaks[i+1] - breaks[i];
                bin.height = bin.val;
                bins[i] = bin;
            }
            return true;
        },
        draw: function(){
                // Clean-up previously made histogram :
            d3.select("#svg_discretization").selectAll(".bar").remove();
            d3.select("#svg_discretization").selectAll(".text_bar").remove();
            d3.select("#svg_discretization").selectAll(".y.axis").remove();

            var col_scheme = d3.select('.color_params_left').node() ? "Diverging" : "Sequential";

            if(col_scheme === "Sequential"){
                if(to_reverse)
                    color_array = color_array.reverse();
                else {
                var selected_palette = d3.select('.color_params').node().value;
                color_array = getColorBrewerArray(nb_class, selected_palette);
                }
            } else if(col_scheme === "Diverging"){
                var left_palette = d3.select('.color_params_left').node().value,
                    right_palette = d3.select('.color_params_right').node().value,
                    ctl_class_value = +d3.select('#centr_class').node().value;

                let class_right = nb_class - ctl_class_value,
                    class_left = ctl_class_value,
                    max_col_nb = Math.max(class_right, class_left),
                    right_pal = getColorBrewerArray(max_col_nb, right_palette),
                    left_pal = getColorBrewerArray(max_col_nb, left_palette);

                left_pal = left_pal.slice(0, class_left).reverse();
                right_pal = right_pal.slice(0, class_right);

                color_array = [].concat(left_pal, right_pal);
            }
            to_reverse = false;
            for(let i=0, len = bins.length; i<len; ++i)
                bins[i].color = color_array[i];

            var x = d3.scale.linear()
                .range([0, svg_w]);

            var y = d3.scale.linear()
                .range([svg_h, 0]);

            x.domain([0, d3.max(bins.map(function(d) { return d.offset + d.width; }))]);
            y.domain([0, d3.max(bins.map(function(d) { return d.height + d.height / 5; }))]);

            var bar = svg_histo.selectAll(".bar")
                .data(bins)
              .enter().append("rect")
                .attr("class", "bar")
                .attr("transform", "translate(0, -17.5)")
                .style("fill", function(d){return d.color;})
                .style({"opacity": 0.5, "stroke-opacity":1})
                .attr("x", function(d){ return x(d.offset);})
                .attr("width", function(d){ return x(d.width);})
                .attr("y", function(d){ return y(d.height) - margin.bottom;})
                .attr("height", function(d){ return svg_h - y(d.height);});

            svg_histo.selectAll(".txt_bar")
                .data(bins)
              .enter().append("text")
                .attr("dy", ".75em")
                .attr("y", function(d){
                    let tmp = y(d.height) + 5;
                    return (tmp < height - 12) ? tmp : height - 12
                    })
                .attr("x", function(d){return x(d.offset + d.width /2)})
                .attr("text-anchor", "middle")
                .attr("class", "text_bar")
                .style("color", "black")
                .text(function(d) { return formatCount(d.val); });

            svg_histo.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0, -" + (margin.top + margin.bottom) +")")
                .call(d3.svg.axis()
                    .scale(y)
                    .ticks(5)
                    .orient("left"));

            document.getElementById("user_breaks_area").value = breaks.join(' - ')
            return true;
        },
    };

    //////////////////////////////////////////////////////////////////////////

    var formatCount = d3.format(",.0f");

    var newBox = d3.select("body").append("div")
                     .style({"font-size":"12px"})
                     .attr("id", "discretiz_charts")
                     .attr("title", ["Discretization panel - ", layer_name, " - ", field_name].join(''));

    if(result_data.hasOwnProperty(layer_name)) var db_data = result_data[layer_name];
    else if(user_data.hasOwnProperty(layer_name)) var db_data = user_data[layer_name];

    var color_array = new Array(),
        nb_values = db_data.length,
        values = new Array(nb_values);

    for(let i=0; i<nb_values; i++){values[i] = +db_data[i][field_name];}

    var serie = new geostats(values),
        breaks = [], stock_class = [],
        bins = [], user_break_list = null,
        max_nb_class = 22 < nb_values ? 22 : nb_values;

    values = serie.sorted();
    serie.setPrecision(6);
    var available_functions = ["Jenks", "Quantiles", "Equal interval", "Standard deviation", "Q6", "Arithmetic progression"];
    if(!serie._hasZeroValue() && !serie._hasZeroValue()){
        available_functions.push("Geometric progression");
        func_switch.target["Geometric progression"] = "serie.getGeometricProgression(nb_class)"
    }

    var discretization = newBox.append('div').style({"margin-top": "30px", "padding-top": "10px"})
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
                                    redisplay.compute(nb_class);
                                    redisplay.draw();
                                    });

    available_functions.forEach(function(name){
        discretization.append("option").text(name).attr("value", name);
    });

    discretization.node().value = type;
    make_box_histo_option();
    display_ref_histo();

    var txt_nb_class = d3.select("#discretization_panel").insert("p").style("display", "inline").html(nb_class+" class"),
        disc_nb_class = d3.select("#discretization_panel")
                            .insert("input")
                            .style("display", "inline")
                            .attr("id", "nb_class_range")
                            .attr("type", "range")
                            .attr({min: 2, max: max_nb_class, value: nb_class, step:1})
                            .on("change", function(){
                                type = discretization.node().value;
                                var old_nb_class = nb_class;
                                if(type === "Q6"){
                                    this.value = 6;
                                    return;
                                }
                                nb_class = this.value;
                                txt_nb_class.html(nb_class+" class");
                                var ret_val = redisplay.compute(old_nb_class);
                                if(!ret_val){
                                    this.value = old_nb_class;
                                    txt_nb_class.html(old_nb_class+" class");
                                } else {
                                    redisplay.draw();
                                    var ctl_class = document.getElementById("centr_class");
                                    if(ctl_class){
                                        ctl_class.max = nb_class;
                                        if(ctl_class > nb_class) ctl_class.value = Math.round(nb_class / 2);
                                    }
                                }
                            });

    var svg_h = h / 5,
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

    var x = d3.scale.linear()
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
        .style({"stroke-width": 0, stroke: "red", fill: "none"})
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
        .style({"stroke-width": 0, stroke: "blue", fill: "none"})
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
        .style({"stroke-width": 0, stroke: "grey", fill: "none"})
        .classed("active", false);

    var line_std_right = overlay_svg.append("line")
        .attr("class", "lines_std")
        .attr("x1", x(mean_val + stddev))
        .attr("y1", 10)
        .attr("x2", x(mean_val + stddev))
        .attr("y2", svg_h - margin.bottom)
        .style({"stroke-width": 0, stroke: "grey", fill: "none"})
        .classed("active", false);


    // As the x axis and the mean didn't change, they can be drawn only once :
    svg_histo.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
        .scale(x)
        .orient("bottom"));

    var accordion_colors = newBox.append("div").attr({id: "accordion_colors", class: "accordion_disc"});
    accordion_colors.append("h3").html("<b>Color scheme</b>");
    var color_scheme =  d3.select("#accordion_colors")
                            .append("div").attr("id", "color_div")
                            .append("form_action");

    ["Sequential", "Diverging"].forEach(function(el){
        color_scheme.insert("label").style("margin", "20px").html(el)
                    .insert('input').attr({
                        type: "radio", name: "color_scheme", value: el, id: "button_"+el})
                     .on("change", function(){
                        if(this.value === "Sequential"){
                            make_sequ_button();
                            redisplay.draw();
                        }
                        else if(this.value === "Diverging"){
                            make_diverg_button();
                            redisplay.draw();
                        }
                      });
    });
    var to_reverse = false;
    document.getElementById("button_Sequential").checked = true;

    var accordion_summ = newBox.append("div").attr({id: "accordion_summary", class: "accordion_disc"});
    accordion_summ.append("h3").html("<b>Summary</b>");
    var summary =  d3.select("#accordion_summary").append("div").attr("id","summary").insert("p").html((serie.info()).split("-").join("<br>").split(']').join("]<br>"));

    var accordion_breaks = newBox.append("div")
                                .attr({id: "accordion_breaks_vals",
                                       class: "accordion_disc"});
    accordion_breaks.append("h3").html("<b>Current break values</b>");

    var user_defined_breaks =  d3.select("#accordion_breaks_vals")
                                .append("div").attr("id","user_breaks");

    user_defined_breaks.insert("textarea")
                        .attr("id","user_breaks_area")
                        .style("width", w / 3 + "px");
    user_defined_breaks.insert("button").text("Valid")
            .on("click", function(){
                    let old_nb_class = nb_class;
                    user_break_list = d3.select("#user_breaks_area").node().value;
                    type = "user_defined";
                    nb_class = user_break_list.split('-').length - 1;
                    txt_nb_class.html(nb_class + " class");
                    d3.select("#nb_class_range").node().value = nb_class;
                    redisplay.compute(old_nb_class);
                    redisplay.draw();
             });

    $(".accordion_disc").accordion({collapsible: true, active: false, heightStyle: "content" });
    $("#accordion_colors").accordion({collapsible: true, active: 0, heightStyle: "content" });

    make_sequ_button();
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
                    var colors_map = [];
                    for(let j=0; j<db_data.length; ++j){
                        var idx = serie.getClass(+db_data[j][field_name])
                        colors_map.push(color_array[idx])
                    }
                    deferred.resolve([nb_class, type, breaks, color_array, colors_map]);
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

function getBreaksQ6(serie){
    var breaks = [], tmp = 0, j = undefined,
        len_serie = serie.length, stock_class = [],
        q6_class = [1, 0.05 * len_serie, 0.275 * len_serie, 0.5 * len_serie, 0.725 * len_serie, 0.95 * len_serie, len_serie];
    for(let i=0; i < 7; ++i){
        j = Math.round(q6_class[i]) - 1
        breaks[i] = serie[j];
        stock_class.push(j - tmp)
        tmp = j;
    }
    stock_class.shift();
    return {
        breaks: breaks,
        stock_class: stock_class
        };
}

function getBreaks_userDefined(serie, breaks_list){
    var break_values = breaks_list.split('-').map(el => +el.trim()),
        len_serie = serie.length,
        j = 0,
        len_break_val = break_values.length,
        stock_class = new Array(len_break_val-1);

    for(let i=1; i<len_break_val; ++i){
        let class_max = break_values[i];
        stock_class[i-1] = 0;
        while(serie[j] < class_max){
            stock_class[i-1] += 1;
            j++;
        }
    }
    return {
        breaks: break_values,
        stock_class: stock_class
        };
}