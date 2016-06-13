// Helper function in order to have a colorbrewer color ramp with 
// non-supported number of value using interpolation between the colorbrewer color
// to fit the requested number of classes.
// If the number of class fit the size of a colorbrewer ramp (3 < nb_class < 9)
// the genuine colorbrewer array is directly returned.
var getColorBrewerArray = function(nb_class, name){
    if(nb_class < 10 && nb_class >= 3){
        var colors = colorbrewer[name][nb_class];
        return colors;
    } else if(nb_class < 3) {
        var colors = colorbrewer[name][3];
        return [
            rgb2hex(interpolateColor(hexToRgb(colors[0]), hexToRgb(colors[1]))),
            rgb2hex(interpolateColor(hexToRgb(colors[1]), hexToRgb(colors[2]))),
            ]
    } else if(nb_class > 9 && nb_class < 18) {
        var colors = colorbrewer[name][9],
            diff = nb_class - 9;
        return interp_n(colors, diff, 9)
    } else if(nb_class >= 18){
        var colors = colorbrewer[name][9];
        colors = interp_n(colors, 8, 9);
        return interp_n(colors, nb_class - colors.length, nb_class)
    }
}

// Function to make color interpolation from "colors" (an array of n colors)
// to a larger array of "k" colors (using same start and stop than the original)
var interp_n = function(colors, diff, k){
    var tmp = [], new_colors = [];
    for(var i = 0; i < diff; ++i){
        tmp.push(rgb2hex(interpolateColor(hexToRgb(colors[i]), hexToRgb(colors[i+1]))))
    }
    for(var i = 0; i < k; ++i){
        new_colors.push(colors[i])
        if(tmp[i]) new_colors.push(tmp[i])
    }
    return new_colors;
}


function rgb2hex(rgb){
// Originally from  http://jsfiddle.net/mushigh/myoskaos/
 if(typeof rgb === "string"){
     rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
     return (rgb && rgb.length === 4) ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
 } else {
     return (rgb && rgb.length === 3) ? "#" +
      ("0" + parseInt(rgb[0],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) : '';
 }
}

function hexToRgb(hex, out) {
    // Originally from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(out==='string') {
    return result ? ["rgb(", parseInt(result[1], 16), ",", parseInt(result[2], 16), ",", parseInt(result[3], 16), ")"].join('') : null;
    } else {
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    }
}

// Return the interpolated value at "factor" (0<factor<1) between color1 and color2
// (if no factor is provided the default value of 0.5 is used,
// corresponding to the middle between the two colors).
// Args :
//    - color1 : array of 3 integer for rgb color as [R, G, B]
//    - color2 : array of 3 integer for rgb color as [R, G, B]
var interpolateColor = function(color1, color2, factor=0.5) {
  var result = color1.slice();
  for (var i=0;i<3;i++) {
    result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
  }
  return result;
};

// Just a "Colors" object with a convenience "random" method 
// ... when a random color is needed (they aren't specialy pretty colors though!)
var Colors = {
    names: {
        aqua: "#00ffff",
        azure: "#f0ffff",
        beige: "#f5f5dc",
        black: "#000000",
        blue: "#0000ff",
        brown: "#a52a2a",
        cyan: "#00ffff",
        darkblue: "#00008b",
        darkcyan: "#008b8b",
        darkgrey: "#a9a9a9",
        darkgreen: "#006400",
        darkkhaki: "#bdb76b",
        darkmagenta: "#8b008b",
        darkolivegreen: "#556b2f",
        darkorange: "#ff8c00",
        darkorchid: "#9932cc",
        darkred: "#8b0000",
        darksalmon: "#e9967a",
        darkviolet: "#9400d3",
        fuchsia: "#ff00ff",
        gold: "#ffd700",
        green: "#008000",
        indigo: "#4b0082",
        khaki: "#f0e68c",
        lightblue: "#add8e6",
        lightcyan: "#e0ffff",
        lightgreen: "#90ee90",
        lightgrey: "#d3d3d3",
        lightpink: "#ffb6c1",
        lightyellow: "#ffffe0",
        lime: "#00ff00",
        magenta: "#ff00ff",
        maroon: "#800000",
        navy: "#000080",
        olive: "#808000",
        orange: "#ffa500",
        pink: "#ffc0cb",
        purple: "#800080",
        violet: "#800080",
        red: "#ff0000",
        silver: "#c0c0c0",
        white: "#ffffff",
        yellow: "#ffff00"
    },
    random: function() {
        var result;
        var count = 0;
        for (var prop in this.names)
            if (Math.random() < 1/++count)
               result = prop;
        return result;
        }
    };