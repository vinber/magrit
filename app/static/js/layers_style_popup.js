function handle_click_layer(layer_name){
     var layer_name_split = layer_name.split(' - ');

     if(layer_name_split.length == 2) layer_name = layer_name_split[1].trim();
     else if(layer_name_split.length > 2) console.log('Oups..');

    if(current_layers[layer_name].renderer && strContains(current_layers[layer_name].renderer, "PropSymbol"))
        var modal = createStyleBox_ProbSymbol(layer_name);
    else
        var modal = createStyleBox(layer_name);
        if(!modal) return;
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
   return center(modal);
};

function createStyleBox(layer_name){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         type = current_layers[layer_name].type;

     if(current_layers[layer_name].renderer !== undefined){
         rep = confirm("The selected layer seems to have been already rendered (with " + current_layers[layer_name].renderer + " method). Want to continue ?");
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

     if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
     if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

     console.log([current_layers[layer_name].targeted, current_layers[layer_name], layer_name]);

     bg.className = 'overlay';
     nwBox.id = layer_name + "_style_popup";
     nwBox.className = 'popup';
     nwBox.innerHTML = "";
     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);
     var popup = d3.select(["#", layer_name, "_style_popup"].join(''));
     popup.append('h4').style({"font-size": "16px", "text-align": "center", "font-weight": "bold"}).html("Layer style option");
     popup.append("p").html(['<br>Layer name : <b>', layer_name,'</b><br>',
                             'Geometry type : <b><i>', type, '</b></i>'].join(''));

     if(type !== 'Line'){
        if(current_layers[layer_name].colors_breaks == undefined){
             popup.append('p').html('Fill color<br>')
                              .insert('input').attr('type', 'color').attr("value", fill_prev)
                              .on('change', function(){d3.select(g_lyr_name).selectAll("path").style("fill", this.value)});
         } else {
            var fields = type_col(layer_name, "number")
            var field_selec = popup.append('p').html('Field :').insert('select').attr('class', 'params');
            fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });

             popup.append('p').style("margin", "auto").html("")
                .append("button").html("Display and arrange class")
                .on("click", function(){
                    display_discretization(layer_name, field_selec.node().value, current_layers[layer_name].colors_breaks.length, "Quantiles")
                        .then(function(confirmed){
                            if(confirmed){
                                console.log(confirmed);
                                let colorsByFeatures = confirmed[4];
                                selection.style('fill-opacity', 0.9)
                                         .style("fill", function(d, i){ return colorsByFeatures[i] })
//                                        nb_class:rendering_params confirmed[0], type: confirmed[1],
//                                        breaks: confirmed[2], colors:confirmed[3],
//                                        colorsByFeature: confirmed[4], renderer:"Choropleth"
//                                    }
                            }
                        });
                });

         }
         popup.append('p').html('Fill opacity<br>')
                          .insert('input').attr('type', 'range')
                          .attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", opacity)
                          .on('change', function(){selection.style('fill-opacity', this.value)});
    } else if (type === "Line" && current_layers[layer_name].renderer == "Links"){
        let max_val = 0,
            previous_stroke_opacity = selection.style("stroke-opacity");
        selection.each(function(d){if(d.properties.fij > max_val) max_val = d.properties.fij;})
        popup.append('p').html('Only display flows larger than ...')
                        .insert('input').attr({type: 'range', min: 0, max: max_val, step: 0.5})
                        .on("change", function(){
                        selection.each(function(d, i){selection.transition(45).style("stroke-opacity", (d.properties.fij < this.value) ? 0 : previous_stroke_opacity)})
                        });
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

     popup.append('button').attr('id', 'yes').text('Apply')
     popup.append('button').attr('id', 'no').text('Close without saving');

    qs('#yes').onclick=function(){
        if(stroke_width != current_layers[layer_name]['stroke-width-const'])
            current_layers[layer_name].fixed_stroke = true;
        sendPreferences();
        deactivate([nwBox, bg]);
    }
    qs('#no').onclick=function(){
         deactivate([nwBox, bg]);

         selection.style('fill-opacity', opacity)
                     .style('stroke-opacity', border_opacity);
         d3.select(g_lyr_name).style('stroke-width', stroke_width);
         current_layers[layer_name]['stroke-width-const'] = stroke_width;
         if(current_layers[layer_name].renderer === undefined)
             selection.style('fill', fill_prev)
                     .style('stroke', stroke_prev);
         else
            selection.style('fill-opacity', 0.9)
                   .style("fill", function(d, i){ return current_layers[layer_name].colors[i] })
                   .style('stroke-opacity', 0.9)
                   .style("stroke", function(d, i){ return current_layers[layer_name].colors[i] });
    }
    zoom_without_redraw();
    return nwBox;
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
     var nwBox = document.createElement('div'),
         bg = document.createElement('div');

     var g_lyr_name = "#" + layer_name,
         ref_layer_name = layer_name.substring(0, layer_name.indexOf("_Prop")),
         type_symbol = current_layers[layer_name].symbol,
         field_used = current_layers[layer_name].rendered_field,
         selection = d3.select(g_lyr_name).selectAll(type_symbol);

     console.log([current_layers[layer_name].targeted, current_layers[layer_name], layer_name]);

     var stroke_prev = selection.style('stroke'),
         fill_prev = selection.style("fill"),
         opacity = selection.style('fill-opacity'),
         border_opacity = selection.style('stroke-opacity'),
         stroke_width = selection.style('stroke-width');

     if(fill_prev.startsWith("rgb")) fill_prev = rgb2hex(fill_prev)
     if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
     if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

    var d_values = [],
        comp = function(a, b){return b-a};
    for(let i = 0, i_len = user_data[ref_layer_name].length; i < i_len; ++i)
        d_values.push(+user_data[ref_layer_name][i][field_used]);

    d_values.sort(comp);

     bg.className = 'overlay';
     nwBox.id = layer_name + "_style_popup";
     nwBox.className = 'popup';
     nwBox.innerHTML = "";
     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);
     var popup = d3.select(["#", layer_name, "_style_popup"].join(''));
     popup.append('h4').style({"font-size": "16px", "text-align": "center", "font-weight": "bold"}).html("Layer style option");
     popup.append("p").html(['<br>Rendered layer : <b>', ref_layer_name,'</b><br>'].join(''));

     popup.append('p').html('Symbol color<br>')
         .insert('input').attr('type', 'color').attr("value", fill_prev)
         .on('change', function(){selection.style("fill", this.value)});
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

     popup.append('p').html('Symbol max size<br>')
                      .insert('input').attr("type", "range").attr({min: 1, max: 50, step: 0.1, value: current_layers[layer_name].size[1]})
                      .on("change", function(){
                        let prop_values = prop_sizer(d_values, Number(current_layers[layer_name].size[0] / zoom.scale()), Number(this.value / zoom.scale()));
                        console.log(prop_values);
                        if(type_symbol === "circle") {
                            for(let i=0, len = prop_values.length; i < len; i++){
                                selection[0][i].setAttribute('r', +current_layers[layer_name].size[0] / zoom.scale() + prop_values[i])
                            }
                        } else if(type_symbol === "rect") {
                            for(let i=0, len = prop_values.length; i < len; i++){
                                let sz = +current_layers[layer_name].size[0] / zoom.scale() + prop_values[i],
                                    old_size = +selection[0][i].getAttribute('height'),
                                    centr = [+selection[0][i].getAttribute("x") + (old_size/2) - (sz / 2),
                                             +selection[0][i].getAttribute("y") + (old_size/2) - (sz / 2)];

                                selection[0][i].setAttribute('x', centr[0]);
                                selection[0][i].setAttribute('y', centr[1]);
                                selection[0][i].setAttribute('height', sz);
                                selection[0][i].setAttribute('width', sz);
                            }
                        }
                      })
     popup.append('button').attr('id', 'yes').text('Apply')
     popup.append('button').attr('id', 'no').text('Close without saving');

    qs('#yes').onclick=function(){
        sendPreferences();
        deactivate([nwBox, bg]);
    }
    qs('#no').onclick=function(){
         deactivate([nwBox, bg]);

         selection.style('fill-opacity', opacity)
                .style('stroke-opacity', border_opacity)
                .style('stroke-width', stroke_width + "px")
                .style('fill', fill_prev)
                .style('stroke', stroke_prev);
         current_layers[layer_name]['stroke-width-const'] = stroke_width + "px";
    }
    zoom_without_redraw();
    return nwBox;
}
