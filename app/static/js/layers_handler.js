function handle_click_layer(layer_name){
    console.log(layer_name);
    var  popid = layer_name
            ,modal = createModalBox(popid);
//    modalback.className = 'active';
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
    //qs('#showanswer').innerHTML = 'waiting for response...';
   return center(modal);
};

var qs = function(str){
    return document.querySelector(str);
};
var trim = function(s){
    return s.replace(/^\s+|\s+$/,'');
};

function createModalBox(modalid,html){
     var nwBox = document.createElement('div');
     var bg = document.createElement('div');
     bg.className = 'overlay';
     nwBox.id = modalid;
     nwBox.className = 'popup';
     nwBox.innerHTML = ['<script  src="/static/js/jscolor.js"></script><b>Layer formating options</b>',
                        '<p>Rectangle color:',
                        '<input class="jscolor" onchange="update_layer_color(this.jscolor, modalid)" value="cc66ff">',
                        '<script>function update_layer_color(jscolor, layer_name) {console.log("The new color should be " + "#" + jscolor)}</script>',
                        '<br><br><br><b>Validate ?</b>',
                        '<p><button id="yes">yep</button>',
                        '&nbsp;<button id="no">nope</button></p>'].join('');
     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);
     qs('#yes').onclick=function(){
        console.log(this)
         deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
         // deactivate(function(){qs('#showanswer').innerHTML = 'you clicked nope!';},nwBox);
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
     ,l = Math.floor((0.5*dims.width))
     ,h = Math.floor((0.5*dims.height));
  el.style.left= l+'px';
  el.style.top =  h+'px';
  return true;
}
