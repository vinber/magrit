"use strict";
// TODO : refactor some functions in this file (they are really too messy)
function handle_click_layer(layer_name){
    if(layer_name == "Graticule")
        createStyleBoxGraticule();
    else if(current_layers[layer_name].renderer
        && (current_layers[layer_name].renderer.indexOf("PropSymbol") > -1
            || current_layers[layer_name].renderer.indexOf("Dorling") > -1))
        createStyleBox_ProbSymbol(layer_name);
    else if (current_layers[layer_name].renderer
             && current_layers[layer_name].renderer == "Label")
        createStyleBoxLabel(layer_name);
    else if (current_layers[layer_name].renderer
            && current_layers[layer_name].renderer == "TypoSymbols")
        createStyleBoxTypoSymbols(layer_name);
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
    let block = fill_color_section.insert('p');
    block.insert("span")
          .html(i18next.t("app_page.layer_style_popup.fill_color"));
    block.insert('input')
          .style("float", "right")
          .attrs({type: 'color', "value": last_color})
          .on('change', function(){
                map.select(g_lyr_name)
                    .selectAll(symbol)
                    .transition()
                    .style("fill", this.value);
                current_layers[layer].fill_color = {"single": this.value};
          });
}

function make_random_color(layer, symbol = "path"){
    let block = d3.select("#fill_color_section").insert("p");
    block.insert("span")
        .styles({"cursor": "pointer", "text-align": "center"})
        .html(i18next.t("app_page.layer_style_popup.toggle_colors"))
        .on("click", function(d,i){
            map.select("#" + layer)
                .selectAll(symbol)
                .transition()
                .style("fill", () => Colors.names[Colors.random()]);
            current_layers[layer].fill_color = {"random": true};
            make_random_color(layer, symbol);
        });
}

function fill_categorical(layer, field_name, symbol, color_cat_map, ref_layer){
    let data_layer = ref_layer ? user_data[ref_layer] : user_data[layer] ? user_data[layer] : result_data[layer];

    if(ref_layer && current_layers[layer].features_order){
        let features_order = current_layers[layer].features_order;
        map.select("#"+layer)
            .selectAll(symbol)
            .transition()
            .style("fill", function(d, i){
                let idx = features_order[i][0];
                return color_cat_map.get(data_layer[idx][field_name]);
            });
    } else if (ref_layer)
        map.select("#"+layer)
            .selectAll(symbol)
            .transition()
            .style("fill", (d,i) => color_cat_map.get(data_layer[i][field_name]));
    else
        map.select("#"+layer)
            .selectAll(symbol)
            .transition()
            .style("fill", d => color_cat_map.get(d.properties[field_name]));
}

function make_categorical_color_menu(fields, layer, fill_prev, symbol = "path", ref_layer){
    var fill_color_section = d3.select("#fill_color_section").append("p");
   fill_color_section.insert("span").html(i18next.t("app_page.layer_style_popup.categorical_field"));
   var field_selec = fill_color_section.insert("select");
    fields.forEach(function(field){
        if(field != "id")
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
        d3.select("#nb_cat_txt").html(txt)
        var color_cat_map = new Map();
        for(let val of cats)
            color_cat_map.set(val, Colors.names[Colors.random()])

        current_layers[layer].fill_color = { "categorical": [field_name, color_cat_map] };
        fill_categorical(layer, field_name, symbol, color_cat_map, ref_layer)
    });

    if((!fill_prev || !fill_prev.categorical) && field_selec.node().options.length > 0)
        setSelected(field_selec.node(), field_selec.node().options[0].value)

    fill_color_section.append("span").attr("id", "nb_cat_txt").html("");

};

let cloneObj = function(obj){
    if(obj === null || typeof obj !== "object")
        return obj;
    else if(obj.toString() == "[object Map]"){
        return new Map(obj.entries());
    } else {
        return Object.assign({}, obj);
    }
}

function createStyleBoxTypoSymbols(layer_name){
    function get_prev_settings(){
        let features = selection._groups[0];
        for(let i = 0; i<features.length; i++){
            prev_settings.push({
                "display": features[i].style.display ? features[i].style.display : null,
                "size": features[i].getAttribute("width"),
                "position": [features[i].getAttribute("x"), features[i].getAttribute("y")]
            });
        }
        prev_settings_defaults["size"] = current_layers[layer_name].default_size;
    }

    function restore_prev_settings(){
        let features = selection._groups[0];
        for(let i = 0; i<features.length; i++){
            features[i].setAttribute("width", prev_settings[i]["size"]);
            features[i].setAttribute("height", prev_settings[i]["size"]);
            features[i].setAttribute("x", prev_settings[i]["position"][0]);
            features[i].setAttribute("y", prev_settings[i]["position"][1]);
            features[i].style.display = prev_settings[i]["display"];
        }
        current_layers[layer_name].default_size = prev_settings_defaults.size;
    }

    let existing_box = document.querySelector(".styleBox");
    if(existing_box) existing_box.remove();

    var selection = map.select("#" + layer_name).selectAll("image"),
        ref_layer_name = current_layers[layer_name].ref_layer_name,
        ref_layer_selection = document.getElementById(ref_layer_name).querySelectorAll("path"),
        symbols_map = current_layers[layer_name].symbols_map,
        rendered_field = current_layers[layer_name].rendered_field,
        ref_coords = [];

    var prev_settings = [],
        prev_settings_defaults = {};

    get_prev_settings();

    for(let i = 0; i < ref_layer_selection.length; i++){
        ref_coords.push(path.centroid(ref_layer_selection[i].__data__));
    }

    make_confirm_dialog2("styleBox", layer_name, {top: true, widthFitContent: true, draggable: true})
        .then(function(confirmed){
            if(!confirmed){
                restore_prev_settings();
            }
        });

    var popup = d3.select(".styleBox").select(".modal-body").style("width", "295px");;
    popup.append("p")
            .styles({"text-align": "center", "color": "grey"})
            .html([i18next.t("app_page.layer_style_popup.rendered_field", {field: rendered_field}),
                   i18next.t("app_page.layer_style_popup.reference_layer", {layer: ref_layer_name})].join(''));

    popup.append("p").style("text-align", "center")
            .insert("button")
            .attr("id","reset_symb_loc")
            .attr("class", "button_st4")
            .text(i18next.t("app_page.layer_style_popup.reset_symbols_location"))
            .on("click", function(){
                selection.transition()
                        .attr("x", (d,i) => ref_coords[i][0] - symbols_map.get(d.Symbol_field)[1] / 2)
                        .attr("y", (d,i) => ref_coords[i][1] - symbols_map.get(d.Symbol_field)[1] / 2);
            });

    popup.append("p").style("text-align", "center")
            .insert("button")
            .attr("id","reset_symb_display")
            .attr("class", "button_st4")
            .text(i18next.t("app_page.layer_style_popup.redraw_symbols"))
            .on("click", function(){
                selection.style("display", undefined);
            });

//    popup.append("p").style("text-align", "center")
//            .insert("button")
//            .attr("id","modif_symb")
//            .attr("class", "button_st4")
//            .text(i18next.t("app_page.layer_style_popup.modify_symbols"))
//            .on("click", function(){
//                display_box_symbol_typo(ref_layer_name, rendered_field)().then(function(confirmed){
//                    if(confirmed){
//                        rendering_params = {
//                            nb_cat: confirmed[0],
//                            symbols_map: confirmed[1],
//                            field: rendered_field
//                        };
//                        map.select("#" + layer_name)
//                            .selectAll("image")
//                            .attr("x", d => d.coords[0] - rendering_params.symbols_map.get(d.Symbol_field)[1] / 2)
//                            .attr("y", d => d.coords[1] - rendering_params.symbols_map.get(d.Symbol_field)[1] / 2)
//                            .attr("width", d => rendering_params.symbols_map.get(d.Symbol_field)[1] + "px")
//                            .attr("height", d => rendering_params.symbols_map.get(d.Symbol_field)[1] + "px")
//                            .attr("xlink:href", (d,i) => rendering_params.symbols_map.get(d.Symbol_field)[0]);
//                    }
//                });
//            });

}

function createStyleBoxLabel(layer_name){
    function get_prev_settings(){
        let features = selection._groups[0];
        prev_settings = [];
        for(let i = 0; i < features.length; i++){
            prev_settings.push({
                "color": features[i].style.fill,
                "size": features[i].style.fontSize,
                "display": features[i].style.display ? features[i].style.display : null,
                "position": [features[i].getAttribute("x"), features[i].getAttribute("y")],
                "font": features[i].style.fontFamily
                });
        }
        prev_settings_defaults = {
            "color": current_layers[layer_name].fill_color,
            "size": current_layers[layer_name].default_size,
            "font": current_layers[layer_name].default_font
        };
    };

    function restore_prev_settings(){
        let features = selection._groups[0];
        for(let i = 0; i < features.length; i++){
            features[i].style.fill = prev_settings[i]["color"];
            features[i].style.fontSize = prev_settings[i]["size"];
            features[i].style.display = prev_settings[i]["display"];
            features[i].setAttribute("x", prev_settings[i]["position"][0]);
            features[i].setAttribute("y", prev_settings[i]["position"][1]);
            features[i].style.fontFamily = prev_settings[i]["font"];
        }

        current_layers[layer_name].fill_color = prev_settings_defaults.color;
        current_layers[layer_name].default_size = prev_settings_defaults.size;
        current_layers[layer_name].default_font = prev_settings_defaults.font;
    };

    let existing_box = document.querySelector(".styleBox");
    if(existing_box) existing_box.remove();

    var selection = map.select("#" + layer_name).selectAll("text"),
        ref_layer_name = current_layers[layer_name].ref_layer_name,
        ref_layer_selection = document.getElementById(ref_layer_name).querySelectorAll("path"),
        ref_coords = [];

    var prev_settings = [],
        prev_settings_defaults = {},
        rendering_params = {};

    get_prev_settings();

    for(let i = 0; i < ref_layer_selection.length; i++){
        ref_coords.push(path.centroid(ref_layer_selection[i].__data__));
    }

    make_confirm_dialog2("styleBox", layer_name, {top: true, widthFitContent: true, draggable: true})
        .then(function(confirmed){
            if(!confirmed){
                restore_prev_settings();
            }
        });
    var popup = d3.select(".styleBox").select(".modal-body").style("width", "295px");;
    popup.append("p")
            .styles({"text-align": "center", "color": "grey"})
            .html([i18next.t("app_page.layer_style_popup.rendered_field", {field: current_layers[layer_name].rendered_field}),
                   i18next.t("app_page.layer_style_popup.reference_layer", {layer: ref_layer_name})].join(''));
    popup.append("p").style("text-align", "center")
            .insert("button")
            .attr("id","reset_labels_loc")
            .attr("class", "button_st4")
            .text(i18next.t("app_page.layer_style_popup.reset_labels_location"))
            .on("click", function(){
                selection.transition()
                        .attr("x", (d,i) => ref_coords[i][0])
                        .attr("y", (d,i) => ref_coords[i][1]);
            });

    popup.append("p").style("text-align", "center")
            .insert("button")
            .attr("id","reset_labels_display")
            .attr("class", "button_st4")
            .text(i18next.t("app_page.layer_style_popup.redraw_labels"))
            .on("click", function(){
                selection.style("display", undefined);
            });

    popup.insert("p").style("text-align", "center").style("font-size", "9px")
            .html(i18next.t("app_page.layer_style_popup.overrride_warning"));
    let label_sizes = popup.append("p").attr("class", "line_elem");
    label_sizes.append("span")
            .html(i18next.t("app_page.layer_style_popup.labels_default_size"));
    label_sizes.insert("span")
            .style("float", "right")
            .html(" px");
    label_sizes.insert("input")
            .style("float", "right")
            .attr("type", "number")
            .attr("value", +current_layers[layer_name].default_size.replace("px", ""))
            .on("change", function(){
                let size = this.value + "px";
                current_layers[layer_name].default_size = size;
                selection.style("font-size", size);
            });

    let default_color = popup.insert("p").attr("class", "line_elem");
    default_color.append("span")
            .html(i18next.t("app_page.layer_style_popup.labels_default_color"));
    default_color.insert("input")
            .attrs({"type": "color", "value": current_layers[layer_name].fill_color})
            .on("change", function(){
                current_layers[layer_name].fill_color = this.value;
                selection.transition().style("fill", this.value);
            });

    let font_section = popup.insert("p").attr("class", "line_elem")
    font_section.append("span").html(i18next.t("app_page.layer_style_popup.labels_default_font"));
    let choice_font = font_section.insert("select")
            .style("float", "right")
            .on("change", function(){
                current_layers[layer_name].default_font = this.value;
                selection.transition().style("font-family", this.value);
            });

    available_fonts.forEach( name => {
        choice_font.append("option").attr("value", name[1]).text(name[0]);
    });
    choice_font.node().value = current_layers[layer_name].default_font;
}

function createStyleBoxGraticule(layer_name){
    let existing_box = document.querySelector(".styleBox");
    if(existing_box) existing_box.remove();
    let current_params = cloneObj(current_layers["Graticule"]);
    let selection = map.select("#Graticule > path");
    let selection_strokeW = map.select("#Graticule");

    make_confirm_dialog2("styleBox", layer_name, {top: true, widthFitContent: true, draggable: true})
        .then(function(confirmed){
            if(confirmed){ null; } else { null; }
        });

    let popup = d3.select(".styleBox").select(".modal-body").style("width", "295px");
    let color_choice = popup.append("p").attr("class", "line_elem");
    color_choice.append("span").html(i18next.t("app_page.layer_style_popup.color"));
    color_choice.append("input")
            .style("float", "right")
            .attrs({type: "color", value: current_params.fill_color.single})
            .on("change", function(){
                selection.style("stroke", this.value);
                current_layers["Graticule"].fill_color.single = this.value;
            });

    let opacity_choice = popup.append("p").attr("class", "line_elem");
    opacity_choice.append("span").html(i18next.t("app_page.layer_style_popup.opacity"));
    opacity_choice.append("span")
            .attr("id", "graticule_opacity_txt")
            .style("float", "right")
            .html(current_params.opacity);
    opacity_choice.append("input")
            .attrs({type: "range", value: current_params.opacity})
            .styles({"width": "70px", "vertical-align": "middle", "display": "inline", "float": "right"})
            .on("change", function(){
                selection.style("stoke-opacity", +this.value);
                current_layers["Graticule"].opacity = +this.value;
                popup.select("#graticule_opacity_txt").html(this.value)
            });

    let stroke_width_choice = popup.append("p").attr("class", "line_elem");
    stroke_width_choice.append("span").html(i18next.t("app_page.layer_style_popup.width"));
    stroke_width_choice.append("input")
            .attrs({type: "number", value: current_params["stroke-width-const"]})
            .styles({"width": "70px", "float": "right"})
            .on("change", function(){
                selection_strokeW.style("stroke-width", this.value)
                current_layers["Graticule"]["stroke-width-const"] = +this.value;
            });

    let steps_choice = popup.append("p").attr("class", "line_elem");
    steps_choice.append("span").html(i18next.t("app_page.layer_style_popup.graticule_steps"));
    steps_choice.append("input")
            .attrs({id: "graticule_range_steps", type: "range", value: current_params.step, min: 0, max: 100, step: 1})
            .styles({"vertical-align": "middle", "width": "70px", "display": "inline", "float": "right"})
            .on("change", function(){
                let step_val = +this.value,
                    dasharray_val = +document.getElementById("graticule_dasharray_txt");
                current_layers["Graticule"].step = step_val;
                map.select("#Graticule").remove()
                map.append("g").attrs({id: "Graticule", class: "layer"})
                               .append("path")
                               .transition()
                               .attrs({class: "graticule", d: path, "clip-path": "url(#clip)"})
                               .styles({fill: "none", "stroke": current_layers["Graticule"].fill_color.single, "stroke-dasharray": dasharray_val})
                               .datum(d3.geoGraticule().step([step_val, step_val]));
                              //  .attr("class", "graticule")
                              //  .style("stroke-dasharray", dasharray_val)
                              //  .attr("clip-path", "url(#clip)")
                              //  .attr("d", path)
                              //  .style("fill", "none")
                              //  .style("stroke", "grey");
                zoom_without_redraw();
                selection = map.select("#Graticule").selectAll("path");
                selection_strokeW = map.select("#Graticule");
                popup.select("#graticule_step_txt").attr("value", step_val);
            });
    steps_choice.append("input")
            .attrs({type: "number", value: current_params.step, min: 0, max: 100, step: "any", class: "without_spinner", id: "graticule_step_txt"})
            .styles({width: "30px", "margin-left": "10px", "float": "right"})
            .on("change", function(){
                let grat_range = document.getElementById("graticule_range_steps");
                grat_range.value = +this.value;
                grat_range.dispatchEvent(new MouseEvent("change"));
            });

    let dasharray_choice = popup.append("p").attr("class", "line_elem");
    dasharray_choice.append("span").html(i18next.t("app_page.layer_style_popup.graticule_dasharray"));
    dasharray_choice.append("input")
            .attrs({type: "number", value: current_params.step, min: 0, max: 100, step: "any", class: "without_spinner", id: "graticule_dasharray_txt"})
            .styles({width: "30px", "margin-left": "10px", "float": "right"})
            .on("change", function(){
                let grat_range = document.getElementById("graticule_range_dasharray");
                grat_range.value = +this.value;
                grat_range.dispatchEvent(new MouseEvent("change"));
            });
    dasharray_choice.append("input")
            .attrs({type: "range", value: current_params.step, min: 0, max: 50, step: 0.1, id: "graticule_range_dasharray"})
            .styles({"vertical-align": "middle", "width": "70px", "display": "inline", "float": "right"})
            .on("change", function(){
                selection.style("stroke-dasharray", this.value);
                current_layers["Graticule"].dasharray = +this.value;
                popup.select("#graticule_dasharray_txt").attr("value", this.value);
            });
}

function createStyleBox(layer_name){
    let existing_box = document.querySelector(".styleBox");
    if(existing_box) existing_box.remove();
    var type = current_layers[layer_name].type,
        rendering_params = null,
        renderer = current_layers[layer_name].renderer,
        g_lyr_name = "#" + layer_name,
        selection = map.select(g_lyr_name).selectAll("path"),
        opacity = selection.style('fill-opacity');

    var lgd_to_change;

    var fill_prev = cloneObj(current_layers[layer_name].fill_color),
        prev_col_breaks;

    if(current_layers[layer_name].colors_breaks && current_layers[layer_name].colors_breaks instanceof Array)
        prev_col_breaks = current_layers[layer_name].colors_breaks.concat([]);


    var stroke_prev = selection.style('stroke'),
        border_opacity = selection.style('stroke-opacity'),
        stroke_width = +current_layers[layer_name]['stroke-width-const'];

    if(stroke_prev.startsWith("rgb"))
        stroke_prev = rgb2hex(stroke_prev);

    make_confirm_dialog2("styleBox", layer_name, {top: true, widthFitContent: true, draggable: true})
        .then(function(confirmed){
            if(confirmed){
                // Update the object holding the properties of the layer if Yes is clicked
//                if(stroke_width != current_layers[layer_name]['stroke-width-const'])
//                    current_layers[layer_name].fixed_stroke = true;
                if(type === "Point" && !renderer) {
                    current_layers[layer_name].pointRadius = +current_pt_size;
                }
                if(renderer != undefined
                     && rendering_params != undefined && renderer != "Stewart" && renderer != "Categorical"){
                    current_layers[layer_name].fill_color = {"class": rendering_params.colorsByFeature};
                    let colors_breaks = [];
                    for(let i = rendering_params['breaks'].length-1; i > 0; --i){
                        colors_breaks.push([
                            [rendering_params['breaks'][i-1], " - ", rendering_params['breaks'][i]].join(''),
                            rendering_params['colors'][i-1]
                            ]);
                    }
                    current_layers[layer_name].colors_breaks = colors_breaks;
                    current_layers[layer_name].rendered_field = rendering_params.field;
                    current_layers[layer_name].options_disc = {
                            schema: rendering_params.schema,
                            colors: rendering_params.colors,
                            no_data: rendering_params.no_data };
                } else if (renderer == "Stewart"){
                    current_layers[layer_name].colors_breaks = rendering_params.breaks;
                    current_layers[layer_name].fill_color.class =  rendering_params.breaks.map(obj => obj[1]);
                }
                // Also change the legend if there is one displayed :
                let _type_layer_links = (renderer == "DiscLayer" || renderer == "Links")
                let lgd = document.querySelector(
                    [_type_layer_links ? "#legend_root_links.lgdf_" : "#legend_root.lgdf_", layer_name].join('')
                    );
                if(lgd && (lgd_to_change || rendering_params)){
                    let transform_param = lgd.getAttribute("transform"),
                        lgd_title = lgd.querySelector("#legendtitle").innerHTML,
                        lgd_subtitle = lgd.querySelector("#legendsubtitle").innerHTML,
                        boxgap = lgd.getAttribute("boxgap");

                    if(_type_layer_links){
                        lgd.remove();
                        createLegend_discont_links(layer_name, current_layers[layer_name].rendered_field, lgd_title, lgd_subtitle);
                    } else {
                        let no_data_txt = document.getElementById("no_data_txt");
                        no_data_txt = no_data_txt != null ? no_data_txt.textContent : null;
                        lgd.remove();
                        createLegend_choro(layer_name, rendering_params.field, lgd_title, lgd_subtitle, boxgap, undefined, undefined, no_data_txt);
                    }
                    lgd = document.querySelector(
                        [_type_layer_links ? "#legend_root_links.lgdf_" : "#legend_root.lgdf_", layer_name].join('')
                        );
                    if(transform_param)
                        lgd.setAttribute("transform", transform_param);
                }
                zoom_without_redraw();
            } else {
                // Reset to original values the rendering parameters if "no" is clicked
                selection.style('fill-opacity', opacity)
                         .style('stroke-opacity', border_opacity);
                let zoom_scale = +d3.zoomTransform(map.node()).k;
                map.select(g_lyr_name).style('stroke-width', stroke_width/zoom_scale + "px");
                current_layers[layer_name]['stroke-width-const'] = stroke_width;
                let fill_meth = Object.getOwnPropertyNames(fill_prev)[0];
                if(type === "Point" && !renderer) {
                    selection.attr("d", path.pointRadius(+current_layers[layer_name].pointRadius))
                } else if(type == "Line"){
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
                    if(current_layers[layer_name].renderer == "Stewart"){
                        recolor_stewart(prev_palette.name, prev_palette.reversed);
                    } else if(fill_meth == "single") {
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

    var popup = d3.select(".styleBox").select(".modal-body").style("width", "295px");;

    if(type === "Point" && !renderer){
        var current_pt_size = current_layers[layer_name].pointRadius;
        let pt_size = popup.append("p").attr("class", "line_elem");
        pt_size.append("span").html(i18next.t("app_page.layer_style_popup.point_radius"));
        pt_size.append("input")
                .attrs({type: "range", min: 0, max: 40, value: current_pt_size})
                .styles({"width": "70px", "vertical-align": "middle", "display": "inline", "float": "right", "margin-right": "0px"})
                .on("change", function(){
                    current_pt_size = +this.value;
                    document.getElementById("txt_pt_radius").innerHTML = current_pt_size;
                    selection.attr("d", path.pointRadius(current_pt_size));
                });
        pt_size.append("span")
                .attr("id", "txt_pt_radius")
                .style("float", "right")
                .html(current_pt_size + "")
    }

     if(type !== 'Line'){
        if(current_layers[layer_name].colors_breaks == undefined && renderer != "Categorical"){
            if(current_layers[layer_name].targeted || current_layers[layer_name].is_result){
                let fields = type_col(layer_name, "string");
                let fill_method = popup.append("p").html(i18next.t("app_page.layer_style_popup.fill_color")).insert("select");
                [[i18next.t("app_page.layer_style_popup.single_color"), "single"],
                 [i18next.t("app_page.layer_style_popup.categorical_color"), "categorical"],
                 [i18next.t("app_page.layer_style_popup.random_color"), "random"]].forEach(function(d,i){
                        fill_method.append("option").text(d[0]).attr("value", d[1])  });
                popup.append('div').attrs({id: "fill_color_section"})
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
                popup.append('div').attrs({id: "fill_color_section"})
                make_single_color_menu(layer_name, fill_prev);
            }
        } else if (renderer == "Categorical"){
            let renderer_field = current_layers[layer_name].rendered_field,
                ref_layer_name = current_layers[layer_name].ref_layer_name,
                fields_layer = type_col(ref_layer_name),
                fields_name = Object.getOwnPropertyNames(fields_layer),
                field_to_render;

            var field_selec = popup.append('p').html(i18next.t("app_page.layer_style_popup.field_to_render"))
                                    .insert('select').attr('class', 'params')
                                    .on("change", function(){ field_to_render = this.value; });

            fields_name.forEach(f_name => {
                field_selec.append("option").text(f_name).attr("value", f_name);
            });
            setSelected(field_selec.node(), current_layers[layer_name].rendered_field);
            popup.insert('p').style("margin", "auto").html("")
                .append("button")
                .attr("class", "button_disc")
                .styles({"font-size": "0.8em", "text-align": "center"})
                .html(i18next.t("app_page.layer_style_popup.choose_colors"))
                .on("click", function(){
                    display_categorical_box(ref_layer_name, field_selec.node().value)
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
            var table_layer_name = layer_name;
            if(renderer == "Gridded")
                field_to_discretize = "densitykm";
            else {
                if(renderer == "Choropleth")
                    table_layer_name = current_layers[layer_name].ref_layer_name;
                var fields = type_col(table_layer_name, "number");
                var field_selec_block = popup.append('p').attr("class", "line_elem");
                field_selec_block.append("span").html(i18next.t("app_page.layer_style_popup.field"));
                var field_selec = field_selec_block.insert('select')
                        .attr('class', 'params')
                        .style("float", "right")
                        .on("change", function(){
                            field_to_discretize = this.value;
                        });
                field_to_discretize = fields[0];
                fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
                if(current_layers[layer_name].rendered_field && fields.indexOf(current_layers[layer_name].rendered_field) > -1)
                    setSelected(field_selec.node(), current_layers[layer_name].rendered_field)
            }
             popup.append('p').style("margin", "auto").style("text-align", "center")
                .append("button")
                .attr("class", "button_disc")
                .html(i18next.t("app_page.layer_style_popup.choose_discretization"))
                .on("click", function(){
                    display_discretization(table_layer_name,
                                           field_to_discretize,
                                           current_layers[layer_name].colors_breaks.length,
                                           "quantiles",
                                           current_layers[layer_name].options_disc)
                        .then(function(confirmed){
                            if(confirmed){
                                rendering_params = {
                                    nb_class: confirmed[0],
                                    type: confirmed[1],
                                    breaks: confirmed[2],
                                    colors:confirmed[3],
                                    colorsByFeature: confirmed[4],
                                    schema: confirmed[5],
                                    no_data: confirmed[6],
                                    renderer:"Choropleth",
                                    field: field_to_discretize
                                };
                                let opacity_val = fill_opacity_section ? +fill_opacity_section.node().value : 0.9
                                selection.transition()
                                        .style('fill-opacity', 0.9)
                                        .style("fill", (d,i) => rendering_params.colorsByFeature[i]);
                            }
                        });
                });
         } else if (renderer == "Stewart"){
            let field_to_colorize = "min",
                nb_ft = current_layers[layer_name].n_features;
            var prev_palette = cloneObj(current_layers[layer_name].color_palette);
            rendering_params = {breaks: [].concat(current_layers[layer_name].colors_breaks)};

            var recolor_stewart = function(coloramp_name, reversed){
                let new_coloramp = getColorBrewerArray(nb_ft, coloramp_name);
                if(reversed) new_coloramp.reverse();
                for(let i=0; i < nb_ft; ++i)
                    rendering_params.breaks[i][1] = new_coloramp[i];
                selection.transition().style("fill", (d,i) => new_coloramp[i] );
                current_layers[layer_name].color_palette = {name: coloramp_name, reversed: reversed};
            }

            var color_palette_section = popup.insert("p").attr("class", "line_elem");
            color_palette_section.append("span").html(i18next.t("app_page.layer_style_popup.color_palette"));
            let seq_color_select = color_palette_section.insert("select")
                                        .attr("id", "coloramp_params")
                                        .on("change", function(){
                                            recolor_stewart(this.value, false);
                                         });

            ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn',
             'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(name => {
                seq_color_select.append("option").text(name).attr("value", name);
            });
            seq_color_select.node().value = prev_palette.name;

            var button_reverse = popup.insert("button")
                                    .styles({"display": "inline", "margin-left": "10px"})
                                    .attrs({"class": "button_st3", "id": "reverse_colramp"})
                                    .html(i18next.t("app_page.layer_style_popup.reverse_palette"))
                                    .on("click", function(){
                                        let pal_name = document.getElementById("coloramp_params").value;
                                        recolor_stewart(pal_name, true);
                                     });
         }
         let fill_opacity_section = popup.append('p').attr("class", "line_elem");
         fill_opacity_section.append("span")
                        .html(i18next.t("app_page.layer_style_popup.fill_opacity"))
         fill_opacity_section.insert('input')
                        .attrs({type: "range", min: 0, max: 1, step: 0.1, value: opacity})
                        .styles({"width": "70px", "vertical-align": "middle", "display": "inline", "float": "right",  "margin-right": "0px"})
                        .on('change', function(){
                          selection.style('fill-opacity', this.value)
                          fill_opacity_section.select("#fill_opacity_txt").html((+this.value * 100) + "%")
                        });
        fill_opacity_section.append("span")
                        .style("float", "right")
                        .attr("id", "fill_opacity_txt")
                        .html((+opacity * 100) + "%");
    } else if (type === "Line" && renderer == "Links"){
        var prev_min_display = current_layers[layer_name].min_display || 0;
        let max_val = 0,
            previous_stroke_opacity = selection.style("stroke-opacity");
        selection.each(function(d){if(d.properties.fij > max_val) max_val = d.properties.fij;})
        let threshold_section = popup.append('p').attr("class", "line_elem");
        threshold_section.append("span").html(i18next.t("app_page.layer_style_popup.display_flow_larger"));
        // The legend will be updated in order to start on the minimum value displayed instead of
        //   using the minimum value of the serie (skipping unused class if necessary)
        threshold_section.insert('input')
                    .attrs({type: 'range', min: 0, max: max_val, step: 0.5, value: prev_min_display})
                    .styles({width: "70px", "vertical-align": "middle", "display": "inline", "float": "right",  "margin-right": "0px"})
                    .on("change", function(){
                        lgd_to_change = true;
                        let val = +this.value;
                        popup.select("#larger_than").html(["<i> ", val, " </i>"].join(''));
                        selection.style("display", d => (+d.properties.fij > val) ? null : "none");
                        current_layers[layer_name].min_display = val;
                    });
        threshold_section.insert('label')
                .attr("id", "larger_than")
                .style("float", "right")
                .html(["<i> ", prev_min_display, " </i>"].join(''));
        popup.append("button")
                .attr("class", "button_disc")
                .html(i18next.t("app_page.layer_style_popup.modify_size_class"))
                .on("click", function(){
                    display_discretization_links_discont(layer_name,
                                                         current_layers[layer_name].rendered_field,
                                                         current_layers[layer_name].breaks.length,
                                                         "user_defined")
                        .then(function(result){
                            if(result){
                                lgd_to_change = true;
                                let serie = result[0];
                                serie.setClassManually(result[2]);
                                let sizes = result[1].map(ft => ft[1]);
                                let links_byId = current_layers[layer_name].linksbyId;
                                current_layers[layer_name].breaks = result[1];
                                for(let i = 0; i < nb_ft; ++i){
                                    links_byId[i][2] = sizes[serie.getClass(+links_byId[i][1])];
                                }
                                console.log(links_byId);
                                selection.style('fill-opacity', 0)
                                        .style("stroke-width", (d,i) => {return links_byId[i][2]});
                            }
                        });
                });
     } else if (type === "Line" && renderer == "DiscLayer"){
        var prev_min_display = current_layers[layer_name].min_display || 0;
        let max_val = Math.max.apply(null, result_data[layer_name].map( i => i.disc_value));
        let disc_part = popup.append("p").attr("class", "line_elem");
        disc_part.append("span").html(i18next.t("app_page.layer_style_popup.discont_threshold"));
        disc_part.insert("input")
                .attrs({type: "range", min: 0, max: 1, step: 0.1, value: prev_min_display})
                .styles({width: "70px", "vertical-align": "middle", "display": "inline", "float": "right", "margin-right": "0px"})
                .on("change", function(){
                    lgd_to_change = true;
                    let val = +this.value;
                    let lim = val != 0 ? val * current_layers[layer_name].n_features : -1;
                    popup.select("#discont_threshold").html(["<i> ", val, " </i>"].join(''));
                    selection.style("display", (d,i) => i <= lim ? null : "none" );
                    current_layers[layer_name].min_display = val;
                });

        popup.append("button")
                .attr("class", "button_disc")
                .html(i18next.t("app_page.layer_style_popup.choose_discretization"))
                .on("click", function(){
                    display_discretization_links_discont(layer_name,
                                                         "disc_value",
                                                         current_layers[layer_name].breaks.length,
                                                         "user_defined")
                        .then(function(result){
                            if(result){
                                lgd_to_change = true;
                                let serie = result[0];
                                serie.setClassManually(result[2]);
                                let sizes = result[1].map(ft => ft[1]);
                                current_layers[layer_name].breaks = result[1];
                                current_layers[layer_name].size = [sizes[0], sizes[sizes.length - 1]];
                                selection.style('fill-opacity', 0)
                                        .style("stroke-width", (d,i) => sizes[serie.getClass(+d.properties.disc_value)]);
                            }
                        });
                });
    }
    let c_section = popup.append('p').attr("class", "line_elem");
    c_section.insert("span")
                .html(type === 'Line' ? i18next.t("app_page.layer_style_popup.color") : i18next.t("app_page.layer_style_popup.border_color"));
    c_section.insert('input')
                .attrs({type: "color", value: stroke_prev})
                .style("float", "right")
                .on('change', function(){
                    lgd_to_change = true;
                    selection.style("stroke", this.value);
                    current_layers[layer_name].fill_color.single = this.value;
                    });

    let opacity_section = popup.append('p').attr("class", "line_elem");
    opacity_section.insert("span")
            .html(type === 'Line' ? i18next.t("app_page.layer_style_popup.opacity") : i18next.t("app_page.layer_style_popup.border_opacity"));
    opacity_section.insert('input')
            .attrs({type: "range", min: 0, max: 1, step: 0.1, value: border_opacity})
            .styles({"width": "70px", "vertical-align": "middle", "display": "inline", "float": "right"})
            .on('change', function(){
                opacity_section.select("#opacity_val_txt").html(" " + this.value);
//                        if(this.value !== "0" || type === 'Line'){
                selection.style('stroke-opacity', this.value);
//                        } else {
//                            map.select(g_lyr_name).style("stroke-width", 0.2 + "px");
//                            selection.style('stroke-opacity', function(){ return this.style.fillOpacity; })
//                                     .style('stroke', function(){ return this.style.fill; });
//                        }
            });

    opacity_section.append("span").attr("id", "opacity_val_txt")
         .style("display", "inline").style("float", "right")
         .html(" " + border_opacity);

    if(renderer != "DiscLayer" && renderer != "Links"){
        let width_section = popup.append('p');
         width_section.append("span")
                .html(type === 'Line' ? i18next.t("app_page.layer_style_popup.width") : i18next.t("app_page.layer_style_popup.border_width"));
         width_section
              .insert('input')
              .attrs({type: "number", min: 0, step: 0.1, value: stroke_width})
              .styles({"width": "70px", "float": "right"})
              .on('change', function(){
                    let val = +this.value;
//                                if(val != 0 || type === 'Line'){
                    let zoom_scale = +d3.zoomTransform(map.node()).k;
                    map.select(g_lyr_name).style("stroke-width", (val / zoom_scale) + "px");
                    current_layers[layer_name]['stroke-width-const'] = val;
//                                } else {
//                                    map.select(g_lyr_name).style("stroke-width", 0.2 + "px");
//                                    selection.style('stroke-opacity', function(){ return this.style.fillOpacity; })
//                                             .style('stroke', function(){ return this.style.fill; });
//                                }
                  });
    }

    let _fields = get_fields_name(layer_name);
    if(_fields && _fields.length > 0){
      let labels_section = popup.append("p");
      let input_fields = {};
      for(let i = 0; i < _fields.length; i++){
        input_fields[_fields[i]] = _fields[i];
      }
      labels_section.append("span")
            .attr("id", "generate_labels")
            .styles({"cursor": "pointer", "margin-top": "15px"})
            .html(i18next.t("app_page.layer_style_popup.generate_labels"))
            .on("mouseover", function(){
              this.style.fontWeight = "bold"
            })
            .on("mouseout", function(){
              this.style.fontWeight = "";
            })
            .on("click", function(){
              let fields =
              swal({
                  title: "",
                  text: i18next.t("app_page.layer_style_popup.field_label"),
                  type: "question",
                  showCancelButton: true,
                  showCloseButton: false,
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                  confirmButtonColor: "#DD6B55",
                  confirmButtonText: i18next.t("app_page.common.confirm"),
                  input: 'select',
                  inputPlaceholder: i18next.t("app_page.common.field"),
                  inputOptions: input_fields,
                  inputValidator: function(value) {
                      return new Promise(function(resolve, reject){
                          console.log(value)
                          if(_fields.indexOf(value) < 0){
                              reject(i18next.t("app_page.common.no_value"));
                          } else {
                            let options_labels = {
                              label_field: value,
                              color: "#000",
                              font: "Arial,Helvetica,sans-serif",
                              ref_font_size: 12,
                              uo_layer_name: ["Labels", value, layer_name].join('_')
                            };
                            resolve();
                            render_label(layer_name, options_labels);
                          }
                      });
                  }
                }).then( value => {
                      console.log(value);
                  }, dismiss => {
                      console.log(dismiss);
                  });
            });
    }
}

function get_fields_name(layer_name){
  let elem = document.getElementById(layer_name).childNodes[0];
  if(!elem.__data__ || !elem.__data__.properties){
    return null;
  } else {
    return Object.getOwnPropertyNames(elem.__data__.properties);
  }
}

function createStyleBox_ProbSymbol(layer_name){
    var g_lyr_name = "#" + layer_name,
        ref_layer_name = current_layers[layer_name].ref_layer_name,
        type_method = current_layers[layer_name].renderer,
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
        abs = Math.abs,
        comp = function(a, b){return abs(b)-abs(a)};
    for(let i = 0, i_len = user_data[ref_layer_name].length; i < i_len; ++i)
        d_values.push(+user_data[ref_layer_name][i][field_used]);
    d_values.sort(comp);

    let redraw_prop_val = function(prop_values){
        let selec = selection._groups[0];

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
    else if(current_layers[layer_name].break_val != undefined)
        prev_col_breaks = current_layers[layer_name].break_val;

    if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
    if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

    make_confirm_dialog2("styleBox", layer_name, {top: true, widthFitContent: true, draggable: true})
        .then(function(confirmed){
            if(confirmed){
                if(current_layers[layer_name].size != old_size){
                    let lgd_prop_symb = document.querySelector(["#legend_root2.lgdf_", layer_name].join(''));
                    if(lgd_prop_symb){ redraw_legends_symbols(lgd_prop_symb); }
                }

                if(type_method == "PropSymbolsChoro"){
                    console.log(rendering_params.breaks)
                    current_layers[layer_name].fill_color = {"class": [].concat(rendering_params.colorsByFeature) };
                    current_layers[layer_name].colors_breaks = [];
                    for(let i = rendering_params['breaks'].length-1; i > 0; --i){
                        current_layers[layer_name].colors_breaks.push([
                            [rendering_params['breaks'][i-1], " - ", rendering_params['breaks'][i]].join(''),
                            rendering_params['colors'][i-1]
                            ]);
                    }
                    current_layers[layer_name].rendered_field2 = rendering_params.field;
                    // Also change the legend if there is one displayed :
                    let lgd_choro = document.querySelector(["#legend_root.lgdf_", layer_name].join(''));
                    if(lgd_choro){
                        let transform_param = lgd_choro.getAttribute("transform"),
                            lgd_title = lgd_choro.querySelector("#legendtitle").innerHTML,
                            lgd_subtitle = lgd_choro.querySelector("#legendsubtitle").innerHTML,
                            boxgap = lgd_choro.getAttribute("boxgap");
                        lgd_choro.remove();
                        createLegend_choro(layer_name, rendering_params.field, lgd_title, lgd_subtitle, boxgap);
                        lgd_choro = document.querySelector(["#legend_root.lgdf_", layer_name].join(''));
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
                             .style('stroke-opacity', previous_stroke_opacity)
                             .style('stroke', stroke_prev);
                } else if(fill_meth == "two") {
                    current_layers[layer_name].break_val = prev_col_breaks;
                    current_layers[layer_name].fill_color = {"two": [fill_prev.two[0], fill_prev.two[1]]};
                    selection.style('fill', (d,i) => d_values[i] > prev_col_breaks ? fill_prev.two[1] : fill_prev.two[0])
                             .style('stroke-opacity', previous_stroke_opacity)
                             .style('stroke', stroke_prev);
                } else if(fill_meth == "class") {
                    selection.style('fill-opacity', opacity)
                           .style("fill", function(d, i){ return current_layers[layer_name].fill_color.class[i] })
                           .style('stroke-opacity', previous_stroke_opacity)
                           .style("stroke", stroke_prev);
                    current_layers[layer_name].colors_breaks = prev_col_breaks;
                } else if(fill_meth == "random"){
                    selection.style('fill', function(){return Colors.name[Colors.random()];})
                             .style('stroke-opacity', previous_stroke_opacity)
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

    var popup = d3.select(".styleBox").select(".modal-body").style("width", "295px");;
    popup.append("p")
            .styles({"text-align": "center", "color": "grey"})
            .html([i18next.t("app_page.layer_style_popup.rendered_field", {field: current_layers[layer_name].rendered_field}),
                   i18next.t("app_page.layer_style_popup.reference_layer", {layer: ref_layer_name})].join(''));
    if(type_method === "PropSymbolsChoro"){
        let field_color = current_layers[layer_name].rendered_field2;
         popup.append('p').style("margin", "auto").html(i18next.t("app_page.layer_style_popup.field_symbol_color", {field: field_color}))
            .append("button").attr("class", "button_disc").html(i18next.t("app_page.layer_style_popup.choose_discretization"))
            .on("click", function(){
                display_discretization(ref_layer_name,
                                       field_color,
                                       current_layers[layer_name].colors_breaks.length,
                                       "quantiles",
                                       current_layers[layer_name].options_disc)
                  .then(function(confirmed){
                    if(confirmed){
                        rendering_params = {
                            nb_class: confirmed[0], type: confirmed[1],
                            breaks: confirmed[2], colors:confirmed[3],
                            colorsByFeature: confirmed[4],
                            renderer:"PropSymbolsChoro",
                            field: field_color
                            };
                        console.log(rendering_params)
                        let features = current_layers[layer_name].features_order;
                        selection.style('fill-opacity', 0.9)
                                 .style("fill", (d,i) => rendering_params.colorsByFeature[+features[i][0]]);
                    }
                });
        });
    } else if(current_layers[layer_name].break_val != undefined){
        let fill_color_section = popup.append('div').attr("id", "fill_color_section");
        fill_color_section.append("p")
                    .style("text-align", "center")
                    .html(i18next.t("app_page.layer_style_popup.color_break"));
        var p2 = fill_color_section.append("p").style("display", "inline");
        var col1 = p2.insert("input").attr("type", "color")
                            .attr("id", "col1")
                            .attr("value", current_layers[layer_name].fill_color.two[0])
                            .on("change", function(){
                                let new_break_val = +b_val.node().value;
                                current_layers[layer_name].fill_color.two[0] = this.value;
                                selection.transition().style("fill", (d,i) => (d_values[i] > new_break_val) ? col2.node().value : this.value);
                            });
        var col2 = p2.insert("input").attr("type", "color")
                            .attr("id", "col2")
                            .attr("value", current_layers[layer_name].fill_color.two[1])
                            .on("change", function(){
                                let new_break_val = +b_val.node().value;
                                current_layers[layer_name].fill_color.two[1] = this.value;
                                selection.transition().style("fill", (d,i) => (d_values[i] > new_break_val) ? this.value : col1.node().value);

                            });
        fill_color_section.insert("span").html(i18next.t("app_page.layer_style_popup.break_value"));
        var b_val = fill_color_section.insert("input")
                            .attrs({type: "number", value: current_layers[layer_name].break_val})
                            .style("width", "75px")
                            .on("change", function(){
                                let new_break_val = +this.value;
                                current_layers[layer_name].break_val = new_break_val;
                                selection.transition().style("fill", (d,i) => (d_values[i] > new_break_val) ? col2.node().value : col1.node().value);
                            });
    } else {
        let fields = type_col(ref_layer_name, "string"),
            fill_method = popup.append("p").html(i18next.t("app_page.layer_style_popup.fill_color")).insert("select");

        [[i18next.t("app_page.layer_style_popup.single_color"), "single"],
         [i18next.t("app_page.layer_style_popup.categorical_color"), "categorical"],
         [i18next.t("app_page.layer_style_popup.random_color"), "random"]]
            .forEach(function(d,i){
                fill_method.append("option").text(d[0]).attr("value", d[1])
            });
        popup.append('div').attr("id", "fill_color_section")
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

    let fill_opct_section = popup.append('p').attr("class", "line_elem")
    fill_opct_section.append("span").html(i18next.t("app_page.layer_style_popup.fill_opacity"));

    fill_opct_section.append("span")
          .attr("id", "fill_opacity_txt")
          .style("float", "right")
          .html((+opacity * 100) + "%");

    fill_opct_section
          .insert('input')
          .attrs({type: "range", min: 0, max: 1, step: 0.1, value: opacity})
          .styles({width: "70px", "vertical-align": "middle", "display": "inline", "float": "right"})
          .on('change', function(){
            selection.style('fill-opacity', this.value);
            fill_opct_section.select("#fill_opacity_txt").html((+this.value * 100) + "%");
          });

    let border_color_section = popup.append('p').attr("class", "line_elem");
    border_color_section.append("span").html(i18next.t("app_page.layer_style_popup.border_color"));
    border_color_section.insert('input')
          .attrs({type: "color", "value": stroke_prev})
          .style("float", "right")
          .on('change', function(){
            selection.transition().style("stroke", this.value);
          });

    let border_opacity_section = popup.append('p')
    border_opacity_section.append("span").html(i18next.t("app_page.layer_style_popup.border_opacity"));
    border_opacity_section.append("span")
          .attr("id", "border_opacity_txt")
          .style("float", "right")
          .html((+border_opacity * 100) + "%");

    border_opacity_section.insert('input')
          .attrs({type: "range", min: 0, max: 1, step: 0.1, value: border_opacity})
          .styles({width: "70px", "vertical-align": "middle", "display": "inline", float: "right"})
          .on('change', function(){
            selection.style('stroke-opacity', this.value);
            border_opacity_section.select("#border_opacity_txt").html((+this.value * 100) + "%");
          });

    let border_width_section = popup.append('p').attr("class", "line_elem");
    border_width_section.append("span").html(i18next.t("app_page.layer_style_popup.border_width"));
    border_width_section.insert('input')
          .attrs({type: "number", min: 0, step: 0.1, value: stroke_width})
          .styles({width: "70px", float: "right"})
          .on('change', function(){
                selection.style("stroke-width", this.value+"px");
                current_layers[layer_name]['stroke-width-const'] = +this.value
            });

    let prop_val_content = popup.append("p");
    prop_val_content.append("p").html([
        i18next.t("app_page.layer_style_popup.field_symbol_size", {field: field_used}),
        i18next.t("app_page.layer_style_popup.symbol_fixed_size")].join(''));

    prop_val_content.append("span")
          .style("float", "right")
          .html(' px');
    prop_val_content.insert('input')
          .styles({width: "50px", float: "right"})
          .attrs({type: "number", id: "max_size_range", min: 0.1, max: 40, step: "any", value: current_layers[layer_name].size[1]})
          .on("change", function(){
              let f_size = +this.value,
                  prop_values = prop_sizer3_e(d_values, current_layers[layer_name].size[0], f_size, type_symbol);
              current_layers[layer_name].size[1] = f_size;
              redraw_prop_val(prop_values);
          });

    let prop_val_content2 = popup.append("p").attr("class", "line_elem");
    prop_val_content2.append("span").html(i18next.t("app_page.layer_style_popup.on_value"));
    prop_val_content2.insert("input")
        .styles({width: "100px", float: "right"})
        .attrs({type: "number", min: 0.1, step: 0.1, value: +current_layers[layer_name].size[0]})
        .on("change", function(){
            let f_val = +this.value,
                prop_values = prop_sizer3_e(d_values, f_val, current_layers[layer_name].size[1], type_symbol);
            redraw_prop_val(prop_values);
            current_layers[layer_name].size[0] = f_val;
        });
}

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
//}

/**
* Return the id of a gaussian blur filter with the desired size (stdDeviation attribute)
* if one with the same param already exists, its id is returned,
* otherwise a new one is created, and its id is returned
*/
var getBlurFilter = (function(size){
    var count = 0;
    return function(size) {
        let filters = svg_map.querySelector("filters");
        if(!filters){
            filters = document.createElement("filters");
            svg_map.insertBefore(filters, svg_map.querySelector("defs"));
        }
        let blur_filts = filters.querySelectorAll(".blur");
        let blur_filt_to_use;
        for(let i=0; i < blur_filts.length; i++){
            if(blur_filts[i].querySelector("feGaussianBlur").getAttribute("stdDeviation") == size){
                blur_filt_to_use = blur_filts[i];
            }
        }
        if(!blur_filt_to_use){
            count = count + 1;
            blur_filt_to_use = document.createElementNS("http://www.w3.org/2000/svg", "filter");
            blur_filt_to_use.setAttribute("id","blurfilt" + count);
            blur_filt_to_use.setAttribute("class", "blur");
            var gaussianFilter = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
            gaussianFilter.setAttribute("in", "SourceGraphic");
            gaussianFilter.setAttribute("stdDeviation", size);
            blur_filt_to_use.appendChild(gaussianFilter);
            filters.appendChild(blur_filt_to_use);
        }
        return blur_filt_to_use.id;
    };
})();
