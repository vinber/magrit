function handle_click_layer(layer_name){
    console.log(layer_name);
    var popid = layer_name,
        modal = createModalBox(popid);
//    modalback.className = 'active';
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
   return center(modal);
};

var qs = function(str){
    return document.querySelector(str);
};

function createModalBox(modalid, html){
     var nwBox = document.createElement('div');
     var bg = document.createElement('div');
     var modalid_split = modalid.split(' - ');

     if(modalid_split.length == 2) modalid = modalid_split[1];
     else if(modalid_split.length > 2) console.log('Oups..');

     var g_lyr_name = "#"+trim(modalid);

     var opacity = d3.select(g_lyr_name).selectAll("path").style('fill-opacity');
     var fill_prev = d3.select(g_lyr_name).selectAll("path").style('fill');
     if(fill_prev.startsWith("rgb")) fill_prev = rgb2hex(fill_prev)
     var stroke_prev = d3.select(g_lyr_name).selectAll("path").style('stroke');
     if(stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev)
     var border_opacity = d3.select(g_lyr_name).selectAll("path").style('stroke-opacity');
     var stroke_width = d3.select(g_lyr_name).selectAll("path").style('stroke-width');
     if(stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0,stroke_width.length-2);

     bg.className = 'overlay';
     nwBox.id = modalid;
     nwBox.className = 'popup';
     nwBox.innerHTML = ['<!DOCTYPE html>',
                        '<p style="font:16px bold;text-align:center">Layer formating options</p><br>',
                        'Layer name : <p style="font: 14px courrier bold; display:inline;">', modalid, '<br>',
                        '<p>Fill color&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                        '<input id="fill_color_lyr" type="color" value="', fill_prev, '"></button>',
                        '<p>Border color&nbsp;&nbsp;<input id="border_color_lyr" type="color" value="', stroke_prev, '"></button>',
                        '<p>Layer opacity <input id="opacity", step="0.01" max="1" min="0" type="range" value="', opacity, '"></input>',
                        '<p>Border opacity <input id="border_opacity", step="0.01" max="1" min="0" type="range" value="',border_opacity, '"></input>',
                        '<p>Border width (px)<input id="border_width" type="number" step="0.5" min="0.0" max="15" value="', stroke_width,'"></input>',
                        '<br><br><br><p style="text-align:center;font: bold">Satisfied by new style ?</p>',
                        '<p><button id="yes">Close and apply</button>',
                        '&nbsp;<button id="no">Close and rollback</button></p>'].join('');

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);
     d3.select('#opacity').on('change', function(){d3.select(g_lyr_name).selectAll("path").style('fill-opacity', this.value)});
     d3.select('#border_opacity').on('change', function(){d3.select(g_lyr_name).selectAll("path").style('stroke-opacity', this.value)});
     d3.select('#fill_color_lyr').on('change', function(){d3.select(g_lyr_name).selectAll("path").style("fill", this.value)});
     d3.select('#border_color_lyr').on('change', function(){d3.select(g_lyr_name).selectAll("path").style("stroke", this.value)});
     d3.select('#border_width').on('change', function(){d3.select(g_lyr_name).selectAll("path").style("stroke-width", this.value+"px")});

     qs('#yes').onclick=function(){
         deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
         d3.select(g_lyr_name).selectAll("path").style('fill-opacity', opacity);
         d3.select(g_lyr_name).selectAll("path").style('fill', fill_prev);
         d3.select(g_lyr_name).selectAll("path").style('stroke', stroke_prev);
         d3.select(g_lyr_name).selectAll("path").style('stroke-opacity', border_opacity);
         d3.select(g_lyr_name).selectAll("path").style('stroke-width', stroke_width);

     }
     return nwBox;
}

function deactivate(forpopup){
    for(var i=0; i<forpopup.length; i++){
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
  var dims = viewport()
     ,l = Math.floor((0.75*dims.width))
     ,h = Math.floor((0.20*dims.height));
  el.style.left= l+'px';
  el.style.top =  h+'px';
  return true;
}

function rgb2hex(rgb){
// From http://jsfiddle.net/mushigh/myoskaos/
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}
