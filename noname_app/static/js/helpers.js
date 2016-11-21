"use strict";

var drag_elem_geo = d3.drag()
   .subject(function() {
          var t = d3.select(this);
          return {
              x: t.attr("x"), y: t.attr("y"),
              map_locked: map_div.select("#hand_button").classed("locked") ? true : false
          };
      })
  .on("start", () => {
      d3.event.sourceEvent.stopPropagation();
      d3.event.sourceEvent.preventDefault();
      handle_click_hand("lock");
    })
  .on("end", () => {
    if(d3.event.subject && !d3.event.subject.map_locked)
      handle_click_hand("unlock");
    })
  .on("drag", function(){
      d3.select(this).attr("x", d3.event.x).attr("y", d3.event.y);
    });


// Function to be called after clicking on "render" in order to close the section 2
// and to have the section 3 opened
function switch_accordion_section(){
    document.getElementById("btn_s3").dispatchEvent(new MouseEvent("click"));
}

function path_to_geojson(id_layer){
    if(id_layer.indexOf('#') != 0)
        id_layer = ["#", id_layer].join('');
    var result_geojson = [];
    d3.select(id_layer)
        .selectAll("path")
        .each(function(d,i){
            result_geojson.push({
                type: "Feature",
                id: i,
                properties: d.properties,
                geometry: {type: d.type, coordinates: d.coordinates}
            });
        });
    return JSON.stringify({
        type: "FeatureCollection",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: result_geojson
    });
}

function display_error_during_computation(msg){
    msg = msg ? ["<br><i>", i18next.t("app_page.common.details"), ":</i> ", msg].join("") : "";
    swal({title: i18next.t("app_page.common.error") + "!",
          text: i18next.t("app_page.common.error_message") + msg,
          type: "error",
          allowOutsideClick: false});
}

/**
* Perform an asynchronous request
*
* @param {String} method - the method like "GET" or "POST"
* @param {String} url - the targeted url
* @param {FormData} data - Optionnal, the data to be send
* @return {Promise} response
*/
function request_data(method, url, data){
    return new Promise(function(resolve, reject){
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = resolve;
        request.onerror = reject;
        request.send(data);
    });
}

function xhrequest(method, url, data, waiting_message){
    if(waiting_message){ document.getElementById("overlay").style.display = ""; }
    return new Promise(function(resolve, reject){
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = resp => {
            resolve(resp.target.responseText);
            if(waiting_message){ document.getElementById("overlay").style.display = "none"; }
        };
        request.onerror = err => {
            reject(err);
            if(waiting_message){ document.getElementById("overlay").style.display = "none"; }
        };
        request.send(data);
    });
}

function make_content_summary(serie, precision=6){
    return [
        i18next.t("app_page.stat_summary.population"), " : ", round_value(serie.pop(), precision), "<br>",
        i18next.t("app_page.stat_summary.min"), " : ", round_value(serie.min(), precision), " | ",
        i18next.t("app_page.stat_summary.max"), " : ", round_value(serie.max(), precision), "<br>",
        i18next.t("app_page.stat_summary.mean"), " : ", round_value(serie.mean(), precision), "<br>",
        i18next.t("app_page.stat_summary.median"), " : ", round_value(serie.median(), precision), "<br>",
        i18next.t("app_page.stat_summary.variance"), " : ", round_value(serie.variance(), precision), "<br>",
        i18next.t("app_page.stat_summary.stddev"), " : ", round_value(serie.stddev(), precision), "<br>",
        i18next.t("app_page.stat_summary.cov"), " : ", round_value(serie.cov(), precision)
    ].join('')
}

function copy_layer(ref_layer, new_name, type_result){
    svg_map.appendChild(document.getElementById("svg_map").querySelector("#"+ref_layer).cloneNode(true));
    svg_map.lastChild.setAttribute("id", new_name);
    svg_map.lastChild.setAttribute("class", "result_layer layer");
    current_layers[new_name] = {n_features: current_layers[ref_layer].n_features,
                             type: current_layers[ref_layer].type,
                             ref_layer_name: ref_layer};
    let selec_src = document.getElementById(ref_layer).querySelectorAll("path");
    let selec_dest = document.getElementById(new_name).querySelectorAll("path");
    for(let i = 0; i < selec_src.length; i++)
        selec_dest[i].__data__ = selec_src[i].__data__;
    up_legends();
    create_li_layer_elem(new_name, current_layers[new_name].n_features, [current_layers[new_name].type, type_result], "result");
}

/**
* Send a geo result layer computed client-side (currently only discontinuities)
* to the server in order to use it as other result layers computed server side
* @param {string} layer_name
* @param {string} url
*/
function send_layer_server(layer_name, url){
    var formToSend = new FormData();
    var JSON_layer = path_to_geojson(layer_name);
    formToSend.append("geojson", JSON_layer);
    formToSend.append("layer_name", layer_name);
    request_data("POST", url, formToSend).then(function(e){
        let key = JSON.parse(e.target.responseText).key;
        current_layers[layer_name].key_name = key;
    }).catch(function(err){
        display_error_during_computation();
        console.log(err);
    });
}
