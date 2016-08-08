"use strict";

function handle_legend(layer){
    let state = current_layers[layer].renderer;
    if(state != undefined){
        let class_name = [".lgdf", layer].join('_');
        if(d3.selectAll(class_name).node()){
            if(!d3.selectAll(class_name).attr("display"))
                d3.selectAll(class_name).attr("display", "none");
            else
                d3.selectAll(class_name).attr("display", null);
        } else {
            createLegend(layer, "")
        }
    }
}

function createLegend(layer, title){
    // Common part :
//    var source_info = map.insert('g').attr("class", "legend_feature source_block")
//                        .insert("text").style("font", "italic 10px Gill Sans Extrabold, sans-serif")
//                        .attrs({id: "source_block", x: 10, y: h-10})
//                        .text("Rendered by MAPOLOGIC");

    var field = current_layers[layer].rendered_field;
    // Specific parts :
    if(current_layers[layer].renderer.indexOf("PropSymbolsChoro") != -1){
        let field2 = current_layers[layer].rendered_field2;
        createLegend_choro(layer, field2, title);
        createLegend_symbol(layer, field);
    }
    else if(current_layers[layer].renderer.indexOf("PropSymbols") != -1
            || current_layers[layer].renderer.indexOf("DorlingCarto") != -1)
        createLegend_symbol(layer, field, title);

    else if (current_layers[layer].renderer.indexOf("Links") != -1
            || current_layers[layer].renderer.indexOf("DiscLayer") != -1)
        createLegend_discont_links(layer, field);

    else if (current_layers[layer].colors_breaks || current_layers[layer].color_map || current_layers[layer].symbols_map)
        createLegend_choro(layer, field, title, field);

    else if (current_layers[layer].renderer.indexOf("Carto_doug") != -1)
        createLegend_nothing(layer, field, "Dougenik Cartogram", field);

    else
        swal("Oups..!",
             i18next.t("No legend available for this representation") + ".<br>"
             + i18next.t("Want to make a <a href='/'>suggestion</a> ?"),
             "warning")
//        createLegend_nothing(layer, field, title, field);
}

function make_legend_context_menu(legend_node, layer){
   let context_menu = new ContextMenu(),
       getItems = () =>  [
        {"name": "Edit style...", "action": () => {  createlegendEditBox(legend_node.attr("id"), layer);  }},
        {"name": "Hide", "action": () => {
            if(!legend_node.attr("display"))
                legend_node.attr("display", "none");
            else
                legend_node.attr("diplay", null);
        }}
    ];
    legend_node.on("dblclick", () => {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        createlegendEditBox(legend_node.attr("id"), layer);
        });

    legend_node.on("contextmenu", () => {
        context_menu.showMenu(d3.event,
                              document.querySelector("body"),
                              getItems());
        });
}

var drag_legend_func = function(legend_group){
    return d3.drag()
             .subject(function() {
                    var t = d3.select(this),
                        prev_translate = t.attr("transform");
                    prev_translate = prev_translate ? prev_translate.slice(10, -1).split(',').map(f => +f) : [0, 0];
                    return {
                        x: t.attr("x") + prev_translate[0], y: t.attr("y") + prev_translate[1]
                    };
                })
            .on("start", () => {
                d3.event.sourceEvent.stopPropagation();
                d3.event.sourceEvent.preventDefault();
                if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                })
            .on("end", () => {
                if(d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
                legend_group.style("cursor", "grab");
                })
            .on("drag", function() {
                legend_group.attr('transform', 'translate(' + [d3.event.x, d3.event.y] + ')')
                        .style("cursor", "grabbing");
                });
}

function createLegend_nothing(layer, field, title, subtitle, rect_fill_value){
    var subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 12,
        xpos = 30,
        ypos = 30,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        legend_root = map.insert('g').attr('id', 'legend_root_nothing').attr("class", tmp_class_name).style("cursor", "grab");

    var rect_under_legend = legend_root.insert("rect");

    legend_root.insert('text').attr("id","legendtitle")
            .text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem)

    legend_root.insert('text').attr("id","legendsubtitle")
            .text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem)
            .attr("y", ypos + 15);

    legend_root.call(drag_legend_func(legend_root));

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attrs({x: xpos, y: ypos + 2*space_elem})
            .style("font", "11px 'Enriqueta', arial, serif")
            .html('');
    make_underlying_rect(legend_root, rect_under_legend, xpos, ypos, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function createLegend_discont_links(layer, field, title, subtitle, rect_fill_value){
    var subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 12,
        xpos = 30,
        ypos = 30,
        y_pos2 =  ypos + space_elem,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        legend_root = map.insert('g').attr('id', 'legend_root_links').attr("class", tmp_class_name).style("cursor", "grab"),
        breaks = current_layers[layer].breaks,
        nb_class = breaks.length;

    var rect_under_legend = legend_root.insert("rect");

    legend_root.insert('text').attr("id","legendtitle")
            .text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem)
            .attr("y", ypos)

    legend_root.insert('text').attr("id","legendsubtitle")
            .text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem)
            .attr("y", ypos + 15);

    let ref_symbols_params = new Array();

    for(let b_val of breaks)
        ref_symbols_params.push({value:b_val[0], size:b_val[1]})
    ref_symbols_params.reverse();
    var legend_elems = legend_root.selectAll('.legend')
                                  .append("g")
                                  .data(ref_symbols_params)
                                  .enter().insert('g')
                                  .attr('class', function(d, i) { return "legend_feature lg legend_" + i; });

    let max_size = current_layers[layer].size[1],
        last_size = 0,
        last_pos = y_pos2,
        color = current_layers[layer].fill_color.single;

    legend_elems
          .append("rect")
          .attr("x", function(d, i){ return xpos + space_elem + max_size / 2;})
          .attr("y", function(d, i){
                    last_pos = boxgap + last_pos + last_size;
                    last_size = d.size;
                    return last_pos;
                    })
          .attr('width', 45)
          .attr('height', function(d, i){  return d.size;  })
          .styles({fill: color, stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7, "stroke-width": 0})

    last_pos = y_pos2;
    last_size = 0;

    let x_text_pos = xpos + space_elem + max_size * 1.5 + 45;
    let tmp_pos;
    legend_elems.append("text")
        .attr("x", x_text_pos)
        .attr("y", function(d, i){
                    last_pos = boxgap + last_pos + last_size;
                    last_size = d.size;
                    tmp_pos = last_pos - (d.size / 4)
                    return tmp_pos;
                    })
        .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
        .text(function(d, i){return d.value[1];});

    legend_root.insert('text').attr("id", "lgd_choro_min_val")
        .attr("x", x_text_pos)
        .attr("y", function(d, i){
          return tmp_pos + boxgap;
          })
        .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
        .text(function(d) { return ref_symbols_params[ref_symbols_params.length -1].value[0] });


    legend_root.call(drag_legend_func(legend_root));

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attrs({x: xpos, y: last_pos + 2*space_elem})
            .style("font", "11px 'Enriqueta', arial, serif")
            .html('');
    make_underlying_rect(legend_root, rect_under_legend, xpos, ypos, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function make_underlying_rect(legend_root, under_rect, xpos, ypos, fill){
    under_rect.attrs({"width": 0, height: 0});
    let bbox_legend = legend_root.node().getBoundingClientRect();
    under_rect.attr("class", "legend_feature").attr("id", "under_rect")
                     .attr("height", Math.round(bbox_legend.height / 5) * 5 + 20)
                     .attr("width", Math.round(bbox_legend.width / 5) * 5 + 25)

    if(xpos && ypos)
        under_rect.attr("x", xpos - 2.5).attr("y", ypos - 12.5)
    if(!fill || (!fill.color || !fill.opacity)){
        under_rect.style("fill", "green")
                  .style("fill-opacity", 0);
        legend_root.attr("visible_rect", "false");
        legend_root.on("mouseover", ()=>{ under_rect.style("fill-opacity", 0.1); })
                   .on("mouseout", ()=>{ under_rect.style("fill-opacity", 0); });
    } else {
        under_rect.style("fill", fill.color)
                  .style("fill-opacity", fill.opacity);
        legend_root.attr("visible_rect", "true");
        legend_root.on("mouseover", null).on("mouseout", null);

    }
}

function createLegend_symbol(layer, field, title, subtitle, nested = "false", rect_fill_value){
    var subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 4,
        xpos = 30,
        ypos = 30,
        y_pos2 =  ypos + space_elem,
        ref_layer_name = layer.indexOf('_PropSymbols') > -1 ? layer.split("_PropSymbols")[0] : current_layers[layer].ref_layer_name,
        nb_features = user_data[ref_layer_name].length,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        symbol_type = current_layers[layer].symbol;


    var legend_root = map.insert('g').attr('id', 'legend_root2').attr("class", tmp_class_name).style("cursor", "grab");
    var rect_under_legend = legend_root.insert("rect");
    legend_root.insert('text').attr("id","legendtitle")
            .text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem)
            .attr("y", ypos)
    legend_root.insert('text').attr("id","legendsubtitle")
            .text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + space_elem)
            .attr("y", ypos + 15);

    let ref_symbols = document.getElementById(layer).querySelectorAll(symbol_type),
        type_param = symbol_type === 'circle' ? 'r' : 'width';

    let sqrt = Math.sqrt;

    let id_ft_val_min = +ref_symbols[nb_features - 1].id.split(' ')[1].split('_')[1],
        id_ft_val_max = +ref_symbols[0].id.split(' ')[1].split('_')[1],
        val_min = Math.abs(+user_data[ref_layer_name][id_ft_val_min][field]),
        val_max = Math.abs(+user_data[ref_layer_name][id_ft_val_max][field]),
        val_1 = Math.pow((sqrt(val_max) - sqrt(val_min)) / 3, 2),
        val_2 = Math.pow(sqrt(val_1) + (sqrt(val_max) - sqrt(val_min)) / 3, 2),
        d_values = [val_max, val_2, val_1, val_min],
        z_scale = zoom_scale,
        nb_decimals = get_nb_decimals(val_max),
        ref_symbols_params = [];

    let prop_values = prop_sizer3_e(d_values, current_layers[layer].size[0], current_layers[layer].size[1], symbol_type);

    prop_values.forEach((val,i) => {
        ref_symbols_params.push({value: d_values[i].toFixed(nb_decimals),
                                 size: val * z_scale});
    });

    var legend_elems = legend_root.selectAll('.legend')
                                  .append("g")
                                  .data(ref_symbols_params)
                                  .enter().insert('g')
                                  .attr('class', function(d, i) { return "legend_feature lg legend_" + i; });

    let max_size = ref_symbols_params[0].size,
        last_size = 0,
        last_pos = y_pos2;
    if(nested == "false"){
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
                  .styles({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7});
            last_pos = y_pos2; last_size = 0;
            legend_elems.append("text")
                .attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5)
                .attr("y", function(d, i){
//                            last_pos = d.size + last_pos + last_size;
                            last_pos = (i * boxgap) + d.size + last_pos + last_size;
                            last_size = d.size;
                            return last_pos + (i * 2/3);
                            })
                .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
                .text(function(d, i){return d.value;});

        } else if(symbol_type === "rect"){
            legend_elems
                  .append("rect")
                  .attr("x", function(d, i){ return xpos + space_elem + boxgap + max_size / 2 - d.size / 2;})
                  .attr("y", function(d, i){
                            last_pos = (i * boxgap) + (d.size / 2) + last_pos + last_size;
                            last_size = d.size;
                            return last_pos;
                            })
                  .attr('width', function(d, i){  return d.size;  })
                  .attr('height', function(d, i){  return d.size;  })
                  .styles({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7})
            last_pos = y_pos2; last_size = 0;
            let x_text_pos = xpos + space_elem + boxgap + max_size * 1.5 + 5;
            legend_elems.append("text")
                .attr("x", x_text_pos)
                .attr("y", function(d, i){
                            last_pos = (i * boxgap) + (d.size / 2) + last_pos + last_size;
                            last_size = d.size;
                            return last_pos + (d.size * 2 / 3);
                            })
                .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
                .text(function(d, i){return d.value;});
        }
    } else if (nested == "true"){
        if(symbol_type === "circle"){
            legend_elems
                  .append("circle")
                  .attr("cx", xpos + space_elem + boxgap + max_size / 2)
                  .attr("cy", d => ypos + 45 + max_size + (max_size / 2) - d.size)
                  .attr('r', d => d.size)
                  .styles({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7});
            last_pos = y_pos2; last_size = 0;
            legend_elems.append("text")
                .attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5)
                .attr("y", d => ypos + 45 + max_size * 2 - (max_size / 2) - d.size * 2)
                .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
                .text(d => d.value);
            last_pos = ypos + 30 + max_size + (max_size / 2);
        } else if(symbol_type === "rect"){
            legend_elems
                  .append("rect")
                  .attr("x", xpos + space_elem + boxgap)
                  .attr("y", d => ypos + 45 + max_size + (max_size / 2) - d.size)
                  .attr('height', d => d.size)
                  .attr('width', d => d.size)
                  .styles({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7});
            last_pos = y_pos2; last_size = 0;
            legend_elems.append("text")
                .attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5)
                .attr("y", d => ypos + 45 + max_size * 2 - (max_size / 2) - d.size)
                .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
                .text(d => d.value);
            last_pos = ypos + 30 + max_size + (max_size / 2);
        }
    }

    if(current_layers[layer].break_val){
        let bottom_colors  = legend_root.append("g").attr("class", "legend_feature");
        bottom_colors.insert("text").attr("id", "col1_txt")
                .attr("x", xpos + space_elem)
                .attr("y", last_pos + 1.75 * space_elem)
                .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
                .html('< ' + current_layers[layer].break_val);
        bottom_colors
                .insert("rect").attr("id", "col1")
                .attr("x", xpos + space_elem)
                .attr("y", last_pos + 2 * space_elem)
                .attrs({"width": space_elem, "height": space_elem})
                .style("fill", current_layers[layer].fill_color.two[0]);
        bottom_colors.insert("text").attr("id", "col1_txt")
                .attr("x", xpos + 3 * space_elem)
                .attr("y", last_pos + 1.75 * space_elem)
                .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
                .html('> ' + current_layers[layer].break_val);
        bottom_colors
                .insert("rect").attr("id", "col2")
                .attr("x", xpos + 3 * space_elem)
                .attr("y", last_pos + 2 * space_elem)
                .attrs({"width": space_elem, "height": space_elem})
                .style("fill", current_layers[layer].fill_color.two[1]);
    }
    var coef = current_layers[layer].break_val ? 3.75 : 2;
    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attrs({x: xpos, y: last_pos + coef * space_elem})
            .style("font", "11px 'Enriqueta', arial, serif")
            .html('');

    legend_root.call(drag_legend_func(legend_root));
    legend_root.attr("nested", nested);
    make_underlying_rect(legend_root, rect_under_legend, xpos, ypos, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function createLegend_choro(layer, field, title, subtitle, boxgap = 4, rect_fill_value, rounding_precision){
    var subtitle = subtitle || field,
        boxheight = 18,
        boxwidth = 18,
        xpos = w - (w / 8),
        ypos = 30,
        last_pos = null,
        y_pos2 =  ypos + boxheight * 2,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        nb_class,
        data_colors_label;

    var legend_root = map.insert('g')
                        .attr('id', 'legend_root').attr("class", tmp_class_name)
                        .style("cursor", "grab");

    var rect_under_legend = legend_root.insert("rect");

    boxgap = +boxgap;
    legend_root.attr("boxgap", boxgap);
    legend_root.attr("rounding_precision", rounding_precision);
    legend_root.insert('text').attr("id","legendtitle")
            .text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + boxheight)
            .attr("y", ypos)
    legend_root.insert('text').attr("id","legendsubtitle")
            .text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif")
            .attr("x", xpos + boxheight)
            .attr("y", ypos + 15);

    if(current_layers[layer].renderer.indexOf('Categorical') > -1){
        data_colors_label = [];
        current_layers[layer].color_map.forEach( (v,k) => {
            data_colors_label.push({value: v[1], color: v[0]}); } );
        nb_class = current_layers[layer].color_map.size;
    } else if(current_layers[layer].renderer.indexOf('TypoSymbols') > -1){
        data_colors_label = [];
        current_layers[layer].symbols_map.forEach( (v,k) => {
            data_colors_label.push({value: k, image: v}); } );
        nb_class = current_layers[layer].symbols_map.size;
    } else {
        data_colors_label = current_layers[layer].colors_breaks.map(obj => {
            return {value: obj[0], color: obj[1]};
        });
        nb_class = current_layers[layer].colors_breaks.length;
    }
    var legend_elems = legend_root.selectAll('.legend')
                                  .append("g")
                                  .data(data_colors_label)
                                  .enter().insert('g')
                                  .attr('class', function(d, i) { return "legend_feature lg legend_" + i; });

    if(current_layers[layer].renderer.indexOf('TypoSymbols') == -1)
        legend_elems
              .append('rect')
              .attr("x", xpos + boxwidth)
              .attr("y", function(d, i){
                last_pos = y_pos2 + (i * boxgap) + (i * boxheight);
                return last_pos;
                })
              .attr('width', boxwidth)
              .attr('height', boxheight)
              .style('fill', function(d) { return d.color; })
              .style('stroke', function(d) { return d.color; });

    else
        legend_elems
              .append('image')
              .attr("x", xpos + boxwidth)
              .attr("y", function(d, i){
                last_pos = y_pos2 + (i * boxgap) + (i * boxheight);
                return last_pos;
                })
              .attr('width', boxwidth)
              .attr('height', boxheight)
//              .attr('width', d => d.image[1])
//              .attr('height', d => d.image[1])
              .attr("xlink:href", d => d.image[0]);

    if(current_layers[layer].renderer.indexOf('Choropleth') > -1
        || current_layers[layer].renderer.indexOf('PropSymbolsChoro') > -1
        || current_layers[layer].renderer.indexOf('Gridded') > -1
        || current_layers[layer].renderer.indexOf('Stewart') > -1){
        let tmp_pos;
        legend_elems
          .append('text')
          .attr("x", xpos + boxwidth * 2 + 10)
          .attr("y", function(d, i){
            tmp_pos = y_pos2 + i * boxheight + (i * boxgap);
            return tmp_pos;
            })
          .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
          .text(function(d) { return round_value(+d.value.split(' - ')[1], rounding_precision) });

        legend_root
          .insert('text').attr("id", "lgd_choro_min_val")
          .attr("x", xpos + boxwidth * 2 + 10)
          .attr("y", function(d, i){
            return tmp_pos + boxheight + boxgap;
            })
          .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
          .text(function(d) { return round_value(data_colors_label[data_colors_label.length -1].value.split(' - ')[0], rounding_precision) });

    }
    else
        legend_elems
          .append('text')
          .attr("x", xpos + boxwidth * 2 + 10)
          .attr("y", function(d, i){
            return y_pos2 + (i * boxgap) / 2 + (i+2/3) * boxheight;
            })
          .styles({'alignment-baseline': 'middle' , 'font-size':'10px'})
          .text(function(d) { return d.value; });


    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attrs({x: xpos, y: last_pos + 2*boxheight})
            .style("font", "11px 'Enriqueta', arial, serif")
            .text('');
    legend_root.call(drag_legend_func(legend_root));
    make_underlying_rect(legend_root, rect_under_legend, xpos, ypos, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function createlegendEditBox(legend_id, layer_name){
    function bind_selections(){
        box_class = [layer_name, "_legend_popup"].join('');
        legend_node = document.querySelector(["#", legend_id, ".lgdf_", layer_name].join(''));
        title_content = legend_node.querySelector("#legendtitle");
        subtitle_content = legend_node.querySelector("#legendsubtitle");
        note_content = legend_node.querySelector("#legend_bottom_note");
        legend_node_d3 = d3.select(legend_node);
        legend_boxes = legend_node_d3.selectAll(["#", legend_id, " .lg"].join('')).select("text");
    };

    var box_class, legend_node, title_content,subtitle_content,note_content,source_content,legend_node_d3,legend_boxes,rect_fill_value;
    bind_selections();
    let original_params = {
        title_content: title_content.textContent, subtitle_content: subtitle_content.textContent,
        note_content: note_content.textContent }; //, source_content: source_content.textContent ? source_content.textContent : ""
    if(legend_node.getAttribute("visible_rect") == "true"){
        rect_fill_value = {
            color: legend_node.querySelector("#under_rect").style.fill,
            opacity: legend_node.querySelector("#under_rect").style.fillOpacity
        }
    }
    console.log(rect_fill_value)
    make_confirm_dialog("", "Confirm", "Cancel", "Layer style options", box_class, undefined, undefined, true)
        .then(function(confirmed){
            if(!confirmed){
                title_content.textContent = original_params.title_content;
                subtitle_content.textContent = original_params.subtitle_content;
                note_content.textContent = original_params.note_content;
            }
            bind_selections();
            make_underlying_rect(legend_node_d3,
                                 legend_node_d3.select("#under_rect"),
                                 undefined, undefined,
                                 rect_fill_value);
        });

    var box_body = d3.select([".", box_class].join('')),
        current_nb_dec;

    box_body.append('h3').html('Legend customization')
            .append('p').html('Legend title<br>')
            .insert('input')
            .attr("value", title_content.textContent)
            .on("keyup", function(){
                title_content.textContent = this.value
            });
    box_body.append('p').html('Variable name<br>')
            .insert('input')
            .attr("value", subtitle_content.textContent)
            .on("keyup", function(){
                subtitle_content.textContent = this.value
            });

    if(legend_boxes._groups[0].length > 0 && current_layers[layer_name].renderer != "Categorical"
        && current_layers[layer_name].renderer != "TypoSymbols"){
        // Float precision for label in the legend
        // (actually it's not really the float precision but an estimation based on
        // the string representation of only two values but it will most likely do the job in many cases)
        let max_nb_decimals = 0;
        if(legend_id.indexOf("2")=== -1){
            max_nb_decimals = get_max_nb_dec(layer_name);
        } else {
            let first_value = String(legend_boxes._groups[0][0].__data__.value),
                fourth_value = String(legend_boxes._groups[0][3].__data__.value);
            let p0 = first_value.indexOf("."),
                p3 = fourth_value.indexOf(".");
            if(p0 > -1){
                max_nb_decimals = first_value.length - p0 - 1;
            }
            if(p3 > -1 && (first_value.length - p3 - 1) > max_nb_decimals){
                max_nb_decimals = first_value.length - p3 - 1;
            }
        }

        if(max_nb_decimals > 0){
            if(legend_node.getAttribute("rounding_precision"))
                current_nb_dec = legend_node.getAttribute("rounding_precision");
            box_body.append('p')
                        .style("display", "inline")
                        .attr("id", "precision_change_txt")
                        .html(['Floating number rounding precision<br> ', current_nb_dec, ' '].join(''));
            if(legend_id === "legend_root" || legend_id === "legend_root_links")
                box_body.append('input')
                    .attrs({id: "precision_range", type: "range", min: -5, max: max_nb_decimals, step: 1, value: current_nb_dec})
                    .style("display", "inline")
                    .on('change', function(){
                        let nb_float = +this.value;
//                            dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                        d3.select("#precision_change_txt")
                            .html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                        for(let i = 0; i < legend_boxes._groups[0].length; i++){
                            let values = legend_boxes._groups[0][i].__data__.value.split(' - ');
                            legend_boxes._groups[0][i].innerHTML = round_value(+values[1], nb_float);
                        }
                        let min_val = +legend_boxes._groups[0][legend_boxes._groups[0].length - 1].__data__.value.split(' - ')[0];
                        document.getElementById('lgd_choro_min_val').innerHTML = round_value(min_val, nb_float);
                        legend_node.setAttribute("rounding_precision", nb_float);
                    });
            else if(legend_id === "legend_root2")
                box_body.append('input')
                    .attrs({id: "precision_range", type: "range", min: 0, max: max_nb_decimals, step: 1, value: current_nb_dec})
                    .style("display", "inline")
                    .on('change', function(){
                        let nb_float = +this.value,
                            dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                        d3.select("#precision_change_txt")
                            .html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                        for(let i = 0; i < legend_boxes._groups[0].length; i++){
                            let value = legend_boxes._groups[0][i].__data__.value;
                            legend_boxes._groups[0][i].innerHTML = String(Math.round(+value * dec_mult) / dec_mult);
                        }
                        legend_node.setAttribute("rounding_precision", nb_float);
                    });
        }
    }

    if(legend_id === "legend_root"){
        let current_state = +legend_node.getAttribute("boxgap") == 0 ? true : false;
        box_body.insert("p").html("No gap between color boxes")
                .insert("input").attr("type", "checkbox")
                .attr("id", "style_lgd")
                .on("change", function(){
                    let rendered_field = current_layers[layer_name].rendered_field2 ? current_layers[layer_name].rendered_field2 :  current_layers[layer_name].rendered_field;
                    legend_node = document.querySelector(["#legend_root.lgdf_", layer_name].join(''));
                    let boxgap = +legend_node.getAttribute("boxgap") == 0 ? 4 : 0;
                    let rounding_precision = document.getElementById("precision_range") ? document.getElementById("precision_range").value : undefined;
                    let transform_param = legend_node.getAttribute("transform"),
                        lgd_title = legend_node.querySelector("#legendtitle").innerHTML,
                        lgd_subtitle = legend_node.querySelector("#legendsubtitle").innerHTML;

                    legend_node.remove();
                    createLegend_choro(layer_name, rendered_field, lgd_title, lgd_subtitle, boxgap, rect_fill_value, rounding_precision);
                    bind_selections();
                    if(transform_param)
                        document.querySelector(["#legend_root.lgdf_", layer_name].join('')).setAttribute("transform", transform_param);
                });
        document.getElementById("style_lgd").checked = current_state;
    } else if (legend_id == "legend_root2"){
        let current_state = legend_node.getAttribute("nested") == "true" ? true : false;
        box_body.insert("p").html("Nested symbols")
                .insert("input").attr("type", "checkbox")
                .attr("id", "style_lgd")
                .on("change", function(){
                    legend_node = document.querySelector(["#legend_root2.lgdf_", layer_name].join(''))
                    let rendered_field = current_layers[layer_name].rendered_field;
                    let nested = legend_node.getAttribute("nested") == "true" ? "false" : "true";
                    let transform_param = legend_node.getAttribute("transform"),
                        lgd_title = legend_node.querySelector("#legendtitle").innerHTML,
                        lgd_subtitle = legend_node.querySelector("#legendsubtitle").innerHTML;

                    legend_node.remove();
                    createLegend_symbol(layer_name, rendered_field, lgd_title, lgd_subtitle, nested, rect_fill_value);
                    bind_selections();
                    if(transform_param)
                        document.querySelector(["#legend_root2.lgdf_", layer_name].join('')).setAttribute("transform", transform_param);
                });
        document.getElementById("style_lgd").checked = current_state;
    }

//    box_body.insert("p").html("Display features count ")
//            .insert("input").attr("type", "checkbox")
//            .on("change", function(){
//                alert("to be done!");
//            });

    box_body.insert('p').html('Additionnal legend notes<br>')
            .insert('input').attr("value", note_content.textContent)
            .style("font-family", "12px Gill Sans Extrabold, sans-serif")
            .on("keyup", function(){
                note_content.textContent = this.value;
            });

    box_body.insert('p').html('Display a rectangle under the legend')
                .insert("input").attr("type", "checkbox")
                .attr("checked", rect_fill_value === undefined ? null : true)
                .attr("id", "rect_lgd_checkbox")
                .on("change", function(){
                    if(this.checked){
                        rect_fill_value = {color: "white", opacity: 1};
                    } else {
                        rect_fill_value = undefined;
                    }
                    make_underlying_rect(legend_node_d3,
                                         legend_node_d3.select("#under_rect"),
                                         undefined, undefined,
                                         rect_fill_value
                                         );
                });
}

var get_max_nb_dec = function(layer_name){
    if(!(current_layers[layer_name]) || !(current_layers[layer_name].colors_breaks))
        return;
    let max = 0;
    current_layers[layer_name].colors_breaks.forEach( el => {
        let tmp = el[0].split(' - ');
        let p1 = tmp[0].indexOf("."), p2 = tmp[1].indexOf(".");
        if(p1 > -1)
            if(tmp[0].length - 1 - p1 > max)
                max = tmp[0].length - 1 - tmp[0].indexOf('.');
        if(p2 > -1)
            if(tmp[1].length - 1 - p2 > max)
                max = tmp[1].length - 1 - tmp[1].indexOf('.');
        });
    return max;
}
