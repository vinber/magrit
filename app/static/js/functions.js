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
            "text_button": "Choose options and render..."
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
    if(Object.getOwnPropertyNames(user_data).length < 1){
        alert("A reference layer and/or dataset have to be provided");
        return;
    }
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
        name_join_field = join_field.node().value;
        last_params = {
            "field_i": field_i.node().value,
            "field_j": field_j.node().value,
            "field_fij": field_fij.node().value,
            "join_field": name_join_field
            };
        var formToSend = new FormData();
//        if(!targeted_topojson.objects[ref_layer].geometries[0].hasOwnProperty("properties")
//            && targeted_topojson.objects[ref_layer].geometries[0].hasOwnProperty(name_join_field)){
//        for(let i=0, len=targeted_topojson.objects[ref_layer].geometries.length, obj=targeted_topojson.objects[ref_layer]; i<len; ++i){
//                obj.geometries[i].properties = new Object();
//                obj.geometries[i].properties[name_join_field] = user_data[ref_layer][i][name_join_field];
//            }
//        }
//        formToSend.append("json", JSON.stringify({
//            "topojson": ref_layer,
//            "csv_table": JSON.stringify(joined_dataset[0]),
//            "field_i": field_i.node().value,
//            "field_j": field_j.node().value,
//            "field_fij": field_fij.node().value,
//            "join_field": join_field.node().value
//            }))
        join_field_to_send = new Object();
        join_field_to_send[name_join_field] = [for (obj of user_data[ref_layer]) obj[name_join_field]];
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
                var layer_to_render = d3.select("#"+"Links_").selectAll("path");
                var fij_values = [for (ob of joined_dataset[0]) ob['fij']];
                var prop_values = prop_sizer(fij_values, 0.5, 12);
                console.log([fij_values, prop_values, ])
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
        var_to_send[field_n] = [for (i of user_data[layer]) +i[field_n]];
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
                console.log([class_lim, n_layer_name, col_pal]);
                var col_map = new Map(),
                    colors_breaks = [];
                for(let i=0, i_len = class_lim.min.length; i < i_len; ++i){
                    let k = Math.round(class_lim.min[i] * 100) / 100;
                    col_map.set(k, col_pal[i]);
                    colors_breaks.push([class_lim['min'][i] + " - " + class_lim['max'][i], col_pal[i]])
                }
                console.log(col_map)
                current_layers[n_layer_name].colors = [];
                current_layers[n_layer_name].rendered = "Stewart";
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
    var state = current_layers[layer].rendered;
    if(state != undefined){
        if(d3.selectAll("#legend_root").node()) d3.selectAll("#legend_root").remove()
        else createLegend(layer)
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


function createLegend(layer, title){
    var legendTitle = title || current_layers[layer].rendered_field;
    var boxheight = 18,
        boxwidth = 18,
        boxgap = 4,
        xpos = w - (w / 8),
        ypos = 20,
        nb_class = current_layers[layer].colors_breaks.length;

    var legend = map.insert('g').attr('id', 'legend_root').attr("class", "legend_feature")
        .selectAll('.legend')
      .data(current_layers[layer].colors_breaks)
      .enter().insert('g')
      .attr('class', function(d, i) { return "legend_feature legend_" + i; });

    legend.insert("g").attr("id","box_color").attr("class", "legend_feature")
      .append('rect')
      .attr("x", xpos + boxwidth + boxgap / 2)
      .attr("y", function(d, i){
        return ypos + (i * boxgap) + (i * boxheight)
        })
      .attr('width', boxwidth)
      .attr('height', boxheight)
      .style('fill', function(d) { return d[1]; })
      .style('stroke', function(d) { return d[1]; });
      
    legend.insert("g").attr("id","box_text").attr("class", "legend_feature")
      .append('text')
      .attr("x", xpos + boxwidth * 2 + boxgap)
      .attr("y", function(d, i){
        return ypos + (i * boxgap) + (i+1/2) * boxheight;
        })
      .style({'alignment-baseline': 'middle' , 'font-size':'10px'})
      .text(function(d) { return d[0]; });

     legend.append("g").attr("class", "legend_feature")
        .append('text').attr("id","legendtitle")
        .text(legendTitle)
        .attr("x", xpos + boxwidth * 2 + boxgap)
        .attr("y", ypos - 5);

    var drag_lgd = d3.behavior.drag()
                .on("dragstart", function(){
                        zoom.on("zoom", null);
                        })
                .on("dragend", function(){ zoom.on("zoom", zoom_without_redraw); })
                .on("drag", function() {
                        let coords = d3.mouse(this), n_x = d3.event.x, n_y = d3.event.y, zoom_trans = zoom.translate();
                        d3.selectAll("#legend_root").attr('transform', 'translate(' + [-xpos + n_x, -ypos + n_y] + ')');
//                        console.log('translate(' + [n_x, n_y] + ')')
//                        console.log('translate(' + [-xpos + n_x, -ypos + n_y] + ')')
                        });

    legend.append("g").attr("class", "legend_feature").attr("id", "move_legend").insert("svg:image")
        .attr({x: xpos - 10, y: ypos - 10, width: 12, height: 12, "fill-opacity" : 0.5})
        .attr("title", "Double-click here to drag the legend")
        .attr("xlink:href", "/static/img/Simpleicons_Interface_arrows-cross.svg")
        .on("click", function(){d3.select("#legend_root").call(drag_lgd);});

    legend.append("g").attr("class", "legend_feature").insert("svg:image")
        .attr({x: xpos - 10, y: ypos + 15, width: 12, height: 12, "fill-opacity" : 0.5})
        .attr("xlink:href", "/static/img/Edit_icon.svg")
        .on('click', function(){
            alert("edit");
        });
}

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

    var max_size = dialog_content.append('p').style("display", "inline").html('Max. size (px)')
                                 .insert('input')
                                 .attr({type: 'range', class: 'params'})
                                 .attr({min: 0, max: 333, value: last_params.max_size || 5, step:0.1})
                                 .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dialog_content.append('label-item').attr("id", "max_size_txt").html('0 px');

    var ref_size = dialog_content.append('p').html('Reference (fixed) size (px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params')
                                 .attr({min: 0, max: 333, value: last_params.ref_size_val || 1, step:0.1});

    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    ['Circle', 'Square'].forEach(function(symb_name){symb_selec.append("option").text(symb_name).attr("value", symb_name);});

    var fill_color = dialog_content.append('p').html('Symbol color<br>')
              .insert('input').attr('type', 'color').attr("value", Colors.random());

    dialog_content.append('button').attr('id', 'yes').text('Compute');
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        last_params = {
            field: field_selec.node().value,
            max_size: +max_size.node().value / zoom.scale(),
            ref_size: +ref_size.node().value / zoom.scale(),
            symbol_shape: symb_selec.node().value,
            symbol_color: fill_color.node().value
                };

        var values = [];
        for(let i = 0, i_len = user_data[layer].length, field = field_selec.node().value; i < i_len; ++i)
            values.push(+user_data[layer][i][field]);
        
        var prop_values = prop_sizer(values, Number(ref_size.node().value / zoom.scale()), Number(max_size.node().value / zoom.scale()));

        var bg_color = Colors.random(),
            stroke_color = Colors.random();

//        var prop_symbols = d3.select(g_lyr_name).append("div").attr("id", "PropSymbol");
        d3.select(g_lyr_name).selectAll("circle").remove()
        d3.select(g_lyr_name).selectAll("rect").remove()
        if(symb_selec.node().value === "Circle"){
            d3.select(g_lyr_name).selectAll("path").each(function(d, i){
                var centr = path.centroid(d);
                d3.select(g_lyr_name).append('circle')
                    .attr('cx', centr[0])
                    .attr("cy", centr[1])
                    .attr("r", ref_size.node().value / zoom.scale() + prop_values[i])
                    .attr("id", "PropSymbol_" + i)
                    .style("fill", fill_color.node().value)
                    .style("stroke", "black");
            });
        } else if(symb_selec.node().value === "Square"){
            d3.select(g_lyr_name).selectAll("path").each(function(d, i){
                var centr = path.centroid(d);
                d3.select(g_lyr_name).append('rect')
                    .attr('x', centr[0])
                    .attr("y", centr[1])
                    .attr("height", ref_size.node().value / zoom.scale() + prop_values[i])
                    .attr("width", ref_size.node().value / zoom.scale() + prop_values[i])
                    .attr("id", "PropSymbol_" + i)
                    .style("fill", fill_color.node().value)
                    .style("stroke", "black");
            });
        }

        if(current_layers[layer].type === "Point")
            d3.select(g_lyr_name).selectAll("path").style('fill-opacity', 0).style('stroke-opacity', 0);

        zoom_without_redraw();
        current_layers[layer].renderer = "PropSymbol";
        current_layers[layer].rendered_field = field_selec.node().value;
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

    dialog_content.append('button').attr('id', 'yes').text('Compute and render');
    dialog_content.append('button').attr('id', 'no').text('Close');
    qs('#yes').onclick=function(){
        let field_n = field_selec.node().value;
        last_params = {
            "var_name": field_n,
            "cellsize": cellsize.node().value
            };
        var formToSend = new FormData();
        let var_to_send = new Object;
        var_to_send[field_n] = [for (i of user_data[layer]) +i[field_n]];

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
                var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(result_data[n_layer_name].length));
                current_layers[n_layer_name].rendered = "Gridded";
                makeButtonLegend(n_layer_name);
                var rendering_params = new Object();
                // Todo : render the returned layer with some defaults values :
//                rendering_params = {
//                        nb_class: opt_nb_class, type: "quantiles",
//                        breaks: confirmed[2], colors: confirmed[3],
//                        colorsByFeature: confirmed[4], renderer: "Gridded"
//                    }
//                render_choro(n_layer_name, rendering_params);

                dv2.insert('p').style("margin", "auto").html("")
                    .append("button").html("Display and arrange class ...")
                    .on("click", function(){
                  display_discretization(n_layer_name, "densitykm", opt_nb_class, "Quantiles")
                    .then(function(confirmed){ if(confirmed){
                                console.log(confirmed);
                                rendering_params = {
                                        nb_class: confirmed[0], type: confirmed[1],
                                        breaks: confirmed[2], colors:confirmed[3],
                                        colorsByFeature: confirmed[4], renderer: "Gridded"
                                    }
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
    current_layers[layer].rendered = rendering_params['renderer'];
    current_layers[layer].rendered_field = rendering_params['rendered_field'];
    current_layers[layer].colors = rendering_params['colorsByFeature'];
    current_layers[layer]['stroke-width-const'] = "0.75px";
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

    return [for (i of arr) 
          ((i/dif_val * dif_size) + min_size - dif_size/dif_val)
        ];
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
