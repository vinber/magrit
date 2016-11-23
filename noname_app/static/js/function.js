"use strict";

function get_menu_option(func){
    var menu_option = {
        "smooth":{
            "name": "smooth",
            "title": i18next.t("app_page.func_title.smooth"),
            "menu_factory": "fillMenu_Stewart",
            "fields_handler": "fields_Stewart",
            },
        "prop":{
            "name": "prop",
            "title": i18next.t("app_page.func_title.prop"),
            "menu_factory": "fillMenu_PropSymbol",
            "fields_handler": "fields_PropSymbol",
            },
        "choroprop":{
            "name": "choroprop",
            "title": i18next.t("app_page.func_title.choroprop"),
            "menu_factory": "fillMenu_PropSymbolChoro",
            "fields_handler": "fields_PropSymbolChoro",
            },
        "proptypo":{
            "name": "proptypo",
            "title": i18next.t("app_page.func_title.proptypo"),
            "menu_factory": "fillMenu_PropSymbolTypo",
            "fields_handler": "fields_PropSymbolTypo",
            },
        "choro":{
            "name": "choro",
            "title": i18next.t("app_page.func_title.choro"),
            "menu_factory": "fillMenu_Choropleth",
            "fields_handler": "fields_Choropleth",
            },
        "cartogram":{
            "name": "cartogram",
            "title": i18next.t("app_page.func_title.cartogram"),
            "menu_factory": "fillMenu_Anamorphose",
            "fields_handler": "fields_Anamorphose",
            "add_options": "keep_file",
            },
        "grid":{
            "name": "grid",
            "title": i18next.t("app_page.func_title.grid"),
            "menu_factory": "fillMenu_griddedMap",
            "fields_handler": "fields_griddedMap",
            },
        "flow":{
            "name": "flow",
            "title": i18next.t("app_page.func_title.flow"),
            "menu_factory": "fillMenu_FlowMap",
            "fields_handler": "fields_FlowMap",
            },
        "discont":{
            "name": "discont",
            "title": i18next.t("app_page.func_title.discont"),
            "menu_factory": "fillMenu_Discont",
            "fields_handler": "fields_Discont",
            "add_options": "keep_file",
            },
        "typo":{
            "name": "typo",
            "title": i18next.t("app_page.func_title.typo"),
            "menu_factory": "fillMenu_Typo",
            "fields_handler": "fields_Typo",
            },
        "typosymbol":{
            "name": "typosymbol",
            "title": i18next.t("app_page.func_title.typosymbol"),
            "menu_factory": "fillMenu_TypoSymbol",
            "fields_handler": "fields_TypoSymbol",
            }
    };
    return menu_option[func.toLowerCase()] || {};
}

/**
* Remove the div on which we are displaying the options related to each
* kind of rendering.
*
*/
function clean_menu_function(){
    section2.select(".form-rendering").remove();
}

/**
* Function to remove each node (each <option>) of a <select> HTML element :
*
*/
function unfillSelectInput(select_node){
    for(let i = select_node.childElementCount - 1; i > -1; i--)
        select_node.removeChild(select_node.children[i]);
}


/** Function trying to avoid layer name collision by adding a suffix
* to the layer name if already exists and incrementing it if necessary
* (MyLayer -> MyLayer_1 -> MyLayer_2 etc.)
*
* @param {string} name - The original wanted name of the layer to add
* @return {string} new_name - An available name to safely add the layer
*     (the input name if possible or a slightly modified
*        one to avoid collision or unwanted characters)
*/
function check_layer_name(name){
    if(!(current_layers.hasOwnProperty(name)))
        return name;
    else {
        let i = 1;
        if(name.match(/_\d+$/)){
            i = name.match(/_\d+$/);
            name = name.substring(name, name.indexOf(i));
            return check_layer_name([name, parseInt(i.slice(1, i.length)) + 1].join('_'));
        }
        else {
            name = [name, i].join('_');
            return check_layer_name(name);
        }
    }
}
/**
* Display a message when switching between functionnalitiesif the layer to render
* doesn't have any interesting field to use.
*/
function display_error_num_field(){
    swal({title: "",
          text: i18next.t("app_page.common.error_numerical_fields"),
          type: "error"});
};

/**
* Return an approximate value (based on the bbox of the targeted layer)
* to fill the "span" field in stewart functionnality
* as well as the "resolution" field in grid functionnality.
*
*/
var get_first_guess_span = function(){
    let bbox = _target_layer_file.bbox,
        abs = Math.abs;
    let width_km = haversine_dist([bbox[0], abs(bbox[3]) - abs(bbox[1])],
                                  [bbox[2], abs(bbox[3]) - abs(bbox[1])]),
        height_km = haversine_dist([abs(bbox[2]) - abs(bbox[0]), bbox[1]],
                                   [abs(bbox[2]) - abs(bbox[0]), bbox[3]]);
    return Math.round((width_km + height_km) / 2 * 0.02);
}

/**
* Check if the wanted resolution isn't too big before sending the request
* to the server.
*
*/
function test_maxmin_resolution(cell_value){
    let bbox = _target_layer_file.bbox,
        abs = Math.abs;
    let width_km = haversine_dist(
            [bbox[0], abs(bbox[3]) - abs(bbox[1])], [bbox[2], abs(bbox[3]) - abs(bbox[1])]);
    let height_km = haversine_dist(
            [abs(bbox[2]) - abs(bbox[0]), bbox[1]], [abs(bbox[2]) - abs(bbox[0]), bbox[3]]);
    let area = width_km * height_km,
        bigger_side = Math.max(height_km, width_km);
    if(area / (cell_value * cell_value) > 15000)
        return "higher";
    else if(cell_value > bigger_side / 1.66)
        return "lower"
    return;
}


function make_template_functionnality(parent_node){
    let dialog_content = parent_node.append("div").attr("class", "form-rendering");
    dialog_content.append("p").attr("class", "container_img_help")
        .append("img")
        .attrs({id: "btn_info", src: "/static/img/Information.png", width: "17", height: "17", alt: "Informations",
                class: "help_tooltip", "data-tooltip_help": " "})
        .styles({"cursor": "pointer"});
    return dialog_content;
}

function make_layer_name_button(parent, id){
    let a = parent.append('p');
    a.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.output'})
      .html(i18next.t('app_page.func_options.common.output'));
    a.insert('input')
      .style('width', '240px')
      .attrs({class: 'params', id: id});
}

function make_ok_button(parent, id, disabled=true){
  let a = parent.append('p')
    .styles({"text-align": "right", margin: "auto"});
  a.append('button')
    .attrs({'id': id, 'class': 'params button_st3 i18n',
            'data-i18n': '[html]app_page.func_options.common.render',
            'disabled': disabled ? true : null})
    .html(i18next.t('app_page.func_options.common.render'));
}

function insert_legend_button(layer_name){
    let selec = d3.select("#sortable").select(['.', layer_name, ' .layer_buttons'].join('')),
        inner_html = selec.node().innerHTML,
        const_delim = ' <img src="/static/img/Inkscape_icons_zoom_fit_page.svg"',
        split_content = inner_html.split();
    selec.node().innerHTML = [split_content[0], button_legend, const_delim, split_content[1]].join('');
}

function make_min_max_tableau(values, nb_class, disc_kind, min_size, max_size, id_parent, breaks, callback){
    document.getElementById(id_parent).innerHTML = "";
    if(values && breaks == undefined){
        let disc_result = discretize_to_size(values, disc_kind, nb_class, min_size, max_size);
        breaks = disc_result[2];
        if(!breaks)
            return false;
    }

    let parent_nd = d3.select("#" + id_parent);

    parent_nd
        .append("p")
        .style("word-spacing", "1.8em")
        .html('Min - Max - Size');
    parent_nd
        .append("div")
        .selectAll("p")
        .data(breaks).enter()
        .append("p")
            .style("margin", "0px")
            .attr("class", "breaks_vals")
            .attr("id", (d,i) => ["line", i].join('_'));

    let selec = parent_nd.selectAll(".breaks_vals");

    for(let i = 0; i < selec._groups[0].length; i++){
        let selection = parent_nd.select('#line_' + i);
        selection
            .insert('input')
            .style("width", "60px")
            .attrs({type: 'number', class: 'min_class', step: 0.1, value: (+breaks[i][0][0]).toFixed(2)});

        selection
            .insert('input')
            .style("width", "60px")
            .attrs({type: 'number', class: 'max_class', step: 0.1, value: (+breaks[i][0][1]).toFixed(2)});

        selection
            .insert('input')
            .attrs({type: 'number', class: 'size_class', step: 0.11, value: (+breaks[i][1]).toFixed(2)})
            .styles({"margin-left": "20px", width: '55px'});

        selection
            .insert('span')
            .html(" px");
    }
    let mins = document.getElementById(id_parent).getElementsByClassName("min_class"),
        maxs = document.getElementById(id_parent).getElementsByClassName("max_class");

    for(let i = 0; i < mins.length; i++){
        if(i > 0){
            let prev_ix = i-1;
            mins[i].onchange = function(){
              maxs[prev_ix].value = this.value;
              if(callback) callback();
            };
        }
        if(i < mins.length - 1){
            let next_ix = i+1;
            maxs[i].onchange = function(){
              mins[next_ix].value = this.value;
              if(callback) callback();
            };
        }
    }
    if(callback){
      let sizes = document.getElementById(id_parent).getElementsByClassName("size_class")
      for(let i = 0; i < sizes.length; i++){
        sizes[i].onchange = callback;
      }
    }
}

function fetch_min_max_table_value(parent_id){
    var parent_node = parent_id ? document.getElementById(parent_id)
                        : current_functionnality.name == "flow" ? document.getElementById("FlowMap_discTable")
                        : current_functionnality.name == "discont" ? document.getElementById("Discont_discTable")
                        : null;

    if(!parent_node) return;

    let mins = Array.prototype.map.call(parent_node.getElementsByClassName("min_class"), el => +el.value),
        maxs = Array.prototype.map.call(parent_node.getElementsByClassName("max_class"), el => +el.value),
        sizes = Array.prototype.map.call(parent_node.getElementsByClassName("size_class"), el => +el.value),
        nb_class = mins.length,
        comp_fun = (a,b) => a - b;

// Some verification regarding the input values provided by the user :
// - Values are ordered :
    if(mins != mins.sort(comp_fun)
            || maxs != maxs.sort(comp_fun)
            || sizes != sizes.sort(comp_fun)){
        swal("",
             i18next.t("app_page.common.error_values_order"),
             "error");
        return false;
    }

    return {"mins" : mins.sort(comp_fun), "maxs" : maxs.sort(comp_fun), "sizes" : sizes.sort(comp_fun)};
}

function fillMenu_PropSymbolChoro(layer){
    var rendering_params = fields_PropSymbolChoro.rendering_params,
        dv2 = make_template_functionnality(section2);

    var a = dv2.append('p').attr('class', 'params_section2');
    a.append("span")
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.field1'})
      .html(i18next.t("app_page.func_options.choroprop.field1"));
    var field1_selec = a.insert('select')
      .attrs({class: 'params', id: 'PropSymbolChoro_field_1'});

    var b = dv2.append('p').attr('class', 'params_section2');
    b.append("span")
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.fixed_size'})
      .html(i18next.t("app_page.func_options.choroprop.fixed_size"));
    var ref_size = b.insert('input')
                    .attrs({type: 'number', class: 'params', id: 'PropSymbolChoro_ref_size',
                            min: 0.1, max: 66.0, value: 30.0, step: "any"})
                    .style("width", "50px");
    b.append('label-item').html(' (px)');

    var c = dv2.append('p').attr('class', 'params_section2');
    c.append("span")
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.on_value'})
      .html(i18next.t("app_page.func_options.choroprop.on_value"));
    var ref_value = c.insert('input')
      .styles({'width': '100px', "margin-left": "10px"})
      .attrs({type: 'number', class: 'params', id: 'PropSymbolChoro_ref_value'})
      .attrs({min: 0.1, step: 0.1});

    // Other symbols could probably easily be proposed :
    var d = dv2.append('p').attr('class', 'params_section2');
    d.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.symbol_type'})
      .html(i18next.t("app_page.func_options.choroprop.symbol_type"));
    var symb_selec = d.insert('select')
      .attrs({class: 'params i18n', id: 'PropSymbolChoro_symbol_type'});

    [['app_page.func_options.common.symbol_circle', 'circle'],
     ['app_page.func_options.common.symbol_square', 'rect']
     ].forEach( symb => {
        symb_selec.append("option").text(i18next.t(symb[0])).attrs({value: symb[1], 'data-i18n': '[text]' + symb[0]});
    });

    var e = dv2.append('p').attr('class', 'params_section2');
    e.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.choroprop.field2'})
      .html(i18next.t("app_page.func_options.choroprop.field2"));
    var field2_selec = e.insert('select')
      .attrs({class: 'params', id: 'PropSymbolChoro_field_2'});

    let f = dv2.insert('p').attr('class', 'params_section2');
    f.append("button")
        .attrs({id: 'PropSymbolChoro_btn_disc', class: 'params button_disc i18n', 'data-i18n': '[html]app_page.func_options.common.discretization_choice'})
        .styles({"font-size": "0.8em", "text-align": "center"})
        .html(i18next.t("app_page.func_options.common.discretization_choice"));
    make_layer_name_button(dv2, "PropSymbolChoro_output_name");
    make_ok_button(dv2, 'propChoro_yes');
    dv2.selectAll(".params").attr("disabled", true);
}

var fields_PropSymbolChoro = {
    fill: function(layer){
        if(!layer) return;
        d3.selectAll(".params").attr("disabled", null);
        let self = this,
            fields = type_col(layer, "number"),
            nb_features = user_data[layer].length,
            field1_selec = section2.select("#PropSymbolChoro_field_1"),
            field2_selec = section2.select("#PropSymbolChoro_field_2"),
            btn_disc = section2.select('#PropSymbolChoro_btn_disc'),
            uo_layer_name = section2.select('#PropSymbolChoro_output_name'),
            ref_value_field = section2.select('#PropSymbolChoro_ref_value'),
            symb_selec = section2.select('#PropSymbolChoro_symbol_type'),
            ref_size = section2.select('#PropSymbolChoro_ref_size'),
            ok_button = section2.select('#propChoro_yes');

        if(fields.length == 0){
            display_error_num_field();
            return;
        }

        fields.forEach(function(field){
            field1_selec.append("option").text(field).attr("value", field);
            field2_selec.append("option").text(field).attr("value", field);
        });

        field1_selec.on("change", function(){
            let field_name = this.value,
                max_val_field = max_fast(user_data[layer].map(obj => +obj[field_name]));

            ref_value_field.attrs({"max": max_val_field, 'value': max_val_field});
            uo_layer_name.attr('value', ["PropSymbols", field_name, field2_selec.node().value, layer].join('_'));
        });

        field2_selec.on("change", function(){
            let field_name = this.value;
            uo_layer_name.attr('value', ["PropSymbols", field1_selec.node().value, field_name, layer].join('_'));
            ok_button.attr("disabled", self.rendering_params[field_name] ? null : true);
        });

        btn_disc.on("click", function(){
            let selected_field = field2_selec.node().value,
                opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length)),
                conf_disc_box;

            if(self.rendering_params[selected_field])
                conf_disc_box = display_discretization(layer,
                                                       selected_field,
                                                       self.rendering_params[selected_field].nb_class,
                                                       self.rendering_params[selected_field].type,
                                                       {schema: self.rendering_params[selected_field].schema,
                                                        colors: self.rendering_params[selected_field].colors,
                                                        no_data: self.rendering_params[selected_field].no_data});
            else
                conf_disc_box = display_discretization(layer, selected_field, opt_nb_class, "quantiles", {});

            conf_disc_box.then(function(confirmed){
                if(confirmed){
                    ok_button.attr("disabled", null);
                    self.rendering_params[selected_field] = {
                        nb_class: confirmed[0], type: confirmed[1],
                        schema: confirmed[5], no_data: confirmed[6],
                        breaks: confirmed[2], colors: confirmed[3],
                        colorsByFeature: confirmed[4],
                        renderer: "PropSymbolsChoro"
                        };
                } else
                    return;
            });
        });
        ok_button.on("click", function(){
            if(!ref_value_field.node().value) return;
            let rendering_params = self.rendering_params;
            if(rendering_params[field2_selec.node().value]){
                let layer = Object.getOwnPropertyNames(user_data)[0],
                    nb_features = user_data[layer].length,
                    rd_params = {},
                    color_field = field2_selec.node().value,
                    new_layer_name = uo_layer_name.node().value;

                new_layer_name = (new_layer_name.length > 0 && /^\w+$/.test(new_layer_name))
                                ? check_layer_name(new_layer_name) : check_layer_name(layer + "_PropSymbolsChoro");

                rd_params.field = field1_selec.node().value;
                rd_params.new_name = new_layer_name;
                rd_params.nb_features = nb_features;
                rd_params.ref_layer_name = layer;
                rd_params.symbol = symb_selec.node().value;
                rd_params.ref_value = +ref_value_field.node().value;
                rd_params.ref_size = +ref_size.node().value;
                rd_params.fill_color = rendering_params[color_field]['colorsByFeature'];

                let id_map = make_prop_symbols(rd_params),
                    colors_breaks = [];

                for(let i = rendering_params[color_field]['breaks'].length-1; i > 0; --i){
                    colors_breaks.push([
                            [rendering_params[color_field]['breaks'][i-1], " - ", rendering_params[color_field]['breaks'][i]].join(''),
                            rendering_params[color_field]['colors'][i-1]
                        ]);
                }

                let options_disc = {schema: rendering_params[color_field].schema,
                                    colors: rendering_params[color_field].colors,
                                    no_data: rendering_params[color_field].no_data}

                current_layers[new_layer_name] = {
                    renderer: "PropSymbolsChoro",
                    features_order: id_map,
                    symbol: rd_params.symbol,
                    ref_layer_name: layer,
                    options_disc: options_disc,
                    rendered_field: field1_selec.node().value,
                    rendered_field2: field2_selec.node().value,
                    size: [+ref_value_field.node().value, +ref_size.node().value],
                    "stroke-width-const": 1,
                    fill_color: { "class": id_map.map(obj => obj[3]) },
                    colors_breaks: colors_breaks,
                    is_result: true,
                    n_features: nb_features
                };
                zoom_without_redraw();
                switch_accordion_section();
                handle_legend(new_layer_name);
            }
        });
        setSelected(field1_selec.node(), fields[0]);
        setSelected(field2_selec.node(), fields[0]);
    },

    unfill: function(){
        let field1_selec = document.getElementById("PropSymbolChoro_field_1"),
            field2_selec = document.getElementById("PropSymbolChoro_field_2");

        for(let i = field1_selec.childElementCount - 1; i >= 0; i--){
            field1_selec.removeChild(field1_selec.children[i]);
            field2_selec.removeChild(field2_selec.children[i]);
        }
        d3.selectAll(".params").attr("disabled", true);
    },
    rendering_params: {}
};

var fillMenu_Typo = function(){
    var dv2 = make_template_functionnality(section2);

    let a = dv2.append('p').attr('class', 'params_section2');
    a.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.typo.color_choice'})
      .html(i18next.t("app_page.func_options.typo.color_choice"))
    a.insert('select')
      .attrs({id: 'Typo_field_1', class: 'params'});

    let b = dv2.insert('p').style("margin", "auto");
    b.append("button")
      .attrs({id: "Typo_class", class: "button_disc params i18n",
              'data-i18n': '[html]app_page.func_options.typo.color_choice'})
      .styles({"font-size": "0.8em", "text-align": "center"})
      .html(i18next.t("app_page.func_options.typo.color_choice"));

    make_layer_name_button(dv2, "Typo_output_name");
    make_ok_button(dv2, 'Typo_yes');
    dv2.selectAll(".params").attr("disabled", true);
}

var fields_Typo = {
    fill: function(layer){
        if(!layer) return;
        let self = this,
            g_lyr_name = "#" + layer,
            fields = type_col(layer),
            fields_name = Object.getOwnPropertyNames(fields),
            field_selec = section2.select("#Typo_field_1"),
            ok_button = section2.select('#Typo_yes'),
            btn_typo_class = section2.select('#Typo_class'),
            uo_layer_name = section2.select('#Typo_output_name');

        fields_name.forEach(f_name => {
            if(f_name != '_uid' && f_name != "UID")
                field_selec.append("option").text(f_name).attr("value", f_name);
        });

        field_selec.on("change", function(){
          let selected_field = this.value;
          uo_layer_name.attr('value', ["Typo", selected_field, layer].join('_'));
          ok_button.attr('disabled', self.rendering_params[selected_field] ? null : true)
        });

        btn_typo_class.on("click", function(){
          let selected_field = field_selec.node().value;
          display_categorical_box(layer, selected_field)
              .then(function(confirmed){
                  if(confirmed){
                      ok_button.attr("disabled", null);
                      self.rendering_params[selected_field] = {
                              nb_class: confirmed[0], color_map :confirmed[1], colorByFeature: confirmed[2],
                              renderer:"Categorical", rendered_field: selected_field
                          }
                  }
              });
        });

        ok_button.on('click', function(){
          let selected_field = field_selec.node().value;
          if(self.rendering_params[selected_field]){
              let layer = Object.getOwnPropertyNames(user_data)[0],
                  output_name = uo_layer_name.node().value;
              if(output_name.length > 0 && /^\w+$/.test(output_name)){
                  self.rendering_params[selected_field].new_name = check_layer_name(output_name);
              } else {
                  self.rendering_params[selected_field].new_name = check_layer_name(["Typo", selected_field, layer].join('_'));
              }
              render_categorical(layer, self.rendering_params[selected_field]);
              switch_accordion_section();
              handle_legend(self.rendering_params[selected_field].new_name)
          }
        });

        uo_layer_name.attr('value', "Typo_" + layer);
        section2.selectAll(".params").attr("disabled", null);
    },
    unfill: function(){
        let field_selec = document.getElementById("Typo_field_1"),
            nb_fields = field_selec.childElementCount;

        for(let i = nb_fields - 1; i > -1 ; --i)
            field_selec.removeChild(field_selec.children[i]);

        section2.selectAll(".params").attr("disabled", true);
    },
    rendering_params: {}
};

function fillMenu_Choropleth(){
    let dv2 = make_template_functionnality(section2),
        rendering_params = fields_Choropleth.rendering_params;

    var field_selec_section = dv2.append('p').attr('class', 'params_section2');
    field_selec_section.insert("span")
      .attrs({class: "i18n", "data-i18n": "[html]app_age.func_options.common.field"})
      .html(i18next.t("app_page.func_options.common.field"));
    field_selec_section.insert("span")
      .attr("id", "container_sparkline")
      .style("margin", "4px");

   field_selec_section.insert('select')
    .attrs({id: 'choro_field1', class: 'params'});

    dv2.insert('p').style("margin", "auto")
      .append("button")
      .attrs({id: "choro_class", class: "button_disc params i18n",
              'data-i18n': '[html]app_page.func_options.common.discretization_choice'})
      .styles({"font-size": "0.8em", "text-align": "center"})
      .html(i18next.t("app_page.func_options.common.discretization_choice"));

    make_layer_name_button(dv2, 'Choro_output_name');
    make_ok_button(dv2, 'choro_yes');
    dv2.selectAll(".params").attr("disabled", true);
}

var fields_Choropleth = {
    fill: function(layer){
        if(!layer) return;
        let self = this,
            g_lyr_name = "#"+layer,
            fields = type_col(layer, "number"),
            field_selec = section2.select("#choro_field1"),
            uo_layer_name = section2.select('#Choro_output_name'),
            btn_class = section2.select('#choro_class'),
            ok_button = section2.select('#choro_yes');

        if(fields.length === 0){
            display_error_num_field();
            return;
        }
        section2.selectAll(".params").attr("disabled", null);
        fields.forEach(field => {
            field_selec.append("option").text(field).attr("value", field);
        });

        field_selec.on("change", function(){
            let field_name = this.value,
                vals = user_data[layer].map(a => +a[field_name]);
            render_mini_chart_serie(vals, document.getElementById("container_sparkline"));
            uo_layer_name.attr('value', ["Choro", field_name, layer].join('_'));
            ok_button.attr('disabled', self.rendering_params[field_name] !== undefined ? null : true);
        });

        btn_class.on("click", function(){
            let selected_field = field_selec.node().value,
                opt_nb_class = Math.floor(1 + 3.3 * Math.log10(user_data[layer].length)),
                conf_disc_box;

            if(self.rendering_params[selected_field]) {
                conf_disc_box = display_discretization(layer, selected_field,
                                                       self.rendering_params[selected_field].nb_class,
                                                       self.rendering_params[selected_field].type,
                                                       {schema: self.rendering_params[selected_field].schema,
                                                        colors: self.rendering_params[selected_field].colors,
                                                        no_data: self.rendering_params[selected_field].no_data});

            } else {
                conf_disc_box = display_discretization(layer,
                                                       selected_field,
                                                       opt_nb_class,
                                                       "quantiles",
                                                       {});
            }
            conf_disc_box.then(function(confirmed){
                if(confirmed){
                    ok_button.attr("disabled", null);
                    self.rendering_params[selected_field] = {
                            nb_class: confirmed[0], type: confirmed[1],
                            breaks: confirmed[2], colors: confirmed[3],
                            schema: confirmed[5], no_data: confirmed[6],
                            colorsByFeature: confirmed[4], renderer:"Choropleth",
                            rendered_field: selected_field,
                            new_name: ""
                        };
                }
            });
        });

        ok_button.on("click", function(){
          let field_to_render = field_selec.node().value;
          if(self.rendering_params[field_to_render]){
              let user_new_layer_name = uo_layer_name.node().value;
              self.rendering_params[field_to_render].new_name = check_layer_name(
                  user_new_layer_name.length > 0 && /^\w+$/.test(user_new_layer_name)
                  ? user_new_layer_name : ["Choro", field_to_render, layer].join('_')
                  );
              render_choro(layer, self.rendering_params[field_to_render]);
              handle_legend(self.rendering_params[field_to_render].new_name)
              switch_accordion_section();
          }
        });
        setSelected(field_selec.node(), fields[0]);
    },

    unfill: function(){
        let field_selec = document.getElementById("choro_field1"),
            nb_fields = field_selec.childElementCount;

        for(let i = nb_fields - 1; i > -1 ; --i){
//            delete this.rendering_params[field_selec.children[i]];
            field_selec.removeChild(field_selec.children[i]);
        }
        d3.selectAll(".params").attr("disabled", true);
    },
    rendering_params: {}
};

var fields_Stewart = {
    fill: function(layer){
        let other_layers = get_other_layer_names(),
            mask_selec = d3.select("#stewart_mask"),
            default_selected_mask;

        unfillSelectInput(mask_selec.node());
        mask_selec.append("option").text("None").attr("value", "None");
        for(let lyr_name of other_layers){
            if(current_layers[lyr_name].type === "Polygon"){
                mask_selec.append("option").text(lyr_name).attr("value", lyr_name);
                if(current_layers[lyr_name].targeted){
                    default_selected_mask = lyr_name;
                }
            }
        }
        if(default_selected_mask)
            setSelected(mask_selec.node(), default_selected_mask);

        if(layer){
            let fields = type_col(layer, "number"),
                field_selec = section2.select("#stewart_field"),
                field_selec2 = section2.select("#stewart_field2");

            if(fields.length == 0){
                display_error_num_field();
                return;
            }

            field_selec2.append("option").text(" ").attr("value", "None");
            fields.forEach(field => {
                field_selec.append("option").text(field).attr("value", field);
                field_selec2.append("option").text(field).attr("value", field);
            });
            document.getElementById("stewart_span").value = get_first_guess_span();

            field_selec.on("change", function(){
                document.getElementById("stewart_output_name").value = ["Smoothed", this.value, layer].join('_');
            });
            section2.select('#stewart_yes')
                .on('click', render_stewart);
        }
        section2.selectAll(".params").attr("disabled", null);
    },

    unfill: function(){
        let field_selec = document.getElementById("stewart_field"),
            field_selec2 = document.getElementById("stewart_field2"),
            mask_selec = document.getElementById("stewart_mask");
        unfillSelectInput(field_selec);
        unfillSelectInput(field_selec2);
        unfillSelectInput(mask_selec);
        d3.selectAll(".params").attr("disabled", true);
    }
};

function render_stewart(){
  let formToSend = new FormData(),
      doc = document,
      field1_n = doc.getElementById('stewart_field').value,
      field2_n = doc.getElementById('stewart_field2').value,
      var1_to_send = {},
      var2_to_send = {},
      layer = Object.getOwnPropertyNames(user_data)[0],
      bval = doc.getElementById('stewart_breaks').value.trim(),
      reso = +doc.getElementById('stewart_resolution').value,
      span = +doc.getElementById('stewart_span').value,
      beta = +doc.getElementById('stewart_beta').value,
      nb_class = doc.getElementById('stewart_nb_class').value,
      func_selec = doc.getElementById('stewart_func').value,
      mask_name = doc.getElementById('stewart_mask').value,
      new_user_layer_name = document.getElementById("stewart_output_name").value;

  if(reso && reso > 0){
      let res_test = test_maxmin_resolution(reso);
      if(res_test){
          let message = res_test === "low" ? i18next.t("app_page.common.error_too_low_resolution") : i18next.t("app_page.common.error_too_high_resolution")
          display_error_during_computation(message);
          return;
      }
      reso = reso * 1000;
  } else {
      reso = null;
  }
  bval = bval.length > 0 ? bval.split('-').map(val => +val.trim()) : null;

  if(current_layers[layer].original_fields.has(field1_n))
      var1_to_send[field1_n] = [];
  else
      var1_to_send[field1_n] = user_data[layer].map(i => +i[field1_n]);

  if(field2_n != "None"){
      if(current_layers[layer].original_fields.has(field2_n))
          var2_to_send[field2_n] = [];
      else
          var2_to_send[field2_n] = user_data[layer].map(i => +i[field2_n]);
  }

  formToSend.append("json", JSON.stringify({
      "topojson": current_layers[layer].key_name,
      "variable1": var1_to_send,
      "variable2": var2_to_send,
      "span": span * 1000,
      "beta": beta,
      "typefct": func_selec,
      "resolution": reso,
      "nb_class": nb_class,
      "user_breaks": bval,
      "mask_layer": mask_name !== "None" ? current_layers[mask_name].key_name : ""}));

  xhrequest("POST", '/compute/stewart', formToSend, true)
      .then(res => {
          let data_split = res.split('|||'),
              raw_topojson = data_split[0],
              options = {result_layer_on_add: true};
          if(new_user_layer_name.length > 0 &&  /^\w+$/.test(new_user_layer_name)){
              options["choosed_name"] = new_user_layer_name;
          }
          var n_layer_name = add_layer_topojson(raw_topojson, options);
          if(!n_layer_name)
              return;
          var class_lim = JSON.parse(data_split[1]),
              col_pal = getColorBrewerArray(class_lim.min.length, "Oranges"),
              nb_class = class_lim['min'].length,
              colors_breaks = [];
          for(let i = 0; i < nb_class; i++){
               colors_breaks.push([class_lim['min'][i] + " - " + class_lim['max'][i], col_pal[nb_class - 1 - i]]);
          }

          current_layers[n_layer_name].fill_color = {"class": []};
          current_layers[n_layer_name].renderer = "Stewart";
          current_layers[n_layer_name].colors_breaks = colors_breaks;
          current_layers[n_layer_name].rendered_field = field1_n;
          current_layers[n_layer_name].color_palette = {name: "Oranges", reversed: true};
          map.select("#"+n_layer_name)
                  .selectAll("path")
                  .style("fill", (d,i) => col_pal[nb_class - 1 - i]);
          handle_legend(n_layer_name);
          switch_accordion_section();
          // Todo : use the function render_choro to render the result from stewart too
      }, error => {
          display_error_during_computation();
          console.log(error);
      });
}


function fillMenu_Stewart(){
    var dialog_content = make_template_functionnality(section2);

    let a = dialog_content.append('p').attr('class', 'params_section2');
    a.append('span')
      .style("margin", "10px 0px 0px")
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.field'})
      .html(i18next.t("app_page.func_options.smooth.field"));
    a.append('span')
      .insert('select')
      .attrs({class: 'params marg_auto', id: "stewart_field"});

    let b = dialog_content.append('p').attr('class', 'params_section2');
    b.append('span')
      .style("margin", "10px 0px 0px")
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.divide_field'})
      .html(i18next.t("app_page.func_options.smooth.divide_field"));
    b.insert('select')
      .attrs({class: 'params marg_auto', id: "stewart_field2"});

    let p_span = dialog_content.append("p").attr('class', 'params_section2');
    p_span.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.span'})
      .text(i18next.t("app_page.func_options.smooth.span"));
    p_span.append('input')
      .style("width", "60px")
      .attrs({type: 'number', class: 'params', id: "stewart_span", value: 5, min: 0.001, max: 100000.000, step: "any"});
    p_span.append("span")
      .html(" (km)");

    let d = dialog_content.append('p').attr('class', 'params_section2');
    d.append('span')
      .styles({"margin-right": "35px"})
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.beta'})
      .html(i18next.t("app_page.func_options.smooth.beta"));
    d.insert('input')
      .style("width", "60px")
      .attrs({type: 'number', class: 'params', id: "stewart_beta", value: 2, min: 0, max: 11, step: "any"});

    let p_reso = dialog_content.append('p').attr('class', 'params_section2');
    p_reso.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.resolution'})
      .text(i18next.t("app_page.func_options.smooth.resolution"));
    p_reso.insert('input')
      .style("width", "60px")
      .attrs({type: 'number', class: 'params', id: "stewart_resolution", min: 1, max: 1000000, step: "any"});
    p_reso.insert("label")
      .html(" (km)");

    let f = dialog_content.append('p').attr('class', 'params_section2');
    f.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.func_options'})
      .html(i18next.t("app_page.func_options.smooth.function"));
    let func_selec = f.insert('select')
      .attrs({class: 'params i18n', id: "stewart_func"});

    let g = dialog_content.append("p").attr('class', 'params_section2');
    g.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.nb_class'})
      .html(i18next.t("app_page.func_options.smooth.nb_class"));
    g.insert("input")
      .style("width", "50px")
      .attrs({type: "number", class: 'params', id: "stewart_nb_class", value: 8, min: 1, max: 22, step: 1});

    let bvs = dialog_content.append("p").attr('class', 'params_section2');
    bvs.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.break_values'})
      .html(i18next.t("app_page.func_options.smooth.break_values"));
    bvs.insert("textarea")
      .styles({width: "100%", height: "2.2em", "font-size": "0.9em"})
      .attrs({class: 'params i18n', id: "stewart_breaks",
              "data-i18n": "[placeholder]app_page.common.expected_class",
              "placeholder": i18next.t("app_page.common.expected_class")});
    let m  = dialog_content.append('p').attr('class', 'params_section2');
    m.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.smooth.mask'})
      .html(i18next.t("app_page.func_options.smooth.mask"));
    m.insert('select')
      .attrs({class: 'params', id: "stewart_mask"});

    [['exponential', 'app_page.func_options.smooth.func_exponential'],
     ['pareto', 'app_page.func_options.smooth.func_pareto']
     ].forEach( fun_name => {
        func_selec.append("option").text(i18next.t(fun_name[1])).attrs({value: fun_name[0], 'data-i18n': '[text]' + fun_name[1]});
    });

    make_layer_name_button(dialog_content, 'stewart_output_name');
    make_ok_button(dialog_content, 'stewart_yes', false);
    dialog_content.selectAll(".params").attr("disabled", true);
}

var fields_Anamorphose = {
    fill: function(layer){
        if(!layer) return;
        let fields = type_col(layer, "number"),
            field_selec = section2.select("#Anamorph_field"),
            algo_selec = section2.select('#Anamorph_algo'),
            ok_button = section2.select("#Anamorph_yes"),
            fixed_size_dorling = section2.select('#Anamorph_dorling_fixed_size');

        if(fields.length == 0){
            display_error_num_field();
            return;
        }
        algo_selec.on('change', function(){
          if(this.value === "dorling"){
            section2.selectAll('.opt_dougenik, .opt_olson').style('display', 'none');
            section2.selectAll('.opt_dorling').style('display', undefined);
          } else if (this.value === "olson") {
            section2.selectAll('.opt_dougenik, .opt_dorling').style('display', 'none');
            section2.selectAll('.opt_olson').style('display', undefined);
          } else if (this.value === "dougenik") {
            section2.selectAll('.opt_dorling, .opt_olson').style('display', 'none');
            section2.selectAll('.opt_dougenik').style('display', undefined);
          }
        })
        section2.selectAll(".params").attr("disabled", null);
        fields.forEach(function(field){
            field_selec.append("option").text(field).attr("value", field);
        });

        field_selec.on("change", function(){
            let field_name = this.value,
                ref_value_field = document.getElementById("Anamorph_opt3");

            document.getElementById("Anamorph_output_name").value = ["Cartogram", this.value, layer].join('_');

            if(ref_value_field){
                let max_val_field = max_fast(user_data[layer].map(obj => +obj[field_name]));
                ref_value_field.setAttribute("max", max_val_field);
                ref_value_field.value = max_val_field;
            }
        });

        fixed_size_dorling.on("change", function(){
            document.getElementById("Anamorph_ref_size_txt").innerHTML = " " + this.value + " px";
        });

        ok_button.on("click", function(){
            let algo = algo_selec.node().value,
                nb_features = user_data[layer].length,
                field_name = field_selec.node().value,
                new_user_layer_name = document.getElementById("Anamorph_output_name").value;

            if (algo === "olson"){
                let field_n = field_selec.node().value,
                    layer = Object.getOwnPropertyNames(user_data)[0],
                    ref_size = option1_val.node().value,
                    scale_max = +option2_val.node().value / 100,
                    nb_ft = current_layers[layer].n_features,
                    dataset = user_data[layer];

                let layer_select = document.getElementById(layer).getElementsByTagName("path"),
                    sqrt = Math.sqrt,
                    abs = Math.abs,
                    d_values = [],
                    area_values = [];

                for(let i = 0; i < nb_ft; ++i){
                    d_values.push(sqrt(+dataset[i][field_n]));
                    area_values.push(+path.area(layer_select[i].__data__.geometry));
                }

                let mean = d3.mean(d_values),
                    min = d3.min(d_values),
                    max = d3.max(d_values),
                    transform = [];
                if(ref_size == "mean"){
                    let low_ = abs(mean-min),
                        up_ = abs(max-mean),
                        max_dif = low_ > up_ ? low_ : up_;

                    for(let i= 0; i < nb_ft; ++i){
                        let val = d_values[i],
                            scale_area;
                        if(val > mean)
                            scale_area = 1 + scale_max / (max_dif / abs(val-mean));
                        else if(val == mean)
                            scale_area = 1;
                        else
                            scale_area = 1 - scale_max / (max_dif / abs(mean-val));
                        transform.push(scale_area);
                    }
                } else if (ref_size == "max"){
                    let max_dif = abs(max-min);

                    for(let i= 0; i < nb_ft; ++i){
                        let val = d_values[i],
                            val_dif = max_dif / val,
                            scale_area;
                        if(val_dif < 1)
                            scale_area = 1;
                        else
                            scale_area = 1 - (scale_max / val_dif);
                        transform.push(scale_area);
                    }

                }
                let formToSend = new FormData();
                formToSend.append("json",
                    JSON.stringify({
                        topojson: current_layers[layer].key_name,
                        scale_values: transform,
                        field_name: field_n,
                        scale_max: scale_max})
                    );
                xhrequest("POST", '/compute/olson', formToSend, true)
                    .then( result => {
                        let options = {result_layer_on_add: true};
                        if(new_user_layer_name.length > 0 && /^\w+$/.test(new_user_layer_name)){
                            options["choosed_name"] = new_user_layer_name;
                        }
                        let n_layer_name = add_layer_topojson(result, options);
                        current_layers[n_layer_name].renderer = "OlsonCarto";
                        current_layers[n_layer_name].rendered_field = field_n;
                        current_layers[n_layer_name].scale_max = scale_max;
                        current_layers[n_layer_name].ref_layer_name = layer;
                        current_layers[n_layer_name].scale_byFeature = transform;
                        map.select("#" + n_layer_name)
                                .selectAll("path")
                                .style("fill-opacity", 0.8)
                                .style("stroke", "black")
                                .style("stroke-opacity", 0.8);
                        switch_accordion_section();
                    }, err => {
                        display_error_during_computation();
                        console.log(err);
                    });
            } else if (algo === "dougenik"){
                let formToSend = new FormData(),
                    field_n = field_selec.node().value,
                    layer = Object.getOwnPropertyNames(user_data)[0],
                    var_to_send = {},
                    nb_iter = option1_val.node().value;

                var_to_send[field_name] = [];
                if(!current_layers[layer].original_fields.has(field_name)){
                    let table = user_data[layer],
                        to_send = var_to_send[field_name];
                    for(let i=0, i_len=table.length; i<i_len; ++i){
                        to_send.push(+table[i][field_name])
                    }
                }
                formToSend.append("json", JSON.stringify({
                    "topojson": current_layers[layer].key_name,
                    "var_name": var_to_send,
                    "iterations": nb_iter }));

                xhrequest("POST", '/compute/carto_doug', formToSend, true)
                    .then(data => {
                        let options = {result_layer_on_add: true};
                        if(new_user_layer_name.length > 0 && /^\w+$/.test(new_user_layer_name)){
                            options["choosed_name"] = new_user_layer_name;
                        }
                        let n_layer_name = add_layer_topojson(data, options);
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
                            .style("stroke-opacity", 0.8);
                        switch_accordion_section();
                    }, error => {
                        display_error_during_computation();
                        console.log(error);
                    });
            } else if (algo === "dorling"){
                let fixed_value = +document.getElementById("Anamorph_opt3").value,
                    fixed_size = +document.getElementById("Anamorph_opt2").value,
                    shape_symbol = option1_val.node().value;

                let layer_to_add = check_layer_name(
                        new_user_layer_name.length > 0 && /^\w+$/.test(new_user_layer_name)
                        ? new_user_layer_name : ["DorlingCarto", field_name, layer].join('_')
                    );

                let [features_order, animation] = make_dorling_demers(layer, field_name, fixed_value, fixed_size, shape_symbol, layer_to_add);
                current_layers[layer_to_add] = {
                    "renderer": "DorlingCarto",
                    "type": "Point",
                    "symbol": shape_symbol,
                    "rendered_field": field_name,
                    "size": [fixed_value, fixed_size],
                    "stroke-width-const": 1,
                    "is_result": true,
                    "features_order": features_order,
                    "ref_layer_name": layer,
                    "fill_color": {"random": true},
                    "animation": animation
                    };
                create_li_layer_elem(layer_to_add, current_layers[layer].n_features, ["Point", "cartogram"], "result");
                up_legends();
                zoom_without_redraw();
                switch_accordion_section();
                }
        });
        setSelected(field_selec.node(), field_selec.node().options[0].value);

    },
    unfill: function(){
        let field_selec = document.getElementById("Anamorph_field");
        d3.selectAll(".params").attr("disabled", true);
        unfillSelectInput(field_selec);
    }
}


function fillMenu_Anamorphose(){
    var dialog_content = make_template_functionnality(section2);

    let algo_choice = dialog_content.append('p').attr('class', 'params_section2');
    algo_choice.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.algo'})
      .html(i18next.t("app_page.func_options.cartogram.algo"));
    let algo_selec = algo_choice.insert('select')
      .attrs({id: 'Anamorph_algo', class: 'params i18n'});

    let field_choice = dialog_content.append('p').attr('class', 'params_section2');
    field_choice.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.field'})
      .html(i18next.t("app_page.func_options.cartogram.field"));
    let field_selec = field_choice.insert('select')
      .attrs({class: 'params', id: 'Anamorph_field'});

    // Options for Dorling mode :
    let option1_section = dialog_content.append('p').attr('class', 'params_section2 opt_dorling');
      // .attr('class', 'params_section2').attr("id", "Anamorph_opt_txt");
    option1_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.dorling_symbol'})
      .html(i18next.t("app_page.func_options.cartogram.dorling_symbol"));
    let option1_val = option1_section.append("select")
      .attrs({class: "params i18n", id: "Anamorph_dorling_symbol"});

    let option2_section = dialog_content.append('p').attr('class', 'params_section2 opt_dorling').attr("id", "Anamorph_opt_txt2");
    option2_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.dorling_fixed_size'})
      .html(i18next.t("app_page.func_options.cartogram.dorling_fixed_size"));
    let option2_val = option2_section.insert("input")
      .style("width", "50px")
      .attrs({type: "range", min: 0, max: 45, step: 0.1, value: 20, id: "Anamorph_dorling_fixed_size", class: "params"});
    option2_section.insert("span").attr("id", "Anamorph_ref_size_txt").html(" 10 px");

    let option3_section = dialog_content.append("p").attr('class', 'params_section2 opt_dorling').attr("id", "Anamorph_opt_txt3");
    option3_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.dorling_on_value'})
      .html(i18next.t("app_page.func_options.cartogram.dorling_on_value"));
    let option2_val2 = option3_section.insert("input")
      .attrs({class: "params", id: "Anamorph_dorling_onvalue", type: "number", min: 0, step: 0.1});

    // Options for Dougenik mode :
    let doug1 = dialog_content.append('p')
      .attr('class', 'params_section2 opt_dougenik');
    doug1.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.dougenik_iterations'})
      .html(i18next.t("app_page.func_options.cartogram.dougenik_iterations"));
    doug1.insert('input')
      .attrs({type: 'number', class: 'params', value: 5, min: 1, max: 12, step: 1, id: "Anamorph_dougenik_iterations"})

    // Options for Olson mode :
    let o1 = dialog_content.append('p').attr('class', 'params_section2 opt_olson');;
    o1.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.olson_scale_txt'})
      .html(i18next.t("app_page.func_options.cartogram.olson_scale_txt"));
    let type_scale_olson = o1.append("select")
      .attrs({class: "params", id: "Anamorph_olson_scale_kind"});

    let o2 = dialog_content.append('p').attr('class', 'params_section2 opt_olson');
    o2.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.cartogram.olson_scale_max_scale'})
      .html(i18next.t("app_page.func_options.cartogram.olson_scale_max_scale"));
    o2.insert('input')
      .style("width", "60px")
      .attrs({type: 'number', class: 'params', id: "Anamorph_opt2", value: 50, min: 0, max: 100, step: 1});

    [['Pseudo-Dorling', 'dorling'],
     ['Dougenik & al. (1985)', 'dougenik'],
     ['Olson (2005)', 'olson']].forEach(function(fun_name){
        algo_selec.append("option").text(fun_name[0]).attr("value", fun_name[1]);
    });

    [["app_page.func_options.common.symbol_circle", "circle"],
     ["app_page.func_options.common.symbol_square", "rect"]
    ].forEach(function(symb){
        option1_val.append("option").text(i18next.t(symb[0])).attrs({"value": symb[1], 'data-i18n': '[text]' + symb[0]});
    });

    [["app_page.func_options.cartogram.olson_scale_max", "max"],
     ["app_page.func_options.cartogram.olson_scale_mean", "mean"]
    ].forEach(opt_field => {
        type_scale_olson.append("option").attrs({"value": opt_field[1], 'data-i18n': '[text]' + opt_field[0]}).text(i18next.t(opt_field[0]));
    });

    make_layer_name_button(dialog_content, "Anamorph_output_name");
    make_ok_button(dialog_content, 'Anamorph_yes', false);

    dialog_content.selectAll(".params").attr("disabled", true);
    dialog_content.selectAll(".opt_olson, .opt_dougenik").style('display', 'none');
}


function make_dorling_demers(layer, field_name, fixed_value, fixed_size, shape_symbol, layer_to_add){
    let ref_layer_selection = document.getElementById(layer).getElementsByTagName("path"),
        nb_features = current_layers[layer].n_features,
        d_values = [],
        symbol_layer = undefined,
        comp = (a,b) => b[1] - a[1],
        tmp = [];

    for(let i = 0; i < nb_features; ++i){
        let val = +user_data[layer][i][field_name];
        let pt = path.centroid(ref_layer_selection[i].__data__.geometry);
        d_values.push([i, val, pt]);
    }
    d_values = prop_sizer3(d_values, fixed_value, fixed_size, shape_symbol);
    d_values.sort(comp);
    let min_value = +d_values[nb_features - 1][1],
        max_value = +d_values[0][1];

    let nodes = d_values.map(function(d, i){
        let val = (+ref_layer_selection[d[0]].__data__.properties[field_name] - min_value) / (max_value - min_value);
        return {x: d[2][0], y: d[2][1],
                x0: d[2][0], y0: d[2][1],
                r: d[1],
                value: val,
                ix: d[0]};
        });

    let animation = d3.forceSimulation(nodes)
                .force("x", d3.forceX(d => d.x0).strength(0.5))
                .force("y", d3.forceY(d => d.y0).strength(0.5))
                .force("charge", d3.forceManyBody().distanceMin(0).distanceMax(0).strength(d => -0.1 * d.value))
                .force("collide", d3.forceCollide().radius(d => d.r).strength(0.5).iterations(1))
                .on("tick", tick);


    let bg_color = Colors.random(),
        stroke_color = "black";

    if(shape_symbol == "circle") {
        symbol_layer = map.append("g").attr("id", layer_to_add)
                          .attr("class", "result_layer layer")
                          .selectAll("circle")
                          .data(nodes).enter()
                          .append("circle")
                            .attrs( (d,i) => ({
                              "id": ["PropSymbol_", i, " feature_", d.ix].join(''),
                              "r": d.r
                            }))
                            .style("fill", () => Colors.random() )
                            .style("stroke", "black");
    } else {
        symbol_layer = map.append("g").attr("id", layer_to_add)
                          .attr("class", "result_layer layer")
                          .selectAll("rect")
                          .data(nodes).enter()
                          .append("rect")
                            .attrs( (d,i) => ({
                              "id": ["PropSymbol_", i, " feature_", d.ix].join(''),
                              "height": d.r * 2,
                              "width": d.r * 2
                            }))
                            .style("fill", () => Colors.random() )
                            .style("stroke", "black");
    }

    function tick(e){
        if(shape_symbol == "circle")
            symbol_layer.attrs(d => ({"cx": d.x, "cy": d.y}));
                // .attr("cx", d => d.x)
                // .attr("cy", d => d.y);
        else
            symbol_layer.attrs(d => ({"x": d.x - d.r, "y": d.y - d.r}));
                // .attr("x", d => d.x - d.r)
                // .attr("y", d => d.y - d.r)
    }
    return [d_values, animation];
}


function make_prop_symbols(rendering_params){
    let layer = rendering_params.ref_layer_name,
        field = rendering_params.field,
        nb_features = rendering_params.nb_features,
        values_to_use = rendering_params.values_to_use,
        _values = [],
        abs = Math.abs,
        comp = function(a,b){ return abs(b[1])-abs(a[1]); },
        ref_layer_selection = document.getElementById(layer).getElementsByTagName("path"),
        ref_size = rendering_params.ref_size,
        ref_value = rendering_params.ref_value,
        symbol_type = rendering_params.symbol,
        layer_to_add = rendering_params.new_name,
        zs = d3.zoomTransform(svg_map).k;

    let res_data = [];
    if(values_to_use)
        for(let i = 0; i < nb_features; ++i){
//            let centr = path.centroid(ref_layer_selection[i].__data__);
            _values.push([i, +values_to_use[i],
                           path.centroid(ref_layer_selection[i].__data__)]);
        }
    else {
        let data_table = user_data[layer];
        for(let i = 0; i < nb_features; ++i){
//            let centr = path.centroid(ref_layer_selection[i].__data__);
            _values.push([i, +data_table[i][field],
                           path.centroid(ref_layer_selection[i].__data__)]);
        }
    }

    if(rendering_params.break_val != undefined && rendering_params.fill_color.two){
        let col1 = rendering_params.fill_color.two[0],
            col2 = rendering_params.fill_color.two[1];
        var tmp_fill_color = [];
        for(let i = 0; i < nb_features; ++i){
            tmp_fill_color.push(_values[i][1] > rendering_params.break_val ? col2 : col1)
        }
    } else {
        var tmp_fill_color = rendering_params.fill_color;
    }

    var d_values = prop_sizer3(_values, ref_value, ref_size, symbol_type);
    d_values.sort(comp);

    /*
        Values have been sorted (descendant order on the absolute values) to have larger symbols
        displayed under the smaller, so now d_values is an array like :
        [
         [id_ref_feature, value, [x_centroid, y_centroid]],
         [id_ref_feature, value, [x_centroid, y_centroid]],
         [id_ref_feature, value, [x_centroid, y_centroid]],
         [...]
        ]
    */

    if(!(rendering_params.fill_color instanceof Array) && !(rendering_params.fill_color.two)){
        for(let i=0; i<nb_features; ++i)
            d_values[i].push(rendering_params.fill_color);
    } else {
        for(let i=0; i<nb_features; ++i){
//            let idx = d_values[i][0];
            d_values[i].push(tmp_fill_color[d_values[i][0]]);
        }
    }

    var symbol_layer = map.append("g").attr("id", layer_to_add)
                          .attr("class", "result_layer layer");

    if(symbol_type === "circle"){
        for(let i = 0; i < nb_features; i++){
            let params = d_values[i];
            let id_ref = params[0];
            symbol_layer.append('circle')
                .attr('cx', params[2][0])
                .attr("cy", params[2][1])
                .attr("r", params[1])
                .attr("id", ["PropSymbol_", i , " feature_", id_ref].join(''))
                .style("fill", params[3])
                .style("stroke", "black")
                .style("stroke-width", 1 / zs);
            let res_obj = {};
            res_obj["uid"] = i;
            res_obj["id_layer_reference"] = id_ref;
            res_obj[field] = _values[id_ref][1];
            res_data.push(res_obj);
        }
    } else if(symbol_type === "rect"){
        for(let i = 0; i < nb_features; i++){
            let params = d_values[i],
                id_ref = params[0],
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
            let res_obj = {};
            res_obj["uid"] = i;
            res_obj["id_layer_reference"] = id_ref;
            res_obj[field] = _values[id_ref][1];
            res_data.push(res_obj);
        };
    }

    let fill_color = rendering_params.fill_color.two != undefined
                    ? rendering_params.fill_color
                    : rendering_params.fill_color instanceof Array
                    ? {"class": rendering_params.fill_color}
                    : {"single" : rendering_params.fill_color};
    current_layers[layer_to_add] = {
        "n_features": nb_features,
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
    if(rendering_params.break_val != undefined){
        current_layers[layer_to_add]["break_val"] = rendering_params.break_val;
    }
    up_legends();
    result_data[layer_to_add] = res_data;
    create_li_layer_elem(layer_to_add, nb_features, ["Point", "prop"], "result");
    return d_values;
}

function render_categorical(layer, rendering_params){
    if(rendering_params.new_name){
        copy_layer(layer, rendering_params.new_name, "typo");
        layer = rendering_params.new_name;
    }
    map.select("#" + layer).style("opacity", 1)
            .style("stroke-width", 0.75/d3.zoomTransform(svg_map).k + "px");

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
    if(rendering_params.new_name){
        copy_layer(layer, rendering_params.new_name, "choro");
        //Assign the same key to the cloned layer so it could be used transparently on server side
        // after deletion of the reference layer if needed :
        current_layers[rendering_params.new_name].key_name = current_layers[layer].key_name;
        layer = rendering_params.new_name;
    }
    let breaks = rendering_params["breaks"];
    let options_disc = {schema: rendering_params.schema,
                        colors: rendering_params.colors,
                        no_data: rendering_params.no_data}
    var layer_to_render = map.select("#"+layer).selectAll("path");
    map.select("#"+layer)
            .style("opacity", 1)
            .style("stroke-width", 0.75/d3.zoomTransform(svg_map).k, + "px");
    layer_to_render.style('fill-opacity', 0.9)
                   .style("fill", (d,i) => rendering_params['colorsByFeature'][i] )
                   .style('stroke-opacity', 0.9)
                   .style("stroke", "black");
    current_layers[layer].renderer = rendering_params['renderer'];
    current_layers[layer].rendered_field = rendering_params['rendered_field'];
    current_layers[layer].fill_color = {"class": rendering_params['colorsByFeature']};
    current_layers[layer]['stroke-width-const'] = 0.75;
    current_layers[layer].is_result = true;
    current_layers[layer].options_disc = options_disc;
    let colors_breaks = [];
    for(let i = breaks.length-1; i > 0; --i){
        colors_breaks.push([
                [breaks[i-1], " - ", breaks[i]].join(''),
                rendering_params['colors'][i-1]
            ]);
        }
    current_layers[layer].colors_breaks = colors_breaks;
    zoom_without_redraw();
}

function render_mini_chart_serie(values, parent, cap, bins){
  bins = bins || values.length > 20 ? 16 : values.length > 15 ? 10 : 5;
  var class_count = getBinsCount(values, bins),
      background = '#f1f1f1',
      color = '#6633ff',
      width = 3 * bins - 3,
      height = 25,
      canvas = document.createElement('canvas');
  cap = cap || max_fast(class_count.counts);
  canvas.width = width;
  canvas.height = height;

  let old = parent.querySelector("canvas");
  if(old) old.remove();
  parent.append(canvas);

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = 0,
      y = 0,
      barwidth = 2,
      barspace = 1;

  ctx.fillStyle = color;
  for (let i = 0; i < bins; i++) {
    var barheight = Math.floor(Math.min(class_count.counts[i] / cap, 1) * (height - 1));
    x += barspace;
    ctx.fillRect(x, height, barwidth, - barheight);
    x += barwidth;
  }
  canvas.setAttribute("tooltip-info", make_mini_summary(class_count))
  new Tooltip(canvas, {
          dataAttr: "tooltip-info",
          animation: "slideNfade",
          duration: 50,
          delay: 100,
          container: document.getElementById("twbs"),
          placement: "top"
      });
}

function make_mini_summary(summary){
  let p = Math.max(get_nb_decimals(summary.min), get_nb_decimals(summary.max));
  return [
   i18next.t("app_page.stat_summary.min"), " : ", summary.min, " | ",
   i18next.t("app_page.stat_summary.max"), " : ", summary.max, "<br>",
   i18next.t("app_page.stat_summary.mean"), " : ", summary.mean.toFixed(p), "<br>",
   i18next.t("app_page.stat_summary.median"), " : ", summary.median.toFixed(p), "<br>"
  ].join('');
}

function fillMenu_PropSymbolTypo(layer){
    var dv2 = make_template_functionnality(section2);

    let a = dv2.append('p').attr('class', 'params_section2');
    a.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.field1'})
      .html(i18next.t("app_page.func_options.proptypo.field1"))
    let field1_selec = a.insert('select')
      .attrs({class: 'params', id: 'PropSymbolTypo_field_1'});

    let b = dv2.append('p').attr('class', 'params_section2');
    b.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.fixed_size'})
      .html(i18next.t("app_page.func_options.proptypo.fixed_size"));
    let ref_size = b.insert('input')
        .attrs({type: 'number', class: 'params', id: 'PropSymbolTypo_ref_size',
                min: 0.1, max: 66.0, value: 30.0, step: "any"})
        .style("width", "50px");
    b.append('label-item').html(' (px)');

    let c = dv2.append('p').attr('class', 'params_section2');
    c.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.on_value'})
      .html(i18next.t("app_page.func_options.proptypo.on_value"))
    let ref_value = c.insert('input')
      .styles({'width': '100px', "margin-left": "10px"})
      .attrs({type: 'number', class: 'params', id: 'PropSymbolTypo_ref_value'})
      .attrs({min: 0.1, step: 0.1});

    // Other symbols could probably easily be proposed :
    let d = dv2.append('p').attr('class', 'params_section2');
    d.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.symbol_type'})
      .html(i18next.t("app_page.func_options.proptypo.symbol_type"));
    let symb_selec = d.insert('select')
      .attrs({'class': 'params', 'id': 'PropSymbolTypo_symbol_type'});

    [['app_page.func_options.common.symbol_circle', 'circle'],
     ['app_page.func_options.common.symbol_square', 'rect']].forEach( symb => {
        symb_selec.append("option").text(i18next.t(symb[0])).attrs({"value": symb[1], 'data-i18n': '[text]' + symb[0]});
    });

    let e = dv2.append('p').attr('class', 'params_section2');
    e.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.proptypo.field2'})
      .html(i18next.t("app_page.func_options.proptypo.field2"));
    var field2_selec = e.insert('select')
        .attrs({class: 'params', id: 'PropSymbolTypo_field_2'});

    let f = dv2.insert('p').style("margin", "auto");
    f.append("button")
      .attrs({id: "Typo_class", class: "button_disc params i18n",
              'data-i18n': '[html]app_page.func_options.typo.color_choice'})
      .styles({"font-size": "0.8em", "text-align": "center"})
      .html(i18next.t("app_page.func_options.typo.color_choice"));

    make_layer_name_button(dv2, 'PropSymbolTypo_output_name');
    make_ok_button(dv2, 'propTypo_yes');
    section2.selectAll(".params").attr("disabled", true);
}

var fields_PropSymbolTypo = {
    fill: function(layer){
        if(!layer) return;
        section2.selectAll(".params").attr("disabled", null);
        let self = this,
            fields_num = type_col(layer, "number"),
            fields_all = type_col(layer),
            nb_features = user_data[layer].length,
            field1_selec = section2.select("#PropSymbolTypo_field_1"),
            field2_selec = section2.select("#PropSymbolTypo_field_2"),
            ref_value_field = section2.select('#PropSymbolTypo_ref_value'),
            uo_layer_name = section2.select('#PropSymbolTypo_output_name'),
            btn_typo_class = section2.select('#Typo_class'),
            ok_button = section2.select('#propTypo_yes');

        if(fields_all.length == 0){
            display_error_num_field();
            return;
        }

        fields_num.forEach(function(field){
            field1_selec.append("option").text(field).attr("value", field);
        });

        for(let field in fields_all){
            field2_selec.append("option").text(field).attr("value", field);
        }

        field1_selec.on("change", function(){
            let field_name = this.value,
                max_val_field = max_fast(user_data[layer].map(obj => +obj[field_name]));
            ref_value_field.attrs({max: max_val_field, value: max_val_field});
            uo_layer_name.attr('value', ['Typo', field_name, field2_selec.node().value, layer].join('_'));
        });
        field2_selec.on("change", function(){
            let field_name = this.value;
            ok_button.attr("disabled", self.rendering_params[field_name] ? null : true);
            uo_layer_name.attr('value', ['Typo', field1_selec.node().value, field_name, layer].join('_'));
        });
        btn_typo_class.on("click", function(){
            let selected_field = field2_selec.node().value,
                new_layer_name = check_layer_name(['Typo', field1_selec.node().value, selected_field, layer].join('_'));
            display_categorical_box(layer, selected_field)
                .then(function(confirmed){
                    if(confirmed){
                        ok_button.attr("disabled", null);
                        self.rendering_params[selected_field] = {
                                nb_class: confirmed[0], color_map :confirmed[1], colorByFeature: confirmed[2],
                                renderer:"Categorical", rendered_field: selected_field, new_name: new_layer_name
                            }
                    }
                });
        });
        ok_button.on('click', function(){
          render_PropSymbolTypo(
            field1_selec.node().value,
            field2_selec.node().value,
            uo_layer_name.node().value,
            ref_value_field.node().value,
            section2.select('#PropSymbolTypo_ref_size').node().value,
            section2.select('#PropSymbolTypo_symbol_type').node().value
          )
        });
        setSelected(field2_selec.node(), Object.getOwnPropertyNames(fields_all)[0]);
    },

    unfill: function(){
        let field1_selec = document.getElementById("PropSymbolTypo_field_1"),
            field2_selec = document.getElementById("PropSymbolTypo_field_2");
        for(let i = field1_selec.childElementCount - 1; i >= 0; i--){
            field1_selec.removeChild(field1_selec.children[i]);
        }
        for(let i = field2_selec.childElementCount - 1; i >= 0; i--){
            field2_selec.removeChild(field2_selec.children[i]);
        }
        section2.selectAll(".params").attr("disabled", true);
    },
    rendering_params: {}
};


function render_PropSymbolTypo(field1, color_field, new_layer_name, ref_value, ref_size, symb_selec){
  if(!ref_value || !color_field || !fields_PropSymbolTypo.rendering_params[color_field])
      return;
  let layer = Object.getOwnPropertyNames(user_data)[0],
      nb_features = user_data[layer].length,
      rendering_params = fields_PropSymbolTypo.rendering_params[color_field],
      rd_params = {};

  new_layer_name = (new_layer_name.length > 0 && /^\w+$/.test(new_layer_name))
                  ? check_layer_name(new_layer_name) : check_layer_name(["PropSymbolsTypo", field1, color_field, layer].join('_'));

  rd_params.field = field1;
  rd_params.new_name = new_layer_name;
  rd_params.nb_features = nb_features;
  rd_params.ref_layer_name = layer;
  rd_params.symbol = symb_selec;
  rd_params.ref_value = +ref_value;
  rd_params.ref_size = +ref_size;
  rd_params.fill_color = rendering_params.colorByFeature;

  let id_map = make_prop_symbols(rd_params);

  current_layers[new_layer_name] = {
      renderer: "PropSymbolsTypo",
      features_order: id_map,
      symbol: rd_params.symbol,
      ref_layer_name: layer,
      rendered_field: field1,
      rendered_field2: color_field,
      size: [ref_value, ref_size],
      "stroke-width-const": 1,
      fill_color: { "class": id_map.map(obj => obj[3]) },
      is_result: true,
      n_features: nb_features,
      color_map: rendering_params.color_map
  };
  zoom_without_redraw();
  switch_accordion_section();
  handle_legend(new_layer_name);
}

function fillMenu_Discont(){
    var dv2 = make_template_functionnality(section2);

    let a = dv2.append('p').attr('class', 'params_section2');
    a.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.field'})
      .html(i18next.t('app_page.func_options.discont.field'));
    a.insert('select')
      .attrs({class: 'params', id: 'field_Discont'});

    let b = dv2.append('p').attr('class', 'params_section2');
    b.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.id_field'})
      .html(i18next.t('app_page.func_options.discont.id_field'));
    b.insert('select')
      .attrs({class: 'params', id: 'field_id_Discont'});

    let c = dv2.append('p').attr('class', 'params_section2');
    c.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.type_discontinuity'})
      .html(i18next.t('app_page.func_options.discont.type_discontinuity'));
    let disc_kind = c.insert('select')
      .attrs({class: 'params i18n', id: 'kind_Discont'});

    [['app_page.func_options.discont.type_relative', 'rel'],
      ['app_page.func_options.discont.type_absolute', 'abs']
    ].forEach(k => {
        disc_kind.append('option').text(i18next.t(k[0])).attrs({'value': k[1], 'data-i18n': '[text]' + k[0]});
    });

    let d = dv2.append('p').attr('class', 'params_section2');
    d.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.nb_class'})
      .html(i18next.t('app_page.func_options.discont.nb_class'));
    d.insert('input')
      .attrs({type: 'number', class: 'params', id: 'Discont_nbClass', min: 1, max: 33, value: 4})
      .style('width', '50px');

    let e = dv2.append('p').attr('class', 'params_section2');
    e.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.discretization'})
      .html(i18next.t('app_page.func_options.discont.discretization'))
    let disc_type = e.insert('select')
      .attrs({'class': 'params i18n', 'id': 'Discont_discKind'});

    [
     ['app_page.common.equal_interval', 'equal_interval'],
     ['app_page.common.quantiles', 'quantiles'],
     ['app_page.common.Q6', 'Q6'],
     ['app_page.common.arithmetic_progression', 'arithmetic_progression'],
     ['app_page.common.jenks', 'jenks']
    ].forEach(field => {
         disc_type.append('option').text(i18next.t(field[0])).attrs({'value': field[1], 'data-i18n': '[text]' + field[0]});
    });

    let f = dv2.append('p').attr('class', 'params_section2');
    f.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.discont.color'})
      .html(i18next.t('app_page.func_options.discont.color'));
    f.insert('input')
      .attrs({class: 'params', id: 'color_Discont', type: 'color', value: ColorsSelected.random()});

    make_layer_name_button(dv2, 'Discont_output_name');
    make_ok_button(dv2, 'yes_Discont', false);

    dv2.selectAll('.params').attr('disabled', true);
}

var fields_Discont = {
    fill: function(layer){
        if(!layer) return;
        let fields_num = type_col(layer, "number"),
            fields_all = Object.getOwnPropertyNames(user_data[layer][0]),
            field_discont = section2.select("#field_Discont"),
            field_id = section2.select("#field_id_Discont"),
            ok_button = section2.select('#yes_Discont');

        if(fields_num.length == 0){
            display_error_num_field();
            return;
        }

        fields_num.forEach(function(field){
                field_discont.append("option").text(field).attr("value", field);
        });
        fields_all.forEach(function(field){
                field_id.append("option").text(field).attr("value", field);
        });
        field_discont.on("change", function(){
          let disc_kind = document.getElementById("Discont_discKind").value;
          document.getElementById("Discont_output_name").value = ["Disc", this.value, disc_kind, layer].join('_');
        });
        ok_button.on('click', render_discont);
        section2.selectAll(".params").attr("disabled", null);
        document.getElementById("Discont_output_name").value = ["Disc", layer].join('_');
    },
    unfill: function(){
        unfillSelectInput(document.getElementById("field_Discont"));
        unfillSelectInput(document.getElementById("field_id_Discont"));
        section2.selectAll(".params").attr("disabled", true);
    }
}

var render_discont = function(){
//    return new Promise(function(resolve, reject){
    let layer = Object.getOwnPropertyNames(user_data)[0],
        field = document.getElementById("field_Discont").value,
        field_id = document.getElementById("field_id_Discont").value,
        min_size = 1,
        max_size = 10,
        threshold = 1,
        disc_kind = document.getElementById("kind_Discont").value,
        nb_class = +document.getElementById("Discont_nbClass").value,
        user_color = document.getElementById("color_Discont").value,
        method = document.getElementById("kind_Discont").value,
        new_layer_name = document.getElementById("Discont_output_name").value;

    new_layer_name = (new_layer_name.length > 0 && /^\w+$/.test(new_layer_name))
                    ? check_layer_name(new_layer_name) : check_layer_name(["Disc", field, disc_kind, layer].join('_'));

    let result_value = new Map(),
        result_geom = {},
        topo_mesh = topojson.mesh,
        math_max = Math.max;

    // Use topojson.mesh a first time to compute the discontinuity value
    // for each border (according to the given topology)
    // (Discontinuities could also be computed relativly fastly server side
    // which can be a better solution for large dataset..)
    if(disc_kind == "rel")
        topo_mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
                if(a !== b){
                    let new_id = [a.id, b.id].join('_'),
                        new_id_rev = [b.id, a.id].join('_');
                    if(!(result_value.get(new_id) || result_value.get(new_id_rev))){
                        let value = math_max(a.properties[field] / b.properties[field],
                                             b.properties[field] / a.properties[field]);
                        result_value.set(new_id, value);
                    }
                }
                return false; });
    else
        topo_mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
                if(a !== b){
                    let new_id = [a.id, b.id].join('_'),
                        new_id_rev = [b.id, a.id].join('_');
                    if(!(result_value.get(new_id) || result_value.get(new_id_rev))){
                        let value = math_max(a.properties[field] - b.properties[field],
                                             b.properties[field] - a.properties[field]);
                        result_value.set(new_id, value);
                    }
                }
                return false; });

    let arr_disc = [],
        arr_tmp = [];
    for(let kv of result_value.entries()){
        if(!isNaN(kv[1])){
            arr_disc.push(kv);
            arr_tmp.push(kv[1]);
        }
    }

    arr_disc.sort((a,b) => a[1] - b[1]);
    arr_tmp.sort((a,b) => a - b);

    let nb_ft = arr_tmp.length,
        step = (max_size - min_size) / (nb_class - 1),
        class_size = Array(nb_class).fill(0).map((d,i) => min_size + (i * step));

    let disc_result = discretize_to_size(arr_tmp, document.getElementById("Discont_discKind").value, nb_class, min_size, max_size);
    if(!disc_result || !disc_result[2]){
        let opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_ft));
        let w = nb_class > opt_nb_class ? i18next.t("app_page.common.smaller") : i18next.t("app_page.common.larger");
        swal("", i18next.t("app_page.common.error_discretization", {arg: w}), "error");
        return;
    }
    let serie = disc_result[3],
        breaks = disc_result[2].map(ft => [ft[0], ft[1]]);

    let result_layer = map.append("g").attr("id", new_layer_name)
            .styles({"stroke-linecap": "round", "stroke-linejoin": "round"})
            .attr("class", "result_layer layer");

    result_data[new_layer_name] = [];
    let data_result = result_data[new_layer_name],
        result_lyr_node = result_layer.node();

    // This is bad and should be replaced by somthing better as we are
    // traversing the whole topojson again and again
    // looking for each "border" from its "id" (though it isn't that slow)
//    let chunk_size = 450 > nb_ft ? nb_ft : 450,
//        _s = 0;
//
//    var compute = function(){
//        for(let i=_s; i<chunk_size; i++){
////            let id_ft = arr_disc[i][0],
////                val = arr_disc[i][1],
//            let [id_ft, val] = arr_disc[i],
//                p_size = class_size[serie.getClass(val)];
//            data_result.push({id: id_ft, disc_value: val, prop_value: p_size});
//            result_layer.append("path")
//                .datum(topo_mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
////                    let a_id = id_ft.split("_")[0], b_id = id_ft.split("_")[1];
//                    let [a_id, b_id] = id_ft.split("_");
//                    return a != b
//                        && (a.id == a_id && b.id == b_id || a.id == b_id && b.id == a_id); }))
//                .attrs({d: path, id: ["feature", i].join('_')})
//                .styles({stroke: user_color, "stroke-width": p_size, "fill": "transparent"})
//                .style("stroke-opacity", val >= threshold ? 1 : 0);
//            result_lyr_node.querySelector(["#feature", i].join('_')).__data__.properties = data_result[i];
//        }
//        _s = chunk_size;
//        if(_s < nb_ft){
//            chunk_size += 450;
//            if(chunk_size > nb_ft) chunk_size = nb_ft;
//            setTimeout(compute, 0);
//            return;
//        }
//    }
//
//    compute();

//    var datums = [];
    var d_res = [];
    var compute = function(){
        for(let i=0; i<nb_ft; i++){
            let id_ft = arr_disc[i][0],
                val = arr_disc[i][1],
                p_size = class_size[serie.getClass(val)],
                datum = topo_mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
                    let a_id = id_ft.split("_")[0], b_id = id_ft.split("_")[1];
                    return a != b
                        && (a.id == a_id && b.id == b_id || a.id == b_id && b.id == a_id); });
            d_res.push([val, {id: id_ft, disc_value: val, prop_value: p_size}, datum, p_size]);
        }
    }

    compute();
    d_res.sort((a,b) => b[0] - a[0]);

    for(let i=0; i<nb_ft; i++){
        let val = d_res[i][0];
        result_layer.append("path")
            .datum(d_res[i][2])
            .attrs({d: path, id: ["feature", i].join('_')})
            .styles({stroke: user_color, "stroke-width": d_res[i][3], "fill": "transparent", "stroke-opacity": val >= threshold ? 1 : 0});
        data_result.push(d_res[i][1])
        result_lyr_node.querySelector(["#feature", i].join('_')).__data__.properties = data_result[i];
    }

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
        "n_features": nb_ft
        };
    create_li_layer_elem(new_layer_name, nb_ft, ["Line", "discont"], "result");
    up_legends();
    zoom_without_redraw();
    switch_accordion_section();
    handle_legend(new_layer_name);
    send_layer_server(new_layer_name, "/layers/add");
//    resolve(true);
//});
}

function fillMenu_PropSymbol(layer){
    var dialog_content = make_template_functionnality(section2),
        max_allowed_size = Math.round(h/2 - h/10);

    let a = dialog_content.append('p').attr('class', 'params_section2');
    a.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.field'})
      .html(i18next.t("app_page.func_options.common.field"));
    let field_selec = a.insert('select')
      .attrs({class: 'params', 'id': "PropSymbol_field_1"});

    let b = dialog_content.append('p').attr('class', 'params_section2');
    b.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.fixed_size'})
      .html(i18next.t("app_page.func_options.prop.fixed_size"));
    let ref_size = b.insert('input')
      .attrs({id: 'PropSymbol_ref_size', type: 'number', class: 'params', min: 0.2, max: max_allowed_size, value: 30.0, step: 0.1})
      .style("width", "50px");
    b.append('span').html(" px");

    let c = dialog_content.append('p').attr('class', 'params_section2');
    c.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.on_value'})
      .html(i18next.t("app_page.func_options.prop.on_value"));
    let ref_value = c.insert('input')
      .styles({'width': '100px', "margin-left": "10px"})
      .attrs({id: 'PropSymbol_ref_value', type: 'number', class: "params", min: 0.1, step: 0.1});

    let d = dialog_content.append('p').attr('class', 'params_section2');
    d.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.symbol_type'})
      .html(i18next.t("app_page.func_options.prop.symbol_type"));
    let symb_selec = d.insert('select')
      .attrs({'class': 'params i18n', "id": "PropSymbol_symbol"});

    [['app_page.func_options.common.symbol_circle', 'circle'],
     ['app_page.func_options.common.symbol_square', 'rect']
    ].forEach(function(symb){
        symb_selec.append("option").text(i18next.t(symb[0])).attrs({"value": symb[1], 'data-i18n': '[text]' + symb[0]});});

    let color_section = dialog_content.append('p').attr('class', 'params_section2');
    color_section.append("span")
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.symbol_color'})
      .html(i18next.t("app_page.func_options.prop.symbol_color"));
    let color_par = color_section.append('select')
      .attrs({id: 'PropSymbol_nb_colors', class: 'params'});
    color_par.append("option")
        .attrs({value: 1, class: 'i18n', 'data-i18n': '[text]app_page.func_options.prop.options_one_color'})
        .text(i18next.t("app_page.func_options.prop.options_one_color"));
    color_par.append("option")
        .attrs({value: 2, class: 'i18n', 'data-i18n': '[text]app_page.func_options.prop.options_two_colors'})
        .text(i18next.t("app_page.func_options.prop.options_two_colors"));

    let col_p = dialog_content.append("p")
      .attr('class', 'params_section2')
      .styles({'padding-top': '5px', 'margin-bottom': '-5px', 'text-align': 'center'});
    col_p.insert('input')
      .styles({"position": "unset"})
      .attrs({type: "color", class: "params", id: "PropSymbol_color1", value: ColorsSelected.random()});
    col_p.insert('input')
      .styles({"display": "none", "position": "unset"})
      .attrs({type: "color", class: "params", id: "PropSymbol_color2", value: ColorsSelected.random()});

    let col_b = dialog_content.insert("p").attr('class', 'params_section2');
    col_b.insert("span")
      .style("display", "none")
      .attrs({id: 'PropSymbol_color_txt', class: 'i18n', 'data-i18n': '[html]app_page.func_options.prop.options_break_two_colors'})
      .html(i18next.t("app_page.func_options.prop.options_break_two_colors"));
    col_b.insert('input')
      .attrs({id: 'PropSymbol_break_val', 'type': 'number', class: "params"})
      .styles({"display": "none", "width": "75px"});

    make_layer_name_button(dialog_content, 'PropSymbol_output_name');
    make_ok_button(dialog_content, 'PropSymbol_yes', false);
    dialog_content.selectAll(".params").attr("disabled", true);
}

var fields_PropSymbol = {
    fill: function(layer){
        if(!layer) return;
        section2.selectAll(".params").attr("disabled", null);
        let fields = type_col(layer, "number"),
            nb_features = user_data[layer].length,
            field_selec = section2.select("#PropSymbol_field_1"),
            nb_color = section2.select('#PropSymbol_nb_colors'),
            ok_button = section2.select('#PropSymbol_yes'),
            ref_value_field = section2.select('#PropSymbol_ref_value'),
            ref_size = section2.select('#PropSymbol_ref_size'),
            symb_selec = section2.select('#PropSymbol_symbol'),
            uo_layer_name = section2.select('#PropSymbol_output_name'),
            fill_color = section2.select('#PropSymbol_color1'),
            fill_color2 = section2.select('#PropSymbol_color2'),
            fill_color_opt = section2.select('#PropSymbol_break_val'),
            fill_color_text = section2.select('#PropSymbol_color_txt');

        fields.forEach(function(field){
            field_selec.append("option").text(field).attr("value", field);
        });

        field_selec.on("change", function(){
            let field_name = this.value,
                field_values = user_data[layer].map(obj => +obj[field_name]),
                max_val_field = max_fast(field_values);

            uo_layer_name.attr('value', ["PropSymbol", this.value, layer].join('_'));
            ref_value_field.attrs({"max": max_val_field, 'value': max_val_field});
            if(has_negative(field_values)){
                setSelected(nb_color.node(), 2);
                break_val.attr('value', 0);
            } else {
                setSelected(nb_color.node(), 1);
            }
        });

        nb_color.on("change", function(){
            if(this.value == 1){
                fill_color2.style("display", "none");
                fill_color_opt.style("display", "none");
                fill_color_text.style("display", "none");
            } else {
                fill_color2.style("display", null);
                fill_color_opt.style("display", null);
                fill_color_text.style("display", "inline");
            }
          });
        ok_button.on("click", function(){
            let nb_features = user_data[layer].length,
                field_to_render = field_selec.node().value,
                user_new_layer_name = uo_layer_name.node().value,
                new_layer_name = check_layer_name(user_new_layer_name.length > 0 && /^\w+$/.test(user_new_layer_name) ? user_new_layer_name : ["PropSymbols", field_to_render, layer].join('_')),
                rendering_params = { "field": field_to_render,
                                     "nb_features": nb_features,
                                     "new_name": new_layer_name,
                                     "ref_layer_name": layer,
                                     "symbol": symb_selec.node().value,
                                     "ref_size": +ref_size.node().value,
                                     "ref_value": +ref_value_field.node().value,
                                     "fill_color": fill_color.node().value };
            if(+nb_color.node().value == 2){
                rendering_params["break_val"] = +fill_color_opt.node().value;
                rendering_params["fill_color"] = {"two" : [fill_color.node().value, fill_color2.node().value]};
            }
            make_prop_symbols(rendering_params);
            zoom_without_redraw();
            switch_accordion_section();
            handle_legend(new_layer_name);
        });
        uo_layer_name.attr('value', ["PropSymbols", layer].join('_'));
        setSelected(field_selec.node(), fields[0]);
    },

    unfill: function(){
        let field_selec = document.getElementById("PropSymbol_field_1");
        unfillSelectInput(field_selec);
        section2.selectAll(".params").attr("disabled", true);
    }
};

function fillMenu_TypoSymbol(){
    var dv2 = make_template_functionnality(section2);
    let a = dv2.append("p").attr('class', 'params_section2');
    a.append('span')
      .attrs({"class": "i18n", "data-i18n": "[html]app_page.func_options.typosymbol.field"})
      .html(i18next.t("app_page.func_options.typosymbol.field"));
    let field_selec = a.insert('select')
      .attrs({class: "params", id: "field_Symbol"});

    let b = dv2.insert('p').style("margin", "auto").attr('class', 'params_section2');
    b.append("button")
      .attrs({id: "selec_Symbol", class: "button_disc params i18n",
              "data-i18n": "[html]app_page.func_options.typosymbol.symbols_choice"})
      .styles({"font-size": "0.8em", "text-align": "center"})
      .html(i18next.t("app_page.func_options.typosymbol.symbols_choice"));

    make_layer_name_button(dv2, 'TypoSymbols_output_name')
    make_ok_button(dv2, 'yesTypoSymbols');
    dv2.selectAll(".params").attr("disabled", true);
}

var fields_TypoSymbol = {
    fill: function(layer){
        if(!layer) return;
        let fields_all = Object.getOwnPropertyNames(user_data[layer][0]),
            field_to_use = section2.select("#field_Symbol"),
            selec_symbol = section2.select("#selec_Symbol"),
            uo_layer_name = section2.select('#TypoSymbols_output_name'),
            ok_button = section2.select('#yesTypoSymbols'),
            self = this;

        section2.selectAll(".params").attr("disabled", null);
        fields_all.forEach(function(field){
            field_to_use.append("option").text(field).attr("value", field);
        });
        field_to_use.on("change", function(){
            let field = this.value;
            if(self.rendering_params[field]){
              document.getElementById("yesTypoSymbols").disabled = null;
              self.box_typo = display_box_symbol_typo(layer, this.value, self.rendering_params[field].symbols_map);
            } else {
              document.getElementById("yesTypoSymbols").disabled = true;
              self.box_typo = display_box_symbol_typo(layer, this.value);
            }
        });
        selec_symbol.on("click", function(){
            swal({
                    title: "",
                    text: i18next.t("app_page.common.error_too_many_features"),
                    type: "warning",
                    showCancelButton: true,
                    allowOutsideClick: false,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: i18next.t("app_page.common.valid") + "!",
                    cancelButtonText: i18next.t("app_page.common.cancel"),
                }).then(() => {
                    fields_TypoSymbol.box_typo().then(function(confirmed){
                        if(confirmed){
                          let field = document.getElementById("field_Symbol").value;
                          document.getElementById("yesTypoSymbols").disabled = null;
                          self.rendering_params[field] = {
                              nb_cat: confirmed[0],
                              symbols_map: confirmed[1],
                              field: field
                          };
                        }
                    });
                }, () => {
                    return;
                });
        });
        ok_button.on('click', function(){
          let field = field_to_use.node().value;
          render_TypoSymbols(fields_TypoSymbol.rendering_params[field], uo_layer_name.node().value);
        });

        self.box_typo = display_box_symbol_typo(layer, fields_all[0]);
        uo_layer_name.attr('value', ["Symbols", layer].join('_'));
        document.getElementById("TypoSymbols_output_name").value = ["Symbols", layer].join('_');
    },
    unfill: function(){
        unfillSelectInput(document.getElementById("field_Symbol"));
        section2.selectAll(".params").attr("disabled", true);
    },
    box_typo: undefined,
    rendering_params: {},
    cats: {}
}

function render_TypoSymbols(rendering_params, new_name){
    let layer_name = Object.getOwnPropertyNames(user_data)[0];
    let field = rendering_params.field;
    let layer_to_add = check_layer_name(new_name.length > 0 && /^\w+$/.test(new_name) ? new_name : ["Symbols", field, layer_name].join("_"));
    let new_layer_data = [];

    let ref_selection = document.getElementById(layer_name).getElementsByTagName("path");
    let nb_ft = ref_selection.length;

    for(let i=0; i<nb_ft; i++){
        let ft = ref_selection[i].__data__;
        new_layer_data.push({Symbol_field: ft.properties[field], coords: path.centroid(ft)});
    }

    let context_menu = new ContextMenu(),
        getItems = (self_parent) => [
            {"name": i18next.t("app_page.common.edit_style"), "action": () => { make_style_box_indiv_symbol(self_parent); }},
            {"name": i18next.t("app_page.common.delete"), "action": () => {self_parent.style.display = "none"; }}
    ];

    map.append("g").attrs({id: layer_to_add, class: "layer"})
        .selectAll("image")
        .data(new_layer_data).enter()
        .insert("image")
        .attrs( d => {
          let symb = rendering_params.symbols_map.get(d.Symbol_field);
          return {
            "x": d.coords[0] - symb[1] / 2,
            "y": d.coords[1] - symb[1] / 2,
            "width": symb[1] + "px",
            "height": symb[1] + "px",
            "xlink:href": symb[0]
          };
        })
        .on("mouseover", function(){ this.style.cursor = "pointer";})
        .on("mouseout", function(){ this.style.cursor = "initial";})
        .on("contextmenu dblclick", function(){
            context_menu.showMenu(d3.event, document.querySelector("body"), getItems(this));
            })
        .call(drag_elem_geo);

    create_li_layer_elem(layer_to_add, nb_ft, ["Point", "symbol"], "result");

    current_layers[layer_to_add] = {
        "n_features": current_layers[layer_name].n_features,
        "renderer": "TypoSymbols",
        "symbols_map": rendering_params.symbols_map,
        "rendered_field": field,
        "is_result": true,
        "symbol": "image",
        "ref_layer_name": layer_name,
        };
    handle_legend(layer_to_add);
    up_legends();
    zoom_without_redraw();
    switch_accordion_section();
}

function fillMenu_griddedMap(layer){
    var dialog_content = make_template_functionnality(section2)

    let a = dialog_content.append('p').attr('class', 'params_section2');
    a.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.common.field'})
      .html(i18next.t("app_page.func_options.common.field"));
    a.insert('select')
      .attrs({class: 'params', id: "Gridded_field"});

    let b = dialog_content.append('p').attr('class', 'params_section2');
    b.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.cellsize'})
      .html(i18next.t("app_page.func_options.grid.cellsize"));
    b.insert('input')
      .style("width", "100px")
      .attrs({type: 'number', class: 'params', id: "Gridded_cellsize",
              value: 10.0, min: 1.000, max: 7000, step: "any"});

    let c = dialog_content.append('p').attr('class', 'params_section2');
    c.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.shape'})
      .html(i18next.t("app_page.func_options.grid.shape"));

    var grid_shape = c.insert('select')
        .attrs({class: 'params i18n', id: "Gridded_shape"});

    let d = dialog_content.append('p').attr('class', 'params_section2');
    d.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.grid.coloramp'})
      .html(i18next.t("app_page.func_options.grid.coloramp"));
    var col_pal = d.insert('select')
      .attrs({'class': 'params', 'id': 'Gridded_color_pal'});

    ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn',
    'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds']
    .forEach( color => { col_pal.append("option").text(color).attr("value", color); });

    [['app_page.func_options.grid.square', 'Square'],
     ['app_page.func_options.grid.diamond', 'Diamond'],
     ['app_page.func_options.grid.hexagon', 'Hexagon']
   ].forEach( shape => {
        grid_shape.append("option").text(i18next.t(shape[0])).attrs({'value': shape[1], 'data-i18n': '[text]' + shape[0]});
    });

    make_layer_name_button(dialog_content, 'Gridded_output_name');
    make_ok_button(dialog_content, 'Gridded_yes', false);
    section2.selectAll(".params").attr("disabled", true);
}


var fields_griddedMap = {
    fill: function(layer){
        if(!layer) return;

        let fields = type_col(layer, "number"),
            field_selec = section2.select("#Gridded_field"),
            output_name = section2.select('#Gridded_output_name'),
            grip_shape = section2.select('#Gridded_shape'),
            ok_button = section2.select('#Gridded_yes');

        fields.forEach(function(field){
            field_selec.append("option").text(field).attr("value", field); });
        field_selec.on("change", function(){
            output_name.attr('value', ["Gridded", this.value, layer].join('_'));
        });
        ok_button.on("click", () => {
          render_Gridded(
            field_selec.node().value,
            document.getElementById('Gridded_cellsize').value,
            grip_shape.node().value,
            document.getElementById('Gridded_color_pal').value,
            output_name.node().value
          )
        });
        output_name.attr('value', ["Gridded", layer].join('_'));
        document.getElementById("Gridded_cellsize").value = get_first_guess_span();
        section2.selectAll(".params").attr("disabled", null);
    },
    unfill: function(){
        let field_selec = document.getElementById("Gridded_field");
        unfillSelectInput(field_selec);
        section2.selectAll(".params").attr("disabled", true);
    }
}

function render_Gridded(field_n, resolution, cell_shape, color_palette, new_user_layer_name){
  let layer = Object.getOwnPropertyNames(user_data)[0],
      formToSend = new FormData(),
      var_to_send = {},
      res_test = test_maxmin_resolution(resolution);

  if(res_test){
      let message = res_test === "low" ? i18next.t("app_page.common.error_too_low_resolution") : i18next.t("app_page.common.error_too_high_resolution")
      display_error_during_computation(message);
      return;
  }

  if(current_layers[layer].original_fields.has(field_n))
      var_to_send[field_n] = [];
  else
      var_to_send[field_n] = user_data[layer].map(i => +i[field_n]);

  formToSend.append("json", JSON.stringify({
      "topojson": current_layers[layer].key_name,
      "var_name": var_to_send,
      "cellsize": resolution * 1000,
      "grid_shape": cell_shape
      }));
  xhrequest("POST", '/compute/gridded', formToSend, true)
      .then(data => {
          let options = {result_layer_on_add: true};
          if(new_user_layer_name.length > 0 &&  /^\w+$/.test(new_user_layer_name)){
              options["choosed_name"] = new_user_layer_name;
          }

          let n_layer_name = add_layer_topojson(data, options);
          if(!n_layer_name)
              return;
          let res_data = result_data[n_layer_name],
              nb_ft = res_data.length,
              opt_nb_class = Math.floor(1 + 3.3 * Math.log10(nb_ft)),
              d_values = [];

          for(let i=0; i < nb_ft; i++){
              d_values.push(+res_data[i]["densitykm"])
          }

          current_layers[n_layer_name].renderer = "Gridded";
          let disc_result = discretize_to_colors(d_values, "quantiles", opt_nb_class, color_palette),
              rendering_params = {
                  nb_class: opt_nb_class,
                  type: "quantiles",
                  schema: [color_palette],
                  breaks: disc_result[2],
                  colors: disc_result[3],
                  colorsByFeature: disc_result[4],
                  renderer: "Gridded",
                  rendered_field: "densitykm",
                      };
          render_choro(n_layer_name, rendering_params);
          handle_legend(n_layer_name);
          switch_accordion_section();
      }, error => {
          display_error_during_computation();
          console.log(error);
      });
}


function fillMenu_FlowMap(){
    var dv2 = make_template_functionnality(section2);

    let subtitle = dv2.append('p').attr('class', 'params_section2');
    subtitle.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.subtitle1'})
      .html(i18next.t("app_page.func_options.flow.subtitle1"));

    let origin_section = dv2.append('p').attr('class', 'params_section2');
    origin_section.append('span')
      .attrs({'class': 'i18n', 'data-i18n': '[html]app_page.func_options.flow.origin_field'})
      .html(i18next.t('app_page.func_options.flow.origin_field'));
    origin_section.insert('select')
      .attrs({id: 'FlowMap_field_i', class: 'params'});

    let destination_section = dv2.append('p').attr('class', 'params_section2');
    destination_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.destination_field'})
      .html(i18next.t('app_page.func_options.flow.origin_field'));
    destination_section.append('select')
      .attrs({class: 'params', id: 'FlowMap_field_j'});

    let intensity_section = dv2.append('p').attr('class', 'params_section2');
    intensity_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.intensity_field'})
      .html(i18next.t('app_page.func_options.flow.destination_field'));
    intensity_section.append('select')
      .attrs({class: 'params', id: 'FlowMap_field_fij'});

    let discretization_section = dv2.append('p').attr('class', 'params_section2');
    discretization_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.discretization'})
      .html(i18next.t("app_page.func_options.flow.discretization"));
    let disc_type = discretization_section.insert('select')
      .attrs({class: 'params i18n', id: "FlowMap_discKind"});

    [
     ["app_page.common.equal_interval", "equal_interval"],
     ["app_page.common.quantiles", "quantiles"],
     ["app_page.common.Q6", "Q6"],
     ["app_page.common.arithmetic_progression", "arithmetic_progression"],
     ["app_page.common.jenks", "jenks"]
    ].forEach(field => {
            disc_type.append("option").text(i18next.t(field[0])).attrs({"value": field[1], 'data-i18n': '[text]' + field[0]});
        });

    let nb_class_section = dv2.append('p').attr('class', 'params_section2');
    nb_class_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.nb_class'})
      .html(i18next.t("app_page.func_options.flow.nb_class"));
    nb_class_section.insert('input')
      .attrs({type: "number", class: 'params', id: "FlowMap_nbClass", min: 1, max: 33, value: 8})
      .style("width", "50px");

    dv2.append('p')
      .attrs({class: 'params', id: 'FlowMap_discTable'});
    dv2.append('p').attr('class', 'params_section2')
      .insert('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.ref_layer_field'})
      .html(i18next.t('app_page.func_options.flow.ref_layer_field'));

    let join_field_section = dv2.append('p').attr('class', 'params_section2');
    join_field_section.append('span')
      .attrs({class: 'i18n', 'data-i18n': '[html]app_page.func_options.flow.join_field'})
      .html(i18next.t('app_page.func_options.flow.join_field'));
    join_field_section.insert('select')
      .attrs({class: 'params', id: 'FlowMap_field_join'});

    make_layer_name_button(dv2, "FlowMap_output_name");
    make_ok_button(dv2, 'FlowMap_yes', false);

    d3.selectAll(".params").attr("disabled", true);
}

var fields_FlowMap = {
    fill: function(layer){
            let self = this,
                field_i = section2.select('#FlowMap_field_i'),
                field_j = section2.select('#FlowMap_field_j'),
                field_fij = section2.select('#FlowMap_field_fij'),
                join_field = section2.select('#FlowMap_field_join'),
                nb_class_input = section2.select('#FlowMap_nbClass'),
                disc_type = section2.select('#FlowMap_discKind'),
                ok_button = section2.select('#FlowMap_yes'),
                uo_layer_name = section2.select('#FlowMap_output_name');

        if(joined_dataset.length > 0
              && document.getElementById("FlowMap_field_i").options.length == 0){
            let fields = Object.getOwnPropertyNames(joined_dataset[0][0]);
            fields.forEach(function(field){
                field_i.append("option").text(field).attr("value", field);
                field_j.append("option").text(field).attr("value", field);
                field_fij.append("option").text(field).attr("value", field);
            });
        }
        if(layer){
            let ref_fields = Object.getOwnPropertyNames(user_data[layer][0]);

            ref_fields.forEach(function(field){
                join_field.append("option").text(field).attr("value", field);
            });
        }
        if(layer || joined_dataset.length > 0){
            section2.selectAll(".params").attr("disabled", null);
            uo_layer_name.attr('value', ["Links", layer].join('_'));
        }
        var values_fij;

        field_fij.on("change", function(){
            let name = this.value,
                nclass = nb_class_input.node().value,
                disc = disc_type.node().value,
                min_size = 0.5,
                max_size = 10;
            values_fij = joined_dataset[0].map(obj => +obj[name]);
            make_min_max_tableau(values_fij, nclass, disc, min_size, max_size, "FlowMap_discTable");
        });

        disc_type.on("change", function(){
            let name = field_fij.node().value,
                nclass = nb_class_input.node().value,
                disc = this.value,
                min_size = 0.5,
                max_size = 10;
            if(disc == "Q6"){
                nclass = 6;
                nb_class_input.attr("value", 6);
            }
            make_min_max_tableau(values_fij, nclass, disc, min_size, max_size, "FlowMap_discTable");
        })

        nb_class_input.on("change", function(){
            let name = field_fij.node().value,
                nclass = this.value,
                disc = disc_type.node().value,
                min_size = 0.5,
                max_size = 10;
            make_min_max_tableau(values_fij, nclass, disc, min_size, max_size, "FlowMap_discTable");
        });

        ok_button.on('click', function(){
          render_FlowMap(
            field_i.node().value,
            field_j.node().value,
            field_fij.node().value,
            join_field.node().value,
            disc_type.node().value,
            uo_layer_name.node().value
          )
        });
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
        document.getElementById("FlowMap_output_name").value = "";
        d3.selectAll(".params").attr("disabled", true);

    }
};

function render_FlowMap(field_i, field_j, field_fij, name_join_field, new_user_layer_name){
      let ref_layer = Object.getOwnPropertyNames(user_data)[0],
          formToSend = new FormData(),
          join_field_to_send = {};

      let disc_params = fetch_min_max_table_value("FlowMap_discTable"),
          mins = disc_params.mins,
          maxs = disc_params.maxs,
          sizes = disc_params.sizes,
          nb_class = mins.length,
          user_breaks = [].concat(mins, maxs[nb_class - 1]),
          min_size = min_fast(sizes),
          max_size = max_fast(sizes);

      join_field_to_send[name_join_field] = user_data[ref_layer].map(obj => obj[name_join_field]);

      formToSend.append("json", JSON.stringify({
          "topojson": current_layers[ref_layer].key_name,
          "csv_table": JSON.stringify(joined_dataset[0]),
          "field_i": field_i,
          "field_j": field_j,
          "field_fij": field_fij,
          "join_field": join_field_to_send
          }));

      xhrequest("POST", '/compute/links', formToSend, true)
          .then(data => {
              // FIXME : should use the user selected new name if any
              let options = {result_layer_on_add: true};
              if(new_user_layer_name.length > 0 &&  /^\w+$/.test(new_user_layer_name)){
                  options["choosed_name"] = new_user_layer_name;
              }

              let new_layer_name = add_layer_topojson(data, options);
              if(!new_layer_name) return;
              let layer_to_render = map.select("#" + new_layer_name).selectAll("path"),
                  fij_field_name = field_fij,
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
              current_layers[new_layer_name].linksbyId = [];
              current_layers[new_layer_name].size = [min_size, max_size];
              current_layers[new_layer_name].rendered_field = fij_field_name;
              current_layers[new_layer_name].ref_layer_name = ref_layer;
              current_layers[new_layer_name].min_display = 0;

              let links_byId = current_layers[new_layer_name].linksbyId;

              for(let i = 0; i < nb_ft; ++i){
                  let val = +fij_values[i];
                  links_byId.push([i, val, sizes[serie.getClass(val)]]);
              }

              for(let i = 0; i<nb_class; ++i)
                  current_layers[new_layer_name].breaks.push([[user_breaks[i], user_breaks[i+1]], sizes[i]]);

              layer_to_render.style('fill-opacity', 0)
                             .style('stroke-opacity', 0.8)
                             .style("stroke-width", (d,i) => {return links_byId[i][2]});
              switch_accordion_section();
              handle_legend(new_layer_name);
          }, error => {
              display_error_during_computation();
              console.log(error);
          });
};

var render_label = function(layer, rendering_params){
    let label_field = rendering_params.label_field;
    let txt_color = rendering_params.color;
    let selected_font = rendering_params.font;
    let font_size = rendering_params.ref_font_size + "px"
    let new_layer_data = [];
    let ref_selection = document.getElementById(layer).getElementsByTagName("path");
    let layer_to_add = rendering_params.uo_layer_name && rendering_params.uo_layer_name.length > 0
                    ? check_layer_name(rendering_params.uo_layer_name)
                    : check_layer_name("Labels_" + layer);
    let nb_ft = ref_selection.length;
    for(let i=0; i<nb_ft; i++){
        let ft = ref_selection[i].__data__;
        new_layer_data.push({label: ft.properties[label_field], coords: path.centroid(ft)});
    }

    var context_menu = new ContextMenu(),
        getItems = (self_parent) =>  [
            {"name": i18next.t("app_page.common.edit_style"), "action": () => { make_style_box_indiv_label(self_parent); }},
            {"name": i18next.t("app_page.common.delete"), "action": () => { self_parent.style.display = "none"; }}
        ];

    map.append("g").attrs({id: layer_to_add, class: "layer result_layer"})
        .selectAll("text")
        .data(new_layer_data).enter()
        .insert("text")
        .attrs( (d,i) => ({
          "id": "Feature_" + i,
          "x": d.coords[0],
          "y": d.coords[1],
          "alignment-baseline": "middle",
          "text-anchor": "middle"
        }))
        .styles({"font-size": font_size, "font-family": selected_font, fill: txt_color})
        .text(d => d.label)
        .on("mouseover", function(){ this.style.cursor = "pointer";})
        .on("mouseout", function(){ this.style.cursor = "initial";})
        .on("dblclick contextmenu", function(){
            context_menu.showMenu(d3.event,
                                  document.querySelector("body"),
                                  getItems(this)); })
        .call(drag_elem_geo);

    create_li_layer_elem(layer_to_add, nb_ft, ["Point", "label"], "result");

    current_layers[layer_to_add] = {
        "n_features": current_layers[layer].n_features,
        "renderer": "Label",
        "symbol": "text",
        "fill_color" : txt_color,
        "rendered_field": label_field,
        "is_result": true,
        "ref_layer_name": layer,
        "default_size": font_size,
        "default_font": selected_font
        };
    up_legends();
    zoom_without_redraw();
    return layer_to_add;
}
