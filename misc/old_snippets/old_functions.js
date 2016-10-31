/// Old MTA function :

var fields_MTA = {
    fill: function(layer){
        if(!layer) return;
        d3.selectAll(".params").attr("disabled", null);
        let fields = type_col(layer, "number"),
            fields_all = Object.getOwnPropertyNames(user_data[layer][0]),
            nb_features = user_data[layer].length,
            field1_selec = d3.select("#MTA_field_1"),
            field2_selec = d3.select("#MTA_field_2"),
            field_key_agg = d3.select("#MTA_field_key_agg");

            fields.forEach(function(field){
                field1_selec.append("option").text(field).attr("value", field);
                field2_selec.append("option").text(field).attr("value", field);
            });
            fields_all.forEach(function(field){
                field_key_agg.append("option").text(field).attr("value", field);
            });


    },
    unfill: function(){
        let field1_selec = document.getElementById("MTA_field_1"),
            field2_selec = document.getElementById("MTA_field_2"),
            field_key_agg = document.getElementById("MTA_field_key_agg");

        for(let i = field1_selec.childElementCount - 1; i > -1; i--){
            field1_selec.removeChild(field1_selec.children[i]);
            field2_selec.removeChild(field2_selec.children[i]);
        }

        unfillSelectInput(field_key_agg);
        d3.selectAll(".params").attr("disabled", true);
    }
};


function fillMenu_MTA(){
    var prepare_mta = function(choosen_method, var1_name, var2_name, layer, nb_features){
        var table_to_send = {},
            object_to_send = {};
        if (choosen_method != "local_dev"){
            table_to_send[var1_name] = [];
            table_to_send[var2_name] = [];
            for(let i=0; i<nb_features; i++){
                table_to_send[var1_name].push(+user_data[layer][i][var1_name]);
                table_to_send[var2_name].push(+user_data[layer][i][var2_name]);
            }
            object_to_send["method"] = choosen_method;
            if(choosen_method == "territorial_dev"){
                let key_name = field_key_agg.node().value;
                table_to_send[key_name] = user_data[layer].map(i => i[key_name]);
                object_to_send["key_field_name"] = key_name;
            } else if(choosen_method == "general_dev"){
                object_to_send["ref_value"] = +ref_ratio.node().value;
            }
            object_to_send["table"] = table_to_send;
            object_to_send["var1_name"] = var1_name;
            object_to_send["var2_name"] = var2_name;

        } else if (choosen_method == "local_dev"){
            let val = +val_param_general_dev.node().value,
                param_name = param_general_dev.node().value == "dist" ? "dist" : "order",
                val1_to_send = {},
                val2_to_send = {};

            if(current_layers[layer].original_fields.has(var1_name))
                val1_to_send[var1_name] = [];
            else
                val1_to_send[var1_name] = user_data[layer].map(i => +i[var1_name]);

            if(current_layers[layer].original_fields.has(var2_name))
                val2_to_send[var2_name] = [];
            else
                val2_to_send[var2_name] = user_data[layer].map(i => +i[var2_name]);

            object_to_send["topojson"] = current_layers[layer].key_name;
            object_to_send["var1"] = JSON.stringify(val1_to_send);
            object_to_send["var2"] = JSON.stringify(val2_to_send);
            object_to_send["order"] = (param_name == "order") ? val : null;
            object_to_send["dist"] = (param_name == "dist") ? val : null;
        }
        return object_to_send;
    }

    var MTA_methods = [["General Deviation", "general_dev"],
                       ["Territorial deviation", "territorial_dev"],
                       ["Local deviation", "local_dev"]];

    var dv2 = section2.append("p").attr("class", "form-rendering");

    var method_selec = dv2.append("p").style("margin", "auto").html("Analysis method")
                            .insert("select").attr("class", "params");
    MTA_methods.forEach(method => { method_selec.append("option").text(method[0]).attr("value", method[1]) });
    // TODO : (de)activate the appropriates options according to the selected method (key / ref / etc.)
    var field1_selec = dv2.append("p").html("First field :")
                            .insert("select").attr("class", "params").attr("id", "MTA_field_1");
    var field2_selec = dv2.append("p").html("Second field :")
                            .insert("select").attr("class", "params").attr("id", "MTA_field_2");
    var field_key_agg = dv2.append("p").html("Aggregation key field :")
                            .insert("select").attr("class", "params").attr("id", "MTA_field_key_agg").attr("disabled", true);
    var ref_ratio = dv2.append("p").html("Reference ratio :")
                            .insert("input").attrs({type: "number", min: 0, max: 10000000, step: 0.1});
    var type_deviation = dv2.append("p").html("Type of deviation")
                            .insert("select").attr("class", "params");
    [["Relative deviation", "rel"],
     ["Absolute deviation", "abs"],
     ["Compute both", "both"]].forEach(type_dev => {
        type_deviation.append("option").text(type_dev[0]).attr("value", type_dev[1]) });

    var a = dv2.append('div').style("margin-bottom", "15px");

    var param_general_dev = a.insert("select")
                                .styles({"background-color": "#e5e5e5", "border-color": "transparent"})
                                .attr("class", "params")
                                .attr("disabled", true);

    [["Distance defining the contiguity", "dist"],
     ["Contiguity order", "order"]].forEach( param => {
            param_general_dev.append("option").text(param[0]).attr("value", param[1])  });

    var val_param_general_dev = a.insert('input')
                                    .style("width", "85px")
                                    .attrs({type: "number", min: 0, max:1000000, step:1})
                                    .attr("disabled", true);

    // Each MTA method (global/local/medium) is associated with some
    // specific arguments to enable/disabled accordingly
    method_selec.on("change", function(){
        if(this.value == "general_dev"){
            ref_ratio.attr("disabled", null);
            field_key_agg.attr("disabled", true);
            param_general_dev.attr("disabled", true);
            val_param_general_dev.attr("disabled", true);
        } else if(this.value == "territorial_dev"){
            ref_ratio.attr("disabled", true);
            field_key_agg.attr("disabled", null);
            param_general_dev.attr("disabled", true);
            val_param_general_dev.attr("disabled", true);
        } else if(this.value == "local_dev"){
            ref_ratio.attr("disabled", true);
            field_key_agg.attr("disabled", true);
            param_general_dev.attr("disabled", null);
            val_param_general_dev.attr("disabled", null);
        }
    });

    // TODO : check that fields are correctly filled before trying to prepare the query
    // ... and only enable the "compute" button when they are
    var ok_button = dv2.insert("p").styles({"text-align": "right", margin: "auto"})
                        .append("button")
                        .attr("value", "yes")
                        .attr("id", "yes")
                        .attr("class", "params button_st3")
                        .html(i18next.t("Compute and render"));


    // Where the real job is done :
    ok_button.on("click", function(){
        let choosen_method = method_selec.node().value,
            var1_name = field1_selec.node().value,
            var2_name = field2_selec.node().value,
            formToSend = new FormData(),
            layer = Object.getOwnPropertyNames(user_data)[0],
            nb_features = user_data[layer].length,
            opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_features)),
            object_to_send = prepare_mta(choosen_method, var1_name, var2_name, layer, nb_features),
            target_url = (choosen_method == "local_dev") ? "/R_compute/MTA_geo" : "/R_compute/MTA_d",
            type_dev = type_deviation.node().value;

        if(type_dev != "both"){
            object_to_send["type_dev"] = type_dev;
            formToSend.append("json", JSON.stringify(object_to_send))
            $.ajax({
                processData: false,
                contentType: false,
                url: target_url,
                data: formToSend,
                type: 'POST',
                error: function(error) { display_error_during_computation(); console.log(error); },
                success: function(data){
                    current_layers[layer].is_result = true;
                    let result_values = JSON.parse(data),
                        type_dev = (type_deviation.node().value == "abs") ? "AbsoluteDeviation" : "RelativeDeviation";

                    if(result_values.values){
                        let field_name = [choosen_method, type_dev, var1_name, var2_name].join('_');
                        for(let i=0; i<nb_features; ++i)
                            user_data[layer][i][field_name] = result_values.values[i];
                        if(type_dev == "RelativeDeviation"){
                            let lyr_name_to_add = check_layer_name([layer, "MTA", type_dev, field_name].join('_'));
                            let disc_result = discretize_to_colors(result_values.values, "Quantiles", opt_nb_class, "Reds");
                            let rendering_params = {
                                nb_class: opt_nb_class,
                                type: "Quantiles",
                                breaks: disc_result[2],
                                colors: disc_result[3],
                                colorsByFeature: disc_result[4],
                                renderer:  ["Choropleth", "MTA", choosen_method].join('_'),
                                rendered_field: field_name,
                                new_name: lyr_name_to_add
                                    };
                            render_choro(layer, rendering_params);
                            current_layers[lyr_name_to_add].colors_breaks = disc_result[2];
                            current_layers[lyr_name_to_add].renderer = ["MTA", type_dev].join('_');
                            current_layers[lyr_name_to_add].rendered_field = field_name;
                        } else if (type_dev == "AbsoluteDeviation"){
                            let new_lyr_name = check_layer_name(["MTA", "AbsoluteDev", var1_name, var2_name].join('_')),
                                rand_color = Colors.random(),
                                rendering_params = {
                                    new_name: new_lyr_name,
                                    field: field_name,
                                    nb_features: nb_features,
                                    ref_layer_name: layer,
                                    symbol: "circle",
                                    max_size: 22,
                                    ref_size: 0.1,
                                    fill_color: rand_color,
                                    values_to_use: result_values.values
                                    };
                            make_prop_symbols(rendering_params);
                            current_layers[new_lyr_name].renderer = "PropSymbols_MTA";
                            zoom_without_redraw();
                            switch_accordion_section();
                        }
                    } else if(result_values.Error){
                        alert(result_values.Error);
                        return;
                    }
                }
            });
        } else if (type_dev == "both"){
            object_to_send["type_dev"] = "abs";
            formToSend.append("json", JSON.stringify(object_to_send));
            $.ajax({
                processData: false,
                contentType: false,
                url: target_url,
                data: formToSend,
                type: 'POST',
                error: function(error) { display_error_during_computation(); console.log(error); },
                success: function(data){
                    let result_values_abs = JSON.parse(data);
                    if(result_values_abs.values){
                        var field_name2 = [choosen_method, "AbsoluteDeviation", var1_name, var2_name].join('_');
                        for(let i=0; i<nb_features; ++i)
                            user_data[layer][i][field_name2] = +result_values_abs.values[i];
                    } else if (result_values.Error){
                        alert(result_values.Error);
                        return;
                    }
                    object_to_send["type_dev"] = "rel";
                    formToSend = new FormData();
                    formToSend.append("json", JSON.stringify(object_to_send));
                    $.ajax({
                        processData: false,
                        contentType: false,
                        url: target_url,
                        data: formToSend,
                        type: 'POST',
                        error: function(error) { display_error_during_computation(); console.log(error); },
                        success: function(data2){
                            let result_values_rel = JSON.parse(data2),
                                disc_result;
                            if(result_values_rel.values){
                                let field_name1 = [choosen_method, "RelativeDeviation", var1_name, var2_name].join('_'),
                                    new_lyr_name = check_layer_name(["MTA", var1_name, var2_name].join('_'));
                                for(let i=0; i<nb_features; ++i)
                                    user_data[layer][i][field_name1] = +result_values_rel.values[i];
                                while(true){
                                    let disc_meth = "Quantiles";
                                    disc_result = discretize_to_colors(result_values_rel.values, disc_meth, opt_nb_class + 1, "Reds");
                                    if(disc_result) break;
                                    else {
                                        disc_meth = "Jenks";
                                        disc_result = discretize_to_colors(result_values_rel.values, disc_meth, opt_nb_class + 1, "Reds");
                                    }
                                    if(disc_result) break;
                                    opt_nb_class = opt_nb_class - 1;
                                }
                                console.log(disc_result)
                                let rendering_params = {
                                        new_name: new_lyr_name,
                                        field: field_name2,
                                        nb_features: nb_features,
                                        ref_layer_name: layer,
                                        symbol: "circle",
                                        max_size: 22,
                                        ref_size: 0.1,
                                        fill_color: disc_result[4],
                                        values_to_use: result_values_abs.values.concat([])
                                        };
                                make_prop_symbols(rendering_params);
                                let col_breaks = [];
                                for(let i = 0, len_i = disc_result[2].length - 1; i < len_i; ++i)
                                    col_breaks.push([[disc_result[2][i], disc_result[2][i+1]].join(' - '), disc_result[3][i]])
                                current_layers[new_lyr_name].colors_breaks = col_breaks;
                                current_layers[new_lyr_name].fill_color = {class: current_layers[new_lyr_name].features_order.map(obj => obj[3])}
                                current_layers[new_lyr_name].renderer = "PropSymbolsChoro_MTA";
                                current_layers[new_lyr_name].rendered_field2 = field_name1;
                                switch_accordion_section();

                            } else if (result_values.Error){
                                alert(result_values.Error);
                                return;
                            }
                        }
                    });
                }
            });
        }
    });
}


////
// Old zooming functions - too use when redrawing on zooming
/////
function redraw(sc, tr) {
  sc = sc || d3.event.scale;
  tr  = tr || d3.event.translate;
  let tx = t[0] * sc + tr[0],
      ty = t[1] * sc + tr[1];
  proj.translate([tx, ty])
    .scale(s * sc);
  map.selectAll(".layer").selectAll("path").attr("d", path);
  return [sc, tr];
}

function interpolateZoom(translate, scale) {
    return d3.transition().duration(225).tween("zoom", function () {
        var iTranslate = d3.interpolate(proj.translate(), translate),
            iScale = d3.interpolate(proj.scale(), scale);
        return function (t) {
            proj.scale(iScale(t)).translate(iTranslate(t));
            zoom.scale(scale/s);
            map.selectAll(".layer").selectAll("path").attr("d", path);
        };
    });
}

function zoomClick() {
    var clicked = d3.event.target,
        direction = 1,
        factor = 0.1,
        target_zoom = 1,
        extent = zoom.scaleExtent(),
        translate = proj.translate(),
        translate0 = [], l = [],
        p_scale = proj.scale();

    d3.event.preventDefault();
    direction = (this.id === 'zoom_in') ? 1 : -1;
    target_zoom = zoom.scale() * (1 + factor * direction);

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(translate[0] - t[0]) / p_scale, (translate[1] - t[1]) / p_scale];
    l = [translate0[0] * p_scale + t[0], translate0[1] * p_scale + t[1]];
    target_zoom = target_zoom * s // 's' is the reference proj.scale

    interpolateZoom(l, target_zoom);
}

function rotate_global(angle){
    d3.selectAll("svg").selectAll("g:not(.legend_feature)")
      .transition()
      .duration(10)
      .attr("transform", canvas_rotation_value);
};

// Function triggered each 5 minutes and when a major modification (like style modification on a layer)
// is done in order to keep basic informations about the map properties user (zoom, position, layers & styles, etc.)
function sendPreferences(){
    var json_params = get_map_template(),
        FormToSend = new FormData();
    FormToSend.append("config", json_params)
    $.ajax({
       type: 'POST',
       url: '/save_user_pref',
       processData: false,
       contentType: false,
       data: FormToSend,
       global: false,
       success: function(d) {console.log(d);}
    }); // 'global' is set to false to prevent the ajaxStart event to display the progress bar requested on other ajax calls
}

// Function to display geo coordinates (lat/lon) corrsponding
// to the mouse coordinates on the svg
function log_coordinates(t){
  var coords = d3.mouse(t),
      txt = [],
      zt = zoom.translate(),
      zs = zoom.scale();

  coords = proj.invert([(coords[0]-zt[0])/zs, (coords[1]-zt[1])/zs]);
  if(!coords || isNaN(coords[0]) || isNaN(coords[1])){
      info_coords.node().innerHTML = "";
      return;
  } else {
      if(coords[0]>0) txt.push("E")
      else txt.push("W")

      if(coords[1]>0) txt.push("N")
      else txt.push("S")
      info_coords.node().innerHTML = [txt[0], coords[0].toFixed(6), ' - ', txt[1], coords[1].toFixed(6)].join(' ');
  }
};

// Wrapper to obtain confirmation before actually removing a layer :
function remove_layer(name){
    name = name || this.parentElement.parentElement.getAttribute("layer_name");
    var txt_dialog = "Remove layer '" + name + "' ?";
    make_confirm_dialog(txt_dialog, "Confirm", "Cancel", "Confirm deletion").then(function(confirmed){
        if(confirmed){
            remove_layer_cleanup(name);
        }
    });
}

function path_to_geojson2(id_layer){
    if(id_layer.indexOf('#') != 0)
        id_layer = ["#", id_layer].join('');
    var result_geojson = [];
    d3.select(id_layer)
        .selectAll("path")
        .each(function(d,i){
            result_geojson.push({
                type: "Feature",
                id: i,
                properties: d.properties,
                geometry: d.geometry
            })
        });
    return JSON.stringify({
        type: "FeatureCollection",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: result_geojson
    });
}

function standardize_values(array_values){
    let new_values = [];
    let minV = min_fast(array_values);
    let maxV = max_fast(array_values);
    for(let i=0; i<array_values.length; i++) {
        new_values.push((array_values[i] - minV ) / ( maxV - minV ));
    }
    return new_values;
}

// Function trying to mimic the R "seq" function or the python 2 "range" function
// (ie its not generator based and returns a real array)
let range = function(start = 0, stop, step = 1) {
    let cur = (stop === undefined) ? 0 : start;
    let max = (stop === undefined) ? start : stop;
    let res = [];
    for(let i = cur; step < 0 ? i > max : i < max; i += step)
        res.push(i);
    return res;
}

// Function trying to mimic the python 2 "xrange" / python 3 "range" function
// (ie. its a generator and returns values "on request")
let xrange = function*(start = 0, stop, step = 1) {
    let cur = (stop === undefined) ? 0 : start;
    let max = (stop === undefined) ? start : stop;
    for(let i = cur; step < 0 ? i > max : i < max; i += step)
        yield i;
}

function list_existing_layers_server(){
    $.ajax({
        processData: false,
        contentType: false,
        global: false,
        url: '/layers',
        type: 'GET',
        success: function(data){ console.log(JSON.parse(data)) },
        error: function(error) { console.log(error); }
    });
}

function get_zoom_param(scale){
    let transform = map.select(".layer").attr("transform"),
        zoom_scale = +new RegExp(/scale\(([^)]+)\)/).exec(transform)[1].split(',')[0];
    if(scale) return zoom_scale;
    else {
        let zoom_translate = new RegExp(/translate\(([^)]+)\)/).exec(transform)[1].split(',').map(f => +f);
        return {scale: zoom_scale, translate: zoom_translate}
    }
}
