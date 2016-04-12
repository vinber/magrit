function handle_click_layer(layer_name){
    console.log(layer_name);
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
         if(!rep) return;
     }
     var g_lyr_name = "#" + layer_name;
     console.log([current_layers[layer_name].targeted, current_layers[layer_name], layer_name]);
     var opacity = d3.select(g_lyr_name).selectAll("path").style('fill-opacity');
     var fill_prev = d3.select(g_lyr_name).selectAll("path").style('fill');
     if(fill_prev.startsWith("rgb")) fill_prev = rgb2hex(fill_prev)
     var stroke_prev = d3.select(g_lyr_name).selectAll("path").style('stroke');
     if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
     var border_opacity = d3.select(g_lyr_name).selectAll("path").style('stroke-opacity');
     var stroke_width = d3.select(g_lyr_name).selectAll("path").style('stroke-width');
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
         popup.append('p').html('Fill color<br>')
                          .insert('input').attr('type', 'color').attr("value", fill_prev)
                          .on('change', function(){d3.select(g_lyr_name).selectAll("path").style("fill", this.value)});
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
                      .on('change', function(){d3.select(g_lyr_name).selectAll("path").style("stroke-width", this.value+"px")});

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
                     .style('stroke-opacity', border_opacity)
                     .style('stroke-width', stroke_width);
         if(current_layers[layer_name].targeted === undefined)
             layer_to_render.style('fill', fill_prev)
                     .style('stroke', stroke_prev);
         else
            layer_to_render.style('fill-opacity', 0.9)
                           .style("fill", function(d, i){ return current_layers[layer_name].colors[i] })
                           .style('stroke-opacity', 0.9)
                           .style("stroke", function(d, i){ return current_layers[layer_name].colors[i] });
     }
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
