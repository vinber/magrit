"use strict";
////////////////////////////////////////////////////////////////////////
// Browse and upload buttons + related actions (conversion + displaying)
////////////////////////////////////////////////////////////////////////
const MAX_INPUT_SIZE = 8704000; // max allowed input size in bytes

/**
* Function triggered when some images of the interface are clicked
* in order to create an <input> element, simulate a click on it, let the user
* browse its file and dispatch the files to the appropriate handler according
* to the file type
*/
function click_button_add_layer(){
    var res = [],
        self = this,
        input = document.createElement('input');

    input.setAttribute('type', 'file');
    input.setAttribute('multiple', '');
    input.setAttribute('name', 'file[]');
    input.setAttribute('enctype', 'multipart/form-data');
    input.onchange = function(event){
        let target_layer_on_add = (self.id === "input_geom") ? true :
                              (self.id === "img_in_geom") ? true :
                              (self.id === "img_data_ext") ? true :
                              (self.id === "data_ext") ? true : false;

        let files = event.target.files;

        handle_upload_files(files, target_layer_on_add, self);
    };

    input.dispatchEvent(new MouseEvent("click"))
}

function handle_upload_files(files, target_layer_on_add, elem){

    for(let i=0; i < files.length; i++){
        if(files[i].size > MAX_INPUT_SIZE){
            elem.style.border = '3px dashed red';
            swal({title: i18next.t("app_page.common.error") + "!",
                  text: i18next.t("app_page.common.too_large_input"),
                  type: "error",
                  allowOutsideClick: false});
            elem.style.border = '';
            return;
        }
    }

    if(!(files.length == 1)){
        var files_to_send = [];
        Array.prototype.forEach.call(files, f =>
            f.name.indexOf('.shp') > -1
                || f.name.indexOf('.dbf') > -1
                || f.name.indexOf('.shx') > -1
                || f.name.indexOf('.prj') > -1
                ? files_to_send.push(f) : null)
        elem.style.border = '';
        if(target_layer_on_add && targeted_layer_added){
                swal({title: i18next.t("app_page.common.error") + "!",
                      text: i18next.t('app_page.common'),
                      type: "error",
                      allowOutsideClick: false});
        } else if(files_to_send.length == 4){
            handle_shapefile(files_to_send, target_layer_on_add);
        } else {
            elem.style.border = '3px dashed red';
            swal({title: i18next.t("app_page.common.error") + "!",
                  text: i18next.t("app_page.common.alert_upload1"),
                  type: "error",
                  allowOutsideClick: false});
            elem.style.border = '';
        }
    }
    else if(files[0].name.toLowerCase().indexOf('topojson') > -1){
           elem.style.border = '';
           if(target_layer_on_add && targeted_layer_added)
                swal({title: i18next.t("app_page.common.error") + "!",
                      text: i18next.t('app_page.common.error_only_one'),
                      type: "error",
                      allowOutsideClick: false});
           // Most direct way to add a layer :
           else handle_TopoJSON_files(files, target_layer_on_add);
   }
   else if(files[0].name.toLowerCase().indexOf('geojson') > -1 ||
        files[0].name.toLowerCase().indexOf('zip') > -1 ||
        files[0].name.toLowerCase().indexOf('kml') > -1){
           elem.style.border = '';

           if(target_layer_on_add && targeted_layer_added)
                swal({title: i18next.t("app_page.common.error") + "!",
                      text: i18next.t('app_page.common.error_only_one'),
                      type: "error",
                      allowOutsideClick: false});
           // Send the file to the server for conversion :
           else handle_single_file(files[0], target_layer_on_add);
   }
  else if(files[0].name.toLowerCase().indexOf('.csv')  > -1
    || files[0].name.toLowerCase().indexOf('.tsv')  > -1) {
        elem.style.border = '';
        if(target_layer_on_add)
            handle_dataset(files[0], target_layer_on_add);
        else
            swal({title: i18next.t("app_page.common.error") + "!",
                  text: i18next.t('app_page.common.error_only_layout'),
                  type: "error",
                  allowOutsideClick: false});
   }
  else if(files[0].name.toLowerCase().indexOf('.xls')  > -1
    || files[0].name.toLowerCase().indexOf('.ods')  > -1) {
        elem.style.border = '';
        if(target_layer_on_add)
            convert_dataset(files[0]);
        else
            swal({title: i18next.t("app_page.common.error") + "!",
                  text: i18next.t('app_page.common.error_only_layout'),
                  type: "error",
                  allowOutsideClick: false});
   }
  else {
        elem.style.border = '3px dashed red';
        let shp_part;
        Array.prototype.forEach.call(files, f =>
            f.name.indexOf('.shp') > -1
                || f.name.indexOf('.dbf') > -1
                || f.name.indexOf('.shx') > -1
                || f.name.indexOf('.prj') > -1
                ? shp_part = true : null);
        if(shp_part){
            swal({title: i18next.t("app_page.common.error") + "!",
                  text: i18next.t('app_page.common.alert_upload_shp'),
                  type: "error",
                  allowOutsideClick: false});
        } else {
            swal({title: i18next.t("app_page.common.error") + "!",
                  text: i18next.t('app_page.common.alert_upload_invalid'),
                  type: "error",
                  allowOutsideClick: false});
        }
        elem.style.border = '';
    }
}

/**
* Function called to bind the "drop zone" on the 2 desired menu elements
*
*/
function prepare_drop_section(){
    Array.prototype.forEach.call(
        document.querySelectorAll("#section1,#section3"),
        function(elem){
            elem.addEventListener("dragenter", function(e){
                e.preventDefault();
                e.stopPropagation();
                elem.style.border = '3px dashed green';
            });
            elem.addEventListener("dragover", function(e){
                e.preventDefault();
                e.stopPropagation();
                elem.style.border = '3px dashed green';
            });
            elem.addEventListener("dragleave", function(e){
                e.preventDefault();
                e.stopPropagation();
                elem.style.border = '';
            });
            elem.addEventListener("drop", function(e) {
                e.preventDefault();
                e.stopPropagation();
                let files = e.dataTransfer.files,
                    target_layer_on_add = elem.id === "section1" ? true : false;
                handle_upload_files(files, target_layer_on_add, elem);
            }, true);
    });
}
//function prepare_drop_section(){
//    var timeout;
//    Array.prototype.forEach.call(
//        document.querySelectorAll("body,.overlay_drop"),
//        function(elem){
//
//            elem.addEventListener("dragenter", e => {
//                let overlay_drop = document.getElementById("overlay_drop");
//                e.preventDefault(); e.stopPropagation();
//                overlay_drop.style.display = "";
//            });
//
//            elem.addEventListener("dragover", e => {
//                e.preventDefault(); e.stopPropagation();
//                if(timeout){
//                    clearTimeout(timeout);
//                    timeout = setTimeout(function(){
//                        let overlay_drop = document.getElementById("overlay_drop");
//                        e.preventDefault(); e.stopPropagation();
//                        overlay_drop.style.display = "none";
//                        timeout = null;
//                    }, 2500);
//                }
//            });
//
//            elem.addEventListener("dragleave", e => {
//                timeout = setTimeout(function(){
//                    let overlay_drop = document.getElementById("overlay_drop");
//                    e.preventDefault(); e.stopPropagation();
//                    overlay_drop.style.display = "none";
//                    timeout = null;
//                }, 2500);
//            });
//
//            elem.addEventListener("drop", e => {
//                let overlay_drop = document.getElementById("overlay_drop");
//                overlay_drop.style.display = "";
//                e.preventDefault(); e.stopPropagation();
//                let files = e.dataTransfer.files;
//                swal.setDefaults({
//                  confirmButtonText: 'Next &rarr;',
//                  showCancelButton: true,
//                  animation: false,
//                  progressSteps: ['1', '2', '3']
//                })
//
//                var steps = [
//                  {
//                    title: 'Target or layout ?!',
//                    text: 'abcde'
//                  },
//                  'Step 2',
//                  'Step 3'
//                ]
//
//                swal.queue(steps).then(function() {
//                  swal.resetDefaults()
//                  swal({
//                    title: 'All done!',
//                    confirmButtonText: 'Done!',
//                    showCancelButton: false
//                  })
//                }, function() {
//                  swal.resetDefaults()
//                })
//            });
//    });
//}

function convert_dataset(file){
    var ajaxData = new FormData();
    ajaxData.append("action", "submit_form");
    ajaxData.append('file[]', file);
     $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_tabular',
        data: ajaxData,
        type: 'POST',
        error: function(error) {
            display_error_during_computation();
        },
        success: function(data) {
                data = JSON.parse(data);
                dataset_name = data.name;
                add_dataset(d3.csvParse(data.file));
            }
        });
}


function handle_shapefile(files, target_layer_on_add){
    var ajaxData = new FormData();
    ajaxData.append("action", "submit_form");
    for(let j=0; j<files.length; j++){
        ajaxData.append('file['+j+']', files[j]);
    }
     $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_to_topojson',
        data: ajaxData,
        type: 'POST',
        success: function(data) {
            add_layer_topojson(data, {target_layer_on_add: target_layer_on_add});
        },
        error: function(error) {
            display_error_during_computation();
        }
    });
}

function handle_TopoJSON_files(files, target_layer_on_add) {
    var f = files[0],
        name = files[0].name,
        reader = new FileReader(),
        ajaxData = new FormData();
    ajaxData.append('file[]', f);
    $.ajax({
        processData: false,
        contentType: false,
        global: false,
        url: '/cache_topojson/user',
        data: ajaxData,
        type: 'POST',
        error: function(error) {
            display_error_during_computation();
        },
        success: function(res){
            let key = JSON.parse(res).key;
            reader.onloadend = function(){
                let text = reader.result;
                let topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
                add_layer_topojson(topoObjText, {target_layer_on_add: target_layer_on_add});
                }
            reader.readAsText(f);
        }
    });
};

function handle_reload_TopoJSON(text, param_add_func){
    var ajaxData = new FormData();
    var f = new Blob([text], {type: "application/json"});
    ajaxData.append('file[]', f);

    return request_data("POST", '/cache_topojson/user', ajaxData).then(function(response){
        let res = response.target.responseText,
            key = JSON.parse(res).key,
            topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
        let layer_name = add_layer_topojson(topoObjText, param_add_func);
        return layer_name;
    });
}

//var UTF8 = {
//    encode: function(s){
//        for(let c, i = -1, l = (s = s.split("")).length, o = String.fromCharCode; ++i < l;
//            s[i] = (c = s[i].charCodeAt(0)) >= 127 ? o(0xc0 | (c >>> 6)) + o(0x80 | (c & 0x3f)) : s[i]
//		);
//		return s.join("");
//    },
//    decode: function(s){
//        for(let a, b, i = -1, l = (s = s.split("")).length, o = String.fromCharCode, c = "charCodeAt"; ++i < l;
//            ((a = s[i][c](0)) & 0x80) &&
//            (s[i] = (a & 0xfc) == 0xc0 && ((b = s[i + 1][c](0)) & 0xc0) == 0x80 ?
//            o(((a & 0x03) << 6) + (b & 0x3f)) : o(128), s[++i] = "")
//            );
//		return s.join("");
//	}
//};

/**
* Handle a csv dataset by parsing it as an array of Object (ie features) or by
* converting it to topojson if it contains valid x/y/lat/lon/etc. columns and
* adding it to the map
* @param {File} f - The input csv file
*/
function handle_dataset(f){

    function check_dataset(){
        var reader = new FileReader(),
            name = f.name;

        reader.onload = function(e) {
            var data = e.target.result;
            dataset_name = name.substring(0, name.indexOf('.csv'));
            let sep = data.split("\n")[0];
            if(sep.indexOf("\t") > -1) {
                sep = "\t";
            } else if (sep.indexOf(";") > -1){
                sep = ";";
            } else {
                sep = ",";
            }
//            let encoding = jschardet.detect(data);
//            if(encoding.encoding != "utf-8"
//                    || encoding.confidence){
//                console.log(encoding);
//                // Todo : do something in order to get a correct encoding
//            }
            let tmp_dataset = d3.dsvFormat(sep).parse(data);
            let field_name = Object.getOwnPropertyNames(tmp_dataset[0]);
            if(field_name.indexOf("x") > -1 || field_name.indexOf("X") > -1 || field_name.indexOf("lat") > -1 || field_name.indexOf("latitude") > -1){
                if(field_name.indexOf("y") > -1 || field_name.indexOf("Y") > -1 || field_name.indexOf("lon") > -1 || field_name.indexOf("longitude") > -1 || field_name.indexOf("long") > -1){
                    add_csv_geom(data, dataset_name);
                    return;
                }
            }
            add_dataset(tmp_dataset);
        };
        reader.readAsText(f);
    }

    if(joined_dataset.length !== 0){
        swal({
            title: "",
            text: i18next.t("app_page.common.ask_replace_dataset"),
            type: "warning",
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: i18next.t("app_page.common.confirm")
            }).then(() => {
                remove_ext_dataset_cleanup();
                check_dataset();
            }, () => { null; });
    } else {
        check_dataset();
    }
}


/**
*
*
*/
function add_dataset(readed_dataset){
    // Check if their is an empty name in the columns name (typically the first one) and replace it by UID:
    if(readed_dataset[0].hasOwnProperty('')){
        let new_col_name = !readed_dataset[0].hasOwnProperty('UID') ? 'UID' :'Undefined_Name';
        for(let i = 0; i < readed_dataset.length; ++i){
            readed_dataset[i][new_col_name] = readed_dataset[i]['']
            delete readed_dataset[i][''];
        }
    }

    // Suboptimal way to convert an eventual comma decimal separator to a point decimal separator :
    let cols = Object.getOwnPropertyNames(readed_dataset[0]);
    for(let i = 0; i < cols.length; i++){
        let tmp = [];
        // Check that all values of this field can be coerced to Number :
        for(let j=0; j < readed_dataset.length; j++){
            if((readed_dataset[j][cols[i]].replace && !isNaN(+readed_dataset[j][cols[i]].replace(",", ".")))
                    || !isNaN(+readed_dataset[j][cols[i]])) {
                // Add the converted value to temporary field if its ok ...
                tmp.push(+readed_dataset[j][cols[i]].replace(",", "."));
            } else {
                // Or break early if a value can't be coerced :
                break; // So no value of this field will be converted
            }
        }
        // If the whole field has been converted successfully, apply the modification :
        if(tmp.length === readed_dataset.length){
            for(let j=0; j < readed_dataset.length; j++){
                readed_dataset[j][cols[i]] = tmp[j];
            }
        }
    }

    joined_dataset.push(readed_dataset);
    let d_name = dataset_name.length > 20 ? [dataset_name.substring(0, 17), "(...)"].join('') : dataset_name,
        nb_features = joined_dataset[0].length,
        field_names = Object.getOwnPropertyNames(readed_dataset[0]);

    d3.select("#img_data_ext")
        .attrs({"id": "img_data_ext",
               "class": "user_panel",
               "src": "/static/img/b/tabular.svg",
               "width": "26", "height": "26",
               "alt": "Additional dataset"});

    d3.select('#data_ext')
        .attr("layer-target-tooltip", ['<b>', dataset_name, '.csv</b> - ',
                                        nb_features, ' ',
                                        i18next.t("app_page.common.feature", {count: +nb_features})].join(''))
        .html([' <b>', d_name, '</b> - <i><span style="font-size:9px;">',
               nb_features, ' ', i18next.t("app_page.common.feature", {count: +nb_features}), ' - ',
               field_names.length, ' ', i18next.t("app_page.common.field", {count: +field_names.length}),
               '</i></span>'].join(''));
    document.getElementById("data_ext").parentElement.innerHTML = document.getElementById("data_ext").parentElement.innerHTML + '<img width="13" height="13" src="/static/img/Trash_font_awesome.png" id="remove_dataset" style="float:right;margin-top:10px;opacity:0.5">';
    document.getElementById("remove_dataset").onclick = () => {
        remove_ext_dataset()
    };
    document.getElementById("remove_dataset").onmouseover = function(){
        this.style.opacity = 1;
    };
    document.getElementById("remove_dataset").onmouseout = function(){
        this.style.opacity = 0.5;
    };
    if(targeted_layer_added){
        valid_join_check_display(false);
//        document.getElementById("join_button").disabled = false;
        document.getElementById('sample_zone').style.display = "none";
    }
    if(current_functionnality && current_functionnality.name == "flow")
        fields_handler.fill();
    if(document.getElementById("browse_button").disabled === true)
        document.getElementById("browse_button").disabled = false;
    $("[layer-target-tooltip!='']").qtip("destoy");
    $("[layer-target-tooltip!='']").qtip({
        content: { attr: "layer-target-tooltip" },
        style: { classes: 'qtip-rounded qtip-light qtip_layer'},
        events: {show: {solo: true}}
//        events: {
//            show: function(){ $('.qtip.qtip-section1').qtip("hide") },
//            hide: function(){ $('.qtip.qtip-section1').qtip("show") }
//        }
    });
}

function add_csv_geom(file, name){
    var ajaxData = new FormData();
    ajaxData.append('filename', name);
    ajaxData.append('csv_file', file);
    $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_csv_geo',
        data: ajaxData,
        type: 'POST',
        error: function(error) {
            display_error_during_computation();
        },
        success: function(data) {
            dataset_name = undefined;
            add_layer_topojson(data, {target_layer_on_add: true});
        }
    });
}

/**
* Send a single file (.zip / .kml / .geojson) to the server in order to get
* the converted layer added to the map
* @param {File} file
*/
function handle_single_file(file, target_layer_on_add) {
    var ajaxData = new FormData();
    ajaxData.append("action", "single_file");
    ajaxData.append('file[]', file);
    $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_to_topojson',
        data: ajaxData,
        type: 'POST',
        success: function(data) {
            add_layer_topojson(data, {target_layer_on_add: target_layer_on_add});
        },
        error: function(error) {
            display_error_during_computation();
        }
    });
};

function get_display_name_on_layer_list(layer_name_to_add){
    return +layer_name_to_add.length > 28
        ? [layer_name_to_add.substring(0, 23), '(...)'].join('')
        : layer_name_to_add;
}

// Add the TopoJSON to the 'svg' element :
function add_layer_topojson(text, options){

    var parsedJSON = JSON.parse(text),
        result_layer_on_add = (options && options.result_layer_on_add) ? true : false,
        target_layer_on_add = (options && options.target_layer_on_add) ? true : false,
        skip_alert = (options && options.skip_alert) ? true : false;

    if(parsedJSON.Error){  // Server returns a JSON reponse like {"Error":"The error"} if something went bad during the conversion
        alert(parsedJSON.Error);
        return;
    }
    var type = "",
        topoObj = parsedJSON.file,
        data_to_load = false,
        layers_names = Object.getOwnPropertyNames(topoObj.objects);

//    // Loop over the layers to add them all ?
//    // Probably better open an alert asking to the user which one to load ?
//    for(let i=0; i < layers_names.length; i++){

    if(layers_names.length > 1){
        swal("", i18next.t("app_page.common.warning_multiple_layers"), "warning");
    }

    var random_color1 = ColorsSelected.random(),
        lyr_name = layers_names[0],
        lyr_name_to_add = check_layer_name(options && options.choosed_name ? options.choosed_name : lyr_name);
    let nb_ft = topoObj.objects[lyr_name].geometries.length,
        topoObj_objects = topoObj.objects[lyr_name],
        field_names = topoObj_objects.geometries[0].properties ? Object.getOwnPropertyNames(topoObj_objects.geometries[0].properties) : [];

    if(topoObj_objects.geometries[0].type.indexOf('Point') > -1) type = 'Point';
    else if(topoObj_objects.geometries[0].type.indexOf('LineString') > -1) type = 'Line';
    else if(topoObj_objects.geometries[0].type.indexOf('Polygon') > -1) type = 'Polygon';

    current_layers[lyr_name_to_add] = {
        "type": type,
        "n_features": nb_ft,
        "stroke-width-const": 0.4,
        "fill_color":  {"single": random_color1},
        "key_name": parsedJSON.key
        };

    if(target_layer_on_add){
        current_layers[lyr_name_to_add].targeted = true;
        user_data[lyr_name_to_add] = [];
        data_to_load = true;
    } else if(result_layer_on_add){
        result_data[lyr_name_to_add] = [];
        current_layers[lyr_name_to_add].is_result = true;
    }

    map.append("g").attr("id", lyr_name_to_add)
          .attr("class", data_to_load ? "targeted_layer layer" : "layer")
          .styles({"stroke-linecap": "round", "stroke-linejoin": "round"})
          .selectAll(".subunit")
          .data(topojson.feature(topoObj, topoObj_objects).features)
          .enter().append("path")
          .attr("d", path)
          .attr("id", function(d, ix) {
                if(data_to_load){
                    if(field_names.length > 0){
                        if(d.id != undefined && d.id != ix){
                            d.properties["_uid"] = d.id;
                            d.id = +ix;
                        }
                        user_data[lyr_name_to_add].push(d.properties);
                    } else {
                        user_data[lyr_name_to_add].push({"id": d.id || ix});
                    }
                } else if(result_layer_on_add)
                    result_data[lyr_name_to_add].push(d.properties);

                return "feature_" + ix;
            })
          .styles({"stroke": type != 'Line' ? "rgb(0, 0, 0)" : random_color1,
                   "stroke-opacity": .4,
                   "fill": type != 'Line' ? random_color1 : null,
                   "fill-opacity": type != 'Line' ? 0.95 : 0})
          .attrs({"height": "100%", "width": "100%"});

    let class_name = [
        "ui-state-default ",
        target_layer_on_add ? "sortable_target " : result_layer_on_add ? "sortable_result " : null,
        lyr_name_to_add
        ].join('');

    let layers_listed = layer_list.node(),
        li = document.createElement("li"),
        nb_fields = field_names.length,
        layer_tooltip_content =  [
            "<b>", lyr_name_to_add, "</b> - ", type, " - ",
            nb_ft, " ", i18next.t("app_page.common.feature", {count: +nb_ft}), " - ",
            nb_fields, " ", i18next.t("app_page.common.field", {count: +nb_fields})].join(''),
        _lyr_name_display_menu = get_display_name_on_layer_list(lyr_name_to_add);

    li.setAttribute("class", class_name);
    li.setAttribute("layer_name", lyr_name_to_add)
    li.setAttribute("layer-tooltip", layer_tooltip_content)
    if(target_layer_on_add){
        current_layers[lyr_name_to_add].original_fields = new Set(Object.getOwnPropertyNames(user_data[lyr_name_to_add][0]));
        if(document.getElementById("browse_button").disabled === true)
            document.getElementById("browse_button").disabled = false;

        if(joined_dataset.length != 0){
            valid_join_check_display(false);
            section1.select(".s1").html("").on("click", null);
            document.getElementById('sample_zone').style.display = "none";
        }

        let _button = button_type.get(type),
            nb_fields = field_names.length,
            nb_char_display = lyr_name_to_add.length + nb_fields.toString().length + nb_ft.toString().length,
            _lyr_name_display = +nb_char_display > 23 ? [lyr_name_to_add.substring(0, 18), '(...)'].join('') : lyr_name_to_add;

        _button = _button.substring(10, _button.indexOf("class") - 2);
        d3.select("#img_in_geom")
            .attrs({"src": _button, "width": "26", "height": "26"})
            .on("click", null);
        d3.select('#input_geom')
            .attr("layer-target-tooltip", layer_tooltip_content)
            .html(['<b>', _lyr_name_display, '</b> - <i><span style="font-size:9px;">',
                   nb_ft, ' ', i18next.t("app_page.common.feature", {count: +nb_ft}), ' - ',
                   nb_fields, ' ', i18next.t("app_page.common.field", {count: +nb_fields}),
                   '</i></span>'].join(''))

        let input_geom = document.getElementById("input_geom").parentElement;
        input_geom.innerHTML = input_geom.innerHTML + '<img width="13" height="13" src="/static/img/Trash_font_awesome.png" id="remove_target" style="float:right;margin-top:10px;opacity:0.5">';
        let remove_target = document.getElementById("remove_target");
        remove_target.onclick = () => { remove_layer(lyr_name_to_add); };
        remove_target.onmouseover = function(){ this.style.opacity = 1; };
        remove_target.onmouseout = function(){ this.style.opacity = 0.5; };
        targeted_layer_added = true;
        li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, eye_open0, button_type.get(type), "</div> ",_lyr_name_display_menu].join('')
        $("[layer-target-tooltip!='']").qtip("destoy");
        $("[layer-target-tooltip!='']").qtip({
            content: { attr: "layer-target-tooltip" },
            style: { classes: 'qtip-rounded qtip-light qtip_layer'},
            events: {show: {solo: true}}
        });

        window._target_layer_file = topoObj;
        scale_to_lyr(lyr_name_to_add);
        center_map(lyr_name_to_add);
        if(current_functionnality)
            fields_handler.fill(lyr_name_to_add);
    } else if (result_layer_on_add) {
        li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, eye_open0, button_legend, button_result_type.get(options.func_name ? options.func_name : current_functionnality.name), "</div> ",_lyr_name_display_menu].join('');
        center_map(lyr_name_to_add);
        switch_accordion_section();
    } else {
        li.innerHTML = ['<div class="layer_buttons">', button_style, button_trash, button_zoom_fit, eye_open0, button_type.get(type), "</div> ",_lyr_name_display_menu].join('')
    }

    if (!target_layer_on_add && current_functionnality && current_functionnality.name == "smooth"){
        fields_handler.fill();
    }

    layers_listed.insertBefore(li, layers_listed.childNodes[0])
    up_legends();
    handleClipPath(current_proj_name);
    zoom_without_redraw();
    binds_layers_buttons(lyr_name_to_add);

    if(!skip_alert) swal("", i18next.t("app_page.common.layer_success"), "success")
    return lyr_name_to_add;
};

/**
* Change the projection scale and translate properties in order to fit the layer.
* Redraw the path from all the current layers to reflect the change.
*
* @param {string} name - The name of layer to scale on
*/
function scale_to_lyr(name){
    name = current_layers[name].ref_layer_name || name;
    var bbox_layer_path = undefined;
    map.select("#"+name).selectAll('path').each( (d,i) => {
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
    s = 0.95 / Math.max((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h) * proj.scale();
    proj.scale(s).translate([0,0]).rotate([0,0,0]);
    map.selectAll(".layer").selectAll("path").attr("d", path);
};

/**
* Center and zoom to a layer (using zoom scale and translate properties).
* Projection properties stay unchanged.
*
* @param {string} name - The name of layer to zoom on
*/
function center_map(name){
    var bbox_layer_path = undefined;
//    name = current_layers[name].ref_layer_name || name;
    name = current_layers[name].symbol && current_layers[name].ref_layer_name
            ? current_layers[name].ref_layer_name : name;
    map.select("#"+name).selectAll('path').each(function(d, i){
        let bbox_path = path.bounds(d);
        if(!bbox_layer_path)
            bbox_layer_path = bbox_path;
        else {
            bbox_layer_path[0][0] = bbox_path[0][0] < bbox_layer_path[0][0] ? bbox_path[0][0] : bbox_layer_path[0][0];
            bbox_layer_path[0][1] = bbox_path[0][1] < bbox_layer_path[0][1] ? bbox_path[0][1] : bbox_layer_path[0][1];
            bbox_layer_path[1][0] = bbox_path[1][0] > bbox_layer_path[1][0] ? bbox_path[1][0] : bbox_layer_path[1][0];
            bbox_layer_path[1][1] = bbox_path[1][1] > bbox_layer_path[1][1] ? bbox_path[1][1] : bbox_layer_path[1][1];
        }
    });
    let zoom_scale = .95 / Math.max((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    let zoom_translate = [(w - zoom_scale * (bbox_layer_path[1][0] + bbox_layer_path[0][0])) / 2, (h - zoom_scale * (bbox_layer_path[1][1] + bbox_layer_path[0][1])) / 2];
    let _zoom = svg_map.__zoom;
    _zoom.k = zoom_scale;
    _zoom.x = zoom_translate[0];
    _zoom.y = zoom_translate[1];
};

function select_layout_features(){
    var available_features = [
         ["north_arrow", i18next.t("app_page.layout_features_box.north_arrow")],
         ["scale", i18next.t("app_page.layout_features_box.scale")],
         ["sphere", i18next.t("app_page.layout_features_box.sphere")],
         ["graticule", i18next.t("app_page.layout_features_box.graticule")],
         ["text_annot", i18next.t("app_page.layout_features_box.text_annot")],
         ["arrow", i18next.t("app_page.layout_features_box.arrow")],
         ["ellipse", i18next.t("app_page.layout_features_box.ellipse")],
         ["symbol", i18next.t("app_page.layout_features_box.symbol")]
        ];
    var selected_ft;

    make_confirm_dialog("sampleLayoutFtDialogBox", i18next.t("app_page.layout_features_box.title")).then(
            confirmed => { if(confirmed) add_layout_feature(selected_ft);
        });

    var box_body = d3.select(".sampleLayoutFtDialogBox");
    box_body.node().parentElement.style.width = "auto";
    box_body.append('h3').html(i18next.t("app_page.layout_features_box.subtitle"));

    var layout_ft_selec = box_body.append('p').html('')
                            .insert('select')
                            .attrs({class: 'sample_layout',
                                    size: available_features.length});

    available_features.forEach(function(ft){
        layout_ft_selec.append("option").html(ft[1]).attr("value", ft[0]);
    });
    layout_ft_selec.on("change", function(){ selected_ft = this.value; });

    if(!window.default_symbols){
        window.default_symbols = [];
        prepare_available_symbols();
    }
}

function setSphereBottom(){
    let layers = document.querySelectorAll(".layer"),
        layers_list = document.querySelector(".layer_list");

    svg_map.insertBefore(layers[layers.length - 1], layers[0]);
    layers_list.appendChild(layers_list.childNodes[0]);
 }


function add_layout_feature(selected_feature){
    if(selected_feature == "text_annot"){
        let existing_annotation = document.querySelectorAll(".txt_annot"),
            existing_id = [],
            new_id;
        if(existing_annotation)
            existing_id = Array.prototype.map.call(
                            existing_annotation,
                            elem => +elem.childNodes[0].id.split('text_annotation_')[1]
                            );
        for(let i=0; i < 25; i++){
            if(existing_id.indexOf(i) == -1){
                existing_id.push(i);
                new_id = ["text_annotation_", i].join('');
                break;
            } else continue;
        }
        if(!(new_id)){
            swal(i18next.t("app_page.common.error") + "!", i18next.t("Maximum number of text annotations has been reached"), "error");
            return;
        }
        let txt_box = new Textbox(svg_map, new_id);

    } else if (selected_feature == "sphere"){
        if(current_layers.Sphere) return;
        current_layers["Sphere"] = {"type": "Polygon", "n_features":1, "stroke-width-const": 0.5, "fill_color" : {single: "#add8e6"}};
        map.append("g").attrs({id: "Sphere", class: "layer", "stroke-width": "0.5px",  "stroke": "black"})
            .append("path")
            .datum({type: "Sphere"})
            .styles({fill: "lightblue", "fill-opacity": 0.2})
            .attr("id", "sphere")
            .attr("clip-path", "url(#clip)")
            .attr("d", path);
        create_li_layer_elem("Sphere", null, "Polygon", "sample");
        zoom_without_redraw();
        setSphereBottom();
    } else if (selected_feature == "graticule"){
        if(current_layers["Graticule"] != undefined)
            return;
        map.append("g").attrs({id: "Graticule", class: "layer"})
               .append("path")
               .attr("class", "graticule")
               .style("stroke-dasharray",  5)
               .datum(d3.geoGraticule())
               .attr("clip-path", "url(#clip)")
               .attr("d", path)
               .style("fill", "none")
               .style("stroke", "grey");
        current_layers["Graticule"] = {"type": "Line", "n_features":1, "stroke-width-const": 1, "fill_color": {single: "grey"}};
        create_li_layer_elem("Graticule", null, "Line", "sample");
        zoom_without_redraw();
    } else if (selected_feature == "scale"){
        if(!(scaleBar.displayed))
            scaleBar.create();
        else
            swal(i18next.t("app_page.common.error") + "!", i18next.t("app_page.common.error_existing_scalebar"), "error");
    } else if (selected_feature == "north_arrow"){
        northArrow.display();
    } else if (selected_feature == "arrow"){
        handleClickAddArrow();
    } else if (selected_feature == "ellipse"){
        handleClickAddEllipse();
    } else if (selected_feature == "symbol"){
        let a = box_choice_symbol(window.default_symbols).then( result => {
            if(result){
                add_single_symbol(result);
            }
        })
    } else {
        swal(i18next.t("app_page.common.error") + "!", i18next.t("app_page.common.error"), "error");
    }
}

function add_single_symbol(symbol_dataurl){
    let context_menu = new ContextMenu(),
        getItems = (self_parent) => [
            {"name": "Edit style...", "action": () => { make_style_box_indiv_symbol(self_parent); }},
            {"name": "Delete", "action": () => {self_parent.style.display = "none"; }}
    ];

    map.append("g")
        .attrs({class: "legend_features legend single_symbol"})
        .insert("image")
        .attr("x", w/2)
        .attr("y", h/2)
        .attr("width", "30px")
        .attr("height", "30px")
        .attr("xlink:href", symbol_dataurl.split("url(")[1].substring(1).slice(0,-2))
        .on("mouseover", function(){ this.style.cursor = "pointer";})
        .on("mouseout", function(){ this.style.cursor = "initial";})
        .on("dblclick contextmenu", function(){
            context_menu.showMenu(d3.event, document.querySelector("body"), getItems(this));
            })
        .call(drag_elem_geo);

}

var drag_lgd_features = d3.drag()
         .subject(function() {
                var t = d3.select(this),
                    prev_translate = t.attr("transform");
                prev_translate = prev_translate ? prev_translate.slice(10, -1).split(',').map(f => +f) : [0, 0];
                return {
                    x: t.attr("x") + prev_translate[0], y: t.attr("y") + prev_translate[1]
                };
            })
        .on("start", () => {
            d3.event.sourceEvent.stopPropagation();
            d3.event.sourceEvent.preventDefault();
            if(map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
          })
        .on("end", () => {
            if(map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
          })
        .on("drag", function(){
            let t = d3.select(this),
                scale_value = t.attr("scale"),
                rotation_value = t.attr("rotate");
            scale_value = scale_value ? "scale(" + scale_value + ")" : "";
            rotation_value = rotation_value ? "rotate(" + rotation_value + ",0,0)" : "";
            t.attr('transform', 'translate(' + [d3.event.x, d3.event.y] + ')' + scale_value + rotation_value);
          });

function add_layout_layers(){
    var selec = {layout: null};
    var layout_layers = [[i18next.t("app_page.layout_layer_box.nuts0"), "nuts0"],
                         [i18next.t("app_page.layout_layer_box.nuts1"), "nuts1"],
                         [i18next.t("app_page.layout_layer_box.nuts2"), "nuts2"],
                         [i18next.t("app_page.layout_layer_box.world_countries"), "world_country"],
                         [i18next.t("app_page.layout_layer_box.world_capitals"), "world_cities"],
                         ];

    make_confirm_dialog("sampleLayoutDialogBox", i18next.t("app_page.layout_layer_box.title"))
        .then(function(confirmed){
            if(confirmed){
                if(selec.layout && selec.layout.length > 0){
                    for(let i = 0; i < selec.layout.length; ++i){
                        add_sample_geojson(selec.layout[i]);
                    }
                }
            }
        });

    var box_body = d3.select(".sampleLayoutDialogBox").style("text-align", "center");
    box_body.node().parentElement.style.width = "auto";
    box_body.append('h3').html(i18next.t("app_page.layout_layer_box.msg_select_layer"));
    box_body.append("p").style("color", "grey").html(i18next.t("app_page.layout_layer_box.msg_select_multi"));

    var layout_layer_selec = box_body.append('p').html('')
                                    .insert('select')
                                    .attrs({class: 'sample_layout', multiple: "multiple", size: layout_layers.length});
    layout_layers.forEach(layer_info => {
        layout_layer_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);
    });
    layout_layer_selec.on("change", function(){
        let selected_asArray = Array.prototype.slice.call(this.selectedOptions);
        selec.layout = selected_asArray.map(elem => elem.value)
    });
    box_body.append("span").style("font-size", "0.65rem")
            .html(i18next.t("app_page.layout_layer_box.disclamer_nuts"))
}

function add_sample_layer(){
    var dialog_res = [],
        selec = {layout: null, target: null},
        sample_datasets = undefined;

    d3.json('/static/json/sample_layers.json', function(error, json){
        sample_datasets = json[0];
        });

    var target_layers = [
         [i18next.t("app_page.sample_layer_box.target_layer"),""],
         [i18next.t("app_page.sample_layer_box.paris_hospitals"), "paris_hospitals"],
         [i18next.t("app_page.sample_layer_box.grandparismunicipalities"), "GrandParisMunicipalities"],
         [i18next.t("app_page.sample_layer_box.martinique"), "martinique"],
         [i18next.t("app_page.sample_layer_box.nuts2_data"), "nuts2_data"],
         [i18next.t("app_page.sample_layer_box.nuts3_data"), "nuts3_data"],
         [i18next.t("app_page.sample_layer_box.world_countries"), "world_countries_50m"],
         [i18next.t("app_page.sample_layer_box.us_county"), "us_county"],
         [i18next.t("app_page.sample_layer_box.us_states"), "us_states"]
        ];

    var tabular_datasets = [
         [i18next.t("app_page.sample_layer_box.tabular_dataset"),""],
         [i18next.t("app_page.sample_layer_box.twincities"), "twincities"],
         [i18next.t("app_page.sample_layer_box.gpm_dataset"), 'gpm_dataset'],
         [i18next.t("app_page.sample_layer_box.martinique_data"), 'martinique_data'],
//                    ['GDP - GNIPC - Population - WGI - etc. (World Bank 2015 datasets extract) <i>(To link with World countries geometries)</i>', 'wb_extract.csv'],
         [i18next.t("app_page.sample_layer_box.bondcountries"), 'bondcountries']
        ];

    make_confirm_dialog("sampleDialogBox", i18next.t("app_page.sample_layer_box.title"))
        .then(function(confirmed){
            if(confirmed){
                let url = undefined;
                if(selec.target){
                    add_sample_geojson(selec.target, {target_layer_on_add: true});
                }
                if(selec.dataset){
                    url = sample_datasets[selec.dataset];
                    d3.csv(url, function(error, data){
                        dataset_name = selec.dataset;
                        add_dataset(data);
                    });
                }
            }
        });

    var box_body = d3.select(".sampleDialogBox");
    box_body.node().parentElement.style.width = "auto";
    var title_tgt_layer = box_body.append('h3').html(i18next.t("app_page.sample_layer_box.subtitle1"));

    var t_layer_selec = box_body.append('p').html("").insert('select').attr('class', 'sample_target');
    target_layers.forEach(layer_info => { t_layer_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]); });
    t_layer_selec.on("change", function(){selec.target = this.value;});

    var title_tab_dataset = box_body.append('h3').html(i18next.t("app_page.sample_layer_box.subtitle2"));

    var dataset_selec = box_body.append('p').html('').insert('select').attr("class", "sample_dataset");
    tabular_datasets.forEach(layer_info => { dataset_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]); });
    dataset_selec.on("change", function(){selec.dataset = this.value;});

    if(targeted_layer_added){
        title_tgt_layer.style("color", "grey")
                .html("<i>" + i18next.t("app_page.sample_layer_box.subtitle1") + "</i>");
        t_layer_selec.node().disabled = true;
    }

    if(joined_dataset.length > 0){
        title_tab_dataset.style("color", "grey")
                .html("<i>" + i18next.t("app_page.sample_layer_box.subtitle2") + "</i>");
        dataset_selec.node().disabled = true;
    }
}


function add_sample_geojson(name, options){
    var formToSend = new FormData();
    formToSend.append("layer_name", name);
    $.ajax({
        processData: false,
        contentType: false,
        url: '/cache_topojson/sample_data',
        data: formToSend,
        type: 'POST',
        success: function(data){ add_layer_topojson(data, options); },
        error: function(error) {
            display_error_during_computation();
        }
    });
}

function send_remove_server(layer_name){
    let formToSend = new FormData();
    formToSend.append("layer_name", current_layers[layer_name].key_name);
    $.ajax({
        processData: false,
        contentType: false,
        global: false,
        url: '/layers/delete',
        data: formToSend,
        type: 'POST',
        success: function(data){ console.log(JSON.parse(data)) },
        error: function(error) { console.log(error); }
    });
}

function get_map_xy0(){
    let bbox = svg_map.getBoundingClientRect();
    return {x: bbox.left, y: bbox.top}
}

function handleClickAddEllipse(){
    let getId = () => {
        let ellipses = document.querySelectorAll(".user_ellipse");
        if(!ellipses){
            return 0;
        } else if (ellipses.length > 30){
            swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_max_arrows"), "error");
            return null;
        } else {
            let ids = [];
            for(let i=0; i<ellipses.length; i++){
                ids.push(+ellipses[i].id.split("user_ellipse_")[1])
            }
            if(ids.indexOf(ellipses.length) == -1){
                return ellipses.length;
            } else {
                for(let i=0; i<ellipses.length; i++){
                    if(ids.indexOf(i) == -1){
                        return i;
                    }
                }
            }
            return null;
        }
        return null;
    };

    let start_point,
        tmp_start_point,
        ellipse_id = getId();

    if(ellipse_id === null){
        swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_message", {msg: ""}), "error");
        return;
    } else {
        ellipse_id = "user_ellipse_" + ellipse_id;
    }

    map.style("cursor", "crosshair")
        .on("click", function(){
            start_point = [d3.event.layerX, d3.event.layerY];
            tmp_start_point = map.append("rect")
                .attr("x", start_point[0] - 2)
                .attr("y", start_point[1] - 2)
                .attr("height", 4).attr("width", 4)
                .style("fill", "red");
            setTimeout(function(){
                tmp_start_point.remove();
            }, 1000);
            map.style("cursor", "")
                .on("click", null);
            new UserEllipse(ellipse_id, start_point, svg_map);
        });
}

function handleClickAddArrow(){
    let getId = () => {
        let arrows = document.querySelectorAll(".arrow");
        if(!arrows){
            return 0;
        } else if (arrows.length > 30){
            swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_max_arrows"), "error");
            return null;
        } else {
            let ids = [];
            for(let i=0; i<arrows.length; i++){
                ids.push(+arrows[i].id.split("arrow_")[1])
            }
            if(ids.indexOf(arrows.length) == -1){
                return arrows.length;
            } else {
                for(let i=0; i<arrows.length; i++){
                    if(ids.indexOf(i) == -1){
                        return i;
                    }
                }
            }
            return null;
        }
        return null;
    };

    let start_point,
        tmp_start_point,
        end_point,
        tmp_end_point,
        arrow_id = getId();

    if(arrow_id === null){
        swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_message", {msg: ""}), "error");
        return;
    } else {
        arrow_id = "arrow_" + arrow_id;
    }

    map.style("cursor", "crosshair")
        .on("click", function(){
            if(!start_point){
                start_point = [d3.event.layerX, d3.event.layerY];
                tmp_start_point = map.append("rect")
                    .attr("x", start_point[0] - 2)
                    .attr("y", start_point[1] - 2)
                    .attr("height", 4).attr("width", 4)
                    .style("fill", "red");
            } else {
                end_point = [d3.event.layerX, d3.event.layerY];
                tmp_end_point = map.append("rect")
                    .attr("x", end_point[0] - 2)
                    .attr("y", end_point[1] - 2)
                    .attr("height", 4).attr("width", 4)
                    .style("fill", "red");
            }
            if(start_point && end_point){
                setTimeout(function(){
                    tmp_start_point.remove();
                    tmp_end_point.remove();
                }, 1000);
                map.style("cursor", "")
                    .on("click", null);
                new UserArrow(arrow_id, start_point, end_point, svg_map);
            }
        });
}

function prepare_available_symbols(){
    let list_symbols = request_data('GET', '/static/json/list_symbols.json', null)
            .then( list_res => {
               list_res = JSON.parse(list_res.target.responseText);
               Q.all(list_res.map(name => request_data('GET', "/static/img/svg_symbols/" + name, null)))
                .then( symbols => {
                    for(let i=0; i<list_res.length; i++){
                        default_symbols.push([list_res[i], symbols[i].target.responseText]);
                    }
                });
            })
}
