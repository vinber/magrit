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
            "popup_factory": "createFuncOptionsBox_Choropleth",
            "desc":"Render a choropleth map on a numerical field of your data",
            "text_button": "Choose options and render..."
            },
        "anamorphose":{
            "title":"Anamorphose map",
            "popup_factory": "createFuncOptionsBox_Anamorphose",
            "desc":"Render a map using an anamorphose algorythm on a numerical field of your data",
            "text_button": "Choose algo, options and render..."
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

    if(modal.style === undefined)
        return
    else {
        modal.className += ' active';
        modal.style.position = 'fixed'
        modal.style.zIndex = 1;
        return center(modal);
    }
};

// TODO : keep trace of the previously used parameters and redisplay them when reopenning the windows
function createFuncOptionsBox_Stewart(layer){
    if(current_layers[layer].type === "Line"){
        alert("Stewart potentials can only be computed from points (or polygons, using their centroids)");
        return;
    }
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(layer),
         fields = type_col(layer, "number"),
//         fields = Object.getOwnPropertyNames(user_data[layer][0]),
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
        formToSend.append("json", JSON.stringify({
            "topojson": targeted_topojson,
            "var_name": field_selec.node().value,
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
                // Todo : render the layer
                var class_min = eval(data.split('|||')[0]),
                    n_layer_name = data.split('|||')[1],
                    raw_topojson = data.split('|||')[2];
                add_layer_fun(raw_topojson, {result_layer_on_add: true});
                col_pal = getColorBrewerArray(class_min.length, "Purples")
                console.log([class_min, n_layer_name, col_pal]);
                var col_map = new Map();
                for(let i=0, i_len = class_min.length; i < i_len; ++i){
                    let k = Math.round(class_min[i] * 100) / 100;
                    col_map.set(k, col_pal[i])
                }
                console.log(col_map)
                current_layers[n_layer_name].colors = col_pal.slice();
                current_layers[n_layer_name].rendered = "Stewart";
                d3.select("#"+n_layer_name).selectAll("path").style("fill", function(d, i){
                                                                let k = Math.round(d.properties.min * 100) / 100;
                                                                return col_map.get(k); })
                                                             .style("stroke", function(d, i){
                                                                let k = Math.round(d.properties.min * 100) / 100;
                                                                return col_map.get(k); })
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
    if(current_layers[layer].type === "Line"){
        alert("Anamorphose can currently only be computed on polygons");
        return;
    }
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+trim(layer),
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

function createBoxExplore(layer_name){
    var columns_headers = [], nb_features = user_data[layer_name].length,
        columns_names = Object.getOwnPropertyNames(user_data[layer_name][0]),
        data_joined = field_join_map.length != 0 ? true : false,
        txt_intro = ["<b>", layer_name, "</b><br>",
                     nb_features, " features - ",
                     columns_names.length, " fields"];

    if(data_joined){
        var nb_join_fields = Object.getOwnPropertyNames(joined_dataset[0][0]).length || 0;
        txt_intro = txt_intro.concat(["<br>(including ", nb_join_fields, " from the joined dataset)<br>"])
    } else {
        if(joined_dataset[0] != undefined)
            txt_intro.push("<br>(an external dataset has been provided without joining it)<br>");
        else
            txt_intro.push("<br>(no external dataset provided)<br>");
    }

    for(var i=0, len = columns_names.length; i<len; ++i)
        columns_headers.push({data: columns_names[i], title: columns_names[i]})

    var box_table = d3.select("body").append("div")
                        .attr({id: "browse_data_box", title: ["Explore dataset - ", layer_name].join('')})
                        .style("font-size", "0.8em");
    box_table.append("p").style("text-align", "center").html(txt_intro.join(''))
    box_table.append("table").attr({class: "display compact", id: "myTable"}).style({width: "80%", height: "80%"})
//    $(document).ready( function () {
    var myTable = $('#myTable').DataTable({
        data: user_data[layer_name],
        columns: columns_headers
    });
//    });
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



function createFuncOptionsBox_Choropleth(layer){
    var nwBox = document.createElement('div'),
        bg = document.createElement('div'),
        g_lyr_name = "#"+trim(layer),
        //fields = Object.getOwnPropertyNames(user_data[layer][0]),
        // only retrieve the name of numericals fields :
        fields = type_col(layer, "number");
        ref_size_val = undefined,
        selected_disc = undefined;

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
    dialog_content.append('h3').html('Choropleth map');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });

    var opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length));
    var rendering_params = new Object();
    dialog_content.insert('p').style("margin", "auto").html("")
                .append("button").html("Display and arrange class")
                .on("click", function(){
                    display_discretization(layer, field_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){
                            if(confirmed){
                                console.log(confirmed);
                                rendering_params = {
                                        nb_class: confirmed[0], type: confirmed[1],
                                        breaks: confirmed[2], colors:confirmed[3],
                                        colorsByFeature: confirmed[4]
                                    }
                            }
                        });
                });

    dialog_content.append('button').attr('id', 'yes').text('Render')
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        deactivate([nwBox, bg]);
        if(rendering_params){
    // TODO : - Désactiver les possibilité d'éditons du style de la couche une fois mise en forme par choropleth/stewart/prop_symbol/etc ?
    //        - Remonter la couche ciblée au dessus une fois qu'elle a été mise en forme
    //        - 
            var layer_to_render = d3.select(g_lyr_name).selectAll("path");
            layer_to_render.style('fill-opacity', 0.9)
                           .style("fill", function(d, i){ return rendering_params['colorsByFeature'][i] })
                           .style('stroke-opacity', 0.9)
                           .style("stroke", function(d, i){ return rendering_params['colorsByFeature'][i] });
            current_layers[layer].rendered = 'Choropleth';
            current_layers[layer].colors = rendering_params['colorsByFeature'];
        }
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}


function createFuncOptionsBox_PropSymbol(layer){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(layer),
        // only retrieve the name of numericals fields :
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
                                 .attr({min: 0, max: 1000, value: last_params.max_size || 1, step:0.1})
                                 .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dialog_content.append('label-item').attr("id", "max_size_txt").html('0 px');

    var ref_size = dialog_content.append('p').html('Reference (fixed) size (px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params')
                                 .attr({min: 0, max: 1500, value: last_params.ref_size_val || 1, step:0.1});

    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    ['Circle', 'Square'].forEach(function(symb_name){symb_selec.append("option").text(symb_name).attr("value", symb_name);});

    dialog_content.append('button').attr('id', 'yes').text('Compute')
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        last_params = {
            field: field_selec.node().value, max_size: max_size.node().value,
            ref_size: ref_size.node().value
                };
        console.log(last_params);
        var values = [];
        for(let i = 0, i_len = user_data[layer].length, field = field_selec.node().value; i < i_len; ++i)
            values.push(+user_data[layer][i][field])

        var max = Math.max.apply(Math, values),
            min = Math.min.apply(Math, values);
        
        console.log([values, min, max])
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}

var sizer = function(values, max_size, fix_size, symbol_type){
    return null;
}

var type_col = function(layer_name, target){
// Function returning an object like {"field1": "field_type", "field2": "field_type"},
//  for the fields of the selected layer.
// If target is set to "number" it should return an array containing only the name of the numerical fields
// ------------------- "string" ---------------------------------------------------------non-numerial ----
    var fields = Object.getOwnPropertyNames(user_data[layer_name][0]),
        nb_features = current_layers[layer_name].n_features,
        deepth_test = 5 < nb_features ? 5 : nb_features,
        result = new Object(),
        field = undefined,
        tmp_type = undefined;

    fields.splice(fields.indexOf("pkuid"), 1);

    for(var j = 0, len = fields.length; j < len; ++j){
        field = fields[j];
        result[field] = []
        for(var i=0; i < deepth_test; ++i){
            tmp_type = typeof user_data[layer_name][i][field];
            if(tmp_type === "string" && !isNaN(Number(user_data[layer_name][i][field]))) tmp_type = "number"
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