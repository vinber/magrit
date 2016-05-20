"use strict";

function get_menu_option(func){
    var menu_option = {
        "test":{
            "title": "test",
            "desc": "Testing functionnality...",
            "menu_factory": "fillMenu_Test",
            "fields_handler": "fields_Test"
        },
        "stewart":{
            "title":"Stewart potentials",
            "desc":"Compute stewart potentials...",
            "menu_factory": "fillMenu_Stewart",
            "fields_handler": "fields_Stewart"
            },
        "prop_symbol":{
            "title":"Proportional symbols",
            "menu_factory": "fillMenu_PropSymbol",
            "desc":"Display proportional symbols with appropriate discretisation on a numerical field of your data",
            "fields_handler": "fields_PropSymbol"
            },
        "prop_symbol_choro":{
            "title":"Proportional colored symbols",
            "menu_factory": "fillMenu_PropSymbolChoro",
            "desc":"Display proportional symbols and choropleth coloration of the symbols on two numerical fields of your dataset with an appropriate discretisation",
            "fields_handler": "fields_PropSymbolChoro"
            },
        "choropleth":{
            "title":"Choropleth map",
            "menu_factory": "fillMenu_Choropleth",
            "desc":"Render a choropleth map on a numerical field of your data",
            "fields_handler": "fields_Choropleth"
            },
        "cartogram":{
            "title":"Anamorphose map",
            "menu_factory": "fillMenu_Anamorphose",
            "desc":"Render a map using an anamorphose algorythm on a numerical field of your data",
            "fields_handler": "fields_Anamorphose",
            "add_options": "keep_file"
            },
        "grid_map":{
            "title":"Gridded map",
            "menu_factory": "fillMenu_griddedMap",
            "desc":"Render a gridded map on a numerical field of your data",
            "fields_handler": "fields_griddedMap"
            },
        "mta":{
            "title":"Multiscalar Territorial Analysis",
            "menu_factory": "fillMenu_MTA",
            "desc":"Compute and render various methods of multiscalar territorial analysis",
            "fields_handler": "fields_MTA"
            },
        "flows_map":{
            "title":"Link/FLow map",
            "menu_factory": "fillMenu_FlowMap",
            "desc": "Render a map displaying links between features with graduated sizes",
            "fields_handler": "fields_FlowMap"
            }

    };
    return menu_option[func.toLowerCase()] || {}
}


var fields_FlowMap = {
    fill: function(layer){
        if(joined_dataset.length > 0){
            let fields = Object.getOwnPropertyNames(joined_dataset[0][0]),
                field_i = d3.select('#FlowMap_field_i'),
                field_j = d3.select('#FlowMap_field_j'),
                field_fij = d3.select('#FlowMap_field_fij');
    
            fields.forEach(function(field){
                field_i.append("option").text(field).attr("value", field);
                field_j.append("option").text(field).attr("value", field);
                field_fij.append("option").text(field).attr("value", field);
            });
        }
        if(layer){
            let ref_fields = Object.getOwnPropertyNames(user_data[layer][0]),
                join_field = d3.select('#FlowMap_field_join');
    
            ref_fields.forEach(function(field){
                join_field.append("option").text(field).attr("value", field);
            });
        }
        if(layer || joined_dataset.length > 0)
            d3.selectAll(".params").attr("disabled", null);
    },

    unfill: function(){
        let field_i = document.getElementById('FlowMap_field_i'),
            field_j = document.getElementById('FlowMap_field_j'),
            field_fij = document.getElementById('FlowMap_field_fij'),
            join_field = document.getElementById('FlowMap_field_join');

        for(let i = field_i.childElementCount - 1; i > -1; --i){
            field_i.removeChild(field_i.children[i]);
            field_j.removeChild(field_j.children[i]);
            field_fij.removeChild(field_fij.children[i]);
        }
        unfillSelectInput(join_field)
        d3.selectAll(".params").attr("disabled", true);

    }
};


function fillMenu_FlowMap(){
    var dv2 = section2.append("p").attr("class", "form-rendering");
    dv2.append('p').html('<b>Links dataset fields :</b>');

    var field_i = dv2.append('p').html('<b><i> i </i></b> field :').insert('select').attr('class', 'params').attr("id", "FlowMap_field_i");
    var field_j = dv2.append('p').html('<b><i> j </i></b> field :').insert('select').attr('class', 'params').attr("id", "FlowMap_field_j");
    var field_fij = dv2.append('p').html('<b><i> fij </i></b> field :').insert('select').attr('class', 'params').attr("id", "FlowMap_field_fij");
    dv2.append('p').html('<b>Reference layer fields :</b>');
    var join_field = dv2.append('p').html('join field :').insert('select').attr('class', 'params').attr("id", "FlowMap_field_join");

    let ok_button = dv2.append('button')
                        .attr('id', 'yes')
                        .attr('class', 'params')
                        .attr('class', 'button_st2')
                        .text('Compute and render');

    d3.selectAll(".params").attr("disabled", true);

    ok_button.on("click", function(){
            let ref_layer = Object.getOwnPropertyNames(user_data)[0],
                name_join_field = join_field.node().value,
                formToSend = new FormData(),
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
                                   .style("stroke-width", function(d, i){ return prop_values[i]; });
                }
            });
    });
}

var fields_Test = {
    fill: function(layer){
        if(layer){
            d3.selectAll(".params").attr("disabled", null);
            let fields = type_col(layer, "number"),
                nb_features = user_data[layer].length,
                field_selec = d3.select("#Test_field");
    
            fields.forEach(function(field){
                field_selec.append("option").text(field).attr("value", field);
            });
        }
    },
    unfill: function(){
        let field_selec = document.getElementById("#Test_field");
        unfillSelectInput(field_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
};

function fillMenu_Test(){
    let random_color = Colors.random();
    var dialog_content = section2.append("div").attr("class", "form-rendering"),
        field_selec = dialog_content.append('p').html('Field :').insert('select').attr({class: 'params', id: 'Test_field'});

    dialog_content.insert("p").style({"text-align": "right", margin: "auto"})
        .append("button")
        .attr({id: 'Test_yes', class: "params button_st2"})
        .html('"Compute"...')
        .on("click", function(){
            let layer = Object.getOwnPropertyNames(user_data)[0],
                nb_features = user_data[layer].length,
                field_name = field_selec.node().value,
                formToSend = new FormData(),
                var_to_send = new Object();

            var_to_send[field_name] = user_data[layer].map(i => +i[field_name]);
            formToSend.append("json", JSON.stringify({
                "topojson": layer,
                "var_name": JSON.stringify(var_to_send) }))
    
            $.ajax({
                processData: false,
                contentType: false,
                cache: false,
                url: '/R_compute/nothing',
                data: formToSend,
                type: 'POST',
                error: function(error) { console.log(error); },
                success: function(data){
                    add_layer_topojson(data, {result_layer_on_add: true});
                    let n_layer_name = ["Nope", field_name].join('_');
                    current_layers[n_layer_name] = new Object();
                    current_layers[n_layer_name].colors = [];
                    current_layers[n_layer_name]['stroke-width-const'] = "0.4px"
                    current_layers[n_layer_name].renderer = "None";
                    current_layers[n_layer_name].rendered_field = field_name;
                    makeButtonLegend(n_layer_name);
                }
            });
        });
}

var fields_PropSymbolChoro = {
    fill: function(layer){
        if(!layer) return;
        d3.selectAll(".params").attr("disabled", null);
        let fields = type_col(layer, "number"),
            nb_features = user_data[layer].length,
            field1_selec = d3.select("#PropSymbolChoro_field_1"),
            field2_selec = d3.select("#PropSymbolChoro_field_2");

        fields.forEach(function(field){
            field1_selec.append("option").text(field).attr("value", field);
            field2_selec.append("option").text(field).attr("value", field);
        });
    
    },
    unfill: function(){
        let field1_selec = document.getElementById("PropSymbolChoro_field_1"),
            field2_selec = document.getElementById("PropSymbolChoro_field_2");

        for(let i = field1_selec.childElementCount - 1; i >= 0; i--){
            field1_selec.removeChild(field1_selec.children[i]);
            field2_selec.removeChild(field2_selec.children[i]);
        }
        d3.selectAll(".params").attr("disabled", true);
    }
};


function fillMenu_PropSymbolChoro(layer){
    var rendering_params = new Object(),
        dv2 = section2.append("p").attr("class", "form-rendering");

    var field1_selec = dv2.append('p').html('First field (symbol size):').insert('select').attr('class', 'params').attr('id', 'PropSymbolChoro_field_1');
    var max_size = dv2.append('p').style("display", "inline").html('Max. size (px)')
                                 .insert('input')
                                 .attr({type: 'range', class: 'params', id: 'PropSymbolChoro_max_size'})
                                 .attr({min: 0.2, max: 66.0, value: 10.0, step: 0.1})
                                 .style("width", "8em")
                                 .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dv2.append('label-item').attr("id", "max_size_txt").html('0 px');

    var ref_size = dv2.append('p').html('Reference (fixed) size (px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params').attr('id', 'PropSymbolChoro_ref_size')
                                 .attr({min: 0.1, max: 66.0, value: 0.5, step: 0.1});

    // Other symbols could probably easily be proposed :
    var symb_selec = dv2.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    [['Circle', "circle"], ['Square', "rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value", symb[1]);});

    var field2_selec = dv2.append('p').html('Second field (symbol color):').insert('select').attr('class', 'params').attr('id', 'PropSymbolChoro_field_2');

    dv2.insert('p').style("margin", "auto").html("")
                .append("button").attr('class', 'params')
                .html("Choose a discretization ...")
                .on("click", function(){
                    let layer = Object.getOwnPropertyNames(user_data)[0],
                        opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length))

                    display_discretization(layer, field2_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){ if(confirmed){
                            dv2.select('#yes').attr("disabled", null);
                            rendering_params = {
                                nb_class: confirmed[0], type: confirmed[1],
                                breaks: confirmed[2], colors: confirmed[3],
                                colorsByFeature: confirmed[4], renderer: "PropSymbolsChoro"
                                }
                            console.log(rendering_params)
                            } else { return; } });
                });


    var ok_button = dv2.insert("p").style({"text-align": "right", margin: "auto"})
                        .append('button')
                        .attr('id', 'yes')
                        .attr('class', 'params button_st2')
                        .attr('disabled', true)
                        .text('Render');

    ok_button.on("click", function(){
        if(rendering_params){
            let layer = Object.getOwnPropertyNames(user_data)[0],
                nb_features = user_data[layer].length,
                rd_params = new Object();

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
        }
    });
    d3.selectAll(".params").attr("disabled", true);
}

var fields_Choropleth = {
    fill: function(layer){
        if(!layer) return;
        let g_lyr_name = "#"+layer,
            fields = type_col(layer, "number"),
            field_selec = d3.select("#choro_field_1");

        if(fields.length === 0){
            alert("The targeted layer doesn't seems to contain any numerical field or contains too many empty values");
            return;
        }
        field_selec.attr("disabled", null);
        fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
        document.getElementById("choro_class").removeAttribute("disabled");
        document.getElementById("choro_yes").removeAttribute("disabled");
    },

    unfill: function(){
        let field_selec = document.getElementById("choro_field_1"),
            nb_fields = field_selec.childElementCount;

        for(let i = nb_fields - 1; i > -1 ; --i)
            field_selec.removeChild(field_selec.children[i]);

        field_selec.setAttribute("disabled", true);
        document.getElementById("choro_class").setAttribute("disabled", true);
        document.getElementById("choro_yes").setAttribute("disabled", true);
    }
};

function fillMenu_Choropleth(){
    var dv2 = section2.append("p").attr("class", "form-rendering"),
        rendering_params = new Object();

    var field_selec = dv2.append('p').html('Field :')
                        .insert('select')
                            .attr('class', 'params')
                            .attr('id', 'choro_field_1')
                            .attr("disabled", true);

    dv2.insert('p').style("margin", "auto").html("")
        .append("button")
        .attr("id", "choro_class")
        .attr("disabled", true)
        .html("Display and arrange class")
        .on("click", function(){
            let layer_name = Object.getOwnPropertyNames(user_data)[0],
                opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer_name].length))
            display_discretization(layer_name, field_selec.node().value, opt_nb_class, "Quantiles")
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

    dv2.insert("p").style({"text-align": "right", margin: "auto"})
        .append("button")
        .attr('id', 'choro_yes')
        .attr('class', 'button_st2')
        .attr("disabled", true)
        .html('Render')
        .on("click", function(){
            if(rendering_params){
                let layer = Object.getOwnPropertyNames(user_data)[0];
                render_choro(layer, rendering_params);
                makeButtonLegend(layer);
            }
         });
}

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
                field2_selec.append("option").text(field).attr("value", field)
            });
            fields_all.forEach(function(field){
                field_key_agg.append("option").text(field).attr("value", field)
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
                param_name = param_global_dev.node().value == "dist" ? "dist" : "order",
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

    var MTA_methods = [["Global Deviation", "global_dev"],
                       ["Medium deviation", "medium_dev"],
                       ["Local deviation", "local_dev"]];

    var dv2 = section2.append("p").attr("class", "form-rendering");

    var method_selec = dv2.append("p").style("margin", "auto").html("Analysis method")
                            .insert("select").attr("class", "params");
    MTA_methods.forEach(function(method){ method_selec.append("option").text(method[0]).attr("value", method[1]) });
    // TODO : (de)activate the appropriates options according to the selected method (key / ref / etc.)
    var field1_selec = dv2.append("p").html("First field :").insert("select").attr("class", "params").attr("id", "MTA_field_1");
    var field2_selec = dv2.append("p").html("Second field :").insert("select").attr("class", "params").attr("id", "MTA_field_2");
    var field_key_agg = dv2.append("p").html("Aggregation key field :").insert("select").attr("class", "params").attr("id", "MTA_field_key_agg").attr("disabled", true);
    var ref_ratio = dv2.append("p").html("Reference ratio :")
                                    .insert("input").attr({type: "number", min: 0, max: 10000000, step: 0.1});
    var type_deviation = dv2.append("p").html("Type of deviation").insert("select").attr("class", "params");
    [["Relative deviation", "rel"],
     ["Absolute deviation", "abs"],
     ["Compute both", "both"]].forEach(function(type_dev){ type_deviation.append("option").text(type_dev[0]).attr("value", type_dev[1])});

    var a = dv2.append('div').style("margin-bottom", "15px");

    var param_global_dev = a.insert("select").attr("class", "params").attr("disabled", true).style({"background-color": "#e5e5e5", "border-color": "transparent"});
    [["Distance defining the contiguity", "dist"],
     ["Contiguity order", "order"]].forEach(function(param){  param_global_dev.append("option").text(param[0]).attr("value", param[1])  });

    var val_param_global_dev = a.insert('input').style("width", "85px").attr({type: "number", min: 0, max:1000000, step:1}).attr("disabled", true);

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
    var ok_button = dv2.insert("p").style({"text-align": "right", margin: "auto"})
        .append("button")
        .attr("value", "yes")
        .attr("id", "yes")
        .attr("class", "params button_st2")
        .html("Compute and render");


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
                            let new_lyr_name = ["MTA", "AbsoluteDev", var1_name, var2_name].join('_'),
                                rendering_params = {
                                    new_name: new_lyr_name,
                                    field: field_name,
                                    nb_features: nb_features,
                                    ref_layer_name: layer,
                                    symbol: "circle",
                                    max_size: 22,
                                    ref_size: 0.1,
                                    fill_color: Colors.random()
                                    };
                            let ret_val = make_prop_symbols(rendering_params);
                            current_layers[new_lyr_name].renderer = "PropSymbols_MTA";
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
    });

}

var fields_Stewart = {
    fill: function(layer){
        let other_layers = get_other_layer_names(),
            mask_selec = d3.select("#stewart_mask");

        unfillSelectInput(mask_selec);
        mask_selec.append("option").text("None").attr("value", "None");
        for(let lyr_name of other_layers)
            if(current_layers[lyr_name].type === "Polygon")
                mask_selec.append("option").text(lyr_name).attr("value", lyr_name);

        if(layer){
            let fields = type_col(layer, "number"),
                field_selec = d3.select("#stewart_field");
            fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
        }
        d3.selectAll(".params").attr("disabled", null);
    },

    unfill: function(){
        let field_selec = document.getElementById("stewart_field");
        unfillSelectInput(mask_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
};

function fillMenu_Stewart(){
    var dialog_content = section2.append("div").attr("class", "form-rendering"),
        field_selec = dialog_content.append('p').style("margin", "auto").html('Field :').insert('select').attr('class', 'params marg_auto').attr("id", "stewart_field"),
        span = dialog_content.append('p').html('Span :').insert('input').attr({type: 'number', class: 'params', id: "stewart_span", value: 0, min: 0, max: 100000, step: 0.1}),
        beta = dialog_content.append('p').html('Beta :').insert('input').attr({type: 'number', class: 'params', id: "stewart_beta", value: 0, min: 0, max: 11, step: 0.1}),
        resolution = dialog_content.append('p').html('Resolution :').insert('input').attr({type: 'number', class: 'params', id: "stewart_resolution", value: 0, min: 0, max: 1000000, step: 0.1}),
        func_selec = dialog_content.append('p').html('Function type :').insert('select').attr({class: 'params', id: "stewart_func"}),
        mask_selec = dialog_content.append('p').html('Clipping mask layer (opt.) :').insert('select').attr({class: 'params', id: "stewart_mask"});

    ['Exponential', 'Pareto'].forEach(function(fun_name){
        func_selec.append("option").text(fun_name).attr("value", fun_name);
    });


    dialog_content.insert("p").style({"text-align": "right", margin: "auto"})
        .append('button')
        .attr('id', 'stewart_yes')
        .attr('class', "params button_st2")
        .text('Compute')
        .on('click', function(){
            let formToSend = new FormData(),
                field_n = field_selec.node().value,
                var_to_send = new Object,
                layer = Object.getOwnPropertyNames(user_data)[0];

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
        });
    d3.selectAll(".params").attr("disabled", true);
}

var fields_Anamorphose = {
    fill: function(layer){
        if(!layer) return;
        let fields = type_col(layer, "number"),
            field_selec = d3.select("#Anamorph_field");
        d3.selectAll(".params").attr("disabled", null);
        fields.forEach(function(field){
            field_selec.append("option").text(field).attr("value", field);
        });
    },
    unfill: function(){
        let field_selec = document.getElementById("Anamorph_field");
        d3.selectAll(".params").attr("disabled", true);
        unfillSelectInput(field_selec);
    }
}


function fillMenu_Anamorphose(){

    var make_opt_dorling = function(){
        option1_txt.html('Symbol type');
        option1_val = option1_txt.insert("select").attr({class: "params", id: "Anamorph_opt"});

        symbols.forEach(function(symb){
            option1_val.append("option").text(symb[0]).attr("value", symb[1]);
        });
    };

    var make_opt_iter = function(){
        option1_txt.html('N. iterations');
        option1_val = option1_txt.insert('input')
                        .attr({type: 'number', class: 'params', value: 5, min: 1, max: 12, step: 1});
    };

    var dialog_content = section2.append("div").attr("class", "form-rendering"),
        algo_selec = dialog_content.append('p').html('Algorythm to use :').insert('select').attr('class', 'params'),
        field_selec = dialog_content.append('p').html('Field :').insert('select').attr({class: 'params', id: 'Anamorph_field'}),
        option1_txt = dialog_content.append('p').attr("id", "Anamorph_opt_txt").html('Symbol type'),
        option1_val = option1_txt.insert("select").attr({class: "params", id: "Anamorph_opt"});

    var symbols = [["Circle", "circle"], ["Square", "rect"]];

    symbols.forEach(function(symb){
        option1_val.append("option").text(symb[0]).attr("value", symb[1]);
    });

    algo_selec.on("change", function(){
        if(this.value == "dorling")
            make_opt_dorling();
        else
            make_opt_iter();
    });

    [['Pseudo-Dorling', 'dorling'],
     ['Dougenik & al. (1985)', 'dougenik'],
     ['Gastner & Newman (2004)', 'gastner']].forEach(function(fun_name){
        algo_selec.append("option").text(fun_name[0]).attr("value", fun_name[1]); });

    dialog_content.insert("p").style({"text-align": "right", margin: "auto"})
        .append("button")
        .attr({id: 'Anamorph_yes', class: "params button_st2"})
        .html('Compute')
        .on("click", function(){
            let layer = Object.getOwnPropertyNames(user_data)[0],
                algo = algo_selec.node().value,
                nb_features = user_data[layer].length,
                field_name = field_selec.node().value;
            if(algo === "gastner"){
                alert('Not implemented (yet!)')
            } else if (algo === "dougenik"){
                let formToSend = new FormData(),
                    field_n = field_selec.node().value,
                    layer = Object.getOwnPropertyNames(user_data)[0],
                    var_to_send = new Object(),
                    nb_iter = option1_val.node().value;
    
                var_to_send[field_name] = user_data[layer].map(i => +i[field_name]);
                formToSend.append("json", JSON.stringify({
                    "topojson": layer,
                    "var_name": JSON.stringify(var_to_send),
                    "iterations": nb_iter }))
        
                $.ajax({
                    processData: false,
                    contentType: false,
                    cache: false,
                    url: '/R_compute/carto_doug',
                    data: formToSend,
                    type: 'POST',
                    error: function(error) { console.log(error); },
                    success: function(data){
                        add_layer_topojson(data, {result_layer_on_add: true});
                        let n_layer_name = ["Carto_doug", nb_iter, field_name].join('_');
                        current_layers[n_layer_name] = new Object();
                        current_layers[n_layer_name].colors = [];
                        current_layers[n_layer_name].type = "Polygon";
                        current_layers[n_layer_name].is_result = true;
                        current_layers[n_layer_name]['stroke-width-const'] = "0.8px"
                        current_layers[n_layer_name].renderer = "Carto_doug";
                        current_layers[n_layer_name].rendered_field = field_name;
                        d3.select("#" + n_layer_name)
                            .selectAll("path")
                            .style("fill", function(){ return Colors.random(); })
                            .style("fill-opacity", 0.8)
                            .style("stroke", "black")
                            .style("stroke-opacity", 0.8)
                        makeButtonLegend(n_layer_name);
                    }
                });
//                let carto = d3.cartogram().projection(d3.geo.naturalEarth()).properties(function(d){return d.properties;}),
//                    geoms = _target_layer_file.objects[layer].geometries,
//                    let random_color = Colors.random();
//
//                carto.value(function(d, i){
//                        return +user_data[layer][i][field_name]; });
//
//                let new_features = carto(_target_layer_file, geoms).features,
//                    new_layer_name = layer + "_Dougenik_Cartogram";
//                console.log(geoms);
//                console.log(new_features);
//                map.append("g")
//                    .attr("id", new_layer_name)
//                    .attr("class", "result_layer layer")
//                    .style({"stroke-linecap": "round", "stroke-linejoin": "round"})
//                    .selectAll(".subunit")
//                    .data(new_features)
//                    .enter().append("path")
//                        .attr("d", path)
//                        .attr("id", function(d, ix) { return "feature_" + ix; })
//                        .style("stroke", "black")
//                        .style("stroke-opacity", .4)
//                        .style("fill", random_color)
//                        .style("fill-opacity", 0.5)
//                        .attr("height", "100%")
//                        .attr("width", "100%");
//
//                let class_name = "ui-state-default sortable_result " + new_layer_name,
//                    layers_listed = layer_list.node(),
//                    li = document.createElement("li");
//    
//                li.setAttribute("class", class_name);
//                li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_active, button_type_blank['Polygon'], "</div> ", new_layer_name].join('')
//                layers_listed.insertBefore(li, layers_listed.childNodes[0])
//                current_layers[new_layer_name] = {
//                    "renderer": "DougenikCarto",
//                    "rendered_field": field_name,
//                    "stroke-width-const": "1px",
//                    "is_result": true,
//                    "ref_layer_name": layer
//                    };
//                binds_layers_buttons();
//                zoom_without_redraw();
//                makeButtonLegend(new_layer_name);

            } else if (algo === "dorling"){
                let ref_layer_selection  = d3.select("#"+layer).selectAll("path"),
                    d_values = new Array(nb_features),
                    zs = zoom.scale(),
                    max_size = 25,
                    ref_size = 0.1,
                    shape_symbol = option1_val.node().value,
                    symbol_layer = undefined,
                    force = d3.layout.force().charge(0).gravity(0).size([w, h]);

                for(let i = 0; i < nb_features; ++i){
                    d_values[i] = +user_data[layer][i][field_name];
                }
                d_values = prop_sizer(d_values, Number(ref_size / zs), Number(max_size / zs));

                let nodes = ref_layer_selection[0].map(function(d, i){
                    let pt = path.centroid(d.__data__.geometry);
                    return {x: pt[0], y: pt[1],
                            x0: pt[0], y0: pt[1],
                            r: +d_values[i],
                            value: +d.__data__.properties[field_name]};
                    });

                let bg_color = Colors.random(),
                    stroke_color = "black",
                    layer_to_add =  ["DorlingCarto", layer, field_name].join('_');
    
                if(current_layers[layer_to_add]){
                    remove_layer_cleanup(layer_to_add);
                    d3.selectAll('#' + layer_to_add).remove();
                }

                force.nodes(nodes).on("tick", tick).start();

                if(shape_symbol == "circle") {
                    symbol_layer = map.append("g").attr("id", layer_to_add)
                                      .attr("class", "result_layer layer")
                                      .selectAll("circle")
                                      .data(nodes).enter()
                                      .append("circle")
                                        .attr("r", function(d){ return d.r; })
                                        .style("fill", function(){ return Colors.random();})
                                        .style("stroke", "black");
                } else {
                    symbol_layer = map.append("g").attr("id", layer_to_add)
                                      .attr("class", "result_layer layer")
                                      .selectAll("rect")
                                      .data(nodes).enter()
                                      .append("rect")
                                        .attr("height", function(d){ return d.r * 2; })
                                        .attr("width", function(d){ return d.r * 2; })
                                        .style("fill", function(){ return Colors.random();})
                                        .style("stroke", "black");

                }

                function tick(e){
                    if(shape_symbol == "circle"){
                        symbol_layer.each(gravity(e.alpha * 0.1))
                            .each(collide(.5))
                            .attr("cx", function(d){ return d.x })
                            .attr("cy", function(d){ return d.y })
                    } else {
                        symbol_layer.each(gravity(e.alpha * 0.1))
                            .each(collide(.5))
                            .attr("x", function(d){ return d.x - d.r})
                            .attr("y", function(d){ return d.y - d.r})
                    }
                }

                function gravity(k) {
                    return function(d) {
                        d.x += (d.x0 - d.x) * k;
                        d.y += (d.y0 - d.y) * k;
                    };
                }

                function collide(k) {
                    var q = d3.geom.quadtree(nodes);
                    if(shape_symbol == "circle"){
                        return function(node) {
                            let nr = node.r,
                                nx1 = node.x - nr,
                                nx2 = node.x + nr,
                                ny1 = node.y - nr,
                                ny2 = node.y + nr;
                            q.visit(function(quad, x1, y1, x2, y2) {
                                if (quad.point && (quad.point !== node)) {
                                    let x = node.x - quad.point.x,
                                        y = node.y - quad.point.y,
                                        l = x * x + y * y,
                                        r = nr + quad.point.r;
                                    if (l < r * r) {
                                        l = ((l = Math.sqrt(l)) - r) / l * k;
                                        node.x -= x *= l;
                                        node.y -= y *= l;
                                        quad.point.x += x;
                                        quad.point.y += y;
                                    }
                                }
                                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                            });
                        };
                    } else {
                        return function(node) {
                            let nr = node.r,
                                nx1 = node.x - nr,
                                nx2 = node.x + nr,
                                ny1 = node.y - nr,
                                ny2 = node.y + nr;
                            q.visit(function(quad, x1, y1, x2, y2) {
                                if (quad.point && (quad.point !== node)) {
                                    let x = node.x - quad.point.x,
                                        y = node.y - quad.point.y,
                                        lx = Math.abs(x),
                                        ly = Math.abs(y),
                                        r = nr + quad.point.r;
                                    if (lx < r && ly < r) {
                                        if(lx > ly){
                                            lx = (lx - r) * (x < 0 ? -k : k);
                                            node.x -= lx;
                                            quad.point.x += lx;
                                        } else {
                                            ly = (ly - r) * (y < 0 ? -k : k);
                                            node.y -= ly;
                                            quad.point.y += ly;
                                        }
                                    }
                                }
                                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                            });
                        };
                    }
                }

                let class_name = "ui-state-default sortable_result " + layer_to_add,
                    layers_listed = layer_list.node(),
                    li = document.createElement("li");
    
                li.setAttribute("class", class_name);
                li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_active, button_type_blank['Point'], "</div> ", layer_to_add].join('')
                layers_listed.insertBefore(li, layers_listed.childNodes[0])
                current_layers[layer_to_add] = {
                    "renderer": "DorlingCarto",
                    "type": "Point",
                    "symbol": shape_symbol,
                    "rendered_field": field_name,
                    "size": [ref_size, max_size],
                    "stroke-width-const": "1px",
                    "is_result": true,
                    "ref_layer_name": layer
                    };
    
                binds_layers_buttons();
                zoom_without_redraw();
                makeButtonLegend(layer_to_add);
                }
    });
    d3.selectAll(".params").attr("disabled", true);
}

function log_unused_ft(layer){
    if(current_layers[layer].filter_not_use instanceof Map)
        var filter_not_use = current_layers[layer].filter_not_use;
    else {
        current_layers[layer].filter_not_use = new Map();
        var filter_not_use = current_layers[layer].filter_not_use
    }
    $('#myTable tbody tr').on('click', function(e) {
        let row = this,
            ret_val = row.classList.toggle('selected');
        if(ret_val)
            filter_not_use.set(row._DT_RowIndex, true)
        else
            filter_not_use.delete(row._DT_RowIndex)
    });
}

var boxExplore = {
    display_table: function(prop){
        let self = this,
            add_field = d3.select("#add_field_button"),
            unselect_features = d3.select("#unsel_features");
        if(prop.type === "ext_dataset"){
            var data_table = joined_dataset[0],
                the_name = dataset_name,
                message = "Switch to reference layer table...";
                unselect_features.style("display", "none").on('click', null);
                add_field.style("display", "none").on('click', null);
        } else if(prop.type === "layer"){
            var data_table = user_data[this.layer_name],
                the_name = this.layer_name,
                message = "Switch to external dataset table...";
                unselect_features.style("display", null).on('click', function(){
                    console.log(the_name);
                    log_unused_ft(the_name);
                  });
                add_field.style("display", null).on('click', function(){  add_table_field(the_name, self) });
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
        this.box_table.append("p").attr('id', 'table_intro').html(txt_intro.join(''))
        d3.selectAll('#myTable').remove()
        d3.selectAll('#myTable_wrapper').remove();
        this.box_table.append("table").attr({class: "display compact", id: "myTable"}).style({width: "80%", height: "80%"})
        let myTable = $('#myTable').DataTable({
            data: data_table,
            columns: this.columns_headers,
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
            let top_buttons = this.box_table.append('p').style({"margin-left": "15px", "display": "inline", "font-size": "12px"});
            top_buttons
                 .insert("button")
                 .attr({id: "add_field_button", class: "button_st3"})
                 .html("Add a new field...")
                 .on('click', function(){  add_table_field(the_name, self)  });
            top_buttons
                 .insert("button")
                 .attr({id: "unsel_features", class: "button_st3"})
                 .html("Remove features...")
                 .on('click', function(){
                    console.log(the_name);
                    log_unused_ft(the_name);
                  });

        }

        if(dataset_name != undefined && the_name != undefined)
            this.box_table.append('p')
                    .attr({id: "switch_button", class: "button_st3"})
                    .html("Switch to external dataset table...")
                    .on('click', function(){
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

var fields_PropSymbol = {
    fill: function(layer){
        if(!layer) return;
        d3.selectAll(".params").attr("disabled", null);
        let fields = type_col(layer, "number"),
            nb_features = user_data[layer].length,
            field_selec = d3.select("#PropSymbol_field_1");

        fields.forEach(function(field){
            field_selec.append("option").text(field).attr("value", field);
        });
    
    },

    unfill: function(){
        let field_selec = document.getElementById("PropSymbolChoro_field_1");
        unfillSelectInput(field_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
};

function fillMenu_PropSymbol(layer){
    var dialog_content = section2.append("p").attr("class", "form-rendering"),
        field_selec = dialog_content.append('p').html('Field :').insert('select').attr({class: 'params', 'id': "PropSymbol_field_1"}),
        max_allowed_size = Math.round(h/2 - h/20),
        max_size = dialog_content.append('p').style("display", "inline").html('Max. size (px)')
                         .insert('input')
                         .attr({type: 'range', class: 'params'})
                         .attr({min: 0.2, max: max_allowed_size, value: 10.0, step: 0.1})
                         .style("width", "8em")
                         .on("change", function(){ d3.select("#max_size_txt").html([this.value, " px"].join('')) });

    var max_size_txt = dialog_content.append('label-item').attr("id", "max_size_txt").html([max_size.node().value, " px"].join('')),
        ref_size = dialog_content.append('p').html('Reference minimum size (fixed size in px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params')
                                 .attr({min: 0.1, max: max_allowed_size - 0.5, value: 0.3, step: 0.1});

    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    [['Circle', "circle"], ['Square', "rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value", symb[1]);});

    var fill_color = dialog_content.append('p').html('Symbol color<br>')
              .insert('input').attr('type', 'color').attr("value", Colors.random());

    dialog_content.insert("p").style({"text-align": "right", margin: "auto"})
        .append('button')
        .attr('id', 'yes')
        .attr("class", "params button_st2")
        .html('Compute')
        .on("click", function(){
            let layer = Object.getOwnPropertyNames(user_data)[0],
                nb_features = user_data[layer].length,
                rendering_params = { "field": field_selec.node().value,
                                     "nb_features": nb_features,
                                     "ref_layer_name": layer,
                                     "symbol": symb_selec.node().value,
                                     "max_size": +max_size.node().value,
                                     "ref_size": +ref_size.node().value,
                                     "fill_color": fill_color.node().value },
                ret_val = make_prop_symbols(rendering_params);
            binds_layers_buttons();
            zoom_without_redraw();
            makeButtonLegend(layer + "_PropSymbols");
        });
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
            for(let i=0; i<nb_features; ++i){
                let idx = d_values[i][0];
                d_values[i].push(rendering_params.fill_color[idx]);
            }
        }

        if(current_layers[layer_to_add]){
            remove_layer_cleanup(layer_to_add);
            d3.selectAll('#' + layer_to_add).remove();
        }

        var symbol_layer = map.append("g").attr("id", layer_to_add)
                              .attr("class", "result_layer layer");

        console.log(d_values)

        if(symbol_type === "circle"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i];
                console.log(params[2])
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

var fields_griddedMap = {
    fill: function(layer){
        if(!layer) return;

        let fields = type_col(layer, "number"),
            field_selec = d3.select("#Gridded_field");

        fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
        d3.selectAll(".params").attr("disabled", null);
    },
    unfill: function(){
        let field_selec = document.getElementById("Gridded_field");
        unfillSelectInput(field_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
}

function fillMenu_griddedMap(layer){
    var dialog_content = section2.append("p").attr("class", "form-rendering"),
        field_selec = dialog_content.append('p').html('Field :').insert('select').attr({class: 'params', id: "Gridded_field"}),
        cellsize = dialog_content.append('p').html('Cell size <i>(meters)</i>').insert('input').attr({type: 'number', class: 'params', value: 0, min: 1000, max: 700000, step: 0.1}),
        col_pal = dialog_content.append('p').html('Colorramp :').insert('select').attr('class', 'params');

    ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn',
    'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(function(d, i){
            col_pal.append("option").text(d).attr("value", d);
    });

    dialog_content.insert("p").style({"text-align": "right", margin: "auto"})
            .append('button')
            .attr("class", "params button_st2")
            .attr('id', 'Gridded_yes')
            .html('Compute and render')
            .on("click", function(){
                let field_n = field_selec.node().value,
                    layer = Object.getOwnPropertyNames(user_data)[0],
                    formToSend = new FormData(),
                    var_to_send = new Object();
        
                var_to_send[field_n] = user_data[layer].map(i => +i[field_n])
        
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
            });
    d3.selectAll(".params").attr("disabled", true);
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

// Function returning the name of all current layers (excepted the sample layers used as layout)
function get_other_layer_names(){
    let other_layers = Object.getOwnPropertyNames(current_layers),
        tmp_idx = null;

    tmp_idx = other_layers.indexOf("Graticule");
    if(tmp_idx > -1) other_layers.splice(tmp_idx, 1);

    tmp_idx = other_layers.indexOf("Simplified_land_polygons");
    if(tmp_idx > -1) other_layers.splice(tmp_idx, 1);

    tmp_idx = other_layers.indexOf("Sphere");
    if(tmp_idx > -1) other_layers.splice(tmp_idx, 1);

    return other_layers;
}

// Function to remove each node (each <option>) of a <select> HTML element :
function unfillSelectInput(select_node){
    for(let i = select_node.childElementCount - 1; i > -1; i--)
        select_node.removeChild(select_node.children[i]);
}

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

// Function returning an array of values from "arr", normalized between "min_size" and "max_size"
function prop_sizer(arr, min_size, max_size){
    let min_values = Math.sqrt(Math.min.apply(0, arr)),
        max_values = Math.sqrt(Math.max.apply(0, arr)),
        dif_val = max_values - min_values,
        dif_size = max_size - min_size,
        len_arr = arr.length,
        res = new Array(len_arr);
    // Lets use "for" loop with pre-sized array (but maybe "push" method is faster ?)
    // as "map" and "forEach" seems to be sometimes slower in some browser
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

var type_col = function(layer_name, target, skip_if_empty_values=false){
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
                val_opt.attr("disabled", true);
                txt_op.text("");
                chooses_handler.operator = math_operation[0];
            } else {
                string_operation.forEach(function(op){ operator.append("option").text(op).attr("value", op); })
                for(let k in fields_type){
                    if(fields_type[k] == "string"){
                        field1.append("option").text(k).attr("value", k);
                        field2.append("option").text(k).attr("value", k);
                    }
                }
                val_opt.attr("disabled", null);
                txt_op.html("Character to join the two fields (can stay blank) :<br>");
                chooses_handler.operator = string_operation[0];
            }
            chooses_handler.field1 = field1.node().value;
            chooses_handler.field2 = field2.node().value;
    };

    var refresh_subtype_content = function(type, subtype){
        if(type != "string_field"){
            val_opt.attr("disabled", true);
            txt_op.text("")
        } else {
            if(subtype == "Truncate"){
                txt_op.html("Number of char to keep (from the left) :<br>");
                field2.attr("disabled", true);
            } else {
                txt_op.html("Character used to join the two fields (can stay blank) :<br>");
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
                            for(let i=0; i<data_layer.length; i++)
                                data_layer[i][new_name_field] = +eval([+data_layer[i][fi1], operation, +data_layer[i][fi2]].join(' '));

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
     ["Modification on a character field", "string_field"]]
        .forEach(function(d,i){ type_content.append("option").text(d[0]).attr("value", d[1]); });

    var field1 = div1.append("select").on("change", function(){ chooses_handler.field1 = this.value; console.log(this.value) }),
        operator = div1.append("select").on("change", function(){ chooses_handler.operator = this.value; refresh_subtype_content(chooses_handler.type_operation, this.value);}),
        field2 = div1.append("select").on("change", function(){ chooses_handler.field2 = this.value; });;

    var txt_op = div2.append("p").attr("id", "txt_opt").text(""),
        val_opt = div2.append("input").attr("id", "val_opt")
                        .attr("disabled", true)
                        .on("change", function(){ chooses_handler.opt_val = this.value;});

    var fields_type = type_col(layer),
        math_operation = ["+", "-", "*", "/"],
        string_operation = ["Concatenate", "Truncate"];

    return box;
}

var contains_empty_val = function(arr){
    for(let i = arr.length - 1; i > -1; --i)
        if(arr[i] == null) return true;
    return false
}