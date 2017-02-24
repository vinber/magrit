"use strict";

const handleZoomRect = function(){
    function idled() { idleTimeout = null; };
    function brushended() {
      let s = d3.event.selection;
      if (!s) {
        if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
        // x.domain(x0);
        // y.domain(y0);
      } else {
        var x_min = s[0][0], x_max = s[1][0];
        var y_min = s[1][1], y_max = s[0][1];
        var transform = d3.zoomTransform(svg_map),
            z_trans = [transform.x, transform.y],
            z_scale = transform.k;

        let pt1 = proj.invert([(x_min - z_trans[0]) / z_scale, (y_min - z_trans[1]) / z_scale]),
            pt2 = proj.invert([(x_max - z_trans[0]) / z_scale, (y_max- z_trans[1]) / z_scale]);
        // Todo : use these two points to make zoom on them
        map.select(".brush").call(brush.move, null);
      }
    }

    var brush = d3.brush().on("end", brushended),
        idleTimeout,
        idleDelay = 350;
    map.append("g")
        .attr("class", "brush")
        .call(brush);
}
