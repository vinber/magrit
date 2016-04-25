function handle_click_layer(layer_name){
    var popid = layer_name,
        modal = createStyleBox(popid);
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
   return center(modal);
};

function createStyleBox(layer_name){
     var nwBox = document.createElement('div');
     var bg = document.createElement('div');
     var layer_name_split = layer_name.split(' - ');

     if(layer_name_split.length == 2) layer_name = trim(layer_name_split[1]);
     else if(layer_name_split.length > 2) console.log('Oups..');

     var type = current_layers[layer_name].type;
     if(current_layers[layer_name].rendered !== undefined){
         rep = confirm("The selected layer seems to have been already rendered (with " + current_layers[layer_name].rendered + " method). Want to continue ?");
          // Todo : do not ask this but display a choice of palette instead
         if(!rep) return;
     }
     var g_lyr_name = "#" + layer_name;
     console.log([current_layers[layer_name].targeted, current_layers[layer_name], layer_name]);
     var opacity = d3.select(g_lyr_name).selectAll("path").style('fill-opacity');

     if(current_layers[layer_name].colors_breaks != undefined){
        var fill_prev = current_layers[layer_name].colors;
     } else {
         var fill_prev = d3.select(g_lyr_name).selectAll("path").style('fill');
         if(fill_prev.startsWith("rgb")) fill_prev = rgb2hex(fill_prev)
     }
     var stroke_prev = d3.select(g_lyr_name).selectAll("path").style('stroke');
     if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
     var border_opacity = d3.select(g_lyr_name).selectAll("path").style('stroke-opacity');
     var stroke_width = current_layers[layer_name]['stroke-width-const']
     if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length-2);

     bg.className = 'overlay';
     nwBox.id = layer_name + "_style_popup";
     nwBox.className = 'popup';
     nwBox.innerHTML = "";
     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);
     popup = d3.select(["#", layer_name, "_style_popup"].join(''));
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
                                var layer_to_render = d3.select(g_lyr_name).selectAll("path");
                                layer_to_render.style('fill-opacity', 0.9)
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
                          .on('change', function(){d3.select(g_lyr_name).selectAll("path").style('fill-opacity', this.value)});
    }

     popup.append('p').html(type === 'Line' ? 'Color<br>' : 'Border color<br>')
                      .insert('input').attr('type', 'color').attr("value", stroke_prev)
                      .on('change', function(){d3.select(g_lyr_name).selectAll("path").style("stroke", this.value)});
     popup.append('p').html(type === 'Line' ? 'Opacity<br>' : 'Border opacity<br>')
                      .insert('input').attr('type', 'range').attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", border_opacity)
                      .on('change', function(){d3.select(g_lyr_name).selectAll("path").style('stroke-opacity', this.value)});
     popup.append('p').html(type === 'Line' ? 'Width (px)<br>' : 'Border width<br>')
                      .insert('input').attr('type', 'number').attr("value", stroke_width).attr("step", 0.1)
                      .on('change', function(){d3.select(g_lyr_name).style("stroke-width", this.value+"px");current_layers[layer_name]['stroke-width-const'] = this.value+"px"});

     popup.append('button').attr('id', 'yes').text('Apply')
     popup.append('button').attr('id', 'no').text('Close without saving');

    qs('#yes').onclick=function(){
        sendPreferences();
        deactivate([nwBox, bg]);
    }
    qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
         var layer_to_render = d3.select(g_lyr_name).selectAll("path");
         layer_to_render.style('fill-opacity', opacity)
                     .style('stroke-opacity', border_opacity);
         d3.select(g_lyr_name).style('stroke-width', stroke_width);
         current_layers[layer_name]['stroke-width-const'] = stroke_width;
         if(current_layers[layer_name].rendered === undefined)
             layer_to_render.style('fill', fill_prev)
                     .style('stroke', stroke_prev);
         else
            layer_to_render.style('fill-opacity', 0.9)
                           .style("fill", function(d, i){ return current_layers[layer_name].colors[i] })
                           .style('stroke-opacity', 0.9)
                           .style("stroke", function(d, i){ return current_layers[layer_name].colors[i] });
    }
//    zoom_without_redraw();
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
