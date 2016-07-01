"use strict";

function get_menu_option(func){
    var menu_option = {
        "test":{
            "title": "test",
            "desc": "Testing functionnality...",
            "menu_factory": "fillMenu_Test",
            "fields_handler": "fields_Test",
            "quantization_default" : "--no-quantization"
        },
        "stewart":{
            "title":"Stewart potentials",
            "desc":"Compute stewart potentials...",
            "menu_factory": "fillMenu_Stewart",
            "fields_handler": "fields_Stewart",
            "quantization_default" : "--no-quantization"
            },
        "prop_symbol":{
            "title":"Proportional symbols",
            "menu_factory": "fillMenu_PropSymbol",
            "desc":"Display proportional symbols with appropriate discretisation on a numerical field of your data",
            "fields_handler": "fields_PropSymbol",
            "quantization_default" : "-q 1e8"
            },
        "prop_symbol_choro":{
            "title":"Proportional colored symbols",
            "menu_factory": "fillMenu_PropSymbolChoro",
            "desc":"Display proportional symbols and choropleth coloration of the symbols on two numerical fields of your dataset with an appropriate discretisation",
            "fields_handler": "fields_PropSymbolChoro",
            "quantization_default" : "-q 1e8"
            },
        "choropleth":{
            "title":"Choropleth map",
            "menu_factory": "fillMenu_Choropleth",
            "desc":"Render a choropleth map on a numerical field of your data",
            "fields_handler": "fields_Choropleth",
            "quantization_default" : "-q 1e8"
            },
        "cartogram":{
            "title":"Anamorphose map",
            "menu_factory": "fillMenu_Anamorphose",
            "desc":"Render a map using an anamorphose algorythm on a numerical field of your data",
            "fields_handler": "fields_Anamorphose",
            "add_options": "keep_file",
            "quantization_default" : "--no-quantization"
            },
        "grid_map":{
            "title":"Gridded map",
            "menu_factory": "fillMenu_griddedMap",
            "desc":"Render a gridded map on a numerical field of your data",
            "fields_handler": "fields_griddedMap",
            "quantization_default" : "--no-quantization"
            },
        "mta":{
            "title":"Multiscalar Territorial Analysis",
            "menu_factory": "fillMenu_MTA",
            "desc":"Compute and render various methods of multiscalar territorial analysis",
            "fields_handler": "fields_MTA",
            "quantization_default" : "--no-quantization"
            },
        "flows_map":{
            "title":"Link/FLow map",
            "menu_factory": "fillMenu_FlowMap",
            "desc": "Render a map displaying links between features with graduated sizes",
            "fields_handler": "fields_FlowMap",
            "quantization_default" : "--no-quantization"
            },
        "discontinuities":{
            "title":"Discontinuities map",
            "menu_factory": "fillMenu_Discont",
            "desc": "Render a map displaying discontinuities between polygons features",
            "fields_handler": "fields_Discont",
            "add_options": "keep_file",
            "quantization_default" : "-q 1e10"
            },
        "categorical":{
            "title":"Categorical map",
            "menu_factory": "fillMenu_Typo",
            "desc":"Render a categorical map with an attribute field of your dataset",
            "fields_handler": "fields_Typo",
            "quantization_default" : "-q 1e8"
            },
        "label":{
            "title":"Label map",
            "menu_factory": "fillMenu_Label",
            "desc":"Render a map with optimal label positionning",
            "fields_handler": "fields_Label",
            "quantization_default" : "-q 1e8"
            },

    };
    return menu_option[func.toLowerCase()] || {}
}

// Function trying to avoid layer name collision by adding a suffix
// to the layer name if already exists and incrementing it if necessary
// (MyLayer -> MyLayer_1 -> MyLayer_2 etc.)
// Args:
//     - name : the original name of the layer to add
//
// Returns:
//     - new_name : the input name if not already in use or a new name
//                  to safely add the layer.
function check_layer_name(name){
    if(!(current_layers.hasOwnProperty(name)))
        return name;
    else {
        let i = 1;
        if(name.match(/_\d+$/)){
            i = name.match(/\d+$/);
            name = name.substring(name, name.indexOf(i));
            return check_layer_name([name, parseInt(i) + 1].join(''));
        }
        else {
            name = [name, i].join('_');
            return check_layer_name(name);
        }
    }
}

var fields_Discont = {
    fill: function(layer){
        if(!layer) return;
        let fields_num = type_col(layer, "number"),
            fields_all = Object.getOwnPropertyNames(user_data[layer][0]),
            field_discont = d3.select("#field_Discont"),
            field_id = d3.select("#field_id_Discont");
        fields_num.forEach(function(field){
                field_discont.append("option").text(field).attr("value", field);
        });
        fields_all.forEach(function(field){
                field_id.append("option").text(field).attr("value", field);
        });
        d3.selectAll(".params").attr("disabled", null);
    },
    unfill: function(){
        unfillSelectInput(document.getElementById("field_Discont"));
        unfillSelectInput(document.getElementById("field_id_Discont"));
        d3.selectAll(".params").attr("disabled", true);
    }
}

function insert_legend_button(layer_name){
    let selec = d3.select("#sortable").select(['.', layer_name, ' .layer_buttons'].join('')),
        inner_html = selec.node().innerHTML,
        const_delim = ' <img src="/static/img/Inkscape_icons_zoom_fit_page.svg"',
        split_content = inner_html.split();
    selec.node().innerHTML = [split_content[0], button_legend, const_delim, split_content[1]].join('');
}

function fillMenu_Discont(layer){
    let dv2 = section2.append("p").attr("class", "form-rendering");
    dv2.append('p').html('Value field ')
                .insert('select')
                .attr({class: 'params', id: "field_Discont"});

    dv2.append('p').html('Id field ')
                .insert('select')
                .attr({class: 'params', id: "field_id_Discont"});

    let disc_kind = dv2.append('p').html('Discontinuity kind ')
                .insert('select')
                .attr({class: 'params', id: "kind_Discont"});

    [ ["Relative", "rel"],
      ["Absolute", "abs"] ].forEach(function(k){
        disc_kind.append("option").text(k[0]).attr("value", k[1]); });

    let min_size_field = dv2.append('p').html('Reference min. size ')
                 .insert('input')
                 .style('width', '60px')
                 .attr({type: 'number', class: 'params', id: 'Discont_min_size'})
                 .attr({min: 0.1, max: 66.0, value: 0.5, step: 0.1});

    dv2.append('p').html('Reference max. size ')
                 .insert('input')
                 .style('width', '60px')
                 .attr({type: 'number', class: 'params', id: 'Discont_max_size'})
                 .attr({min: 0.1, max: 66.0, value: 10, step: 0.1})
                 .on("change", function(){
                    min_size_field.attr("max", this.value)
                  });

    dv2.append('p').html('Discontinuity threshold ')
                 .insert('input')
                 .style('width', '60px')
                 .attr({type: 'number', class: 'params', id: 'Discont_threshold'})
                 .attr({min: 0.0, max: 9999.0, value: 0.5, step: 0.1});

    dv2.append('p').html('Color ')
                .insert('input')
                .attr({class: 'params', id: "color_Discont",
                       type: "color", value: Colors.names[Colors.random()]});

    dv2.append("span")
            .html("Simplify borders before rendering ")
          .insert("input").attr({type: "checkbox", class: "params"})
            .attr('id', 'simplify_disc');

    let ok_button = dv2.append("p")
                      .style({"text-align": "right", margin: "auto"})
                      .append('button')
                      .attr('id', 'yes')
                      .attr('class', 'params button_st2')
                      .text('Compute and render');

    d3.selectAll(".params").attr("disabled", true);

    ok_button.on("click", function(){
        let layer = Object.getOwnPropertyNames(user_data)[0],
            field = document.getElementById("field_Discont").value,
            field_id = document.getElementById("field_id_Discont").value,
            min_size = +document.getElementById("Discont_min_size").value,
            max_size = +document.getElementById("Discont_max_size").value,
            threshold = +document.getElementById("Discont_threshold").value;

        let result_value = new Map(),
            result_geom = {};

        // Use topojson.mesh a first time to compute the discontinuity value
        // for each border (according to the given topology)
        // (Discontinuities could also be computed relativly fastly server side
        // which can be a better solution for large dataset..)
        if(disc_kind.node().value == "rel")
            topojson.mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
                    if(a !== b){
                         let value = Math.max(a.properties[field] / b.properties[field],
                                              b.properties[field] / a.properties[field]),
                             new_id = [a.id, b.id].join('_'),
                             new_id_rev = [b.id, a.id].join('_');
                        if(!(result_value.get(new_id) || result_value.get(new_id_rev)))
                            result_value.set(new_id, value)
                    }
                    return false; });
        else
            topojson.mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
                    if(a !== b){
                         let value = Math.max(a.properties[field] - b.properties[field],
                                              b.properties[field] - a.properties[field]),
                             new_id = [a.id, b.id].join('_'),
                             new_id_rev = [b.id, a.id].join('_');
                        if(!(result_value.get(new_id) || result_value.get(new_id_rev)))
                            result_value.set(new_id, value)
                    }
                    return false; });

        let new_layer_name = check_layer_name(["Disc", layer, field, disc_kind.node().value].join('_')),
            user_color = document.getElementById("color_Discont").value,
            method = document.getElementById("kind_Discont").value,
            result_layer = map.append("g").attr("id", new_layer_name)
                .style({"stroke-linecap": "round", "stroke-linejoin": "round"})
                .attr("class", "result_layer layer");

        let arr_disc = [], arr_tmp = [];
        for(let [id, val] of result_value){
            arr_disc.push([id, val]);
            arr_tmp.push(val)
        }

        let serie = new geostats(arr_tmp),
            nb_ft = arr_tmp.length,
            opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_ft)),
            step = (max_size - min_size) / (opt_nb_class - 1),
            class_size = Array(opt_nb_class).fill(0).map((d,i) => min_size + (i * step));

        let breaks_val = serie.getEqInterval(opt_nb_class),
            breaks = new Array();

        for(let i = 0; i<breaks_val.length-1; ++i)
            breaks.push([[breaks_val[i], breaks_val[i+1]].join(' - '), class_size[i]]);

        result_data[new_layer_name] = new Array(nb_ft);
        let data_result = result_data[new_layer_name];

        // This is bad and should be replaced by somthing better as we are
        // traversing the whole topojson again and again
        // looking for each "border" from its "id" (though it isn't that slow)
        for(let i=0; i<nb_ft; i++){
            let id_ft = arr_disc[i][0],
                val = arr_disc[i][1],
                p_size = class_size[serie.getClass(val)],
                size = val >= threshold ? p_size : 0;
            data_result[i] =  {id: id_ft, disc_value: val, prop_value: size};
            result_layer.append("path")
                .datum(topojson.mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
                    let a_id = id_ft.split("_")[0], b_id = id_ft.split("_")[1];
                    return a != b
                        && (a.id == a_id && b.id == b_id || a.id == b_id && b.id == a_id); }))
                .attr({d: path, id: ["feature", i].join('_')})
                .style({stroke: user_color, "stroke-width": size, "fill": "transparent"});
            result_layer.node().querySelector(["#feature", i].join('_')).__data__.properties = data_result[i];
        }

        let _list_display_name = get_display_name_on_layer_list(new_layer_name),
            layers_listed = layer_list.node(),
            li = document.createElement("li");

        li.setAttribute("layer_name", new_layer_name);
        li.setAttribute("class", "ui-state-default sortable_result " + new_layer_name);
        li.setAttribute("layer-tooltip", ["<b>", new_layer_name, "</b> - Line - ", arr_disc.length, " features"].join(''))
        li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_legend, button_active, button_type_blank['Line'], "</div> ", _list_display_name].join('')
        layers_listed.insertBefore(li, layers_listed.childNodes[0])
        current_layers[new_layer_name] = {
            "renderer": "DiscLayer",
            "breaks": breaks,
            "min_display": threshold,
            "type": "Line",
            "rendered_field": field,
            "size": [0.5, 10],
            "is_result": true,
            "fixed_stroke": true,
            "ref_layer_name": layer,
            "fill_color": { "single": user_color },
            "n_features": arr_disc.length,
            "result": result_value
            };
        send_layer_server(new_layer_name, "/add_layer/discont");
        binds_layers_buttons();
        zoom_without_redraw();
        switch_accordion_section();
        });
}

function send_layer_server(layer_name, url){
    var formToSend = new FormData();

    var JSON_layer = url.indexOf("olson") > -1 ? path_to_geojson2(layer_name) : path_to_geojson(layer_name);
    formToSend.append("geojson", JSON_layer);
    formToSend.append("layer_name", layer_name);
    $.ajax({
        processData: false,
        contentType: false,
        url: url,
        data: formToSend,
        global: false,
        type: 'POST',
        error: function(error) { console.log(error); },
        success: function(data){ console.log(data); }
        });
}

var fields_FlowMap = {
    fill: function(layer){
        if(joined_dataset.length > 0
            && document.getElementById("FlowMap_field_i").options.length == 0){
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
        unfillSelectInput(join_field);
        document.getElementById("FlowMap_discTable").innerHTML = "";
        d3.selectAll(".params").attr("disabled", true);

    }
};

function make_min_max_tableau(fij_name, nb_class, disc_kind, min_size, max_size){
    if(!(joined_dataset[0][0].hasOwnProperty(fij_name))){
        document.getElementById("FlowMap_discTable").innerHTML = "";
        return;
    } else {
        document.getElementById("FlowMap_discTable").innerHTML = "";
        let fij_values = joined_dataset[0].map(obj => +obj[fij_name]),
            disc_result = discretize_to_size(fij_values, disc_kind, nb_class, min_size, max_size),
            breaks = disc_result[2];
        if(!breaks)
            return;
        d3.select("#FlowMap_discTable")
            .append("p")
            .style("word-spacing", "1.8em")
            .html('Min - Max - Size');
        d3.select("#FlowMap_discTable")
            .append("div")
            .selectAll("p")
            .data(breaks).enter()
            .append("p").attr("class", "breaks_vals").attr("id", (d,i) => ["line", i].join('_'));
        let selec = d3.select("#FlowMap_discTable").selectAll(".breaks_vals");
        for(let i = 0; i < selec[0].length; i++){
            let selection =  d3.select("#FlowMap_discTable").select('#line_' + i);
            selection
                .insert('input')
                .attr("type", "number")
                .attr("id", "min_class")
                .attr("step", 0.1)
                .attr("value", +breaks[i][0][0].toFixed(2))
                .style("width", "60px");
            selection
                .insert('input')
                .attr("type", "number")
                .attr("id", "max_class")
                .attr("step", 0.1)
                .attr("value", +breaks[i][0][1].toFixed(2))
                .style("width", "60px");
            selection
                .insert('input')
                .attr("type", "number")
                .attr("id", "size_class")
                .attr("step", 0.1)
                .attr("value", +breaks[i][1].toFixed(2))
                .style("margin-left", "20px")
                .style("width", "60px");
            selection
                .insert('span')
                .html(" px")
        }
    }
}

function fetch_min_max_table_value(parent_node){
    if(!parent_node){
        if(func == "flows_map") parent_node = document.getElementById("FlowMap_discTable");
        else if (func == "discontinuities") parent_node = document.getElementById("Discont_discTable");
        else return false;
    }

    let mins = Array.prototype.map.call(parent_node.querySelectorAll("#min_class"), el => +el.value),
        maxs = Array.prototype.map.call(parent_node.querySelectorAll("#max_class"), el => +el.value),
        sizes = Array.prototype.map.call(parent_node.querySelectorAll("#size_class"), el => +el.value),
        nb_class = mins.length,
        comp_fun = (a,b) => a > b;

// Some verification regarding the input values provided by the user :
// - Values are ordered :
    if(mins != mins.sort(comp_fun)
            || maxs != maxs.sort(comp_fun)
            || sizes != sizes.sort(comp_fun)){
        alert("Values have to be ordered (from the minimum to the maximum)");
        return false;
    }

// - Min / max values are consistent :
    for(let i = 0, len_i = nb_class - 1; i < len_i; i++){
        if(mins[i+1] != maxs[i]){
            alert("Class min and max values have to be consistent");
            return false;
        }
    }
    return {"mins" : mins, "maxs" : maxs, "sizes" : sizes}
}

function fillMenu_FlowMap(){
    var dv2 = section2.append("p").attr("class", "form-rendering");
    dv2.append('p').html('<b>Links dataset fields :</b>');

    var field_i = dv2.append('p').html('<b><i> i </i></b> field ').insert('select').attr('class', 'params').attr("id", "FlowMap_field_i"),
        field_j = dv2.append('p').html('<b><i> j </i></b> field ').insert('select').attr('class', 'params').attr("id", "FlowMap_field_j"),
        field_fij = dv2.append('p').html('<b><i> fij </i></b> field ').insert('select').attr('class', 'params').attr("id", "FlowMap_field_fij");

//    var disc_type = dv2.append('p').html(' Discretization type ').insert('select').attr('class', 'params').attr("id", "FlowMap_discKind");
//    ["Quantiles", "Equal interval", "Standard deviation", "Q6", "Arithmetic progression", "Jenks"]
//        .forEach(field => {
//            disc_type.append("option").text(field).attr("value", field)
//        });

    var nb_class_input = dv2.append('p').html(' Number of class ')
                        .insert('input')
                        .attr({type: "number", class: 'params', id: "FlowMap_nbClass", min: 1, max: 33, value: 8})
                        .style("width", "50px");

    field_fij.on("change", function(){
        let name = this.value,
            nclass = nb_class_input.node().value,
//            disc = disc_type.node().value,
            min_size = 0.5,
            max_size = 10;
        make_min_max_tableau(name, nclass, "Equal interval", min_size, max_size)
    })

//    disc_type.on("change", function(){
//        let name = field_fij.node().value,
//            nclass = nb_class.node().value,
//            disc = this.value,
//            min_size = 0.5,
//            max_size = 10;
//        make_min_max_tableau(name, nclass, disc, min_size, max_size)
//    })

    nb_class_input.on("change", function(){
        let name = field_fij.node().value,
            nclass = this.value,
//            disc = disc_type.node().value,
            min_size = 0.5,
            max_size = 10;
        make_min_max_tableau(name, nclass, "Equal interval", min_size, max_size)
    })

    dv2.append('p').attr("class", "params").attr("id", "FlowMap_discTable").html('')

    dv2.append('p').html('<b>Reference layer fields :</b>');
    var join_field = dv2.append('p').html('join field :').insert('select').attr('class', 'params').attr("id", "FlowMap_field_join");

    let ok_button = dv2.append('button')
                        .attr('id', 'yes')
                        .attr('class', 'params button_st2')
                        .style({"text-align": "right", margin: "auto"})
                        .text('Compute and render');

    d3.selectAll(".params").attr("disabled", true);

    ok_button.on("click", function(){
            let ref_layer = Object.getOwnPropertyNames(user_data)[0],
                name_join_field = join_field.node().value,
                formToSend = new FormData(),
                join_field_to_send = new Object();

            let disc_params = fetch_min_max_table_value(),
                mins = disc_params.mins,
                maxs = disc_params.maxs,
                sizes = disc_params.sizes,
                nb_class = mins.length,
                user_breaks = [].concat(mins, maxs[nb_class - 1]),
                min_size = Math.min.apply(null, sizes),
                max_size = Math.max.apply(null, sizes);

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
                    let new_layer_name = add_layer_topojson(data, {result_layer_on_add: true}),
                        layer_to_render = d3.select("#" + new_layer_name).selectAll("path"),
                        fij_field_name = field_fij.node().value,
                        fij_values = result_data[new_layer_name].map(obj => +obj[fij_field_name]),
                        nb_ft = fij_values.length,
                        serie = new geostats(fij_values);

                    if(user_breaks[0] < serie.min())
                        user_breaks[0] = serie.min();

                    if(user_breaks[nb_class] > serie.max())
                        user_breaks[nb_class] = serie.max();

                    serie.setClassManually(user_breaks);

                    current_layers[new_layer_name].fixed_stroke = true;
                    current_layers[new_layer_name].renderer = "Links";
                    current_layers[new_layer_name].breaks = [];
                    current_layers[new_layer_name].linksbyId = new Array(nb_ft);
                    current_layers[new_layer_name].size = [min_size, max_size];
                    current_layers[new_layer_name].rendered_field = fij_field_name;
                    current_layers[new_layer_name].ref_layer_name = ref_layer;

                    let links_byId = current_layers[new_layer_name].linksbyId;

                    for(let i = 0; i < nb_ft; ++i){
                        let val = +fij_values[i];
                        links_byId[i] = [i, fij_values[i], sizes[serie.getClass(val)]];
                    }

                    for(let i = 0; i<nb_class; ++i)
                        current_layers[new_layer_name].breaks.push([[user_breaks[i], user_breaks[i+1]].join(' - '), sizes[i]]);

                    layer_to_render.style('fill-opacity', 0)
                                   .style('stroke-opacity', 0.75)
                                   .style("stroke-width", (d,i) => {return links_byId[i][2]});

                    switch_accordion_section();
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
                    let n_layer_name = add_layer_topojson(data, {result_layer_on_add: true});
                    current_layers[n_layer_name].renderer = "None";
                    current_layers[n_layer_name].rendered_field = field_name;
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

        field1_selec.on("change", function(){
            let field_name = this.value,
                max_val_field = Math.max.apply(null, user_data[layer].map(obj => +obj[field_name])),
                ref_value_field = document.getElementById("PropSymbolChoro_ref_value");

            ref_value_field.setAttribute("max", max_val_field);
            ref_value_field.setAttribute("value", max_val_field);
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

    var field1_selec = dv2.append('p').html('Field 1 (symbol size) ')
                          .insert('select')
                          .attr({class: 'params', id: 'PropSymbolChoro_field_1'});

    var ref_size = dv2.append('p').style("display", "inline").html('Fixed size ')
                     .insert('input')
                     .attr({type: 'range', class: 'params', id: 'PropSymbolChoro_ref_size'})
                     .attr({min: 0.1, max: 66.0, value: 10.0, step: 0.1})
                     .style("width", "8em")
                     .on("change", function(){ d3.select("#max_size_txt").html(this.value + " px") });

    var max_size_txt = dv2.append('label-item')
                            .attr("id", "max_size_txt")
                            .html('10 px');

    var ref_value = dv2.append('p').html('on value ... ')
                     .insert('input')
                     .style({'width': '100px', "margin-left": "65px"})
                     .attr({type: 'number', class: 'params', id: 'PropSymbolChoro_ref_value'})
                     .attr({min: 0.1, step: 0.1});

    // Other symbols could probably easily be proposed :
    var symb_selec = dv2.append('p').html('Symbol type ').insert('select').attr('class', 'params');
    [['Circle', "circle"],
     ['Square', "rect"]].forEach( symb => {
        symb_selec.append("option").text(symb[0]).attr("value", symb[1]);
    });

    var field2_selec = dv2.append('p').html('Field 2 (symbol color) ').insert('select').attr('class', 'params').attr('id', 'PropSymbolChoro_field_2');

    dv2.insert('p').style("margin", "auto").html("")
                .append("button").attr('class', 'params button_disc')
                .style({"font-size": "0.8em", "text-align": "center"})
                .html("Choose a discretization ...")
                .on("click", function(){
                    let layer = Object.getOwnPropertyNames(user_data)[0],
                        opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length))

                    display_discretization(layer, field2_selec.node().value, opt_nb_class, "Quantiles")
                        .then(function(confirmed){
                            if(confirmed){
                                dv2.select('#yes').attr("disabled", null);
                                rendering_params = {
                                    nb_class: confirmed[0], type: confirmed[1],
                                    breaks: confirmed[2], colors: confirmed[3],
                                    colorsByFeature: confirmed[4], renderer: "PropSymbolsChoro"
                                    }
                            } else
                                return;
                        });
                });

    var behavior_onzoom = dv2.append('p').html("Recompute symbol size when zooming")
                                .insert("input").attr({type: "checkbox", class: "params"});

    var ok_button = dv2.insert("p").style({"text-align": "right", margin: "auto"})
                        .append('button')
                        .attr('id', 'yes')
                        .attr('class', 'button_st2')
                        .attr('disabled', true)
                        .text('Render');

    ok_button.on("click", function(){
        if(rendering_params){
            let layer = Object.getOwnPropertyNames(user_data)[0],
                nb_features = user_data[layer].length,
                rd_params = new Object(),
                new_layer_name = check_layer_name(layer + "_PropSymbolsChoro");

            rd_params.field = field1_selec.node().value;
            rd_params.new_name = new_layer_name;
            rd_params.nb_features = nb_features;
            rd_params.ref_layer_name = layer;
            rd_params.symbol = symb_selec.node().value;
            rd_params.ref_value = +ref_value.node().value;
            rd_params.ref_size = +ref_size.node().value;
            rd_params.fill_color = rendering_params['colorsByFeature'];

            let id_map = make_prop_symbols(rd_params),
                colors_breaks = [];

            for(let i = 0; i<rendering_params['breaks'].length-1; ++i)
                colors_breaks.push([rendering_params['breaks'][i] + " - " + rendering_params['breaks'][i+1], rendering_params['colors'][i]]);

            current_layers[new_layer_name] = {
                renderer: "PropSymbolsChoro",
                features_order: id_map,
                symbol: rd_params.symbol,
                ref_layer_name: layer,
                rendered_field: field1_selec.node().value,
                rendered_field2: field2_selec.node().value,
                size: [+ref_value.node().value, +ref_size.node().value],
                "stroke-width-const": 1,
                fill_color: { "class": id_map.map(obj => obj[3]) },
                colors_breaks: colors_breaks,
                is_result: true
            };

            binds_layers_buttons();
            zoom_without_redraw();
            switch_accordion_section();
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
        fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
        d3.selectAll(".params").attr("disabled", null)
    },

    unfill: function(){
        let field_selec = document.getElementById("choro_field_1"),
            nb_fields = field_selec.childElementCount;

        for(let i = nb_fields - 1; i > -1 ; --i)
            field_selec.removeChild(field_selec.children[i]);

        d3.selectAll(".params").attr("disabled", true);
    }
};

var fields_Typo = {
    fill: function(layer){
        if(!layer) return;
        let g_lyr_name = "#" + layer,
            fields = type_col(layer),
            fields_name = Object.getOwnPropertyNames(fields),
            field_selec = d3.select("#Typo_field_1");

        fields_name.forEach(f_name => {
            field_selec.append("option").text(f_name).attr("value", f_name);
        });
        d3.selectAll(".params").attr("disabled", null);
    },
    unfill: function(){
        let field_selec = document.getElementById("Typo_field_1"),
            nb_fields = field_selec.childElementCount;

        for(let i = nb_fields - 1; i > -1 ; --i)
            field_selec.removeChild(field_selec.children[i]);

        d3.selectAll(".params").attr("disabled", true);
    }
};

var fields_Label = {
    fill: function(layer){
        if(!layer) return;
        let g_lyr_name = "#" + layer,
            fields = type_col(layer),
            fields_name = Object.getOwnPropertyNames(fields),
            field_selec = d3.select("#Label_field_1"),
            field_prop_selec = d3.select("#Label_field_prop");


        fields_name.forEach(f_name => {
            field_selec.append("option").text(f_name).attr("value", f_name);
            if(fields[f_name] == "number")
                field_prop_selec.append("option").text(f_name).attr("value", f_name);
        });
        d3.selectAll(".params").attr("disabled", null);
    },
    unfill: function(){
        let field_selec = document.getElementById("Label_field_1"),
            nb_fields = field_selec.childElementCount;

        for(let i = nb_fields - 1; i > -1 ; --i)
            field_selec.removeChild(field_selec.children[i]);

        d3.selectAll(".params").attr("disabled", true);
    }
};

var fillMenu_Label = function(){
    var dv2 = section2.append("p").attr("class", "form-rendering"),
        rendering_params = new Object();

    var field_selec = dv2.append('p')
                            .html('Labels field ')
                         .insert('select')
                            .attr('class', 'params')
                            .attr('id', 'Label_field_1');

    var prop_selec = dv2.append('p').html('Proportional labels ')
                        .insert("input").attr("type", "checkbox")
                        .on("change", function(){
                            let display_style = this.checked ? "initial" : "none";
                            prop_menu.style("display", display_style);
                        });

    var prop_menu = dv2.append("div");

    var field_prop_selec = prop_menu.append("p").html("Proportional values field ")
                            .insert('select')
                            .attr('class', 'params')
                            .attr('id', 'Label_field_prop');

    var max_font_size = prop_menu.append("p").html("Maximum font size ")
                            .insert("input").attr("type", "number")
                            .attr({min: 0, max: 35, value: 11, step: 0.1});

    var ref_font_size = dv2.append("p").html("Reference font size ")
                            .insert("input").attr("type", "number")
                            .attr({min: 0, max: 35, value: 9, step: 0.1});


    var choice_font = dv2.append("p").html("Font ")
                            .insert("select")
                            .attr("class", "params")
                            .attr("id", "Label_font_name");
    var available_fonts = [
        ['Arial', 'Arial,Helvetica,sans-serif'],
        ['Arial Black', 'Arial Black,Gadget,sans-serif'],
        ['Comic Sans MS', 'Comic Sans MS,cursive,sans-serif'],
        ['Impact', 'Impact,Charcoal,sans-serif'],
        ['Georgia', 'Georgia,serif'],
        ['Lucida', 'Lucida Sans Unicode,Lucida Grande,sans-serif'],
        ['Palatino', 'Palatino Linotype,Book Antiqua,Palatino,serif'],
        ['Tahoma', 'Tahoma,Geneva,sans-serif'],
        ['Trebuchet MS', 'Trebuchet MS, elvetica,sans-serif'],
        ['Verdana', 'Verdana,Geneva,sans-serif']
        ];

    available_fonts.forEach( name => {
        choice_font.append("option").attr("value", name[1]).text(name[0]);
    });

    var choice_color = dv2.append("p").html("Label color ")
                            .insert("input").attr("type", "color")
                            .attr("class", "params")
                            .attr("id", "Label_color")
                            .attr("value", "#000");

    prop_menu.style("display", "none");

    dv2.insert("p").style({"text-align": "right", margin: "auto"})
        .append("button")
        .attr('id', 'Label_yes')
        .attr('class', 'button_st2')
        .html('Render')
        .on("click", function(){
            rendering_params["label_field"] = field_selec.node().value;
            if(prop_selec.node().checked){
                rendering_params["prop_field"] = field_prop_selec.node().value;
                rendering_params["max_size"] = max_font_size.node().value;
            }
            rendering_params["font"] = choice_font.node().value;
            rendering_params["ref_font_size"] = ref_font_size.node().value;
            rendering_params["color"] = choice_color.node().value;
            let layer = Object.getOwnPropertyNames(user_data)[0];
            let new_layer_name = render_label(layer, rendering_params);
            binds_layers_buttons(new_layer_name);
            switch_accordion_section();
         });
    d3.selectAll(".params").attr("disabled", true);
}

var render_label = function(layer, rendering_params){
    let label_field = rendering_params.label_field;
    let txt_color = rendering_params.color;
    let selected_font = rendering_params.font;
    let font_size = rendering_params.ref_font_size + "px"
    let new_layer_data = [];
    let ref_selection = document.getElementById(layer).querySelectorAll("path");
    let layer_to_add = check_layer_name("labels_" + layer);
    for(let i=0; i<ref_selection.length; i++){
        let ft = ref_selection[i].__data__;
        new_layer_data.push({label: ft.properties[label_field], coords: path.centroid(ft)})
    }
    map.append("g").attr({id: layer_to_add, class: "layer"})
        .selectAll("text")
        .data(new_layer_data).enter()
        .insert("text")
        .attr("x", d => d.coords[0])
        .attr("y", d => d.coords[1])
        .style("font-size", font_size)
        .style("fill", txt_color)
        .text(d => d.label);

    let class_name = "ui-state-default sortable_result " + layer_to_add,
        _list_display_name = get_display_name_on_layer_list(layer_to_add),
        layers_listed = layer_list.node(),
        li = document.createElement("li");

    li.setAttribute("layer_name", layer_to_add);
    li.setAttribute("class", class_name);
    li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2,
                    button_trash, button_zoom_fit,
                    button_active, button_type_blank['Point'],
                    "</div> ", _list_display_name].join('')
    layers_listed.insertBefore(li, layers_listed.childNodes[0])

    current_layers[layer_to_add] = {
        "renderer": "Label",
        "symbol": "text",
        "fill_color" : "black",
        "rendered_field": label_field,
        "is_result": true,
        "ref_layer_name": layer,
        };
    zoom_without_redraw();
    return layer_to_add;
}

var fillMenu_Typo = function(){
    var dv2 = section2.append("p").attr("class", "form-rendering"),
        rendering_params = new Object();

    var field_selec = dv2.append('p')
                            .html('Field ')
                         .insert('select')
                            .attr('class', 'params')
                            .attr('id', 'Typo_field_1');

    dv2.insert('p').style("margin", "auto").html("")
        .append("button")
        .attr({id: "Typo_class", class: "button_disc params"})
        .style({"font-size": "0.8em", "text-align": "center"})
        .html("Choose colors")
        .on("click", function(){
            let layer = Object.getOwnPropertyNames(user_data)[0];
            display_categorical_box(layer, field_selec.node().value)
                .then(function(confirmed){
                    if(confirmed){
                        d3.select("#Typo_yes").attr("disabled", null)
                        rendering_params = {
                                nb_class: confirmed[0], color_map :confirmed[1], colorByFeature: confirmed[2],
                                renderer:"Categorical", rendered_field: field_selec.node().value
                            }
                    }
                });
        });

    dv2.insert("p").style({"text-align": "right", margin: "auto"})
        .append("button")
        .attr('id', 'Typo_yes')
        .attr("disabled", true)
        .attr('class', 'button_st2')
        .html('Render')
        .on("click", function(){
            if(rendering_params){
                let layer = Object.getOwnPropertyNames(user_data)[0];
                render_categorical(layer, rendering_params);
                insert_legend_button(layer);
                binds_layers_buttons(layer);
                switch_accordion_section();
            }
         });
    d3.selectAll(".params").attr("disabled", true);
}

function fillMenu_Choropleth(){
    var dv2 = section2.append("p").attr("class", "form-rendering"),
        rendering_params = new Object();

    var field_selec = dv2.append('p')
                            .html('Field :')
                         .insert('select')
                            .attr('class', 'params')
                            .attr('id', 'choro_field_1');

    dv2.insert('p').style("margin", "auto").html("")
        .append("button")
        .attr({id: "choro_class", class: "button_disc params"})
        .style({"font-size": "0.8em", "text-align": "center"})
        .html("Display and arrange class")
        .on("click", function(){
            let layer_name = Object.getOwnPropertyNames(user_data)[0],
                opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer_name].length))
            display_discretization(layer_name, field_selec.node().value, opt_nb_class, "Quantiles")
                .then(function(confirmed){
                    if(confirmed){
                        d3.select("#choro_yes").attr("disabled", null)
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
        .attr("disabled", true)
        .attr('class', 'button_st2')
        .html('Render')
        .on("click", function(){
            if(rendering_params){
                let layer = Object.getOwnPropertyNames(user_data)[0];
                render_choro(layer, rendering_params);
                insert_legend_button(layer);
                binds_layers_buttons(layer);
                switch_accordion_section();
            }
         });
    d3.selectAll(".params").attr("disabled", true);
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

            if(current_layers[layer].original_fields.has(var1_name))
                val1_to_send[var1_name] = [];
            else
                val1_to_send[var1_name] = user_data[layer].map(i => +i[var1_name]);

            if(current_layers[layer].original_fields.has(var2_name))
                val2_to_send[var2_name] = [];
            else
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
                            current_layers[layer].colors_breaks = disc_result[2];
                            insert_legend_button(layer);
                            zoom_without_redraw();
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
                            binds_layers_buttons();
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
                error: function(error) { console.log(error); },
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
                        error: function(error) { console.log(error); },
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
                                binds_layers_buttons();
                                zoom_without_redraw();
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

var fields_Stewart = {
    fill: function(layer){
        let other_layers = get_other_layer_names(),
            mask_selec = d3.select("#stewart_mask");

        unfillSelectInput(mask_selec.node());
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
        let field_selec = document.getElementById("stewart_field"),
            mask_selec = document.getElementById("stewart_mask");
        unfillSelectInput(field_selec);
        unfillSelectInput(mask_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
};

function fillMenu_Stewart(){
    var dialog_content = section2.append("div").attr("class", "form-rendering");

    var field_selec = dialog_content.append('p').style("margin", "10px 0px 0px").html('Field ')
                                    .insert('select').attr('class', 'params marg_auto').attr("id", "stewart_field");

    {
        let p_span = dialog_content
                        .append("p")
                            .style({"float": "left"})
                            .text("Span ");
        var span = p_span.append('input')
                        .style("width", "60px")
                        .attr({type: 'number', class: 'params', id: "stewart_span", value: 5, min: 0.001, max: 100000.000, step: 0.001});
        p_span.insert("span").html(" km")

        var beta = dialog_content
                        .append('p')
                            .style({"float": "right", "margin-right": "35px"})
                            .html('Beta ')
                        .insert('input')
                            .style("width", "60px")
                            .attr({type: 'number', class: 'params', id: "stewart_beta", value: 2, min: 0, max: 11, step: 0.1});

        let p_reso = dialog_content
                            .append('p').text('Resolution (opt.) ');
        var resolution = p_reso.insert('input').style("width", "60px")
                            .attr({type: 'number', class: 'params', id: "stewart_resolution", min: 1, max: 1000000, step: 0.1});
        p_reso.insert("span").html(" km");
    }

    var func_selec = dialog_content.append('p').html('Function type ').insert('select').attr({class: 'params', id: "stewart_func"}),
        nb_class = dialog_content.append("p").html("Number of class ").insert("input").attr({type: "number", class: 'params', id: "stewart_nb_class", value: 8, min: 1, max: 22, step: 1}).style("width", "50px"),
        breaks_val = dialog_content.append("p").html("Break values (opt.)").insert("textarea").attr({class: 'params', id: "stewart_breaks"}).style({"width": "260px", "height": "30px"}),
        mask_selec = dialog_content.append('p').html('Clipping mask layer (opt.) ').insert('select').attr({class: 'params', id: "stewart_mask"});

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
                layer = Object.getOwnPropertyNames(user_data)[0],
                bval = breaks_val.node().value.trim(),
                reso = +resolution.node().value * 1000;

            bval = bval.length > 0 ? bval.split('-').map(val => +val.trim()) : null;

            if(current_layers[layer].original_fields.has(field_n))
                var_to_send[field_n] = [];
            else
                var_to_send[field_n] = user_data[layer].map(i => +i[field_n]);

            formToSend.append("json", JSON.stringify({
                "topojson": layer,
                "var_name": JSON.stringify(var_to_send),
                "span": +span.node().value * 1000,
                "beta": +beta.node().value,
                "typefct": func_selec.node().value,
                "resolution": reso > 0 ? reso : null,
                "nb_class": nb_class.node().value,
                "user_breaks": bval,
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
                        let data_split = data.split('|||'),
                            raw_topojson = data_split[0];
                        var n_layer_name = add_layer_topojson(raw_topojson, {result_layer_on_add: true});
                        if(!n_layer_name)
                            return;
                        else
                            var class_lim = JSON.parse(data_split[1]);
                    }
                    var col_pal = getColorBrewerArray(class_lim.min.length, "Purples"),
                        col_map = new Map(),
                        colors_breaks = [];
                    for(let i=0, i_len = class_lim.min.length; i < i_len; ++i){
                        let k = Math.round(class_lim.min[i] * 100) / 100;
                        col_map.set(k, col_pal[i]);
                        colors_breaks.push([class_lim['min'][i] + " - " + class_lim['max'][i], col_pal[i]])
                    }
                    current_layers[n_layer_name].fill_color = {"class": []};
                    current_layers[n_layer_name].renderer = "Stewart";
                    current_layers[n_layer_name].colors_breaks = colors_breaks;
                    current_layers[n_layer_name].rendered_field = field_selec.node().value;
                    d3.select("#"+n_layer_name)
                            .selectAll("path")
                            .style("fill", function(d, i){
                                    let k = Math.round(d.properties.min * 100) / 100,
                                        col = col_map.get(k);
                                    current_layers[n_layer_name].fill_color.class[i] = col;
                                    return col;
                            });
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

        option1_txt.html('Symbol type ');
        option2_txt.html("Symbol Max Size (px) ");
        option1_val = option1_txt.insert("select").attr({class: "params", id: "Anamorph_opt"});
        option2_val = option2_txt.insert("input").attr({type: "range", min: 0, max: 30, step: 0.1, value: 10, id: "Anamorph_opt2", class: "params"}).style("width", "50px");
        let option2_txt2 = option2_txt.append("span").attr("id", "Anamorph_opt_max_symb").html("10 px");
        symbols.forEach(function(symb){
            option1_val.append("option").text(symb[0]).attr("value", symb[1]);
        });
        option2_val.on("change", function(){
            option2_txt2.html(this.value + " px")
        });
    };

    var make_opt_iter = function(){
        option1_txt.html('N. iterations ');
        option2_txt.html(""),
        option1_val = option1_txt.insert('input')
                        .attr({type: 'number', class: 'params', value: 5, min: 1, max: 12, step: 1});
    };

    var make_opt_olson = function(){
        option1_txt.html("Scale reference size on : ");
        option2_txt.html("Maximum size modification (%) ");
        option1_val = option1_txt.insert("select").attr({class: "params", id: "Anamorph_opt"});
        [["Max. value (prevent overlapping)", "max"],
         ["Mean value (may cause overlapping)", "mean"]].forEach(function(opt_field){
            option1_val.append("option").attr("value", opt_field[1]).text(opt_field[0]);
        });

        option2_val = option2_txt.insert('input')
                        .style("width", "60px")
                        .attr({type: 'number', class: 'params', id: "Anamorph_opt2", value: 50, min: 0, max: 100, step: 1});
    };

    var dialog_content = section2.append("div").attr("class", "form-rendering"),
        algo_selec = dialog_content.append('p').html('Algorythm to use :').insert('select').attr('class', 'params'),
        field_selec = dialog_content.append('p').html('Field :').insert('select').attr({class: 'params', id: 'Anamorph_field'}),
        option1_txt = dialog_content.append('p').attr("id", "Anamorph_opt_txt").html('Symbol type'),
        option1_val = option1_txt.insert("select").attr({class: "params", id: "Anamorph_opt"}),
        option2_txt = dialog_content.append('p').attr("id", "Anamorph_opt_txt2").html("Symbol Max Size (px)"),
        option2_val = option2_txt.insert("input").attr({type: "range", min: 0, max: 30, step: 0.1, value: 10, id: "Anamorph_opt2", class: "params"}).style("width", "50px"),
        option2_txt2 = option2_txt.insert("span").html("10 px"),
        symbols = [["Circle", "circle"], ["Square", "rect"]];

    symbols.forEach(function(symb){
        option1_val.append("option").text(symb[0]).attr("value", symb[1]);
    });

    option2_val.on("change", function(){
        option2_txt2.html([this.value, " px"].join(''));
    });

    algo_selec.on("change", function(){

        if(this.value == "dorling")
            make_opt_dorling();
        else if(this.value == "olson")
            make_opt_olson();
        else
            make_opt_iter();
    });

    [['Pseudo-Dorling', 'dorling'],
     ['Dougenik & al. (1985)', 'dougenik'],
     ['Gastner & Newman (2004)', 'gastner'],
     ['Olson (2005)', 'olson']].forEach(function(fun_name){
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
            } else if (algo === "olson"){
                let field_n = field_selec.node().value,
                    layer = Object.getOwnPropertyNames(user_data)[0],
                    ref_size = option1_val.node().value,
                    scale_max = +option2_val.node().value / 100,
                    nb_ft = current_layers[layer].n_features,
                    dataset = user_data[layer];

                let layer_select = map.select("#"+layer).selectAll("path")[0],
                    d_values = new Array(nb_ft),
                    area_values = new Array(nb_ft);
                for(let i = 0; i < nb_ft; ++i){
                    d_values[i] = Math.sqrt(+dataset[i][field_n]);
                    area_values[i] = +path.area(layer_select[i].__data__.geometry);
                }

                let mean = d3.mean(d_values),
                    min = d3.min(d_values),
                    max = d3.max(d_values),
                    transform = [];
                if(ref_size == "mean"){
                    let low_ = Math.abs(mean-min),
                        up_ = Math.abs(max-mean),
                        max_dif = low_ > up_ ? low_ : up_;

                    for(let i= 0; i < nb_ft; ++i){
                        let val = d_values[i],
                            scale_area;
                        if(val > mean)
                            scale_area = 1 + scale_max / (max_dif / Math.abs(val-mean));
                        else if(val == mean)
                            scale_area = 1;
                        else
                            scale_area = 1 - scale_max / (max_dif / Math.abs(mean-val));
                        transform.push(scale_area)
                    }
                } else if (ref_size == "max"){
                    let max_dif = Math.abs(max-min);

                    for(let i= 0; i < nb_ft; ++i){
                        let val = d_values[i],
                            val_dif = max_dif / val,
                            scale_area;
                        if(val_dif < 1)
                            scale_area = 1;
                        else
                            scale_area = 1 - (scale_max / val_dif);
                        transform.push(scale_area)
                    }

                }
                let formToSend = new FormData();
                formToSend.append("json", JSON.stringify({topojson: layer, scale_values: transform, field_name: field_n, scale_max: scale_max}));
                $.ajax({
                    processData: false,
                    contentType: false,
                    cache: false,
                    url: '/R_compute/olson',
                    data: formToSend,
                    type: 'POST',
                    error: function(error) { console.log(error); },
                    success: function(result){
                        let n_layer_name = add_layer_topojson(result, {result_layer_on_add: true});
                        current_layers[n_layer_name].renderer = "OlsonCarto";
                        current_layers[n_layer_name].rendered_field = field_n;
                        current_layers[n_layer_name].scale_max = scale_max;
                        current_layers[n_layer_name].ref_layer_name = layer;
                        current_layers[n_layer_name].scale_byFeature = transform;
                        d3.select("#" + n_layer_name)
                                .selectAll("path")
                                //.style("fill", function(){ return Colors.random(); })
                                .style("fill-opacity", 0.8)
                                .style("stroke", "black")
                                .style("stroke-opacity", 0.8);
                    }
                });

//                result_data[new_layer_name] = new Array();
//                map.append("g").attr("id", new_layer_name)
//                      .attr("class", "result_layer layer")
//                      .style({"stroke-linecap": "round", "stroke-linejoin": "round"})
//                      .selectAll(".subunit")
//                      .data(topojson.feature(_target_layer_file, _target_layer_file.objects[layer]).features)
//                      .enter().append("path")
//                      .attr("d", path)
//                      .attr("id", function(d,ix) {
//                            result_data[new_layer_name].push(d.properties);
//                            return ["feature", ix].join('_');
//                        })
//                      .style("stroke", "rgb(0, 0, 0)")
//                      .style("stroke-opacity", .4)
//                      .style("fill", Colors.names[Colors.random()])
//                      .style("fill-opacity", 0.6)
//                      .attr("transform", function(d,i) {
//                            let centroid = path.centroid(d),
//                                x = centroid[0],
//                                y = centroid[1];
//                            return ["translate(", x, ",", y, ")",
//                                    "scale(", transform[i], ")",
//                                    "translate(", -x, ",", -y, ")"].join("");
//                        });

//                let class_name = "ui-state-default sortable_result " + new_layer_name,
//                    _list_display_name = get_display_name_on_layer_list(new_layer_name),
//                    layers_listed = layer_list.node(),
//                    li = document.createElement("li");
//
//                li.setAttribute("layer_name", new_layer_name);
//                li.setAttribute("class", class_name);
//                li.setAttribute("layer-tooltip", ["<b>", new_layer_name, "</b> - Polygon - ", nb_ft, " features"].join(''))
//                li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_legend, button_active, button_type_blank['Polygon'], "</div> ", _list_display_name].join('')
//                layers_listed.insertBefore(li, layers_listed.childNodes[0])

//                binds_layers_buttons();
//                zoom_without_redraw();
//                switch_accordion_section();
//                send_layer_server(new_layer_name, "/add_layer/olson")
            } else if (algo === "dougenik"){
                let formToSend = new FormData(),
                    field_n = field_selec.node().value,
                    layer = Object.getOwnPropertyNames(user_data)[0],
                    var_to_send = new Object(),
                    nb_iter = option1_val.node().value;

                if(current_layers[layer].original_fields.has(field_name))
                    var_to_send[field_name] = [];
                else
                    var_to_send[field_name] = user_data[layer].map(i => +i[field_name]);

                formToSend.append("json", JSON.stringify({
                    "topojson": layer,
                    "var_name": var_to_send,
//                    "var_name": JSON.stringify(var_to_send),
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
                        let n_layer_name = add_layer_topojson(data, {result_layer_on_add: true});
                        current_layers[n_layer_name].fill_color = { "random": true };
                        current_layers[n_layer_name].is_result = true;
                        current_layers[n_layer_name]['stroke-width-const'] = 0.8;
                        current_layers[n_layer_name].renderer = "Carto_doug";
                        current_layers[n_layer_name].rendered_field = field_name;
                        d3.select("#" + n_layer_name)
                            .selectAll("path")
                            .style("fill", function(){ return Colors.random(); })
                            .style("fill-opacity", 0.8)
                            .style("stroke", "black")
                            .style("stroke-opacity", 0.8)
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
//                    "stroke-width-const": 1,
//                    "is_result": true,
//                    "ref_layer_name": layer
//                    };
//                binds_layers_buttons();
//                zoom_without_redraw();
//                makeButtonLegend(new_layer_name);

            } else if (algo === "dorling"){
                let max_size = +document.getElementById("Anamorph_opt2").value,
                    ref_size = 0.1,
                    layer_to_add =  check_layer_name(["DorlingCarto", layer, field_name].join('_')),
                    shape_symbol = option1_val.node().value;

                let features_order = make_dorling_demers(layer, field_name, max_size, ref_size, shape_symbol, layer_to_add);

                let class_name = "ui-state-default sortable_result " + layer_to_add,
                    _list_display_name = get_display_name_on_layer_list(layer_to_add),
                    layers_listed = layer_list.node(),
                    li = document.createElement("li");

                li.setAttribute("layer_name", layer_to_add);
                li.setAttribute("class", class_name);
                li.setAttribute("layer-tooltip", ["<b>", layer_to_add, "</b> - Point - ", current_layers[layer].n_features, " features"].join(''))
                li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_legend, button_active, button_type_blank['Point'], "</div> ", _list_display_name].join('')
                layers_listed.insertBefore(li, layers_listed.childNodes[0])
                current_layers[layer_to_add] = {
                    "renderer": "DorlingCarto",
                    "type": "Point",
                    "symbol": shape_symbol,
                    "rendered_field": field_name,
                    "size": [ref_size, max_size],
                    "stroke-width-const": 1,
                    "is_result": true,
                    "features_order": features_order,
                    "ref_layer_name": layer,
                    "fill_color": {"random": true}
                    };
                binds_layers_buttons();
                zoom_without_redraw();
                switch_accordion_section();

                }
    });
    d3.selectAll(".params").attr("disabled", true);
}


function make_dorling_demers(layer, field_name, max_size, ref_size, shape_symbol, layer_to_add){
//    let ref_layer_selection  = d3.select("#"+layer).selectAll("path"),
    let ref_layer_selection = document.getElementById(layer).querySelectorAll("path"),
        nb_features = current_layers[layer].n_features,
        d_values = [],
        zs = zoom.scale(),
        symbol_layer = undefined,
        comp = (a,b) => a[1] < b[1],
        force = d3.layout.force().charge(0).gravity(0).size([w, h]);

    for(let i = 0; i < nb_features; ++i){
        let val = +user_data[layer][i][field_name];
        let pt = path.centroid(ref_layer_selection[i].__data__.geometry)
        d_values.push([i, val, pt]);
    }
    d_values = prop_sizer2(d_values, Number(ref_size / zs), Number(max_size / zs));
    d_values.sort(comp);

    let nodes = d_values.map(function(d, i){
        let val = +ref_layer_selection[d[0]].__data__.properties[field_name];
        return {x: d[2][0], y: d[2][1],
                x0: d[2][0], y0: d[2][1],
                r: d[1],
                value: val,
                ix: d[0]};
        });

    let bg_color = Colors.random(),
        stroke_color = "black";

    force.nodes(nodes).on("tick", tick).start();

    if(shape_symbol == "circle") {
        symbol_layer = map.append("g").attr("id", layer_to_add)
                          .attr("class", "result_layer layer")
                          .selectAll("circle")
                          .data(nodes).enter()
                          .append("circle")
                            .attr("id", (d,i) => ["PropSymbol_", i, " feature_", d.ix].join(''))
                            .attr("r", function(d){ return d.r; })
                            .style("fill", function(){ return Colors.random();})
                            .style("stroke", "black");
    } else {
        symbol_layer = map.append("g").attr("id", layer_to_add)
                          .attr("class", "result_layer layer")
                          .selectAll("rect")
                          .data(nodes).enter()
                          .append("rect")
                            .attr("id", (d,i) => ["PropSymbol_", i, " feature_", d.ix].join(''))
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
    return d_values;
}


var boxExplore = {
    display_table: function(table_name){
        document.querySelector("body").style.cursor = "";
        let the_table = this.layer_names.get(table_name)[1];
        this.current_table = table_name;
        this.nb_features = the_table.length;
        this.columns_names = Object.getOwnPropertyNames(the_table[0]);
        this.columns_headers = [];
        for(let i=0, col=this.columns_names, len = col.length; i<len; ++i)
            this.columns_headers.push({data: col[i], title: col[i]});
        if(this.top_buttons.select("#add_field_button").node()){
            this.top_buttons.select("#add_field_button").remove()
            document.getElementById("table_intro").remove();
            document.getElementById("myTable").remove();
            document.getElementById("myTable_wrapper").remove();
        }
        let self = this;
        this.top_buttons
             .insert("button")
             .attr({id: "add_field_button", class: "button_st3"})
             .html("Add a new field...")
             .on('click', function(){
                add_table_field(the_table, table_name, self);
             });
        let txt_intro = [
            "<b>", table_name, "</b><br>",
            this.nb_features, " features - ",
            this.columns_names.length, " fields"].join('');
        this.box_table.append("p").attr('id', 'table_intro').html(txt_intro);
        this.box_table.append("table")
                      .attr({class: "display compact", id: "myTable"})
                      .style("width", "80%");
        let myTable = $('#myTable').DataTable({
            data: the_table,
            columns: this.columns_headers,
        });
    },
    get_available_tables: function(){
        let target_layer = Object.getOwnPropertyNames(user_data),
            ext_dataset = dataset_name,
            result_layers = Object.getOwnPropertyNames(result_data),
            available = new Map();
        for(let lyr_name of target_layer)
            available.set(lyr_name, ["Target layer", user_data[lyr_name]])
        if(ext_dataset)
            available.set(dataset_name, ["Ext. dataset", joined_dataset[0]])
        for(let lyr_name of result_layers)
            available.set(lyr_name, ["Result layer", result_data[lyr_name]])
        return available;
    },
    create: function(){
        this.layer_names = this.get_available_tables()
        if(this.layer_names.size == 0) return;
        this.columns_headers = [];
        this.nb_features = undefined;
        this.columns_names = undefined;
        this.current_table = undefined,
        this.box_table = d3.select("body").append("div")
                            .attr({id: "browse_data_box", title: "Explore dataset"})
                            .style("font-size", "0.75em");

        let self = this;

        this.top_buttons = this.box_table.append('p')
                                    .style({"margin-left": "15px", "display": "inline", "font-size": "12px"});

        let select_a_table = this.box_table
                                .append('p').html("Available tables :")
                                .insert("select").attr({id: "select_table"})
                                .on("change", function(){
                                    self.display_table(this.value);
                                })

        this.layer_names.forEach( (value, key) => {
            let txt = [key, " (", value[0], ")"].join('')
            select_a_table.append("option").attr("value", key).text(txt)
        });
        setSelected(select_a_table.node(), select_a_table.node().options[0].value);
        var deferred = Q.defer();
        $("#browse_data_box").dialog({
            modal:false,
            resizable: true,
            width: Math.round(window.innerWidth * 0.8),
//            buttons:[{
//                    text: "Confirm",
//                    click: function(){deferred.resolve([true, true]);$(this).dialog("close");}
//                        },
//                   {
//                    text: "Cancel",
//                    click: function(){$(this).dialog("close");$(this).remove();}
//                   }],
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

        field_selec.on("change", function(){
            let field_name = this.value,
                data_layer = user_data[layer],
                field_values = data_layer.map(obj => +obj[field_name]),
                max_val_field = Math.max.apply(null, field_values),
                ref_value_field = document.getElementById("PropSymbol_ref_value").querySelector('input');
            ref_value_field.setAttribute("max", max_val_field);
            ref_value_field.setAttribute("value", max_val_field);
        })
    },

    unfill: function(){
        let field_selec = document.getElementById("PropSymbol_field_1");
        unfillSelectInput(field_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
};

function fillMenu_PropSymbol(layer){
    var dialog_content = section2.append("p").attr("class", "form-rendering"),
        field_selec = dialog_content.append('p').html('Field ').insert('select').attr({class: 'params', 'id': "PropSymbol_field_1"}),
        max_allowed_size = Math.round(h/2 - h/20),
        ref_size = dialog_content.append('p').style("display", "inline").html('Fixed size ')
                         .insert('input')
                         .attr({type: 'number', class: 'params'})
                         .attr({min: 0.2, max: max_allowed_size, value: 10.0, step: 0.1})
                         .style("width", "50px");

    dialog_content.append('span').html(" px");

    var ref_value = dialog_content.append('p').attr("id", "PropSymbol_ref_value")
                            .html('on value ... ')
                            .insert('input')
                            .style({'width': '100px', "margin-left": "65px"})
                            .attr({type: 'number', class: "params", min: 0.1, step: 0.1});

    var symb_selec = dialog_content
                        .append('p').html('Symbol type ')
                        .insert('select').attr('class', 'params');

    [['Circle', "circle"], ['Square', "rect"]].forEach(function(symb){
        symb_selec.append("option").text(symb[0]).attr("value", symb[1]);});

    var fill_color = dialog_content.append('p').html('Symbol color ')
              .insert('input').attr('type', 'color').attr({class: "params", "value": Colors.names[Colors.random()]});

    var behavior_onzoom = dialog_content.append('p').html("Recompute symbol size when zooming")
                                .insert("input").attr({type: "checkbox", class: "params"});

    dialog_content.insert("p").style({"text-align": "right", margin: "auto"})
        .append('button')
        .attr('id', 'yes')
        .attr("class", "params button_st2")
        .html('Compute')
        .on("click", function(){
            let layer = Object.getOwnPropertyNames(user_data)[0],
                nb_features = user_data[layer].length,
                new_layer_name = check_layer_name(layer + "_PropSymbols"),
                rendering_params = { "field": field_selec.node().value,
                                     "nb_features": nb_features,
                                     "new_name": new_layer_name,
                                     "ref_layer_name": layer,
                                     "symbol": symb_selec.node().value,
                                     "ref_size": +ref_size.node().value,
                                     "ref_value": +ref_value.node().value,
                                     "fill_color": fill_color.node().value };
            make_prop_symbols(rendering_params);
            binds_layers_buttons();
            zoom_without_redraw();
            switch_accordion_section();

        });
    d3.selectAll(".params").attr("disabled", true);
}


function make_prop_symbols(rendering_params){
    let layer = rendering_params.ref_layer_name,
        field = rendering_params.field,
        nb_features = rendering_params.nb_features,
        values_to_use = rendering_params.values_to_use,
        d_values = new Array(nb_features),
        comp = function(a, b){ return b[1]-a[1]; },
        ref_layer_selection = document.getElementById(layer).querySelectorAll("path"),
        ref_size = rendering_params.ref_size,
        ref_value = rendering_params.ref_value,
        symbol_type = rendering_params.symbol,
        zs = zoom.scale();

    if(values_to_use)
        for(let i = 0; i < nb_features; ++i){
            let centr = path.centroid(ref_layer_selection[i].__data__);
            d_values[i] = [i, +values_to_use[i], centr];
        }
    else
        for(let i = 0; i < nb_features; ++i){
            let centr = path.centroid(ref_layer_selection[i].__data__);
            d_values[i] = [i, +user_data[layer][i][field], centr];
        }

    d_values = prop_sizer3(d_values, ref_value, ref_size, symbol_type);
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

    let layer_to_add = rendering_params.new_name;

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

    if(symbol_type === "circle"){
        for(let i = 0; i < d_values.length; i++){
            let params = d_values[i];
            symbol_layer.append('circle')
                .attr('cx', params[2][0])
                .attr("cy", params[2][1])
                .attr("r", params[1])
                .attr("id", ["PropSymbol_", i , " feature_", params[0]].join(''))
                .style("fill", params[3])
                .style("stroke", "black")
                .style("stroke-width", 1 / zs);
        }
    } else if(symbol_type === "rect"){
        for(let i = 0; i < d_values.length; i++){
            let params = d_values[i],
                size = params[1];

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
        _list_display_name = get_display_name_on_layer_list(layer_to_add),
        layers_listed = layer_list.node(),
        li = document.createElement("li");

    li.setAttribute("layer_name", layer_to_add);
    li.setAttribute("class", class_name);
    li.setAttribute("layer-tooltip",
            ["<b>", layer_to_add, "</b> - Point - ", nb_features, " features"].join(''))
    li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2,
                    button_trash, button_zoom_fit, button_legend,
                    button_active, button_type_blank['Point'],
                    "</div> ", _list_display_name].join('')
    layers_listed.insertBefore(li, layers_listed.childNodes[0])

    let fill_color = rendering_params.fill_color instanceof Array
                    ? {"class": rendering_params.fill_color}
                    : {"single" : rendering_params.fill_color};
    current_layers[layer_to_add] = {
        "renderer": rendering_params.renderer || "PropSymbols",
        "symbol": symbol_type,
        "fill_color" : fill_color,
        "rendered_field": field,
        "size": [ref_value, ref_size],
        "stroke-width-const": 1,
        "is_result": true,
        "ref_layer_name": layer,
        "features_order": d_values
        };
    return d_values;
}

var fields_griddedMap = {
    fill: function(layer){
        if(!layer) return;

        let fields = type_col(layer, "number"),
            field_selec = d3.select("#Gridded_field");

        fields.forEach(function(field){
            field_selec.append("option").text(field).attr("value", field); });
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
        field_selec = dialog_content.append('p').html('Field ').insert('select').attr({class: 'params', id: "Gridded_field"}),
        cellsize = dialog_content.append('p').html('Cell size <i>(meters)</i> ').insert('input').attr({type: 'number', class: 'params', value: 0, min: 1000, max: 700000, step: 0.1}),
        col_pal = dialog_content.append('p').html('Colorramp ').insert('select').attr('class', 'params');

    ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn',
    'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(function(d, i){
            col_pal.append("option").text(d).attr("value", d);
    });

    dialog_content.insert("p")
        .style({"text-align": "right", margin: "auto"})
        .append('button')
        .attr("class", "params button_st2")
        .attr('id', 'Gridded_yes')
        .html('Compute and render')
        .on("click", function(){
            let field_n = field_selec.node().value,
                layer = Object.getOwnPropertyNames(user_data)[0],
                formToSend = new FormData(),
                var_to_send = new Object();

            if(current_layers[layer].original_fields.has(field_n))
                var_to_send[field_n] = [];
            else
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
                    let n_layer_name = add_layer_topojson(data, {result_layer_on_add: true});
                    if(!n_layer_name)
                        return;
                    let res_data = result_data[n_layer_name],
                        opt_nb_class = Math.floor(1 + 3.3 * Math.log10(res_data.length)),
                        d_values = res_data.map(obj => +obj["densitykm"]);

                    current_layers[n_layer_name].renderer = "Gridded";
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

function render_categorical(layer, rendering_params){
    var colorsByFeature = rendering_params.colorByFeature,
        color_map = rendering_params.color_map,
        field = rendering_params.rendered_field,
        layer_to_render = map.select("#" + layer).selectAll("path");

    layer_to_render.style("fill", (d,i) => colorsByFeature[i])
                    .style("fill-opacity", 0.9)
                    .style("stroke-opacity", 0.9)
                    .style("stroke", "black");
    current_layers[layer].renderer = rendering_params['renderer'];
    current_layers[layer].rendered_field = field;
    current_layers[layer].fill_color = {"class": rendering_params['colorByFeature']};
    current_layers[layer]['stroke-width-const'] = 0.75;
    current_layers[layer].is_result = true;
    current_layers[layer].color_map = color_map;
    zoom_without_redraw();
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
    current_layers[layer].fill_color = {"class": rendering_params['colorsByFeature']};
    current_layers[layer]['stroke-width-const'] = 0.75;
    current_layers[layer].is_result = true;
    let colors_breaks = [];
    for(let i = 0; i<rendering_params['breaks'].length-1; ++i){
        colors_breaks.push([
                [rendering_params['breaks'][i], " - ", rendering_params['breaks'][i+1]].join(''),
                rendering_params['colors'][i]
            ])
        }
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

function prop_sizer3(arr, fixed_value, fixed_size, type_symbol){
    let pi = Math.PI,
        arr_len = arr.length,
//        p_scale = proj.scale(),
        z_scale = zoom.scale(),
        res = [];

    fixed_value = Math.sqrt(fixed_value / z_scale);

    if(type_symbol == "circle")
        for(let i=0; i < arr_len; ++i){
            let val = arr[i];
            res.push(
                [val[0], Math.sqrt(pi * val[1] * fixed_size / fixed_value), val[2]]
                )
        }
    else
        for(let i=0; i < arr_len; ++i){
            let val = arr[i];
            res.push(
                [val[0], Math.sqrt(val[1] * fixed_size / fixed_value), val[2]]
                )
        }
    return res
}

function prop_sizer3_e(arr, fixed_value, fixed_size, type_symbol){
    let pi = Math.PI,
        arr_len = arr.length,
//        p_scale = proj.scale(),
        z_scale = zoom.scale(),
        res = [];

    fixed_value = Math.sqrt(fixed_value / z_scale);

    if(type_symbol == "circle")
        for(let i=0; i < arr_len; ++i)
            res.push(Math.sqrt(pi * arr[i] * fixed_size / fixed_value));

    else
        for(let i=0; i < arr_len; ++i)
            res.push(Math.sqrt(arr[i] * fixed_size / fixed_value));

    return res
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

function get_nb_decimals(nb){
    let tmp = nb.toString().split('.');
    return tmp.length < 2 ? 0 : tmp[1].length;
}

var type_col = function(layer_name, target, skip_if_empty_values=false){
// Function returning an object like {"field1": "field_type", "field2": "field_type"},
//  for the fields of the selected layer.
// If target is set to "number" it should return an array containing only the name of the numerical fields
// ------------------- "string" ---------------------------------------------------------non-numerial ----
    var table = user_data.hasOwnProperty(layer_name) ? user_data[layer_name]
                    : result_data.hasOwnProperty(layer_name) ? result_data[layer_name]
                    : joined_dataset[0],
        fields = Object.getOwnPropertyNames(table[0]),
        nb_features = table.length,
        deepth_test = 10 < nb_features ? 10 : nb_features,
        result = new Object(),
        field = undefined,
        tmp_type = undefined;

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
function add_table_field(table, layer_name, parent){
    function check_name(){
        if(regexp_name.test(this.value))
            chooses_handler.new_name = this.value;
        else { // Rollback to the last correct name  :
            this.value = chooses_handler.new_name;
            alert("Unauthorized character");
        }
    };

    function compute_and_add(){
        let options = chooses_handler;
        let fi1 = options.field1,
            fi2 = options.field2,
            new_name_field = options.new_name,
            operation = options.operator;

        if(options.type_operation === "math_compute" && table.length > 3200){
            let formToSend = new FormData();
            formToSend.append('var1', JSON.stringify(table.map( d => d[fi1])));
            formToSend.append('var2', JSON.stringify(table.map( d => d[fi2])));
            formToSend.append('operator', operation);
            return request_data("POST", "/helpers/calc", formToSend).then(function(e){
                let data = JSON.parse(e.target.responseText);
//                console.log(e.target.responseText)
                for(let i=0; i<table.length; i++)
                    table[i][new_name_field] = data[i];
                return true;
            });
        }
        else if(options.type_operation === "math_compute"){
            for(let i=0; i<table.length; i++)
                table[i][new_name_field] = +eval([+table[i][fi1], operation, +table[i][fi2]].join(' '));
            return Promise.resolve(true);
        } else {
            let opt_val = options.opt_val;
            if(operation == "Truncate"){
                for(let i=0; i < table.length; i++)
                    table[i][new_name_field] = table[i][fi1].substring(0, +opt_val);

            } else if (operation == "Concatenate"){
                for(let i=0; i < table.length; i++)
                    table[i][new_name_field] = [table[i][fi1], table[i][fi2]].join(opt_val);
            }
            return Promise.resolve(true);
        }
        return Promise.reject("Unknown error")
    };


    function refresh_type_content(type){
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

    function refresh_subtype_content(type, subtype){
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

    var box = make_confirm_dialog("", "Valid", "Cancel", "Add a new field",
                    "addFieldBox", 430 < w ? 430 : undefined, 280 < h ? 280 : undefined).then(function(valid){
            if(valid){
                document.querySelector("body").style.cursor = "wait";
//                console.log(chooses_handler);
                let tmp = compute_and_add(chooses_handler);
//                console.log(tmp);
                tmp.then(function(resolved){
                        if(resolved){
                            fields_handler.unfill();
                            fields_handler.fill(layer_name);
                            if(parent)
                                parent.display_table(layer_name);
                        }
                    }, function(error){
                        alert("Somethng wrong happened");
                });
            }
        });

    var current_fields = Object.getOwnPropertyNames(table),
        fields_type = type_col(layer_name),
        box_content = d3.select(".addFieldBox").append("div"),
        div1 = box_content.append("div").attr("id", "field_div1"),
        div2 = box_content.append("div").attr("id", "field_div2"),
        new_name = div1.append("p").html("New field name :<br>").insert("input").attr('value', 'NewFieldName').on("keyup", check_name),
        type_content = div1.append("p").html("New field content :<br>")
                            .insert("select").attr("id", "type_content_select")
                            .on("change", function(){ chooses_handler.type_operation = this.value; refresh_type_content(this.value);}),
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

    var math_operation = ["+", "-", "*", "/"],
        string_operation = ["Concatenate", "Truncate"];

    {
        let a = type_content.node(),
            b = false;
        for(let fi in fields_type){
            if(fields_type[fi] == "number"){
                b = true;
                break;
            }
        }
        a.value = b ? "math_compute" : "string_field";
        a.dispatchEvent(new Event('change'));
    }

    return box;
}

var contains_empty_val = function(arr){
    for(let i = arr.length - 1; i > -1; --i)
        if(arr[i] == null) return true;
    return false
}

// Function to be called after clicking on "render" in order to close the section 2
// and to have the section 3 opened
function switch_accordion_section(){
    let section2 = document.getElementById("accordion2").firstChild,
        section3 = document.getElementById("accordion3").firstChild;
    if(section2.getAttribute("aria-expanded") == "true")
        section2.dispatchEvent(new Event("click"));
    if(section3.getAttribute("aria-expanded") == "false")
        section3.dispatchEvent(new Event("click"));
}

function haversine_dist(A, B){
    let pi_dr = Math.PI / 180;

    let lat1 = A[0], lon1 = A[1],
        lat2 = B[0], lon2 = B[1];

    let x1 = lat2 - lat1,
        dLat = x1 * pi_dr,
        x2 = lon2 - lon1,
        dLon = x2 * pi_dr;

    let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * pi_dr) * Math.cos(lat2 * pi_dr) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function path_to_geojson(id_layer){
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
                geometry: {type: d.type, coordinates: d.coordinates}
            })
        });
    return JSON.stringify({
        type: "FeatureCollection",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: result_geojson
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

function request_data(method, url, data){
    return new Promise(function(resolve, reject){
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = resolve;
        request.onerror = reject;
        request.send(data);
    });
}