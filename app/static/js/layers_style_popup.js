"use strict";

function handle_click_layer(layer_name){
    if(current_layers[layer_name].renderer
        && (strContains(current_layers[layer_name].renderer, "PropSymbol")
            || strContains(current_layers[layer_name].renderer, "Dorling")))
        createStyleBox_ProbSymbol(layer_name);
    else
        createStyleBox(layer_name);
    return;
};

let setSelected = function(selectNode, value)
{
    selectNode.value = value;
    selectNode.dispatchEvent(new Event('change'));
}


function make_single_color_menu(layer, fill_prev, symbol = "path"){
    var fill_color_section = d3.select("#fill_color_section"),
        g_lyr_name = "#" + layer,
        last_color = (fill_prev && fill_prev.single) ? fill_prev.single : undefined;
    fill_color_section.insert('p')
          .html('Fill color<br>')
          .insert('input').attr({type: 'color', "value": last_color})
          .on('change', function(){
                d3.select(g_lyr_name).selectAll(symbol).style("fill", this.value);
                current_layers[layer].fill_color = {"single": this.value};
          });
}

function make_random_color(layer, symbol = "path"){
    d3.select("#fill_color_section")
        .style("text-align", "center")
        .html('<b><i>Click to toggle colors</b></i>')
        .on("click", function(d,i){
            d3.select("#" + layer)
                .selectAll(symbol)
                .style("fill", function(){ return Colors.names[Colors.random()]; });
            current_layers[layer].fill_color = {"random": true};
            make_random_color(layer, symbol);
        });
}

function fill_categorical(layer, field_name, symbol, color_cat_map, ref_layer){
    let data_layer = ref_layer ? user_data[ref_layer] : user_data[layer] ? user_data[layer] : result_data[layer];

    if(ref_layer && current_layers[layer].features_order){
        let features_order = current_layers[layer].features_order;
        d3.select("#"+layer)
            .selectAll(symbol)
            .style("fill", function(d, i){
                let idx = features_order[i][0];
                return color_cat_map.get(data_layer[idx][field_name]);
            });
    } else if (ref_layer)
        d3.select("#"+layer)
            .selectAll(symbol)
            .style("fill", function(d, i){
                return color_cat_map.get(data_layer[i][field_name]);
            });
    else
        d3.select("#"+layer)
            .selectAll(symbol)
            .style("fill", d => color_cat_map.get(d.properties[field_name]));
}

function make_categorical_color_menu(fields, layer, fill_prev, symbol = "path", ref_layer){
    var fill_color_section = d3.select("#fill_color_section");
    var field_selec = fill_color_section.insert("p").html("Categorical field :")
            .insert("select");
    fields.forEach(function(field){
        field_selec.append("option").text(field).attr("value", field)
    });
    if(fill_prev.categorical && fill_prev.categorical instanceof Array)
        setSelected(field_selec.node(), fill_prev.categorical[0])
    field_selec.on("change", function(){
        let field_name = this.value,
            data_layer = ref_layer ? user_data[ref_layer] : current_layers[layer].is_result ? result_data[layer] : user_data[layer],
            values = data_layer.map(i => i[field_name]),
            cats = new Set(values),
            txt = [cats.size, " cat."].join('');
        console.log(values); console.log(cats)
        d3.select("#nb_cat_txt").html(txt)
        var color_cat_map = new Map();
        for(let val of cats)
            color_cat_map.set(val, Colors.names[Colors.random()])

        current_layers[layer].fill_color = { "categorical": [field_name, color_cat_map] };
        fill_categorical(layer, field_name, symbol, color_cat_map, ref_layer)
    });
    fill_color_section.append("p").attr("id", "nb_cat_txt").html("")
    fill_color_section.append("p").html("Color palette :")
};

let cloneObj = function(obj){
    let tmp;
    if(obj === null || typeof obj !== "object")
        return obj;
    else if(obj.toString() == "[object Map]"){
        tmp = new Map(obj.entries());
    } else {
        tmp = obj.constructor();
        for(let k in obj)
            tmp[k] = cloneObj(obj[k]);
    }
    return tmp;
}


function createStyleBox(layer_name){
    var type = current_layers[layer_name].type,
        rendering_params = null,
        renderer = current_layers[layer_name].renderer,
        g_lyr_name = "#" + layer_name,
        selection = d3.select(g_lyr_name).selectAll("path"),
        opacity = selection.style('fill-opacity');

    var fill_prev = cloneObj(current_layers[layer_name].fill_color),
        prev_col_breaks;

    if(current_layers[layer_name].colors_breaks && current_layers[layer_name].colors_breaks instanceof Array)
        prev_col_breaks = current_layers[layer_name].colors_breaks.concat([]);


    var stroke_prev = selection.style('stroke'),
        border_opacity = selection.style('stroke-opacity'),
        stroke_width = current_layers[layer_name]['stroke-width-const'];

    if(stroke_prev.startsWith("rgb"))
        stroke_prev = rgb2hex(stroke_prev);

    make_confirm_dialog("", "Save", "Close without saving", "Layer style options", "styleBox", undefined, undefined, true)
        .then(function(confirmed){
            if(confirmed){
                // Update the object holding the properties of the layer if Yes is clicked
//                if(stroke_width != current_layers[layer_name]['stroke-width-const'])
//                    current_layers[layer_name].fixed_stroke = true;
                if(current_layers[layer_name].renderer != undefined
                     && rendering_params != undefined && renderer != "Stewart"){
                    current_layers[layer_name].fill_color = {"class": rendering_params.colorsByFeature};
                    let colors_breaks = [];
                    for(let i = 0; i<rendering_params['breaks'].length-1; ++i)
                        colors_breaks.push([rendering_params.breaks[i] + " - " + rendering_params.breaks[i+1], rendering_params.colors[i]]);
                    current_layers[layer_name].colors_breaks = colors_breaks;
                    current_layers[layer_name].rendered_field = rendering_params.field;
                } else if (renderer == "Stewart"){
                    current_layers[layer_name].colors_breaks = rendering_params.breaks;
                    current_layers[layer_name].fill_color.class =  rendering_params.breaks.map(obj => obj[1]);
                }
                // Also change the legend if there is one displayed :
                let lgd_choro = document.getElementById("legend_root");
                if(lgd_choro){
                    let transform_param = lgd_choro.getAttribute("transform"),
                        lgd_title = lgd_choro.querySelector("#legendtitle").innerHTML,
                        lgd_subtitle = lgd_choro.querySelector("#legendsubtitle").innerHTML;
                    lgd_choro.remove();
                    createLegend_choro(layer_name, rendering_params.field, lgd_title, lgd_subtitle);
                    lgd_choro = document.getElementById("legend_root");
                    lgd_choro.setAttribute("transform", transform_param);
                }
                sendPreferences();
                zoom_without_redraw();
            } else {
                // Reset to original values the rendering parameters if "no" is clicked
                selection.style('fill-opacity', opacity)
                         .style('stroke-opacity', border_opacity);
                map.select(g_lyr_name).style('stroke-width', stroke_width/zoom.scale()+"px");
                current_layers[layer_name]['stroke-width-const'] = stroke_width;
                let fill_meth = Object.getOwnPropertyNames(fill_prev)[0];

                if(type == "Line"){
                    if(fill_meth == "single")
                    selection.style("stroke", fill_prev.single)
                            .style("stroke-opacity", previous_stroke_opacity);
                    else if(fill_meth == "random")
                        selection.style("stroke-opacity", previous_stroke_opacity)
                                .style("stroke", () => Colors.name[Colors.random()]);
                    else if(fill_math == "class" && renderer == "Links")
                        selection.style('stroke-opacity', (d,i) => current_layers[layer_name].linksbyId[i][0])
                               .style("stroke", stroke_prev);
                }
                else {
                    if(fill_meth == "single") {
                        selection.style('fill', fill_prev.single)
                                 .style('stroke', stroke_prev);
                    } else if(fill_meth == "class") {
                        selection.style('fill-opacity', opacity)
                               .style("fill", function(d, i){ return fill_prev.class[i] })
                               .style('stroke-opacity', previous_stroke_opacity)
                               .style("stroke", stroke_prev);
                    } else if(fill_meth == "random"){
                        selection.style('fill', function(){return Colors.name[Colors.random()];})
                                 .style('stroke', stroke_prev);
                    } else if(fill_meth == "categorical"){
                        fill_categorical(layer_name, fill_prev.categorical[0], "path", fill_prev.categorical[1])
                    }
                }
                if(current_layers[layer_name].colors_breaks)
                    current_layers[layer_name].colors_breaks = prev_col_breaks;
                current_layers[layer_name].fill_color = fill_prev;
                zoom_without_redraw();
            }
    });

     var popup = d3.select(".styleBox");
     popup.append('h4')
            .style({"font-size": "15px", "text-align": "center",
                    "font-weight": "bold", "margin-bottom": "10px"})
            .html("Layer style option");
     popup.append("p")
            .style("text-align", "center")
            .html(['Layer name : <b>', layer_name,'</b><br>',
                   'Geometry type : <b><i>', type, '</b></i>'].join(''));

     if(type !== 'Line'){
        if(current_layers[layer_name].colors_breaks == undefined && renderer != "Categorical"){
            if(current_layers[layer_name].targeted || current_layers[layer_name].is_result){
                let fields = type_col(layer_name, "string");
                let fill_method = popup.append("p").html("Fill color").insert("select");
                [["Single color", "single"],
                 ["Color according to a categorical field", "categorical"],
                 ["Random color on each feature", "random"]].forEach(function(d,i){
                        fill_method.append("option").text(d[0]).attr("value", d[1])  });
                popup.append('div').attr({id: "fill_color_section"})
                fill_method.on("change", function(){
                    d3.select("#fill_color_section").html("").on("click", null);
                    if (this.value == "single")
                        make_single_color_menu(layer_name, fill_prev);
                    else if (this.value == "categorical")
                        make_categorical_color_menu(fields, layer_name, fill_prev);
                    else if (this.value == "random")
                        make_random_color(layer_name);
                    });
                setSelected(fill_method.node(), Object.getOwnPropertyNames(fill_prev)[0])
            } else {
                popup.append('div').attr({id: "fill_color_section"})
                make_single_color_menu(layer_name, fill_prev);
            }
        } else if (renderer == "Categorical"){
            let renderer_field = current_layers[layer_name].rendered_field,
                fields_layer = type_col(layer_name),
                fields_name = Object.getOwnPropertyNames(fields_layer),
                field_to_render;

            var field_selec = popup.append('p').html('Field to render ')
                                    .insert('select').attr('class', 'params')
                                    .on("change", function(){ field_to_render = this.value; });

            fields_name.forEach(f_name => {
                field_selec.append("option").text(f_name).attr("value", f_name);
            });

            popup.insert('p').style("margin", "auto").html("")
                .append("button")
                .attr({class: "button_disc"})
                .style({"font-size": "0.8em", "text-align": "center"})
                .html("Choose colors")
                .on("click", function(){
                    display_categorical_box(layer_name, field_selec.node().value)
                        .then(function(confirmed){
                            if(confirmed){
                                rendering_params = {
                                        nb_class: confirmed[0], color_map :confirmed[1], colorByFeature: confirmed[2],
                                        renderer:"Categorical", rendered_field: field_selec.node().value
                                    };
                                render_categorical(layer_name, rendering_params);
                            }
                        });
                });


        } else if (renderer != "Stewart"){
            let field_to_discretize;
            if(renderer == "Gridded")
                field_to_discretize = "densitykm";
            else {
                var fields = type_col(layer_name, "number"),
                    field_selec = popup.append('p').html('Field :').insert('select').attr('class', 'params').on("change", function(){ field_to_discretize = this.value; });
                field_to_discretize = fields[0];
                fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
                if(current_layers[layer_name].rendered_field && fields.indexOf(current_layers[layer_name].rendered_field) > -1)
                    setSelected(field_selec.node(), current_layers[layer_name].rendered_field)
            }
             popup.append('p').style("margin", "auto").html("")
                .append("button")
                .attr("class", "button_disc")
                .html("Display and arrange class")
                .on("click", function(){
                    display_discretization(layer_name, field_to_discretize, current_layers[layer_name].colors_breaks.length, "Quantiles")
                        .then(function(confirmed){
                            if(confirmed){
                                rendering_params = {
                                    nb_class: confirmed[0],
                                    type: confirmed[1],
                                    breaks: confirmed[2],
                                    colors:confirmed[3],
                                    colorsByFeature: confirmed[4],
                                    renderer:"Choropleth",
                                    field: field_to_discretize
                                };
                                selection.style('fill-opacity', 0.9)
                                         .style("fill", function(d, i){ return rendering_params.colorsByFeature[i] });
                            }
                        });
                });
         } else if (renderer == "Stewart"){
            let field_to_colorize = "min",
                nb_ft = current_layers[layer_name].n_features;

            rendering_params = {breaks: [].concat(current_layers[layer_name].colors_breaks)};

            let recolor_stewart = function(coloramp_name, reversed){
                let new_coloramp = getColorBrewerArray(nb_ft, coloramp_name);
                if(reversed) new_coloramp.reverse();
                for(let i=0; i < nb_ft; ++i)
                    rendering_params.breaks[i][1] = new_coloramp[i];
                selection.style("fill", (d,i) => new_coloramp[i] );
            }

            let seq_color_select = popup.insert("p")
                                        .html("Color palette ")
                                        .insert("select")
                                        .attr("id", "coloramp_params")
                                        .on("change", function(){
                                            recolor_stewart(this.value)
                                         });

            ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn',
             'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(function(name){
                seq_color_select.append("option").text(name).attr("value", name); });

            var button_reverse = popup.insert("button")
                                    .style({"display": "inline", "margin-left": "10px"})
                                    .attr({"class": "button_st3", "id": "reverse_colramp"})
                                    .html("Reverse palette")
                                    .on("click", function(){
                                        let pal_name = document.getElementById("coloramp_params").value;
                                        recolor_stewart(pal_name, true);
                                     });
         }
         popup.append('p').html('Fill opacity<br>')
                          .insert('input').attr('type', 'range')
                          .attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", opacity)
                          .on('change', function(){selection.style('fill-opacity', this.value)});
    } else if (type === "Line" && renderer == "Links"){
        var prev_min_display = current_layers[layer_name].min_display || 0;
        let max_val = 0,
            previous_stroke_opacity = selection.style("stroke-opacity");
        selection.each(function(d){if(d.properties.fij > max_val) max_val = d.properties.fij;})
        popup.append('p').html('Only display flows larger than ...')
                        .insert('input').attr({type: 'range', min: 0, max: max_val, step: 0.5, value: prev_min_display})
                        .on("change", function(){
                            let val = +this.value;
                            popup.select("#larger_than").html(["<i> ", val, " </i>"].join(''));
                            selection.style("stroke-opacity", function(d, i){
                                if(+d.properties.fij > val)
                                    return 1;
                                return 0;
                            });
                            current_layers[layer_name].min_display = val;
                        });
        popup.append('label').attr("id", "larger_than").html("<i> ", prev_min_display, " </i>"].join(''));

     } else if (type === "Line" && renderer == "DiscLayer"){
        var prev_min_display = current_layers[layer_name].min_display || 0;
        let max_val = Math.max.apply(null, user_data[layer_name].map( i => i.disc_value));
        popup.append("p").html("Discontinuity threshold ')
                .insert("input").attr({type: "range", min: 0, max: max_val, step: 0.1, value: prev_min_display})
                .on("change", function(){
                    let val = +this.value;
                    popup.select("#discont_threshold").html(["<i> ", val, " </i>"].join(''));
                    selection.style("stroke-opacity", (d,i) => +d.properties.disc_value > max_val ? 1 : 0 );
                    current_layers[layer_name].min_display = val;
                });
        popup.append("label").attr("id", "discont_threshold").html(["<i> ", prev_min_display, " </i>"].join(''));
        popup.append("p").html("Reference max. size (px) ")
                    .insert("input").attr({type: "number", min: 0.1, max: max_val, step: 0.1, value: current_layers[layer_name].size[1]});
    }
     popup.append('p').html(type === 'Line' ? 'Color<br>' : 'Border color<br>')
                      .insert('input').attr('type', 'color').attr("value", stroke_prev)
                      .on('change', function(){selection.style("stroke", this.value)});
     popup.append('p').html(type === 'Line' ? 'Opacity<br>' : 'Border opacity<br>')
                      .insert('input').attr('type', 'range').attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", border_opacity)
                      .on('change', function(){selection.style('stroke-opacity', this.value)});

    if(renderer != "DiscLayer" && renderer != "Links")
         popup.append('p').html(type === 'Line' ? 'Width (px)<br>' : 'Border width<br>')
                          .insert('input').attr('type', 'number').attr({min: 0, step: 0.1, value: stroke_width})
                          .on('change', function(){
                                let val = +this.value;
                                map.select(g_lyr_name).style("stroke-width", (val / zoom.scale()) + "px");
                                current_layers[layer_name]['stroke-width-const'] = val;
                          });
}


function createStyleBox_ProbSymbol(layer_name){
    var g_lyr_name = "#" + layer_name,
        ref_layer_name = current_layers[layer_name].ref_layer_name || layer_name.substring(0, layer_name.indexOf("_Prop")),
        type_method = current_layers[layer_name].renderer.indexOf("PropSymbolsChoro") > -1 ? "PropSymbolsChoro" : current_layers[layer_name].renderer,
        type_symbol = current_layers[layer_name].symbol,
        field_used = current_layers[layer_name].rendered_field,
        selection = d3.select(g_lyr_name).selectAll(type_symbol),
        rendering_params,
        old_size = [current_layers[layer_name].size[0],
                    current_layers[layer_name].size[1]];

     var stroke_prev = selection.style('stroke'),
         opacity = selection.style('fill-opacity'),
         border_opacity = selection.style('stroke-opacity'),
         stroke_width = selection.style('stroke-width');

    var fill_prev = cloneObj(current_layers[layer_name].fill_color),
        prev_col_breaks;

    var d_values = [],
        comp = function(a, b){return b-a};
    for(let i = 0, i_len = user_data[ref_layer_name].length; i < i_len; ++i)
        d_values.push(+user_data[ref_layer_name][i][field_used]);
    d_values.sort(comp);

    let redraw_prop_val = function(prop_values){
        let selec = selection[0];

        if(type_symbol === "circle") {
            for(let i=0, len = prop_values.length; i < len; i++){
                selec[i].setAttribute('r', prop_values[i])
            }
        } else if(type_symbol === "rect") {
            for(let i=0, len = prop_values.length; i < len; i++){
                let old_rect_size = +selec[i].getAttribute('height'),
                    centr = [+selec[i].getAttribute("x") + (old_rect_size/2) - (prop_values[i] / 2),
                             +selec[i].getAttribute("y") + (old_rect_size/2) - (prop_values[i] / 2)];

                selec[i].setAttribute('x', centr[0]);
                selec[i].setAttribute('y', centr[1]);
                selec[i].setAttribute('height', prop_values[i]);
                selec[i].setAttribute('width', prop_values[i]);
            }
        }
    }

    if(current_layers[layer_name].colors_breaks && current_layers[layer_name].colors_breaks instanceof Array)
        prev_col_breaks = [].concat(current_layers[layer_name].colors_breaks);

    if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
    if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

    make_confirm_dialog("", "Save", "Close without saving", "Layer style options", "styleBox", undefined, undefined, true)
        .then(function(confirmed){
            if(confirmed){
                if(current_layers[layer_name].size != old_size){
                    let lgd_prop_symb = document.getElementById("legend_root2");
                    if(lgd_prop_symb){
                        let transform_param = lgd_prop_symb.getAttribute("transform"),
                            lgd_title = lgd_prop_symb.querySelector("#legendtitle").innerHTML,
                            lgd_subtitle = lgd_prop_symb.querySelector("#legendsubtitle").innerHTML;
                        lgd_prop_symb.remove();
                        createLegend_symbol(layer_name, field_used, lgd_title, lgd_subtitle);
                        lgd_prop_symb = document.getElementById("legend_root2");
                        if(transform_param)
                            lgd_prop_symb.setAttribute("transform", transform_param);
                    }
                }

                if(type_method == "PropSymbolsChoro"){
                    console.log(rendering_params.breaks)
                    current_layers[layer_name].fill_color = {"class": [].concat(rendering_params.colorsByFeature) };
                    current_layers[layer_name].colors_breaks = [];
                    for(let i = 0; i<rendering_params.breaks.length-1; ++i)
                        current_layers[layer_name].colors_breaks.push([[rendering_params.breaks[i], " - ", rendering_params.breaks[i+1]].join(''), rendering_params.colors[i]]);
                    current_layers[layer_name].rendered_field2 = rendering_params.field;
                    // Also change the legend if there is one displayed :
                    let lgd_choro = document.getElementById("legend_root");
                    if(lgd_choro){
                        let transform_param = lgd_choro.getAttribute("transform"),
                            lgd_title = lgd_choro.querySelector("#legendtitle").innerHTML,
                            lgd_subtitle = lgd_choro.querySelector("#legendsubtitle").innerHTML;
                        lgd_choro.remove();
                        createLegend_choro(layer_name, rendering_params.field, lgd_title, lgd_subtitle);
                        lgd_choro = document.getElementById("legend_root");
                        if(transform_param)
                            lgd_choro.setAttribute("transform", transform_param);
                    }
                }
            } else {
                selection.style('fill-opacity', opacity)
                             .style('stroke-opacity', border_opacity);
                d3.select(g_lyr_name).style('stroke-width', stroke_width);
                current_layers[layer_name]['stroke-width-const'] = stroke_width;
                let fill_meth = Object.getOwnPropertyNames(fill_prev)[0];
                if(fill_meth == "single") {
                    selection.style('fill', fill_prev.single)
                             .style('stroke', stroke_prev);
                } else if(fill_meth == "class") {
                    selection.style('fill-opacity', opacity)
                           .style("fill", function(d, i){ return current_layers[layer_name].fill_color.class[i] })
                           .style('stroke-opacity', previous_stroke_opacity)
                           .style("stroke", stroke_prev);
                    current_layers[layer_name].colors_breaks = prev_col_breaks;
                } else if(fill_meth == "random"){
                    selection.style('fill', function(){return Colors.name[Colors.random()];})
                             .style('stroke', stroke_prev);
                } else if(fill_meth == "categorical"){
                    fill_categorical(layer_name, fill_prev.categorical[0],
                                     type_symbol, fill_prev.categorical[1],
                                     ref_layer_name)
                }
                current_layers[layer_name].fill_color = fill_prev;
                if(current_layers[layer_name].size[1] != old_size[1]){
                    let prop_values = prop_sizer3_e(d_values, old_size[0], old_size[1], type_symbol);
                    redraw_prop_val(prop_values);
                    current_layers[layer_name].size = [old_size[0], old_size[1]];
                }
            }
            zoom_without_redraw();
        });

    var popup = d3.select(".styleBox");
    popup.append('h4')
            .style({"font-size": "15px", "text-align": "center",
                    "font-weight": "bold", "margin-bottom": "10px"})
            .html("Layer style option");
    popup.append("p")
            .style({"text-align": "center", "color": "grey"})
            .html(['<i>Rendered layer : <b>', ref_layer_name,'</b></i><br>'].join(''));
    if(type_method === "PropSymbolsChoro"){
        let field_color = current_layers[layer_name].rendered_field2;
         popup.append('p').style("margin", "auto").html("Field used for <strong>symbol colors</strong> : <i>" + field_color + "</i><br>")
            .append("button").attr("class", "button_disc").html("Display and arrange class")
            .on("click", function(){display_discretization(ref_layer_name, field_color, current_layers[layer_name].colors_breaks.length, "Quantiles")
          .then(function(confirmed){
            if(confirmed){
                rendering_params = {
                    nb_class: confirmed[0], type: confirmed[1],
                    breaks: confirmed[2], colors:confirmed[3],
                    colorsByFeature: confirmed[4],
                    renderer:"PropSymbolsChoro",
                    field: field_color
                    };
                selection.style('fill-opacity', 0.9)
                         .style("fill", function(d, i){
                    let ft_id = +current_layers[layer_name].features_order[i][0];
                    return rendering_params.colorsByFeature[ft_id];
                });
             }
            });
        });
    } else {
        let fields = type_col(ref_layer_name, "string"),
            fill_method = popup.append("p").html("Fill color").insert("select");

        [["Single color", "single"],
         ["Color according to a categorical field", "categorical"],
         ["Random color on each feature", "random"]]
            .forEach(function(d,i){
                fill_method.append("option").text(d[0]).attr("value", d[1])
            });
        popup.append('div').attr({id: "fill_color_section"})
        fill_method.on("change", function(){
            d3.select("#fill_color_section").html("").on("click", null);
            if (this.value == "single")
                make_single_color_menu(layer_name, fill_prev, type_symbol);
            else if (this.value == "categorical")
                make_categorical_color_menu(fields, layer_name, fill_prev, type_symbol, ref_layer_name);
            else if (this.value == "random")
                make_random_color(layer_name, type_symbol);
        });
        setSelected(fill_method.node(), Object.getOwnPropertyNames(fill_prev)[0])
    }

    popup.append('p').html('Fill opacity<br>')
          .insert('input').attr('type', 'range')
          .attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", opacity)
          .on('change', function(){selection.style('fill-opacity', this.value)});

    popup.append('p').html('Border color<br>')
          .insert('input').attr('type', 'color').attr("value", stroke_prev)
          .on('change', function(){selection.style("stroke", this.value)});

    popup.append('p').html('Border opacity<br>')
          .insert('input').attr('type', 'range').attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", border_opacity)
          .on('change', function(){selection.style('stroke-opacity', this.value)});

    popup.append('p').html('Border width<br>')
          .insert('input').attr('type', 'number').attr({min: 0, step: 0.1, value: stroke_width})
          .on('change', function(){
                selection.style("stroke-width", this.value+"px");
                current_layers[layer_name]['stroke-width-const'] = +this.value
            });

    let prop_val_content = popup.append("p").html([
        "Field used for <strong>proportionals values</strong> : <i>", field_used,
        "</i><br><br>Symbol fixed size<br>"].join(''))
    prop_val_content
          .insert('input').attr("type", "range")
          .attr({id: "max_size_range", min: 0.1, max: 40, step: 0.1, value: current_layers[layer_name].size[1]})
          .on("change", function(){
              let f_size = +this.value,
                  prop_values = prop_sizer3_e(d_values, current_layers[layer_name].size[0], f_size, type_symbol);

              current_layers[layer_name].size[1] = f_size;
              prop_val_content.select("#txt_symb_size").html([f_size, " px"].join(''))
              redraw_prop_val(prop_values);
          });
    prop_val_content.append("span").attr('id', 'txt_symb_size').html([current_layers[layer_name].size[1], ' px'].join(''));

    let max_val_prop_symbol = Math.max.apply(null, user_data[ref_layer_name].map(obj => +obj[field_used]));

    popup.append("p").html("on value ...")
        .insert("input")
        .style("width", "100px")
        .attr({type: "number", min: 0.1, max: max_val_prop_symbol,
               value: +current_layers[layer_name].size[0], step: 0.1})
        .on("change", function(){
            let f_val = +this.value,
                prop_values = prop_sizer3_e(d_values, f_val, current_layers[layer_name].size[1], type_symbol);
            redraw_prop_val(prop_values);
        });
// Todo : find a "light" way to recompute the "force" on the node after changing their size
//              if(type_method.indexOf('Dorling') > -1){
//                let nodes = selection[0].map((d, i) => {
//                    let pt = path.centroid(d.__data__.geometry);
//                    return {x: pt[0], y: pt[1],
//                            x0: pt[0], y0: pt[1],
//                            r: +prop_values[i],
//                            value: +d_values[i]};
//                    });
//                  current_layers[layer_name].force.nodes(nodes).start()
//              }
}
