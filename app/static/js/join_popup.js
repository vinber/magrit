function handle_join(){
    var layer_name = Object.getOwnPropertyNames(user_data);
    console.log(layer_name)
    if(!(layer_name.length === 1 && joined_dataset.length === 1)){
        alert("Unable to join geometries and dataset")
        return;
    } else if(field_join_map.length != 0){
        make_confirm_dialog("A successful join is already selected. Forget and select a new one ?", "Ok", "Cancel", "").then(function(confirmed){
            if(confirmed){
                field_join_map = [];
                make_box(layer_name[0]);
                }
            });
    } else if(user_data[layer_name].length != joined_dataset[0].length){
        make_confirm_dialog("The geometrie layer and the joined dataset doesn't have the same number of features. Continue anyway ?", "Ok", "Cancel", "").then(function(confirmed){
            if(confirmed){ make_box(layer_name[0]); }
        });
    } else {
         make_box(layer_name[0]);
    }
}

function make_box(name){
    var modal = createJoinBox(name);
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
    return center(modal);
};

function valid_join_check_display(val, prop){
    if(!val){
        d3.select("#join_section").style('text-align', 'left')
            .html(['<img src="/static/img/Red_x.svg" alt="Non-validated join" style="width:18px;height:18px;">',
                   'Data not joined'].join(''));
        d3.select('#join_section').append("button").attr("id", "join_button").style('margin-left', '10%').html("Valid the join").on("click", handle_join);
    } else {
        d3.select("#join_section").style('text-align', 'left')
            .html(['<img src="/static/img/Light_green_check.svg" alt="Validated join" style="width:22px;height:22px;"><b>',
                   ' ', prop, ' matches</b>'].join(''))
        d3.select('#join_section').append("button").attr("id", "join_button").style('margin-left', '10%').html("Valid the join").on("click", handle_join);
    }
}

function valid_join_on(layer_name, field1, field2){
    var join_values1 = [],
        join_values2 = [],
        hits = 0, val = undefined;

    field_join_map = [];

    for(var i=0, len=joined_dataset[0].length; i<len; i++){
        join_values2.push(joined_dataset[0][i][field2]);
    }

    var join_set2 = new Set(join_values2);
    if(join_set2.size != join_values2.length){
        alert("The values on which operate have to be uniques");
        return;
    }

    for(var i=0, len=user_data[layer_name].length; i<len; i++){
        join_values1.push(user_data[layer_name][i][field1]);
    }

    var join_set1 = new Set(join_values1);
    if(join_set1.size != join_values1.length){
        alert("The values on which operate have to be uniques");
        return;
    }

    if(join_values1===join_values2){
        for(var i=0, len=join_values1.length; i<len; i++) map_table.push(i);
    } else {
        if(typeof join_values1[0] === "number" && typeof join_values2[0] === "string"){
            for(var i=0, len=join_values1.length; i<len; i++){
                val = join_values2.indexOf(String(join_values1[i]));
                if(val != -1) { field_join_map.push(val); hits++; }
                else { field_join_map.push(undefined); }
            }
        } else if(typeof join_values2[0] === "number" && typeof join_values1[0] === "string"){
            for(var i=0, len=join_values1.length; i<len; i++){
                val = join_values2.indexOf(Number(join_values1[i]));
                if(val != -1) { field_join_map.push(val); hits++; }
                else { field_join_map.push(undefined); }
            }
        } else {
            for(var i=0, len=join_values1.length; i<len; i++){
                val = join_values2.indexOf(String(join_values1[i]));
                if(val != -1) { field_join_map.push(val); hits++; }
                else { field_join_map.push(undefined); }
            }
        }
    }

    var prop = [hits, "/", join_values1.length].join(""),
        f_name = "";

    if(hits == join_values1.length){
        var fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]);
        for(var i=0, len=join_values1.length; i<len; i++){
            val = field_join_map[i];
            for(var j=0, leng=fields_name_to_add.length; j<leng; j++){
                f_name = fields_name_to_add[j];
                if(f_name.length > 0){
//                    targeted_topojson.objects[layer_name].geometries[i].properties[f_name] = joined_dataset[0][val][f_name];
                    user_data[layer_name][i][f_name] = joined_dataset[0][val][f_name];
                }
            }
        }
        valid_join_check_display(true, prop);
        //alert("Full join");
        return true;
    } else if(hits > 0){
        var rep = confirm(["Partial join : ", prop, " geometries found a match. Validate ?"].join(""));
        if(rep){
            var fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]);
            var i_id = fields_name_to_add.indexOf("id");
            if(i_id > -1){ fields_name_to_add.splice(i_id, 1); }
            for(var i=0, len=join_values1.length; i<len; i++){
                val = field_join_map[i];
//                if(!targeted_topojson.objects[layer_name].geometries[i].hasOwnProperty('properties'))
//                    targeted_topojson.objects[layer_name].geometries[i].properties = {};
                for(var j=0, leng=fields_name_to_add.length; j<leng; j++){
                    f_name = fields_name_to_add[j];
                    if(f_name.length > 0){
//                        targeted_topojson.objects[layer_name].geometries[i].properties[f_name] = val ? joined_dataset[0][val][f_name] : null;
                        user_data[layer_name][i][f_name] = val ? joined_dataset[0][val][f_name] : null ;
                    }
                }
            }
            valid_join_check_display(true, prop);
            return true;
        } else {
            field_join_map = [];
            return false;
        }

    } else {
        alert("No match found...");
        field_join_map = [];
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
     for(var i=0, len=geom_layer_fields.length; i<len; i++)
         button1.push(['<option value="', geom_layer_fields[i], '">', geom_layer_fields[i], '</option>'].join(''));

     button1.push("</select>");
     button1 = button1.join('');

     for(var i=0, len=ext_dataset_fields.length; i<len; i++)
        if(ext_dataset_fields[i].length > 0)
             button2.push(['<option value="', ext_dataset_fields[i], '">', ext_dataset_fields[i], '</option>'].join(''));

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
