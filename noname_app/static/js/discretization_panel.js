"use strict";

function getBreaks(values, type, nb_class){
    var serie = new geostats(values),
        nb_class = +nb_class || Math.floor(1 + 3.3 * Math.log10(values.length)),
        breaks = [];
    if(type === "Q6"){
        let tmp = getBreaksQ6(serie.sorted());
        breaks = tmp.breaks;
        breaks[0] = serie.min();
        breaks[nb_class] = serie.max();
        serie.setClassManually(breaks);
    } else {
        let _func = discretiz_geostats_switch.get(type);
        breaks = serie[_func](nb_class);
    }
    return [serie, breaks, nb_class];
}

function discretize_to_size(values, type, nb_class, min_size, max_size){
    var [serie, breaks, nb_class] = getBreaks(values, type, nb_class);
    var step = (max_size - min_size) / (nb_class - 1),
        class_size = Array(nb_class).fill(0).map((d,i) => min_size + (i * step)),
        breaks_prop = [];

    for(let i = 0; i<breaks.length-1; ++i)
        breaks_prop.push([[breaks[i], breaks[i+1]], class_size[i]]);
    return [nb_class, type, breaks_prop, serie];
}

function discretize_to_colors(values, type, nb_class, col_ramp_name){
    col_ramp_name = col_ramp_name || "Reds";
    var [serie, breaks, nb_class] = getBreaks(values, type, nb_class),
        color_array = getColorBrewerArray(nb_class, col_ramp_name),
        sorted_values = serie.sorted(),
        colors_map = [];
    for(let j=0; j<sorted_values.length; ++j){
        let idx = serie.getClass(values[j])
        colors_map.push(color_array[idx])
    }
    return [nb_class, type, breaks, color_array, colors_map];
}

var display_discretization = function(layer_name, field_name, nb_class, type, options){
    var make_no_data_section = function(){
        var section = d3.select("#color_div")
                .append("div").attr("id", "no_data_section")
                .append("p")
                .html(i18next.t("disc_box.with_no_data", {nb_features: no_data}));

        section.append("input")
                .attrs({type: "color", value: "#ebebcd", id: "no_data_color"})
                .style("margin", "0px 10px");
    };

    var make_sequ_button = function(){
        var col_div = d3.select("#color_div");
        col_div.selectAll('.color_params').remove();
        col_div.selectAll('.color_txt').remove();
        col_div.selectAll('.color_txt2').remove();
        col_div.selectAll('.central_class').remove();
        col_div.selectAll('.central_color').remove();
        col_div.selectAll('#reverse_pal_btn').remove();
        var sequential_color_select = col_div.insert("p")
                                                .attr("class", "color_txt")
                                                .style("margin-left", "10px")
                                                .html(i18next.t("disc_box.color_palette"))
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
                                .styles({"display": "inherit", "margin-top": "10px"})
                                .attrs({"class": "button_st3", "id": "reverse_pal_btn"})
                                .html(i18next.t("disc_box.reverse_palette"))
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
                .html(i18next.t("disc_box.break_on"))
               .insert("input").attrs({
                   type: "number", class: "central_class", id: "centr_class",
                   min: 1, max: nb_class-1, step: 1, value: Math.round(nb_class / 2)
                   }).style("width", "40px")
               .on("change", function(){redisplay.draw();});

        let central_color = col_div.insert('p').attr("class", "central_color");
        central_color.insert("input")
                    .attr("type", "checkbox")
                    .on("change", function(){
                        redisplay.draw();
                    });
        central_color.select("input").node().checked = true;
        central_color.insert("label").html(i18next.t("disc_box.colored_central_class"));
        central_color
            .insert("input")
            .attrs({type: "color", id: "central_color_val", value: "#e5e5e5"})
            .style("margin", "0px 10px")
            .on("change", function(){
                        redisplay.draw();
                    });

        var pal_names = ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd',
                         'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn',
                         'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'];
        var left_color_select = col_div.insert("p")
                        .attr("class", "color_txt")
                        .style("display", "inline")
                        .html(i18next.t("disc_box.left_colramp"))
                        .insert("select").attr("class", "color_params_left")
                        .on("change", function(){ redisplay.draw() });
        var right_color_select = col_div.insert("p")
                        .styles({display: "inline", "margin-left": "70px"})
                        .attr("class", "color_txt2")
                        .html(i18next.t("disc_box.right_colramp"))
                        .insert("select").attr("class", "color_params_right")
                        .on("change", function(){ redisplay.draw() });
        pal_names.forEach(function(name){
            left_color_select.append("option").text(name).attr("value", name);
            right_color_select.append("option").text(name).attr("value", name)
        });
        document.getElementsByClassName("color_params_right")[0].selectedIndex = 14;
    };

    var make_box_histo_option = function(){
        var histo_options = newBox.append('div')
                            .attr("id", "histo_options")
                            .style("margin-left", "10px");

        var a = histo_options.append("p").style("margin", 0).style("display", "inline"),
            b = histo_options.append("p").style("margin", 0).style("display", "inline"),
            c = histo_options.append("p").style("margin", 0).style("display", "inline");

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
            nb_bins = 51 < (values.length / 3) ? 50 : Math.ceil(Math.sqrt(values.length)) + 1;

        nb_bins = nb_bins < 3 ? 3 : nb_bins;
        nb_bins = nb_bins > +values.length ? nb_bins : values.length;

        var margin = {top: 5, right: 7.5, bottom: 15, left: 22.5},
            width = svg_w - margin.right - margin.left;
            height = svg_h - margin.top - margin.bottom;

        var ref_histo = newBox.append('div').attr("id", "ref_histo_box");
        ref_histo.append('p').style("margin", "auto")
                  .html('<b>' + i18next.t('disc_box.hist_ref_title') + '</b>');

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
            .attr("width", 1)
//            .attr("width", x(data[1].x1) - x(data[1].x0))
            .attr("height",  d => height - y(d.length))
            .attr("transform", function(d){return "translate(" + x(d.x0) + "," + y(d.length) + ")";})
            .styles({fill: "beige", stroke: "black", "stroke-width": "0.4px"});

        svg_ref_histo.append("g")
            .attr("class", "x_axis")
            .style("font-size", "10px")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom()
                .scale(x)
                .ticks(4)
                .tickFormat(formatCount))
            .selectAll("text")
                .attr("y", 4).attr("x", -4)
                .attr("dy", ".45em")
                .attr("transform", "rotate(-40)")
                .style("text-anchor", "end");

        svg_ref_histo.append("g")
            .attr("class", "y_axis")
            .style("font-size", "10px")
            .call(d3.axisLeft()
                .scale(y)
                .ticks(5)
                .tickFormat(formatCount));
    }

    var make_summary = function(){
        let content_summary = make_content_summary(serie);
        newBox.append("div").attr("id", "summary")
                        .style("font-size", "10px").style("float", "right")
                        .style("margin", "0px 10px")
                        .insert("p")
                        .html(["<b>", i18next.t("disc_box.summary"), "</b><br>", content_summary].join(""));
    }

    var redisplay = {
        compute: function(){
            serie = new geostats(values);
            breaks = [];
            values = serie.sorted();

            if(type === "Q6"){
                var tmp = getBreaksQ6(values);
                console.log(values); console.log(tmp)
                stock_class = tmp.stock_class;
                breaks = tmp.breaks;
                breaks[0] = serie.min();
                breaks[6] = serie.max();
                serie.setClassManually(breaks);
            } else if (type === "user_defined") {
                var tmp = getBreaks_userDefined(serie.sorted(), user_break_list);
                stock_class = tmp.stock_class;
                breaks = tmp.breaks;
                serie.setClassManually(breaks);
            } else {
                let _func = discretiz_geostats_switch.get(type);
                breaks = serie[_func](nb_class);
                serie.doCount();
                stock_class = Array.prototype.slice.call(serie.counter);
                if(stock_class.length == 0){
                    return;
                }
            }
            // In order to avoid class limit falling out the serie limits with Std class :
//            breaks[0] = breaks[0] < serie.min() ? serie.min() : breaks[0];
//            ^^^ well finally not ?
            bins = [];
            for(let i = 0, len = stock_class.length, offset=0; i < len; i++){
                let bin = {};
                bin.val = stock_class[i];
                bin.offset = i == 0 ? 0 : (bins[i-1].width + bins[i-1].offset);
                bin.width = breaks[i+1] - breaks[i];
                bin.height = bin.val / (breaks[i+1] - breaks[i]);
                bins[i] = bin;
            }
            return true;
        },
        draw: function(provided_colors){
                // Clean-up previously made histogram :
            newBox.select("#svg_discretization").selectAll(".bar").remove();
            newBox.select("#svg_discretization").selectAll(".text_bar").remove();
            newBox.select("#svg_discretization").selectAll(".y_axis").remove();

            if(!provided_colors){
                var col_scheme = newBox.select('.color_params_left').node() ? "diverging" : "sequential";
                console.log(color_array)
                if(col_scheme === "sequential"){
                    if(to_reverse){
                        color_array = color_array.reverse();
                        to_reverse = false;
                    } else {
                        var selected_palette = document.querySelector('.color_params').value;
                        color_array = getColorBrewerArray(nb_class, selected_palette);
                        color_array = color_array.slice(0, nb_class);
                    }
                } else if(col_scheme === "diverging"){
                    var left_palette = document.querySelector('.color_params_left').value,
                        right_palette = document.querySelector('.color_params_right').value,
                        ctl_class_value = +document.getElementById('centr_class').value,
                        ctl_class_color =  document.querySelector(".central_color > input").checked
                                        ? document.getElementById("central_color_val").value
                                        : [];

                    let class_right = nb_class - ctl_class_value + 1,
                        class_left = ctl_class_value - 1,
                        max_col_nb = Math.max(class_right, class_left),
                        right_pal = getColorBrewerArray(max_col_nb, right_palette),
                        left_pal = getColorBrewerArray(max_col_nb, left_palette);

                    left_pal = left_pal.slice(0, class_left).reverse();
                    right_pal = right_pal.slice(0, class_right);

                    color_array = [].concat(left_pal, ctl_class_color, right_pal);
                }
            } else {
                color_array = provided_colors.slice();
            }
            for(let i=0, len = bins.length; i<len; ++i)
                bins[i].color = color_array[i];

            var x = d3.scaleLinear()
                        .domain([serie.min(), serie.max()])
                        .range([0, svg_w]);

            var y = d3.scaleLinear()
                .range([svg_h, 0]);

            x.domain([0, d3.max(bins.map(d => d.offset + d.width))]);
            y.domain([0, d3.max(bins.map(d => d.height + (d.height / 5)))]);

            var bar = svg_histo.selectAll(".bar")
                .data(bins)
              .enter().append("rect")
                .attr("class", "bar")
                .attr("id", (d,i) => "bar_" + i)
                .attr("transform", "translate(0, -7.5)")
                .style("fill", d => d.color)
                .styles({"opacity": 0.95, "stroke-opacity":1})
                .attr("x", d => x(d.offset))
                .attr("width", d => x(d.width))
                .attr("y", d => y(d.height) - margin.bottom)
                .attr("height", d => svg_h - y(d.height))
                .on("mouseover", function(){
                    this.parentElement.querySelector("#text_bar_" + this.id.split('_')[1]).style.display = null;
                    })
                .on("mouseout", function(){
                    this.parentElement.querySelector("#text_bar_" + this.id.split('_')[1]).style.display = "none";
                    });

            svg_histo.selectAll(".txt_bar")
                .data(bins)
              .enter().append("text")
                .attr("dy", ".75em")
                .attr("y", d => (y(d.height) - margin.top * 2 - margin.bottom - 1.5))
                .attr("x", d => x(d.offset + d.width /2))
                .attr("text-anchor", "middle")
                .attr("class", "text_bar")
                .attr("id", (d,i) => "text_bar_" + i)
                .style("color", "black")
                .style("cursor", "default")
                .style("display", "none")
                .text(d => formatCount(d.val))

            svg_histo.append("g")
                .attr("class", "y_axis")
                .attr("transform", "translate(0, -" + (margin.top + margin.bottom) +")")
                .call(d3.axisLeft()
                    .scale(y)
                    .ticks(5)
                    .tickFormat(formatCount));

            document.getElementById("user_breaks_area").value = breaks.join(' - ')
            return true;
        },
    };

    //////////////////////////////////////////////////////////////////////////
    var formatCount = d3.formatLocale({
                        decimal: getDecimalSeparator(),
                        thousands: "",
                        grouping: 3,
                        currency: ["", ""]
                        }).format('.2f');

    var modal_box = make_dialog_container(
         "discretiz_charts",
         [i18next.t("disc_box.title"), " - ", layer_name, " - ", field_name].join(''),
         "discretiz_charts_dialog"
        );

    var newBox = d3.select("#discretiz_charts").select(".modal-body");
//    var newBox = d3.select("body").append("div")
//                     .style("font-size", "12px")
//                     .attr("id", "discretiz_charts")
//                     .attr("title", [i18next.t("disc_box.title"), " - ", layer_name, " - ", field_name].join(''));

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
        breaks = [], stock_class = [],
        bins = [], user_break_list = null,
        max_nb_class = 22 < nb_values ? 22 : nb_values;

    if(serie.variance() == 0 && serie.stddev() == 0){
        var serie = new geostats(values);
    }

    values = serie.sorted();
//    serie.setPrecision(6);
    var available_functions = [
     [i18next.t("app_page.common.equal_interval"), "equal_interval"],
     [i18next.t("app_page.common.quantiles"), "quantiles"],
//     [i18next.t("app_page.common.std_dev"), "std_dev"],
     [i18next.t("app_page.common.Q6"), "Q6"],
     [i18next.t("app_page.common.arithmetic_progression"), "arithmetic_progression"],
     [i18next.t("app_page.common.jenks"), "jenks"]
    ];

    if(!serie._hasZeroValue() && !serie._hasZeroValue()){
        available_functions.push([i18next.t("app_page.common.geometric_progression"), "geometric_progression"]);
    }

    var discretization = newBox.append('div')
                                .attr("id", "discretization_panel")
                                .insert("p")
                                .insert("select").attr("class", "params")
                                .on("change", function(){
                                    type = this.value;
                                    if(type === "Q6"){
                                        nb_class = 6;
                                        txt_nb_class.html(i18next.t("disc_box.class", {count: 6}));
                                        document.getElementById("nb_class_range").value = 6;
                                    }
                                    redisplay.compute();
                                    redisplay.draw();
                                    });

    available_functions.forEach( func => {
        discretization.append("option").text(func[0]).attr("value", func[1]);
    });

    var txt_nb_class = d3.select("#discretization_panel")
                            .insert("p")
                            .style("display", "inline")
                            .html(i18next.t("disc_box.class", {count: +nb_class})),
        disc_nb_class = d3.select("#discretization_panel")
                            .insert("input")
                            .styles({display: "inline", width: "60px", "vertical-align": "middle", margin: "10px"})
                            .attrs({id: "nb_class_range", type: "range"})
                            .attrs({min: 2, max: max_nb_class, value: nb_class, step:1})
                            .on("change", function(){
                                type = discretization.node().value;
                                var old_nb_class = nb_class;
                                if(type === "Q6"){
                                    this.value = 6;
                                    return;
                                }
                                nb_class = +this.value;
                                txt_nb_class.html(i18next.t("disc_box.class", {count: nb_class}));
                                var ret_val = redisplay.compute();
                                if(!ret_val){
                                    this.value = old_nb_class;
                                    txt_nb_class.html(i18next.t("disc_box.class", {count: +old_nb_class}));
                                } else {
                                    redisplay.draw();
                                    var ctl_class = document.getElementById("centr_class");
                                    if(ctl_class){
                                        ctl_class.max = nb_class;
                                        if(ctl_class > nb_class) ctl_class.value = Math.round(nb_class / 2);
                                    }
                                }
                            });

    discretization.node().value = type;
    make_box_histo_option();
    make_summary();
    display_ref_histo();

    var svg_h = h / 5 > 100 ? h / 5 : 100,
        svg_w = 760 < (window.innerWidth - 40) ? 760 : (window.innerWidth - 40),
        margin = {top: 7.5, right: 30, bottom: 7.5, left: 30},
        height = svg_h - margin.top - margin.bottom;

    d3.select("#discretiz_charts").select(".modal-dialog")
        .styles({width: svg_w + margin.top + margin.bottom + 90 + "px",
                 height: window.innerHeight - 60 + "px"});


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
        .text(i18next.t("disc_box.mean"));

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
        .text(i18next.t("disc_box.median"));

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
        .attr("class", "x_axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom()
        .scale(x)
        .tickFormat(formatCount));

    var b_accordion_colors = newBox.append("button")
                        .attr("id", "btn_acc_colors").attr("class", "accordion")
                        .style("padding", "0 6px")
                        .html(i18next.t("disc_box.title_color_scheme")),
        accordion_colors = newBox.append("div").attr("class", "panel").attr("id", "accordion_colors");

    var color_scheme =  d3.select("#accordion_colors")
                            .append("div").attr("id", "color_div")
                            .append("form_action");

    [
     [i18next.t("disc_box.sequential"), "sequential"],
     [i18next.t("disc_box.diverging"), "diverging"]
    ].forEach( el => {
        color_scheme.insert("label").style("margin", "20px").html(el[0])
                    .insert('input').attrs({
                        type: "radio", name: "color_scheme", value: el[1], id: "button_"+el[1]})
                     .on("change", function(){
                        this.value === "sequential" ? make_sequ_button()
                                                    : make_diverg_button();
                        redisplay.draw();
                      });
    });
    var to_reverse = false;
    document.getElementById("button_sequential").checked = true;

    var b_accordion_breaks = newBox.append("button")
                        .attr("id", "btn_acc_colors").attr("class", "accordion")
                        .style("padding", "0 6px")
                        .html(i18next.t("disc_box.title_break_values")),
        accordion_breaks = newBox.append("div").attr("class", "panel").attr("id", "accordion_breaks_vals");

    var user_defined_breaks =  accordion_breaks.append("div").attr("id","user_breaks");

    user_defined_breaks.insert("textarea")
                        .attr("id","user_breaks_area")
                        .attr("placeholder", i18next.t("app_page.common.expected_class"))
                        .style("width", "600px");

    user_defined_breaks
        .insert("button")
        .text(i18next.t("app_page.common.valid"))
        .on("click", function(){
            let old_nb_class = nb_class;
            user_break_list = document.getElementById("user_breaks_area").value;
            type = "user_defined";
            nb_class = user_break_list.split('-').length - 1;
            txt_nb_class.html(i18next.t("disc_box.class", {count: +nb_class}));
            document.getElementById("nb_class_range").value = nb_class;
            redisplay.compute();
            redisplay.draw();
         });

    accordionize(".accordion", d3.select("#discretiz_charts").node());

    if(no_data > 0){
        make_no_data_section();
        if(options.no_data){
            document.getElementById("no_data_color").value = options.no_data;
        }
    }

    if(!options.schema){
        make_sequ_button();
    } else if(options.schema.length == 1){
        make_sequ_button();
        document.querySelector(".color_params").value = options.schema[0];
    } else if(options.schema.length > 1){
        make_diverg_button();
        document.getElementById("button_diverging").checked = true;
        let tmp = 0;
        document.querySelector(".color_params_left").value = options.schema[0];
        if(options.schema.length > 2){
            document.getElementById("central_color_val").value = options.schema[1];
            tmp = 1;
            document.querySelector(".central_color").querySelector("input").checked = true;
        } else {
            document.querySelector(".central_color").querySelector("input").checked = false;
        }
        document.querySelector(".color_params_right").value = options.schema[1 + tmp];
    }

    redisplay.compute();
    redisplay.draw(options.colors);

    let deferred = Q.defer(),
        container = document.getElementById("discretiz_charts");

    container.querySelector(".btn_ok").onclick = function(){
        var colors_map = [];
        let no_data_color = null;
        if(no_data > 0){
            no_data_color = document.getElementById("no_data_color").value;
        }
        for(let j=0; j < db_data.length; ++j){
            let value = +db_data[j][field_name];
            if(value != null){
                let idx = serie.getClass(+value);
                colors_map.push(color_array[idx]);
            } else {
                colors_map.push(no_data_color);
            }
        }
        let col_schema = [];
        if(!d3.select('.color_params_left').node()){
            col_schema.push(document.querySelector(".color_params").value);
        } else {
            col_schema.push(document.querySelector(".color_params_left").value);
            if(document.querySelector(".central_color").querySelector("input").checked){
                col_schema.push(document.getElementById("central_color_val").value);
            }
            col_schema.push(document.querySelector(".color_params_right").value);
        }
        deferred.resolve(
            [nb_class, type, breaks, color_array, colors_map, col_schema, no_data_color]);

        modal_box.close();
        container.remove();
        reOpenParent();
    }

    let _onclose = () => {
        deferred.resolve(false);
        modal_box.close();
        container.remove();
        reOpenParent();
    };
    container.querySelector(".btn_cancel").onclick = _onclose;
    container.querySelector("#xclose").onclick = _onclose;
    return deferred.promise;
}

function getBreaksQ6(serie){
    var breaks = [], tmp = 0, j = undefined,
        len_serie = serie.length, stock_class = [],
        q6_class = [1, 0.05 * len_serie, 0.275 * len_serie, 0.5 * len_serie, 0.725 * len_serie, 0.95 * len_serie, len_serie];
    for(let i=0; i < 7; ++i){
        j = Math.round(q6_class[i]) - 1
        breaks.push(+serie[j]);
        stock_class.push(j - tmp)
        tmp = j;
    }
    stock_class.shift();
    if(breaks[0] == breaks[1]){
        breaks[1] = (breaks[2] - breaks[1]) / 2
    }
    if(breaks[6] == breaks[5]){
        breaks[5] = (breaks[5] - breaks[4]) / 2
    }
    return {
        breaks: breaks,
        stock_class: stock_class
        };
}

function getBreaks_userDefined(serie, breaks_list){
    var separator = has_negative(serie) ? '- ' : '-',
        break_values = breaks_list.split(separator).map(el => +el.trim()),
        len_serie = serie.length,
        j = 0,
        len_break_val = break_values.length,
        stock_class = new Array(len_break_val-1);

    for(let i=1; i<len_break_val; ++i){
        let class_max = break_values[i];
        stock_class[i-1] = 0;
        while(serie[j] <= class_max){
            stock_class[i-1] += 1;
            j++;
        }
    }
    return {
        breaks: break_values,
        stock_class: stock_class
        };
}

function fetch_categorical_colors(){
    let categ = document.querySelectorAll(".typo_class"),
        color_map = new Map();
    for(let i = 0; i < categ.length; i++){
        let color = rgb2hex(categ[i].querySelector(".color_square").style.backgroundColor),
            new_name = categ[i].querySelector(".typo_name").value;
        color_map.set(categ[i].__data__.name, [color, new_name]);
    }
    return color_map;
}

function display_categorical_box(layer, field){
    var nb_features = current_layers[layer].n_features,
        categories = new Map(),
        data_layer = user_data[layer],
        cats = [];

    for(let i = 0; i < nb_features; ++i){
        let value = data_layer[i][field];
        let ret_val = categories.get(value);
        if(ret_val)
            categories.set(value, [ret_val[0] + 1, [i].concat(ret_val[1])]);
        else
            categories.set(value, [1, [i]]);
    }

    let nb_class = categories.size;

    categories.forEach( (v,k) => {
        cats.push({name: k, nb_elem: v[0], color: Colors.names[Colors.random()]})
    });

    var modal_box = make_dialog_container(
        "categorical_box",
        i18next.t("app_page.categorical_box.title", {layer: layer, nb_features: nb_features}),
        "dialog");

    var newbox = d3.select("#categorical_box").select(".modal-body");

//    var newbox = d3.select("body")
//                        .append("div").style("font-size", "10px")
//                        .attrs({id: "categorical_box",
//                                title: i18next.t("app_page.categorical_box.title", {layer: layer, nb_features: nb_features})})
    newbox.append("h3").html("")
    newbox.append("p")
                .html(i18next.t("app_page.symbol_typo_box.field_categ", {field: field, nb_class: +nb_class, nb_features: +nb_features}));

    newbox.append("ul").style("padding", "unset").attr("id", "sortable_typo_name")
            .selectAll("li")
            .data(cats).enter()
            .append("li")
                .styles({margin: "auto", "list-style": "none"})
                .attr("class", "typo_class")
                .attr("id", (d,i) => ["line", i].join('_'));

    newbox.selectAll(".typo_class")
            .append("input")
            .styles({width: "140px", height: "auto", display: "inline-block", "vertical-align": "middle", "margin-right": "20px"})
            .attr("class", "typo_name")
            .attr("value", d => d.name)
            .attr("id", d => d.name);

    newbox.selectAll(".typo_class")
            .insert("p").attr("class", "color_square")
            .style("background-color", d => d.color)
            .style("margin", "auto")
            .style("vertical-align", "middle")
            .styles({width: "22px", height: "22px", "border-radius": "10%", display: "inline-block"})
            .on("click", function(){
                let self = this;
                let this_color = self.style.backgroundColor;
                let input_col = document.createElement("input");
                input_col.setAttribute("type", "color");
                input_col.setAttribute("value", rgb2hex(this_color));
                input_col.className = "color_input";
                input_col.onchange = function(change){
                    self.style.backgroundColor = hexToRgb(change.target.value, "string");
                }
                let t = input_col.dispatchEvent(new MouseEvent("click"));
            });

    newbox.selectAll(".typo_class")
            .insert("span")
            .html( d => i18next.t("app_page.symbol_typo_box.count_feature", {nb_features: +d.nb_elem}));

    newbox.insert("p")
        .insert("button")
        .attr("class", "button_st3")
        .html(i18next.t("app_page.categorical_box.new_random_colors"))
        .on("click", function(){
            let lines = document.querySelectorAll(".typo_class");
            for(let i=0; i<lines.length; ++i){
                lines[i].querySelector(".color_square").style.backgroundColor = Colors.names[Colors.random()];
            }
        });

    new Sortable(document.getElementById("sortable_typo_name"));

    let deferred = Q.defer(),
        container = document.getElementById("categorical_box"),
        _onclose = () => {
            deferred.resolve(false);
            modal_box.close();
            container.remove();
        };

    container.querySelector(".btn_ok").onclick = function(){
        let color_map = fetch_categorical_colors();
        let colorByFeature = data_layer.map( ft => color_map.get(ft[field])[0] );
        deferred.resolve([nb_class, color_map, colorByFeature]);
        modal_box.close();
        container.remove();
        reOpenParent();
    }

    container.querySelector(".btn_cancel").onclick = _onclose;
    container.querySelector("#xclose").onclick = _onclose;
    return deferred.promise;
};


var display_box_symbol_typo = function(layer, field){
    var fetch_symbol_categories = function(){
        let categ = document.querySelectorAll(".typo_class"),
            symbol_map = new Map();
        for(let i = 0; i < categ.length; i++){
            let selec =  categ[i].querySelector(".symbol_section"),
                new_name = categ[i].querySelector(".typo_name").value;
                cats[i].new_name = new_name;
            if(selec.style.backgroundImage.length > 7){
                let img = selec.style.backgroundImage.split("url(")[1].substring(1).slice(0,-2);
                let size = +categ[i].querySelector("#symbol_size").value
                symbol_map.set(categ[i].__data__.name, [img, size, new_name]);
                cats[i].img = selec.style.backgroundImage;
            } else {
                symbol_map.set(categ[i].__data__.name, [null, 0, new_name]);
                cats[i].img = default_d_url;
            }
        }
        return symbol_map;
    }

    if(!window.default_symbols){
        window.default_symbols = [];
        prepare_available_symbols();
    }
    var nb_features = current_layers[layer].n_features,
        categories = new Map(),
        data_layer = user_data[layer],
        cats = [];

    var res_symbols = window.default_symbols;

    var default_d_url = 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJmbGFnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjMycHgiIGhlaWdodD0iMzJweCIgdmlld0JveD0iMCAwIDU3OS45OTcgNTc5Ljk5NyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNTc5Ljk5NyA1NzkuOTk3IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggZmlsbD0icGFyYW0oZmlsbCkgIzAwMCIgZmlsbC1vcGFjaXR5PSJwYXJhbShmaWxsLW9wYWNpdHkpIiBzdHJva2U9InBhcmFtKG91dGxpbmUpICNGRkYiIHN0cm9rZS1vcGFjaXR5PSJwYXJhbShvdXRsaW5lLW9wYWNpdHkpIiBzdHJva2Utd2lkdGg9InBhcmFtKG91dGxpbmUtd2lkdGgpIDAiIGQ9Ik0yMzEuODQ2LDQ3Mi41NzJWMzEuODA2aC0yMi4xOHY0NDAuNTU3JiMxMDsmIzk7Yy0zNC4wMTYsMi42NDktNTkuNDE5LDE4Ljc2Ny01OS40MTksMzguODcxYzAsMjIuMDIxLDMwLjQ1NiwzOS4yNzEsNjkuMzM3LDM5LjI3MWMzOC44NzcsMCw2OS4zMzItMTcuMjUsNjkuMzMyLTM5LjI3MSYjMTA7JiM5O0MyODguOTE3LDQ5MS41OTUsMjY0LjY3NCw0NzUuNzY0LDIzMS44NDYsNDcyLjU3MnoiLz4KPHBvbHlnb24gZmlsbD0icGFyYW0oZmlsbCkgIzAwMCIgZmlsbC1vcGFjaXR5PSJwYXJhbShmaWxsLW9wYWNpdHkpIiBzdHJva2U9InBhcmFtKG91dGxpbmUpICNGRkYiIHN0cm9rZS1vcGFjaXR5PSJwYXJhbShvdXRsaW5lLW9wYWNpdHkpIiBzdHJva2Utd2lkdGg9InBhcmFtKG91dGxpbmUtd2lkdGgpIDAiIHBvaW50cz0iMjM1LjI0MywyOS40OTIgMjMzLjcyMywyMDcuNjI4IDQyOS43NDksMjEwLjMyOSAiLz4KPC9zdmc+")';

    if(categories.size == 0){
        for(let i = 0; i < nb_features; ++i){
            let value = data_layer[i][field];
            let ret_val = categories.get(value);
            if(ret_val)
                categories.set(value, [ret_val[0] + 1, [i].concat(ret_val[1])]);
            else
                categories.set(value, [1, [i]]);
        }
        categories.forEach( (v,k) => { cats.push({name: k, new_name: k, nb_elem: v[0], img: default_d_url}) });
    }
    let nb_class = categories.size;

    return function(){
        var modal_box = make_dialog_container(
            "symbol_box",
            i18next.t("app_page.symbol_typo_box.title", {layer: layer, nb_features: nb_features}),
            "dialog");
        var newbox = d3.select("#symbol_box").select(".modal-body");

        newbox.append("h3").html("")
        newbox.append("p")
                .html(i18next.t("app_page.symbol_typo_box.field_categ", {field: field, nb_class: nb_class, nb_features: nb_features}));
        newbox.append("ul").style("padding", "unset").attr("id", "typo_categories")
                .selectAll("li")
                .data(cats).enter()
                .append("li")
                    .styles({margin: "auto", "list-style": "none"})
                    .attr("class", "typo_class")
                    .attr("id", (d,i) => ["line", i].join('_'));

        newbox.selectAll(".typo_class")
                .append("input")
                .styles({width: "100px", height: "auto", display: "inline-block", "vertical-align": "middle", "margin-right": "7.5px"})
                .attr("class", "typo_name")
                .attr("value", d => d.new_name)
                .attr("id", d => d.name);

        newbox.selectAll(".typo_class")
                .insert("p")
                .attr("title", "Click me to choose a symbol!")
                .attr("class", "symbol_section")
                .style("margin", "auto")
                .style("background-image", d => d.img)
                .style("vertical-align", "middle")
                .styles({width: "32px", height: "32px", margin: "0px 1px 0px 1px",
                        "border-radius": "10%", border: "1px dashed blue",
                        display: "inline-block", "background-size": "32px 32px"
                      })
                .on("click", function(){
//                    let self = this;
                    box_choice_symbol(res_symbols).then(confirmed => {
                        if(confirmed){
                            this.style.backgroundImage = confirmed;
                        }
                    });
                });

        newbox.selectAll(".typo_class")
                .insert("span")
                .html( d => i18next.t("app_page.symbol_typo_box.count_feature", {nb_features: d.nb_elem}));

        newbox.selectAll(".typo_class")
                .insert("input").attr("type", "number").attr("id", "symbol_size")
                .style("width", "38px").style("display", "inline-block")
                .attr("value", 32);

        newbox.selectAll(".typo_class")
                .insert("span")
                .style("display", "inline-block")
                .html(" px");
        new Sortable(document.getElementById("typo_categories"));

        let deferred = Q.defer(),
            container = document.getElementById("symbol_box");
    
        container.querySelector(".btn_ok").onclick = function(){
            let symbol_map = fetch_symbol_categories();
            deferred.resolve([nb_class, symbol_map]);
            modal_box.close();
            container.remove();
        }
        container.querySelector(".btn_cancel").onclick = function(){
            deferred.resolve(false);
            modal_box.close();
            container.remove();
        }
        container.querySelector("#xclose").onclick = function(){
            deferred.resolve(false);
            modal_box.close();
            container.remove();
        }
        return deferred.promise;
    }
};


function reOpenParent(css_selector){
    css_selector = css_selector || ".styleBox";
    let parent_style_box = document.querySelector(css_selector);
    if(parent_style_box){
        parent_style_box.className = parent_style_box.className.concat(" in");
        parent_style_box.setAttribute("aria-hidden", false);
        parent_style_box.style.display = "block";
    }
}