"use strict";

const handleZoomRect = function(){
    let b = map.select('.brush');
    if(b.node()) {
        b.remove();
    } else {
        makeZoomRect();
    }
};

const makeZoomRect = function(){
    function idled() { idleTimeout = null; };
    function brushended() {
      let s = d3.event.selection;
      if (!s) {
        if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      } else {
        var x_min = s[0][0], x_max = s[1][0];
        var y_min = s[1][1], y_max = s[0][1];
        var transform = d3.zoomTransform(svg_map),
            z_trans = [transform.x, transform.y],
            z_scale = transform.k;

        let pt1 = proj.invert([(x_min - z_trans[0]) / z_scale, (y_min - z_trans[1]) / z_scale]),
            pt2 = proj.invert([(x_max - z_trans[0]) / z_scale, (y_max- z_trans[1]) / z_scale]);
        let path_bounds = path.bounds({"type": "MultiPoint", "coordinates": [pt1, pt2]});
        // Todo : use these two points to make zoom on them
        map.select(".brush").call(brush.move, null);

        let zoom_scale = .95 / Math.max((path_bounds[1][0] - path_bounds[0][0]) / w, (path_bounds[1][1] - path_bounds[0][1]) / h);
        let zoom_translate = [(w - zoom_scale * (path_bounds[1][0] + path_bounds[0][0])) / 2, (h - zoom_scale * (path_bounds[1][1] + path_bounds[0][1])) / 2];
        svg_map.__zoom.k = zoom_scale;
        svg_map.__zoom.x = zoom_translate[0];
        svg_map.__zoom.y = zoom_translate[1];
        zoom_without_redraw();
      }
    }

    var brush = d3.brush().on("end", brushended),
        idleTimeout,
        idleDelay = 350;
    map.append("g")
        .attr("class", "brush")
        .call(brush);
}
