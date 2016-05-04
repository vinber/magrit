////////////////////////////////////////////////////////////////////////
// Browse and upload buttons + related actions (conversion + displaying)
////////////////////////////////////////////////////////////////////////

function add_layer(d){
    var input = $(document.createElement('input')),
        res = [], self_section = this.parentNode.parentNode.id;

    input.attr("type", "file").attr("multiple", "").attr("name", "file[]").attr("enctype", "multipart/form-data");
    input.on('change', prepareUpload);
    
    if(self_section === "section1") target_layer_on_add = true;
    
    function prepareUpload(event){
        files = event.target.files;
        if(strContains(files[0].name, 'topojson')){
            handle_TopoJSON_files(files);
        } else if(files.length == 1 && (strContains(files[0].name, 'geojson')
                            || strContains(files[0].name, 'zip'))){
            handle_single_file(files);
        } else if((strContains(files[0].name.toLowerCase(), '.csv')
                    || strContains(files[0].name.toLowerCase(), '.tsv'))
                    && self_section === "section1") {
            handle_dataset(files)
            target_layer_on_add = false;
        }
        else if(files.length >= 4){
            var filenames = [];
            for (var i=0; i<files.length; i++) filenames[i] = files[i].name;
            var res = strArraysContains(filenames, ['.shp', '.dbf', '.shx', '.prj']);
            if(res.length >= 4){
                handle_shapefile(files);
                }
            else {
                alert('Layers have to be uploaded one by one and all mandatory files (.shp, .dbf, .shx, .prj) have been provided for reading a Shapefile');
                }
        } else {
            alert('Invalid datasource (No GeoJSON/TopoJSON/zip/Shapefile detected)');
        }
    };
    input.trigger('click');
}

////////////////////////////////////////////////////////////////////////
// Some jQuery functions to handle drag-and-drop events :
////////////////////////////////////////////////////////////////////////

$(document).on('dragenter', '#section1,#section3', function() {
            target_layer_on_add = false
            $(this).css('border', '3px dashed green');
            return false;
});
$(document).on('dragover', '#section1,#section3', function(e){
            e.preventDefault();
            e.stopPropagation();
            $(this).css('border', '3px dashed green');
            return false;
});
$(document).on('dragleave', '#section1,#section3', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).css('border', '');
            return false;
});
$(document).on('drop', '#section1,#section3', function(e) {
    var files = e.originalEvent.dataTransfer.files,
        self_section = this.id;

   if(self_section === "section1") target_layer_on_add = true;
   e.preventDefault();e.stopPropagation();

   if(!(e.originalEvent.dataTransfer.files.length == 1)){
        var filenames = [];
        for(var i=0; i < files.length; i++){filenames[i] = files[i].name;}
        var result = strArraysContains(filenames, ['.shp', '.dbf', '.shx', '.prj']);

        if(result.length == 4){
            $(this).css('border', '3px dashed red');
//            alert('All mandatory files (.shp, .dbf, .shx, .prj) have been provided for reading a Shapefile');
            $(this).css('border', '');
            handle_shapefile(files);
                }
            else {
                alert('Layers have to be uploaded one by one and all mandatory files (.shp, .dbf, .shx, .prj) have been provided for reading a Shapefile');
                $(this).css('border', '');
              }
        }
   else if(strContains(files[0].name.toLowerCase(), 'topojson')){
           $(this).css('border', '');
           if(target_layer_on_add && targeted_layer_added)
               alert("Only one layer can be added by this functionnality");
           // Most direct way to add a layer :
           else handle_TopoJSON_files(files);
   }
//   else if(strContains(files[0].name.toLowerCase(), 'geojson')){
//           $(this).css('border', '');
//           if(target_layer_on_add && targeted_layer_added)
//               alert("Only one layer can be added by this functionnality");
//           // Most direct way to add a layer :
//           else handle_GeoJSON_files(files);
//    }
   else if(strContains(files[0].name.toLowerCase(), 'geojson') || 
            strContains(files[0].type.toLowerCase(), 'application/zip')){
           $(this).css('border', '');

           if(target_layer_on_add && targeted_layer_added)
               alert("Only one layer can be added by this functionnality");
           // Send the file to the server for conversion :
           else handle_single_file(files);
   }
  else if(strContains(files[0].name.toLowerCase(), '.csv')
            || strContains(files[0].name.toLowerCase(), '.tsv')) {
        if(self_section === "section1"){
//        alert('Dataset provided');
            $(this).css('border', '');
            handle_dataset(files);
        }
        else
            alert('Only layout layers can be added here');
        target_layer_on_add = false;
   }
  else {
        $(this).css('border', '3px dashed red');
        alert('Invalid datasource (No GeoJSON/TopoJSON/zip/Shapefile detected)');
        $(this).css('border', '');
    }
});

////////////////////////////////////////////////////////////////////////
// Functions to handles files according to their type
////////////////////////////////////////////////////////////////////////

function handle_shapefile(files){
    var ajaxData = new FormData();
    ajaxData.append("action", "submit_form");
    for(let j=0; j<files.length; j++){
        ajaxData.append('file['+j+']', files[j]);
    }
     $.ajax({
        processData: false,
        contentType: false,
        cache: false,
        url: '/convert_to_topojson',
        data: ajaxData,
        type: 'POST',
        success: function(data) {add_layer_topojson(data);},
        error: function(error) {console.log(error); }
        });

}

// - By trying directly to add it if it's a TopoJSON :
function handle_TopoJSON_files(files) {
    var f = files[0],
        name = files[0].name,
        reader = new FileReader(),
        ajaxData = new FormData();
    ajaxData.append('file[]', f);
    $.ajax({
        processData: false,
        contentType: false,
        cache: false,
        global: false,
        url: '/cache_topojson/user',
        data: ajaxData,
        type: 'POST',
        error: function(error) { console.log(error); }
    });

    reader.onloadend = function(){
        var text = reader.result;
        add_layer_topojson(text);
        }
    reader.readAsText(f);
};

function handle_dataset(files){
    if(joined_dataset.length !== 0){
        var rep = confirm("An additional dataset as already been provided. Replace by this one ?");
        if(!rep){ return; }
        else joined_dataset = [];
    }

    for(var i = 0; i != files.length; ++i) {
        var f = files[i],
            reader = new FileReader(),
            name = f.name;

        reader.onload = function(e) {
            var data = e.target.result;
            dataset_name = name.substring(0, name.indexOf('.csv'));
            joined_dataset.push(d3.csv.parse(data))

            var field_name = Object.getOwnPropertyNames(joined_dataset[0][0]);
            if(field_name.indexOf("x") > -1 || field_name.indexOf("X") > -1 || field_name.indexOf("lat") > -1 || field_name.indexOf("latitude") > -1){
                if(field_name.indexOf("y") > -1 || field_name.indexOf("Y") > -1 || field_name.indexOf("lon") > -1 || field_name.indexOf("longitude") > -1 || field_name.indexOf("long") > -1){
                    add_csv_geom(joined_dataset);
                }
            }
            let d_name = dataset_name.length > 20 ? [dataset_name.substring(0, 17), "(...)"].join('') : dataset_name;
            d3.select('#data_ext').attr("name-tooltip", dataset_name + '.csv').html([' <b>', d_name, "</b> - ", field_name.length, " fields"].join(''));
            valid_join_check_display(false);
            if(!targeted_layer_added){ d3.select("#join_button").node().disabled = true; }
            d3.select("#section1").style("height", "245px");
            if(browse_table.node().disabled === true) browse_table.node().disabled = false;
            $("[name-tooltip!='']").qtip( {content: { attr: "name-tooltip" }, style: { classes: 'qtip-tipsy' } } );
        };
        reader.readAsText(f);
    }
}

function add_csv_geom(param){
    null;
}

// - By sending it to the server for conversion (GeoJSON to TopoJSON)
function handle_single_file(files) {
    var ajaxData = new FormData();
    // var md5_digest = md5_h(files[0]);
    ajaxData.append("action", "single_file");
    ajaxData.append('file[]', files[0]);
//    ajaxData.append('md5', md5_digest);
    $.ajax({
        processData: false,
        contentType: false,
        cache: false,
        url: '/convert_to_topojson',
        data: ajaxData,
        type: 'POST',
        success: function(data) {add_layer_topojson(data);},
        error: function(error) {console.log(error);}
    });
};

// Add the TopoJSON to the 'svg' element :
function add_layer_topojson(text, options){
    var parsedJSON = JSON.parse(text),
        result_layer_on_add = options ? options.result_layer_on_add : false;

    
    if(parsedJSON.Error){  // Server returns a JSON reponse like {"Error":"The error"} if something went bad during the conversion
        alert(parsedJSON.Error);
        return;
    }
    var type = "", data_to_load = false,
        layers_names = Object.getOwnPropertyNames(parsedJSON.objects);

    // Add an ID if the input topojson is provided without :
    layers_names.forEach(function(l_name, j){
        if(!parsedJSON.objects[l_name].geometries[0].id){
            for(var i=0, len = parsedJSON.objects[l_name].geometries.length,
                         tgt = parsedJSON.objects[l_name].geometries; i < len; i++){ 
                tgt[i].id = i;
                }
        }
    });

    if(target_layer_on_add && menu_option.add_options && menu_option.add_options == "keep_file")
        _target_layer_file = parsedJSON;

    // Loop over the layers to add them all ?
    // Probably better open an alert asking to the user which one to load ?
    for(var i=0; i < layers_names.length; i++){
        var random_color1 = Colors.random(),
            lyr_name = layers_names[i],
            field_names = parsedJSON.objects[lyr_name].geometries[0].properties ? Object.getOwnPropertyNames(parsedJSON.objects[lyr_name].geometries[0].properties) : [];

        if(strContains(parsedJSON.objects[lyr_name].geometries[0].type, 'oint')) type = 'Point';
        else if(strContains(parsedJSON.objects[lyr_name].geometries[0].type, 'tring')) type = 'Line';
        else if(strContains(parsedJSON.objects[lyr_name].geometries[0].type, 'olygon')) type = 'Polygon';

//        if(parsedJSON.objects[lyr_name].geometries[0].properties && target_layer_on_add){
        current_layers[lyr_name] = {"type": type,
                                    "n_features": parsedJSON.objects[lyr_name].geometries.length,
                                    "stroke-width-const": "0.4px"};
    
        if(target_layer_on_add){
            current_layers[lyr_name].targeted = true;
            user_data[lyr_name] = [];
            data_to_load = true;
        } else if(result_layer_on_add){
            result_data[lyr_name] = [];
            current_layers[lyr_name].is_result = true;
        }

        map.append("g").attr("id", lyr_name)
              .attr("class", function(d) { return data_to_load ? "targeted_layer layer" : "layer"; })
              .style({"stroke-linecap": "round", "stroke-linejoin": "round"})
              .selectAll(".subunit")
              .data(topojson.feature(parsedJSON, parsedJSON.objects[lyr_name]).features)
              .enter().append("path")
              .attr("d", path)
              .attr("id", function(d, ix) {
                    if(data_to_load){
                        if(field_names.length > 0){
                            if(d.properties.hasOwnProperty('id') && d.id !== d.properties.id)
                                d.properties["_uid"] = d.id;
                            d.properties["pkuid"] = ix;
                            user_data[lyr_name].push(d.properties);
                        } else {
                            user_data[lyr_name].push({"id": d.id});
                        }
                    } else if(result_layer_on_add)
                        result_data[lyr_name].push(d.properties);

                    return "feature_" + ix;
                })
              .style("stroke", function(){if(type != 'Line') return("rgb(0, 0, 0)");
                                          else return(random_color1);})
              .style("stroke-opacity", .4)
              .style("fill", function(){if(type != 'Line') return(random_color1);
                                        else return(null);})
              .style("fill-opacity", function(){if(type != 'Line') return(0.5);
                                                else return(0);})
              .attr("height", "100%")
              .attr("width", "100%");

//        d3.select("#layer_menu")
//              .append('p').html('<a href>- ' + lyr_name+"</a>");

        let class_name = ["ui-state-default"];
        if(target_layer_on_add)
            class_name.push("sortable_target");
        else if (result_layer_on_add)
            class_name.push("sortable_result");
        class_name.push(lyr_name);
        class_name = class_name.join(' ');

        layers_listed = layer_list.node()
        var li = document.createElement("li");
        li.setAttribute("class", class_name);
        li.setAttribute("layer-tooltip", ["<b>", lyr_name, "</b> - ", type, " - ", parsedJSON.objects[lyr_name].geometries.length, " features - ", field_names.length, " fields"].join(''))
        if(target_layer_on_add){
            if(browse_table.node().disabled === true) browse_table.node().disabled = false;
            let _button = button_type[type],
                _lyr_name_display = lyr_name.length > 29 ? [lyr_name.substring(0, 24), '(...)'].join('') : lyr_name;
            _button = _button.substring(10, _button.indexOf("class") - 2);
            d3.select("#img_in_geom").attr({"src": _button, "width": "28", "height": "28"});
            d3.select('#input_geom').html(['<b>', lyr_name,'</b> (', field_names.length, ' fields)</i>'].join(''));
            targeted_layer_added = true;
            li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, button_active, button_type_blank[type], "</div> ",lyr_name].join('')
        } else {
            li.innerHTML = ['<div class="layer_buttons">', result_layer_on_add ? sys_run_button_t2 : button_style, button_trash, button_zoom_fit, button_active, button_type[type], "</div> ",lyr_name].join('')
        }
        layers_listed.insertBefore(li, layers_listed.childNodes[0])

    }
    if(target_layer_on_add && joined_dataset.length != 0){ d3.select("#join_button").node().disabled = false; }
    if(Object.getOwnPropertyNames(user_data).length > 0){ d3.select("#func_button").node().disabled = false; }
    if(target_layer_on_add || result_layer_on_add) center_map(lyr_name);
    binds_layers_buttons();
    zoom_without_redraw();
    target_layer_on_add = false;
    alert('Layer successfully added to the canvas');
};

function center_map(name){
    var bbox_layer_path = undefined;
    if(name.endsWith("_PropSymbols"))
        name = name.substring(0, name.length - 12);
    d3.select("#"+name).selectAll('path').each(function(d, i){
        var bbox_path = path.bounds(d);
        if(bbox_layer_path === undefined){
            bbox_layer_path = bbox_path;
        }
        else {
            bbox_layer_path[0][0] = bbox_path[0][0] < bbox_layer_path[0][0] ? bbox_path[0][0] : bbox_layer_path[0][0];
            bbox_layer_path[0][1] = bbox_path[0][1] < bbox_layer_path[0][1] ? bbox_path[0][1] : bbox_layer_path[0][1];
            bbox_layer_path[1][0] = bbox_path[1][0] > bbox_layer_path[1][0] ? bbox_path[1][0] : bbox_layer_path[1][0];
            bbox_layer_path[1][1] = bbox_path[1][1] > bbox_layer_path[1][1] ? bbox_path[1][1] : bbox_layer_path[1][1];
        }
    });
    var s = .95 / Math.max((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h),
        t = [(w - s * (bbox_layer_path[1][0] + bbox_layer_path[0][0])) / 2, (h - s * (bbox_layer_path[1][1] + bbox_layer_path[0][1])) / 2];
    zoom.scale(s);
    zoom.translate(t);
};

// Some helpers
function strContains(string1, substring){
    return string1.indexOf(substring) >= 0;
};

function strArraysContains(ArrString1, ArrSubstrings){
    var result = [];
    for(var i=0; i < ArrString1.length; i++){
        for(var j=0; j < ArrSubstrings.length; j++){
            if(strContains(ArrString1[i], ArrSubstrings[j])){
            result[result.length] = ArrSubstrings[j];
            }
        }
    }
    return result;
};

function add_layout_features(){
    var available_features = ["North arrow", "Scale", "Graticule"],
        selected_ft = undefined;

    make_confirm_dialog("", "Valid", "Cancel", "Layout features to be add ...", "sampleLayoutFtDialogBox", 4*w/5, h-10).then(
        function(confirmed){ null; });

    var box_body = d3.select(".sampleLayoutFtDialogBox");

    box_body.append('h3').html("Choose features to be added : ");
    box_body.append("p").style("color", "grey").html("<i>(multiple features can be selected)</i>");

    var layout_ft_selec = box_body.append('p').html('').insert('select').attr({class: 'sample_layout', multiple: "multiple", size: available_features.length});
    available_features.forEach(function(ft){layout_ft_selec.append("option").html(ft[0]).attr("value", ft[1]);});
    layout_ft_selec.on("change", function(){
        let selected_asArray = Array.prototype.slice.call(this.selectedOptions);
        selected_ft = selected_asArray.map(elem => elem.value);
        console.log(selected_ft);
    });


}

function add_layout_layers(){
    var selec = {layout: null, target: null},
        sample_datasets = undefined;

    d3.json('/static/json/sample_layers.json', function(error, json){
        sample_datasets = json[0];
        });

    var layout_layers = [["Nuts 0 (2013) European Country <i>(Polygons)</i>", "nuts0"],
                         ["Nuts 1 (2013) European subdivisions <i>(Polygons)</i>", "nuts1"],
                         ["Nuts 2 (2013) European subdivisions <i>(Polygons)</i>", "nuts2"],
                         ["World countries simplified <i>(Polygons)</i>", "world_country"],
                         ["World country capitals <i>(Points)</i>", "world_cities"],
                         ["Water coverage (sea, lakes and major rivers) <i>(Polygons)</i>", "water_coverage"],
                         ["Graticule", "graticule"]];


    var a = make_confirm_dialog("", "Valid", "Cancel", "Collection of sample layers...", "sampleLayoutDialogBox", 4*w/5, h-10).then(
        function(confirmed){
            if(confirmed){
                let url = undefined;
                if(selec.layout && selec.layout.length > 0){
                    for(let i = 0; i < selec.layout.length; ++i){
                        if(selec.layout[i] === "graticule"){
                            if(current_layers["Graticule"] != undefined)
                                continue
                            map.append("g").attr({id: "Graticule", class: "layer"})
                                   .append("path")
                                   .attr("class", "graticule")
                                   .datum(d3.geo.graticule())
                                   .attr("d", path);
                           current_layers["Graticule"] = {"type": "Line", "n_features":1, "stroke-width-const": "1px"};
                           layer_list.append("li").attr("class", "ui-state-default Graticule").html('<div class="layer_buttons">'+ button_style + button_trash + button_active + "</div> Graticule");
                           zoom_without_redraw();
                           binds_layers_buttons();
                        }
                        else {
                            url = sample_datasets[selec.layout[i]];
                            cache_sample_layer(selec.layout[i]);
                            d3.text(url, function(txt_layer){ console.log(txt_layer); add_layer_topojson(txt_layer); })
                        }
                    }
                }
            }
        });

    var box_body = d3.select(".sampleLayoutDialogBox");

    box_body.append('h3').html("Choose layer(s) to be used as layout : ");
    box_body.append("p").style("color", "grey").html("<i>(multiple layers can be selected)</i>");

    var layout_layer_selec = box_body.append('p').html('').insert('select').attr({class: 'sample_layout', multiple: "multiple", size: layout_layers.length});
    layout_layers.forEach(function(layer_info){layout_layer_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);});
    layout_layer_selec.on("change", function(){
        let selected_asArray = Array.prototype.slice.call(this.selectedOptions);
        selec.layout = selected_asArray.map(elem => elem.value)
        console.log(selec)
    });
}


function add_sample_layer(){
    var dialog_res = [],
        selec = {layout: null, target: null},
        sample_datasets = undefined;

    d3.json('/static/json/sample_layers.json', function(error, json){
        sample_datasets = json[0];
        });

    var target_layers = [["<i>Target layer</i>",""],
                    ["Paris hospital locations <i>(Points)</i>", "paris_hospitals"],
                    ["Grand Paris municipalities <i>(Polygons)</i>", "GrandParisMunicipalities"],
                    ["Nuts 2 (2013) European subdivisions <i>(Polygons)</i>", "nuts2_data"]];

    var tabular_datasets = [["<i>Tabular dataset</i>",""],
                    ["International Twinning Agreements Between Cities <i>(To link with nuts2 geometries)</i>", "twincities"],
                    ['"Grand Paris" incomes dataset <i>(To link with Grand Paris municipality geometries)</i>', 'gpm_dataset']];

    var a = make_confirm_dialog("", "Valid", "Cancel", "Collection of sample layers...", "sampleDialogBox", 700, 295).then(
        function(confirmed){
            if(confirmed){
                let url = undefined;
                if(selec.target){
                    cache_sample_layer(selec.target);
                    url = sample_datasets[selec.target];
                    d3.text(url, function(txt_layer){
                        target_layer_on_add = true;
                        add_layer_topojson(txt_layer);
                        target_layer_on_add = false;
                    });
                }
                if(selec.dataset){
                    url = sample_datasets[selec.dataset];
                    d3.csv(url, function(error, data){
                        joined_dataset.push(data);
                        dataset_name = selec.dataset;
                        let field_name = Object.getOwnPropertyNames(joined_dataset[0][0]),
                            d_name = dataset_name.length > 20 ? [dataset_name.substring(0, 17), "(...)"].join('') : dataset_name;
                        d3.select('#data_ext').attr("name-tooltip", dataset_name + '.csv').html([' <b>', d_name, "</b> - ", field_name.length, " fields"].join(''));
                        valid_join_check_display(false);
                        if(!targeted_layer_added){ d3.select("#join_button").node().disabled = true; }
                        d3.select("#section1").style("height", "245px");
                        $("[name-tooltip!='']").qtip( {content: { attr: "name-tooltip" }, style: { classes: 'qtip-tipsy' } } );
                    });
                }
            }
        });

    var box_body = d3.select(".sampleDialogBox");

    var title_tgt_layer = box_body.append('h3').html("Choose a layer to be rendered : ");

    var t_layer_selec = box_body.append('p').html("").insert('select').attr('class', 'sample_target');
    target_layers.forEach(function(layer_info){t_layer_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);});
    t_layer_selec.on("change", function(){selec.target = this.value;});

    if(targeted_layer_added){
        title_tgt_layer.style("color", "grey").html("<i>Choose a layer to be rendered : </i>");
        t_layer_selec.node().disabled = true;
        }

    box_body.append('h3').html("Choose a dataset to link with geometries: ");

    var dataset_selec = box_body.append('p').html('').insert('select').attr("class", "sample_dataset");
    tabular_datasets.forEach(function(layer_info){dataset_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);});
    dataset_selec.on("change", function(){selec.dataset = this.value;});
}

function cache_sample_layer(name_layer){
    var formToSend = new FormData();
    formToSend.append("layer_name", name_layer)
    $.ajax({
        processData: false,
        contentType: false,
        global: false,
        url: '/cache_topojson/sample_data',
        data: formToSend,
        type: 'POST',
        error: function(error) { console.log(error); }
        });
    }

//function md5_h(file){
//    var md5_digest = null;
//    if(strContains(file.name, "zip") || strContains(file.name, "shp")){
//        let md5_obj = md5.create(),
//            fileReader = new FileReader();
//        fileReader.onload = function(e){
//            md5_obj.update(e.target.result);
//            };
//        fileReader.readAsArrayBuffer(file);
//        md5_digest = md5_obj.hex();
//        console.log(md5_digest);
//    } else if(strContains(file.name, "json")){
//        var fileReader = new FileReader();
//        fileReader.onload = function(e){
//            let data = e.target.result,
//                md5_obj = md5.create();
////            console.log(data);
//            md5_obj.update(data);
//            md5_digest = md5_obj.hex();
////            console.log(md5_digest);
//            };
//        fileReader.readAsText(file);
//    }
//}

//function handle_GeoJSON_files(files) {
//    var f = files[0],
//        name = files[0].name,
//        reader = new FileReader();
//
//    reader.onloadend = function(){
//        var text = reader.result;
//        add_layer_geojson(text, name);
//        }
//    reader.readAsText(f);
//};

//function add_layer_geojson(text, name, options){
//    var parsedJSON = JSON.parse(text),
//        result_layer_on_add = options ? options.result_layer_on_add : false;
//
//    if(parsedJSON.Error){  // Server returns a JSON reponse like {"Error":"The error"} if something went bad during the conversion
//        alert(parsedJSON.Error);
//        return;
//    }
////    console.log(parsedJSON)
//    name = name.substring(0, name.indexOf('.geo'));
//    var type = "", data_to_load = false;
//
//    var random_color1 = Colors.random(),
//        field_names = parsedJSON.features[0].properties ? Object.getOwnPropertyNames(parsedJSON.features[0].properties) : [];
//
//    if(parsedJSON.features[0].geometry.type.indexOf('oint') > -1) type = 'Point';
//    else if(parsedJSON.features[0].geometry.type.indexOf('tring') > -1) type = 'Line';
//    else if(parsedJSON.features[0].geometry.type.indexOf('olygon') > -1) type = 'Polygon';
//
//
//    current_layers[name] = {"type": type,
//                            "n_features": parsedJSON.features.length,
//                            "stroke-width-const": "0.4px"};
//
//    if(target_layer_on_add){
//        current_layers[name].targeted = true;
//        user_data[name] = [];
//        data_to_load = true;
//    } else if(result_layer_on_add){
//        result_data[name] = [];
//        current_layers[name].is_result = true;
//    }
//
//    map.append("g").attr("id", name)
//          .attr("class", function(d) { return data_to_load ? "targeted_layer layer" : "layer"; })
//          .style({"stroke-linecap": "round", "stroke-linejoin": "round"})
//          .selectAll(".subunit")
//          .data(parsedJSON.features)
//          .enter().append("path")
//          .attr("d", path)
//          .attr("id", function(d, ix) {
//                if(data_to_load){
//                    if(field_names.length > 0){
//                        if(!d.properties.hasOwnProperty('id') && !d.properties.hasOwnProperty('ID'))
//                            d.properties["id"] = ix;
//                        user_data[name].push(d.properties);
//                    } else {
//                        user_data[name].push({"id": d.id});
//                    }
//                } else if(result_layer_on_add)
//                    result_data[name].push(d.properties);
//
//                return "feature_" + ix;
//            })
//          .style("stroke", function(){if(type != 'Line') return("rgb(0, 0, 0)");
//                                      else return(random_color1);})
//          .style("stroke-opacity", .4)
//          .style("fill", function(){if(type != 'Line') return(random_color1);
//                                    else return(null);})
//          .style("fill-opacity", function(){if(type != 'Line') return(0.5);
//                                            else return(0);})
//          .attr("height", "100%")
//          .attr("width", "100%");
//
//    d3.select("#layer_menu")
//          .append('p').html('<a href>- ' + name+"</a>");
//
//    let class_name = ["ui-state-default"];
//    if(target_layer_on_add)
//        class_name.push("sortable_target");
//    else if (result_layer_on_add)
//        class_name.push("sortable_result");
//    class_name.push(name);
//    class_name = class_name.join(' ');
//
//    layers_listed = layer_list.node()
//    var li = document.createElement("li");
//    li.setAttribute("class", class_name);
//    li.setAttribute("title", [name, " - ", type, " - ", parsedJSON.features.length, " features - ", field_names.length, " fields"].join(''))
//    li.innerHTML = ['<div class="layer_buttons">', button_style, button_trash, button_zoom_fit, button_active, "</div> ", type, " - ", name].join('')
//    layers_listed.insertBefore(li, layers_listed.childNodes[0])
//    if(target_layer_on_add){
//        if(browse_table.node().disabled === true) browse_table.node().disabled = false;
//        d3.select('#input_geom').html("User geometry : <b>"+name+"</b> <i>("+type+")</i>");
//        targeted_layer_added = true;
//        if(data_to_load){
//             var nb_field = Object.getOwnPropertyNames(user_data[name][0]).length
//             d3.select('#datag').html("Data provided with geometries : <b>Yes - "+nb_field+" field(s)</b>")
//        }
//    }
//    if(target_layer_on_add && joined_dataset.length != 0){ d3.select("#join_button").node().disabled = false; }
//    if(Object.getOwnPropertyNames(user_data).length > 0){ d3.select("#func_button").node().disabled = false; }
////    if(target_layer_on_add || result_layer_on_add) center_map(name);
//    binds_layers_buttons();
//    zoom_without_redraw();
//    target_layer_on_add = false;
//    alert('Layer successfully added to the canvas');
//};
