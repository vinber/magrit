function handle_join(){
    var layer_name = Object.getOwnPropertyNames(user_data);

    if(!(layer_name.length === 1 && joined_dataset.length === 1)){
        alert("Unable to join geometries and dataset")
        return;
    } else if(user_data[layer_name].length != joined_dataset[0].length){
        alert("The geometrie layer and the joined dataset doesn't have the same number of features");
        return;
    } else if(field_join_map.length!=0){
        var rep = confirm("A successful join is already selected. Forget and select a new one ?");
        if(!rep){ return; }
        else { field_join_map = []; }
    }

    layer_name = layer_name[0];

    var popid = layer_name,
        modal = createJoinBox(popid);

    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
    return center(modal);
};

function valid_join_on(layer_name, field1, field2){
    var join_values1 = [],
        join_values2 = [],
        val;

    for(var i=0, len=user_data[layer_name].length; i<len; i++){
        join_values1.push(user_data[layer_name][i][field1]);
        join_values2.push(joined_dataset[0][i][field2]);
    }

    if(join_values1===join_values2){
        for(var i=0, len=join_values1.length; i<len; i++) map_table.push(i);
    }
    else {
        if(typeof join_values1[0] === "number" && typeof join_values2[0] === "string"){
            for(var i=0, len=join_values1.length; i<len; i++){
                val = join_values2.indexOf(String(join_values1[i]));
                if(val != -1) { field_join_map.push(val); }
                else { break; }
            }
        } else if(typeof join_values2[0] === "number" && typeof join_values1[0] === "string"){
            for(var i=0, len=join_values1.length; i<len; i++){
                val = join_values1.indexOf(String(join_values2[i]));
                if(val != -1) { field_join_map.push(val); }
                else { break };
            }
        } else {
            for(var i=0, len=join_values1.length; i<len; i++){
                val = join_values2.indexOf(String(join_values1[i]));
                if(val != -1) { field_join_map.push(val); }
                else { break };
            }
        }
    }
    console.log(field_join_map);
    console.log([layer_name, field1, join_values1, field2, join_values2]);

    if(field_join_map.length === join_values1.length){
        var fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]);
        for(var i=0, len=join_values1.length; i<len; i++){
            for(var j=0, leng=fields_name_to_add.length; j<leng; j++){
                f_name = fields_name_to_add[j];
                val = field_join_map[i];
                user_data[layer_name][i][f_name] = joined_dataset[0][val][f_name];
                }
        }
        alert("boom!");
        return true;
    } else {
        field_join_map = [];
        alert("Missed...");
        return false;
    }
}

function createJoinBox(modalid, html){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(modalid);

     var geom_layer_fields = Object.getOwnPropertyNames(user_data[modalid][0]),
         ext_dataset_fields = Object.getOwnPropertyNames(joined_dataset[0][0]);

     var button1 = ["<select id=button_field1>"],
         button2 = ["<select id=button_field2>"];

     // Pretty ugly way to prepare the buttons:
     for(var i=0, len=geom_layer_fields.length; i<len; i++){
         button1.push(['<option value="', geom_layer_fields[i], '">', geom_layer_fields[i], '</option>'].join(''));
     }
     button1.push("</select>");
     button1 = button1.join('');

     for(var i=0, len=ext_dataset_fields.length; i<len; i++){
         button2.push(['<option value="', ext_dataset_fields[i], '">', ext_dataset_fields[i], '</option>'].join(''));
     }
     button2.push("</select>");
     button2 = button2.join('');

     bg.className = 'overlay';
     nwBox.id = modalid;
     nwBox.className = 'popup';
     nwBox.innerHTML = ['<!DOCTYPE html>',
                        '<p style="font:16px bold;text-align:center">Join option</p><br>',
                        'Layer name : <p style="font: 14px courrier bold; display:inline;">', modalid, '<br>',
                        '<p><b><i>Select fields on which operate the join :</i></b></p>',
                        '<p>Geometrie layer fields :', button1,
                        '<p>External dataset fields :', button2,
                        '<br><br><br><p style="text-align:center;font: bold">Join datasets ?</p>',
                        '<p><button id="yes">Apply</button>',
                        '&nbsp;<button id="no">Cancel</button></p>'].join('');

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

     qs('#yes').onclick=function(){
         var field1 = $("#button_field1 :selected").text(),
             field2 = $("#button_field2 :selected").text();
         valid_join_on(modalid, field1, field2);
         deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}
