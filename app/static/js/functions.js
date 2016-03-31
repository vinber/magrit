function get_menu_option(func){
    var menu_option = {
        "stewart":{
            "title":"Stewart potentials",
            "desc":"Compute stewart potentials...",
            "fields":[["select","Variable name", "self.name"],
                      ["input","Span (meters)"],
                      ["input","Beta"],
                      ["list","Function type",["Pareto", "Exponential"]],
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

    if(!(layer_name.length === 1)){
        alert("You shouldn't be able to arrive here")
        return;
    }

    layer_name = layer_name[0];

    var popid = layer_name,
        modal = createFuncOptionsBox_Stewart(popid);

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

function createFuncOptionsBox_Stewart(layer){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(layer),
         fields = Object.getOwnPropertyNames(user_data[layer][0]);

     bg.className = 'overlay';
     nwBox.id = [layer, '_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_popup'].join(''));
    dialog_content.append('h3').html('Stewart potentials');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
    var span = dialog_content.append('p').html('Span :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 0).attr("min", 0).attr("max", 100000).attr("step", 0.1).html('Span');
    var beta = dialog_content.append('p').html('Beta :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 0).attr("min", 0).attr("max", 10).attr("step", 0.1).html('Beta');
    var resolution = dialog_content.append('p').html('Resolution :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 0).attr("min", 0).attr("max", 100000).attr("step", 0.1).html('Resolution');
    var func_selec = dialog_content.append('p').html('Function type :').insert('select').attr('class', 'params');
    ['Exponential', 'Pareto'].forEach(function(fun_name){func_selec.append("option").text(fun_name).attr("value", fun_name);});
    dialog_content.append('button').attr('id', 'yes').text('Compute')
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        console.log([field_selec.node().value, span.node().value, beta.node().value, func_selec.node().value, resolution.node().value]);
        var formToSend = new FormData();
        var field_values = new Object();
        field_values[field_selec] = [];
        for(var i=0, lng = user_data[layer].length; i<lng; i++){ field_values[field_selec][i].push(user_data[layer][i][field_selec]); }
        formToSend.append("json", JSON.stringify({
            "topojson": targeted_topojson,
            "var_name": field_selec.node().value,
            "span": span.node().value,
            "beta": beta.node().value,
            "type_fun": func_selec.node().value,
            "resolution": resolution.node().value}))
        $.ajax({
            processData: false,
            contentType: false,
            cache: false,
            url: '/R_compute/stewart',
            data: formToSend,
            type: 'POST',
            error: function(error) { console.log(error); },
            success: function(data){ console.log(data) ; }
        });

        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}

