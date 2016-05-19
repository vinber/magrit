"use strict";

function handle_click_layer(layer_name){
    var layer_name_split = layer_name.split(' - ');

    if(layer_name_split.length == 2) layer_name = layer_name_split[1].trim();
    else if(layer_name_split.length > 2) console.log('Oups..');

    if(current_layers[layer_name].renderer && strContains(current_layers[layer_name].renderer, "PropSymbol"))
        createStyleBox_ProbSymbol(layer_name);
    else
        createStyleBox(layer_name);

    return;
};


function createStyleBox(layer_name){
    var type = current_layers[layer_name].type,
        rendering_params = null,
        renderer = current_layers[layer_name].renderer;

    if(renderer !== undefined){
        let rep = confirm("The selected layer seems to have been already rendered (with " + renderer + " method). Want to continue ?");
        // Todo : do not ask this but display a choice of palette instead
        if(!rep) return undefined;
    }

    var g_lyr_name = "#" + layer_name,
        selection = d3.select(g_lyr_name).selectAll("path"),
        opacity = selection.style('fill-opacity');

    if(current_layers[layer_name].colors_breaks != undefined){
        var fill_prev = current_layers[layer_name].colors;
     } else {
         var fill_prev = selection.style('fill');
         if(fill_prev.startsWith("rgb")) fill_prev = rgb2hex(fill_prev)
     }

    var stroke_prev = selection.style('stroke'),
        border_opacity = selection.style('stroke-opacity'),
        stroke_width = current_layers[layer_name]['stroke-width-const'];

    console.log(stroke_prev)
    if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
    if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

    make_confirm_dialog("", "Save", "Close without saving", "Layer style options", "styleBox", undefined, undefined, true)
        .then(function(confirmed){
            if(confirmed){
                // Update the object holding the properties of the layer if Yes is clicked
                if(stroke_width != current_layers[layer_name]['stroke-width-const'])
                    current_layers[layer_name].fixed_stroke = true;
                if(current_layers[layer_name].renderer != undefined && rendering_params != undefined){
                    current_layers[layer_name].colors = rendering_params.colorsByFeature;
                    let colors_breaks = [];
                    for(let i = 0; i<rendering_params['breaks'].length-1; ++i)
                        colors_breaks.push([rendering_params.breaks[i] + " - " + rendering_params.breaks[i+1], rendering_params.colors[i]]);
                    current_layers[layer_name].colors_breaks = colors_breaks;
                    current_layers[layer_name].rendered_field = rendering_params.field;
                    // Also change the legend if there is one displayed :
                    let lgd_choro = d3.select("#legend_root").node();
                    if(lgd_choro){
                        lgd_choro.remove();
                        createLegend_choro(layer_name, rendering_params.field);
                    }
                    if(current_layers[layer_name].rendered_field && current_layers[layer_name].renderer != "Gridded")
                        field_selec.node().selectedOption = current_layers[layer_name].rendered_field;
                }
                sendPreferences();
                zoom_without_redraw();
                console.log(stroke_prev)
            } else {
                // Reset to original values the rendering parameters if "no" is clicked
                selection.style('fill-opacity', opacity)
                             .style('stroke-opacity', border_opacity);
                d3.select(g_lyr_name).style('stroke-width', stroke_width);
                current_layers[layer_name]['stroke-width-const'] = stroke_width;
                if(renderer === undefined) {
                    selection.style('fill', fill_prev)
                             .style('stroke', stroke_prev);
                } else if(renderer != "Links") {
                    selection.style('fill-opacity', opacity)
                           .style("fill", function(d, i){ return current_layers[layer_name].colors[i] })
                           .style('stroke-opacity', previous_stroke_opacity)
                           .style("stroke", stroke_prev);
                } else {
                    selection.style('stroke-opacity', function(d, i){ return current_layers[layer_name].linksbyId[i][0]})
                           .style("stroke", stroke_prev);
                }
                zoom_without_redraw();
                console.log(stroke_prev);
            }
    });

     var popup = d3.select(".styleBox");
     popup.append('h4').style({"font-size": "15px", "text-align": "center", "font-weight": "bold"}).html("Layer style option");
     popup.append("p").html(['Layer name : <b>', layer_name,'</b><br>',
                             'Geometry type : <b><i>', type, '</b></i>'].join(''));

     if(type !== 'Line'){
        if(current_layers[layer_name].colors_breaks == undefined){
             popup.append('p').html('Fill color<br>')
                              .insert('input').attr('type', 'color').attr("value", fill_prev)
                              .on('change', function(){d3.select(g_lyr_name).selectAll("path").style("fill", this.value)});
         } else {
            let field_to_discretize;
            if(renderer == "Gridded"){
                field_to_discretize = "densitykm";
            } else {
                var fields = type_col(layer_name, "number"),
                    field_selec = popup.append('p').html('Field :').insert('select').attr('class', 'params').on("change", function(){ field_to_discretize = this.value; });
                field_to_discretize = fields[0];
                fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
            }

             popup.append('p').style("margin", "auto").html("")
                .append("button").html("Display and arrange class")
                .on("click", function(){
                    display_discretization(layer_name, field_to_discretize, current_layers[layer_name].colors_breaks.length, "Quantiles")
                        .then(function(confirmed){
                            console.log(confirmed);
                            if(confirmed){
                                rendering_params = {
                                    nb_class: confirmed[0],
                                    type: confirmed[1],
                                    breaks: confirmed[2],
                                    colors:confirmed[3],
                                    colorsByFeature: confirmed[4],
                                    renderer:"Choropleth",
                                    field: field_to_discretize
                                };
                                selection.style('fill-opacity', 0.9)
                                         .style("fill", function(d, i){ return rendering_params.colorsByFeature[i] })
                            }
                        });
                });
         }
         popup.append('p').html('Fill opacity<br>')
                          .insert('input').attr('type', 'range')
                          .attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", opacity)
                          .on('change', function(){selection.style('fill-opacity', this.value)});
    } else if (type === "Line" && renderer == "Links"){
        let max_val = 0,
            previous_stroke_opacity = selection.style("stroke-opacity");
        selection.each(function(d){if(d.properties.fij > max_val) max_val = d.properties.fij;})
        popup.append('p').html('Only display flows larger than ...')
                        .insert('input').attr({type: 'range', min: 0, max: max_val, step: 0.5, value: 0})
                        .on("change", function(){
                            let val = this.value;
                            d3.select("#larger_than").html(["<i> ", val, " </i>"].join(''));
                            selection.style("stroke-opacity", function(d, i){
                                if(+d.properties.fij > +val){
                                    console.log(d.properties);
                                    return 1;
                                }
                                else return 0;
                            });
                        });
        popup.append('label').attr("id", "larger_than").html('<i> 0 </i>')
     }

     popup.append('p').html(type === 'Line' ? 'Color<br>' : 'Border color<br>')
                      .insert('input').attr('type', 'color').attr("value", stroke_prev)
                      .on('change', function(){selection.style("stroke", this.value)});
     popup.append('p').html(type === 'Line' ? 'Opacity<br>' : 'Border opacity<br>')
                      .insert('input').attr('type', 'range').attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", border_opacity)
                      .on('change', function(){selection.style('stroke-opacity', this.value)});
     popup.append('p').html(type === 'Line' ? 'Width (px)<br>' : 'Border width<br>')
                      .insert('input').attr('type', 'number').attr("value", stroke_width).attr("step", 0.1)
                      .on('change', function(){d3.select(g_lyr_name).style("stroke-width", this.value+"px");current_layers[layer_name]['stroke-width-const'] = this.value+"px"});
}


function deactivate(forpopup){
    for(var i=0; i < forpopup.length; i++){
        var elem = forpopup[i];
        elem.remove();
    }
}

function viewport(){
    var  innerw = window.innerWidth
        ,body   = document.documentElement || document.body
        ,root   = innerw  ? window : body
        ,which  = innerw ? 'inner' : 'client';
    return {  width : root[ which+'Width' ] 
             ,height : root[ which+'Height' ]
             ,scrollTop: body.scrollTop 
             ,scrollLeft: body.scrollLeft };
}

function center(el){
  var dims = viewport(),
      h = Math.floor((0.20*dims.height));
  el.style.right= '0px';
  el.style.top =  h+'px';
  return true;
}

function createStyleBox_ProbSymbol(layer_name){
    var g_lyr_name = "#" + layer_name,
        ref_layer_name = current_layers[layer_name].ref_layer_name || layer_name.substring(0, layer_name.indexOf("_Prop")),
        type_method = current_layers[layer_name].renderer,
        type_symbol = current_layers[layer_name].symbol,
        field_used = current_layers[layer_name].rendered_field,
        selection = d3.select(g_lyr_name).selectAll(type_symbol);

     console.log([current_layers[layer_name].targeted, current_layers[layer_name], layer_name]);

     var stroke_prev = selection.style('stroke'),
         opacity = selection.style('fill-opacity'),
         border_opacity = selection.style('stroke-opacity'),
         stroke_width = selection.style('stroke-width');

    if(type_method == "PropSymbolsChoro"){
        var fill_prev = current_layers[layer_name].colors;

    }
    else {
        var fill_prev = selection.style("fill");
        if(fill_prev.startsWith("rgb")) fill_prev = rgb2hex(fill_prev)
    }
     
    if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
    if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

    make_confirm_dialog("", "Save", "Close without saving", "Layer style options", "styleBox", undefined, undefined, true)
        .then(function(confirmed){
            if(confirmed){
                let max_val = d3.select("#max_size_range").node().value;
                current_layers[layer_name].size[1] = max_val;
                if(type_method === "PropSymbolsChoro"){
                    current_layers[layer_name].colors = rendering_params.colorsByFeature;
                    let colors_breaks = [];
                    for(let i = 0; i<rendering_params['breaks'].length-1; ++i)
                        colors_breaks.push([rendering_params.breaks[i] + " - " + rendering_params.breaks[i+1], rendering_params.colors[i]]);
                    current_layers[layer_name].colors_breaks = colors_breaks;
                    current_layers[layer_name].rendered_field = rendering_params.field;
                    // Also change the legend if there is one displayed :
                    let lgd_choro = d3.select("#legend_root").node();
                    if(lgd_choro){
                        lgd_choro.remove();
                        createLegend_choro(layer_name, rendering_params.field);
                    }
                }
            } else {
                 selection.style('fill-opacity', opacity)
                        .style('stroke-opacity', border_opacity)
                        .style('stroke-width', stroke_width + "px")
                        .style('fill', fill_prev)
                        .style('stroke', stroke_prev);
                 current_layers[layer_name]['stroke-width-const'] = stroke_width + "px";
            }
            zoom_without_redraw();
        });

    var d_values = [],
        comp = function(a, b){return b-a};
    for(let i = 0, i_len = user_data[ref_layer_name].length; i < i_len; ++i)
        d_values.push(+user_data[ref_layer_name][i][field_used]);

    d_values.sort(comp);

    var popup = d3.select(".styleBox");
    popup.append('h4').style({"font-size": "15px", "text-align": "center", "font-weight": "bold"}).html("Layer style option");
    popup.append("p").html(['Rendered layer : <b>', ref_layer_name,'</b><br>'].join(''));
    popup.append('p').html('Symbol color<br>');
    if(type_method === "PropSymbolsChoro"){
        let field_color = current_layers[layer_name].rendered_field2;
         popup.append('p').style("margin", "auto").html("Field used for symbol colors : <i>" + field_color + "</i><br>")
            .append("button").attr("class", "button_disc").html("Display and arrange class")
            .on("click", function(){display_discretization(ref_layer_name, field_color, current_layers[layer_name].colors_breaks.length, "Quantiles")
          .then(function(confirmed){
            if(confirmed){
                var rendering_params = {
                    nb_class: confirmed[0], type: confirmed[1],
                    breaks: confirmed[2], colors:confirmed[3],
                    colorsByFeature: confirmed[4], renderer:"PropSymbolsChoro",
                    field: field_color
                    };
                selection.style('fill-opacity', 0.9)
                         .style("fill", function(d, i){
                    let ft_id = +current_layers[layer_name].id_size_map[i]; return rendering_params.colorsByFeature[ft_id]; });
             }
            }); });
    } else {
        popup.insert('input').attr('type', 'color').attr("value", fill_prev)
             .on('change', function(){selection.style("fill", this.value)});
    }
    popup.append('p').html('Fill opacity<br>')
                      .insert('input').attr('type', 'range')
                      .attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", opacity)
                      .on('change', function(){selection.style('fill-opacity', this.value)});

    popup.append('p').html('Border color<br>')
                      .insert('input').attr('type', 'color').attr("value", stroke_prev)
                      .on('change', function(){selection.style("stroke", this.value)});
    popup.append('p').html('Border opacity<br>')
                      .insert('input').attr('type', 'range').attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", border_opacity)
                      .on('change', function(){selection.style('stroke-opacity', this.value)});
    popup.append('p').html('Border width<br>')
                      .insert('input').attr('type', 'number').attr("value", stroke_width).attr("step", 0.1)
                      .on('change', function(){selection.style("stroke-width", this.value+"px");current_layers[layer_name]['stroke-width-const'] = this.value+"px"});
    popup.append("p").html("Field used for proportionals values : <i>" + current_layers[layer_name].rendered_field + "</i>")
    popup.append('p').html('Symbol max size<br>')
                      .insert('input').attr("type", "range").attr({id: "max_size_range", min: 1, max: 50, step: 0.1, value: current_layers[layer_name].size[1]})
                      .on("change", function(){
                          let z_scale = zoom.scale(),
                              prop_values = prop_sizer(d_values, Number(current_layers[layer_name].size[0] / z_scale), Number(this.value / z_scale));

                          if(type_symbol === "circle") {
                              for(let i=0, len = prop_values.length; i < len; i++){
                                  selection[0][i].setAttribute('r', +current_layers[layer_name].size[0] / z_scale + prop_values[i])
                              }
                          } else if(type_symbol === "rect") {
                              for(let i=0, len = prop_values.length; i < len; i++){
                                  let sz = +current_layers[layer_name].size[0] / z_scale + prop_values[i],
                                      old_size = +selection[0][i].getAttribute('height'),
                                      centr = [+selection[0][i].getAttribute("x") + (old_size/2) - (sz / 2),
                                               +selection[0][i].getAttribute("y") + (old_size/2) - (sz / 2)];
                                  selection[0][i].setAttribute('x', centr[0]);
                                  selection[0][i].setAttribute('y', centr[1]);
                                  selection[0][i].setAttribute('height', sz);
                                  selection[0][i].setAttribute('width', sz);
                              }
                          }
                      });
}
