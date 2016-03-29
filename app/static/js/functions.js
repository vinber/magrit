function get_menu_option(func){
    var menu_option = {
        "stewart":{
            "title":"Stewart potentials",
            "desc":"Compute stewart potentials...",
            "fields":[["select","Variable name", "self.name"],
                      ["input","Span (meters)"],
                      ["input","Beta"],
                      ["list","Function type", ["Pareto", "Exponential"]],
                      ["input","Resolution (meters)"],
                      ["input","Number of class (opt.)"]]
            },
        "test":{
            "title":"No functionnality provided here",
            "desc":"Really nothing.."
            },
        "prop_symbol":{
            "title":"Proportional symbols",
            "desc":"....."
            }
    };
    return menu_option[func] || {}
}



function popup_function(){
    var layer_name = Object.getOwnPropertyNames(user_data);

/*  var dia = document.createElement("div")
    dia.id = "dialog";
    dia.innerHTML = "fOO";
    document.body.appendChild(dia);
    $( "#dialog" ).dialog();
*/

    if(!(layer_name.length === 1)){
        alert("You shouldn't be able to arrive here")
        return;
    }

    layer_name = layer_name[0];

    var popid = layer_name,
        modal = createFuncOptionsBox(popid);

    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
    return center(modal);
};

function createFuncOptionsBox(modalid){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(modalid);

     var geom_layer_fields = Object.getOwnPropertyNames(user_data[modalid][0]),
         ext_dataset_fields = Object.getOwnPropertyNames(joined_dataset[0][0]);

     bg.className = 'overlay';
     nwBox.id = modalid;
     nwBox.className = 'popup';
     var in_html = ['<!DOCTYPE html>',
                        '<p style="font:16px bold;text-align:center">', menu_option.title, '</p><br>',
                        '<p><b>', menu_option.desc, '</b></p>'];

/*
    if(menu_option.fields){
        for(var i=0, len = menu_option.fields.length; i < len; i++){
            var curr_field = menu_option.fields[i];
            var elem = dv2.append('p').html(curr_field[1]);
        
            if(curr_field[0] === "list"){
                elem.html(elem.html() + "<br>");
                for(var j=0, lengt = curr_field[2].length; j < lengt; j++){
                    elem.append("input")
                        .attr("id","form_"+curr_field[1])
                        .attr("value", curr_field[2][j])
                        .attr("name", curr_field[2][j])
                        .attr("type", "radio").style("align", "center");
                    elem.append("p").html(curr_field[2][j]).style("display", "inline");
                    }
            } else  {
                var p = elem.append(curr_field[0]).attr("id","form_"+curr_field[1]).style("align", "center").on("change", function(){alert("Error : not implemented")})
            }
        }
    }
*/

    in_html = in_html.concat(['<p><button id="yes">Compute</button>',
                              '&nbsp;<button id="no">Cancel</button></p>'])
    console.log(in_html);
    nwBox.innerHTML = Array.prototype.join.call(in_html, '');

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

     qs('#yes').onclick=function(){
         deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}

