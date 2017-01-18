"use strict";

function get_map_template(){
    var map_config = new Object(),
        layers_style = [],
        layers = map.selectAll("g.layer"),
        map_title = document.getElementById('map_title'),
        layout_features = document.querySelectorAll('.legend:not(.title):not(#legend_root2):not(#legend_root):not(#legend_root_links)'),
        zoom_transform = d3.zoomTransform(svg_map);

    function get_legend_info(lgd_node){
        let type_lgd = lgd_node.id,
            result = {
                type: type_lgd,
                display: lgd_node.getAttribute('display'),
                transform: lgd_node.getAttribute('transform'),
                field: lgd_node.getAttribute('layer_field'),
                rounding_precision: lgd_node.getAttribute('rounding_precision'),
                visible_rect: lgd_node.getAttribute('visible_rect'),
                title: lgd_node.querySelector('#legendtitle').innerHTML,
                subtitle: lgd_node.querySelector('#legendsubtitle').innerHTML,
                bottom_note: lgd_node.querySelector('#legend_bottom_note').innerHTML
            }
        if(type_lgd == 'legend_root'){
            result['box_gap'] = lgd_node.getAttribute('box_gap');
            // result['no_data_txt'] = lgd_node.getAttribute('no_data_txt');
        } else if (type_lgd == 'legend_root2') {
            result['nested_symbols'] = lgd_node.getAttribute('nested');
        }
        console.log(result);
        return result;
    }

    map_config.projection = current_proj_name;
    map_config.projection_scale = proj.scale();
    map_config.projection_translate = proj.translate();
    map_config.projection_center = proj.center();
    map_config.projection_rotation = proj.rotate();
    map_config.zoom_translate = [zoom_transform.x, zoom_transform.y];
    map_config.zoom_scale = zoom_transform.k;
    map_config.div_width = +w;
    map_config.div_height = +h;
    map_config.n_layers = layers._groups[0].length;
    map_config.background_color = map.style("background-color");

    if(map_title){
        map_config.title = {
            "content": map_title.textContent,
            "x": map_title.getElementsByTagName('text')[0].getAttribute("x"),
            "y": map_title.getElementsByTagName('text')[0].getAttribute("y"),
            "style": map_title.getElementsByTagName('text')[0].getAttribute("style")
            };
    }

    map_config.layout_features = {};
    if(layout_features){
        for(let i = 0; i < layout_features.length; i++){
            let ft = layout_features[i];
            if(ft.id === "scale_bar"){
                map_config.layout_features.scale_bar = {
                    bar_size: scaleBar.bar_size,
                    displayed: scaleBar.displayed,
                    dist: scaleBar.dist,
                    dist_txt: scaleBar.dist_txt,
                    fixed_size: scaleBar.fixed_size,
                    precision: scaleBar.precision,
                    unit: scaleBar.unit,
                    x: scaleBar.x,
                    y: scaleBar.y,
                    transform: scaleBar.Scale._groups[0][0].getAttribute('transform') || ""
                };
            } else if(ft.id === "north_arrow"){
              let n_arr = northArrow.arrow_img._groups[0][0];
              map_config.layout_features.north_arrow = {
                  arrow_img: ft.getAttribute('href'),
                  displayed: northArrow.displayed,
                  x_img: n_arr.getAttribute('x'),
                  y_img: n_arr.getAttribute('y'),
                  x_center: northArrow.x_center,
                  y_center: northArrow.y_center,
                  size: n_arr.getAttribute('width')
              };
            } else if(ft.classList.contains('user_ellipse')){
                if(!map_config.layout_features.user_ellipse) map_config.layout_features.user_ellipse = [];
                let ellps = ft.childNodes[0];
                map_config.layout_features.user_ellipse.push({
                    rx: ellps.getAttribute('rx'),
                    ry: ellps.getAttribute('ry'),
                    cx: ellps.getAttribute('cx'),
                    cy: ellps.getAttribute('cy'),
                    stroke: ellps.style.stroke,
                    stroke_width: ellps.style.strokeWidth,
                    id: ft.id
                });
            } else if(ft.classList.contains('arrow')){
                if(!map_config.layout_features.arrow) map_config.layout_features.arrow = [];
                let line = ft.childNodes[0];
                map_config.layout_features.arrow.push({
                    lineWeight: line.style.strokeWidth,
                    stroke: line.style.stroke,
                    pt1: [line.x1.baseVal.value, line.y1.baseVal.value],
                    pt2: [line.x2.baseVal.value, line.y2.baseVal.value],
                    id: ft.id
                });
            } else if(ft.classList.contains('txt_annot')) {
                if(!map_config.layout_features.text_annot) map_config.layout_features.text_annot = [];
                let inner_p = ft.childNodes[0];
                map_config.layout_features.text_annot.push({
                    id: ft.id,
                    content: inner_p.innerHTML,
                    fontFamily: inner_p.style.fontFamily,
                    fontSize: inner_p.style.fontSize,
                    position_x: ft.x.baseVal.value,
                    position_y: ft.y.baseVal.value,
                });
            } else if(ft.classList.contains('single_symbol')) {
                if(!map_config.layout_features.single_symbol) map_config.layout_features.single_symbol = [];
                let img = ft.childNodes[0];
                map_config.layout_features.single_symbol.push({
                    x: img.getAttribute('x'),
                    y: img.getAttribute('y'),
                    width: img.getAttribute('width'),
                    height: img.getAttribute('height'),
                    href: img.getAttribute('href'),
                    scalable: ft.classList.contains('scalable-legend')
                });
                console.log(map_config.layout_features.single_symbol);
            }
        }

    }
    for(let i=map_config.n_layers-1; i > -1; --i){
        let layer_name = layers._groups[0][i].id,
            nb_ft = current_layers[layer_name].n_features,
            selection;

        layers_style[i] = new Object();
        layers_style[i].layer_name = layer_name;
        layers_style[i].n_features = nb_ft;

        let lgd = document.getElementsByClassName('lgdf_' + layer_name);
        if(lgd.length == 0){
            layers_style[i].legend = undefined;
        } else if (lgd.length == 1) {
            layers_style[i].legend = [get_legend_info(lgd[0])];
        } else if (lgd.length == 2){
            layers_style[i].legend = lgd[0].id == "legend_root" ? [get_legend_info(lgd[0]), get_legend_info(lgd[1])] : [get_legend_info(lgd[1]), get_legend_info(lgd[0])];
        }

        if(current_layers[layer_name]["stroke-width-const"])
            layers_style[i]["stroke-width-const"] = current_layers[layer_name]["stroke-width-const"];

        if(current_layers[layer_name].fixed_stroke != undefined)
            layers_style[i].fixed_stroke = current_layers[layer_name].fixed_stroke;

        if(current_layers[layer_name].colors_breaks)
            layers_style[i].colors_breaks = current_layers[layer_name].colors_breaks;

        if(current_layers[layer_name].options_disc !== undefined)
            layers_style[i].options_disc = current_layers[layer_name].options_disc;

        if (current_layers[layer_name].targeted){
            selection = map.select("#" + layer_name).selectAll("path");
            layers_style[i].fill_opacity = selection.style("fill-opacity");
            layers_style[i].targeted = true;
            layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            layers_style[i].fields_type = current_layers[layer_name].fields_type;
        } else if (layer_name == "Sphere" || layer_name == "Graticule" || layer_name == "Simplified_land_polygons") {
            selection = map.select("#" + layer_name).selectAll("path");
            layers_style[i].fill_color = rgb2hex(selection.style("fill"));
            layers_style[i].stroke_color = rgb2hex(selection.style("stroke"));
            if(layer_name == "Graticule"){
                layers_style[i].stroke_dasharray = current_layers.Graticule.dasharray;
                layers_style[i].step = current_layers.Graticule.step;
            }
        } else if(!current_layers[layer_name].renderer){
            selection = map.select("#" + layer_name).selectAll("path");
        } else if(current_layers[layer_name].renderer.indexOf("PropSymbols") > -1){
            let type_symbol = current_layers[layer_name].symbol;
            selection = map.select("#" + layer_name).selectAll(type_symbol);
            let features = Array.prototype.map.call(svg_map.querySelector("#" + layer_name).getElementsByTagName(type_symbol), function(d){ return d.__data__; });
            layers_style[i].symbol = type_symbol;
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            if(current_layers[layer_name].rendered_field2)
                layers_style[i].rendered_field2 = current_layers[layer_name].rendered_field2;
            layers_style[i].renderer = current_layers[layer_name].renderer;
            layers_style[i].size = current_layers[layer_name].size;
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;
            layers_style[i].geo_pt = {
              type: "FeatureCollection",
              features: features
            };
            if(current_layers[layer_name].renderer === "PropSymbolsTypo"){
                layers_style[i].color_map = [...current_layers[layer_name].color_map];
            }
        } else if (current_layers[layer_name].renderer == "Stewart"
                    || current_layers[layer_name].renderer == "Gridded"
                    || current_layers[layer_name].renderer == "Choropleth"
                    || current_layers[layer_name].renderer == "Categorical"
                    || current_layers[layer_name].renderer == "Carto_doug"
                    || current_layers[layer_name].renderer == "OlsonCarto"){
            selection = map.select("#" + layer_name).selectAll("path");
            layers_style[i].renderer = current_layers[layer_name].renderer;
            layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;
            let color_by_id = [];
            selection.each(function(){
                color_by_id.push(rgb2hex(this.style.fill));
            });
            layers_style[i].color_by_id = color_by_id;
            if(current_layers[layer_name].renderer == "Stewart"){
                layers_style[i].current_palette = current_layers[layer_name].current_palette;
            }
            if(current_layers[layer_name].renderer !== "Categorical") {
                layers_style[i].options_disc = current_layers[layer_name].options_disc;
            } else {
                layers_style[i].color_map = [...current_layers[layer_name].color_map];
            }
            if(current_layers[layer_name].renderer == "OlsonCarto"){
                layers_style[i].scale_max = current_layers[layer_name].scale_max;
                layers_style[i].scale_byFeature = current_layers[layer_name].scale_byFeature;
            }
        } else if (current_layers[layer_name].renderer == "Links"
                    || current_layers[layer_name].renderer == "DiscLayer"){
            selection = map.select("#" + layer_name).selectAll("path");
            layers_style[i].renderer = current_layers[layer_name].renderer;
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;
            layers_style[i].size = current_layers[layer_name].size;
            layers_style[i].min_display = current_layers[layer_name].min_display;
            layers_style[i].breaks = current_layers[layer_name].breaks;
            layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
            if(current_layers[layer_name].renderer == "Links"){
                layers_style[i].linksbyId = current_layers[layer_name].linksbyId.slice(0, nb_ft)
            }
        } else if (current_layers[layer_name].renderer == "TypoSymbols"){
            selection = map.select("#" + layer_name).selectAll("image")
            layers_style[i].symbols_map = JSON.parse(JSON.stringify([...current_layers[layer_name].symbols_map]));
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;

            let state_to_save = [];
            let selec = selection._groups[0];
            for(let i = 0; i < selec.length ; i++){
                let ft = selec[i];
                state_to_save.push({display: ft.style.display,
                                    data: ft.__data__,
                                    pos: [ft.getAttribute('x'), ft.getAttribute('y')],
                                    size: ft.getAttribute('width')
                                    });
            }
            layers_style[i].current_state = state_to_save;
        } else if(current_layers[layer_name].renderer == "Label") {
            selection = map.select("#" + layer_name).selectAll("text");
            let selec = document.getElementById(layer_name).getElementsByTagName('text');
            layers_style[i].renderer = current_layers[layer_name].renderer;
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].default_font = current_layers[layer_name].default_font;
            layers_style[i].default_size = +current_layers[layer_name].default_size.slice(0,2);
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            let features = [],
                current_position = [];
            for(let j = selec.length - 1;  j > -1; j--) {
                let s = selec[j];
                features.push(s.__data__);
                current_position.push([s.getAttribute('y'), s.getAttribute('y'), s.style.display]);
            }
            layers_style[i].data_labels = features;
            layers_style[i].current_position = current_position
        } else {
            selection = map.select("#" + layer_name).selectAll("path");
        }
        layers_style[i].stroke_opacity = selection.style("stroke-opacity");
        layers_style[i].fill_opacity = selection.style("fill-opacity");
    }

    return Q.all(layers_style.map( obj => {return obj.topo_geom ? request_data("GET", "/get_layer/" + obj.topo_geom, null) : null}))
        .then(function(result){
            for(let i = 0; i < layers_style.length; i++){
                    if(result[i] && result[i].target){
                        layers_style[i].topo_geom = result[i].target.responseText;
                    }
                }
            console.log(JSON.stringify({"map_config": map_config, "layers": layers_style}))
            return JSON.stringify({"map_config": map_config, "layers": layers_style});;
        });
}

// Function triggered when the user request a download of its map preferences
function save_map_template(){
    get_map_template().then(
        function(json_params){
            let dlAnchorElem = document.createElement('a');
            dlAnchorElem.style.display = "none";
            dlAnchorElem.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(json_params));
            dlAnchorElem.setAttribute("download", "noname_properties.json");
            document.body.appendChild(dlAnchorElem);
            dlAnchorElem.click();
            dlAnchorElem.remove();
    });
}

function load_map_template(){
    let input_button = d3.select(document.createElement('input'))
                    .attr("type", "file").attr("name", "file")
                    .attr("enctype", "text/json")
                    .on('change', function(){ prepareReading(d3.event) });

    let prepareReading = function(event){
        let file = event.target.files[0],
            reader = new FileReader();
        reader.onloadend = function(){ apply_user_preferences(reader.result); }
        reader.readAsText(file);
    }

    input_button.node().dispatchEvent(new MouseEvent("click"))
}

function apply_user_preferences(json_pref){
    let preferences = JSON.parse(json_pref),
        map_config = preferences.map_config,
        layers = preferences.layers;
        let a = document.getElementById("overlay");
        a.style.display = "";
        a.querySelector("button").style.display = "none";

    {
      let _l, _ll;
      // Remove current layers and legedn/layout features from the map :
      _l = svg_map.getElementsByTagName("g");  _ll = _l.length;
      for(let i = _ll-1; i > -1; i--){ _l[i].remove(); }
      // Remove them from the layer manager too :
      _l = layer_list.node().childNodes;  _ll = _l.length;
      for(let i = _ll-1; i > -1; i--){ _l[i].remove(); }
    }

    let g_timeout;
    let set_final_param = () => {
        if(g_timeout) clearTimeout(g_timeout);
        g_timeout = setTimeout(function(){
            proj.scale(s).translate(t).rotate(map_config.projection_rotation);;
            reproj_symbol_layer();
            let _zoom = svg_map.__zoom;
            _zoom.k = map_config.zoom_scale;
            _zoom.x = map_config.zoom_translate[0];
            _zoom.y = map_config.zoom_translate[1];
            zoom_without_redraw();
            path = d3.geoPath().projection(proj).pointRadius(4);
            map.selectAll(".layer").selectAll("path").attr("d", path);
            let desired_order = layers.map( i => i.layer_name);
            reorder_elem_list_layer(desired_order);
            desired_order.reverse();
            reorder_layers(desired_order);
            apply_layout_lgd_elem();
            let a = document.getElementById("overlay");
            a.style.display = "none";
            a.querySelector("button").style.display = "";
        }, 1250);
    };

    function apply_layout_lgd_elem(){
        if(map_config.title){
            // Create the title object :
            handle_title(map_config.title.content);
            // Use its old properties :
            let title = document.getElementById("map_title").getElementsByTagName('text')[0];
            title.setAttribute('x', map_config.title.x);
            title.setAttribute('y', map_config.title.y);
            title.setAttribute('style', map_config.title.style);
            // Also fill the input field on the left menu :
            document.querySelector("input#title.list_elem_section4").value = map_config.title.content;
        }
        if(map_config.layout_features){
            if(map_config.layout_features.scale_bar){
                scaleBar.create();
                scaleBar.bar_size = map_config.layout_features.scale_bar.bar_size;
                scaleBar.displayed = map_config.layout_features.scale_bar.displayed;
                scaleBar.dist = map_config.layout_features.scale_bar.dist;
                scaleBar.dist_txt = map_config.layout_features.scale_bar.dist_txt;
                scaleBar.fixed_size = map_config.layout_features.scale_bar.fixed_size;
                scaleBar.precision = map_config.layout_features.scale_bar.precision;
                scaleBar.x = map_config.layout_features.scale_bar.x;
                scaleBar.y = map_config.layout_features.scale_bar.y;
                scaleBar.Scale._groups[0][0].setAttribute('transform', map_config.layout_features.scale_bar.transform);
            }
            if(map_config.layout_features.north_arrow){
                northArrow.display();
                northArrow.arrow_img._groups[0][0].setAttribute('x', map_config.layout_features.north_arrow.x_img);
                northArrow.arrow_img._groups[0][0].setAttribute('y', map_config.layout_features.north_arrow.y_img);
                northArrow.arrow_img._groups[0][0].setAttribute('width', map_config.layout_features.north_arrow.size);
                northArrow.arrow_img._groups[0][0].setAttribute('height', map_config.layout_features.north_arrow.size);
                northArrow.under_rect._groups[0][0].setAttribute('x', map_config.layout_features.north_arrow.x_img);
                northArrow.under_rect._groups[0][0].setAttribute('y', map_config.layout_features.north_arrow.y_img);
                northArrow.x_center = map_config.layout_features.north_arrow.x_center;
                northArrow.y_center = map_config.layout_features.north_arrow.y_center;
                northArrow.displayed = map_config.layout_features.north_arrow.displayed;
            }
            if(map_config.layout_features.arrow){
                for(let i = 0; i < map_config.layout_features.arrow.length; i++){
                    let ft = map_config.layout_features.arrow[i];
                    new UserArrow(ft.id, ft.pt1, ft.pt2, svg_map, true);
                }
            }
            if(map_config.layout_features.user_ellipse){
                for(let i = 0; i < map_config.layout_features.user_ellipse.length; i++) {
                    let ft = map_config.layout_features.user_ellipse[i];
                    new UserEllipse(ft.id, [ft.cx, ft.cy], svg_map, true);
                }
            }
            if(map_config.layout_features.text_annot){
                for(let i = 0; i < map_config.layout_features.text_annot.length; i++) {
                    let ft = map_config.layout_features.text_annot[i];
                    let new_txt_bow = new Textbox(svg_map, ft.id, [ft.position_x, ft.position_y]);
                    let inner_p = new_txt_bow.text_annot.select("p").node();
                    inner_p.innerHTML = ft.content;
                    inner_p.style.fontFamily = ft.fontFamily;
                    inner_p.style.fontSize = ft.fontSize;
                }
            }
            if(map_config.layout_features.single_symbol){
                for(let i=0; i < map_config.layout_features.single_symbol.length; i++){
                    let ft = map_config.layout_features.single_symbol[i];
                    let symb = add_single_symbol(ft.href, ft.x, ft.y, ft.width, ft.height);
                    if(ft.scalable){
                        console.log(symb);
                        symb.node().parentElement.classList.add('scalable-legend');
                        symb.node().parentElement.setAttribute('transform', ['translate(', map_config.zoom_translate[0], ',', map_config.zoom_translate[1], ') scale(', map_config.zoom_scale, ',', map_config.zoom_scale, ')'].join(''));
                    }
                }
            }
        }
        up_legends();
    }

    var func_name_corresp = new Map([
        ["Links", "flow"], ["Carto_doug", "cartogram"],
        ["OlsonCarto", "cartogram"], ["Stewart", "smooth"],
        ["Gridded", "grid"], ["DiscLayer", "discont"],
        ["Choropleth", "choro"], ["Categorical", "typo"]
      ]);

    // Set the dimension of the map (width and height) :
    w = +map_config.div_width;
    h = +map_config.div_height;
    canvas_mod_size([w, h]);
    document.getElementById("input-width").value = w;
    document.getElementById("input-height").value = h;

    // Set the variables/fields related to the projeciton :
    current_proj_name = map_config.projection;
    proj = eval(available_projections.get(current_proj_name));
    s = map_config.projection_scale;
    t = map_config.projection_translate;
    proj.scale(s).translate(t).rotate(map_config.projection_rotation);
    document.getElementById('form_projection_center').value = map_config.projection_rotation[0];
    document.getElementById('proj_center_value_txt').value = map_config.projection_rotation[0];
    {
      let proj_select = document.getElementById('form_projection');
      proj_select.value = Array.prototype.filter.call(proj_select.options, function(d){ if(d.text == current_proj_name) { return d;}})[0].value;
    }
    path = d3.geoPath().projection(proj).pointRadius(4);
    map.selectAll(".layer").selectAll("path").attr("d", path);

    // Set the background color of the map :
    map.style("background-color", map_config.background_color);
    document.querySelector("input#bg_color").value = rgb2hex(map_config.background_color);

    // Add each layer :
    for(let i = map_config.n_layers - 1; i > -1; --i){
        if(g_timeout) clearTimeout(g_timeout);
        let _layer = layers[i],
            layer_name = _layer.layer_name,
            symbol;

        let fill_opacity = _layer.fill_opacity,
            stroke_opacity = _layer.stroke_opacity;

        // This is a layer for which a geometries have been stocked as TopoJSON :
        if(_layer.topo_geom){
            let tmp = {
              skip_alert: true,
              choosed_name: layer_name,
              skip_rescale: true
            };
            if(layers[i].targeted){
                tmp['target_layer_on_add'] = true;
            } else if(layers[i].renderer){
                tmp['func_name'] = func_name_corresp.get(layers[i].renderer)
                tmp['result_layer_on_add'] = true;
            }
            handle_reload_TopoJSON(layers[i].topo_geom, tmp).then(function(n_layer_name){
                layer_name = n_layer_name;
                let current_layer_prop = current_layers[layer_name];
                if(_layer.renderer){
                    current_layer_prop.renderer = _layer.renderer;
                }
                if(_layer.targeted && _layer.fields_type){
                    current_layer_prop.fields_type = _layer.fields_type;
                    document.getElementById('btn_type_fields').removeAttribute('disabled');
                }

                let layer_selec = map.select("#" + layer_name);

                current_layer_prop.rendered_field = _layer.rendered_field;
                if( _layer['stroke-width-const']){
                  current_layer_prop['stroke-width-const'] = _layer['stroke-width-const'];
                  layer_selec.style('stroke-width', _layer['stroke-width-const']);
                }
                if(_layer.fixed_stroke)
                  current_layer_prop.fixed_stroke = _layer.fixed_stroke;
                if(_layer.ref_layer_name)
                    current_layer_prop.ref_layer_name = _layer.ref_layer_name;
                if(_layer.size)
                    current_layer_prop.size = _layer.size;
                if(_layer.colors_breaks)
                    current_layer_prop.colors_breaks = _layer.colors_breaks;
                if(_layer.fill_color)
                    current_layer_prop.fill_color = _layer.fill_color;
                if(_layer.renderer){
                    if(_layer.renderer == "Choropleth"
                        || _layer.renderer == "Stewart"
                        || _layer.renderer == "Gridded"){
                        layer_selec.selectAll("path")
                                .style("fill", (d,j) => _layer.color_by_id[j])
                    } else if (_layer.renderer == "Links"){
                        current_layer_prop.linksbyId = _layer.linksbyId;
                        current_layer_prop.min_display = _layer.min_display;
                        current_layer_prop.breaks = _layer.breaks;
                        layer_selec.selectAll("path")
                            .style('stroke', _layer.fill_color.single)
                            .style("stroke-width", (d,i) => current_layer_prop.linksbyId[i][2]);
                    } else if (_layer.renderer == "DiscLayer"){
                        current_layer_prop.min_display = _layer.min_display;
                        current_layer_prop.breaks = _layer.breaks;
                        layer_selec.selectAll("path")
                            .styles(d => ({
                                fill: "none",
                                stroke: _layer.fill_color.single,
                                'stroke-width': d.properties.prop_val
                            }));
                    } else if (_layer.renderer && _layer.renderer.startsWith("Categorical")){
                          let rendering_params = {
                              colorByFeature: _layer.color_by_id,
                              color_map: new Map(_layer.color_map),
                              rendered_field: _layer.rendered_field,
                              renderer: "Categorical"
                          };
                          render_categorical(layer_name, rendering_params);
                  }
                  if(_layer.legend){
                      rehandle_legend(layer_name, _layer.legend);
                  }
                } else if(_layer.fill_color.random) {
                        layer_selec
                            .selectAll('path')
                            .style("fill", () => Colors.names[Colors.random()]);
                }
                layer_selec.selectAll('path')
                    .styles({'fill-opacity':fill_opacity, 'stroke-opacity': stroke_opacity});
                set_final_param();
            });

        // ... or this is a layer provided by the application :
        } else if (layer_name == "Sphere" || layer_name == "Graticule"){
            let options = {
                'stroke': _layer.stroke_color,
                'fill_opacity': fill_opacity,
                'stroke_opacity': stroke_opacity,
                'stroke_width': _layer['stroke-width-const'] + 'px'
                };
            if(layer_name == "Graticule"){
                options.fill = "none";
                options.stroke_dasharray = _layer.stroke_dasharray;
                options.step = _layer.step;
            } else {
                options.fill = _layer.fill_color;
            }
            add_layout_feature(layer_name.toLowerCase(), options);
        } else if (layer_name == "Simplified_land_polygons"){
            add_simplified_land_layer({skip_rescale: true, 'fill': _layer.fill_color, 'stroke': _layer.stroke_color, 'fill_opacity': fill_opacity, 'stroke_opacity': stroke_opacity, stroke_width: _layer['stroke-width-const'] + "px"});

        // ... or this a layer of proportionnals symbols :
        } else if (_layer.renderer && _layer.renderer.startsWith("PropSymbol")){
            let geojson_pt_layer = _layer.geo_pt;
            let rendering_params = {
                new_name: layer_name,
                field: _layer.rendered_field,
                fill_color: _layer.renderer == "PropSymbolsChoro" ? _layer.fill_color.class : _layer.fill_color,
                ref_value:  _layer.size[0],
                ref_size: _layer.size[1],
                symbol: _layer.symbol,
                nb_features: geojson_pt_layer.features.length,
                ref_layer_name: _layer.ref_layer_name,
                renderer: _layer.renderer
            };
            make_prop_symbols(rendering_params, geojson_pt_layer);
            if(_layer.renderer == "PropSymbolsTypo"){
                current_layers[layer_name].color_map = new Map(_layer.color_map);
            }
            if(_layer.options_disc){
                current_layers[layer_name].options_disc = _layer.options_disc;
            }
            if(_layer.rendered_field2){
                current_layers[layer_name].rendered_field2 = _layer.rendered_field2;
            }
            if(_layer.colors_breaks){
                current_layers[layer_name].colors_breaks = _layer.colors_breaks;
            }
            if(_layer.legend){
                rehandle_legend(layer_name, _layer.legend);
            }
            current_layers[layer_name]['stroke-width-const'] = _layer['stroke-width-const'];
            map.select('#' + layer_name).selectAll(_layer.symbol).style('stroke-width', _layer['stroke-width-const'] + "px");

        // ... or this is a layer of labels :
        } else if (_layer.renderer && _layer.renderer.startsWith("Label")){
            let rendering_params = {
                uo_layer_name: layer_name,
                label_field: _layer.rendered_field,
                color: _layer.fill_color,
                ref_font_size: _layer.default_size,
                font: _layer.default_font
            };
            render_label(null, rendering_params, {data: _layer.data_labels});
        } else {
            null;
        }
        // This function is called on each layer added
        //   to delay the call to the function doing a final adjusting of the zoom factor / translate values / layers orders :
        set_final_param();
    }
}

function reorder_layers(desired_order){
    let layers = svg_map.getElementsByClassName('layer'),
        parent = layers[0].parentNode,
        nb_layers = desired_order.length;
    for(let i = 0; i < nb_layers; i++){
        if(document.getElementById(desired_order[i]))
          parent.insertBefore(document.getElementById(desired_order[i]), parent.firstChild);
    }
}

function reorder_elem_list_layer(desired_order){
  let parent = document.getElementsByClassName('layer_list')[0],
      layers = parent.childNodes,
      nb_layers = desired_order.length;
  for(let i = 0; i < nb_layers; i++){
      let selec = "li." + desired_order[i];
      if(parent.querySelector(selec))
        parent.insertBefore(parent.querySelector(selec), parent.firstChild);
  }
}

function rehandle_legend(layer_name, properties){
    for(let i = 0; i < properties.length; i++){
        let prop = properties[i];
        if(prop.type == 'legend_root'){
            createLegend_choro(layer_name, prop.field, prop.title, prop.subtitle, prop.box_gap, prop.visible_rect, prop.rounding_precision);
        } else if(prop.type == 'legend_root2') {
            createLegend_symbol(layer_name, prop.field, prop.title, prop.subtitle, prop.nested_symbols, prop.visible_rect, prop.rounding_precision);
        } else if(prop.type == 'legend_root_links'){
            createLegend_discont_links(layer_name, prop.field, prop.title, prop.subtitle, prop.visible_rect, prop.rounding_precision)
        }
        svg_map.querySelector('#' + prop.type + '.lgdf_' + layer_name).setAttribute('transform', prop.transform);
    }
}
