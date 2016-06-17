"use strict";

function handle_legend(layer){
    let state = current_layers[layer].renderer;
    if(state != undefined){
        let class_name = [".lgdf", layer].join('_');
        let rml = false;
        if(d3.select(class_name).node()){
            d3.selectAll(class_name).remove();
            d3.selectAll(".source_block").remove();
            rml = true;
        } else {
            createLegend(layer, "Legend")
        }
    }
}

function createLegend(layer, title){
    // Common part :
    var source_info = map.insert('g').attr("class", "legend_feature source_block")
                        .insert("text").style("font", "italic 10px Gill Sans Extrabold, sans-serif")
                        .attr({id: "source_block", x: 10, y: h-10})
                        .text("Rendered by MAPOLOGIC");

    var field = current_layers[layer].rendered_field;
    // Specific parts :
    if(current_layers[layer].renderer.indexOf("PropSymbolsChoro") != -1){
        let field2 = current_layers[layer].rendered_field2;
        createLegend_choro(layer, field2, "Legend");
        createLegend_symbol(layer, field);
    }
    else if(current_layers[layer].renderer.indexOf("PropSymbols") != -1
            || current_layers[layer].renderer.indexOf("DorlingCarto") != -1)
        createLegend_symbol(layer, field, title);

    else if (current_layers[layer].renderer.indexOf("Links") != -1
            || current_layers[layer].renderer.indexOf("DiscLayer") != -1)
        createLegend_discont_links(layer, field);

    else if (current_layers[layer].colors_breaks)
        createLegend_choro(layer, field, title, field);

    else if (current_layers[layer].renderer.indexOf("Carto_doug") != -1)
        createLegend_nothing(layer, field, "Dougenik Cartogram", field);

    else
        createLegend_nothing(layer, field, title, field);
}

function createLegend_nothing(layer, field, title, subtitle){
    var title = title || "",
        subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 12,
        xpos = 30,
        ypos = 30,
        tmp_class_name = ["legend_feature", "lgdf_" + layer].join(' '),
        legend_root = map.insert('g').attr('id', 'legend_root_nothing').attr("class", tmp_class_name);

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
        .on('click', function(){ createlegendEditBox('legend_root_nothing', layer); });

    var drag_lgd = d3.behavior.drag()
                .on("dragstart", function(){
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                })
                .on("dragend", function(){  if(d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);  })
                .on("drag", function() {
                    legend_root.attr('transform', 'translate(' + [-xpos + d3.event.x, -ypos + d3.event.y] + ')');
                        });

    legend_root.node().querySelector("#move_legend").dispatchEvent(new MouseEvent("click"))

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attr({x: xpos, y: ypos + 2*space_elem})
            .html('');
}

function createLegend_discont_links(layer, field, title, subtitle){
    var title = title || "",
        subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 12,
        xpos = 30,
        ypos = 30,
        y_pos2 =  ypos + space_elem,
        tmp_class_name = ["legend_feature", "lgdf_" + layer].join(' '),
        legend_root = map.insert('g').attr('id', 'legend_root_links').attr("class", tmp_class_name),
        breaks = current_layers[layer].breaks,
        nb_class = breaks.length;

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
        .on('click', function(){ createlegendEditBox('legend_root_links', layer); });

    let ref_symbols_params = new Array();

    for(let b_val of breaks)
        ref_symbols_params.push({value:b_val[0], size:b_val[1]})

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
          .style({fill: color, stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7})

    last_pos = y_pos2;
    last_size = 0;

    let x_text_pos = xpos + space_elem + max_size * 1.5 + 45;
    legend_elems.append("text")
        .attr("x", x_text_pos)
        .attr("y", function(d, i){
                    last_pos = boxgap + last_pos + last_size;
                    last_size = d.size;
                    return last_pos + (d.size * 2 / 3);
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
                    legend_root.attr('transform', 'translate(' + [-xpos + d3.event.x, -ypos + d3.event.y] + ')');
                        });

    legend_root.node().querySelector("#move_legend").dispatchEvent(new MouseEvent("click"))

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attr({x: xpos, y: last_pos + 2*space_elem})
            .html('');
}

function createLegend_symbol(layer, field, title, subtitle){
    var title = title || "",
        subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 4,
        xpos = 30,
        ypos = 30,
        y_pos2 =  ypos + space_elem,
        ref_layer_name = layer.indexOf('_PropSymbols') > -1 ? layer.split("_PropSymbols")[0] : current_layers[layer].ref_layer_name,
        nb_features = user_data[ref_layer_name].length,
        tmp_class_name = ["legend_feature", "lgdf_" + layer].join(' '),
        symbol_type = current_layers[layer].symbol;


    var legend_root = map.insert('g').attr('id', 'legend_root2').attr("class", tmp_class_name);

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
        .on('click', function(){ createlegendEditBox('legend_root2', layer); });

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
              .style({fill: "beige", stroke: "rgb(0, 0, 0)", "fill-opacity": 0.7})
        last_pos = y_pos2; last_size = 0;
        let x_text_pos = xpos + space_elem + boxgap + max_size * 1.5 + 5;
        legend_elems.append("text")
            .attr("x", x_text_pos)
            .attr("y", function(d, i){
                        last_pos = (i * boxgap) + (d.size / 2) + last_pos + last_size;
                        last_size = d.size;
                        return last_pos + (d.size * 2 / 3);
                        })
            .style({'alignment-baseline': 'middle' , 'font-size':'10px'})
            .text(function(d, i){return d.value;});

    }

    var drag_lgd = d3.behavior.drag()
                .on("dragstart", function(){
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                })
                .on("dragend", function(){  if(d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);  })
                .on("drag", function() {
                    legend_root.attr('transform', 'translate(' + [-xpos + d3.event.x, -ypos + d3.event.y] + ')');
                        });

    legend_root.node().querySelector("#move_legend").dispatchEvent(new MouseEvent("click"))

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
        tmp_class_name = ["legend_feature", "lgdf_" + layer].join(' '),
        nb_class = current_layers[layer].colors_breaks.length;

    var legend_root = map.insert('g').attr('id', 'legend_root').attr("class", tmp_class_name);

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
        .on('click', function(){ createlegendEditBox('legend_root', layer); });

    let data_colors_label = current_layers[layer].colors_breaks.map(obj => {
        return {value: obj[0], color: obj[1]};  });

    var legend_elems = legend_root.selectAll('.legend')
                                  .append("g")
                                  .data(data_colors_label)
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
      .style('fill', function(d) { return d.color; })
      .style('stroke', function(d) { return d.color; });

    legend_elems
      .append('text')
      .attr("x", xpos + boxwidth * 2 + boxgap)
      .attr("y", function(d, i){
        return y_pos2 + (i * boxgap) + (i+2/3) * boxheight;
        })
      .style({'alignment-baseline': 'middle' , 'font-size':'10px'})
      .text(function(d) { return d.value; });

    var drag_lgd = d3.behavior.drag()
                .on("dragstart", function(){
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                    })
                .on("dragend", function(){  if(d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);  })
                .on("drag", function() {
                    legend_root.attr('transform', 'translate(' + [-xpos + d3.event.x, -ypos + d3.event.y] + ')');
                    });

    legend_root.append("g").attr("class", "legend_feature")
            .insert("text").attr("id", "legend_bottom_note")
            .attr({x: xpos, y: last_pos + 2*boxheight})
            .html('');

    legend_root.node().querySelector("#move_legend").dispatchEvent(new MouseEvent("click"))
}

function createlegendEditBox(legend_id, layer_name){
    let box_class = [layer_name, "_legend_popup"].join(''),
        legend_node = document.getElementById(legend_id),
        title_content = legend_node.querySelector("#legendtitle"),
        subtitle_content = legend_node.querySelector("#legendsubtitle"),
        note_content = legend_node.querySelector("#legend_bottom_note"),
        source_content = document.getElementById("source_block");

    let original_params = {
        title_content: title_content.textContent, subtitle_content: subtitle_content.textContent,
        note_content: note_content.textContent, source_content: source_content.textContent
        };

    make_confirm_dialog("", "Confirm", "Cancel", "Layer style options", box_class, undefined, undefined, true)
        .then(function(confirmed){
            if(!confirmed){
                title_content.textContent = original_params.title_content;
                subtitle_content.textContent = original_params.subtitle_content;
                note_content.textContent = original_params.note_content;
                source_content.textContent = original_params.source_content;
            }
        });

    var box_body = d3.select([".", box_class].join('')),
        current_nb_dec,
        legend_boxes = d3.selectAll(["#", legend_id, " .lg"].join('')).select("text");

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

    if(legend_boxes[0].length > 0){
        // Float precision for label in the legend
        // (actually it's not really the float precision but an estimation based on
        // the string representation of only two values but it will most likely do the job in many cases)
        let first_value = (legend_id.indexOf("2") === -1)
                            ? legend_boxes[0][0].__data__.value.split(" - ")[0]
                            : String(legend_boxes[0][0].__data__.value),
            fourth_value = (legend_id.indexOf("2") === -1)
                            ? legend_boxes[0][1].__data__.value.split(" - ")[1]
                            : String(legend_boxes[0][4].__data__.value),
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
            if(legend_id === "legend_root" || legend_id === "legend_root_links")
                box_body.append('input')
                    .attr({id: "precision_range", type: "range", min: 0, max: max_nb_decimal, step: 1, value: current_nb_dec})
                    .style("display", "inline")
                    .on('change', function(){
                        let nb_float = +this.value,
                            dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                        d3.select("#precision_change_txt")
                            .html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                        for(let i = 0; i < legend_boxes[0].length; i++){
                            let values = legend_boxes[0][i].__data__.value.split(' - ');
                            legend_boxes[0][i].innerHTML = [Math.round(+values[0] * dec_mult) / dec_mult, " - ", Math.round(+values[1] * dec_mult) / dec_mult].join('');
                        }
                    });
            else if(legend_id === "legend_root2")
                box_body.append('input')
                    .attr({id: "precision_range", type: "range", min: 0, max: max_nb_decimal, step: 1, value: current_nb_dec})
                    .style("display", "inline")
                    .on('change', function(){
                        let nb_float = +this.value,
                            dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                        d3.select("#precision_change_txt")
                            .html(['Floating number rounding precision<br> ', nb_float, ' '].join(''))
                        for(let i = 0; i < legend_boxes[0].length; i++){
                            let value = legend_boxes[0][i].__data__.value;
                            legend_boxes[0][i].innerHTML = String(Math.round(+value * dec_mult) / dec_mult);
                        }
                    });
        }
    }

    box_body.insert('p').html('Additionnal legend notes<br>')
            .insert('input').attr("value", note_content.textContent)
            .style("font-family", "12px Gill Sans Extrabold, sans-serif")
            .on("keyup", function(){
                note_content.textContent = this.value;
            });

    box_body.insert('p').html('Source/authors informations:<br>')
            .insert('input').attr("value", "Rendered by MAPOLOGIC")
            .style("font", "italic 10px Gill Sans Extrabold, sans-serif")
            .on("keyup", function(){
                source_content.textContent = this.value;
            });
}
