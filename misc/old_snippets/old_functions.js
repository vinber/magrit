
////
// Old zooming functions - too use when redrawing on zooming
/////
function redraw(sc, tr) {
  sc = sc || d3.event.scale;
  tr  = tr || d3.event.translate;
  let tx = t[0] * sc + tr[0],
      ty = t[1] * sc + tr[1];
  proj.translate([tx, ty])
    .scale(s * sc);
  map.selectAll(".layer").selectAll("path").attr("d", path);
  return [sc, tr];
}

function interpolateZoom(translate, scale) {
    return d3.transition().duration(225).tween("zoom", function () {
        var iTranslate = d3.interpolate(proj.translate(), translate),
            iScale = d3.interpolate(proj.scale(), scale);
        return function (t) {
            proj.scale(iScale(t)).translate(iTranslate(t));
            zoom.scale(scale/s);
            map.selectAll(".layer").selectAll("path").attr("d", path);
        };
    });
}

function zoomClick() {
    var clicked = d3.event.target,
        direction = 1,
        factor = 0.1,
        target_zoom = 1,
        extent = zoom.scaleExtent(),
        translate = proj.translate(),
        translate0 = [], l = [],
        p_scale = proj.scale();

    d3.event.preventDefault();
    direction = (this.id === 'zoom_in') ? 1 : -1;
    target_zoom = zoom.scale() * (1 + factor * direction);

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(translate[0] - t[0]) / p_scale, (translate[1] - t[1]) / p_scale];
    l = [translate0[0] * p_scale + t[0], translate0[1] * p_scale + t[1]];
    target_zoom = target_zoom * s // 's' is the reference proj.scale

    interpolateZoom(l, target_zoom);
}

function rotate_global(angle){
    d3.selectAll("svg").selectAll("g:not(.legend_feature)")
      .transition()
      .duration(10)
      .attr("transform", canvas_rotation_value);
};

// Function triggered each 5 minutes and when a major modification (like style modification on a layer)
// is done in order to keep basic informations about the map properties user (zoom, position, layers & styles, etc.)
function sendPreferences(){
    var json_params = get_map_template(),
        FormToSend = new FormData();
    FormToSend.append("config", json_params)
    $.ajax({
       type: 'POST',
       url: '/save_user_pref',
       processData: false,
       contentType: false,
       data: FormToSend,
       global: false,
       success: function(d) {console.log(d);}
    }); // 'global' is set to false to prevent the ajaxStart event to display the progress bar requested on other ajax calls
}

// Function to display geo coordinates (lat/lon) corrsponding
// to the mouse coordinates on the svg
function log_coordinates(t){
  var coords = d3.mouse(t),
      txt = [],
      zt = zoom.translate(),
      zs = zoom.scale();

  coords = proj.invert([(coords[0]-zt[0])/zs, (coords[1]-zt[1])/zs]);
  if(!coords || isNaN(coords[0]) || isNaN(coords[1])){
      info_coords.node().innerHTML = "";
      return;
  } else {
      if(coords[0]>0) txt.push("E")
      else txt.push("W")

      if(coords[1]>0) txt.push("N")
      else txt.push("S")
      info_coords.node().innerHTML = [txt[0], coords[0].toFixed(6), ' - ', txt[1], coords[1].toFixed(6)].join(' ');
  }
};

// Wrapper to obtain confirmation before actually removing a layer :
function remove_layer(name){
    name = name || this.parentElement.parentElement.getAttribute("layer_name");
    var txt_dialog = "Remove layer '" + name + "' ?";
    make_confirm_dialog(txt_dialog, "Confirm", "Cancel", "Confirm deletion").then(function(confirmed){
        if(confirmed){
            remove_layer_cleanup(name);
        }
    });
}

function path_to_geojson2(id_layer){
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
                geometry: d.geometry
            })
        });
    return JSON.stringify({
        type: "FeatureCollection",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: result_geojson
    });
}
