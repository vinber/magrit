//"use strict";

function get_menu_option(func){
    var menu_option = {
        "stewart":{
            "title":"Stewart potentials",
            "desc":"Compute stewart potentials...",
            "popup_factory": "createFuncOptionsBox_Stewart",
            "text_button": "Choose options and compute..."
            },
        "test":{
            "title":"Explore your dataset",
            "desc":"Explore the dataset provided with the geometry and the joined (.csv) dataset",
            "popup_factory": "boxExplore",
            "text_button": "Browse..."
            },
        "prop_symbol":{
            "title":"Proportional symbols",
            "popup_factory": "createFuncOptionsBox_PropSymbol",
            "desc":"Display proportional symbols with appropriate discretisation on a numerical field of your data",
            "text_button": "Choose options and create..."
            },
        "prop_symbol_choro":{
            "title":"Proportional colored symbols",
            "popup_factory": "createFuncOptionsBox_PropSymbolChoro",
            "desc":"Display proportional symbols and choropleth coloration of the symbols on two numerical fields of your dataset with an appropriate discretisation",
            "text_button": "Choose options and create..."
            },
        "choropleth":{
            "title":"Choropleth map",
            //"popup_factory": "fillMenu_Choropleth",
            "popup_factory": "createFuncOptionsBox_Choropleth",
            "desc":"Render a choropleth map on a numerical field of your data",
            "text_button": "Choose options and render..."
            },
        "choropleth_and_prop_symbol":{
            "title":"Proportional symbols and Choropleth maps",
            "popup_factory": "createFuncOptionsBox_ChoroAndPropSymbol",
            "desc":"Display proportional symbols and choropleth coloration of the symbols on two numerical fields of your dataset with an appropriate discretisation",
            "text_button": "Choose options and create..."
            },
        "cartogram":{
            "title":"Anamorphose map",
            "popup_factory": "createFuncOptionsBox_Anamorphose",
            "desc":"Render a map using an anamorphose algorythm on a numerical field of your data",
            "text_button": "Choose algo, options and render...",
            "add_options": "keep_file"
            },
        "grid_map":{
            "title":"Gridded map",
            "popup_factory": "createBox_griddedMap",
            "desc":"Render a gridded map on a numerical field of your data",
            "text_button": "Choose options and render..."
            },
        "mta":{
            "title":"Multiscalar Territorial Analysis",
            "popup_factory": "createBox_MTA",
            "desc":"Compute and render various methods of multiscalar territorial analysis",
            "text_button": "Choose algo, options and render..."
            },
        "flows_map":{
            "title":"Link/FLow map",
            "popup_factory": "createBox_FlowMap",
            "desc": "Render a map displaying links between features with graduated sizes",
            "text_button": "Choose options and render..."
            }

    };
    return menu_option[func.toLowerCase()] || {}
}

function popup_function(){
    var layer_name = Object.getOwnPropertyNames(user_data);

    if(!(layer_name.length === 1)){
        alert("You shouldn't be able to arrive here")
        return;
    }

    layer_name = layer_name[0].trim();

    var modal = eval([
        get_menu_option(func).popup_factory, "(\"", layer_name, "\")"
            ].join(''));

    if(modal == undefined || modal.style == undefined) return;
    else {
        modal.className += ' active';
        modal.style.position = 'fixed'
        modal.style.zIndex = 1;
        return center(modal);
    }
};

function createFuncOptionsBox_ChoroAndPropSymbol(layer){
    null;
}

function createBox_MTA(layer){
    var prepare_mta = function(choosen_method, var1_name, var2_name){
        var table_to_send = new Object(),
            object_to_send = new Object();
        if (choosen_method != "local_dev"){
            table_to_send[var1_name] = new Array(nb_features);
            table_to_send[var2_name] = new Array(nb_features);
            for(let i=0; i<nb_features; i++){
                table_to_send[var1_name][i] = +user_data[layer][i][var1_name];
                table_to_send[var2_name][i] = +user_data[layer][i][var2_name];
            }
            object_to_send["method"] = choosen_method;
            if(choosen_method == "medium_dev"){
                let key_name = field_key_agg.node().value;
                table_to_send[key_name] = user_data[layer].map(i => i[key_name]);
                object_to_send["key_field_name"] = key_name;
            } else if(choosen_method == "global_dev"){
                object_to_send["ref_value"] = +ref_ratio.node().value;
            }
            object_to_send["table"] = table_to_send;
            object_to_send["var1_name"] = var1_name;
            object_to_send["var2_name"] = var2_name;
        
        } else if (choosen_method == "local_dev"){
            let val = +val_param_global_dev.node().value,
                param_name = param_global_dev.node().value == "dist" ? "dist" : "order";
                val1_to_send = new Object(),
                val2_to_send = new Object();
            val1_to_send[var1_name] = user_data[layer].map(i => +i[var1_name]);
            val2_to_send[var2_name] = user_data[layer].map(i => +i[var2_name]);
            object_to_send["topojson"] = layer;
            object_to_send["var1"] = JSON.stringify(val1_to_send);
            object_to_send["var2"] = JSON.stringify(val2_to_send);
            object_to_send["order"] = (param_name == "order") ? val : null;
            object_to_send["dist"] = (param_name == "dist") ? val : null;
        }
        return object_to_send;
    }

    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer,
        fields = type_col(layer, "number"),
        fields_all = Object.getOwnPropertyNames(user_data[layer][0]),
        nb_features = user_data[layer].length,
        MTA_methods = [["Global Deviation", "global_dev"],
                       ["Medium deviation", "medium_dev"],
                       ["Local deviation", "local_dev"]];

    if(fields.length < 2){
        alert("The targeted layer doesn't seems to contain enough of numerical fields (at least twice are required)");
        return;
    }

     bg.className = 'overlay';
     nwBox.id = [layer, 'MTA_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, 'MTA_popup'].join(''));
    dialog_content.append('h3').html('Multiscalar territorial analysis');
    var method_selec = dialog_content.append("p").html("Analysis method")
                            .insert("select").attr("class", "params");
    MTA_methods.forEach(function(method){ method_selec.append("option").text(method[0]).attr("value", method[1]) });
    // TODO : (de)activate the appropriates options according to the selected method (key / ref / etc.)
    var field1_selec = dialog_content.append("p").html("First field :").insert("select").attr("class", "params");
    fields.forEach(function(field){ field1_selec.append("option").text(field).attr("value", field)});
    var field2_selec = dialog_content.append("p").html("Second field :").insert("select").attr("class", "params");
    fields.forEach(function(field){ field2_selec.append("option").text(field).attr("value", field)});
    var field_key_agg = dialog_content.append("p").html("Aggregation key field :").insert("select").attr("class", "params").attr("disabled", true);
    fields_all.forEach(function(field){ field_key_agg.append("option").text(field).attr("value", field)});
    var ref_ratio = dialog_content.append("p").html("Reference ratio :")
                                    .insert("input").attr({type: "number", min: 0, max: 10000000, step: 0.1}).attr("disabled", true);
    var type_deviation = dialog_content.append("p").html("Type of deviation").insert("select").attr("class", "params");
    [["Relative deviation", "rel"],
     ["Absolute deviation", "abs"],
     ["Compute both", "both"]].forEach(function(type_dev){ type_deviation.append("option").text(type_dev[0]).attr("value", type_dev[1])});

    var a = dialog_content.append('div').style("margin-bottom", "15px");

    var param_global_dev = a.insert("select").attr("class", "params").attr("disabled", true).style({"background-color": "#e5e5e5", "border-color": "transparent"});
    [["Distance defining the contiguity", "dist"],
     ["Contiguity order", "order"]].forEach(function(param){  param_global_dev.append("option").text(param[0]).attr("value", param[1])  });

    var val_param_global_dev = a.insert('input').style("width", "85px").attr({type: "number", min: 0, max:1000000, step:1}).attr("disabled", true);

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length));

    // Each MTA method (global/local/medium) is associated with some 
    // specific arguments to enable/disabled accordingly
    method_selec.on("change", function(){
        if(this.value == "global_dev"){
            ref_ratio.attr("disabled", null);
            field_key_agg.attr("disabled", true);
            param_global_dev.attr("disabled", true);
            val_param_global_dev.attr("disabled", true);
        } else if(this.value == "medium_dev"){
            ref_ratio.attr("disabled", true);
            field_key_agg.attr("disabled", null);
            param_global_dev.attr("disabled", true);
            val_param_global_dev.attr("disabled", true);
        } else if(this.value == "local_dev"){
            ref_ratio.attr("disabled", true);
            field_key_agg.attr("disabled", true);
            param_global_dev.attr("disabled", null);
            val_param_global_dev.attr("disabled", null);
        }
    });

    // TODO : check that fields are correctly filled before trying to prepare the query
    // ... and only enable the "compute" button when they are
    var ok_button = dialog_content.insert("button")
        .attr("value", "yes")
//        .attr("disabled", true)
        .text("Compute and render");

    var cancel_button = dialog_content.insert("button")
        .attr("value", "no")
        .text("Cancel");

    // Where the real job is done :
    ok_button.on("click", function(){
        let choosen_method = method_selec.node().value,
            var1_name = field1_selec.node().value,
            var2_name = field2_selec.node().value,
            formToSend = new FormData(),
            object_to_send = prepare_mta(choosen_method, var1_name, var2_name),
            target_url = (choosen_method == "local_dev") ? "/R_compute/MTA_geo" : "/R_compute/MTA_d",
            type_dev = type_deviation.node().value;

        if(type_dev != "both"){
            object_to_send["type_dev"] = type_dev;
            formToSend.append("json", JSON.stringify(object_to_send))
            console.log(formToSend);
            $.ajax({
                processData: false,
                contentType: false,
                cache: false,
                url: target_url,
                data: formToSend,
                type: 'POST',
                error: function(error) { console.log(error); },
                success: function(data){
                    current_layers[layer].is_result = true;
                    let result_values = JSON.parse(data),
                        type_dev = (type_deviation.node().value == "abs") ? "AbsoluteDeviation" : "RelativeDeviation";
                    if(result_values.values){
                        let field_name = [choosen_method, type_dev, var1_name, var2_name].join('_');
                        for(let i=0; i<nb_features; ++i)
                            user_data[layer][i][field_name] = result_values.values[i];
                        if(type_dev == "RelativeDeviation"){
                            current_layers[layer].renderer = ["MTA", type_dev].join('_');
                            current_layers[layer].rendered_field = field_name
                            makeButtonLegend(layer);
                            let disc_result = discretize_to_colors(result_values.values, "Quantiles", opt_nb_class, "Reds");
                            let rendering_params = {
                                nb_class: opt_nb_class,
                                type: "Quantiles",
                                breaks: disc_result[2],
                                colors: disc_result[3],
                                colorsByFeature: disc_result[4],
                                renderer:  ["Choropleth", "MTA", choosen_method].join('_'),
                                rendered_field: field_name
                                    };
                            render_choro(layer, rendering_params);
                            makeButtonLegend(layer);
                            zoom_without_redraw();
                        } else if (type_dev == "AbsoluteDeviation"){
                            let rendering_params = {
                                new_name: field_name,
                                field: field_name,
                                nb_features: nb_features,
                                ref_layer_name: layer,
                                symbol: "circle",
                                max_size: 35,
                                ref_size: 0.5,
                                fill_color: Colors.random()
                                };
                            current_layers[new_lyr_name].renderer = "PropSymbols_MTA";
                            let ret_val = make_prop_symbols(rendering_params);
                            binds_layers_buttons();
                            makeButtonLegend(new_lyr_name);
                            zoom_without_redraw();
                        }
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
                error: function(error) { console.log(error); },
                success: function(data){
                    let result_values_abs = JSON.parse(data);
                    if(result_values_abs.values){
                        var field_name2 = [choosen_method, "AbsoluteDeviation", var1_name, var2_name].join('_');
                        for(let i=0; i<nb_features; ++i)
                            user_data[layer][i][field_name2] = result_values_abs.values[i]; }

                    object_to_send["type_dev"] = "rel";
                    formToSend = new FormData();
                    formToSend.append("json", JSON.stringify(object_to_send));
                    $.ajax({
                        processData: false,
                        contentType: false,
                        url: target_url,
                        data: formToSend,
                        type: 'POST',
                        error: function(error) { console.log(error); },
                        success: function(data){
                            let result_values_rel = JSON.parse(data);
                            if(result_values_rel.values){
                                let field_name1 = [choosen_method, "RelativeDeviation", var1_name, var2_name].join('_'),
                                    new_lyr_name = ["MTA", var1_name, var2_name].join('_');
                                for(let i=0; i<nb_features; ++i)
                                    user_data[layer][i][field_name1] = result_values_rel.values[i];
                                let disc_result = discretize_to_colors(result_values_rel.values, "Quantiles", opt_nb_class, "Reds");
                                let rendering_params = {
                                        new_name: new_lyr_name,
                                        field: field_name1,
                                        nb_features: nb_features,
                                        ref_layer_name: layer,
                                        symbol: "circle",
                                        max_size: 22,
                                        ref_size: 0.1,
                                        fill_color: disc_result[4]
                                        };
                                let ret_val = make_prop_symbols(rendering_params);
                                current_layers[new_lyr_name].renderer = "PropSymbolsChoro_MTA";
                                current_layers[new_lyr_name].colors_breaks = disc_result[2];
                                binds_layers_buttons();
                                makeButtonLegend(new_lyr_name);
                                zoom_without_redraw();
                            }
                        }
                    });
                }
            });
        }
        deactivate([bg, nwBox]);
    });

    cancel_button.on("click", function(){
        deactivate([bg, nwBox]);
    });
    return nwBox;
}


function createFuncOptionsBox_PropSymbolChoro(layer){
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer,
        fields = type_col(layer, "number"),
        nb_features = user_data[layer].length,
        rendering_params = new Object();

    if(fields.length < 2){
        alert("The targeted layer doesn't seems to contain enough of numerical fields (at least two are required)");
        return;
    }

     bg.className = 'overlay';
     nwBox.id = [layer, 'PropSymbolChoro_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, 'PropSymbolChoro_popup'].join(''));
    dialog_content.append('h3').html('Proportional symbols and Choropleth representation');
    var field1_selec = dialog_content.append('p').html('First field (symbol size):').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field1_selec.append("option").text(field).attr("value", field); });

    var max_size = dialog_content.append('p').style("display", "inline").html('Max. size (px)')
                                 .insert('input')
                                 .attr({type: 'range', class: 'params'})
                                 .attr({min: 0.2, max: 66.0, value: +last_params.max_size || 5.0, step: 0.1})
                                 .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dialog_content.append('label-item').attr("id", "max_size_txt").html('0 px');

    var ref_size = dialog_content.append('p').html('Reference (fixed) size (px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params')
                                 .attr({min: 0.1, max: 66.0, value: +last_params.ref_size_val || 1.0, step: 0.1});

    // Other symbols could probably easily be proposed :
    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    [['Circle', "circle"], ['Square', "rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value", symb[1]);});

    var field2_selec = dialog_content.append('p').html('Second field (symbol color):').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field2_selec.append("option").text(field).attr("value", field); });

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_features));

    dialog_content.insert('p').style("margin", "auto").html("")
                .append("button").html("Choose your discretization ...")
                .on("click", function(){
                    display_discretization(layer, field2_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){ if(confirmed){
                            dialog_content.select('#yes').attr("disabled", null);
                            rendering_params = {
                                nb_class: confirmed[0], type: confirmed[1],
                                breaks: confirmed[2], colors: confirmed[3],
                                colorsByFeature: confirmed[4], renderer: "PropSymbolsChoro"
                                }
                            console.log(rendering_params)
                            } else { return; } });
                    });


    var ok_button = dialog_content.append('button')
                        .attr('id', 'yes')
                        .attr('disabled', true)
                        .text('Render');

    var cancel_button = dialog_content.append('button')
                            .attr('id', 'no')
                            .text('Close')
                            .on("click", function(){ deactivate([nwBox, bg]);});

    ok_button.on("click", function(){
        deactivate([nwBox, bg]);
        if(rendering_params){
        last_params = {
            field_symbol: field1_selec.node().value,
            max_size: +max_size.node().value / zoom.scale(),
            ref_size: +ref_size.node().value / zoom.scale(),
            symbol_shape: symb_selec.node().value,
            field_color: field2_selec.node().value
                };

        let rd_params = new Object();
        rd_params.field = field1_selec.node().value;
        rd_params.new_name = layer + "_PropSymbolsChoro";
        rd_params.nb_features = nb_features;
        rd_params.ref_layer_name = layer;
        rd_params.symbol = symb_selec.node().value;
        rd_params.max_size = +max_size.node().value;
        rd_params.ref_size = +ref_size.node().value;
        rd_params.fill_color = rendering_params['colorsByFeature'];

        let id_map = make_prop_symbols(rd_params);

        let colors_breaks = [],
            layer_to_add = rd_params.new_name;

        for(let i = 0; i<rendering_params['breaks'].length-1; ++i)
            colors_breaks.push([rendering_params['breaks'][i] + " - " + rendering_params['breaks'][i+1], rendering_params['colors'][i]]);

        current_layers[layer_to_add] = {
            renderer: "PropSymbolsChoro",
            id_size_map: id_map,
            symbol: rd_params.symbol,
            ref_layer_name: layer,
            rendered_field: field1_selec.node().value,
            rendered_field2: field2_selec.node().value,
            size: [ref_size.node().value, max_size.node().value],
            "stroke-width-const": "1px",
            colors: rendering_params['colorsByFeature'],
            colors_breaks: colors_breaks,
            is_result: true
            };
        makeButtonLegend(layer_to_add);
        binds_layers_buttons();
        zoom_without_redraw();
        deactivate([nwBox, bg]);
    }
    });
     return nwBox;

}
function createBox_FlowMap(ref_layer){
    if(joined_dataset.length < 1){
        alert("A .csv dataset have to be provided");
        return;
    }
    if(current_layers[ref_layer].type === "Line"){
        alert("A background reference layer (point/polygon/ have to be provided");
        return;
    }

    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+trim(ref_layer),
        fields = Object.getOwnPropertyNames(joined_dataset[0][0]),
        ref_fields = Object.getOwnPropertyNames(user_data[ref_layer][0]);

    bg.className = 'overlay';
    nwBox.id = [ref_layer, '_link_popup'].join('');
    nwBox.className = 'popup';

    (document.body || document.documentElement).appendChild(nwBox);
    (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", ref_layer, '_link_popup'].join(''));
    dialog_content.append('h3').html('Flow map');

    dialog_content.append('p').html('<b>Csv fields :</b>');

    var field_i = dialog_content.append('p').html('<b><i> i </i></b> field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_i.append("option").text(field).attr("value", field); });
    var field_j = dialog_content.append('p').html('<b><i> j </i></b> field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_j.append("option").text(field).attr("value", field); });
    var field_fij = dialog_content.append('p').html('<b><i> fij </i></b> field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_fij.append("option").text(field).attr("value", field); });

    dialog_content.append('p').html('<b>Reference layer fields :</b>');
    var join_field = dialog_content.append('p').html('join field :').insert('select').attr('class', 'params');
    ref_fields.forEach(function(field){ join_field.append("option").text(field).attr("value", field); });

    dialog_content.append('button').attr('id', 'yes').text('Compute');
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        let name_join_field = join_field.node().value;
        last_params = {
            "field_i": field_i.node().value,
            "field_j": field_j.node().value,
            "field_fij": field_fij.node().value,
            "join_field": name_join_field
            };
        var formToSend = new FormData();
        join_field_to_send = new Object();
        join_field_to_send[name_join_field] = user_data[ref_layer].map(obj => obj[name_join_field]);
        formToSend.append("json", JSON.stringify({
            "topojson": ref_layer,
            "csv_table": JSON.stringify(joined_dataset[0]),
            "field_i": field_i.node().value,
            "field_j": field_j.node().value,
            "field_fij": field_fij.node().value,
            "join_field": JSON.stringify(join_field_to_send)
            }))
        $.ajax({
            processData: false,
            contentType: false,
            cache: false,
            url: '/R_compute/links',
            data: formToSend,
            type: 'POST',
            error: function(error) { console.log(error); },
            success: function(data){
                add_layer_topojson(data, {result_layer_on_add: true});
                let new_layer_name = ["Links_", name_join_field].join(""),
                    layer_to_render = d3.select("#" + new_layer_name).selectAll("path"),
                    fij_field_name = field_fij.node().value,
                    fij_values = joined_dataset[0].map(obj => +obj[fij_field_name]),
                    prop_values = prop_sizer(fij_values, 0.5, 20);
                current_layers[new_layer_name].fixed_stroke = true;
                current_layers[new_layer_name].renderer = "Links";
                current_layers[new_layer_name].linksbyId = prop_values.map(i => [0.8, i])
                layer_to_render.style('fill-opacity', 0)
                               .style('stroke-opacity', 0.75)
                               .style("stroke-width", function(d, i){ return prop_values[i]; })
            }
        });
         deactivate([nwBox, bg]);
     }

     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;

}


function createFuncOptionsBox_Stewart(layer){
    if(current_layers[layer].type === "Line"){
        alert("Stewart potentials can only be computed from points (or polygons, using their centroids)");
        return;
    }
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+layer,
         fields = type_col(layer, "number"),
         other_layers = Object.getOwnPropertyNames(current_layers),
         tmp_idx = null;

     tmp_idx = other_layers.indexOf("Graticule");
     if(tmp_idx > -1)
         other_layers.splice(tmp_idx, 1);

     tmp_idx = other_layers.indexOf("Simplified_land_polygons");
     if(tmp_idx > -1)
         other_layers.splice(tmp_idx, 1);

     tmp_idx = null;
     bg.className = 'overlay';
     nwBox.id = [layer, '_stewart_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_stewart_popup'].join(''));
    dialog_content.append('h3').html('Stewart potentials');

    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
    var span = dialog_content.append('p').html('Span :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', last_params.span || 0).attr("min", 0).attr("max", 100000).attr("step", 0.1);
    var beta = dialog_content.append('p').html('Beta :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', last_params.beta || 0).attr("min", 0).attr("max", 10).attr("step", 0.1);
    var resolution = dialog_content.append('p').html('Resolution :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', last_params.resolution || 0).attr("min", 0).attr("max", 100000).attr("step", 0.1);
    var func_selec = dialog_content.append('p').html('Function type :').insert('select').attr('class', 'params');
    ['Exponential', 'Pareto'].forEach(function(fun_name){func_selec.append("option").text(fun_name).attr("value", fun_name);});
    var mask_selec = dialog_content.append('p').html('Clipping mask layer (opt.) :').insert('select').attr('class', 'params');
    mask_selec.append("option").text("None").attr("value", "None");
    for(let lyr_name in current_layers){
        if(current_layers[lyr_name].type === "Polygon") {
            mask_selec.append("option").text(lyr_name).attr("value", lyr_name);
        }
    }
    dialog_content.append('button').attr('id', 'yes').text('Compute');
    dialog_content.append('button').attr('id', 'no').text('Close');
    qs('#yes').onclick=function(){
        last_params = {
            "var_name": field_selec.node().value,
            "span": span.node().value,
            "beta": beta.node().value,
            "type_fun": func_selec.node().value,
            "resolution": resolution.node().value
            };
        var formToSend = new FormData();
        let field_n = field_selec.node().value;
        let var_to_send = new Object;
        var_to_send[field_n] = user_data[layer].map(i => +i[field_n]);
        formToSend.append("json", JSON.stringify({
            "topojson": layer,
            "var_name": JSON.stringify(var_to_send),
            "span": span.node().value,
            "beta": beta.node().value,
            "typefct": func_selec.node().value,
            "resolution": resolution.node().value,
            "mask_layer": mask_selec.node().value !== "None" ? mask_selec.node().value : ""}))

        $.ajax({
            processData: false,
            contentType: false,
            cache: false,
            url: '/R_compute/stewart',
            data: formToSend,
            type: 'POST',
            error: function(error) { console.log(error); },
            success: function(data){
                {
                    let data_split = data.split('|||');
                    var class_lim = JSON.parse(data_split[0]),
                        n_layer_name = data_split[1],
                        raw_topojson = data_split[2];
                    add_layer_topojson(raw_topojson, {result_layer_on_add: true});
                }
                var col_pal = getColorBrewerArray(class_lim.min.length, "Purples"),
                    col_map = new Map(),
                    colors_breaks = [];
                for(let i=0, i_len = class_lim.min.length; i < i_len; ++i){
                    let k = Math.round(class_lim.min[i] * 100) / 100;
                    col_map.set(k, col_pal[i]);
                    colors_breaks.push([class_lim['min'][i] + " - " + class_lim['max'][i], col_pal[i]])
                }
                console.log(col_map)
                current_layers[n_layer_name].colors = [];
                current_layers[n_layer_name].renderer = "Stewart";
                current_layers[n_layer_name].colors_breaks = colors_breaks;
                current_layers[n_layer_name].rendered_field = field_selec.node().value;
                d3.select("#"+n_layer_name)
                        .selectAll("path")
                        .style("fill", function(d, i){
                                let k = Math.round(d.properties.min * 100) / 100,
                                    col = col_map.get(k);
                                current_layers[n_layer_name].colors[i] = col;
                                return col;
                        });
                makeButtonLegend(n_layer_name);
                // Todo : use the function render_choro to render the result from stewart too
            }
        });
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}

function createFuncOptionsBox_Anamorphose(layer){
    if(current_layers[layer].type !== "Polygon"){
        alert("Anamorphose can currently only be computed on polygons");
        return;
    }
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer,
        fields = type_col(layer, "number"),
        random_color = Colors.random();

     bg.className = 'overlay';
     nwBox.id = [layer, '_anamorphose_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_anamorphose_popup'].join(''));
    dialog_content.append('h3').html('Anamorphose transformation');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
    var iterations = dialog_content.append('p').html('N. interations :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', last_params.iterations || 5).attr("min", 1).attr("max", 12).attr("step", 1);
    var algo_selec = dialog_content.append('p').html('Algorythm to use :').insert('select').attr('class', 'params');
    [['Pseudo-Dorling', 'dorling'],
     ['Dougenik & al. (1985)', 'dougenik'],
     ['Gastner & Newman (2004)', 'gastner']].forEach(function(fun_name){
        algo_selec.append("option").text(fun_name[0]).attr("value", fun_name[1]);});

    let ok_button = dialog_content.append('button').attr('id', 'yes').text('Compute'),
        cancel_button = dialog_content.append('button').attr('id', 'no').text('Close').on("click", function(){  deactivate([nwBox, bg]);  });
    ok_button.on("click", function(){
        let algo = algo_selec.node().value,
            nb_features = user_data[layer].length,
            field_name = field_selec.node().value,
            nb_iter = iterations.node().value;
        if(algo === "gastner"){
            alert('Not implemented (yet!)')
        } else if (algo === "dougenik"){
            alert('Not implemented (yet!)')
//            let carto = d3.cartogram().projection(d3.geo.mercator()).value(function(d, i){ return +user_data[layer][i][field_name]; }),
//                geoms = _target_layer_file.objects[layer].geometries,
//                new_features = carto(_target_layer_file, geoms).features,
//                new_layer_name = layer + "_Dougenik_Cartogram";
//            console.log(geoms);
//            console.log(new_features);
//            map.append("g")
//                .attr("id", new_layer_name)
//                .attr("class", "result_layer layer")
//                .style({"stroke-linecap": "round", "stroke-linejoin": "round"})
//                .selectAll(".subunit")
//                .data(new_features)
//                .enter().append("path")
//                    .attr("d", path)
//                    .attr("id", function(d, ix) { return "feature_" + ix; })
//                    .style("stroke", "black")
//                    .style("stroke-opacity", .4)
//                    .style("fill", random_color)
//                    .style("fill-opacity", 0.5)
//                    .attr("height", "100%")
//                    .attr("width", "100%");

        } else if (algo === "dorling"){
            alert('Not implemented (yet!)')
//            let ref_layer_selection  = d3.select("#"+layer).selectAll("path"),
//                d_values = new Array(nb_features),
//                res = new Array(nb_features),
//                zs = zoom.scale(),
//                max_size = 20,
//                ref_size = 0.5;
//
//            for(let i = 0; i < nb_features; ++i){
//                let centr = path.centroid(ref_layer_selection[0][i].__data__);
//                d_values[i] = [i, +user_data[layer][i][field_name], centr];
//            }
//
//            d_values = prop_sizer2(d_values, Number(ref_size / zs), Number(max_size / zs));
//            let ref_pt = d_values.map(function(obj){return {x: +obj[2][0], y: +obj[2][1], c: obj[2], r: +obj[1], uid: +obj[0]}});
//            for(let iter = 0; iter < nb_iter; iter++){
//                for(let i = 0 ; i < nb_features ; i++) {
//                    for(let j = 0 ; j < nb_features ; j++) {
//                        if(i==j) continue;
//                        let it = res[i] != undefined ? res[i] : ref_pt[i],
//                            jt = res[j] != undefined ? res[j] : ref_pt[j];
//        
//                        let radius = it.r + jt.r,
//                            itx = it.x + it.c[0],
//                            ity = it.y + it.c[1],
//                            jtx = jt.x + jt.c[0],
//                            jty = jt.y + jt.c[1],
//                            dist = Math.sqrt( (itx - jtx) * (itx - jtx) + (ity - jty) * (ity - jty) );
//        
//                        if(radius * zs > dist) {
//                            let dr = ( radius * zs - dist ) / ( dist * 1 );
//                            let tmp_x = it.x + ( itx - jtx ) * dr;
//                            let tmp_y = it.y + ( ity - jty ) * dr;
//                            res[i] = {"x": tmp_x, "y": tmp_y, "c": it.c, "r": it.r, "uid": it.uid};
//                        }
//                    }
//                }
//            }
//            console.log(res);console.log(ref_pt);
//            let bg_color = Colors.random(),
//                stroke_color = "black",
//                layer_to_add =  [layer, "DorlingCarto"].join('');
//
//            if(current_layers[layer_to_add]){
//                remove_layer_cleanup(layer_to_add);
//                d3.selectAll('#' + layer_to_add).remove();
//            }
//
//            var symbol_layer = map.append("g").attr("id", layer_to_add)
//                                  .attr("class", "result_layer layer");
//
//            for(let i = 0; i < res.length; i++){
//                let params = res[i] == undefined ? ref_pt[i] : res[i];
//                console.log(params);
//                symbol_layer.append('circle')
//                    .attr('cx', params.x)
//                    .attr("cy", params.y)
//                    .attr("r", ref_size / zs + params.r)
//                    .attr("id", ["PropSymbol_", i , " feature_", params.uid].join(''))
//                    .style("fill", bg_color)
//                    .style("stroke", "black")
//                    .style("stroke-width", 1 / zs);
//            }
//
//            let class_name = "ui-state-default sortable_result " + layer_to_add,
//                layers_listed = layer_list.node(),
//                li = document.createElement("li");
//
//            li.setAttribute("class", class_name);
//            li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_active, button_type_blank['Point'], "</div> ", layer_to_add].join('')
//            layers_listed.insertBefore(li, layers_listed.childNodes[0])
//            current_layers[layer_to_add] = {
//                "renderer": "DorlingCarto",
//                "symbol": "circle",
//                "rendered_field": field_name,
//                "size": [ref_size, max_size],
//                "stroke-width-const": "1px",
//                "is_result": true,
//                "ref_layer_name": layer
//                };
//
//            binds_layers_buttons();
//            zoom_without_redraw();
//            makeButtonLegend(layer_to_add);
            }
        deactivate([nwBox, bg]);
    });

    return nwBox;
}

var boxExplore = {
    display_table: function(prop){
        let self = this,
            add_field = d3.select("#add_field_button");
        if(prop.type === "ext_dataset"){
            var data_table = joined_dataset[0],
                the_name = dataset_name,
                message = "Switch to reference layer table...";
                add_field.html("").on('click', null);
        } else if(prop.type === "layer"){
            var data_table = user_data[this.layer_name],
                the_name = this.layer_name,
                message = "Switch to external dataset table...";
                add_field.html("Add a new field to your layer...").on('click', function(){  add_table_field(the_name, self) });
        }
        this.nb_features = data_table.length;
        this.columns_names = Object.getOwnPropertyNames(data_table[0]);
        this.columns_headers = [];
        for(var i=0, col=this.columns_names, len = col.length; i<len; ++i)
            this.columns_headers.push({data: col[i], title: col[i]})
        let txt_intro = ["<b>", the_name, "</b><br>",
                     this.nb_features, " features - ",
                     this.columns_names.length, " fields"];
        d3.selectAll('#table_intro').remove()
        this.box_table.append("p").attr('id', 'table_intro').style("text-align", "center").html(txt_intro.join(''))
        d3.selectAll('#myTable').remove()
        d3.selectAll('#myTable_wrapper').remove();
        this.box_table.append("table").attr({class: "display compact", id: "myTable"}).style({width: "80%", height: "80%"})
        $('#myTable').DataTable({
            data: data_table,
            columns: this.columns_headers
        });
        if(d3.select("#switch_button").node())
            d3.select("#switch_button").node().innerHTML = message;
    },

    create: function(){
        this.layer_name = Object.getOwnPropertyNames(user_data)[0];
        this.columns_headers = [];
        this.nb_features = undefined;
        this.columns_names = undefined;
        this.current_table = undefined,
        this.box_table = d3.select("body").append("div")
                            .attr({id: "browse_data_box", title: "Explore dataset"})
                            .style("font-size", "0.8em");
        let the_name = this.layer_name,
            self = this;
        if(!the_name){
            this.current_table = "ext_dataset";
        } else {
            this.current_table = "layer";
            this.box_table.append('p')
                     .attr("id", "add_field_button")
                     .html("Add a new field to your layer...")
                     .on('click', function(){  add_table_field(the_name, self)  });
        }

        if(dataset_name != undefined && the_name != undefined)
            this.box_table.append('p').attr("id", "switch_button").html("Switch to external dataset table...").on('click', function(){
                    let type = (self.current_table === "layer") ? "ext_dataset" : "layer";
                    self.current_table = type;
                    self.display_table({"type": type});
                    });
       
        this.display_table({"type": this.current_table});
    
        var deferred = Q.defer();
        $("#browse_data_box").dialog({
            modal:true,
            resizable: true,
            width: Math.round(window.innerWidth * 0.8),
            height:  Math.round(window.innerHeight * 0.85),
            buttons:[{
                    text: "Confirm",
                    click: function(){deferred.resolve([true, true]);$(this).dialog("close");}
                        },
                   {
                    text: "Cancel",
                    click: function(){$(this).dialog("close");$(this).remove();}
                   }],
            close: function(event, ui){
                    $(this).dialog("destroy").remove();
                    if(deferred.promise.isPending()) deferred.resolve(false);
                }
        });
        return deferred.promise;
    }
};


function fillMenu_Choropleth(layer){
    var g_lyr_name = "#"+layer,
        fields = type_col(layer, "number");
        ref_size_val = undefined,
        selected_disc = undefined;

    if(fields.length === 0){
        alert("The targeted layer doesn't seems to contain any numerical field");
        return;
    }

    var dv2 = section2.append("p").attr("class", "form-item");
    dv2.append('h3').html('Choropleth map');
    var field_selec = dv2.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length));
    var rendering_params = new Object();
    dv2.insert('p').style("margin", "auto").html("")
                .append("button").html("Display and arrange class")
                .on("click", function(){
                    display_discretization(layer, field_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){
                            if(confirmed){
                                console.log(confirmed);
                                rendering_params = {
                                        nb_class: confirmed[0], type: confirmed[1],
                                        breaks: confirmed[2], colors:confirmed[3],
                                        colorsByFeature: confirmed[4], renderer:"Choropleth",
                                        rendered_field: field_selec.node().value
                                    }
                            }
                        });
                });
    makeButtonLegend(layer);
    dv2.append('button').attr('id', 'yes').text('Render')
    qs('#yes').onclick=function(){
        if(rendering_params){
            render_choro(layer, rendering_params);
        }
     }
}

function makeButtonLegend(layer_name){
    // Todo : make the label clickable as the checkbox
    dv2.insert("p")
        .attr("id", "display_legend")
        .style({"text-align": "center", "margin-right": "5%"})
        .html("Display the legend")
        .insert('input')
        .attr("id", "checkbox_legend")
        .attr("type", "checkbox")
        .on("change", function(){handle_legend(layer_name);});
}

function handle_legend(layer){
    let state = current_layers[layer].renderer;
    if(state != undefined){
        let rml = false;
        if(d3.selectAll("#legend_root").node()){
            d3.selectAll("#legend_root").remove();
            d3.selectAll(".source_block").remove();
            rml = true;
        }
        if(d3.selectAll("#legend_root2").node()){
            d3.selectAll("#legend_root2").remove();
            d3.selectAll(".source_block").remove();
            rml = true;
        }
        if(!rml) createLegend(layer, "Legend")
    }
}

function createFuncOptionsBox_Choropleth(layer){
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer.trim(),
        fields = type_col(layer, "number"),
        ref_size_val = undefined,
        selected_disc = undefined;

    if(fields.length === 0){
        alert("The targeted layer doesn't seems to contain any numerical field or contains too many empty values");
        return;
    }

     bg.className = 'overlay';
     nwBox.id = [layer, '_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_popup'].join(''));
    dialog_content.append('h3').html('Choropleth map');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length));
    var rendering_params = new Object();
    dialog_content.insert('p').style("margin", "auto").html("")
                .append("button").html("Display and arrange class")
                .on("click", function(){
                    display_discretization(layer, field_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){ if(confirmed){
                            console.log(confirmed);
                            dialog_content.select('#yes').attr("disabled", null);
                            rendering_params = {
                                nb_class: confirmed[0], type: confirmed[1],
                                breaks: confirmed[2], colors:confirmed[3],
                                colorsByFeature: confirmed[4], renderer: "Choropleth"
                                }
                            } else { return; } });
                    });

    var ok_button = dialog_content.append('button')
                        .attr('id', 'yes')
                        .attr('disabled', true)
                        .text('Render')
                        .on("click", function(){
                            deactivate([nwBox, bg]);
                            if(rendering_params){
                                rendering_params['rendered_field'] = field_selec.node().value;
                                render_choro(layer, rendering_params);
                                makeButtonLegend(layer);
                            }});

    var cancel_button = dialog_content.append('button')
                            .attr('id', 'no')
                            .text('Close')
                            .on("click", function(){ deactivate([nwBox, bg]);});
    return nwBox;
}

function createLegend(layer, title, subtitle){
    // Common part :
    var source_info = map.insert('g').attr("class", "legend_feature source_block")
                        .insert("text").style("font", "italic 10px Gill Sans Extrabold, sans-serif")
                        .attr({id: "source_block", x: 10, y: h-10})
                        .text("Rendered by MAPOLOGIC");
    // Specific parts :
    if(current_layers[layer].renderer.indexOf("PropSymbolsChoro") != -1){
        let field2 = current_layers[layer].rendered_field2,
            field1 = current_layers[layer].rendered_field;
        createLegend_choro(layer, field2, "Legend", subtitle);
        createLegend_symbol(layer, field1);
    }
    else if(current_layers[layer].renderer.indexOf("PropSymbols") != -1){
        let field = current_layers[layer].rendered_field;
        createLegend_symbol(layer, field, title);
    } else {
        let field = current_layers[layer].rendered_field;
        createLegend_choro(layer, field, title, field);
    }
}

function createLegend_symbol(layer, field, title, subtitle){
    var title = title || "",
        subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 4,
        xpos = 30,
        ypos = 30,
        y_pos2 =  ypos + space_elem,
        ref_layer_name = layer.split("_PropSymbols")[0] || current_layers[layer].ref_layer_name,
        nb_features = user_data[ref_layer_name].length,
        symbol_type = current_layers[layer].symbol,
        legend_root = map.insert('g').attr('id', 'legend_root2').attr("class", "legend_feature");

    legend_root.insert('text').attr("id","legendtitle")
            .text(title).style("font", "bold 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem * 2 + boxgap)
            .attr("y", ypos)
    legend_root.insert('text').attr("id","legendsubtitle")
            .text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem * 2 + boxgap)
            .attr("y", ypos + 15);

    legend_root.insert("svg:image").attr("id", "move_legend")
        .attr({x: xpos-6, y: ypos-6, width: 12, height: 12, "fill-opacity" : 0.5})
        .attr("title", "Double-click here to drag the legend")
        .attr("xlink:href", "/static/img/Simpleicons_Interface_arrows-cross.svg")
        .on("click", function(){  legend_root.call(drag_lgd);  });

    legend_root.insert("svg:image").attr("id", "edit_legend")
        .attr({x: xpos-6, y: ypos + 20, width: 12, height: 12, "fill-opacity" : 0.5})
        .attr("xlink:href", "/static/img/Edit_icon.svg")
        .on('click', function(){ make_legend_edit_window('#legend_root2', layer); });

    let breaks_elem = [0].concat([4,3,2,1].map(i => Math.round((nb_features-1)/i))),
        ref_symbols = d3.select("#" + layer).selectAll(symbol_type)[0],
        type_param = symbol_type === 'circle' ? 'r' : 'width',
        ref_symbols_params = new Array();

    for(let i of breaks_elem){
        let ft_id = +ref_symbols[i].id.split(' ')[1].split('_')[1],
            value = user_data[ref_layer_name][ft_id][field],
            size = +ref_symbols[i].getAttribute(type_param) * zoom.scale();
        ref_symbols_params.push({value:value, size:size})
    }

    var legend_elems = legend_root.selectAll('.legend')
                                      .append("g")
                                      .data(ref_symbols_params)
                                      .enter().insert('g')
                                      .attr('class', function(d, i) { return "legend_feature lg legend_" + i; });
    let max_size = ref_symbols_params[0].size,
        last_size = 0,
        last_pos = y_pos2;

    if(symbol_type === "circle"){
        legend_elems
              .append("circle")
                  .attr("cx", xpos + space_elem + boxgap + max_size / 2)
                  .attr("cy", function(d, i){
                        last_pos = (i * boxgap) + d.size + last_pos + last_size;
                        last_size = d.size;
                        return last_pos;
                        })
                  .attr('r', function(d, i){return d.size;})
                  .style({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7});
    } else if(symbol_type === "rect"){
        legend_elems
              .append("rect")
              .attr("x", xpos + space_elem + boxgap + max_size / 2)
              .attr("y", function(d, i){
                        last_pos = (i * boxgap) + (d.size * 2) + last_pos + last_size;
                        last_size = d.size;
                        return last_pos;
                        })
              .attr('width', function(d, i){return d.size;})
              .attr('height', function(d, i){return d.size;})
              .style({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7})
    }

    last_pos = y_pos2; last_size = 0;
    legend_elems.append("text")
            .attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5)
            .attr("y", function(d, i){
                        last_pos = (i * boxgap) + d.size + last_pos + last_size;
                        last_size = d.size;
                        return last_pos + (i * 2/3);
                        })
            .style({'alignment-baseline': 'middle' , 'font-size':'10px'})
            .text(function(d, i){return d.value;});

    var drag_lgd = d3.behavior.drag()
                .on("dragstart", function(){
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                })
                .on("dragend", function(){  if(d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);  })
                .on("drag", function() {
                    d3.selectAll("#legend_root2").attr('transform', 'translate(' + [-xpos + d3.event.x, -ypos + d3.event.y] + ')');
                        });

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attr({x: xpos, y: last_pos + 2*space_elem})
            .html('');
}


function createLegend_choro(layer, field, title, subtitle){
    var title = title || "",
        subtitle = subtitle || field,
        boxheight = 18,
        boxwidth = 18,
        boxgap = 4,
        xpos = w - (w / 8),
        ypos = 30,
        last_pos = null,
        y_pos2 =  ypos + boxheight,
        nb_class = current_layers[layer].colors_breaks.length;

    var legend_root = map.insert('g').attr('id', 'legend_root').attr("class", "legend_feature");

    legend_root.insert('text').attr("id","legendtitle")
            .text(title).style("font", "bold 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + boxheight * 2 + boxgap)
            .attr("y", ypos)
    legend_root.insert('text').attr("id","legendsubtitle")
            .text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + boxheight * 2 + boxgap)
            .attr("y", ypos + 15);

    legend_root.insert("svg:image").attr("id", "move_legend")
        .attr({x: xpos-6, y: ypos-6, width: 12, height: 12, "fill-opacity" : 0.5})
        .attr("title", "Double-click here to drag the legend")
        .attr("xlink:href", "/static/img/Simpleicons_Interface_arrows-cross.svg")
        .on("click", function(){  legend_root.call(drag_lgd);  });

    legend_root.insert("svg:image").attr("id", "edit_legend")
        .attr({x: xpos-6, y: ypos + 20, width: 12, height: 12, "fill-opacity" : 0.5})
        .attr("xlink:href", "/static/img/Edit_icon.svg")
        .on('click', function(){ make_legend_edit_window('#legend_root', layer); });

    var legend_elems = legend_root.selectAll('.legend')
                                  .append("g")
                                  .data(current_layers[layer].colors_breaks)
                                  .enter().insert('g')
                                  .attr('class', function(d, i) { return "legend_feature lg legend_" + i; });

    legend_elems
      .append('rect')
      .attr("x", xpos + boxwidth + boxgap / 2)
      .attr("y", function(d, i){
        last_pos = y_pos2 + (i * boxgap) + (i * boxheight);
        return last_pos;
        })
      .attr('width', boxwidth)
      .attr('height', boxheight)
      .style('fill', function(d) { return d[1]; })
      .style('stroke', function(d) { return d[1]; });
      
    legend_elems
      .append('text')
      .attr("x", xpos + boxwidth * 2 + boxgap)
      .attr("y", function(d, i){
        return y_pos2 + (i * boxgap) + (i+2/3) * boxheight;
        })
      .style({'alignment-baseline': 'middle' , 'font-size':'10px'})
      .text(function(d) { return d[0]; });

    var drag_lgd = d3.behavior.drag()
                .on("dragstart", function(){
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                    })
                .on("dragend", function(){  if(d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);  })
                .on("drag", function() {
                    d3.selectAll("#legend_root").attr('transform', 'translate(' + [-xpos + d3.event.x, -ypos + d3.event.y] + ')');
                    });

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attr({x: xpos, y: last_pos + 2*boxheight})
            .html('');
}

function make_legend_edit_window(legend_id, layer_name){
    var modal = createlegendEditBox(legend_id, layer_name);
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 12;
    return center(modal);
};

// Function trying to mimic the R "seq" function or the python 2 "range" function
// (ie its not generator based and returns a real array)
let range = function(start = 0, stop, step = 1) {
    let cur = (stop === undefined) ? 0 : start;
    let max = (stop === undefined) ? start : stop;
    let res = new Array();
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

function createlegendEditBox(legend_id, layer_name){
    let nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        title_content = d3.select(legend_id).select("#legendtitle"),
        subtitle_content = d3.select(legend_id).select("#legendsubtitle"),
        note_content = d3.select(legend_id).select("#legend_bottom_note"),
        source_content = d3.select("#source_block");

    bg.className = 'overlay';
    nwBox.id = layer_name + "_legend_popup";
    nwBox.className = 'popup';
    (document.body || document.documentElement).appendChild(nwBox);
    (document.body || document.documentElement).appendChild(bg);
   
    var box_body = d3.select(["#", layer_name, "_legend_popup"].join('')),
        legend_boxes = d3.selectAll([legend_id, ".lg"].join(' ')).select("text"),
        current_nb_dec;

    box_body.insert('h3').html('Legend customization')
            .append('p').html('Legend title<br>')
            .insert('input')
            .attr("value", title_content.node().textContent)
            .on("change", function(){
                title_content.node().textContent = this.value
            });
    box_body.append('p').html('Variable name<br>')
            .insert('input')
            .attr("value", subtitle_content.node().textContent)
            .on("change", function(){
                subtitle_content.node().textContent = this.value
            });

    // Float precision for label in the legend 
    // (actually it's not really the float precision but an estimation based on
    // the string representation of only two values but it will most likely do the job in many cases)
    let first_value = legend_id.indexOf("2") === -1 ? legend_boxes[0][0].__data__[0].split(" - ")[0] : String(legend_boxes[0][0].__data__.value),
        fourth_value = legend_id.indexOf("2") === -1 ? legend_boxes[0][1].__data__[0].split(" - ")[1] : String(legend_boxes[0][4].__data__.value),
        current_nb_dec1 = first_value.length - first_value.indexOf(".") - 1,
        current_nb_dec4 = fourth_value.length - fourth_value.indexOf(".") - 1;

    if(current_nb_dec4 === fourth_value.length && current_nb_dec1 === first_value.length) current_nb_dec = null;
    else current_nb_dec = current_nb_dec4 >= current_nb_dec1 ? current_nb_dec4 : current_nb_dec1;

    if(current_nb_dec){
        let max_nb_decimal = current_nb_dec > 8 ? current_nb_dec : 8;
        box_body.append('p')
                    .style("display", "inline")
                    .attr("id", "precision_change_txt")
                    .html(['Floating number rounding precision<br> ', current_nb_dec, ' '].join(''));
        if(legend_id === "#legend_root")
                box_body.append('input')
                        .attr({id: "precision_range", type: "range", min: 0, max: max_nb_decimal, step: 1, value: current_nb_dec})
                        .style("display", "inline")
                        .on('change', function(){
                            let nb_float = this.value,
                                dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                            d3.select("#precision_change_txt").html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                            for(let i = 0, breaks = current_layers[layer_name].colors_breaks; i < legend_boxes[0].length; i++){
                                let values = breaks[i][0].split(' - ');
                                legend_boxes[0][i].innerHTML = [Math.round(+values[0] * dec_mult) / dec_mult, " - ", Math.round(+values[1] * dec_mult) / dec_mult].join('');
                            }
                        });
        else if(legend_id === "#legend_root2")
                box_body.append('input')
                        .attr({id: "precision_range", type: "range", min: 0, max: max_nb_decimal, step: 1, value: current_nb_dec})
                        .style("display", "inline")
                        .on('change', function(){
                            let nb_float = +this.value,
                                dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                                //dec_mult = +["1", range(nb_float).map(i => "0").join('')].join('');
                            d3.select("#precision_change_txt").html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                            for(let i = 0; i < legend_boxes[0].length; i++){
                                let value = legend_boxes[0][i].__data__.value;
                                legend_boxes[0][i].innerHTML = String(Math.round(+value * dec_mult) / dec_mult);
                            }
                        });
    }

    box_body.insert('p').html('Additionnal legend notes<br>')
            .insert('input').attr("value", note_content.node().textContent)
            .style("font-family", "12px Gill Sans Extrabold, sans-serif")
            .on("keyup", function(){
                note_content.node().textContent = this.value;
            });

    box_body.insert('p').html('Source/authors informations:<br>')
            .insert('input').attr("value", "Rendered by MAPOLOGIC")
            .style("font", "italic 10px Gill Sans Extrabold, sans-serif")
            .on("keyup", function(){
                source_content.node().textContent = this.value;
            });

    box_body.append('button')
            .attr('id', 'yes')
            .text('Confirm')
            .on("click", function(){
                deactivate([nwBox, bg]);
                });

    box_body.append('button')
            .attr('id', 'no')
            .text('Close')
            .on("click", function(){
                deactivate([nwBox, bg]);
            });
    return nwBox;
};


function createFuncOptionsBox_PropSymbol(layer){
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer,
        fields = type_col(layer, "number");

    if(fields.length === 0){
        alert("The targeted layer doesn't seems to contain any numerical field");
        return;
    }

    let nb_features = user_data[layer].length;
     bg.className = 'overlay';
     nwBox.id = [layer, '_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_popup'].join(''));
    dialog_content.append('h3').html('Proportional symbols');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });

    let max_allowed_size = Math.round(h/2 - h/20);

    var max_size = dialog_content.append('p').style("display", "inline").html('Max. size (px)')
                                 .insert('input')
                                 .attr({type: 'range', class: 'params'})
                                 .attr({min: 0.2, max: max_allowed_size, value: +last_params.max_size || 5.0, step: 0.1})
                                 .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dialog_content.append('label-item').attr("id", "max_size_txt").html('0 px');

    var ref_size = dialog_content.append('p').html('Reference minimum size (fixed size in px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params')
                                 .attr({min: 0.1, max: max_allowed_size - 0.5, value: +last_params.ref_size_val || 0.3, step: 0.1});

    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    [['Circle', "circle"], ['Square', "rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value", symb[1]);});

    var fill_color = dialog_content.append('p').html('Symbol color<br>')
              .insert('input').attr('type', 'color').attr("value", Colors.random());

    dialog_content.append('button').attr('id', 'yes').text('Compute');
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        last_params = {
            field: field_selec.node().value,
            max_size: +max_size.node().value,
            ref_size: +ref_size.node().value,
            symbol_shape: symb_selec.node().value,
            symbol_color: fill_color.node().value
                };

        let rendering_params = {
            "field": field_selec.node().value,
            "nb_features": nb_features,
            "ref_layer_name": layer,
            "symbol": symb_selec.node().value,
            "max_size": +max_size.node().value,
            "ref_size": +ref_size.node().value,
            "fill_color": fill_color.node().value,
            };

        let ret_val = make_prop_symbols(rendering_params);

        binds_layers_buttons();
        zoom_without_redraw();
        makeButtonLegend(layer + "_PropSymbols");
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}


function make_prop_symbols(rendering_params){
        console.log(rendering_params);
        let layer = rendering_params.ref_layer_name,
            field = rendering_params.field,
            nb_features = rendering_params.nb_features,
            d_values = new Array(nb_features),
            comp = function(a, b){ return b[1]-a[1]; },
            ref_layer_selection  = d3.select("#"+layer).selectAll("path"),
            ref_size = rendering_params.ref_size,
            max_size = rendering_params.max_size,
            zs = zoom.scale();

        for(let i = 0; i < nb_features; ++i){
            let centr = path.centroid(ref_layer_selection[0][i].__data__);
            d_values[i] = [i, +user_data[layer][i][field], centr];
        }

        d_values = prop_sizer2(d_values, Number(ref_size / zs), Number(max_size / zs));
        d_values.sort(comp);
        /*
            Values have been sorted (descendant order) to have larger symbols
            displayed under the smaller, so now d_values is an array like :
            [
             [id_ref_feature, value, [x_centroid, y_centroid]],
             [id_ref_feature, value, [x_centroid, y_centroid]],
             [id_ref_feature, value, [x_centroid, y_centroid]],
             [...]
            ]
        */

        let bg_color = Colors.random(),
            stroke_color = Colors.random(),
            layer_to_add = rendering_params.new_name || (layer + "_PropSymbols"),
            symbol_type = rendering_params.symbol;

        if(!(rendering_params.fill_color instanceof Array)){
            for(let i=0; i<nb_features; ++i)
                d_values[i].push(rendering_params.fill_color);
        } else {
            for(let i=0; i<nb_features; ++i)
                d_values[i].push(rendering_params.fill_color[i]);
        }

        if(current_layers[layer_to_add]){
            remove_layer_cleanup(layer_to_add);
            d3.selectAll('#' + layer_to_add).remove();
        }

        var symbol_layer = map.append("g").attr("id", layer_to_add)
                              .attr("class", "result_layer layer");

        if(symbol_type === "circle"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i];
                symbol_layer.append('circle')
                    .attr('cx', params[2][0])
                    .attr("cy", params[2][1])
                    .attr("r", ref_size / zs + params[1])
                    .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                    .style("fill", params[3])
                    .style("stroke", "black")
                    .style("stroke-width", 1 / zs);
            }
        } else if(symbol_type === "rect"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i],
                    size = ref_size / zs + params[1];

                symbol_layer.append('rect')
                    .attr('x', params[2][0] - size/2)
                    .attr("y", params[2][1] - size/2)
                    .attr("height", size)
                    .attr("width", size)
                    .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                    .style("fill", params[3])
                    .style("stroke", "black")
                    .style("stroke-width", 1 / zs);
            };
        }

        let class_name = "ui-state-default sortable_result " + layer_to_add,
            layers_listed = layer_list.node(),
            li = document.createElement("li");

        li.setAttribute("class", class_name);
        li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_active, button_type_blank['Point'], "</div> ", layer_to_add].join('')
        layers_listed.insertBefore(li, layers_listed.childNodes[0])
        current_layers[layer_to_add] = {
            "renderer": rendering_params.renderer || "PropSymbols",
            "symbol": symbol_type,
            "rendered_field": field,
            "size": [ref_size, max_size],
            "stroke-width-const": "1px",
            "is_result": true,
            "ref_layer_name": layer
            };
        let ret_val = new Array(nb_features);
        for(let i=0; i<nb_features;i++)
            ret_val[i] = d_values[i][0]
        return ret_val
}


function createBox_griddedMap(layer){
    if(current_layers[layer].type != "Polygon"){
        alert("Gridded maps can currently only be made from polygons");
        return;
    }

     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+layer,
         fields = type_col(layer, "number");

     bg.className = 'overlay';
     nwBox.id = [layer, '_gridded_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_gridded_popup'].join(''));
    dialog_content.append('h3').html('Gridded map');

    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
    var cellsize = dialog_content.append('p').html('Cell size <i>(meters)</i>').insert('input').attr('type', 'number').attr('class', 'params').attr('value', last_params.span || 0).attr("min", 1000).attr("max", 700000).attr("step", 0.1);

    var col_pal = dialog_content.append('p').html('Colorramp :').insert('select').attr('class', 'params');
    ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn',
    'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(function(d, i){
            col_pal.append("option").text(d).attr("value", d);
    });

    dialog_content.append('button').attr('id', 'yes').text('Compute and render');
    dialog_content.append('button').attr('id', 'no').text('Close');
    qs('#yes').onclick=function(){
        let field_n = field_selec.node().value,
            formToSend = new FormData(),
            var_to_send = new Object();

        var_to_send[field_n] = user_data[layer].map(i => +i[field_n])
        last_params = {
            "var_name": field_n,
            "cellsize": cellsize.node().value
            };

        formToSend.append("json", JSON.stringify({
            "topojson": layer,
            "var_name": JSON.stringify(var_to_send),
            "cellsize": cellsize.node().value
            }))
        $.ajax({
            processData: false,
            contentType: false,
            cache: false,
            url: '/R_compute/gridded',
            data: formToSend,
            type: 'POST',
            error: function(error) { console.log(error); },
            success: function(data){
                {
                    let data_split = data.split('|||');
                    var n_layer_name = data_split[0],
                        raw_topojson = data_split[1];
                    add_layer_topojson(raw_topojson, {result_layer_on_add: true});
                }
                
                let opt_nb_class = Math.floor(1 + 3.3 * Math.log10(result_data[n_layer_name].length)),
                    d_values = result_data[n_layer_name].map(obj => +obj["densitykm"]);

                current_layers[n_layer_name].renderer = "Gridded";
                makeButtonLegend(n_layer_name);
                let disc_result = discretize_to_colors(d_values, "Quantiles", opt_nb_class, col_pal.node().value),
                        rendering_params = {
                            nb_class: opt_nb_class,
                            type: "Quantiles",
                            breaks: disc_result[2],
                            colors: disc_result[3],
                            colorsByFeature: disc_result[4],
                            renderer: "Gridded",
                            rendered_field: "densitykm"
                                };
                render_choro(n_layer_name, rendering_params);

            }
        });
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}

// Function to render the `layer` according to the `rendering_params` 
// (layer should be the name of group of path, ie. not a PropSymbol layer)
// Currently used fo "choropleth", "MTA - relative deviations", "gridded map" functionnality
function render_choro(layer, rendering_params){
    console.log(rendering_params);
    var layer_to_render = d3.select("#"+layer).selectAll("path");
    d3.select("#"+layer).style("stroke-width", 0.75/zoom.scale() + "px");
    layer_to_render.style('fill-opacity', 0.9)
                   .style("fill", function(d, i){ return rendering_params['colorsByFeature'][i] })
                   .style('stroke-opacity', 0.9)
                   .style("stroke", "black");
    current_layers[layer].renderer = rendering_params['renderer'];
    current_layers[layer].rendered_field = rendering_params['rendered_field'];
    current_layers[layer].colors = rendering_params['colorsByFeature'];
    current_layers[layer]['stroke-width-const'] = "0.75px";
    current_layers[layer].is_result = true;
    let colors_breaks = [];
    for(let i = 0; i<rendering_params['breaks'].length-1; ++i){colors_breaks.push([rendering_params['breaks'][i] + " - " + rendering_params['breaks'][i+1], rendering_params['colors'][i]])}
    current_layers[layer].colors_breaks = colors_breaks;
    zoom_without_redraw();
}


function prop_sizer(arr, min_size, max_size){
    let min_values = Math.sqrt(Math.min.apply(0, arr)),
        max_values = Math.sqrt(Math.max.apply(0, arr)),
        dif_val = max_values - min_values,
        dif_size = max_size - min_size,
        len_arr = arr.length,
        res = new Array(len_arr);
    // Lets use "for" loop with pre-sized array as "map" and "forEach" seems 
    // to be sometimes slower in some browser
    for(let i=0; i<len_arr; ++i)
        res[i] = (Math.sqrt(arr[i])/dif_val * dif_size) + min_size - dif_size/dif_val;
    return res;
}

function prop_sizer2(arr, min_size, max_size){
    let arr_tmp = arr.map(i => i[1]),
        min_values = Math.sqrt(Math.min.apply(0, arr_tmp)),
        max_values = Math.sqrt(Math.max.apply(0, arr_tmp)),
        dif_val = max_values - min_values,
        dif_size = max_size - min_size,
        arr_len = arr.length,
        res = new Array(arr_len);

    for(let i=0; i<arr_len; i++){
        let val = arr[i];
        res[i] = [val[0], (Math.sqrt(val[1])/dif_val * dif_size) + min_size - dif_size/dif_val, val[2]];
    }
    return res;
}

var type_col = function(layer_name, target){
// Function returning an object like {"field1": "field_type", "field2": "field_type"},
//  for the fields of the selected layer.
// If target is set to "number" it should return an array containing only the name of the numerical fields
// ------------------- "string" ---------------------------------------------------------non-numerial ----
    var table = user_data.hasOwnProperty(layer_name) ? user_data[layer_name] : result_data[layer_name],
        fields = Object.getOwnPropertyNames(table[0]),
        nb_features = current_layers[layer_name].n_features,
        deepth_test = 10 < nb_features ? 10 : nb_features,
        result = new Object(),
        field = undefined,
        tmp_type = undefined;

    if(fields.indexOf('pkuid') != -1)
        fields.splice(fields.indexOf("pkuid"), 1);

    for(let j = 0, len = fields.length; j < len; ++j){
        field = fields[j];
        result[field] = []
        for(let i=0; i < deepth_test; ++i){
            tmp_type = typeof table[i][field];
            if(tmp_type === "string" && !isNaN(Number(table[i][field]))) tmp_type = "number"
            result[fields[j]].push(tmp_type)
        }
    }
    for(let j = 0, len = fields.length; j < len; ++j){
        field = fields[j];
        if(result[field].every(function(ft){return ft === "number";}))
            result[field] = "number"
        else
            result[field] = "string"
    }
    if(target){
        let res = [];
        for(let k in result)
            if(result[k] === target)
                res.push(k)
        return res
    } else
        return result;
}

// Function to add a field to the targeted layer 
// Args :
// - layer : the layer name
// - parent : (optional) the object createBoxExplore to be used as a callback to redisplay the table with the new field
function add_table_field(layer, parent){
    var check_name = function(){
        if(regexp_name.test(this.value))
            chooses_handler.new_name = this.value;
        else { // Rollback to the last correct name  :
            this.value = chooses_handler.new_name;
            alert("Unauthorized character");
        }
    };

    var refresh_type_content = function(type){
            field1.node().remove(); operator.node().remove(); field2.node().remove();
            field1 = div1.append("select").on("change", function(){ chooses_handler.field1 = this.value; });
            operator = div1.append("select").on("change", function(){ chooses_handler.operator=this.value; refresh_subtype_content(chooses_handler.type_operation, this.value);});
            field2 = div1.append("select").on("change", function(){ chooses_handler.field2 = this.value; });
            if(type == "math_compute"){
                math_operation.forEach(function(op){ operator.append("option").text(op).attr("value", op); })
                for(let k in fields_type){
                    if(fields_type[k] == "number"){
                        field1.append("option").text(k).attr("value", k);
                        field2.append("option").text(k).attr("value", k);
                    }
                }
                d3.select("#val_opt").attr("disabled", true);
                d3.select("#txt_opt").text("");
                chooses_handler.operator = math_operation[0];
            } else {
                string_operation.forEach(function(op){ operator.append("option").text(op).attr("value", op); })
                for(let k in fields_type){
                    if(fields_type[k] == "string"){
                        field1.append("option").text(k).attr("value", k);
                        field2.append("option").text(k).attr("value", k);
                    }
                }
                d3.select("#val_opt").attr("disabled", null);
                d3.select("#txt_opt").html("Character to join the two fields (can stay blank) :<br>");
                chooses_handler.operator = string_operation[0];
            }
            chooses_handler.field1 = field1.node().value;
            chooses_handler.field2 = field2.node().value;
    };

    var refresh_subtype_content = function(type, subtype){
        if(type != "string_field"){
            d3.select("#val_opt").attr("disabled", true);
            d3.select("#txt_opt").text("")
        } else {
            if(subtype == "Truncate"){
                d3.select("#txt_opt").html("Number of char to keep (from the left) :<br>");
                field2.attr("disabled", true);
            } else {
                d3.select("#txt_opt").html("Character used to join the two fields (can stay blank) :<br>");
                field2.attr("disabled", null);
            }
        }
    };

    var chooses_handler = {
        field1: undefined, field2: undefined,
        operator: undefined, type_operation: undefined,
        opt_val: undefined, new_name: 'NewFieldName'
        }

    var box = make_confirm_dialog("", "Valid", "Cancel", "Add a new field", "addFieldBox", w - (w/4), h - (h/8))
                .then(function(valid){
                    if(valid){
                        console.log(chooses_handler)
                        let fi1 = chooses_handler.field1,
                            fi2 = chooses_handler.field2,
                            data_layer = user_data[layer],
                            new_name_field = chooses_handler.new_name,
                            operation = chooses_handler.operator;

                        if(chooses_handler.type_operation === "math_compute"){
                            for(let i=0; i<data_layer.length; i++){
                                let cmd = [+data_layer[i][fi1], operation, +data_layer[i][fi2]].join(' '),
                                    result_val = eval(cmd);
                                data_layer[i][new_name_field] = +result_val;
                            }
                        } else {
                            let opt_val = chooses_handler.opt_val;
                            if(operation == "Truncate"){
                                for(let i=0; i < user_data[layer].length; i++)
                                    data_layer[i][new_name_field] = data_layer[i][fi1].substring(0, +opt_val);

                            } else if (operation == "Concatenate"){
                                for(let i=0; i < user_data[layer].length; i++)
                                    data_layer[i][new_name_field] = [data_layer[i][fi1], data_layer[i][fi2]].join(opt_val)

                            }
                        }
                    if(parent) parent.display_table({"type": "layer"});
                    }
            });

    var current_fields = Object.getOwnPropertyNames(user_data[layer]),
        box_content = d3.select(".addFieldBox").append("div"),
        div1 = box_content.append("div").attr("id", "field_div1"),
        div2 = box_content.append("div").attr("id", "field_div2"),
        new_name = div1.append("p").html("New field name :<br>").insert("input").attr('value', 'NewFieldName').on("keydown", check_name),
        type_content = div1.append("p").html("New field content :<br>")
                            .insert("select").on("change", function(){ chooses_handler.type_operation = this.value; refresh_type_content(this.value);}),
        regexp_name = new RegExp(/^[a-z0-9_]+$/i); // Only allow letters (lower & upper cases), number and underscore in the field name
    [["Computation based on two existing numerical fields", "math_compute"],
     ["Modification on a character field", "string_field"]
    ].forEach(function(d,i){ type_content.append("option").text(d[0]).attr("value", d[1]); });

    var field1 = div1.append("select").on("change", function(){ chooses_handler.field1 = this.value; console.log(this.value) }),
        operator = div1.append("select").on("change", function(){ chooses_handler.operator = this.value; refresh_subtype_content(chooses_handler.type_operation, this.value);}),
        field2 = div1.append("select").on("change", function(){ chooses_handler.field2 = this.value; });;

    div2.append("p").attr("id", "txt_opt").text("");
    div2.append("input").attr("id", "val_opt").attr("disabled", true).on("change", function(){ chooses_handler.opt_val = this.value;});

    var fields_type = type_col(layer),
        math_operation = ["+", "-", "*", "/"],
        string_operation = ["Concatenate", "Truncate"];

    return box;
}