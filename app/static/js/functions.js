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
            "popup_factory": "createBoxExplore",
            "text_button": "Browse..."
            },
        "prop_symbol":{
            "title":"Proportional symbols",
            "popup_factory": "createFuncOptionsBox_PropSymbol",
            "desc":"Display proportional symbols with appropriate discretisation on a numerical field of your data",
            "text_button": "Choose options and create..."
            },
        "prop_symbol_choro":{
            "title":"Proportional symbols and Choropleth maps",
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
        "anamorphose":{
            "title":"Anamorphose map",
            "popup_factory": "createFuncOptionsBox_Anamorphose",
            "desc":"Render a map using an anamorphose algorythm on a numerical field of your data",
            "text_button": "Choose algo, options and render..."
            },
        "grid_map":{
            "title":"Gridded map",
            "popup_factory": "createBox_griddedMap",
            "desc":"Render a map using an anamorphose algorythm on a numerical field of your data",
            "text_button": "Choose options and render..."
            },
        "MTA":{
            "title":"Multiscalar Territorial Analysis",
            "popup_factory": "createBox_MTA",
            "desc":"Compute and render various methods of multiscalar territorial analysis",
            "text_button": "Choose algo, options and render..."
            },
        "flows_map":{
            "title":"Link/FLow map",
            "popup_factory": "createBox_FlowMap",
            "desc": "Render a map displaying link between features with graduated sizes",
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

    layer_name = layer_name[0];

    var modal = eval([
        get_menu_option(func).popup_factory, "(\"", layer_name, "\")"
            ].join(''));

    if(modal == undefined || modal.style == undefined)
        return
    else {
        modal.className += ' active';
        modal.style.position = 'fixed'
        modal.style.zIndex = 1;
        return center(modal);
    }
};

function createBox_MTA(layer){
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer.trim(),
        fields = type_col(layer, "number"),
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
    var method_selec = dialog_content.append("p").html("Analysis method").insert("select").attr("class", "params");
    MTA_methods.forEach(function(method){ method_selec.append("option").text(method[0]).attr("value", method[1]) });
    // TODO : (de)activate the appropriates options according to the selected method (key / ref / etc.)
    var field1_selec = dialog_content.append("p").html("First field :").insert("select").attr("class", "params");
    fields.forEach(function(field){ field1_selec.append("option").text(field).attr("value", field)});
    var field2_selec = dialog_content.append("p").html("Second field :").insert("select").attr("class", "params");
    fields.forEach(function(field){ field2_selec.append("option").text(field).attr("value", field)});
    var field_key_agg = dialog_content.append("p").html("Aggregation key field :").insert("select").attr("class", "params");
    fields.forEach(function(field){ field_key_agg.append("option").text(field).attr("value", field)});
    var ref_ratio = dialog_content.append("p").html("Reference ratio :")
                                    .insert("input").attr({type: "number", min: 0, max: 10000000, step: 0.1})
    var type_deviation = dialog_content.append("p").html("Type of deviation").insert("select").attr("class", "params");
    [["Relative deviation", "rel"],
     ["Absolute deviation", "abs"]].forEach(function(type_dev){ type_deviation.append("option").text(type_dev[0]).attr("value", type_dev[1])})

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length));

    var ok_button = dialog_content.append("button")
        .attr("value", "yes")
        .attr("disabled", true)
        .text("Compute and render");

    var cancel_button = dialog_content.append("button")
        .attr("value", "no")
        .text("Cancel");

    ok_button.on("click", function(){
        let table_to_send = new Object(),
            var1_name = field1_selec.node().value,
            var2_name = field2_selec.node().value;
        //table_to_send[var1_name] = [for (i of user_data[layer]) i[var1_name]];
        //table_to_send[var2_name] = [for (i of user_data[layer]) i[var2_name]];
        table_to_send[var1_name] = user_data[layer].map(i => i[var1_name]);
        table_to_send[var2_name] = user_data[layer].map(i => i[var2_name]);
        if(!field_key_agg.node().disabled){
            let key_name = field_key_agg.node().value;
            table_to_send[key_name] = user_data[layer].map(i => i[key_name]);
            //table_to_send[key_name] = [for (i of user_data[layer]) i[key_name]];
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
        g_lyr_name = "#"+layer.trim(),
        fields = type_col(layer, "number");

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
                                 .attr({min: 0.2, max: 333.0, value: +last_params.max_size || 5.0, step: 0.1})
                                 .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dialog_content.append('label-item').attr("id", "max_size_txt").html('0 px');

    var ref_size = dialog_content.append('p').html('Reference (fixed) size (px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params')
                                 .attr({min: 0.1, max: 333.0, value: +last_params.ref_size_val || 1.0, step: 0.1});

    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    [['Circle', "circle"], ['Square', "rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value", symb[1]);});

    var field2_selec = dialog_content.append('p').html('Second field (symbol color):').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field2_selec.append("option").text(field).attr("value", field); });

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length));

    dialog_content.insert('p').style("margin", "auto").html("")
                .append("button").html("Choose your discretization ...")
                .on("click", function(){
                    display_discretization(layer, field2_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){ if(confirmed){
//                            console.log(confirmed);
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

        var d_values = [],
            comp = function(a, b){return b[1]-a[1]},
            ref_layer_selection  = d3.select(g_lyr_name).selectAll("path");

        for(let i = 0, i_len = user_data[layer].length, field = field1_selec.node().value; i < i_len; ++i){
            let centr = path.centroid(ref_layer_selection[0][i].__data__);
            d_values.push([i, +user_data[layer][i][field], centr]);
        }

        d_values = prop_sizer2(d_values, Number(ref_size.node().value / zoom.scale()), Number(max_size.node().value / zoom.scale()));

        for(let i = 0, i_len = d_values.length; i < i_len; ++i)
            d_values[i].push(rendering_params['colorsByFeature'][i])

        d_values.sort(comp);
        console.log(d_values);
        /*
            Values have been sorted (descendant order) to have larger symbols
            displayed under the smaller, so now d_values is an array like :
            [
             [id_ref_feature, value, [x_centroid, y_centroid], color],
             [id_ref_feature, value, [x_centroid, y_centroid], color],
             [id_ref_feature, value, [x_centroid, y_centroid], color],
             [...]
            ]
        */

        var layer_to_add = layer + "_PropSymbolsChoro",
            symbol_type = symb_selec.node().value;

        if(current_layers[layer_to_add]){
            remove_layer_cleanup(layer_to_add);
            d3.selectAll('#' + layer_to_add).remove();
        }

        symbol_layer = map.append("g").attr("id", layer_to_add)
                              .attr("class", "result_layer layer");

        if(symbol_type === "circle"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i];
                symbol_layer.append('circle')
                    .attr('cx', params[2][0])
                    .attr("cy", params[2][1])
                    .attr("r", ref_size.node().value / zoom.scale() + params[1])
                    .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                    .style("fill", params[3])
                    .style("stroke", "black")
                    .style("stroke-width", 1 / zoom.scale());
            }
        } else if(symbol_type === "rect"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i],
                    size = ref_size.node().value / zoom.scale() + params[1];

                symbol_layer.append('rect')
                    .attr('x', params[2][0] - size/2)
                    .attr("y", params[2][1] - size/2)
                    .attr("height", size)
                    .attr("width", size)
                    .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                    .style("fill", params[3])
                    .style("stroke", "black")
                    .style("stroke-width", 1 / zoom.scale());
            };
        }

        d3.select("#layer_menu")
              .append('p').html('<a href>- ' + layer_to_add+"</a>");

        class_name = "ui-state-default sortable_result " + layer_to_add
        layers_listed = layer_list.node()
        var li = document.createElement("li");
        li.setAttribute("class", class_name);
        li.innerHTML = ['<div class="layer_buttons">', button_style, button_trash, button_zoom_fit, button_active, "</div> ", "Point", " - ", layer_to_add].join('')
        layers_listed.insertBefore(li, layers_listed.childNodes[0]);
        let colors_breaks = [];
        for(let i = 0; i<rendering_params['breaks'].length-1; ++i){colors_breaks.push([rendering_params['breaks'][i] + " - " + rendering_params['breaks'][i+1], rendering_params['colors'][i]])}

        current_layers[layer_to_add] = {
            renderer: "PropSymbolsChoro",
            symbol: symbol_type,
            rendered_field: field1_selec.node().value,
            rendered_field2: field2_selec.node().value,
            size: [ref_size.node().value, max_size.node().value],
            "stroke-width-const": "1px",
            colors: rendering_params['colorsByFeature'],
            colors_breaks: colors_breaks
            }
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
        //join_field_to_send[name_join_field] = [for (obj of user_data[ref_layer]) obj[name_join_field]];
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
                add_layer_fun(data, {result_layer_on_add: true});
                let new_layer_name = ["Links_", name_join_field].join(""),
                    layer_to_render = d3.select("#" + new_layer_name).selectAll("path"),
                    fij_field_name = field_fij.node().value,
                    fij_values = joined_dataset[0].map(obj => obj[fij_field_name]),
                    //fij_values = [for (ob of joined_dataset[0]) ob['fij']],
                    prop_values = prop_sizer(fij_values, 0.5 / zoom.scale(), 20 / zoom.scale());
                current_layers[new_layer_name].fixed_stroke = true;
                current_layers[new_layer_name].renderer = "Links";
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
         g_lyr_name = "#"+layer.trim(),
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
        //var_to_send[field_n] = [for (i of user_data[layer]) +i[field_n]];
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
                    add_layer_fun(raw_topojson, {result_layer_on_add: true});
                }
                col_pal = getColorBrewerArray(class_lim.min.length, "Purples")
                var col_map = new Map(),
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
                d3.select("#"+n_layer_name).selectAll("path").style("fill", function(d, i){
                                                                let k = Math.round(d.properties.min * 100) / 100;
                                                                    col = col_map.get(k);
                                                                current_layers[n_layer_name].colors[i] = col;
                                                                return col; })
                                                             .style("stroke", function(d, i){
                                                                let k = Math.round(d.properties.min * 100) / 100;
                                                                return col_map.get(k); })
                makeButtonLegend(n_layer_name);
                                        
            }
        });
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}

function createFuncOptionsBox_Anamorphose(layer_name){
    if(current_layers[layer].type !== "Polygon"){
        alert("Anamorphose can currently only be computed on polygons");
        return;
    }
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+layer.trim(),
        fields = type_col(layer, "number");

     bg.className = 'overlay';
     nwBox.id = [layer, '_anamorphose_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_popup'].join(''));
    dialog_content.append('h3').html('Anamorphose transformation');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
    var iterations = dialog_content.append('p').html('N. interations :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', last_params.iterations || 5).attr("min", 1).attr("max", 12).attr("step", 1);
    var algo_selec = dialog_content.append('p').html('Algorythm to use :').insert('select').attr('class', 'params');
    ['Dougenik & al. (1985)', 'Gastner & Newman (2004)', 'Dorling (1996)'].forEach(function(fun_name){func_selec.append("option").text(fun_name).attr("value", fun_name);});

    dialog_content.append('button').attr('id', 'yes').text('Compute')
    dialog_content.append('button').attr('id', 'no').text('Close');

}

function createBoxExplore(){
    var display_table = function(prop){
        if(prop.type === "ext_dataset"){
            var data_table = joined_dataset[0],
                the_name = dataset_name,
                message = "Switch to reference layer table...";
        } else if(prop.type === "layer"){
            var data_table = user_data[layer_name],
                the_name = layer_name,
                message = "Switch to external dataset table...";

        }
        nb_features = data_table.length;
        columns_names = Object.getOwnPropertyNames(data_table[0]);
        columns_headers = [];
        for(var i=0, len = columns_names.length; i<len; ++i)
            columns_headers.push({data: columns_names[i], title: columns_names[i]})
        txt_intro = ["<b>", the_name, "</b><br>",
                     nb_features, " features - ",
                     columns_names.length, " fields"];
        d3.selectAll('#table_intro').remove()
        box_table.append("p").attr('id', 'table_intro').style("text-align", "center").html(txt_intro.join(''))
        d3.selectAll('#myTable').remove()
        d3.selectAll('#myTable_wrapper').remove();
        box_table.append("table").attr({class: "display compact", id: "myTable"}).style({width: "80%", height: "80%"})
        $('#myTable').DataTable({
            data: data_table,
            columns: columns_headers
        });
        if(switch_button) d3.select("#switch_button").node().innerHTML = message;
    };

    var layer_name = Object.getOwnPropertyNames(user_data)[0];
    var columns_headers = [],
        nb_features = undefined,
        columns_names = undefined,
        current_table = undefined;

    var box_table = d3.select("body").append("div")
                        .attr({id: "browse_data_box", title: "Explore dataset"})
                        .style("font-size", "0.8em");

    if(!layer_name) current_table = "ext_dataset";
    else current_table = "layer";

    if(dataset_name != undefined && layer_name != undefined){
        var switch_button = box_table.append('p').attr("id", "switch_button").html("Switch to external dataset table...").on('click', function(){
                let type = current_table === "layer" ? "ext_dataset" : "layer";
                current_table = type;
                display_table({"type": type});
                });
    } else { var switch_button = undefined; }

    display_table({"type": current_table});

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

function fillMenu_Choropleth(layer){
    layer = layer.trim();

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
    var display_legend = dv2.insert("p")
                            .attr("id", "display_legend")
                            .style({"text-align": "center", "margin-right": "5%"})
                            .html("Display the legend")
                            .insert('input')
                            .attr("id", "checkbox_legend")
                            .attr("type", "checkbox")
                            .on("change", function(){handle_legend(layer_name);});
}

function handle_legend(layer){
    console.log(layer)
    var state = current_layers[layer].renderer;
    console.log(state)
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
        createLegend_choro(layer, field1, title, subtitle);
        createLegend_symbol(layer, field2, title, subtitle);
    }
    else if(current_layers[layer].renderer.indexOf("PropSymbols") != -1){
        let field = current_layers[layer].rendered_field;
        createLegend_symbol(layer, field, title, subtitle);
    } else {
        let field = current_layers[layer].rendered_field;
        createLegend_choro(layer, field, title, subtitle);
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
        ref_layer_name = layer.split("_PropSymbols")[0],
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

    //let breaks_elem = [0].concat([for (i of Array.of(4,3,2,1)) Math.round((nb_features-1)/i)]),
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

function createlegendEditBox(legend_id, layer_name){
    let nwBox = document.createElement('div'),
        bg = document.createElement('div'),
//        layer_name = Object.getOwnPropertyNames(result_data)[0] || Object.getOwnPropertyNames(user_data)[0],
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
                            let nb_float = +this.value,
                                dec_mult = +["1", Array(nb_float).map(i => "0").join('')].join('');
//                                dec_mult = +["1", [for(j of new Array(nb_float)) "0"].join('')].join('');
                            d3.select(legend_id).select("#precision_change_txt").html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                            for(let i = 0, breaks = current_layers[layer_name].colors_breaks; i < legend_boxes[0].length; i++){
                                let values = breaks[i][0].split(' - ');
                                legend_boxes[0][i].innerHTML = [Math.round(values[0] * dec_mult) / dec_mult, " - ", Math.round(values[1] * dec_mult) / dec_mult].join('');
                            }
                        });
        else if(legend_id === "#legend_root2")
                box_body.append('input')
                        .attr({id: "precision_range", type: "range", min: 0, max: max_nb_decimal, step: 1, value: current_nb_dec})
                        .style("display", "inline")
                        .on('change', function(){
                            let nb_float = +this.value,
                                dec_mult = +["1", Array(nb_float).map(i => "0").join('')].join('');
                            d3.select(legend_id).select("#precision_change_txt").html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                            for(let i = 0; i < legend_boxes[0].length; i++){
                                let value = legend_boxes[0][i].__data__.value;
                                legend_boxes[0][i].innerHTML = String(Math.round(value * dec_mult) / dec_mult);
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
        g_lyr_name = "#"+layer.trim(),
        fields = type_col(layer, "number");

    if(fields.length === 0){
        alert("The targeted layer doesn't seems to contain any numerical field");
        return;
    }

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

        var d_values = [],
            comp = function(a, b){return b[1]-a[1]},
            ref_layer_selection  = d3.select(g_lyr_name).selectAll("path");

        for(let i = 0, i_len = user_data[layer].length, field = field_selec.node().value; i < i_len; ++i){
            let centr = path.centroid(ref_layer_selection[0][i].__data__);
            d_values.push([i, +user_data[layer][i][field], centr]);
        }

//        for(let i=0, i_len = ref_layer_selection[0].length; i < i_len; i++){
//            let centr = path.centroid(ref_layer_selection[0][i].__data__);
//            d_values[i].push(centr);
//        }

        d_values = prop_sizer2(d_values, Number(ref_size.node().value / zoom.scale()), Number(max_size.node().value / zoom.scale()));
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

        var bg_color = Colors.random(),
            stroke_color = Colors.random(),
            layer_to_add = layer + "_PropSymbols",
            symbol_type = symb_selec.node().value;

        if(current_layers[layer_to_add]){
            remove_layer_cleanup(layer_to_add);
            d3.selectAll('#' + layer_to_add).remove();
        }

        symbol_layer = map.append("g").attr("id", layer_to_add)
                              .attr("class", "result_layer layer");

        if(symbol_type === "circle"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i];
                symbol_layer.append('circle')
                    .attr('cx', params[2][0])
                    .attr("cy", params[2][1])
                    .attr("r", ref_size.node().value / zoom.scale() + params[1])
                    .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                    .style("fill", fill_color.node().value)
                    .style("stroke", "black")
                    .style("stroke-width", 1 / zoom.scale());
            }
        } else if(symbol_type === "rect"){
            for(let i = 0; i < d_values.length; i++){
                let params = d_values[i],
                    size = ref_size.node().value / zoom.scale() + params[1];

                symbol_layer.append('rect')
                    .attr('x', params[2][0] - size/2)
                    .attr("y", params[2][1] - size/2)
                    .attr("height", size)
                    .attr("width", size)
                    .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                    .style("fill", fill_color.node().value)
                    .style("stroke", "black")
                    .style("stroke-width", 1 / zoom.scale());
            };
        }

        d3.select("#layer_menu")
              .append('p').html('<a href>- ' + layer_to_add+"</a>");

        class_name = "ui-state-default sortable_result " + layer_to_add
        layers_listed = layer_list.node()
        var li = document.createElement("li");
        li.setAttribute("class", class_name);
        li.innerHTML = ['<div class="layer_buttons">', button_style, button_trash, button_zoom_fit, button_active, "</div> ", "Point", " - ", layer_to_add].join('')
        layers_listed.insertBefore(li, layers_listed.childNodes[0])
        current_layers[layer_to_add] = {
            renderer: "PropSymbols", symbol: symbol_type,
            rendered_field: field_selec.node().value,
            size: [ref_size.node().value, max_size.node().value],
            "stroke-width-const": "1px"
            }
        binds_layers_buttons();
        zoom_without_redraw();
        makeButtonLegend(layer_to_add);
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}


function createBox_griddedMap(layer){
    if(current_layers[layer].type != "Polygon"){
        alert("Gridded maps can currently only be made from polygons");
        return;
    }

     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(layer),
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

//    var nb_class = dialog_content.append('p').html('Number of class :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 6).attr("min", 1).attr("max", 28).attr("step", 1);

    dialog_content.append('button').attr('id', 'yes').text('Compute and render');
    dialog_content.append('button').attr('id', 'no').text('Close');
    qs('#yes').onclick=function(){
        let field_n = field_selec.node().value,
            formToSend = new FormData(),
            var_to_send = new Object();
            //var_to_send = {field_n: [for (i of user_data[layer]) +i[field_n]]};
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
                    add_layer_fun(raw_topojson, {result_layer_on_add: true});
                }
                
                let opt_nb_class = Math.floor(1 + 3.3 * Math.log10(result_data[n_layer_name].length)),
//                    d_values = [for (obj of result_data[n_layer_name]) +obj["densitykm"]];
                    d_values = result_data[n_layer_name].map(obj => +obj["densitykm"]);

                current_layers[n_layer_name].renderer = "Gridded";
                makeButtonLegend(n_layer_name);
                let disc_result = discretize_to_colors(d_values, "Quantiles", opt_nb_class, col_pal.node().value);
                rendering_params = {
                    nb_class: opt_nb_class,
                    type: "Quantiles",
                    breaks: disc_result[2],
                    colors: disc_result[3],
                    colorsByFeature: disc_result[4],
                    renderer: "Gridded"
                        };
                render_choro(n_layer_name, rendering_params);
                
                dv2.insert('p').style("margin", "auto").html("")
                    .append("button").html("Display and arrange class ...")
                    .on("click", function(){
                  display_discretization(n_layer_name, "densitykm", opt_nb_class, "Quantiles")
                    .then(function(confirmed){ if(confirmed){
                            rendering_params = {
                                    nb_class: confirmed[0], type: confirmed[1],
                                    breaks: confirmed[2], colors:confirmed[3],
                                    colorsByFeature: confirmed[4], renderer: "Gridded"
                                };
                            render_choro(n_layer_name, rendering_params);
                        } else { return; }  });
                    });
            }
        });
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}


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
    let min_values = Math.min.apply(0, arr),
        max_values = Math.max.apply(0, arr),
        dif_val = max_values - min_values,
        dif_size = max_size - min_size;

    return arr.map(i => (i/dif_val * dif_size) + min_size - dif_size/dif_val)
//    return [for (i of arr) 
//          ((i/dif_val * dif_size) + min_size - dif_size/dif_val)
//        ];
}

function prop_sizer2(arr, min_size, max_size){
    let arr_tmp = arr.map(i => i[1]),
        min_values = Math.min.apply(0, arr_tmp),
        max_values = Math.max.apply(0, arr_tmp),
        dif_val = max_values - min_values,
        dif_size = max_size - min_size;

    return arr.map(i => [i[0], (i[1]/dif_val * dif_size) + min_size - dif_size/dif_val, i[2]])
//    return [for (i of arr) 
//          [i[0], (i[1]/dif_val * dif_size) + min_size - dif_size/dif_val, i[2]]
//        ];
}

var type_col = function(layer_name, target){
// Function returning an object like {"field1": "field_type", "field2": "field_type"},
//  for the fields of the selected layer.
// If target is set to "number" it should return an array containing only the name of the numerical fields
// ------------------- "string" ---------------------------------------------------------non-numerial ----
    var table = user_data.hasOwnProperty(layer_name) ? user_data[layer_name] : result_data[layer_name];
    var fields = Object.getOwnPropertyNames(table[0]),
        nb_features = current_layers[layer_name].n_features,
        deepth_test = 5 < nb_features ? 5 : nb_features,
        result = new Object(),
        field = undefined,
        tmp_type = undefined;

    if(fields.indexOf('pkuid') != -1)
        fields.splice(fields.indexOf("pkuid"), 1);

    for(var j = 0, len = fields.length; j < len; ++j){
        field = fields[j];
        result[field] = []
        for(var i=0; i < deepth_test; ++i){
            tmp_type = typeof table[i][field];
            if(tmp_type === "string" && !isNaN(Number(table[i][field]))) tmp_type = "number"
            result[fields[j]].push(tmp_type)
        }
    }
    for(var j = 0, len = fields.length; j < len; ++j){
        field = fields[j];
        if(result[field].every(function(ft){return ft === "number";}))
            result[field] = "number"
        else
            result[field] = "string"
    }
    if(target){
        var res = [];
        for(let k in result)
            if(result[k] === target)
                res.push(k)
        return res
    } else
        return result;
}
