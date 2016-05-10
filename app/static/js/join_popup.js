"use strict";

function handle_join(){
    var layer_name = Object.getOwnPropertyNames(user_data);

    if(!(layer_name.length === 1 && joined_dataset.length === 1)){
        alert("Unable to join geometries and dataset")
        return;
    } else if(field_join_map.length != 0){
        make_confirm_dialog("A successful join is already selected. Forget and select a new one ?", "Ok", "Cancel", "").then(function(confirmed){
            if(confirmed){
                field_join_map = [];
                createJoinBox(layer_name[0]);
                }
            });
    } else if(user_data[layer_name].length != joined_dataset[0].length){
        make_confirm_dialog("The geometrie layer and the joined dataset doesn't have the same number of features. Continue anyway ?", "Ok", "Cancel", "").then(function(confirmed){
            if(confirmed){ createJoinBox(layer_name[0]); }
        });
    } else {
        createJoinBox(layer_name[0]);
    }
}

// Function called to update the menu according to user operation (triggered when layers/dataset are added and after a join operation)
function valid_join_check_display(val, prop){
    if(!val){
        d3.select("#img_data_ext")
            .attr({"src": "/static/img/qgis_no_relation_mod.svg", alt: "Non-validated join"})
            .style({"width": "28px", "height": "28px"})
            .on("click", handle_join);
        d3.select("#join_section")
            .html([prop, 'Data not joined'].join(''));
        d3.select('#join_section').append("button").attr("id", "join_button").style("display", "inline").html(" -<b> Join now</b>").on("click", handle_join);
    } else {
        d3.select("#img_data_ext")
            .attr({"src": "/static/img/qgis_relation_mod.svg", alt: "Validated join"})
            .style({"width": "28px", "height": "28px"})
            .on("click", null);
        d3.select("#join_section")
            .html([' <b>', prop, ' matches</b>'].join(''))
        d3.select('#join_section').append("button").attr("id", "join_button").style("display", "inline").html(" - <i> Change join field </i>").on("click", handle_join);
    }
}

// Where the real join is done 
// Its two main results are:
//    -the update of the global "field_join_map" array
//       (storing the relation between index of the geometry layer and index of the external dataset)
//    -the update of the global "user_data" object, adding actualy the value to each object representing each feature of the layer
function valid_join_on(layer_name, field1, field2){
    var join_values1 = [],
        join_values2 = [],
        hits = 0,
        val = undefined;

    field_join_map = [];

    for(let i=0, len=joined_dataset[0].length; i<len; i++){
        join_values2.push(joined_dataset[0][i][field2]);
    }

    var join_set2 = new Set(join_values2);
    if(join_set2.size != join_values2.length){
        alert("The values on which operate have to be uniques");
        return;
    }

    for(let i=0, len=user_data[layer_name].length; i<len; i++){
        join_values1.push(user_data[layer_name][i][field1]);
    }

    var join_set1 = new Set(join_values1);
    if(join_set1.size != join_values1.length){
        alert("The values on which operate have to be uniques");
        return;
    }
    console.log(join_values1);console.log(join_values2)
    if(typeof join_values1[0] === "number" && typeof join_values2[0] === "string"){
        for(let i=0, len=join_values1.length; i<len; i++){
            val = join_values2.indexOf(String(join_values1[i]));
            if(val != -1) { field_join_map.push(val); hits++; }
            else { field_join_map.push(undefined); }
        }
    } else if(typeof join_values2[0] === "number" && typeof join_values1[0] === "string"){
        for(let i=0, len=join_values1.length; i<len; i++){
            val = join_values2.indexOf(Number(join_values1[i]));
            if(val != -1) { field_join_map.push(val); hits++; }
            else { field_join_map.push(undefined); }
        }
    } else {
        for(let i=0, len=join_values1.length; i<len; i++){
            val = join_values2.indexOf(String(join_values1[i]));
            if(val != -1) { field_join_map.push(val); hits++; }
            else { field_join_map.push(undefined); }
        }
    }

    var prop = [hits, "/", join_values1.length].join(""),
        f_name = "";

    if(hits == join_values1.length){
        let fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]);
        for(let i=0, len=join_values1.length; i<len; i++){
            val = field_join_map[i];
            for(let j=0, leng=fields_name_to_add.length; j<leng; j++){
                f_name = fields_name_to_add[j];
                if(f_name.length > 0){
                    user_data[layer_name][i][f_name] = joined_dataset[0][val][f_name];
                }
            }
        }
        valid_join_check_display(true, prop);
        return true;
    } else if(hits > 0){
        var rep = confirm(["Partial join : ", prop, " geometries found a match. Validate ?"].join(""));
        if(rep){
            let fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]),
                i_id = fields_name_to_add.indexOf("id");

            if(i_id > -1){ fields_name_to_add.splice(i_id, 1); }
            for(let i=0, len=join_values1.length; i<len; i++){
                val = field_join_map[i];
                for(let j=0, leng=fields_name_to_add.length; j<leng; j++){
                    f_name = fields_name_to_add[j];
                    if(f_name.length > 0){
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

// Function creating the join box , filled by to "select" input linked one to
// the geometry layer and the other to the external dataset, in order to choose
// the common field to do the join.
function createJoinBox(layer){
    var geom_layer_fields = Object.getOwnPropertyNames(user_data[layer][0]),
        ext_dataset_fields = Object.getOwnPropertyNames(joined_dataset[0][0]),
        button1 = ["<select id=button_field1>"],
        button2 = ["<select id=button_field2>"],
        last_choice = {"field1": geom_layer_fields[0], "field2": ext_dataset_fields[0]};

    for(let i=0, len=geom_layer_fields.length; i<len; i++)
        button1.push(['<option value="', geom_layer_fields[i], '">', geom_layer_fields[i], '</option>'].join(''));
    button1.push("</select>");

    for(let i=0, len=ext_dataset_fields.length; i<len; i++)
        if(ext_dataset_fields[i].length > 0)
            button2.push(['<option value="', ext_dataset_fields[i], '">', ext_dataset_fields[i], '</option>'].join(''));
    button2.push("</select>");

    let inner_box = [
        '<div><p style="font:12px italic;">Layer name : </p><p style="font: 14px courrier bold; display:inline;">',
         layer, '<br>',
         '<p><b><i>Select fields on which operate the join :</i></b></p>',
         '<p>Geometrie layer fields :<br>', button1.join(''),
         '<p>External dataset fields :<br>', button2.join(''),
         '<br><br><p style="text-align:center;font: bold">Join datasets ?</p></div>'].join('');

    make_confirm_dialog(inner_box, "Valid", "Cancel", "Join options", "joinBox")
        .then(function(confirmed){
            if(confirmed)
                valid_join_on(layer, last_choice.field1, last_choice.field2);
        });
    d3.select("#button_field1").on("change", function(){last_choice.field1 = this.value;});
    d3.select("#button_field2").on("change", function(){last_choice.field2 = this.value;});
}
