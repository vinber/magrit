"use strict";
// Helper function in order to have a colorbrewer color ramp with
// non-supported number of value using interpolation between the colorbrewer color
// to fit the requested number of classes.
// If the number of class fit the size of a colorbrewer ramp (3 < nb_class < 9)
// the genuine colorbrewer array is directly returned.

var getColorBrewerArray = function getColorBrewerArray(nb_class, name) {
    if (nb_class < 10 && nb_class >= 3) {
        var colors = colorbrewer[name][nb_class];
        return colors;
    } else if (nb_class < 3) {
        var colors = colorbrewer[name][3];
        return [rgb2hex(interpolateColor(hexToRgb(colors[0]), hexToRgb(colors[1]))), rgb2hex(interpolateColor(hexToRgb(colors[1]), hexToRgb(colors[2])))];
    } else if (nb_class > 9 && nb_class < 18) {
        var colors = colorbrewer[name][9],
            diff = nb_class - 9;
        return interp_n(colors, diff, 9);
    } else if (nb_class >= 18) {
        var colors = colorbrewer[name][9];
        colors = interp_n(colors, 8, 9);
        return interp_n(colors, nb_class - colors.length, nb_class);
    }
};

// Function to make color interpolation from "colors" (an array of n colors)
// to a larger array of "k" colors (using same start and stop than the original)
var interp_n = function interp_n(colors, diff, k) {
    var tmp = [],
        new_colors = [];
    for (var i = 0; i < diff; ++i) {
        tmp.push(rgb2hex(interpolateColor(hexToRgb(colors[i]), hexToRgb(colors[i + 1]))));
    }
    for (var i = 0; i < k; ++i) {
        new_colors.push(colors[i]);
        if (tmp[i]) new_colors.push(tmp[i]);
    }
    return new_colors;
};

function rgb2hex(rgb) {
    // Originally from  http://jsfiddle.net/mushigh/myoskaos/
    if (typeof rgb === "string") {
        if (rgb.indexOf("#") > -1 || rgb.indexOf("rgb") < 0) {
            return rgb;
        }
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return rgb && rgb.length === 4 ? "#" + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
    } else {
        return rgb && rgb.length === 3 ? "#" + ("0" + parseInt(rgb[0], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) : '';
    }
}

function hexToRgb(hex, out) {
    // Originally from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (out === 'string') {
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
var interpolateColor = function interpolateColor(color1, color2) {
    var factor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.5;

    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
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
    random: function random() {
        var result;
        var count = 0;
        for (var prop in this.names) {
            if (Math.random() < 1 / ++count) result = prop;
        }return result;
    }
};

var ColorsSelected = {
    // These colors came from "Pastel1" and "Pastel2" coloramps from ColorBrewer
    colorCodes: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc", "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"],
    seen: new Set(), // In order to avoid randomly returning the same color as the last one, at least for the first layers
    random: function random() {
        var to_rgb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        var nb_color = this.colorCodes.length,
            seen = this.seen,
            result_color = this.colorCodes[0],
            attempts = 40; // To avoid a while(true) if it went wrong for any reason
        if (seen.size == nb_color) seen = new Set();
        while (attempts > 0) {
            var ix = Math.round(Math.random() * (nb_color - 1));
            result_color = this.colorCodes[ix];
            if (!seen.has(result_color)) {
                seen.add(result_color);
                break;
            } else {
                --attempts;
            }
        }
        return to_rgb ? hexToRgb(result_color) : result_color;
    }
};
"use strict";

function ContextMenu() {

	this.items = new Array();

	this.addItem = function (item) {
		this.items.push({
			"isSimpleItem": true,
			"name": item["name"],
			"action": item.action
		});
	};

	this.addSubMenu = function (item) {
		this.items.push({
			"isSimpleItem": false,
			"name": item["name"],
			"menu": new ContextMenu()
		});
		this.items[this.items.length - 1]["menu"].setItems(item.items);
	};

	this.removeItemByName = function (name) {
		for (var i = items.length - 1; i > 0; i--) {
			if (this.items[i].name.valueOf() == name.valueOf()) {
				this.items.splice(i, 1);
				break;
			}
		}
	};

	this.setItems = function (items) {
		this.items = new Array();
		for (var i = 0; i < items.length; i++) {
			if (items[i]["name"]) {
				if (items[i].action) this.addItem(items[i]);else if (items[i].items) this.addSubMenu(items[i]);
			}
		}
	};

	this.showMenu = function (event, parent, items) {
		if (items) this.setItems(items);

		if (event.preventDefault) event.preventDefault();else event.returnValue = false;

		if (event.stopPropagation) event.stopPropagation();

		this.initMenu(parent);
		this.DOMObj.style.top = event.clientY + document.body.scrollTop + "px";
		this.DOMObj.style.left = event.clientX + "px";
		var self = this;
		var hideMenu = function hideMenu() {
			if (self.DOMObj && self.DOMObj.parentNode && self.DOMObj.parentNode.removeChild) {
				self.DOMObj.parentNode.removeChild(self.DOMObj);
			}
			self.onclick = undefined;
			document.removeEventListener("click", hideMenu);
		};
		setTimeout(function () {
			document.addEventListener("click", hideMenu);
		}, 150);
	};

	this.initMenu = function (parent) {
		if (this.DOMObj && this.DOMObj.parentNode && this.DOMObj.parentNode.removeChild) {
			this.DOMObj.parentNode.removeChild(this.DOMObj);
		}
		var self = this;
		var menu = document.createElement("div");
		menu.className = "context-menu";
		var list = document.createElement("ul");
		menu.appendChild(list);
		for (var i = 0; i < this.items.length; i++) {
			var item = document.createElement("li");
			list.appendChild(item);
			item.setAttribute("data-index", i);
			var name = document.createElement("span");
			name.className = "context-menu-item-name";
			name.textContent = this.items[i]["name"];
			item.appendChild(name);
			if (this.items[i].isSimpleItem) {
				item.onclick = function () {
					var ix = this.getAttribute("data-index");
					self.items[ix].action();
				};
			} else {
				var arrow = document.createElement("span");
				arrow.className = "arrow";
				arrow.innerHTML = "&#9658;";
				name.appendChild(arrow);
				this.items[i]["menu"].initMenu(item);
				this.items[i]["menu"].DOMObj.style.display = "none";
				item.onmouseover = function () {
					var _this = this;

					setTimeout(function () {
						_this.getElementsByClassName("context-menu")[0].style.display = "";
					}, 500);
				};
				item.onmouseout = function () {
					var _this2 = this;

					setTimeout(function () {
						_this2.getElementsByClassName("context-menu")[0].style.display = "none";
					}, 500);
				};
			}
		}
		this.DOMObj = menu;
		parent.appendChild(menu);
	};
}
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function getBreaks(values, type, nb_class) {
    var serie = new geostats(values),
        nb_class = +nb_class || Math.floor(1 + 3.3 * Math.log10(values.length)),
        breaks = [];
    if (type === "Q6") {
        var tmp = getBreaksQ6(serie.sorted());
        breaks = tmp.breaks;
        breaks[0] = serie.min();
        breaks[nb_class] = serie.max();
        serie.setClassManually(breaks);
    } else {
        var _func = discretiz_geostats_switch.get(type);
        breaks = serie[_func](nb_class);
    }
    return [serie, breaks, nb_class];
}

function discretize_to_size(values, type, nb_class, min_size, max_size) {
    var _getBreaks = getBreaks(values, type, nb_class);

    var _getBreaks2 = _slicedToArray(_getBreaks, 3);

    var serie = _getBreaks2[0];
    var breaks = _getBreaks2[1];
    var nb_class = _getBreaks2[2];

    var step = (max_size - min_size) / (nb_class - 1),
        class_size = Array(nb_class).fill(0).map(function (d, i) {
        return min_size + i * step;
    }),
        breaks_prop = [];

    for (var i = 0; i < breaks.length - 1; ++i) {
        breaks_prop.push([[breaks[i], breaks[i + 1]], class_size[i]]);
    }return [nb_class, type, breaks_prop, serie];
}

function discretize_to_colors(values, type, nb_class, col_ramp_name) {
    col_ramp_name = col_ramp_name || "Reds";

    var _getBreaks3 = getBreaks(values, type, nb_class);

    var _getBreaks4 = _slicedToArray(_getBreaks3, 3);

    var serie = _getBreaks4[0];
    var breaks = _getBreaks4[1];
    var nb_class = _getBreaks4[2];
    var color_array = getColorBrewerArray(nb_class, col_ramp_name);
    var sorted_values = serie.sorted();
    var colors_map = [];
    for (var j = 0; j < sorted_values.length; ++j) {
        var idx = serie.getClass(values[j]);
        colors_map.push(color_array[idx]);
    }
    return [nb_class, type, breaks, color_array, colors_map];
}

var display_discretization = function display_discretization(layer_name, field_name, nb_class, type, options) {
    var make_no_data_section = function make_no_data_section() {
        var section = d3.select("#color_div").append("div").attr("id", "no_data_section").append("p").html(i18next.t("disc_box.with_no_data", { nb_features: no_data }));

        section.append("input").attrs({ type: "color", value: "#ebebcd", id: "no_data_color" }).style("margin", "0px 10px");
    };

    var make_sequ_button = function make_sequ_button() {
        var col_div = d3.select("#color_div");
        col_div.selectAll('.color_params').remove();
        col_div.selectAll('.color_txt').remove();
        col_div.selectAll('.color_txt2').remove();
        col_div.selectAll('.central_class').remove();
        col_div.selectAll('.central_color').remove();
        col_div.selectAll('#reverse_pal_btn').remove();
        var sequential_color_select = col_div.insert("p").attr("class", "color_txt").html(i18next.t("disc_box.color_palette")).insert("select").attr("class", "color_params").on("change", function () {
            redisplay.draw();
        });

        ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(function (name) {
            sequential_color_select.append("option").text(name).attr("value", name);
        });
        var button_reverse = d3.select(".color_txt").insert("button").styles({ "display": "inline", "margin-left": "10px" }).attrs({ "class": "button_st3", "id": "reverse_pal_btn" }).html(i18next.t("disc_box.reverse_palette")).on("click", function () {
            to_reverse = true;
            redisplay.draw();
        });
    };

    var make_diverg_button = function make_diverg_button() {
        var col_div = d3.select("#color_div");
        col_div.selectAll('.color_params').remove();
        col_div.selectAll('.color_txt').remove();
        col_div.selectAll('.color_txt2').remove();
        col_div.selectAll('#reverse_pal_btn').remove();
        col_div.insert('p').attr("class", "central_class").html(i18next.t("disc_box.break_on")).insert("input").attrs({
            type: "number", class: "central_class", id: "centr_class",
            min: 1, max: nb_class - 1, step: 1, value: Math.round(nb_class / 2)
        }).style("width", "40px").on("change", function () {
            redisplay.draw();
        });

        var central_color = col_div.insert('p').attr("class", "central_color");
        central_color.insert("input").attr("type", "checkbox").on("change", function () {
            redisplay.draw();
        });
        central_color.select("input").node().checked = true;
        central_color.insert("label").html(i18next.t("disc_box.colored_central_class"));
        central_color.insert("input").attrs({ type: "color", id: "central_color_val", value: "#e5e5e5" }).style("margin", "0px 10px").on("change", function () {
            redisplay.draw();
        });

        var pal_names = ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'];
        var left_color_select = col_div.insert("p").attr("class", "color_txt").style("display", "inline").html(i18next.t("disc_box.left_colramp")).insert("select").attr("class", "color_params_left").on("change", function () {
            redisplay.draw();
        });
        var right_color_select = col_div.insert("p").styles({ display: "inline", "margin-left": "70px" }).attr("class", "color_txt2").html(i18next.t("disc_box.right_colramp")).insert("select").attr("class", "color_params_right").on("change", function () {
            redisplay.draw();
        });
        pal_names.forEach(function (name) {
            left_color_select.append("option").text(name).attr("value", name);
            right_color_select.append("option").text(name).attr("value", name);
        });
        document.getElementsByClassName("color_params_right")[0].selectedIndex = 14;
    };

    var make_box_histo_option = function make_box_histo_option() {
        var histo_options = newBox.append('div').attr("id", "histo_options").style("margin-left", "10px");

        var a = histo_options.append("p").style("margin", 0).style("display", "inline"),
            b = histo_options.append("p").style("margin", 0).style("display", "inline"),
            c = histo_options.append("p").style("margin", 0).style("display", "inline");

        a.insert("input").attrs({ type: "checkbox", value: "mean" }).on("change", function () {
            if (line_mean.classed("active")) {
                line_mean.style("stroke-width", 0);
                txt_mean.style("fill", "none");
                line_mean.classed("active", false);
            } else {
                line_mean.style("stroke-width", 2);
                txt_mean.style("fill", "red");
                line_mean.classed("active", true);
            }
        });

        b.insert("input").attrs({ type: "checkbox", value: "median" }).on("change", function () {
            if (line_median.classed("active")) {
                line_median.style("stroke-width", 0);
                txt_median.style("fill", "none");
                line_median.classed("active", false);
            } else {
                line_median.style("stroke-width", 2);
                txt_median.style("fill", "blue");
                line_median.classed("active", true);
            }
        });

        c.insert("input").attrs({ type: "checkbox", value: "std" }).on("change", function () {
            if (line_std_left.classed("active")) {
                line_std_left.style("stroke-width", 0);
                line_std_left.classed("active", false);
                line_std_right.style("stroke-width", 0);
                line_std_right.classed("active", false);
            } else {
                line_std_left.style("stroke-width", 2);
                line_std_left.classed("active", true);
                line_std_right.style("stroke-width", 2);
                line_std_right.classed("active", true);
            }
        });
        a.append("label_it_inline").attr("class", "label_it_inline").html(i18next.t("disc_box.disp_mean") + "<br>");
        b.append("label_it_inline").attr("class", "label_it_inline").html(i18next.t("disc_box.disp_median") + "<br>");
        c.append("label_it_inline").attr("class", "label_it_inline").html(i18next.t("disc_box.disp_sd") + "<br>");
    };

    var display_ref_histo = function display_ref_histo() {
        var svg_h = h / 7.25 > 75 ? h / 7.25 : 75,
            svg_w = w / 4.75,
            nb_bins = 51 < values.length / 3 ? 50 : Math.ceil(Math.sqrt(values.length)) + 1;

        nb_bins = nb_bins < 3 ? 3 : nb_bins;
        nb_bins = nb_bins > +values.length ? nb_bins : values.length;

        var margin = { top: 5, right: 7.5, bottom: 15, left: 22.5 },
            width = svg_w - margin.right - margin.left;
        height = svg_h - margin.top - margin.bottom;

        var ref_histo = newBox.append('div').attr("id", "ref_histo_box");
        ref_histo.append('p').style("margin", "auto").html('<b>' + i18next.t('disc_box.hist_ref_title') + '</b>');

        var svg_ref_histo = ref_histo.append("svg").attr("id", "svg_ref_histo").attr("width", svg_w + margin.left + margin.right).attr("height", svg_h + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear().domain([serie.min(), serie.max()]).rangeRound([0, width]);

        var data = d3.histogram().domain(x.domain()).thresholds(x.ticks(nb_bins))(values);

        var y = d3.scaleLinear().domain([0, d3.max(data, function (d) {
            return d.length;
        })]).range([height, 0]);

        var bar = svg_ref_histo.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", 1).attr("width", 1)
        //            .attr("width", x(data[1].x1) - x(data[1].x0))
        .attr("height", function (d) {
            return height - y(d.length);
        }).attr("transform", function (d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        }).styles({ fill: "beige", stroke: "black", "stroke-width": "0.4px" });

        svg_ref_histo.append("g").attr("class", "x_axis").style("font-size", "10px").attr("transform", "translate(0," + height + ")").call(d3.axisBottom().scale(x).ticks(4).tickFormat(formatCount)).selectAll("text").attr("y", 4).attr("x", -4).attr("dy", ".45em").attr("transform", "rotate(-40)").style("text-anchor", "end");

        svg_ref_histo.append("g").attr("class", "y_axis").style("font-size", "10px").call(d3.axisLeft().scale(y).ticks(5).tickFormat(formatCount));
    };

    var make_summary = function make_summary() {
        var content_summary = make_content_summary(serie);
        newBox.append("div").attr("id", "summary").style("font-size", "10px").style("float", "right").style("margin", "0px 10px").insert("p").html(["<b>", i18next.t("disc_box.summary"), "</b><br>", content_summary].join(""));
    };

    var redisplay = {
        compute: function compute(old_nb_class) {
            serie = new geostats(values);
            breaks = [];
            values = serie.sorted();

            if (type === "Q6") {
                var tmp = getBreaksQ6(values);
                stock_class = tmp.stock_class;
                breaks = tmp.breaks;
                breaks[0] = serie.min();
                breaks[nb_class] = serie.max();
                serie.setClassManually(breaks);
            } else if (type === "user_defined") {
                var tmp = getBreaks_userDefined(serie.sorted(), user_break_list);
                stock_class = tmp.stock_class;
                breaks = tmp.breaks;
                serie.setClassManually(breaks);
            } else {
                var _func = discretiz_geostats_switch.get(type);
                breaks = serie[_func](nb_class);
                serie.doCount();
                stock_class = Array.prototype.slice.call(serie.counter);
                if (stock_class.length == 0) {
                    return;
                }
            }
            // In order to avoid class limit falling out the serie limits with Std class :
            //            breaks[0] = breaks[0] < serie.min() ? serie.min() : breaks[0];
            //            ^^^ well finally not ?
            bins = [];
            for (var i = 0, len = stock_class.length, offset = 0; i < len; i++) {
                var bin = {};
                bin.val = stock_class[i] + 1;
                bin.offset = i == 0 ? 0 : bins[i - 1].width + bins[i - 1].offset;
                bin.width = breaks[i + 1] - breaks[i];
                bin.height = bin.val / (breaks[i + 1] - breaks[i]);
                bins[i] = bin;
            }
            return true;
        },
        draw: function draw(provided_colors) {
            // Clean-up previously made histogram :
            newBox.select("#svg_discretization").selectAll(".bar").remove();
            newBox.select("#svg_discretization").selectAll(".text_bar").remove();
            newBox.select("#svg_discretization").selectAll(".y_axis").remove();

            if (!provided_colors) {
                var col_scheme = newBox.select('.color_params_left').node() ? "diverging" : "sequential";
                console.log(color_array);
                if (col_scheme === "sequential") {
                    if (to_reverse) {
                        color_array = color_array.reverse();
                        to_reverse = false;
                    } else {
                        var selected_palette = document.querySelector('.color_params').value;
                        color_array = getColorBrewerArray(nb_class, selected_palette);
                        color_array = color_array.slice(0, nb_class);
                    }
                } else if (col_scheme === "diverging") {
                    var left_palette = document.querySelector('.color_params_left').value,
                        right_palette = document.querySelector('.color_params_right').value,
                        ctl_class_value = +document.getElementById('centr_class').value,
                        ctl_class_color = document.querySelector(".central_color > input").checked ? document.getElementById("central_color_val").value : [];

                    var class_right = nb_class - ctl_class_value + 1,
                        class_left = ctl_class_value - 1,
                        max_col_nb = Math.max(class_right, class_left),
                        right_pal = getColorBrewerArray(max_col_nb, right_palette),
                        left_pal = getColorBrewerArray(max_col_nb, left_palette);

                    left_pal = left_pal.slice(0, class_left).reverse();
                    right_pal = right_pal.slice(0, class_right);

                    color_array = [].concat(left_pal, ctl_class_color, right_pal);
                }
            } else {
                color_array = provided_colors.slice();
            }
            for (var i = 0, len = bins.length; i < len; ++i) {
                bins[i].color = color_array[i];
            }var x = d3.scaleLinear().domain([serie.min(), serie.max()]).range([0, svg_w]);

            var y = d3.scaleLinear().range([svg_h, 0]);

            x.domain([0, d3.max(bins.map(function (d) {
                return d.offset + d.width;
            }))]);
            y.domain([0, d3.max(bins.map(function (d) {
                return d.height + d.height / 5;
            }))]);

            var bar = svg_histo.selectAll(".bar").data(bins).enter().append("rect").attr("class", "bar").attr("id", function (d, i) {
                return "bar_" + i;
            }).attr("transform", "translate(0, -7.5)").style("fill", function (d) {
                return d.color;
            }).styles({ "opacity": 0.95, "stroke-opacity": 1 }).attr("x", function (d) {
                return x(d.offset);
            }).attr("width", function (d) {
                return x(d.width);
            }).attr("y", function (d) {
                return y(d.height) - margin.bottom;
            }).attr("height", function (d) {
                return svg_h - y(d.height);
            }).on("mouseover", function () {
                this.parentElement.querySelector("#text_bar_" + this.id.split('_')[1]).style.display = null;
            }).on("mouseout", function () {
                this.parentElement.querySelector("#text_bar_" + this.id.split('_')[1]).style.display = "none";
            });

            svg_histo.selectAll(".txt_bar").data(bins).enter().append("text").attr("dy", ".75em").attr("y", function (d) {
                return y(d.height) - margin.top * 2 - margin.bottom - 1.5;
            }).attr("x", function (d) {
                return x(d.offset + d.width / 2);
            }).attr("text-anchor", "middle").attr("class", "text_bar").attr("id", function (d, i) {
                return "text_bar_" + i;
            }).style("color", "black").style("cursor", "default").style("display", "none").text(function (d) {
                return formatCount(d.val);
            });

            svg_histo.append("g").attr("class", "y_axis").attr("transform", "translate(0, -" + (margin.top + margin.bottom) + ")").call(d3.axisLeft().scale(y).ticks(5).tickFormat(formatCount));

            document.getElementById("user_breaks_area").value = breaks.join(' - ');
            return true;
        }
    };

    //////////////////////////////////////////////////////////////////////////
    var formatCount = d3.formatLocale({
        decimal: getDecimalSeparator(),
        thousands: "",
        grouping: 3,
        currency: ["", ""]
    }).format('.2f');

    var newBox = d3.select("body").append("div").style("font-size", "12px").attr("id", "discretiz_charts").attr("title", [i18next.t("disc_box.title"), " - ", layer_name, " - ", field_name].join(''));

    if (result_data.hasOwnProperty(layer_name)) var db_data = result_data[layer_name];else if (user_data.hasOwnProperty(layer_name)) var db_data = user_data[layer_name];

    var color_array = [],
        nb_values = db_data.length,
        indexes = [],
        values = [],
        no_data;

    for (var i = 0; i < nb_values; i++) {
        if (db_data[i][field_name] != null) {
            values.push(+db_data[i][field_name]);
            indexes.push(i);
        }
    }

    if (nb_values == values.length) {
        no_data = 0;
    } else {
        no_data = nb_values - values.length;
        nb_values = values.length;
    }

    var serie = new geostats(values),
        breaks = [],
        stock_class = [],
        bins = [],
        user_break_list = null,
        max_nb_class = 22 < nb_values ? 22 : nb_values;

    if (serie.variance() == 0 && serie.stddev() == 0) {
        var serie = new geostats(values);
    }

    values = serie.sorted();
    //    serie.setPrecision(6);
    var available_functions = [[i18next.t("app_page.common.equal_interval"), "equal_interval"], [i18next.t("app_page.common.quantiles"), "quantiles"],
    //     [i18next.t("app_page.common.std_dev"), "std_dev"],
    [i18next.t("app_page.common.Q6"), "Q6"], [i18next.t("app_page.common.arithmetic_progression"), "arithmetic_progression"], [i18next.t("app_page.common.jenks"), "jenks"]];

    if (!serie._hasZeroValue() && !serie._hasZeroValue()) {
        available_functions.push([i18next.t("app_page.common.geometric_progression"), "geometric_progression"]);
    }

    var discretization = newBox.append('div').attr("id", "discretization_panel").insert("p").insert("select").attr("class", "params").on("change", function () {
        type = this.value;
        if (type === "Q6") {
            nb_class = 6;
            txt_nb_class.html(i18next.t("disc_box.class", { count: 6 }));
            document.getElementById("nb_class_range").value = 6;
        }
        redisplay.compute(nb_class);
        redisplay.draw();
    });

    available_functions.forEach(function (func) {
        discretization.append("option").text(func[0]).attr("value", func[1]);
    });

    var txt_nb_class = d3.select("#discretization_panel").insert("p").style("display", "inline").html(i18next.t("disc_box.class", { count: +nb_class })),
        disc_nb_class = d3.select("#discretization_panel").insert("input").styles({ display: "inline", width: "60px", "vertical-align": "middle", margin: "10px" }).attrs({ id: "nb_class_range", type: "range" }).attrs({ min: 2, max: max_nb_class, value: nb_class, step: 1 }).on("change", function () {
        type = discretization.node().value;
        var old_nb_class = nb_class;
        if (type === "Q6") {
            this.value = 6;
            return;
        }
        nb_class = +this.value;
        txt_nb_class.html(i18next.t("disc_box.class", { count: nb_class }));
        var ret_val = redisplay.compute(old_nb_class);
        if (!ret_val) {
            this.value = old_nb_class;
            txt_nb_class.html(i18next.t("disc_box.class", { count: +old_nb_class }));
        } else {
            redisplay.draw();
            var ctl_class = document.getElementById("centr_class");
            if (ctl_class) {
                ctl_class.max = nb_class;
                if (ctl_class > nb_class) ctl_class.value = Math.round(nb_class / 2);
            }
        }
    });

    discretization.node().value = type;
    make_box_histo_option();
    make_summary();
    display_ref_histo();

    var svg_h = h / 5 > 100 ? h / 5 : 100,
        svg_w = 760 < window.innerWidth - 40 ? 760 : window.innerWidth - 40,
        margin = { top: 7.5, right: 30, bottom: 7.5, left: 30 },
        height = svg_h - margin.top - margin.bottom;

    var div_svg = newBox.append('div').append("svg").attr("id", "svg_discretization").attr("width", svg_w + margin.left + margin.right).attr("height", svg_h + margin.top + margin.bottom);

    var svg_histo = div_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var overlay_svg = div_svg.append("g");

    var x = d3.scaleLinear().domain([serie.min(), serie.max()]).range([0, svg_w]);

    var mean_val = serie.mean(),
        stddev = serie.stddev();

    var line_mean = overlay_svg.append("line").attr("class", "line_mean").attr("x1", x(mean_val)).attr("y1", 10).attr("x2", x(mean_val)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "red", fill: "none" }).classed("active", false);

    var txt_mean = overlay_svg.append("text").attr("y", 0).attr("dy", "0.75em").attr("x", x(mean_val)).style("fill", "none").attr("text-anchor", "middle").text(i18next.t("disc_box.mean"));

    var line_median = overlay_svg.append("line").attr("class", "line_med").attr("x1", x(serie.median())).attr("y1", 10).attr("x2", x(serie.median())).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "blue", fill: "none" }).classed("active", false);

    var txt_median = overlay_svg.append("text").attr("y", 0).attr("dy", "0.75em").attr("x", x(serie.median())).style("fill", "none").attr("text-anchor", "middle").text(i18next.t("disc_box.median"));

    var line_std_left = overlay_svg.append("line").attr("class", "lines_std").attr("x1", x(mean_val - stddev)).attr("y1", 10).attr("x2", x(mean_val - stddev)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "grey", fill: "none" }).classed("active", false);

    var line_std_right = overlay_svg.append("line").attr("class", "lines_std").attr("x1", x(mean_val + stddev)).attr("y1", 10).attr("x2", x(mean_val + stddev)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "grey", fill: "none" }).classed("active", false);

    // As the x axis and the mean didn't change, they can be drawn only once :
    svg_histo.append("g").attr("class", "x_axis").attr("transform", "translate(0," + height + ")").call(d3.axisBottom().scale(x).tickFormat(formatCount));

    var accordion_colors = newBox.append("div").attrs({ id: "accordion_colors", class: "accordion_disc" });
    accordion_colors.append("h3").html(i18next.t("disc_box.title_color_scheme"));
    var color_scheme = d3.select("#accordion_colors").append("div").attr("id", "color_div").append("form_action");

    [[i18next.t("disc_box.sequential"), "sequential"], [i18next.t("disc_box.diverging"), "diverging"]].forEach(function (el) {
        color_scheme.insert("label").style("margin", "20px").html(el[0]).insert('input').attrs({
            type: "radio", name: "color_scheme", value: el[1], id: "button_" + el[1] }).on("change", function () {
            this.value === "sequential" ? make_sequ_button() : make_diverg_button();
            redisplay.draw();
        });
    });
    var to_reverse = false;
    document.getElementById("button_sequential").checked = true;

    var accordion_breaks = newBox.append("div").attrs({ id: "accordion_breaks_vals",
        class: "accordion_disc" });
    accordion_breaks.append("h3").html(i18next.t("disc_box.title_break_values"));

    var user_defined_breaks = accordion_breaks.append("div").attr("id", "user_breaks");

    user_defined_breaks.insert("textarea").attr("id", "user_breaks_area").style("width", "600px");

    user_defined_breaks.insert("button").text(i18next.t("app_page.common.valid")).on("click", function () {
        var old_nb_class = nb_class;
        user_break_list = document.getElementById("user_breaks_area").value;
        type = "user_defined";
        nb_class = user_break_list.split('-').length - 1;
        txt_nb_class.html(i18next.t("disc_box.class", { count: +nb_class }));
        document.getElementById("nb_class_range").value = nb_class;
        redisplay.compute(old_nb_class);
        redisplay.draw();
    });

    $(".accordion_disc").accordion({ collapsible: true, active: false, heightStyle: "content" });
    $("#accordion_colors").accordion({ collapsible: true, active: 0, heightStyle: "content" });

    if (no_data > 0) {
        make_no_data_section();
        if (options.no_data) {
            document.getElementById("no_data_color").value = options.no_data;
        }
    }

    if (!options.schema) {
        make_sequ_button();
    } else if (options.schema.length == 1) {
        make_sequ_button();
        document.querySelector(".color_params").value = options.schema[0];
    } else if (options.schema.length > 1) {
        make_diverg_button();
        document.getElementById("button_diverging").checked = true;
        var tmp = 0;
        document.querySelector(".color_params_left").value = options.schema[0];
        if (options.schema.length > 2) {
            document.getElementById("central_color_val").value = options.schema[1];
            tmp = 1;
            document.querySelector(".central_color").querySelector("input").checked = true;
        } else {
            document.querySelector(".central_color").querySelector("input").checked = false;
        }
        document.querySelector(".color_params_right").value = options.schema[1 + tmp];
    }

    redisplay.compute();
    redisplay.draw(options.colors);

    var deferred = Q.defer();
    $("#discretiz_charts").dialog({
        modal: true,
        resizable: true,
        width: svg_w + margin.top + margin.bottom + 90,
        height: window.innerHeight - 40,
        buttons: [{
            text: i18next.t("app_page.common.confirm"),
            click: function click() {
                var colors_map = [];
                var no_data_color = null;
                if (no_data > 0) {
                    no_data_color = document.getElementById("no_data_color").value;
                }
                for (var j = 0; j < db_data.length; ++j) {
                    var value = +db_data[j][field_name];
                    if (value) {
                        var idx = serie.getClass(+value);
                        colors_map.push(color_array[idx]);
                    } else {
                        colors_map.push(no_data_color);
                    }
                }
                var col_schema = [];
                if (!d3.select('.color_params_left').node()) {
                    col_schema.push(document.querySelector(".color_params").value);
                } else {
                    col_schema.push(document.querySelector(".color_params_left").value);
                    if (document.querySelector(".central_color").querySelector("input").checked) {
                        col_schema.push(document.getElementById("central_color_val").value);
                    }
                    col_schema.push(document.querySelector(".color_params_right").value);
                }
                deferred.resolve([nb_class, type, breaks, color_array, colors_map, col_schema, no_data_color]);
                $(this).dialog("close");
            }
        }, {
            text: i18next.t("app_page.common.cancel"),
            click: function click() {
                $(this).dialog("close");
                $(this).remove();
            }
        }],
        close: function close(event, ui) {
            $(this).dialog("destroy").remove();
            if (deferred.promise.isPending()) {
                deferred.resolve(false);
            }
        }
    });
    return deferred.promise;
};

function getBreaksQ6(serie) {
    var breaks = [],
        tmp = 0,
        j = undefined,
        len_serie = serie.length,
        stock_class = [],
        q6_class = [1, 0.05 * len_serie, 0.275 * len_serie, 0.5 * len_serie, 0.725 * len_serie, 0.95 * len_serie, len_serie];
    for (var i = 0; i < 7; ++i) {
        j = Math.round(q6_class[i]) - 1;
        breaks[i] = serie[j];
        stock_class.push(j - tmp);
        tmp = j;
    }
    stock_class.shift();
    return {
        breaks: breaks,
        stock_class: stock_class
    };
}

function getBreaks_userDefined(serie, breaks_list) {
    var separator = has_negative(serie) ? '- ' : '-',
        break_values = breaks_list.split(separator).map(function (el) {
        return +el.trim();
    }),
        len_serie = serie.length,
        j = 0,
        len_break_val = break_values.length,
        stock_class = new Array(len_break_val - 1);

    for (var i = 1; i < len_break_val; ++i) {
        var class_max = break_values[i];
        stock_class[i - 1] = 0;
        while (serie[j] <= class_max) {
            stock_class[i - 1] += 1;
            j++;
        }
    }
    return {
        breaks: break_values,
        stock_class: stock_class
    };
}

function fetch_categorical_colors() {
    var categ = document.querySelectorAll(".typo_class"),
        color_map = new Map();
    for (var i = 0; i < categ.length; i++) {
        var color = rgb2hex(categ[i].querySelector(".color_square").style.backgroundColor),
            new_name = categ[i].querySelector(".typo_name").value;
        color_map.set(categ[i].__data__.name, [color, new_name]);
    }
    return color_map;
}

function display_categorical_box(layer, field) {
    var nb_features = current_layers[layer].n_features,
        categories = new Map(),
        data_layer = user_data[layer],
        cats = [];

    for (var i = 0; i < nb_features; ++i) {
        var value = data_layer[i][field];
        var ret_val = categories.get(value);
        if (ret_val) categories.set(value, [ret_val[0] + 1, [i].concat(ret_val[1])]);else categories.set(value, [1, [i]]);
    }

    var nb_class = categories.size;

    categories.forEach(function (v, k) {
        cats.push({ name: k, nb_elem: v[0], color: Colors.names[Colors.random()] });
    });

    var newbox = d3.select("body").append("div").style("font-size", "10px").attrs({ id: "categorical_box",
        title: i18next.t("app_page.categorical_box.title", { layer: layer, nb_features: nb_features }) });
    newbox.append("h3").html("");
    newbox.append("p").html(i18next.t("app_page.symbol_typo_box.field_categ", { field: field, nb_class: +nb_class, nb_features: +nb_features }));

    newbox.append("ul").style("padding", "unset").attr("id", "sortable_typo_name").selectAll("li").data(cats).enter().append("li").styles({ margin: "auto", "list-style": "none" }).attr("class", "typo_class").attr("id", function (d, i) {
        return ["line", i].join('_');
    });

    newbox.selectAll(".typo_class").append("input").styles({ width: "140px", height: "auto", display: "inline-block", "vertical-align": "middle", "margin-right": "20px" }).attr("class", "typo_name").attr("value", function (d) {
        return d.name;
    }).attr("id", function (d) {
        return d.name;
    });

    newbox.selectAll(".typo_class").insert("p").attr("class", "color_square").style("background-color", function (d) {
        return d.color;
    }).style("margin", "auto").style("vertical-align", "middle").styles({ width: "22px", height: "22px", "border-radius": "10%", display: "inline-block" }).on("click", function () {
        var self = this;
        var this_color = self.style.backgroundColor;
        var input_col = document.createElement("input");
        input_col.setAttribute("type", "color");
        input_col.setAttribute("value", rgb2hex(this_color));
        input_col.className = "color_input";
        input_col.onchange = function (change) {
            self.style.backgroundColor = hexToRgb(change.target.value, "string");
        };
        var t = input_col.dispatchEvent(new MouseEvent("click"));
    });

    newbox.selectAll(".typo_class").insert("span").html(function (d) {
        return i18next.t("app_page.symbol_typo_box.count_feature", { nb_features: +d.nb_elem });
    });

    newbox.insert("p").insert("button").attr("class", "button_st3").html(i18next.t("app_page.categorical_box.new_random_colors")).on("click", function () {
        var lines = document.querySelectorAll(".typo_class");
        for (var _i = 0; _i < lines.length; ++_i) {
            lines[_i].querySelector(".color_square").style.backgroundColor = Colors.names[Colors.random()];
        }
    });

    $("#sortable_typo_name").sortable({
        placeholder: "ui-state-highlight",
        helper: 'clone' // Avoid propagation of the click event to the color button (if clicked on it the move the feature)
    });

    var deferred = Q.defer();
    $("#categorical_box").dialog({
        modal: true,
        resizable: true,
        buttons: [{
            text: i18next.t("app_page.common.confirm"),
            click: function click() {
                var color_map = fetch_categorical_colors();
                var colorByFeature = data_layer.map(function (ft) {
                    return color_map.get(ft[field])[0];
                });
                deferred.resolve([nb_class, color_map, colorByFeature]);
                $(this).dialog("close");
            }
        }, {
            text: i18next.t("app_page.common.cancel"),
            click: function click() {
                $(this).dialog("close");
                $(this).remove();
            }
        }],
        close: function close(event, ui) {
            d3.selectAll(".color_input").remove();
            $(this).dialog("destroy").remove();
            if (deferred.promise.isPending()) {
                deferred.resolve(false);
            }
        }
    });
    return deferred.promise;
}

var display_box_symbol_typo = function display_box_symbol_typo(layer, field) {
    var fetch_symbol_categories = function fetch_symbol_categories() {
        var categ = document.querySelectorAll(".typo_class"),
            symbol_map = new Map();
        for (var i = 0; i < categ.length; i++) {
            var selec = categ[i].querySelector(".symbol_section"),
                new_name = categ[i].querySelector(".typo_name").value;
            cats[i].new_name = new_name;
            if (selec.style.backgroundImage.length > 7) {
                var img = selec.style.backgroundImage.split("url(")[1].substring(1).slice(0, -2);
                var size = +categ[i].querySelector("#symbol_size").value;
                symbol_map.set(categ[i].__data__.name, [img, size, new_name]);
                cats[i].img = selec.style.backgroundImage;
            } else {
                symbol_map.set(categ[i].__data__.name, [null, 0, new_name]);
                cats[i].img = default_d_url;
            }
        }
        return symbol_map;
    };

    if (!window.default_symbols) {
        window.default_symbols = [];
        prepare_available_symbols();
    }
    var nb_features = current_layers[layer].n_features,
        categories = new Map(),
        data_layer = user_data[layer],
        cats = [];

    var res_symbols = window.default_symbols;

    var default_d_url = 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJmbGFnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjMycHgiIGhlaWdodD0iMzJweCIgdmlld0JveD0iMCAwIDU3OS45OTcgNTc5Ljk5NyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNTc5Ljk5NyA1NzkuOTk3IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggZmlsbD0icGFyYW0oZmlsbCkgIzAwMCIgZmlsbC1vcGFjaXR5PSJwYXJhbShmaWxsLW9wYWNpdHkpIiBzdHJva2U9InBhcmFtKG91dGxpbmUpICNGRkYiIHN0cm9rZS1vcGFjaXR5PSJwYXJhbShvdXRsaW5lLW9wYWNpdHkpIiBzdHJva2Utd2lkdGg9InBhcmFtKG91dGxpbmUtd2lkdGgpIDAiIGQ9Ik0yMzEuODQ2LDQ3Mi41NzJWMzEuODA2aC0yMi4xOHY0NDAuNTU3JiMxMDsmIzk7Yy0zNC4wMTYsMi42NDktNTkuNDE5LDE4Ljc2Ny01OS40MTksMzguODcxYzAsMjIuMDIxLDMwLjQ1NiwzOS4yNzEsNjkuMzM3LDM5LjI3MWMzOC44NzcsMCw2OS4zMzItMTcuMjUsNjkuMzMyLTM5LjI3MSYjMTA7JiM5O0MyODguOTE3LDQ5MS41OTUsMjY0LjY3NCw0NzUuNzY0LDIzMS44NDYsNDcyLjU3MnoiLz4KPHBvbHlnb24gZmlsbD0icGFyYW0oZmlsbCkgIzAwMCIgZmlsbC1vcGFjaXR5PSJwYXJhbShmaWxsLW9wYWNpdHkpIiBzdHJva2U9InBhcmFtKG91dGxpbmUpICNGRkYiIHN0cm9rZS1vcGFjaXR5PSJwYXJhbShvdXRsaW5lLW9wYWNpdHkpIiBzdHJva2Utd2lkdGg9InBhcmFtKG91dGxpbmUtd2lkdGgpIDAiIHBvaW50cz0iMjM1LjI0MywyOS40OTIgMjMzLjcyMywyMDcuNjI4IDQyOS43NDksMjEwLjMyOSAiLz4KPC9zdmc+")';

    if (categories.size == 0) {
        for (var i = 0; i < nb_features; ++i) {
            var value = data_layer[i][field];
            var ret_val = categories.get(value);
            if (ret_val) categories.set(value, [ret_val[0] + 1, [i].concat(ret_val[1])]);else categories.set(value, [1, [i]]);
        }
        categories.forEach(function (v, k) {
            cats.push({ name: k, new_name: k, nb_elem: v[0], img: default_d_url });
        });
    }
    var nb_class = categories.size;

    return function () {
        var newbox = d3.select("body").append("div").style("font-size", "10px").attrs({ id: "symbol_box",
            title: i18next.t("app_page.symbol_typo_box.title", { layer: layer, nb_features: nb_features }) });

        newbox.append("h3").html("");
        newbox.append("p").html(i18next.t("app_page.symbol_typo_box.field_categ", { field: field, nb_class: nb_class, nb_features: nb_features }));
        newbox.append("ul").style("padding", "unset").attr("id", "typo_categories").selectAll("li").data(cats).enter().append("li").styles({ margin: "auto", "list-style": "none" }).attr("class", "typo_class").attr("id", function (d, i) {
            return ["line", i].join('_');
        });

        newbox.selectAll(".typo_class").append("input").styles({ width: "100px", height: "auto", display: "inline-block", "vertical-align": "middle", "margin-right": "7.5px" }).attr("class", "typo_name").attr("value", function (d) {
            return d.new_name;
        }).attr("id", function (d) {
            return d.name;
        });

        newbox.selectAll(".typo_class").insert("p").attr("title", "Click me to choose a symbol!").attr("class", "symbol_section").style("margin", "auto").style("background-image", function (d) {
            return d.img;
        }).style("vertical-align", "middle").styles({ width: "32px", height: "32px", margin: "0px 1px 0px 1px",
            "border-radius": "10%", border: "1px dashed blue",
            display: "inline-block", "background-size": "32px 32px"
        }).on("click", function () {
            var self = this;
            box_choice_symbol(res_symbols).then(function (confirmed) {
                if (confirmed) {
                    self.style.backgroundImage = confirmed;
                }
            });
        });

        newbox.selectAll(".typo_class").insert("span").html(function (d) {
            return i18next.t("app_page.symbol_typo_box.count_feature", { nb_features: d.nb_elem });
        });

        newbox.selectAll(".typo_class").insert("input").attr("type", "number").attr("id", "symbol_size").style("width", "38px").style("display", "inline-block").attr("value", 32);

        newbox.selectAll(".typo_class").insert("span").style("display", "inline-block").html(" px");

        $("#typo_categories").sortable({
            placeholder: "ui-state-highlight",
            helper: 'clone' // Avoid propagation of the click event to the enclosed button
        });

        var deferred = Q.defer();
        $("#symbol_box").dialog({
            modal: true,
            resizable: true,
            buttons: [{
                text: i18next.t("app_page.common.confirm"),
                click: function click() {
                    var symbol_map = fetch_symbol_categories();
                    deferred.resolve([nb_class, symbol_map]);
                    $(this).dialog("close");
                }
            }, {
                text: i18next.t("app_page.common.cancel"),
                click: function click() {
                    $(this).dialog("close");
                    $(this).remove();
                }
            }],
            close: function close(event, ui) {
                d3.selectAll(".color_input").remove();
                $(this).dialog("destroy").remove();
                if (deferred.promise.isPending()) {
                    deferred.resolve(false);
                }
            }
        });
        return deferred.promise;
    };
};
"use strict";

var display_discretization_links_discont = function display_discretization_links_discont(layer_name, field_name, nb_class, type) {
    var make_box_histo_option = function make_box_histo_option() {
        var histo_options = newBox.append('div').attr("id", "histo_options");

        var a = histo_options.append("p").style("margin", 0).style("display", "inline");
        var b = histo_options.append("p").style("margin", 0).style("display", "inline");
        var c = histo_options.append("p").style("margin", 0).style("display", "inline");

        a.insert("input").attrs({ type: "checkbox", value: "mean" }).on("change", function () {
            if (line_mean.classed("active")) {
                line_mean.style("stroke-width", 0);
                txt_mean.style("fill", "none");
                line_mean.classed("active", false);
            } else {
                line_mean.style("stroke-width", 2);
                txt_mean.style("fill", "red");
                line_mean.classed("active", true);
            }
        });

        b.insert("input").attrs({ type: "checkbox", value: "median" }).on("change", function () {
            if (line_median.classed("active")) {
                line_median.style("stroke-width", 0);
                txt_median.style("fill", "none");
                line_median.classed("active", false);
            } else {
                line_median.style("stroke-width", 2);
                txt_median.style("fill", "blue");
                line_median.classed("active", true);
            }
        });

        c.insert("input").attrs({ type: "checkbox", value: "std" }).on("change", function () {
            if (line_std_left.classed("active")) {
                line_std_left.style("stroke-width", 0);
                line_std_left.classed("active", false);
                line_std_right.style("stroke-width", 0);
                line_std_right.classed("active", false);
            } else {
                line_std_left.style("stroke-width", 2);
                line_std_left.classed("active", true);
                line_std_right.style("stroke-width", 2);
                line_std_right.classed("active", true);
            }
        });
        a.append("label_it_inline").attr("class", "label_it_inline").html(i18next.t("disc_box.disp_mean") + "<br>");
        b.append("label_it_inline").attr("class", "label_it_inline").html(i18next.t("disc_box.disp_median") + "<br>");
        c.append("label_it_inline").attr("class", "label_it_inline").html(i18next.t("disc_box.disp_sd") + "<br>");
    };

    var display_ref_histo = function display_ref_histo() {
        var svg_h = h / 7.25 > 75 ? h / 7.25 : 75,
            svg_w = w / 4.75,
            nb_bins = 81 < values.length / 3 ? 80 : Math.ceil(Math.sqrt(values.length)) + 1;

        nb_bins = nb_bins < 3 ? 3 : nb_bins;
        nb_bins = nb_bins > values.length ? nb_bins : values.length;

        var margin = { top: 5, right: 7.5, bottom: 15, left: 22.5 },
            width = svg_w - margin.right - margin.left;
        height = svg_h - margin.top - margin.bottom;

        var ref_histo = newBox.append('div').attr("id", "ref_histo_box");
        ref_histo.append('p').style("margin", "auto").html(i18next.t("disc_box.hist_ref_title"));

        var svg_ref_histo = ref_histo.append("svg").attr("id", "svg_ref_histo").attr("width", svg_w + margin.left + margin.right).attr("height", svg_h + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear().domain([serie.min(), serie.max()]).rangeRound([0, width]);

        var data = d3.histogram().domain(x.domain()).thresholds(x.ticks(nb_bins))(values);

        var y = d3.scaleLinear().domain([0, d3.max(data, function (d) {
            return d.length;
        })]).range([height, 0]);

        var bar = svg_ref_histo.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", 1).attr("width", x(data[1].x1) - x(data[1].x0)).attr("height", function (d) {
            return height - y(d.length);
        }).attr("transform", function (d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        }).styles({ fill: "beige", stroke: "black", "stroke-width": "0.4px" });

        svg_ref_histo.append("g").attr("class", "x axis").style("font-size", "10px").attr("transform", "translate(0," + height + ")").call(d3.axisBottom().scale(x).ticks(4)).selectAll("text").attr("y", 4).attr("x", -4).attr("dy", ".45em").attr("transform", "rotate(-40)").style("text-anchor", "end");

        svg_ref_histo.append("g").attr("class", "y axis").style("font-size", "10px").call(d3.axisLeft().scale(y).ticks(5));
    };

    var make_summary = function make_summary() {
        var content_summary = make_content_summary(serie);
        newBox.append("div").attr("id", "summary").style("font-size", "10px").style("float", "right").styles({ "margin-left": "25px", "margin-right": "50px" }).insert("p").html(["<b>", i18next.t("disc_box.summary"), "</b><br>", content_summary].join(""));
    };

    var update_breaks = function update_breaks(user_defined) {
        if (!user_defined) {
            make_min_max_tableau(values, nb_class, type, last_min, last_max, "sizes_div");
        }
        var tmp_breaks = fetch_min_max_table_value("sizes_div");
        var len_breaks = tmp_breaks.sizes.length;
        breaks_info = [];
        last_min = tmp_breaks.sizes[0];
        last_max = tmp_breaks.sizes[tmp_breaks.sizes.length - 1];
        if (+tmp_breaks.mins[0] > +serie.min()) {
            nb_class += 1;
            txt_nb_class.html(i18next.t("disc_box.class", { count: nb_class }));
            breaks_info.push([[serie.min(), +tmp_breaks.mins[0]], 0]);
        }

        for (var i = 0; i < len_breaks; i++) {
            breaks_info.push([[tmp_breaks.mins[i], tmp_breaks.maxs[i]], tmp_breaks.sizes[i]]);
        }console.log(breaks_info);
        breaks = [breaks_info[0][0][0]].concat(breaks_info.map(function (ft) {
            return ft[0][1];
        }));
        if (user_defined) {
            make_min_max_tableau(null, nb_class, type, last_min, last_max, "sizes_div", breaks_info);
        }
    };

    var redisplay = {
        compute: function compute() {
            bins = [];
            for (var i = 0, len = breaks_info.length; i < len; i++) {
                var bin = {};
                bin.offset = i == 0 ? 0 : bins[i - 1].width + bins[i - 1].offset;
                bin.width = breaks[i + 1] - breaks[i];
                bin.height = breaks_info[i][1];
                bins[i] = bin;
            }
            return true;
        },
        draw: function draw() {
            // Clean-up previously made histogram :
            d3.select("#svg_discretization").selectAll(".bar").remove();
            d3.select("#svg_discretization").selectAll(".y.axis").remove();

            for (var i = 0, len = bins.length; i < len; ++i) {
                bins[i].color = ColorsSelected.random();
            }var x = d3.scaleLinear().domain([serie.min(), serie.max()]).range([0, svg_w]);

            var y = d3.scaleLinear().range([svg_h, 0]);

            x.domain([0, d3.max(bins.map(function (d) {
                return d.offset + d.width;
            }))]);
            y.domain([0, d3.max(bins.map(function (d) {
                return d.height + d.height / 5;
            }))]);

            var bar = svg_histo.selectAll(".bar").data(bins).enter().append("rect").attr("class", "bar").attr("transform", "translate(0, -17.5)").style("fill", function (d) {
                return d.color;
            }).styles({ "opacity": 0.5, "stroke-opacity": 1 }).attr("x", function (d) {
                return x(d.offset);
            }).attr("width", function (d) {
                return x(d.width);
            }).attr("y", function (d) {
                return y(d.height) - margin.bottom;
            }).attr("height", function (d) {
                return svg_h - y(d.height);
            });

            svg_histo.append("g").attr("class", "y axis").attr("transform", "translate(0, -" + (margin.top + margin.bottom) + ")").call(d3.axisLeft().scale(y).ticks(5));

            return true;
        }
    };

    //////////////////////////////////////////////////////////////////////////

    var formatCount = d3.formatLocale({
        decimal: getDecimalSeparator(),
        thousands: "",
        grouping: 3,
        currency: ["", ""]
    }).format('.2f');

    var newBox = d3.select("body").append("div").style("font-size", "12px").attr("id", "discretiz_charts").attr("title", [i18next.t("disc_box.title"), " - ", layer_name, " - ", field_name].join(''));

    if (result_data.hasOwnProperty(layer_name)) var db_data = result_data[layer_name];else if (user_data.hasOwnProperty(layer_name)) var db_data = user_data[layer_name];

    var color_array = [],
        nb_values = db_data.length,
        indexes = [],
        values = [],
        no_data;

    for (var i = 0; i < nb_values; i++) {
        if (db_data[i][field_name] != null) {
            values.push(+db_data[i][field_name]);
            indexes.push(i);
        }
    }

    if (nb_values == values.length) {
        no_data = 0;
    } else {
        no_data = nb_values - values.length;
        nb_values = values.length;
    }

    var serie = new geostats(values),
        breaks_info = [].concat(current_layers[layer_name].breaks),
        breaks = [+breaks_info[0][0][0]],
        stock_class = [],
        bins = [],
        max_nb_class = 22 < nb_values ? 22 : nb_values,
        sizes = current_layers[layer_name].breaks.map(function (el) {
        return el[1];
    }),
        last_min = min_fast(sizes),
        last_max = max_fast(sizes);

    breaks_info.forEach(function (elem) {
        breaks.push(elem[0][1]);
    });

    if (serie.variance() == 0 && serie.stddev() == 0) {
        var serie = new geostats(values);
    }

    values = serie.sorted();
    //    serie.setPrecision(6);
    var available_functions = [[i18next.t("app_page.common.equal_interval"), "equal_interval"], [i18next.t("app_page.common.quantiles"), "quantiles"],
    //     [i18next.t("app_page.common.std_dev"), "std_dev"],
    [i18next.t("app_page.common.Q6"), "Q6"], [i18next.t("app_page.common.arithmetic_progression"), "arithmetic_progression"], [i18next.t("app_page.common.jenks"), "jenks"]];

    if (!serie._hasZeroValue() && !serie._hasZeroValue()) {
        available_functions.push([i18next.t("app_page.common.geometric_progression"), "geometric_progression"]);
    }

    var discretization = newBox.append('div').attr("id", "discretization_panel").insert("p").html("Type ").insert("select").attr("class", "params").on("change", function () {
        type = this.value;
        if (type === "Q6") {
            nb_class = 6;
            txt_nb_class.html(i18next.t("disc_box.class", { count: nb_class }));
            document.getElementById("nb_class_range").value = 6;
        }
        update_breaks();
        redisplay.compute();
        redisplay.draw();
    });

    available_functions.forEach(function (func) {
        discretization.append("option").text(func[0]).attr("value", func[1]);
    });

    discretization.node().value = type;
    make_box_histo_option();
    make_summary();
    display_ref_histo();

    var txt_nb_class = d3.select("#discretization_panel").insert("p").style("display", "inline").html(i18next.t("disc_box.class", { count: +nb_class })),
        disc_nb_class = d3.select("#discretization_panel").insert("input").styles({ display: "inline", width: "60px", "vertical-align": "middle", margin: "10px" }).attrs({ id: "nb_class_range", type: "range" }).attrs({ min: 2, max: max_nb_class, value: nb_class, step: 1 }).on("change", function () {
        type = discretization.node().value;
        if (type == "user_defined") {
            type = "equal_interval";
            discretization.node().value = "equal_interval";
        }
        var old_nb_class = nb_class;
        if (type === "Q6") {
            this.value = 6;
            return;
        }
        nb_class = +this.value;
        txt_nb_class.html(i18next.t("disc_box.class", { count: nb_class }));
        update_breaks();
        redisplay.compute();
        redisplay.draw();
    });

    var svg_h = h / 5 > 90 ? h / 5 : 90,
        svg_w = w - w / 8,
        margin = { top: 17.5, right: 30, bottom: 7.5, left: 30 },
        height = svg_h - margin.top - margin.bottom;

    var div_svg = newBox.append('div').append("svg").attr("id", "svg_discretization").attr("width", svg_w + margin.left + margin.right).attr("height", svg_h + margin.top + margin.bottom);

    var svg_histo = div_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var overlay_svg = div_svg.append("g");

    var x = d3.scaleLinear().domain([serie.min(), serie.max()]).range([0, svg_w]);

    var mean_val = serie.mean(),
        median = serie.median(),
        stddev = serie.stddev();

    var line_mean = overlay_svg.append("line").attr("class", "line_mean").attr("x1", x(mean_val)).attr("y1", 10).attr("x2", x(mean_val)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "red", fill: "none" }).classed("active", false);

    var txt_mean = overlay_svg.append("text").attr("y", 0).attr("dy", "0.75em").attr("x", x(mean_val)).style("fill", "none").attr("text-anchor", "middle").text("Mean");

    var line_median = overlay_svg.append("line").attr("class", "line_med").attr("x1", x(median)).attr("y1", 10).attr("x2", x(median)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "blue", fill: "none" }).classed("active", false);

    var txt_median = overlay_svg.append("text").attr("y", 0).attr("dy", "0.75em").attr("x", x(median)).style("fill", "none").attr("text-anchor", "middle").text("Median");

    var line_std_left = overlay_svg.append("line").attr("class", "lines_std").attr("x1", x(mean_val - stddev)).attr("y1", 10).attr("x2", x(mean_val - stddev)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "grey", fill: "none" }).classed("active", false);

    var line_std_right = overlay_svg.append("line").attr("class", "lines_std").attr("x1", x(mean_val + stddev)).attr("y1", 10).attr("x2", x(mean_val + stddev)).attr("y2", svg_h - margin.bottom).styles({ "stroke-width": 0, stroke: "grey", fill: "none" }).classed("active", false);

    // As the x axis and the mean didn't change, they can be drawn only once :
    svg_histo.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(d3.axisBottom().scale(x));

    var box_content = newBox.append("div").attr("id", "box_content");
    box_content.append("h3").style("margin", "0").html(i18next.t("disc_box.line_size"));
    var sizes_div = d3.select("#box_content").append("div").attr("id", "sizes_div");
    make_min_max_tableau(null, nb_class, type, null, null, "sizes_div", breaks_info);
    box_content.append("p").insert("button").attr("class", "button_st3").html(i18next.t("disc_box.apply")).on("click", function () {
        discretization.node().value = type;
        update_breaks(true);
        redisplay.compute();
        redisplay.draw();
    });
    redisplay.compute();
    redisplay.draw();

    var deferred = Q.defer();
    $("#discretiz_charts").dialog({
        modal: true,
        resizable: true,
        width: +w - 10,
        height: +h + 60,
        buttons: [{
            text: i18next.t("app_page.common.confirm"),
            click: function click() {
                breaks[0] = serie.min();
                breaks[nb_class] = serie.max();
                deferred.resolve([serie, breaks_info, breaks]);
                $(this).dialog("close");
            }
        }, {
            text: i18next.t("app_page.common.cancel"),
            click: function click() {
                $(this).dialog("close");
                $(this).remove();
            }
        }],
        close: function close(event, ui) {
            $(this).dialog("destroy").remove();
            if (deferred.promise.isPending()) {
                deferred.resolve(false);
            }
        }
    });
    return deferred.promise;
};
"use strict";
"use strict";var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};function get_menu_option(func){var menu_option={"smooth":{"name":"smooth","title":i18next.t("app_page.func_title.smooth"),"menu_factory":"fillMenu_Stewart","fields_handler":"fields_Stewart"},"prop":{"name":"prop","title":i18next.t("app_page.func_title.prop"),"menu_factory":"fillMenu_PropSymbol","fields_handler":"fields_PropSymbol"},"choroprop":{"name":"choroprop","title":i18next.t("app_page.func_title.choroprop"),"menu_factory":"fillMenu_PropSymbolChoro","fields_handler":"fields_PropSymbolChoro"},"choro":{"name":"choro","title":i18next.t("app_page.func_title.choro"),"menu_factory":"fillMenu_Choropleth","fields_handler":"fields_Choropleth"},"cartogram":{"name":"cartogram","title":i18next.t("app_page.func_title.cartogram"),"menu_factory":"fillMenu_Anamorphose","fields_handler":"fields_Anamorphose","add_options":"keep_file"},"grid":{"name":"grid","title":i18next.t("app_page.func_title.grid"),"menu_factory":"fillMenu_griddedMap","fields_handler":"fields_griddedMap"},"flow":{"name":"flow","title":i18next.t("app_page.func_title.flow"),"menu_factory":"fillMenu_FlowMap","fields_handler":"fields_FlowMap"},"discont":{"name":"discont","title":i18next.t("app_page.func_title.discont"),"menu_factory":"fillMenu_Discont","fields_handler":"fields_Discont","add_options":"keep_file"},"typo":{"name":"typo","title":i18next.t("app_page.func_title.typo"),"menu_factory":"fillMenu_Typo","fields_handler":"fields_Typo"},"label":{"name":"label","title":i18next.t("app_page.func_title.label"),"menu_factory":"fillMenu_Label","fields_handler":"fields_Label"},"typosymbol":{"name":"typosymbol","title":i18next.t("app_page.func_title.typosymbol"),"menu_factory":"fillMenu_TypoSymbol","fields_handler":"fields_Symbol"}};return menu_option[func.toLowerCase()]||{};}function clean_menu_function(){var s2=section2.node();for(var i=s2.childElementCount-1;i>-1;i--){s2.removeChild(s2.childNodes[i]);}}/** Function trying to avoid layer name collision by adding a suffix
* to the layer name if already exists and incrementing it if necessary
* (MyLayer -> MyLayer_1 -> MyLayer_2 etc.)
*
* @param {string} name - The original wanted name of the layer to add
* @return {string} new_name - An available name to safely add the layer
*     (the input name if possible or a slightly modified
*        one to avoid collision or unwanted characters)
*/function check_layer_name(name){if(!current_layers.hasOwnProperty(name))return name;else{var i=1;if(name.match(/_\d+$/)){i=name.match(/\d+$/);name=name.substring(name,name.indexOf(i));return check_layer_name([name,parseInt(i)+1].join(''));}else{name=[name,i].join('_');return check_layer_name(name);}}}function box_choice_symbol(sample_symbols){var newbox=d3.select("body").append("div").style("font-size","10px").attrs({id:"box_choice_symbol",title:"Symbol selection"});newbox.append("h3").html(i18next.t("Symbol selection"));newbox.append("p").html(i18next.t("Select a symbol..."));var box_select=newbox.append("div").styles({width:"190px",height:"100px",overflow:"auto",border:"1.5px solid #1d588b"}).attr("id","symbols_select");box_select.selectAll("p").data(sample_symbols).enter().append("p").attr("id",function(d){return"p_"+d[0].replace(".svg","");}).attr("title",function(d){return d[0];}).html(function(d){return d[1];}).styles({width:"32px",height:"32px","margin":"auto",display:"inline-block"});box_select.selectAll("svg").attr("id",function(){return this.parentElement.id.slice(2);}).attrs({height:"32px",width:"32px"}).on("click",function(){box_select.selectAll("svg").each(function(){this.parentElement.style.border="";this.parentElement.style.padding="0px";});this.parentElement.style.padding="-1px";this.parentElement.style.border="1px dashed red";var svg_dataUrl=['url("data:image/svg+xml;base64,',btoa(new XMLSerializer().serializeToString(this)),'")'].join('');newbox.select("#current_symb").style("background-image",svg_dataUrl);});newbox.append("p").attr("display","inline").html(i18next.t("Or upload your symbol "));newbox.append("button").html("Browse").on("click",function(){var input=document.createElement('input');input.setAttribute("type","file");input.onchange=function(event){var file=event.target.files[0];var file_name=file.name;var reader=new FileReader();reader.onloadend=function(){var result=reader.result;var dataUrl_res=['url("',result,'")'].join('');newbox.select("#current_symb").style("background-image",dataUrl_res);};reader.readAsDataURL(file);};input.dispatchEvent(new MouseEvent("click"));});newbox.insert("p").html("Selected symbol :");newbox.insert("p").attr("id","current_symb").attr("class","symbol_section").style("margin","auto").style("background-image","url('')").style("vertical-align","middle").styles({width:"32px",height:"32px","border-radius":"10%",display:"inline-block","background-size":"32px 32px"});var deferred=Q.defer();$("#box_choice_symbol").dialog({modal:true,resizable:true,buttons:[{text:"Confirm",click:function click(){var res_url=newbox.select("#current_symb").style("background-image");deferred.resolve(res_url);$(this).dialog("close");}},{text:"Cancel",click:function click(){$(this).dialog("close");$(this).remove();}}],close:function close(event,ui){$(this).dialog("destroy").remove();if(deferred.promise.isPending()){deferred.resolve(false);}}});return deferred.promise;}function make_style_box_indiv_symbol(label_node){var current_options={size:label_node.getAttribute("width")};var ref_coords={x:+label_node.getAttribute("x")+ +current_options.size.slice(0,-2)/2,y:+label_node.getAttribute("y")+ +current_options.size.slice(0,-2)/2};var new_params={};var self=this;make_confirm_dialog("styleTextAnnotation","Label options").then(function(confirmed){if(!confirmed){label_node.setAttribute("width",current_options.size);label_node.setAttribute("height",current_options.size);label_node.setAttribute("x",ref_coords.x-+current_options.size.slice(0,-2)/2);label_node.setAttribute("y",ref_coords.y-+current_options.size.slice(0,-2)/2);}});var box_content=d3.select(".styleTextAnnotation").insert("div");box_content.append("p").html("Image size ").append("input").attrs({type:"number",id:"font_size",min:0,max:150,step:"any",value:+label_node.getAttribute("width").slice(0,-2)}).on("change",function(){var new_val=this.value+"px";label_node.setAttribute("width",new_val);label_node.setAttribute("height",new_val);label_node.setAttribute("x",ref_coords.x-+this.value/2);label_node.setAttribute("y",ref_coords.y-+this.value/2);});};var fields_Symbol={fill:function fill(layer){if(!layer)return;var fields_all=Object.getOwnPropertyNames(user_data[layer][0]),field_to_use=d3.select("#field_Symbol"),self=this;fields_all.forEach(function(field){field_to_use.append("option").text(field).attr("value",field);});d3.selectAll(".params").attr("disabled",null);field_to_use.on("change",function(){document.getElementById("yesTypoSymbols").disabled=true;self.box_typo=display_box_symbol_typo(layer,this.value);});self.box_typo=display_box_symbol_typo(layer,fields_all[0]);},unfill:function unfill(){unfillSelectInput(document.getElementById("field_Symbol"));d3.selectAll(".params").attr("disabled",true);},box_typo:undefined};function fillMenu_TypoSymbol(){var dv2=section2.append("p").attr("class","form-rendering");dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dv2.append("p").html(i18next.t("app_page.func_options.typosymbol.field")).insert('select').attrs({class:"params",id:"field_Symbol"});var rendering_params=void 0;dv2.insert('p').style("margin","auto").html("").append("button").attrs({id:"selec_Symbol",class:"button_disc params"}).styles({"font-size":"0.8em","text-align":"center"}).html(i18next.t("app_page.func_options.typosymbol.symbols_choice")).on("click",function(){swal({title:"",text:i18next.t("app_page.common.error_too_many_features"),type:"warning",showCancelButton:true,allowOutsideClick:false,confirmButtonColor:"#DD6B55",confirmButtonText:i18next.t("app_page.common.valid")+"!",cancelButtonText:i18next.t("app_page.common.cancel"),closeOnConfirm:true}).then(function(){fields_Symbol.box_typo().then(function(confirmed){if(confirmed){ok_button.attr("disabled",null);rendering_params={nb_cat:confirmed[0],symbols_map:confirmed[1],field:field_selec.node().value};}});},function(){return;});});dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","TypoSymbols_output_name");var ok_button=dv2.append("p").styles({"text-align":"right",margin:"auto"}).append('button').attr("disabled",true).attr('id','yesTypoSymbols').attr('class','button_st3').text(i18next.t('app_page.func_options.common.render')).on("click",function(){var new_name=document.getElementById("TypoSymbols_output_name").value;render_TypoSymbols(rendering_params,new_name);});d3.selectAll(".params").attr("disabled",true);}function render_TypoSymbols(rendering_params,new_name){var layer_name=Object.getOwnPropertyNames(user_data)[0];var field=rendering_params.field;var layer_to_add=check_layer_name(new_name.length>0&&/^\w+$/.test(new_name)?new_name:["Symbols",field,layer_name].join("_"));var new_layer_data=[];var ref_selection=document.getElementById(layer_name).querySelectorAll("path");var nb_ft=ref_selection.length;for(var i=0;i<nb_ft;i++){var ft=ref_selection[i].__data__;new_layer_data.push({Symbol_field:ft.properties[field],coords:path.centroid(ft)});}var context_menu=new ContextMenu(),getItems=function getItems(self_parent){return[{"name":i18next.t("app_page.common.edit_style"),"action":function action(){make_style_box_indiv_symbol(self_parent);}},{"name":i18next.t("app_page.common.delete"),"action":function action(){self_parent.style.display="none";}}];};map.append("g").attrs({id:layer_to_add,class:"layer"}).selectAll("image").data(new_layer_data).enter().insert("image").attr("x",function(d){return d.coords[0]-rendering_params.symbols_map.get(d.Symbol_field)[1]/2;}).attr("y",function(d){return d.coords[1]-rendering_params.symbols_map.get(d.Symbol_field)[1]/2;}).attr("width",function(d){return rendering_params.symbols_map.get(d.Symbol_field)[1]+"px";}).attr("height",function(d){return rendering_params.symbols_map.get(d.Symbol_field)[1]+"px";}).attr("xlink:href",function(d,i){return rendering_params.symbols_map.get(d.Symbol_field)[0];}).on("mouseover",function(){this.style.cursor="pointer";}).on("mouseout",function(){this.style.cursor="initial";}).on("contextmenu dblclick",function(){context_menu.showMenu(d3.event,document.querySelector("body"),getItems(this));}).call(drag_elem_geo);create_li_layer_elem(layer_to_add,nb_ft,["Point","symbol"],"result");current_layers[layer_to_add]={"n_features":current_layers[layer_name].n_features,"renderer":"TypoSymbols","symbols_map":rendering_params.symbols_map,"rendered_field":field,"is_result":true,"symbol":"image","ref_layer_name":layer_name};up_legends();zoom_without_redraw();switch_accordion_section();}var fields_Discont={fill:function fill(layer){if(!layer)return;var fields_num=type_col(layer,"number"),fields_all=Object.getOwnPropertyNames(user_data[layer][0]),field_discont=d3.select("#field_Discont"),field_id=d3.select("#field_id_Discont");if(fields_num.length==0){display_error_num_field();return;}fields_num.forEach(function(field){field_discont.append("option").text(field).attr("value",field);});fields_all.forEach(function(field){field_id.append("option").text(field).attr("value",field);});d3.selectAll(".params").attr("disabled",null);},unfill:function unfill(){unfillSelectInput(document.getElementById("field_Discont"));unfillSelectInput(document.getElementById("field_id_Discont"));d3.selectAll(".params").attr("disabled",true);}};function insert_legend_button(layer_name){var selec=d3.select("#sortable").select(['.',layer_name,' .layer_buttons'].join('')),inner_html=selec.node().innerHTML,const_delim=' <img src="/static/img/Inkscape_icons_zoom_fit_page.svg"',split_content=inner_html.split();selec.node().innerHTML=[split_content[0],button_legend,const_delim,split_content[1]].join('');}function fillMenu_Discont(){var dv2=section2.append("p").attr("class","form-rendering");dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});dv2.append('p').html(i18next.t("app_page.func_options.discont.field")).insert('select').attrs({class:'params',id:"field_Discont"});dv2.append('p').html(i18next.t("app_page.func_options.discont.id_field")).insert('select').attrs({class:'params',id:"field_id_Discont"});{(function(){var disc_kind=dv2.append('p').html(i18next.t("app_page.func_options.discont.type_discontinuity")).insert('select').attrs({class:'params',id:"kind_Discont"});[[i18next.t("app_page.func_options.discont.type_relative"),"rel"],[i18next.t("app_page.func_options.discont.type_absolute"),"abs"]].forEach(function(k){disc_kind.append("option").text(k[0]).attr("value",k[1]);});dv2.append('p').html(i18next.t("app_page.func_options.discont.nb_class")).insert('input').attrs({type:"number",class:'params',id:"Discont_nbClass",min:1,max:33,value:4}).style("width","50px");var disc_type=dv2.append('p').html(i18next.t("app_page.func_options.discont.discretization")).insert('select').attrs({'class':'params',"id":"Discont_discKind"});[[i18next.t("app_page.common.equal_interval"),"equal_interval"],[i18next.t("app_page.common.quantiles"),"quantiles"],//         [i18next.t("app_page.common.std_dev"), "std_dev"],
[i18next.t("app_page.common.Q6"),"Q6"],[i18next.t("app_page.common.arithmetic_progression"),"arithmetic_progression"],[i18next.t("app_page.common.jenks"),"jenks"]].forEach(function(field){disc_type.append("option").text(field[0]).attr("value",field[1]);});})();}dv2.append('p').html(i18next.t("app_page.func_options.discont.color")).insert('input').attrs({class:'params',id:"color_Discont",type:"color",value:ColorsSelected.random()});var uo_layer_name=dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","Discont_output_name");var ok_button=dv2.append("p").styles({"text-align":"right",margin:"auto"}).append('button').attr('id','yes').attr('class','params button_st3').text(i18next.t('app_page.func_options.common.render'));d3.selectAll(".params").attr("disabled",true);ok_button.on("click",function(){//            let p1 = new Promise(function(resolve, reject){
//                document.getElementById("overlay").style.display = "";
//                resolve(true);
//            });
//            p1.then(render_discont()
//            ).then(() => {
//                document.getElementById("overlay").style.display = "none";
//            })
// ^^^^^ Currently displaying the overlay during computation dont work as expected
document.getElementById("overlay").style.display="";render_discont();document.getElementById("overlay").style.display="none";// ^^^^^ Currently displaying the overlay during computation dont work as expected
});}var render_discont=function render_discont(){//    return new Promise(function(resolve, reject){
var layer=Object.getOwnPropertyNames(user_data)[0],field=document.getElementById("field_Discont").value,field_id=document.getElementById("field_id_Discont").value,min_size=1,max_size=10,threshold=1,disc_kind=document.getElementById("kind_Discont").value,nb_class=+document.getElementById("Discont_nbClass").value,user_color=document.getElementById("color_Discont").value,method=document.getElementById("kind_Discont").value,new_layer_name=document.getElementById("Discont_output_name").value;new_layer_name=new_layer_name.length>0&&/^\w+$/.test(new_layer_name)?check_layer_name(new_layer_name):check_layer_name(["Disc",layer,field,disc_kind].join('_'));var result_value=new Map(),result_geom={},topo_mesh=topojson.mesh,math_max=Math.max;// Use topojson.mesh a first time to compute the discontinuity value
// for each border (according to the given topology)
// (Discontinuities could also be computed relativly fastly server side
// which can be a better solution for large dataset..)
if(disc_kind=="rel")topo_mesh(_target_layer_file,_target_layer_file.objects[layer],function(a,b){if(a!==b){var new_id=[a.id,b.id].join('_'),new_id_rev=[b.id,a.id].join('_');if(!(result_value.get(new_id)||result_value.get(new_id_rev))){var value=math_max(a.properties[field]/b.properties[field],b.properties[field]/a.properties[field]);result_value.set(new_id,value);}}return false;});else topo_mesh(_target_layer_file,_target_layer_file.objects[layer],function(a,b){if(a!==b){var new_id=[a.id,b.id].join('_'),new_id_rev=[b.id,a.id].join('_');if(!(result_value.get(new_id)||result_value.get(new_id_rev))){var value=math_max(a.properties[field]-b.properties[field],b.properties[field]-a.properties[field]);result_value.set(new_id,value);}}return false;});var arr_disc=[],arr_tmp=[];var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=result_value.entries()[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var kv=_step.value;if(!isNaN(kv[1])){arr_disc.push(kv);arr_tmp.push(kv[1]);}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}arr_disc.sort(function(a,b){return a[1]-b[1];});arr_tmp.sort(function(a,b){return a-b;});var nb_ft=arr_tmp.length,step=(max_size-min_size)/(nb_class-1),class_size=Array(nb_class).fill(0).map(function(d,i){return min_size+i*step;});var disc_result=discretize_to_size(arr_tmp,document.getElementById("Discont_discKind").value,nb_class,min_size,max_size);if(!disc_result||!disc_result[2]){var opt_nb_class=Math.floor(1+3.3*Math.log10(nb_ft));var _w=nb_class>opt_nb_class?i18next.t("app_page.common.smaller"):i18next.t("app_page.common.larger");swal("",i18next.t("app_page.common.error_discretization",{arg:_w}),"error");return;}var serie=disc_result[3],breaks=disc_result[2].map(function(ft){return[ft[0],ft[1]];});var result_layer=map.append("g").attr("id",new_layer_name).styles({"stroke-linecap":"round","stroke-linejoin":"round"}).attr("class","result_layer layer");result_data[new_layer_name]=[];var data_result=result_data[new_layer_name],result_lyr_node=result_layer.node();// This is bad and should be replaced by somthing better as we are
// traversing the whole topojson again and again
// looking for each "border" from its "id" (though it isn't that slow)
//    let chunk_size = 450 > nb_ft ? nb_ft : 450,
//        _s = 0;
//
//    var compute = function(){
//        for(let i=_s; i<chunk_size; i++){
////            let id_ft = arr_disc[i][0],
////                val = arr_disc[i][1],
//            let [id_ft, val] = arr_disc[i],
//                p_size = class_size[serie.getClass(val)];
//            data_result.push({id: id_ft, disc_value: val, prop_value: p_size});
//            result_layer.append("path")
//                .datum(topo_mesh(_target_layer_file, _target_layer_file.objects[layer], function(a, b){
////                    let a_id = id_ft.split("_")[0], b_id = id_ft.split("_")[1];
//                    let [a_id, b_id] = id_ft.split("_");
//                    return a != b
//                        && (a.id == a_id && b.id == b_id || a.id == b_id && b.id == a_id); }))
//                .attrs({d: path, id: ["feature", i].join('_')})
//                .styles({stroke: user_color, "stroke-width": p_size, "fill": "transparent"})
//                .style("stroke-opacity", val >= threshold ? 1 : 0);
//            result_lyr_node.querySelector(["#feature", i].join('_')).__data__.properties = data_result[i];
//        }
//        _s = chunk_size;
//        if(_s < nb_ft){
//            chunk_size += 450;
//            if(chunk_size > nb_ft) chunk_size = nb_ft;
//            setTimeout(compute, 0);
//            return;
//        }
//    }
//
//    compute();
//    var datums = [];
var d_res=[];var compute=function compute(){var _loop=function _loop(i){var id_ft=arr_disc[i][0],val=arr_disc[i][1],p_size=class_size[serie.getClass(val)],datum=topo_mesh(_target_layer_file,_target_layer_file.objects[layer],function(a,b){var a_id=id_ft.split("_")[0],b_id=id_ft.split("_")[1];return a!=b&&(a.id==a_id&&b.id==b_id||a.id==b_id&&b.id==a_id);});d_res.push([val,{id:id_ft,disc_value:val,prop_value:p_size},datum,p_size]);};for(var i=0;i<nb_ft;i++){_loop(i);}};compute();d_res.sort(function(a,b){return b[0]-a[0];});for(var i=0;i<nb_ft;i++){var val=d_res[i][0];result_layer.append("path").datum(d_res[i][2]).attrs({d:path,id:["feature",i].join('_')}).styles({stroke:user_color,"stroke-width":d_res[i][3],"fill":"transparent"}).style("stroke-opacity",val>=threshold?1:0);data_result.push(d_res[i][1]);result_lyr_node.querySelector(["#feature",i].join('_')).__data__.properties=data_result[i];}current_layers[new_layer_name]={"renderer":"DiscLayer","breaks":breaks,"min_display":threshold,"type":"Line","rendered_field":field,"size":[0.5,10],"is_result":true,"fixed_stroke":true,"ref_layer_name":layer,"fill_color":{"single":user_color},"n_features":nb_ft};create_li_layer_elem(new_layer_name,nb_ft,["Line","discont"],"result");send_layer_server(new_layer_name,"/layers/add");up_legends();zoom_without_redraw();switch_accordion_section();//    resolve(true);
//});
};/**
* Send a geo result layer computed client-side (currently only discontinuities)
* to the server in order to use it as other result layers computed server side
* @param {string} layer_name
* @param {string} url
*/function send_layer_server(layer_name,url){var formToSend=new FormData();var JSON_layer=path_to_geojson(layer_name);formToSend.append("geojson",JSON_layer);formToSend.append("layer_name",layer_name);$.ajax({processData:false,contentType:false,url:url,data:formToSend,global:false,type:'POST',error:function error(_error){display_error_during_computation();console.log(_error);},success:function success(data){var key=JSON.parse(data).key;current_layers[layer_name].key_name=key;}});}var fields_FlowMap={fill:function fill(layer){if(joined_dataset.length>0&&document.getElementById("FlowMap_field_i").options.length==0){(function(){var fields=Object.getOwnPropertyNames(joined_dataset[0][0]),field_i=d3.select('#FlowMap_field_i'),field_j=d3.select('#FlowMap_field_j'),field_fij=d3.select('#FlowMap_field_fij');fields.forEach(function(field){field_i.append("option").text(field).attr("value",field);field_j.append("option").text(field).attr("value",field);field_fij.append("option").text(field).attr("value",field);});})();}if(layer){(function(){var ref_fields=Object.getOwnPropertyNames(user_data[layer][0]),join_field=d3.select('#FlowMap_field_join');ref_fields.forEach(function(field){join_field.append("option").text(field).attr("value",field);});})();}if(layer||joined_dataset.length>0)d3.selectAll(".params").attr("disabled",null);},unfill:function unfill(){var field_i=document.getElementById('FlowMap_field_i'),field_j=document.getElementById('FlowMap_field_j'),field_fij=document.getElementById('FlowMap_field_fij'),join_field=document.getElementById('FlowMap_field_join');for(var i=field_i.childElementCount-1;i>-1;--i){field_i.removeChild(field_i.children[i]);field_j.removeChild(field_j.children[i]);field_fij.removeChild(field_fij.children[i]);}unfillSelectInput(join_field);document.getElementById("FlowMap_discTable").innerHTML="";d3.selectAll(".params").attr("disabled",true);}};function make_min_max_tableau(values,nb_class,disc_kind,min_size,max_size,id_parent,breaks){document.getElementById(id_parent).innerHTML="";if(values&&breaks==undefined){var disc_result=discretize_to_size(values,disc_kind,nb_class,min_size,max_size);breaks=disc_result[2];if(!breaks)return false;}var parent_nd=d3.select("#"+id_parent);parent_nd.append("p").style("word-spacing","1.8em").html('Min - Max - Size');parent_nd.append("div").selectAll("p").data(breaks).enter().append("p").style("margin","0px").attr("class","breaks_vals").attr("id",function(d,i){return["line",i].join('_');});var selec=parent_nd.selectAll(".breaks_vals");for(var i=0;i<selec._groups[0].length;i++){var selection=parent_nd.select('#line_'+i);selection.insert('input').attr("type","number").attr("id","min_class").attr("step",0.1).attr("value",(+breaks[i][0][0]).toFixed(2)).style("width","60px");selection.insert('input').attr("type","number").attr("id","max_class").attr("step",0.1).attr("value",(+breaks[i][0][1]).toFixed(2)).style("width","60px");selection.insert('input').attr("type","number").attr("id","size_class").attr("step",0.11).attr("value",(+breaks[i][1]).toFixed(2)).style("margin-left","20px").style("width","55px");selection.insert('span').html(" px");}var mins=document.getElementById(id_parent).querySelectorAll("#min_class"),maxs=document.getElementById(id_parent).querySelectorAll("#max_class");for(var _i=0;_i<mins.length;_i++){if(_i>0){(function(){var prev_ix=_i-1;mins[_i].onchange=function(){maxs[prev_ix].value=this.value;};})();}if(_i<mins.length-1){(function(){var next_ix=_i+1;maxs[_i].onchange=function(){mins[next_ix].value=this.value;};})();}}}function fetch_min_max_table_value(parent_id){var parent_node=parent_id?document.getElementById(parent_id):current_functionnality.name=="flow"?document.getElementById("FlowMap_discTable"):current_functionnality.name=="discont"?document.getElementById("Discont_discTable"):null;if(!parent_node)return;var mins=Array.prototype.map.call(parent_node.querySelectorAll("#min_class"),function(el){return+el.value;}),maxs=Array.prototype.map.call(parent_node.querySelectorAll("#max_class"),function(el){return+el.value;}),sizes=Array.prototype.map.call(parent_node.querySelectorAll("#size_class"),function(el){return+el.value;}),nb_class=mins.length,comp_fun=function comp_fun(a,b){return a-b;};// Some verification regarding the input values provided by the user :
// - Values are ordered :
if(mins!=mins.sort(comp_fun)||maxs!=maxs.sort(comp_fun)||sizes!=sizes.sort(comp_fun)){swal("",i18next.t("app_page.common.error_values_order"),"error");return false;}return{"mins":mins.sort(comp_fun),"maxs":maxs.sort(comp_fun),"sizes":sizes.sort(comp_fun)};}function fillMenu_FlowMap(){var dv2=section2.append("p").attr("class","form-rendering");dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});dv2.append('p').html('<b>'+i18next.t("app_page.func_options.flow.subtitle1")+'</b>');var field_i=dv2.append('p').html('<b><i> i </i></b> field ').insert('select').attr('class','params').attr("id","FlowMap_field_i"),field_j=dv2.append('p').html('<b><i> j </i></b> field ').insert('select').attr('class','params').attr("id","FlowMap_field_j"),field_fij=dv2.append('p').html('<b><i> fij </i></b> field ').insert('select').attr('class','params').attr("id","FlowMap_field_fij");var disc_type=dv2.append('p').html(i18next.t("app_page.func_options.flow.discretization")).insert('select').attrs({class:'params',id:"FlowMap_discKind"});[[i18next.t("app_page.common.equal_interval"),"equal_interval"],[i18next.t("app_page.common.quantiles"),"quantiles"],//     [i18next.t("app_page.common.std_dev"), "std_dev"],
[i18next.t("app_page.common.Q6"),"Q6"],[i18next.t("app_page.common.arithmetic_progression"),"arithmetic_progression"],[i18next.t("app_page.common.jenks"),"jenks"]].forEach(function(field){disc_type.append("option").text(field[0]).attr("value",field[1]);});var nb_class_input=dv2.append('p').html(i18next.t("app_page.func_options.flow.nb_class")).insert('input').attrs({type:"number",class:'params',id:"FlowMap_nbClass",min:1,max:33,value:8}).style("width","50px");var values_fij;field_fij.on("change",function(){var name=this.value,nclass=nb_class_input.node().value,disc=disc_type.node().value,min_size=0.5,max_size=10;values_fij=joined_dataset[0].map(function(obj){return+obj[name];});make_min_max_tableau(values_fij,nclass,disc,min_size,max_size,"FlowMap_discTable");});disc_type.on("change",function(){var name=field_fij.node().value,nclass=nb_class_input.node().value,disc=this.value,min_size=0.5,max_size=10;if(disc=="Q6"){nclass=6;nb_class_input.attr("value",6);}make_min_max_tableau(values_fij,nclass,disc,min_size,max_size,"FlowMap_discTable");});nb_class_input.on("change",function(){var name=field_fij.node().value,nclass=this.value,disc=disc_type.node().value,min_size=0.5,max_size=10;make_min_max_tableau(values_fij,nclass,disc,min_size,max_size,"FlowMap_discTable");});dv2.append('p').attr("class","params").attr("id","FlowMap_discTable").html('');dv2.append('p').html('<b>Reference layer fields :</b>');var join_field=dv2.append('p').html('join field :').insert('select').attr('class','params').attr("id","FlowMap_field_join");var uo_layer_name=dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","FlowMap_output_name");var ok_button=dv2.append('button').attr('id','yes').attr('class','params button_st3').styles({"text-align":"right",margin:"auto"}).text(i18next.t('app_page.func_options.common.render'));d3.selectAll(".params").attr("disabled",true);ok_button.on("click",function(){var ref_layer=Object.getOwnPropertyNames(user_data)[0],name_join_field=join_field.node().value,formToSend=new FormData(),join_field_to_send={};var disc_params=fetch_min_max_table_value("FlowMap_discTable"),mins=disc_params.mins,maxs=disc_params.maxs,sizes=disc_params.sizes,nb_class=mins.length,user_breaks=[].concat(mins,maxs[nb_class-1]),min_size=min_fast(sizes),max_size=max_fast(sizes);join_field_to_send[name_join_field]=user_data[ref_layer].map(function(obj){return obj[name_join_field];});formToSend.append("json",JSON.stringify({"topojson":current_layers[ref_layer].key_name,"csv_table":JSON.stringify(joined_dataset[0]),"field_i":field_i.node().value,"field_j":field_j.node().value,"field_fij":field_fij.node().value,"join_field":join_field_to_send}));$.ajax({processData:false,contentType:false,url:'/compute/links',data:formToSend,type:'POST',error:function error(_error2){display_error_during_computation();console.log(_error2);},success:function success(data){var new_layer_name=add_layer_topojson(data,{result_layer_on_add:true});if(!new_layer_name)return;var layer_to_render=d3.select("#"+new_layer_name).selectAll("path"),fij_field_name=field_fij.node().value,fij_values=result_data[new_layer_name].map(function(obj){return+obj[fij_field_name];}),nb_ft=fij_values.length,serie=new geostats(fij_values);if(user_breaks[0]<serie.min())user_breaks[0]=serie.min();if(user_breaks[nb_class]>serie.max())user_breaks[nb_class]=serie.max();serie.setClassManually(user_breaks);current_layers[new_layer_name].fixed_stroke=true;current_layers[new_layer_name].renderer="Links";current_layers[new_layer_name].breaks=[];current_layers[new_layer_name].linksbyId=[];current_layers[new_layer_name].size=[min_size,max_size];current_layers[new_layer_name].rendered_field=fij_field_name;current_layers[new_layer_name].ref_layer_name=ref_layer;current_layers[new_layer_name].min_display=0;var links_byId=current_layers[new_layer_name].linksbyId;for(var i=0;i<nb_ft;++i){var val=+fij_values[i];links_byId.push([i,val,sizes[serie.getClass(val)]]);}for(var _i2=0;_i2<nb_class;++_i2){current_layers[new_layer_name].breaks.push([[user_breaks[_i2],user_breaks[_i2+1]],sizes[_i2]]);}layer_to_render.style('fill-opacity',0).style('stroke-opacity',0.75).style("stroke-width",function(d,i){return links_byId[i][2];});switch_accordion_section();}});});}var fields_Test={fill:function fill(layer){if(layer){(function(){d3.selectAll(".params").attr("disabled",null);var fields=type_col(layer,"number"),nb_features=user_data[layer].length,field_selec=d3.select("#Test_field");fields.forEach(function(field){field_selec.append("option").text(field).attr("value",field);});})();}},unfill:function unfill(){var field_selec=document.getElementById("#Test_field");unfillSelectInput(field_selec);d3.selectAll(".params").attr("disabled",true);}};var fields_PropSymbolChoro={fill:function fill(layer){if(!layer)return;d3.selectAll(".params").attr("disabled",null);var fields=type_col(layer,"number"),nb_features=user_data[layer].length,field1_selec=d3.select("#PropSymbolChoro_field_1"),field2_selec=d3.select("#PropSymbolChoro_field_2");if(fields.length==0){display_error_num_field();return;}fields.forEach(function(field){field1_selec.append("option").text(field).attr("value",field);field2_selec.append("option").text(field).attr("value",field);});field1_selec.on("change",function(){var field_name=this.value,max_val_field=max_fast(user_data[layer].map(function(obj){return+obj[field_name];})),ref_value_field=document.getElementById("PropSymbolChoro_ref_value");ref_value_field.setAttribute("max",max_val_field);ref_value_field.setAttribute("value",max_val_field);});setSelected(field1_selec.node(),fields[0]);},unfill:function unfill(){var field1_selec=document.getElementById("PropSymbolChoro_field_1"),field2_selec=document.getElementById("PropSymbolChoro_field_2");for(var i=field1_selec.childElementCount-1;i>=0;i--){field1_selec.removeChild(field1_selec.children[i]);field2_selec.removeChild(field2_selec.children[i]);}d3.selectAll(".params").attr("disabled",true);},rendering_params:{}};function fillMenu_PropSymbolChoro(layer){var rendering_params=fields_PropSymbolChoro.rendering_params,dv2=section2.append("p").attr("class","form-rendering");dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field1_selec=dv2.append('p').html(i18next.t("app_page.func_options.choroprop.field1")).insert('select').attrs({class:'params',id:'PropSymbolChoro_field_1'});var ref_size=dv2.append('p').style("display","inline").html(i18next.t("app_page.func_options.choroprop.fixed_size")).insert('input').attrs({type:'number',class:'params',id:'PropSymbolChoro_ref_size'}).attrs({min:0.1,max:66.0,value:15.0,step:"any"}).style("width","50px");dv2.append('label-item').html(' px');var ref_value=dv2.append('p').html(i18next.t("app_page.func_options.choroprop.on_value")).insert('input').styles({'width':'100px',"margin-left":"10px"}).attrs({type:'number',class:'params',id:'PropSymbolChoro_ref_value'}).attrs({min:0.1,step:0.1});// Other symbols could probably easily be proposed :
var symb_selec=dv2.append('p').html(i18next.t("app_page.func_options.choroprop.symbol_type")).insert('select').attr('class','params');[[i18next.t("app_page.func_options.common.symbol_circle"),"circle"],[i18next.t("app_page.func_options.common.symbol_square"),"rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value",symb[1]);});var field2_selec=dv2.append('p').html(i18next.t("app_page.func_options.choroprop.field2")).insert('select').attrs({class:'params',id:'PropSymbolChoro_field_2'}).on("change",function(){var field_name=this.value;if(rendering_params[field_name])d3.select("#propChoro_yes").attr("disabled",null);else d3.select("#propChoro_yes").attr("disabled",true);});dv2.insert('p').style("margin","auto").html("").append("button").attr('class','params button_disc').styles({"font-size":"0.8em","text-align":"center"}).html(i18next.t("app_page.func_options.common.discretization_choice")).on("click",function(){var layer=Object.getOwnPropertyNames(user_data)[0],selected_field=field2_selec.node().value,opt_nb_class=Math.floor(1+3.3*Math.log10(user_data[layer].length)),conf_disc_box=void 0;if(rendering_params[selected_field])conf_disc_box=display_discretization(layer,selected_field,rendering_params[selected_field].nb_class,rendering_params[selected_field].type,{schema:rendering_params[selected_field].schema,colors:rendering_params[selected_field].colors,no_data:rendering_params[selected_field].no_data});else conf_disc_box=display_discretization(layer,selected_field,opt_nb_class,"quantiles",{});conf_disc_box.then(function(confirmed){if(confirmed){dv2.select('#propChoro_yes').attr("disabled",null);rendering_params[selected_field]={nb_class:confirmed[0],type:confirmed[1],schema:confirmed[5],no_data:confirmed[6],breaks:confirmed[2],colors:confirmed[3],colorsByFeature:confirmed[4],renderer:"PropSymbolsChoro"};}else return;});});var uo_layer_name=dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","PropSymbolChoro_output_name");var ok_button=dv2.insert("p").styles({"text-align":"right",margin:"auto"}).append('button').attr('id','propChoro_yes').attr('class','button_st3').attr('disabled',true).text(i18next.t("app_page.func_options.common.render"));ok_button.on("click",function(){if(!ref_value.node().value)return;if(rendering_params[field2_selec.node().value]){var _layer=Object.getOwnPropertyNames(user_data)[0],nb_features=user_data[_layer].length,rd_params={},color_field=field2_selec.node().value,new_layer_name=uo_layer_name.node().value;new_layer_name=new_layer_name.length>0&&/^\w+$/.test(new_layer_name)?check_layer_name(new_layer_name):check_layer_name(_layer+"_PropSymbolsChoro");rd_params.field=field1_selec.node().value;rd_params.new_name=new_layer_name;rd_params.nb_features=nb_features;rd_params.ref_layer_name=_layer;rd_params.symbol=symb_selec.node().value;rd_params.ref_value=+ref_value.node().value;rd_params.ref_size=+ref_size.node().value;rd_params.fill_color=rendering_params[color_field]['colorsByFeature'];var id_map=make_prop_symbols(rd_params),colors_breaks=[];for(var i=rendering_params[color_field]['breaks'].length-1;i>0;--i){colors_breaks.push([[rendering_params[color_field]['breaks'][i-1]," - ",rendering_params[color_field]['breaks'][i]].join(''),rendering_params[color_field]['colors'][i-1]]);}var options_disc={schema:rendering_params[color_field].schema,colors:rendering_params[color_field].colors,no_data:rendering_params[color_field].no_data};current_layers[new_layer_name]={renderer:"PropSymbolsChoro",features_order:id_map,symbol:rd_params.symbol,ref_layer_name:_layer,options_disc:options_disc,rendered_field:field1_selec.node().value,rendered_field2:field2_selec.node().value,size:[+ref_value.node().value,+ref_size.node().value],"stroke-width-const":1,fill_color:{"class":id_map.map(function(obj){return obj[3];})},colors_breaks:colors_breaks,is_result:true,n_features:nb_features};zoom_without_redraw();switch_accordion_section();}});d3.selectAll(".params").attr("disabled",true);}function display_error_num_field(){swal({title:"",text:i18next.t("app_page.common.error_numerical_fields"),type:"error"});};var fields_Choropleth={fill:function fill(layer){if(!layer)return;var g_lyr_name="#"+layer,fields=type_col(layer,"number"),field_selec=d3.select("#choro_field_1");if(fields.length===0){display_error_num_field();return;}fields.forEach(function(field){field_selec.append("option").text(field).attr("value",field);});field_selec.on("change",function(){document.getElementById("Choro_output_name").value=["Choro",this.value,layer].join('_');});d3.selectAll(".params").attr("disabled",null);},unfill:function unfill(){var field_selec=document.getElementById("choro_field_1"),nb_fields=field_selec.childElementCount;for(var i=nb_fields-1;i>-1;--i){//            delete this.rendering_params[field_selec.children[i]];
field_selec.removeChild(field_selec.children[i]);}d3.selectAll(".params").attr("disabled",true);},rendering_params:{}};var fields_Typo={fill:function fill(layer){if(!layer)return;var g_lyr_name="#"+layer,fields=type_col(layer),fields_name=Object.getOwnPropertyNames(fields),field_selec=d3.select("#Typo_field_1");fields_name.forEach(function(f_name){if(f_name!='_uid'&&f_name!="UID")field_selec.append("option").text(f_name).attr("value",f_name);});field_selec.on("change",function(){document.getElementById("Typo_output_name").value=["Typo",this.value,layer].join('_');});d3.selectAll(".params").attr("disabled",null);},unfill:function unfill(){var field_selec=document.getElementById("Typo_field_1"),nb_fields=field_selec.childElementCount;for(var i=nb_fields-1;i>-1;--i){field_selec.removeChild(field_selec.children[i]);}d3.selectAll(".params").attr("disabled",true);}};var fields_Label={fill:function fill(layer){if(!layer)return;var g_lyr_name="#"+layer,fields=type_col(layer),fields_name=Object.getOwnPropertyNames(fields),field_selec=d3.select("#Label_field_1"),field_prop_selec=d3.select("#Label_field_prop");fields_name.forEach(function(f_name){field_selec.append("option").text(f_name).attr("value",f_name);if(fields[f_name]=="number")field_prop_selec.append("option").text(f_name).attr("value",f_name);});document.getElementById("Label_output_name").value="Labels_"+layer;d3.selectAll(".params").attr("disabled",null);},unfill:function unfill(){var field_selec=document.getElementById("Label_field_1"),nb_fields=field_selec.childElementCount;for(var i=nb_fields-1;i>-1;--i){field_selec.removeChild(field_selec.children[i]);}d3.selectAll(".params").attr("disabled",true);}};var fillMenu_Label=function fillMenu_Label(){var dv2=section2.append("p").attr("class","form-rendering"),rendering_params={};dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dv2.append('p').html(i18next.t("app_page.func_options.label.field")).insert('select').attr('class','params').attr('id','Label_field_1');var prop_selec=dv2.append('p').html(i18next.t("app_page.func_options.label.prop_labels")).insert("input").attr("type","checkbox").on("change",function(){var display_style=this.checked?"initial":"none";prop_menu.style("display",display_style);});var prop_menu=dv2.append("div");var field_prop_selec=prop_menu.append("p").html("Proportional values field ").insert('select').attr('class','params').attr('id','Label_field_prop');var max_font_size=prop_menu.append("p").html("Maximum font size ").insert("input").attr("type","number").attrs({min:0,max:70,value:11,step:"any"});var ref_font_size=dv2.append("p").html(i18next.t("app_page.func_options.label.font_size")).insert("input").attr("type","number").attrs({min:0,max:35,value:9,step:"any"});var choice_font=dv2.append("p").html(i18next.t("app_page.func_options.label.font_type")).insert("select").attr("class","params").attr("id","Label_font_name");available_fonts.forEach(function(name){choice_font.append("option").attr("value",name[1]).text(name[0]);});var choice_color=dv2.append("p").html(i18next.t("app_page.func_options.label.color")).insert("input").attr("type","color").attr("class","params").attr("id","Label_color").attr("value","#000");prop_menu.style("display","none");var uo_layer_name=dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","Label_output_name");dv2.insert("p").styles({"text-align":"right",margin:"auto"}).append("button").attr('id','Label_yes').attr('class','button_st3').html(i18next.t("app_page.func_options.common.render")).on("click",function(){rendering_params["label_field"]=field_selec.node().value;if(prop_selec.node().checked){rendering_params["prop_field"]=field_prop_selec.node().value;rendering_params["max_size"]=max_font_size.node().value;}var output_name=uo_layer_name.node().value;if(!/^\w+$/.test(output_name)){output_name="";}rendering_params["font"]=choice_font.node().value;rendering_params["ref_font_size"]=ref_font_size.node().value;rendering_params["color"]=choice_color.node().value;rendering_params["uo_layer_name"]=output_name;var layer=Object.getOwnPropertyNames(user_data)[0];var new_layer_name=render_label(layer,rendering_params);binds_layers_buttons(new_layer_name);switch_accordion_section();});d3.selectAll(".params").attr("disabled",true);};var drag_elem_geo=d3.drag().subject(function(){var t=d3.select(this);return{x:t.attr("x"),y:t.attr("y")};}).on("start",function(){d3.event.sourceEvent.stopPropagation();d3.event.sourceEvent.preventDefault();if(map_div.select("#hand_button").classed("active"))zoom.on("zoom",null);}).on("end",function(){if(map_div.select("#hand_button").classed("active"))zoom.on("zoom",zoom_without_redraw);}).on("drag",function(){d3.select(this).attr("x",d3.event.x).attr("y",d3.event.y);});function make_style_box_indiv_label(label_node){var current_options={size:label_node.style.fontSize,content:label_node.textContent,font:"",color:label_node.style.fill};if(current_options.color.startsWith("rgb"))current_options.color=rgb2hex(current_options.color);var new_params={};var self=this;make_confirm_dialog("styleTextAnnotation",i18next.t("app_page.func_options.label.title_box_indiv")).then(function(confirmed){if(!confirmed){label_node.style.fontsize=current_options.size;label_node.textContent=current_options.content;label_node.style.fill=current_options.color;}});var box_content=d3.select(".styleTextAnnotation").insert("div");box_content.append("p").html(i18next.t("app_page.func_options.label.font_size")).append("input").attrs({type:"number",id:"font_size",min:0,max:34,step:"any",value:+label_node.style.fontSize.slice(0,-2)}).on("change",function(){label_node.style.fontSize=this.value+"px";});box_content.append("p").html(i18next.t("app_page.func_options.label.content")).append("input").attrs({"value":label_node.textContent,id:"label_content"}).on("keyup",function(){label_node.textContent=this.value;});box_content.append("p").html(i18next.t("app_page.func_options.common.color")).append("input").attrs({"type":"color","value":rgb2hex(label_node.style.fill),id:"label_color"}).on("change",function(){label_node.style.fill=this.value;});};var render_label=function render_label(layer,rendering_params){var label_field=rendering_params.label_field;var txt_color=rendering_params.color;var selected_font=rendering_params.font;var font_size=rendering_params.ref_font_size+"px";var new_layer_data=[];var ref_selection=document.getElementById(layer).querySelectorAll("path");var layer_to_add=rendering_params.uo_layer_name&&rendering_params.uo_layer_name.length>0?check_layer_name(rendering_params.uo_layer_name):check_layer_name("Labels_"+layer);var nb_ft=ref_selection.length;for(var i=0;i<nb_ft;i++){var ft=ref_selection[i].__data__;new_layer_data.push({label:ft.properties[label_field],coords:path.centroid(ft)});}var context_menu=new ContextMenu(),getItems=function getItems(self_parent){return[{"name":i18next.t("app_page.common.edit_style"),"action":function action(){make_style_box_indiv_label(self_parent);}},{"name":i18next.t("app_page.common.delete"),"action":function action(){self_parent.style.display="none";}}];};map.append("g").attrs({id:layer_to_add,class:"layer result_layer"}).selectAll("text").data(new_layer_data).enter().insert("text").attr("id",function(d,i){return"Feature_"+i;}).attr("x",function(d){return d.coords[0];}).attr("y",function(d){return d.coords[1];}).attrs({"alignment-baseline":"middle","text-anchor":"middle"}).styles({"font-size":font_size,fill:txt_color}).text(function(d){return d.label;}).on("mouseover",function(){this.style.cursor="pointer";}).on("mouseout",function(){this.style.cursor="initial";}).on("dblclick contextmenu",function(){context_menu.showMenu(d3.event,document.querySelector("body"),getItems(this));}).call(drag_elem_geo);create_li_layer_elem(layer_to_add,nb_ft,["Point","label"],"result");current_layers[layer_to_add]={"n_features":current_layers[layer].n_features,"renderer":"Label","symbol":"text","fill_color":txt_color,"rendered_field":label_field,"is_result":true,"ref_layer_name":layer,"default_size":font_size};up_legends();zoom_without_redraw();return layer_to_add;};var fillMenu_Typo=function fillMenu_Typo(){var dv2=section2.append("p").attr("class","form-rendering"),rendering_params={};dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dv2.append('p').html(i18next.t("app_page.func_options.typo.color_choice")).insert('select').attr('class','params').attr('id','Typo_field_1');dv2.insert('p').style("margin","auto").html("").append("button").attrs({id:"Typo_class",class:"button_disc params"}).styles({"font-size":"0.8em","text-align":"center"}).html(i18next.t("app_page.func_options.typo.color_choice")).on("click",function(){var layer=Object.getOwnPropertyNames(user_data)[0];var selected_field=field_selec.node().value;var new_layer_name=check_layer_name([layer,"Typo",selected_field].join('_'));display_categorical_box(layer,selected_field).then(function(confirmed){if(confirmed){d3.select("#Typo_yes").attr("disabled",null);rendering_params={nb_class:confirmed[0],color_map:confirmed[1],colorByFeature:confirmed[2],renderer:"Categorical",rendered_field:selected_field,new_name:new_layer_name};}});});var uo_layer_name=dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","Typo_output_name");dv2.insert("p").styles({"text-align":"right",margin:"auto"}).append("button").attr('id','Typo_yes').attr("disabled",true).attr('class','button_st3').html(i18next.t("app_page.func_options.common.render")).on("click",function(){if(rendering_params){var layer=Object.getOwnPropertyNames(user_data)[0],output_name=uo_layer_name.node().value;if(output_name.length>0&&/^\w+$/.test(output_name)){rendering_params.new_name=check_layer_name(output_name);}else{rendering_params.new_name=check_layer_name([layer,"Typo",field_selec.node().value].join('_'));}render_categorical(layer,rendering_params);switch_accordion_section();}});d3.selectAll(".params").attr("disabled",true);};function fillMenu_Choropleth(){var dv2=section2.append("p").attr("class","form-rendering");var rendering_params=fields_Choropleth.rendering_params;dv2.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dv2.append('p').html(i18next.t("app_page.func_options.common.field")).insert('select').attr('class','params').attr('id','choro_field_1').on("change",function(){var field_name=this.value;if(rendering_params[field_name])d3.select("#choro_yes").attr("disabled",null);else d3.select("#choro_yes").attr("disabled",true);});dv2.insert('p').style("margin","auto").html("").append("button").attrs({id:"choro_class",class:"button_disc params"}).styles({"font-size":"0.8em","text-align":"center"}).html(i18next.t("app_page.func_options.common.discretization_choice")).on("click",function(){var layer_name=Object.getOwnPropertyNames(user_data)[0],selected_field=field_selec.node().value,opt_nb_class=Math.floor(1+3.3*Math.log10(user_data[layer_name].length)),conf_disc_box=void 0;if(rendering_params[selected_field])conf_disc_box=display_discretization(layer_name,selected_field,rendering_params[selected_field].nb_class,rendering_params[selected_field].type,{schema:rendering_params[selected_field].schema,colors:rendering_params[selected_field].colors,no_data:rendering_params[selected_field].no_data});else conf_disc_box=display_discretization(layer_name,selected_field,opt_nb_class,"quantiles",{});conf_disc_box.then(function(confirmed){if(confirmed){d3.select("#choro_yes").attr("disabled",null);rendering_params[selected_field]={nb_class:confirmed[0],type:confirmed[1],breaks:confirmed[2],colors:confirmed[3],schema:confirmed[5],no_data:confirmed[6],colorsByFeature:confirmed[4],renderer:"Choropleth",rendered_field:selected_field,new_name:""};}});});dv2.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","Choro_output_name");dv2.insert("p").styles({"text-align":"right",margin:"auto"}).append("button").attr('id','choro_yes').attr("disabled",true).attr('class','button_st3').html('Render').on("click",function(){if(rendering_params){var layer=Object.getOwnPropertyNames(user_data)[0],user_new_layer_name=document.getElementById("Choro_output_name").value,field_to_render=field_selec.node().value;rendering_params[field_to_render].new_name=check_layer_name(user_new_layer_name.length>0&&/^\w+$/.test(user_new_layer_name)?user_new_layer_name:["Choro",field_to_render,layer].join('_'));render_choro(layer,rendering_params[field_to_render]);switch_accordion_section();}});d3.selectAll(".params").attr("disabled",true);}var get_first_guess_span=function get_first_guess_span(){var bbox=_target_layer_file.bbox,abs=Math.abs;var width_km=haversine_dist([bbox[0],abs(bbox[3])-abs(bbox[1])],[bbox[2],abs(bbox[3])-abs(bbox[1])]),height_km=haversine_dist([abs(bbox[2])-abs(bbox[0]),bbox[1]],[abs(bbox[2])-abs(bbox[0]),bbox[3]]);return Math.round((width_km+height_km)/2*0.02);};var fields_Stewart={fill:function fill(layer){var other_layers=get_other_layer_names(),mask_selec=d3.select("#stewart_mask"),default_selected_mask=void 0;unfillSelectInput(mask_selec.node());mask_selec.append("option").text("None").attr("value","None");var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=other_layers[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var lyr_name=_step2.value;if(current_layers[lyr_name].type==="Polygon"){mask_selec.append("option").text(lyr_name).attr("value",lyr_name);if(current_layers[lyr_name].targeted){default_selected_mask=lyr_name;}}}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}if(default_selected_mask)setSelected(mask_selec.node(),default_selected_mask);if(layer){var _ret8=function(){var fields=type_col(layer,"number"),field_selec=d3.select("#stewart_field"),field_selec2=d3.select("#stewart_field2");if(fields.length==0){display_error_num_field();return{v:void 0};}field_selec2.append("option").text(" ").attr("value","None");fields.forEach(function(field){field_selec.append("option").text(field).attr("value",field);field_selec2.append("option").text(field).attr("value",field);});document.getElementById("stewart_span").value=get_first_guess_span();field_selec.on("change",function(){document.getElementById("stewart_output_name").value=["Smoothed",this.value,layer].join('_');});}();if((typeof _ret8==="undefined"?"undefined":_typeof(_ret8))==="object")return _ret8.v;}d3.selectAll(".params").attr("disabled",null);},unfill:function unfill(){var field_selec=document.getElementById("stewart_field"),field_selec2=document.getElementById("stewart_field2"),mask_selec=document.getElementById("stewart_mask");unfillSelectInput(field_selec);unfillSelectInput(field_selec2);unfillSelectInput(mask_selec);d3.selectAll(".params").attr("disabled",true);}};function fillMenu_Stewart(){var dialog_content=section2.append("div").attr("class","form-rendering");dialog_content.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dialog_content.append('p').style("margin","10px 0px 0px").html(i18next.t("app_page.func_options.smooth.field")).insert('select').attrs({class:'params marg_auto',id:"stewart_field"});var field_selec2=dialog_content.append('p').style("margin","10px 0px 0px").html(i18next.t("app_page.func_options.smooth.divide_field")).insert('select').attrs({class:'params marg_auto',id:"stewart_field2"});{var p_span=dialog_content.append("p").style("float","left").text(i18next.t("app_page.func_options.smooth.span"));var span=p_span.append('input').style("width","60px").attrs({type:'number',class:'params',id:"stewart_span",value:5,min:0.001,max:100000.000,step:"any"});p_span.insert("span").html(" km");var beta=dialog_content.append('p').styles({"float":"right","margin-right":"35px"}).html(i18next.t("app_page.func_options.smooth.beta")).insert('input').style("width","60px").attrs({type:'number',class:'params',id:"stewart_beta",value:2,min:0,max:11,step:"any"});var p_reso=dialog_content.append('p').text(i18next.t("app_page.func_options.smooth.resolution"));var resolution=p_reso.insert('input').style("width","60px").attrs({type:'number',class:'params',id:"stewart_resolution",min:1,max:1000000,step:"any"});p_reso.insert("span").html(" km");}var func_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.smooth.function")).insert('select').attrs({class:'params',id:"stewart_func"}),nb_class=dialog_content.append("p").html(i18next.t("app_page.func_options.smooth.nb_class")).insert("input").style("width","50px").attrs({type:"number",class:'params',id:"stewart_nb_class",value:8,min:1,max:22,step:1}),breaks_val=dialog_content.append("p").html(i18next.t("app_page.func_options.smooth.break_values")).insert("textarea").attrs({class:'params',id:"stewart_breaks"}).styles({"width":"260px","height":"30px"}),mask_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.smooth.mask")).insert('select').attrs({class:'params',id:"stewart_mask"});[['exponential',i18next.t("app_page.func_options.smooth.func_exponential")],['pareto',i18next.t("app_page.func_options.smooth.func_pareto")]].forEach(function(fun_name){func_selec.append("option").text(fun_name[1]).attr("value",fun_name[0]);});dialog_content.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","stewart_output_name");dialog_content.insert("p").styles({"text-align":"right",margin:"auto"}).append('button').attr('id','stewart_yes').attr('class',"params button_st3").text(i18next.t('app_page.func_options.common.render')).on('click',function(){var formToSend=new FormData(),field1_n=field_selec.node().value,field2_n=field_selec2.node().value,var1_to_send={},var2_to_send={},layer=Object.getOwnPropertyNames(user_data)[0],bval=breaks_val.node().value.trim(),reso=+resolution.node().value*1000,new_user_layer_name=document.getElementById("stewart_output_name").value;bval=bval.length>0?bval.split('-').map(function(val){return+val.trim();}):null;if(current_layers[layer].original_fields.has(field1_n))var1_to_send[field1_n]=[];else var1_to_send[field1_n]=user_data[layer].map(function(i){return+i[field1_n];});if(field2_n!="None"){if(current_layers[layer].original_fields.has(field2_n))var2_to_send[field2_n]=[];else var2_to_send[field2_n]=user_data[layer].map(function(i){return+i[field2_n];});}formToSend.append("json",JSON.stringify({"topojson":current_layers[layer].key_name,"variable1":var1_to_send,"variable2":var2_to_send,"span":+span.node().value*1000,"beta":+beta.node().value,"typefct":func_selec.node().value,"resolution":reso>0?reso:null,"nb_class":nb_class.node().value,"user_breaks":bval,"mask_layer":mask_selec.node().value!=="None"?current_layers[mask_selec.node().value].key_name:""}));$.ajax({processData:false,contentType:false,url:'/compute/stewart',data:formToSend,type:'POST',error:function error(_error3){display_error_during_computation();console.log(_error3);},success:function success(data){{var data_split=data.split('|||'),raw_topojson=data_split[0];var options={result_layer_on_add:true};if(new_user_layer_name.length>0&&/^\w+$/.test(new_user_layer_name)){options["choosed_name"]=new_user_layer_name;}var n_layer_name=add_layer_topojson(raw_topojson,options);if(!n_layer_name)return;var class_lim=JSON.parse(data_split[1]);}var col_pal=getColorBrewerArray(class_lim.min.length,"Oranges"),nb_class=class_lim['min'].length,colors_breaks=[];for(var i=0;i<nb_class;i++){colors_breaks.push([class_lim['min'][i]+" - "+class_lim['max'][i],col_pal[nb_class-1-i]]);}current_layers[n_layer_name].fill_color={"class":[]};current_layers[n_layer_name].renderer="Stewart";current_layers[n_layer_name].colors_breaks=colors_breaks;current_layers[n_layer_name].rendered_field=field_selec.node().value;current_layers[n_layer_name].color_palette={name:"Oranges",reversed:true};d3.select("#"+n_layer_name).selectAll("path").style("fill",function(d,i){return col_pal[nb_class-1-i];});// Todo : use the function render_choro to render the result from stewart too
}});});d3.selectAll(".params").attr("disabled",true);}var fields_Anamorphose={fill:function fill(layer){if(!layer)return;var fields=type_col(layer,"number"),field_selec=d3.select("#Anamorph_field");if(fields.length==0){display_error_num_field();return;}d3.selectAll(".params").attr("disabled",null);fields.forEach(function(field){field_selec.append("option").text(field).attr("value",field);});field_selec.on("change",function(){var field_name=this.value,ref_value_field=document.getElementById("Anamorph_opt3");document.getElementById("Anamorph_output_name").value=["Cartogram",this.value,layer].join('_');if(ref_value_field){var max_val_field=max_fast(user_data[layer].map(function(obj){return+obj[field_name];}));ref_value_field.setAttribute("max",max_val_field);ref_value_field.value=max_val_field;}});setSelected(field_selec.node(),field_selec.node().options[0].value);},unfill:function unfill(){var field_selec=document.getElementById("Anamorph_field");d3.selectAll(".params").attr("disabled",true);unfillSelectInput(field_selec);}};function fillMenu_Anamorphose(){var make_opt_dorling=function make_opt_dorling(){option1_txt.html(i18next.t("app_page.func_options.cartogram.dorling_symbol"));option2_txt.html(i18next.t("app_page.func_options.cartogram.dorling_fixed_size"));option1_val=option1_txt.insert("select").attrs({class:"params",id:"Anamorph_opt"});option2_val=option2_txt.insert("input").attrs({type:"range",min:0,max:30,step:0.1,value:10,id:"Anamorph_opt2",class:"params"}).style("width","50px");option2_txt.insert("span").attr("id","Anamorph_ref_size_txt").html(" 10 px");option2_txt2.html(i18next.t("app_page.func_options.cartogram.dorling_on_value"));option2_val2=option2_txt2.insert("input").attr("type","number").attrs({class:"params",id:"Anamorph_opt3"}).style("width","100px");symbols.forEach(function(symb){option1_val.append("option").text(symb[0]).attr("value",symb[1]);});field_selec.on("change",function(){var field_name=this.value,layer=Object.getOwnPropertyNames(user_data)[0],max_val_field=max_fast(user_data[layer].map(function(obj){return+obj[field_name];})),ref_value_field=document.getElementById("Anamorph_opt3");ref_value_field.setAttribute("max",max_val_field);ref_value_field.value=max_val_field;});setSelected(field_selec.node(),field_selec.node().options[0].value);option2_val.on("change",function(){document.getElementById("Anamorph_ref_size_txt").innerHTML=this.value+" px";});};var make_opt_iter=function make_opt_iter(){option1_txt.html(i18next.t("app_page.func_options.cartogram.dougenik_iterations"));option2_txt.html("");option2_txt2.html("");option1_val=option1_txt.insert('input').attrs({type:'number',class:'params',value:5,min:1,max:12,step:1});};var make_opt_olson=function make_opt_olson(){option1_txt.html(i18next.t("app_page.func_options.cartogram.olson_scale_txt"));option2_txt.html(i18next.t("app_page.func_options.cartogram.olson_scale_max_scale"));option1_val=option1_txt.insert("select").attrs({class:"params",id:"Anamorph_opt"});[[i18next.t("app_page.func_options.cartogram.olson_scale_max"),"max"],[i18next.t("app_page.func_options.cartogram.olson_scale_mean"),"mean"]].forEach(function(opt_field){option1_val.append("option").attr("value",opt_field[1]).text(opt_field[0]);});option2_val=option2_txt.insert('input').style("width","60px").attrs({type:'number',class:'params',id:"Anamorph_opt2",value:50,min:0,max:100,step:1});option2_txt2.html("");};var dialog_content=section2.append("div").attr("class","form-rendering");dialog_content.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var algo_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.cartogram.algo")).insert('select').attr('class','params'),field_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.cartogram.field")).insert('select').attrs({class:'params',id:'Anamorph_field'}),option1_txt=dialog_content.append('p').attr("id","Anamorph_opt_txt").html(i18next.t("app_page.func_options.cartogram.dorling_symbol")),option1_val=option1_txt.insert("select").attrs({class:"params",id:"Anamorph_opt"}),option2_txt=dialog_content.append('p').attr("id","Anamorph_opt_txt2").html(i18next.t("app_page.func_options.cartogram.dorling_fixed_size")),option2_val=option2_txt.insert("input").attrs({type:"range",min:0,max:30,step:0.1,value:10,id:"Anamorph_opt2",class:"params"}).style("width","50px"),option2_txt2=dialog_content.append("p").attr("id","Anamorph_opt_txt3").html(i18next.t("app_page.func_options.cartogram.dorling_on_value")),option2_val2=option2_txt2.insert("input").attrs({type:"number",min:0,step:0.1}).attrs({class:"params",id:"Anamorph_opt3"}),symbols=[[i18next.t("app_page.func_options.common.symbol_circle"),"circle"],[i18next.t("app_page.func_options.common.symbol_square"),"rect"]];option2_txt.insert("span").attr("id","Anamorph_ref_size_txt").html(" 10 px");option2_val.on("change",function(){document.getElementById("Anamorph_ref_size_txt").innerHTML=" "+this.value+" px";});symbols.forEach(function(symb){option1_val.append("option").text(symb[0]).attr("value",symb[1]);});algo_selec.on("change",function(){if(this.value=="dorling")make_opt_dorling();else if(this.value=="olson")make_opt_olson();else make_opt_iter();});[['Pseudo-Dorling','dorling'],['Dougenik & al. (1985)','dougenik'],['Olson (2005)','olson']].forEach(function(fun_name){algo_selec.append("option").text(fun_name[0]).attr("value",fun_name[1]);});var uo_layer_name=dialog_content.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","Anamorph_output_name");dialog_content.insert("p").styles({"text-align":"right",margin:"auto"}).append("button").attrs({id:'Anamorph_yes',class:"params button_st3"}).html('Compute').on("click",function(){var layer=Object.getOwnPropertyNames(user_data)[0],algo=algo_selec.node().value,nb_features=user_data[layer].length,field_name=field_selec.node().value,new_user_layer_name=document.getElementById("Anamorph_output_name").value;if(algo==="olson"){(function(){var field_n=field_selec.node().value,layer=Object.getOwnPropertyNames(user_data)[0],ref_size=option1_val.node().value,scale_max=+option2_val.node().value/100,nb_ft=current_layers[layer].n_features,dataset=user_data[layer];var layer_select=document.getElementById(layer).querySelectorAll("path"),sqrt=Math.sqrt,abs=Math.abs,d_values=[],area_values=[];for(var i=0;i<nb_ft;++i){d_values.push(sqrt(+dataset[i][field_n]));area_values.push(+path.area(layer_select[i].__data__.geometry));}var mean=d3.mean(d_values),min=d3.min(d_values),max=d3.max(d_values),transform=[];if(ref_size=="mean"){var low_=abs(mean-min),up_=abs(max-mean),max_dif=low_>up_?low_:up_;for(var _i3=0;_i3<nb_ft;++_i3){var val=d_values[_i3],scale_area=void 0;if(val>mean)scale_area=1+scale_max/(max_dif/abs(val-mean));else if(val==mean)scale_area=1;else scale_area=1-scale_max/(max_dif/abs(mean-val));transform.push(scale_area);}}else if(ref_size=="max"){var _max_dif=abs(max-min);for(var _i4=0;_i4<nb_ft;++_i4){var _val=d_values[_i4],val_dif=_max_dif/_val,_scale_area=void 0;if(val_dif<1)_scale_area=1;else _scale_area=1-scale_max/val_dif;transform.push(_scale_area);}}var formToSend=new FormData();formToSend.append("json",JSON.stringify({topojson:current_layers[layer].key_name,scale_values:transform,field_name:field_n,scale_max:scale_max}));$.ajax({processData:false,contentType:false,url:'/compute/olson',data:formToSend,type:'POST',error:function error(_error4){display_error_during_computation();console.log(_error4);},success:function success(result){var options={result_layer_on_add:true};if(new_user_layer_name.length>0&&/^\w+$/.test(new_user_layer_name)){options["choosed_name"]=new_user_layer_name;}var n_layer_name=add_layer_topojson(result,options);current_layers[n_layer_name].renderer="OlsonCarto";current_layers[n_layer_name].rendered_field=field_n;current_layers[n_layer_name].scale_max=scale_max;current_layers[n_layer_name].ref_layer_name=layer;current_layers[n_layer_name].scale_byFeature=transform;d3.select("#"+n_layer_name).selectAll("path").style("fill-opacity",0.8).style("stroke","black").style("stroke-opacity",0.8);}});})();}else if(algo==="dougenik"){var _formToSend=new FormData(),_field_n=field_selec.node().value,_layer2=Object.getOwnPropertyNames(user_data)[0],var_to_send={},nb_iter=option1_val.node().value;var_to_send[field_name]=[];if(!current_layers[_layer2].original_fields.has(field_name)){var table=user_data[_layer2],to_send=var_to_send[field_name];for(var i=0,i_len=table.length;i<i_len;++i){to_send.push(+table[i][field_name]);}}_formToSend.append("json",JSON.stringify({"topojson":current_layers[_layer2].key_name,"var_name":var_to_send,"iterations":nb_iter}));$.ajax({processData:false,contentType:false,url:'/compute/carto_doug',data:_formToSend,type:'POST',error:function error(_error5){display_error_during_computation();console.log(_error5);},success:function success(data){var options={result_layer_on_add:true};if(new_user_layer_name.length>0&&/^\w+$/.test(new_user_layer_name)){options["choosed_name"]=new_user_layer_name;}var n_layer_name=add_layer_topojson(data,options);current_layers[n_layer_name].fill_color={"random":true};current_layers[n_layer_name].is_result=true;current_layers[n_layer_name]['stroke-width-const']=0.8;current_layers[n_layer_name].renderer="Carto_doug";current_layers[n_layer_name].rendered_field=field_name;d3.select("#"+n_layer_name).selectAll("path").style("fill",function(){return Colors.random();}).style("fill-opacity",0.8).style("stroke","black").style("stroke-opacity",0.8);}});}else if(algo==="dorling"){var fixed_value=+document.getElementById("Anamorph_opt3").value,fixed_size=+document.getElementById("Anamorph_opt2").value,shape_symbol=option1_val.node().value;var layer_to_add=check_layer_name(new_user_layer_name.length>0&&/^\w+$/.test(new_user_layer_name)?new_user_layer_name:["DorlingCarto",field_name,layer].join('_'));var _make_dorling_demers=make_dorling_demers(layer,field_name,fixed_value,fixed_size,shape_symbol,layer_to_add);var _make_dorling_demers2=_slicedToArray(_make_dorling_demers,2);var features_order=_make_dorling_demers2[0];var animation=_make_dorling_demers2[1];current_layers[layer_to_add]={"renderer":"DorlingCarto","type":"Point","symbol":shape_symbol,"rendered_field":field_name,"size":[fixed_value,fixed_size],"stroke-width-const":1,"is_result":true,"features_order":features_order,"ref_layer_name":layer,"fill_color":{"random":true},"animation":animation};create_li_layer_elem(layer_to_add,current_layers[layer].n_features,["Point","cartogram"],"result");up_legends();zoom_without_redraw();switch_accordion_section();}});d3.selectAll(".params").attr("disabled",true);}function make_dorling_demers(layer,field_name,fixed_value,fixed_size,shape_symbol,layer_to_add){var ref_layer_selection=document.getElementById(layer).querySelectorAll("path"),nb_features=current_layers[layer].n_features,d_values=[],symbol_layer=undefined,comp=function comp(a,b){return b[1]-a[1];},tmp=[];for(var i=0;i<nb_features;++i){var val=+user_data[layer][i][field_name];var pt=path.centroid(ref_layer_selection[i].__data__.geometry);d_values.push([i,val,pt]);}d_values=prop_sizer3(d_values,fixed_value,fixed_size,shape_symbol);d_values.sort(comp);var min_value=+d_values[nb_features-1][1],max_value=+d_values[0][1];var nodes=d_values.map(function(d,i){var val=(+ref_layer_selection[d[0]].__data__.properties[field_name]-min_value)/(max_value-min_value);return{x:d[2][0],y:d[2][1],x0:d[2][0],y0:d[2][1],r:d[1],value:val,ix:d[0]};});var animation=d3.forceSimulation(nodes).force("x",d3.forceX(function(d){return d.x0;}).strength(0.5)).force("y",d3.forceY(function(d){return d.y0;}).strength(0.5)).force("charge",d3.forceManyBody().distanceMin(0).distanceMax(0).strength(function(d){return-0.1*d.value;})).force("collide",d3.forceCollide().radius(function(d){return d.r;}).strength(0.5).iterations(1)).on("tick",tick);var bg_color=Colors.random(),stroke_color="black";if(shape_symbol=="circle"){symbol_layer=map.append("g").attr("id",layer_to_add).attr("class","result_layer layer").selectAll("circle").data(nodes).enter().append("circle").attr("id",function(d,i){return["PropSymbol_",i," feature_",d.ix].join('');}).attr("r",function(d){return d.r;}).style("fill",function(){return Colors.random();}).style("stroke","black");}else{symbol_layer=map.append("g").attr("id",layer_to_add).attr("class","result_layer layer").selectAll("rect").data(nodes).enter().append("rect").attr("id",function(d,i){return["PropSymbol_",i," feature_",d.ix].join('');}).attr("height",function(d){return d.r*2;}).attr("width",function(d){return d.r*2;}).style("fill",function(){return Colors.random();}).style("stroke","black");}function tick(e){if(shape_symbol=="circle")symbol_layer.attr("cx",function(d){return d.x;}).attr("cy",function(d){return d.y;});else symbol_layer.attr("x",function(d){return d.x-d.r;}).attr("y",function(d){return d.y-d.r;});}return[d_values,animation];}var boxExplore={display_table:function display_table(table_name){document.querySelector("body").style.cursor="";var the_table=this.layer_names.get(table_name)[1];this.current_table=table_name;this.nb_features=the_table.length;this.columns_names=Object.getOwnPropertyNames(the_table[0]);this.columns_headers=[];for(var i=0,col=this.columns_names,len=col.length;i<len;++i){this.columns_headers.push({data:col[i],title:col[i]});}if(this.top_buttons.select("#add_field_button").node()){this.top_buttons.select("#add_field_button").remove();document.getElementById("table_intro").remove();document.getElementById("myTable").remove();document.getElementById("myTable_wrapper").remove();}var self=this;this.top_buttons.insert("button").attrs({id:"add_field_button",class:"button_st3"}).html(i18next.t("app_page.explore_box.button_add_field")).on('click',function(){add_table_field(the_table,table_name,self);});var txt_intro=["<b>",table_name,"</b><br>",this.nb_features," ",i18next.t("app_page.common.feature",{count:this.nb_features})," - ",this.columns_names.length," ",i18next.t("app_page.common.field",{count:this.columns_names.length})].join('');this.box_table.append("p").attr('id','table_intro').html(txt_intro);this.box_table.append("table").attrs({class:"display compact",id:"myTable"}).style("width","80%");var myTable=$('#myTable').DataTable({data:the_table,columns:this.columns_headers});},get_available_tables:function get_available_tables(){var target_layer=Object.getOwnPropertyNames(user_data),ext_dataset=dataset_name,result_layers=Object.getOwnPropertyNames(result_data),available=new Map();var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=target_layer[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){var lyr_name=_step3.value;available.set(lyr_name,[i18next.t("app_page.common.target_layer"),user_data[lyr_name]]);}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}if(ext_dataset)available.set(dataset_name,[i18next.t("app_page.common.ext_dataset"),joined_dataset[0]]);var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=result_layers[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){var _lyr_name=_step4.value;available.set(_lyr_name,[i18next.t("app_page.common.result_layer"),result_data[_lyr_name]]);}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}return available;},create:function create(){this.layer_names=this.get_available_tables();if(this.layer_names.size==0)return;this.columns_headers=[];this.nb_features=undefined;this.columns_names=undefined;this.current_table=undefined,this.box_table=d3.select("body").append("div").style("font-size","0.75em").attrs({id:"browse_data_box",title:i18next.t("app_page.explore_box.title")});var self=this;this.top_buttons=this.box_table.append('p').styles({"margin-left":"15px","display":"inline","font-size":"12px"});var select_a_table=this.box_table.append('p').html(i18next.t("app_page.explore_box.available_table")).insert("select").attr("id","select_table").on("change",function(){self.display_table(this.value);});this.layer_names.forEach(function(value,key){var txt=[key," (",value[0],")"].join('');select_a_table.append("option").attr("value",key).text(txt);});setSelected(select_a_table.node(),select_a_table.node().options[0].value);var deferred=Q.defer();$("#browse_data_box").dialog({modal:false,resizable:true,width:Math.round(window.innerWidth*0.8),buttons:[{text:i18next.t("app_page.common.close"),click:function click(){deferred.resolve([true,true]);$(this).dialog("close");}}],close:function close(event,ui){$(this).dialog("destroy").remove();if(deferred.promise.isPending())deferred.resolve(false);}});return deferred.promise;}};var fields_PropSymbol={fill:function fill(layer){if(!layer)return;d3.selectAll(".params").attr("disabled",null);var fields=type_col(layer,"number"),nb_features=user_data[layer].length,field_selec=d3.select("#PropSymbol_field_1");fields.forEach(function(field){field_selec.append("option").text(field).attr("value",field);});field_selec.on("change",function(){var field_name=this.value,data_layer=user_data[layer],field_values=data_layer.map(function(obj){return+obj[field_name];}),max_val_field=max_fast(field_values),has_neg=has_negative(field_values),ref_value_field=document.getElementById("PropSymbol_ref_value").querySelector('input');document.getElementById("PropSymbol_output_name").value=["PropSymbol",this.value,layer].join('_');ref_value_field.setAttribute("max",max_val_field);ref_value_field.setAttribute("value",max_val_field);if(has_neg){setSelected(document.getElementById("PropSymbol_nb_colors"),2);document.getElementById("PropSymbol_break_val").value=0;}else{setSelected(document.getElementById("PropSymbol_nb_colors"),1);}});setSelected(field_selec.node(),fields[0]);},unfill:function unfill(){var field_selec=document.getElementById("PropSymbol_field_1");unfillSelectInput(field_selec);d3.selectAll(".params").attr("disabled",true);}};function fillMenu_PropSymbol(layer){var max_allowed_size=Math.round(h/2-h/20),dialog_content=section2.append("p").attr("class","form-rendering");dialog_content.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.common.field")).insert('select').attrs({class:'params','id':"PropSymbol_field_1"}),ref_size=dialog_content.append('p').style("display","inline").html(i18next.t("app_page.func_options.prop.fixed_size")).insert('input').attrs({type:'number',class:'params'}).attrs({min:0.2,max:max_allowed_size,value:15.0,step:0.1}).style("width","50px");dialog_content.append('span').html(" px");var ref_value=dialog_content.append('p').attr("id","PropSymbol_ref_value").html(i18next.t("app_page.func_options.prop.on_value")).insert('input').styles({'width':'100px',"margin-left":"10px"}).attrs({type:'number',class:"params",min:0.1,step:0.1});var symb_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.prop.symbol_type")).insert('select').attr('class','params');[[i18next.t("app_page.func_options.common.symbol_circle"),"circle"],[i18next.t("app_page.func_options.common.symbol_square"),"rect"]].forEach(function(symb){symb_selec.append("option").text(symb[0]).attr("value",symb[1]);});dialog_content.append('p').html(i18next.t("app_page.func_options.prop.symbol_color"));var color_par=dialog_content.append('select').attr("class","params").attr("id","PropSymbol_nb_colors").style("margin-right","15px");color_par.append("option").attr("value",1).text(i18next.t("app_page.func_options.prop.options_one_color"));color_par.append("option").attr("value",2).text(i18next.t("app_page.func_options.prop.options_two_colors"));color_par.on("change",function(){if(this.value==1){fill_color2.style("display","none");fill_color_opt.style("display","none");fill_color_text.style("display","none");}else{fill_color2.style("display",null);fill_color_opt.style("display",null);fill_color_text.style("display","inline");}});var col_p=dialog_content.append("p").style("display","inline");var fill_color=col_p.insert('input').attr('type','color').attrs({class:"params",id:"PropSymbol_color1",value:ColorsSelected.random()});var fill_color2=col_p.insert('input').attr('type','color').style("display","none").attrs({class:"params",id:"PropSymbol_color2",value:ColorsSelected.random()});var col_b=dialog_content.insert("p");var fill_color_text=col_b.insert("span").style("display","none").html(i18next.t("app_page.func_options.prop.options_break_two_colors"));var fill_color_opt=col_b.insert('input').attr('type','number').attrs({class:"params","id":"PropSymbol_break_val"}).style("display","none").style("width","75px");var uo_layer_name=dialog_content.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","PropSymbol_output_name");dialog_content.insert("p").styles({"text-align":"right",margin:"auto"}).append('button').attr('id','yes').attr("class","params button_st3").html(i18next.t('app_page.func_options.common.render')).on("click",function(){var layer=Object.getOwnPropertyNames(user_data)[0],nb_features=user_data[layer].length,field_to_render=field_selec.node().value,user_new_layer_name=uo_layer_name.node().value,new_layer_name=check_layer_name(user_new_layer_name.length>0&&/^\w+$/.test(user_new_layer_name)?user_new_layer_name:["PropSymbols",field_to_render,layer].join('_')),rendering_params={"field":field_to_render,"nb_features":nb_features,"new_name":new_layer_name,"ref_layer_name":layer,"symbol":symb_selec.node().value,"ref_size":+ref_size.node().value,"ref_value":+ref_value.node().value,"fill_color":fill_color.node().value};if(+color_par.node().value==2){rendering_params["break_val"]=+fill_color_opt.node().value;rendering_params["fill_color"]={"two":[fill_color.node().value,fill_color2.node().value]};}console.log(rendering_params);make_prop_symbols(rendering_params);binds_layers_buttons(new_layer_name);zoom_without_redraw();switch_accordion_section();});d3.selectAll(".params").attr("disabled",true);}function make_prop_symbols(rendering_params){var layer=rendering_params.ref_layer_name,field=rendering_params.field,nb_features=rendering_params.nb_features,values_to_use=rendering_params.values_to_use,_values=[],abs=Math.abs,comp=function comp(a,b){return abs(b[1])-abs(a[1]);},ref_layer_selection=document.getElementById(layer).querySelectorAll("path"),ref_size=rendering_params.ref_size,ref_value=rendering_params.ref_value,symbol_type=rendering_params.symbol,layer_to_add=rendering_params.new_name,zs=d3.zoomTransform(svg_map).k;var res_data=[];if(values_to_use)for(var i=0;i<nb_features;++i){//            let centr = path.centroid(ref_layer_selection[i].__data__);
_values.push([i,+values_to_use[i],path.centroid(ref_layer_selection[i].__data__)]);}else{var data_table=user_data[layer];for(var _i5=0;_i5<nb_features;++_i5){//            let centr = path.centroid(ref_layer_selection[i].__data__);
_values.push([_i5,+data_table[_i5][field],path.centroid(ref_layer_selection[_i5].__data__)]);}}if(rendering_params.break_val!=undefined&&rendering_params.fill_color.two){var col1=rendering_params.fill_color.two[0],col2=rendering_params.fill_color.two[1];var tmp_fill_color=[];for(var _i6=0;_i6<nb_features;++_i6){tmp_fill_color.push(_values[_i6][1]>rendering_params.break_val?col2:col1);}}else{var tmp_fill_color=rendering_params.fill_color;}var d_values=prop_sizer3(_values,ref_value,ref_size,symbol_type);d_values.sort(comp);/*
        Values have been sorted (descendant order on the absolute values) to have larger symbols
        displayed under the smaller, so now d_values is an array like :
        [
         [id_ref_feature, value, [x_centroid, y_centroid]],
         [id_ref_feature, value, [x_centroid, y_centroid]],
         [id_ref_feature, value, [x_centroid, y_centroid]],
         [...]
        ]
    */if(!(rendering_params.fill_color instanceof Array)&&!rendering_params.fill_color.two){for(var _i7=0;_i7<nb_features;++_i7){d_values[_i7].push(rendering_params.fill_color);}}else{for(var _i8=0;_i8<nb_features;++_i8){//            let idx = d_values[i][0];
d_values[_i8].push(tmp_fill_color[d_values[_i8][0]]);}}var symbol_layer=map.append("g").attr("id",layer_to_add).attr("class","result_layer layer");if(symbol_type==="circle"){for(var _i9=0;_i9<nb_features;_i9++){var params=d_values[_i9];var id_ref=params[0];symbol_layer.append('circle').attr('cx',params[2][0]).attr("cy",params[2][1]).attr("r",params[1]).attr("id",["PropSymbol_",_i9," feature_",id_ref].join('')).style("fill",params[3]).style("stroke","black").style("stroke-width",1/zs);var res_obj={};res_obj["uid"]=_i9;res_obj["id_layer_reference"]=id_ref;res_obj[field]=_values[id_ref][1];res_data.push(res_obj);}}else if(symbol_type==="rect"){for(var _i10=0;_i10<nb_features;_i10++){var _params=d_values[_i10],_id_ref=_params[0],size=_params[1];symbol_layer.append('rect').attr('x',_params[2][0]-size/2).attr("y",_params[2][1]-size/2).attr("height",size).attr("width",size).attr("id",["PropSymbol_",_i10," feature_",_params[0]].join('')).style("fill",_params[3]).style("stroke","black").style("stroke-width",1/zs);var _res_obj={};_res_obj["uid"]=_i10;_res_obj["id_layer_reference"]=_id_ref;_res_obj[field]=_values[_id_ref][1];res_data.push(_res_obj);};}var fill_color=rendering_params.fill_color.two!=undefined?rendering_params.fill_color:rendering_params.fill_color instanceof Array?{"class":rendering_params.fill_color}:{"single":rendering_params.fill_color};current_layers[layer_to_add]={"n_features":nb_features,"renderer":rendering_params.renderer||"PropSymbols","symbol":symbol_type,"fill_color":fill_color,"rendered_field":field,"size":[ref_value,ref_size],"stroke-width-const":1,"is_result":true,"ref_layer_name":layer,"features_order":d_values};if(rendering_params.break_val!=undefined){current_layers[layer_to_add]["break_val"]=rendering_params.break_val;}up_legends();result_data[layer_to_add]=res_data;create_li_layer_elem(layer_to_add,nb_features,["Point","prop"],"result");return d_values;}var fields_griddedMap={fill:function fill(layer){if(!layer)return;var fields=type_col(layer,"number"),field_selec=d3.select("#Gridded_field");fields.forEach(function(field){field_selec.append("option").text(field).attr("value",field);});field_selec.on("change",function(){document.getElementById("Gridded_output_name").value=["Gridded",this.value,layer].join('_');});d3.selectAll(".params").attr("disabled",null);document.getElementById("Gridded_cellsize").value=get_first_guess_span();},unfill:function unfill(){var field_selec=document.getElementById("Gridded_field");unfillSelectInput(field_selec);d3.selectAll(".params").attr("disabled",true);}};function fillMenu_griddedMap(layer){var dialog_content=section2.append("p").attr("class","form-rendering");dialog_content.append("img").attrs({id:"btn_info",src:"/static/img/Information.png",width:"17",height:"17",alt:"Informations",class:"help_tooltip","data-tooltip_help":" "}).styles({"cursor":"pointer","vertical-align":"bottom","float":"right"});var field_selec=dialog_content.append('p').html(i18next.t("app_page.func_options.common.field")).insert('select').attrs({class:'params',id:"Gridded_field"});var cellsize=dialog_content.append('p').html(i18next.t("app_page.func_options.grid.cellsize")).insert('input').style("width","100px").attrs({type:'number',class:'params',id:"Gridded_cellsize",value:10.0,min:1.000,max:7000,step:"any"});var grid_shape=dialog_content.append('p').html(i18next.t("app_page.func_options.grid.shape")).insert('select').attrs({class:'params',id:"Gridded_shape"});var col_pal=dialog_content.append('p').html(i18next.t("app_page.func_options.grid.coloramp")).insert('select').attr('class','params');['Blues','BuGn','BuPu','GnBu','OrRd','PuBu','PuBuGn','PuRd','RdPu','YlGn','Greens','Greys','Oranges','Purples','Reds'].forEach(function(d){col_pal.append("option").text(d).attr("value",d);});['Square','Diamond','Hexagon'].forEach(function(d){grid_shape.append("option").text(d).attr("value",d);});var uo_layer_name=dialog_content.append('p').html(i18next.t("app_page.func_options.common.output")).insert('input').style("width","200px").attr('class','params').attr("id","Gridded_output_name");dialog_content.insert("p").styles({"text-align":"right",margin:"auto"}).append('button').attr("class","params button_st3").attr('id','Gridded_yes').html(i18next.t('app_page.func_options.common.render')).on("click",function(){var field_n=field_selec.node().value,layer=Object.getOwnPropertyNames(user_data)[0],formToSend=new FormData(),var_to_send={},new_user_layer_name=document.getElementById("Gridded_output_name").value;if(current_layers[layer].original_fields.has(field_n))var_to_send[field_n]=[];else var_to_send[field_n]=user_data[layer].map(function(i){return+i[field_n];});formToSend.append("json",JSON.stringify({"topojson":current_layers[layer].key_name,"var_name":var_to_send,"cellsize":+cellsize.node().value*1000,"grid_shape":grid_shape.node().value}));$.ajax({processData:false,contentType:false,url:'/compute/gridded',data:formToSend,type:'POST',error:function error(_error6){display_error_during_computation();console.log(_error6);},success:function success(data){var options={result_layer_on_add:true};if(new_user_layer_name.length>0&&/^\w+$/.test(new_user_layer_name)){options["choosed_name"]=new_user_layer_name;}var n_layer_name=add_layer_topojson(data,options);if(!n_layer_name)return;var res_data=result_data[n_layer_name],nb_ft=res_data.length,opt_nb_class=Math.floor(1+3.3*Math.log10(nb_ft)),d_values=[];for(var i=0;i<nb_ft;i++){d_values.push(+res_data[i]["densitykm"]);}current_layers[n_layer_name].renderer="Gridded";var disc_result=discretize_to_colors(d_values,"quantiles",opt_nb_class,col_pal.node().value),rendering_params={nb_class:opt_nb_class,type:"quantiles",schema:[col_pal.node().value],breaks:disc_result[2],colors:disc_result[3],colorsByFeature:disc_result[4],renderer:"Gridded",rendered_field:"densitykm"};render_choro(n_layer_name,rendering_params);}});});d3.selectAll(".params").attr("disabled",true);}function copy_layer(ref_layer,new_name,type_result){svg_map.appendChild(document.getElementById("svg_map").querySelector("#"+ref_layer).cloneNode(true));svg_map.lastChild.setAttribute("id",new_name);svg_map.lastChild.setAttribute("class","result_layer layer");current_layers[new_name]={n_features:current_layers[ref_layer].n_features,type:current_layers[ref_layer].type,ref_layer_name:ref_layer};var selec_src=document.getElementById(ref_layer).querySelectorAll("path");var selec_dest=document.getElementById(new_name).querySelectorAll("path");for(var i=0;i<selec_src.length;i++){selec_dest[i].__data__=selec_src[i].__data__;}up_legends();create_li_layer_elem(new_name,current_layers[new_name].n_features,[current_layers[new_name].type,type_result],"result");}function render_categorical(layer,rendering_params){if(rendering_params.new_name){copy_layer(layer,rendering_params.new_name,"typo");layer=rendering_params.new_name;}map.select("#"+layer).style("opacity",1).style("stroke-width",0.75/d3.zoomTransform(svg_map).k+"px");var colorsByFeature=rendering_params.colorByFeature,color_map=rendering_params.color_map,field=rendering_params.rendered_field,layer_to_render=map.select("#"+layer).selectAll("path");layer_to_render.style("fill",function(d,i){return colorsByFeature[i];}).style("fill-opacity",0.9).style("stroke-opacity",0.9).style("stroke","black");current_layers[layer].renderer=rendering_params['renderer'];current_layers[layer].rendered_field=field;current_layers[layer].fill_color={"class":rendering_params['colorByFeature']};current_layers[layer]['stroke-width-const']=0.75;current_layers[layer].is_result=true;current_layers[layer].color_map=color_map;zoom_without_redraw();}function create_li_layer_elem(layer_name,nb_ft,type_geom,type_layer){var _list_display_name=get_display_name_on_layer_list(layer_name),layers_listed=layer_list.node(),li=document.createElement("li");li.setAttribute("layer_name",layer_name);if(type_layer=="result"){li.setAttribute("class",["ui-state-default sortable_result ",layer_name].join(''));li.setAttribute("layer-tooltip",["<b>",layer_name,"</b> - ",type_geom[0]," - ",nb_ft," features"].join(''));li.innerHTML=['<div class="layer_buttons">',sys_run_button_t2,button_trash,button_zoom_fit,eye_open0,button_legend,button_result_type.get(type_geom[1]),"</div> ",_list_display_name].join('');}else if(type_layer=="sample"){li.setAttribute("class",["ui-state-default ",layer_name].join(''));li.setAttribute("layer-tooltip",["<b>",layer_name,"</b> - Sample layout layer"].join(''));li.innerHTML=['<div class="layer_buttons">',button_style,button_trash,button_zoom_fit,eye_open0,button_type.get(type_geom),"</div> ",_list_display_name].join('');}layers_listed.insertBefore(li,layers_listed.childNodes[0]);binds_layers_buttons(layer_name);}// Function to render the `layer` according to the `rendering_params`
// (layer should be the name of group of path, ie. not a PropSymbol layer)
// Currently used fo "choropleth", "MTA - relative deviations", "gridded map" functionnality
function render_choro(layer,rendering_params){if(rendering_params.new_name){copy_layer(layer,rendering_params.new_name,"choro");//Assign the same key to the cloned layer so it could be used transparently on server side
// after deletion of the reference layer if needed :
current_layers[rendering_params.new_name].key_name=current_layers[layer].key_name;layer=rendering_params.new_name;}var breaks=rendering_params["breaks"];var options_disc={schema:rendering_params.schema,colors:rendering_params.colors,no_data:rendering_params.no_data};var layer_to_render=map.select("#"+layer).selectAll("path");map.select("#"+layer).style("opacity",1).style("stroke-width",0.75/d3.zoomTransform(svg_map).k,+"px");layer_to_render.style('fill-opacity',0.9).style("fill",function(d,i){return rendering_params['colorsByFeature'][i];}).style('stroke-opacity',0.9).style("stroke","black");current_layers[layer].renderer=rendering_params['renderer'];current_layers[layer].rendered_field=rendering_params['rendered_field'];current_layers[layer].fill_color={"class":rendering_params['colorsByFeature']};current_layers[layer]['stroke-width-const']=0.75;current_layers[layer].is_result=true;current_layers[layer].options_disc=options_disc;var colors_breaks=[];for(var i=breaks.length-1;i>0;--i){colors_breaks.push([[breaks[i-1]," - ",breaks[i]].join(''),rendering_params['colors'][i-1]]);}current_layers[layer].colors_breaks=colors_breaks;zoom_without_redraw();}// Function returning the name of all current layers (excepted the sample layers used as layout)
function get_other_layer_names(){var other_layers=Object.getOwnPropertyNames(current_layers),tmp_idx=null;tmp_idx=other_layers.indexOf("Graticule");if(tmp_idx>-1)other_layers.splice(tmp_idx,1);tmp_idx=other_layers.indexOf("Simplified_land_polygons");if(tmp_idx>-1)other_layers.splice(tmp_idx,1);tmp_idx=other_layers.indexOf("Sphere");if(tmp_idx>-1)other_layers.splice(tmp_idx,1);return other_layers;}// Function to remove each node (each <option>) of a <select> HTML element :
function unfillSelectInput(select_node){for(var i=select_node.childElementCount-1;i>-1;i--){select_node.removeChild(select_node.children[i]);}}function prop_sizer3_e(arr,fixed_value,fixed_size,type_symbol){var pi=Math.PI,abs=Math.abs,sqrt=Math.sqrt,arr_len=arr.length,res=[];if(!fixed_value||fixed_value==0)fixed_value=max_fast(arr);if(type_symbol=="circle"){var smax=fixed_size*fixed_size*pi;for(var i=0;i<arr_len;++i){res.push(sqrt(abs(arr[i])*smax/fixed_value)/pi);}}else{var _smax=fixed_size*fixed_size;for(var _i11=0;_i11<arr_len;++_i11){res.push(sqrt(abs(arr[_i11])*_smax/fixed_value));}}return res;}function prop_sizer3(arr,fixed_value,fixed_size,type_symbol){var pi=Math.PI,abs=Math.abs,sqrt=Math.sqrt,arr_len=arr.length,res=[];if(!fixed_value||fixed_value==0)fixed_value=max_fast(arr);if(type_symbol=="circle"){var smax=fixed_size*fixed_size*pi;for(var i=0;i<arr_len;++i){var val=arr[i];res.push([val[0],sqrt(abs(val[1])*smax/fixed_value)/pi,val[2]]);}}else{var _smax2=fixed_size*fixed_size;for(var _i12=0;_i12<arr_len;++_i12){var _val2=arr[_i12];res.push([_val2[0],sqrt(abs(_val2[1])*_smax2/fixed_value),_val2[2]]);}}return res;}var type_col=function type_col(layer_name,target){var skip_if_empty_values=arguments.length>2&&arguments[2]!==undefined?arguments[2]:false;// Function returning an object like {"field1": "field_type", "field2": "field_type"},
//  for the fields of the selected layer.
// If target is set to "number" it should return an array containing only the name of the numerical fields
// ------------------- "string" ---------------------------------------------------------non-numerial ----
var table=user_data.hasOwnProperty(layer_name)?user_data[layer_name]:result_data.hasOwnProperty(layer_name)?result_data[layer_name]:joined_dataset[0],fields=Object.getOwnPropertyNames(table[0]),nb_features=table.length,deepth_test=100<nb_features?100:nb_features-1,result={},field=undefined,tmp_type=undefined;for(var j=0,len=fields.length;j<len;++j){field=fields[j];result[field]=[];for(var i=0;i<deepth_test;++i){tmp_type=_typeof(table[i][field]);if(tmp_type=="string"&&table[i][field].length==0)tmp_type="empty";else if(tmp_type==="string"&&!isNaN(Number(table[i][field])))tmp_type="number";else if(tmp_type==="object"&&isFinite(table[i][field]))tmp_type="empty";result[fields[j]].push(tmp_type);}}for(var _j=0,_len=fields.length;_j<_len;++_j){field=fields[_j];if(result[field].every(function(ft){return ft==="number"||ft==="empty";})&&result[field].indexOf("number")>-1)result[field]="number";else result[field]="string";}if(target){var res=[];for(var k in result){if(result[k]===target&&k!="_uid")res.push(k);}return res;}else return result;};/**
* Return a basic operator as a function, each one taking two numbers in arguments
*
* @param {String} operator
* @return {function}
*/function get_fun_operator(operator){var operators=new Map([["+",function(a,b){return a+b;}],["-",function(a,b){return a-b;}],["/",function(a,b){return a/b;}],["*",function(a,b){return a*b;}],["^",function(a,b){return Math.pow(a,b);}]]);return operators.get(operator);}/**
* Function to add a field to the targeted layer
*
* @param {Array} table - A reference to the "table" to work on
* @param {String} layer - The name of the layer
* @param {Object} parent - A reference to the parent box in order to redisplay the table according to the changes
*
*/function add_table_field(table,layer_name,parent){function check_name(){if(regexp_name.test(this.value)||this.value=="")chooses_handler.new_name=this.value;else{// Rollback to the last correct name  :
this.value=chooses_handler.new_name;swal({title:i18next.t("Error")+"!",text:i18next.t("Unauthorized character!"),type:"error",allowOutsideClick:false});}};function compute_and_add(){var options=chooses_handler,fi1=options.field1,fi2=options.field2,new_name_field=options.new_name,operation=options.operator,opt_val=options.opt_val;if(!regexp_name.test(new_name_field)){swal({title:"",text:i18next.t("app_page.explore_box.add_field_box.invalid_name"),type:"error",allowOutsideClick:false});return Promise.reject("Invalid name");}if(options.type_operation==="math_compute"&&table.length>3200){var formToSend=new FormData();var var1=[],var2=fi2=="user_const_value"?+opt_val:[];for(var i=0;i<table.length;i++){var1.push(+table[i][fi1]);}if(fi2!="user_const_value"){for(var _i13=0;_i13<table.length;_i13++){var2.push(+table[_i13][fi2]);}}formToSend.append('var1',JSON.stringify(var1));formToSend.append('var2',JSON.stringify(var2));formToSend.append('operator',operation);return request_data("POST","/helpers/calc",formToSend).then(function(e){var data=JSON.parse(e.target.responseText);for(var _i14=0;_i14<table.length;_i14++){table[_i14][new_name_field]=data[_i14];}return true;});}else if(options.type_operation==="math_compute"){var math_func=get_fun_operator(operation);if(fi2!="user_const_value"){for(var _i15=0;_i15<table.length;_i15++){if(table[_i15][fi1]!=null&&table[_i15][fi2]!=null){table[_i15][new_name_field]=math_func(+table[_i15][fi1],+table[_i15][fi2]);}else{table[_i15][new_name_field]=null;}}}else{opt_val=+opt_val;for(var _i16=0;_i16<table.length;_i16++){if(table[_i16][fi1]!=null){table[_i16][new_name_field]=math_func(+table[_i16][fi1],opt_val);}else{table[_i16][new_name_field]=null;}}}return Promise.resolve(true);}else{if(operation=="truncate"){for(var _i17=0;_i17<table.length;_i17++){table[_i17][new_name_field]=table[_i17][fi1].substring(0,+opt_val);}}else if(operation=="concatenate"){for(var _i18=0;_i18<table.length;_i18++){table[_i18][new_name_field]=[table[_i18][fi1],table[_i18][fi2]].join(opt_val);}}return Promise.resolve(true);}return Promise.reject("Unknown error");};function refresh_type_content(type){field1.node().remove();operator.node().remove();field2.node().remove();field1=div1.append("select").on("change",function(){chooses_handler.field1=this.value;});operator=div1.append("select").on("change",function(){chooses_handler.operator=this.value;refresh_subtype_content(chooses_handler.type_operation,this.value);});field2=div1.append("select").on("change",function(){chooses_handler.field2=this.value;if(this.value=="user_const_value"){val_opt.style("display",null);}});if(type=="math_compute"){math_operation.forEach(function(op){operator.append("option").text(op).attr("value",op);});for(var k in fields_type){if(fields_type[k]=="number"){field1.append("option").text(k).attr("value",k);field2.append("option").text(k).attr("value",k);}}field2.append("option").attr("value","user_const_value").text(i18next.t("app_page.explore_box.add_field_box.constant_value"));val_opt.style("display","none");txt_op.text("");chooses_handler.operator=math_operation[0];}else{string_operation.forEach(function(op){operator.append("option").text(op[0]).attr("value",op[1]);});for(var _k in fields_type){if(fields_type[_k]=="string"){field1.append("option").text(_k).attr("value",_k);field2.append("option").text(_k).attr("value",_k);}}val_opt.style("display",null);txt_op.html(i18next.t("app_page.explore_box.add_field_box.join_char"));chooses_handler.operator=string_operation[0];}chooses_handler.field1=field1.node().value;chooses_handler.field2=field2.node().value;};function refresh_subtype_content(type,subtype){if(type!="string_field"){if(field2.node().value!="user_const_value"){val_opt.style("display","none");txt_op.text("");}}else{if(subtype=="truncate"){txt_op.html(i18next.t("app_page.explore_box.add_field_box.keep_char"));field2.attr("disabled",true);}else{txt_op.html("app_page.explore_box.add_field_box.join_char");field2.attr("disabled",null);}}};var chooses_handler={field1:undefined,field2:undefined,operator:undefined,type_operation:undefined,opt_val:undefined,new_name:'NewFieldName'};make_confirm_dialog("addFieldBox",i18next.t("app_page.explore_box.button_add_field"),{width:430<w?430:undefined,height:280<h?280:undefined}).then(function(valid){if(valid){document.querySelector("body").style.cursor="wait";compute_and_add(chooses_handler).then(function(resolved){if(window.fields_handler&&current_layers[layer_name].targeted){fields_handler.unfill();fields_handler.fill(layer_name);}if(parent)parent.display_table(layer_name);},function(error){if(error!="Invalid name")display_error_during_computation();console.log(error);document.querySelector("body").style.cursor="";}).done(function(){document.querySelector("body").style.cursor="";});}});var current_fields=Object.getOwnPropertyNames(table),fields_type=type_col(layer_name),regexp_name=new RegExp(/^[a-z0-9_]+$/i),// Only allow letters (lower & upper cases), number and underscore in the field name
box_content=d3.select(".addFieldBox").append("div"),div1=box_content.append("div").attr("id","field_div1"),div2=box_content.append("div").attr("id","field_div2");var new_name=div1.append("p").html(i18next.t("app_page.explore_box.add_field_box.new_name")).insert("input").attr('value','NewFieldName').on("keyup",check_name);var type_content=div1.append("p").html(i18next.t("app_page.explore_box.add_field_box.new_content")).insert("select").attr("id","type_content_select").on("change",function(){chooses_handler.type_operation=this.value;refresh_type_content(this.value);});[[i18next.t("app_page.explore_box.add_field_box.between_numerical"),"math_compute"],[i18next.t("app_page.explore_box.add_field_box.between_string"),"string_field"]].forEach(function(d,i){type_content.append("option").text(d[0]).attr("value",d[1]);});var field1=div1.append("select").on("change",function(){chooses_handler.field1=this.value;}),operator=div1.append("select").on("change",function(){chooses_handler.operator=this.value;refresh_subtype_content(chooses_handler.type_operation,this.value);}),field2=div1.append("select").on("change",function(){chooses_handler.field2=this.value;});var txt_op=div2.append("p").attr("id","txt_opt").text(""),val_opt=div2.append("input").attr("id","val_opt").style("display","none").on("change",function(){chooses_handler.opt_val=this.value;});var math_operation=["+","-","*","/","^"];var string_operation=[[i18next.t("app_page.explore_box.add_field_box.concatenate"),"concatenate"],[i18next.t("app_page.explore_box.add_field_box.truncate"),"truncate"]];{var a=type_content.node(),b=false;for(var fi in fields_type){if(fields_type[fi]=="number"){b=true;break;}}a.value=b?"math_compute":"string_field";a.dispatchEvent(new Event('change'));}return;}// Function to be called after clicking on "render" in order to close the section 2
// and to have the section 3 opened
function switch_accordion_section(){var id_to_close=arguments.length>0&&arguments[0]!==undefined?arguments[0]:"accordion2";var id_to_open=arguments.length>1&&arguments[1]!==undefined?arguments[1]:"accordion3";var section2=document.getElementById(id_to_close).firstChild,section3=document.getElementById(id_to_open).firstChild;if(section2.getAttribute("aria-expanded")=="true")section2.dispatchEvent(new Event("click"));if(section3.getAttribute("aria-expanded")=="false")section3.dispatchEvent(new Event("click"));}/**
* Return the haversine distance in kilometers between two points (lat/long coordinates)
*
* @param {Array} A - Coordinates of the 1st point as [latitude, longitude]
* @param {Array} B - Coordinates of the 2nd point as [latitude, longitude]
* @return {Number} distance - The distance in km between A and B
*/function haversine_dist(A,B){var pi_dr=Math.PI/180;var lat1=+A[0],lon1=+A[1],lat2=+B[0],lon2=+B[1];var x1=lat2-lat1,dLat=x1*pi_dr,x2=lon2-lon1,dLon=x2*pi_dr;var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*pi_dr)*Math.cos(lat2*pi_dr)*Math.sin(dLon/2)*Math.sin(dLon/2);return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}/**
* Return the distance in kilometers between two points (lat/long coordinates)
* according to the spherical law of cosines
*
* @param {Array} A - Coordinates of the 1st point as [latitude, longitude]
* @param {Array} B - Coordinates of the 2nd point as [latitude, longitude]
* @return {Number} distance - The distance in km between A and B
*/function coslaw_dist(A,B){var pi_dr=Math.PI/180;var lat1=+A[0],lon1=+A[1],lat2=+B[0],lon2=+B[1];var phi1=lat1*pi_dr,phi2=lat2*pi_dr,d_lambda=(lon2-lon1)*pi_dr;return Math.acos(Math.sin(phi1)*Math.sin(phi2)+Math.cos(phi1)*Math.cos(phi2)*Math.cos(d_lambda))*6371;}function path_to_geojson(id_layer){if(id_layer.indexOf('#')!=0)id_layer=["#",id_layer].join('');var result_geojson=[];d3.select(id_layer).selectAll("path").each(function(d,i){result_geojson.push({type:"Feature",id:i,properties:d.properties,geometry:{type:d.type,coordinates:d.coordinates}});});return JSON.stringify({type:"FeatureCollection",crs:{type:"name",properties:{name:"urn:ogc:def:crs:OGC:1.3:CRS84"}},features:result_geojson});}function display_error_during_computation(msg){msg=msg?"Details : "+msg:"",swal({title:i18next.t("Error")+"!",text:i18next.t("Something wrong happened - Current operation has been aborted")+msg,type:"error",allowOutsideClick:false});}/**
* Perform an asynchronous request
*
* @param {String} method - the method like "GET" or "POST"
* @param {String} url - the targeted url
* @param {FormData} data - Optionnal, the data to be send
* @return {Promise} response
*/function request_data(method,url,data){return new Promise(function(resolve,reject){var request=new XMLHttpRequest();request.open(method,url,true);request.onload=resolve;request.onerror=reject;request.send(data);});}/**
* Function computing the min of an array of values (tking care of empty/null/undefined slot)
*  - no fancy functionnalities here (it doesn't add anything comparing to Math.min.apply()
*    or d3.min() except a little speed-up)
*
* @param {Array} arr
* @return {Number} min
*/function min_fast(arr){var min=arr[0];for(var i=1;i<arr.length;++i){var val=+arr[i];if(val&&val<min)min=val;}return min;}/**
* Return the maximum value of an array of numbers
*
* @param {Array} arr - the array of numbers
* @return {Number} max
*/function max_fast(arr){var max=arr[0];for(var i=1;i<arr.length;++i){var val=+arr[i];if(val>max)max=arr[i];}return max;}/**
* Test an array of numbers for negative values
*
* @param {Array} arr - the array of numbers
* @return {Bool} result - True or False, whether it contains negatives values or not
*/function has_negative(arr){for(var i=0;i<arr.length;++i){if(+arr[i]<0)return true;}return false;}/**
* @param {Array} arr - The array to test
* @return {Boolean} result - True or False, according to whether it contains empty values or not
*/var contains_empty_val=function contains_empty_val(arr){for(var i=arr.length-1;i>-1;--i){if(arr[i]==null)return true;}return false;};var round_value=function round_value(val,nb){if(nb==undefined)return val;var dec_mult=+["1",Array(Math.abs(nb)).fill("0").join('')].join('');return nb>=0?Math.round(+val*dec_mult)/dec_mult:Math.round(+val/dec_mult)*dec_mult;};function get_nb_decimals(nb){var tmp=nb.toString().split('.');return tmp.length<2?0:tmp[1].length;}function get_nb_left_separator(nb){var tmp=nb.toString().split('.');return tmp[0].length;}function getDecimalSeparator(){return 1.1.toLocaleString().substr(1,1);}function make_content_summary(serie){var precision=arguments.length>1&&arguments[1]!==undefined?arguments[1]:6;return[i18next.t("app_page.stat_summary.population")," : ",round_value(serie.pop(),precision),"<br>",i18next.t("app_page.stat_summary.min")," : ",round_value(serie.min(),precision)," | ",i18next.t("app_page.stat_summary.max")," : ",round_value(serie.max(),precision),"<br>",i18next.t("app_page.stat_summary.mean")," : ",round_value(serie.mean(),precision),"<br>",i18next.t("app_page.stat_summary.median")," : ",round_value(serie.median(),precision),"<br>",i18next.t("app_page.stat_summary.variance")," : ",round_value(serie.variance(),precision),"<br>",i18next.t("app_page.stat_summary.stddev")," : ",round_value(serie.stddev(),precision),"<br>",i18next.t("app_page.stat_summary.cov")," : ",round_value(serie.cov(),precision)].join('');}
"use strict";
////////////////////////////////////////////////////////////////////////
// Browse and upload buttons + related actions (conversion + displaying)
////////////////////////////////////////////////////////////////////////

var MAX_INPUT_SIZE = 8704000; // max allowed input size in bytes

/**
* Function triggered when some images of the interface are clicked
* in order to create an <input> element, simulate a click on it, let the user
* browse its file and dispatch the files to the appropriate handler according
* to the file type
*/
function click_button_add_layer() {
    var res = [],
        self = this,
        input = document.createElement('input');

    input.setAttribute('type', 'file');
    input.setAttribute('multiple', '');
    input.setAttribute('name', 'file[]');
    input.setAttribute('enctype', 'multipart/form-data');
    input.onchange = function (event) {
        var target_layer_on_add = self.id === "input_geom" ? true : self.id === "img_in_geom" ? true : self.id === "img_data_ext" ? true : self.id === "data_ext" ? true : false;

        var files = event.target.files;

        handle_upload_files(files, target_layer_on_add, self);
    };

    input.dispatchEvent(new MouseEvent("click"));
}

function handle_upload_files(files, target_layer_on_add, elem) {

    for (var i = 0; i < files.length; i++) {
        if (files[i].size > MAX_INPUT_SIZE) {
            elem.style.border = '3px dashed red';
            swal({ title: i18next.t("app_page.common.error") + "!",
                text: i18next.t("app_page.common.too_large_input"),
                type: "error",
                allowOutsideClick: false });
            elem.style.border = '';
            return;
        }
    }

    if (!(files.length == 1)) {
        var files_to_send = [];
        Array.prototype.forEach.call(files, function (f) {
            return f.name.indexOf('.shp') > -1 || f.name.indexOf('.dbf') > -1 || f.name.indexOf('.shx') > -1 || f.name.indexOf('.prj') > -1 ? files_to_send.push(f) : null;
        });
        elem.style.border = '';
        if (target_layer_on_add && targeted_layer_added) {
            swal({ title: i18next.t("app_page.common.error") + "!",
                text: i18next.t('app_page.common'),
                type: "error",
                allowOutsideClick: false });
        } else if (files_to_send.length == 4) {
            handle_shapefile(files_to_send, target_layer_on_add);
        } else {
            elem.style.border = '3px dashed red';
            swal({ title: i18next.t("app_page.common.error") + "!",
                text: i18next.t("app_page.common.alert_upload1"),
                type: "error",
                allowOutsideClick: false });
            elem.style.border = '';
        }
    } else if (files[0].name.toLowerCase().indexOf('topojson') > -1) {
        elem.style.border = '';
        if (target_layer_on_add && targeted_layer_added) swal({ title: i18next.t("app_page.common.error") + "!",
            text: i18next.t('app_page.common.error_only_one'),
            type: "error",
            allowOutsideClick: false });
        // Most direct way to add a layer :
        else handle_TopoJSON_files(files, target_layer_on_add);
    } else if (files[0].name.toLowerCase().indexOf('geojson') > -1 || files[0].name.toLowerCase().indexOf('zip') > -1 || files[0].name.toLowerCase().indexOf('kml') > -1) {
        elem.style.border = '';

        if (target_layer_on_add && targeted_layer_added) swal({ title: i18next.t("app_page.common.error") + "!",
            text: i18next.t('app_page.common.error_only_one'),
            type: "error",
            allowOutsideClick: false });
        // Send the file to the server for conversion :
        else handle_single_file(files[0], target_layer_on_add);
    } else if (files[0].name.toLowerCase().indexOf('.csv') > -1 || files[0].name.toLowerCase().indexOf('.tsv') > -1) {
        elem.style.border = '';
        if (target_layer_on_add) handle_dataset(files[0], target_layer_on_add);else swal({ title: i18next.t("app_page.common.error") + "!",
            text: i18next.t('app_page.common.error_only_layout'),
            type: "error",
            allowOutsideClick: false });
    } else if (files[0].name.toLowerCase().indexOf('.xls') > -1 || files[0].name.toLowerCase().indexOf('.ods') > -1) {
        elem.style.border = '';
        if (target_layer_on_add) convert_dataset(files[0]);else swal({ title: i18next.t("app_page.common.error") + "!",
            text: i18next.t('app_page.common.error_only_layout'),
            type: "error",
            allowOutsideClick: false });
    } else {
        elem.style.border = '3px dashed red';
        var shp_part = void 0;
        Array.prototype.forEach.call(files, function (f) {
            return f.name.indexOf('.shp') > -1 || f.name.indexOf('.dbf') > -1 || f.name.indexOf('.shx') > -1 || f.name.indexOf('.prj') > -1 ? shp_part = true : null;
        });
        if (shp_part) {
            swal({ title: i18next.t("app_page.common.error") + "!",
                text: i18next.t('app_page.common.alert_upload_shp'),
                type: "error",
                allowOutsideClick: false });
        } else {
            swal({ title: i18next.t("app_page.common.error") + "!",
                text: i18next.t('app_page.common.alert_upload_invalid'),
                type: "error",
                allowOutsideClick: false });
        }
        elem.style.border = '';
    }
}

/**
* Function called to bind the "drop zone" on the 2 desired menu elements
*
*/
function prepare_drop_section() {
    Array.prototype.forEach.call(document.querySelectorAll("#section1,#section3"), function (elem) {
        elem.addEventListener("dragenter", function (e) {
            e.preventDefault();
            e.stopPropagation();
            elem.style.border = '3px dashed green';
        });
        elem.addEventListener("dragover", function (e) {
            e.preventDefault();
            e.stopPropagation();
            elem.style.border = '3px dashed green';
        });
        elem.addEventListener("dragleave", function (e) {
            e.preventDefault();
            e.stopPropagation();
            elem.style.border = '';
        });
        elem.addEventListener("drop", function (e) {
            e.preventDefault();
            var files = e.dataTransfer.files,
                self_section = elem.id,
                target_layer_on_add = void 0;

            e.stopPropagation();

            if (self_section === "section1") target_layer_on_add = true;

            handle_upload_files(files, target_layer_on_add, elem);
        }, true);
    });
}

function convert_dataset(file) {
    var ajaxData = new FormData();
    ajaxData.append("action", "submit_form");
    ajaxData.append('file[]', file);
    $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_tabular',
        data: ajaxData,
        type: 'POST',
        error: function error(_error) {
            console.log(_error);
        },
        success: function success(data) {
            data = JSON.parse(data);
            dataset_name = data.name;
            add_dataset(d3.csvParse(data.file));
        }
    });
}

function handle_shapefile(files, target_layer_on_add) {
    var ajaxData = new FormData();
    ajaxData.append("action", "submit_form");
    for (var j = 0; j < files.length; j++) {
        ajaxData.append('file[' + j + ']', files[j]);
    }
    $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_to_topojson',
        data: ajaxData,
        type: 'POST',
        success: function success(data) {
            add_layer_topojson(data, { target_layer_on_add: target_layer_on_add });
        },
        error: function error(_error2) {
            console.log(_error2);
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
        error: function error(_error3) {
            console.log(_error3);
        },
        success: function success(res) {
            var key = JSON.parse(res).key;
            reader.onloadend = function () {
                var text = reader.result;
                var topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
                add_layer_topojson(topoObjText, { target_layer_on_add: target_layer_on_add });
            };
            reader.readAsText(f);
        }
    });
};

function handle_reload_TopoJSON(text, param_add_func) {
    var ajaxData = new FormData();
    var f = new Blob([text], { type: "application/json" });
    ajaxData.append('file[]', f);

    return request_data("POST", '/cache_topojson/user', ajaxData).then(function (response) {
        var res = response.target.responseText,
            key = JSON.parse(res).key,
            topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
        var layer_name = add_layer_topojson(topoObjText, param_add_func);
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
function handle_dataset(f) {

    function check_dataset() {
        var reader = new FileReader(),
            name = f.name;

        reader.onload = function (e) {
            var data = e.target.result;
            dataset_name = name.substring(0, name.indexOf('.csv'));
            var sep = data.split("\n")[0];
            if (sep.indexOf("\t") > -1) {
                sep = "\t";
            } else if (sep.indexOf(";") > -1) {
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
            var tmp_dataset = d3.dsvFormat(sep).parse(data);
            var field_name = Object.getOwnPropertyNames(tmp_dataset[0]);
            if (field_name.indexOf("x") > -1 || field_name.indexOf("X") > -1 || field_name.indexOf("lat") > -1 || field_name.indexOf("latitude") > -1) {
                if (field_name.indexOf("y") > -1 || field_name.indexOf("Y") > -1 || field_name.indexOf("lon") > -1 || field_name.indexOf("longitude") > -1 || field_name.indexOf("long") > -1) {
                    add_csv_geom(data, dataset_name);
                    return;
                }
            }
            add_dataset(tmp_dataset);
        };
        reader.readAsText(f);
    }

    if (joined_dataset.length !== 0) {
        swal({
            title: "",
            text: i18next.t("app_page.common.ask_replace_dataset"),
            type: "warning",
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: i18next.t("app_page.common.confirm")
        }).then(function () {
            remove_ext_dataset_cleanup();
            check_dataset();
        }, function () {
            null;
        });
    } else {
        check_dataset();
    }
}

/**
*
*
*/
function add_dataset(readed_dataset) {
    // Check if their is an empty name in the columns name (typically the first one) and replace it by UID:
    if (readed_dataset[0].hasOwnProperty('')) {
        var new_col_name = !readed_dataset[0].hasOwnProperty('UID') ? 'UID' : 'Undefined_Name';
        for (var i = 0; i < readed_dataset.length; ++i) {
            readed_dataset[i][new_col_name] = readed_dataset[i][''];
            delete readed_dataset[i][''];
        }
    }

    // Suboptimal way to convert an eventual comma decimal separator to a point decimal separator :
    var cols = Object.getOwnPropertyNames(readed_dataset[0]);
    for (var _i = 0; _i < cols.length; _i++) {
        var tmp = [];
        // Check that all values of this field can be coerced to Number :
        for (var j = 0; j < readed_dataset.length; j++) {
            if (readed_dataset[j][cols[_i]].replace && !isNaN(+readed_dataset[j][cols[_i]].replace(",", ".")) || !isNaN(+readed_dataset[j][cols[_i]])) {
                // Add the converted value to temporary field if its ok ...
                tmp.push(+readed_dataset[j][cols[_i]].replace(",", "."));
            } else {
                // Or break early if a value can't be coerced :
                break; // So no value of this field will be converted
            }
        }
        // If the whole field has been converted successfully, apply the modification :
        if (tmp.length === readed_dataset.length) {
            for (var _j = 0; _j < readed_dataset.length; _j++) {
                readed_dataset[_j][cols[_i]] = tmp[_j];
            }
        }
    }

    joined_dataset.push(readed_dataset);
    var d_name = dataset_name.length > 20 ? [dataset_name.substring(0, 17), "(...)"].join('') : dataset_name,
        nb_features = joined_dataset[0].length,
        field_names = Object.getOwnPropertyNames(readed_dataset[0]);

    d3.select("#img_data_ext").attrs({ "id": "img_data_ext",
        "class": "user_panel",
        "src": "/static/img/b/tabular.svg",
        "width": "26", "height": "26",
        "alt": "Additional dataset" });

    d3.select('#data_ext').attr("layer-target-tooltip", ['<b>', dataset_name, '.csv</b> - ', nb_features, ' ', i18next.t("app_page.common.feature", { count: +nb_features })].join('')).html([' <b>', d_name, '</b> - <i><span style="font-size:9px;">', nb_features, ' ', i18next.t("app_page.common.feature", { count: +nb_features }), ' - ', field_names.length, ' ', i18next.t("app_page.common.field", { count: +field_names.length }), '</i></span>'].join(''));
    document.getElementById("data_ext").parentElement.innerHTML = document.getElementById("data_ext").parentElement.innerHTML + '<img width="13" height="13" src="/static/img/Trash_font_awesome.png" id="remove_dataset" style="float:right;margin-top:10px;opacity:0.5">';
    document.getElementById("remove_dataset").onclick = function () {
        remove_ext_dataset();
    };
    document.getElementById("remove_dataset").onmouseover = function () {
        this.style.opacity = 1;
    };
    document.getElementById("remove_dataset").onmouseout = function () {
        this.style.opacity = 0.5;
    };
    if (targeted_layer_added) {
        valid_join_check_display(false);
        //        document.getElementById("join_button").disabled = false;
        document.getElementById('sample_zone').style.display = "none";
    }
    if (current_functionnality && current_functionnality.name == "flow") fields_handler.fill();
    if (document.getElementById("browse_button").disabled === true) document.getElementById("browse_button").disabled = false;
    $("[layer-target-tooltip!='']").qtip("destoy");
    $("[layer-target-tooltip!='']").qtip({
        content: { attr: "layer-target-tooltip" },
        style: { classes: 'qtip-rounded qtip-light qtip_layer' },
        events: { show: { solo: true } }
        //        events: {
        //            show: function(){ $('.qtip.qtip-section1').qtip("hide") },
        //            hide: function(){ $('.qtip.qtip-section1').qtip("show") }
        //        }
    });
}

function add_csv_geom(file, name) {
    var ajaxData = new FormData();
    ajaxData.append('filename', name);
    ajaxData.append('csv_file', file);
    $.ajax({
        processData: false,
        contentType: false,
        url: '/convert_csv_geo',
        data: ajaxData,
        type: 'POST',
        error: function error(_error4) {
            console.log(_error4);
        },
        success: function success(data) {
            dataset_name = undefined;
            add_layer_topojson(data, { target_layer_on_add: true });
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
        success: function success(data) {
            add_layer_topojson(data, { target_layer_on_add: target_layer_on_add });
        },
        error: function error(_error5) {
            console.log(_error5);
        }
    });
};

function get_display_name_on_layer_list(layer_name_to_add) {
    return +layer_name_to_add.length > 28 ? [layer_name_to_add.substring(0, 23), '(...)'].join('') : layer_name_to_add;
}

// Add the TopoJSON to the 'svg' element :
function add_layer_topojson(text, options) {

    var parsedJSON = JSON.parse(text),
        result_layer_on_add = options && options.result_layer_on_add ? true : false,
        target_layer_on_add = options && options.target_layer_on_add ? true : false,
        skip_alert = options && options.skip_alert ? true : false;

    if (parsedJSON.Error) {
        // Server returns a JSON reponse like {"Error":"The error"} if something went bad during the conversion
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

    if (layers_names.length > 1) {
        swal("", i18next.t("app_page.common.warning_multiple_layers"), "warning");
    }

    var random_color1 = ColorsSelected.random(),
        lyr_name = layers_names[0],
        lyr_name_to_add = check_layer_name(options && options.choosed_name ? options.choosed_name : lyr_name);
    var nb_ft = topoObj.objects[lyr_name].geometries.length,
        topoObj_objects = topoObj.objects[lyr_name],
        field_names = topoObj_objects.geometries[0].properties ? Object.getOwnPropertyNames(topoObj_objects.geometries[0].properties) : [];

    if (topoObj_objects.geometries[0].type.indexOf('Point') > -1) type = 'Point';else if (topoObj_objects.geometries[0].type.indexOf('LineString') > -1) type = 'Line';else if (topoObj_objects.geometries[0].type.indexOf('Polygon') > -1) type = 'Polygon';

    current_layers[lyr_name_to_add] = {
        "type": type,
        "n_features": nb_ft,
        "stroke-width-const": 0.4,
        "fill_color": { "single": random_color1 },
        "key_name": parsedJSON.key
    };

    if (target_layer_on_add) {
        current_layers[lyr_name_to_add].targeted = true;
        user_data[lyr_name_to_add] = [];
        data_to_load = true;
    } else if (result_layer_on_add) {
        result_data[lyr_name_to_add] = [];
        current_layers[lyr_name_to_add].is_result = true;
    }

    map.append("g").attr("id", lyr_name_to_add).attr("class", data_to_load ? "targeted_layer layer" : "layer").styles({ "stroke-linecap": "round", "stroke-linejoin": "round" }).selectAll(".subunit").data(topojson.feature(topoObj, topoObj_objects).features).enter().append("path").attr("d", path).attr("id", function (d, ix) {
        if (data_to_load) {
            if (field_names.length > 0) {
                if (d.id != undefined && d.id != ix) {
                    d.properties["_uid"] = d.id;
                    d.id = +ix;
                }
                user_data[lyr_name_to_add].push(d.properties);
            } else {
                user_data[lyr_name_to_add].push({ "id": d.id || ix });
            }
        } else if (result_layer_on_add) result_data[lyr_name_to_add].push(d.properties);

        return "feature_" + ix;
    }).styles({ "stroke": type != 'Line' ? "rgb(0, 0, 0)" : random_color1,
        "stroke-opacity": .4,
        "fill": type != 'Line' ? random_color1 : null,
        "fill-opacity": type != 'Line' ? 0.95 : 0 }).attrs({ "height": "100%", "width": "100%" });

    var class_name = ["ui-state-default ", target_layer_on_add ? "sortable_target " : result_layer_on_add ? "sortable_result " : null, lyr_name_to_add].join('');

    var layers_listed = layer_list.node(),
        li = document.createElement("li"),
        nb_fields = field_names.length,
        layer_tooltip_content = ["<b>", lyr_name_to_add, "</b> - ", type, " - ", nb_ft, " ", i18next.t("app_page.common.feature", { count: +nb_ft }), " - ", nb_fields, " ", i18next.t("app_page.common.field", { count: +nb_fields })].join(''),
        _lyr_name_display_menu = get_display_name_on_layer_list(lyr_name_to_add);

    li.setAttribute("class", class_name);
    li.setAttribute("layer_name", lyr_name_to_add);
    li.setAttribute("layer-tooltip", layer_tooltip_content);
    if (target_layer_on_add) {
        current_layers[lyr_name_to_add].original_fields = new Set(Object.getOwnPropertyNames(user_data[lyr_name_to_add][0]));
        if (document.getElementById("browse_button").disabled === true) document.getElementById("browse_button").disabled = false;

        if (joined_dataset.length != 0) {
            valid_join_check_display(false);
            section1.select(".s1").html("").on("click", null);
            document.getElementById('sample_zone').style.display = "none";
        }

        var _button = button_type.get(type),
            _nb_fields = field_names.length,
            nb_char_display = lyr_name_to_add.length + _nb_fields.toString().length + nb_ft.toString().length,
            _lyr_name_display = +nb_char_display > 23 ? [lyr_name_to_add.substring(0, 18), '(...)'].join('') : lyr_name_to_add;

        _button = _button.substring(10, _button.indexOf("class") - 2);
        d3.select("#img_in_geom").attrs({ "src": _button, "width": "26", "height": "26" }).on("click", null);
        d3.select('#input_geom').attr("layer-target-tooltip", layer_tooltip_content).html(['<b>', _lyr_name_display, '</b> - <i><span style="font-size:9px;">', nb_ft, ' ', i18next.t("app_page.common.feature", { count: +nb_ft }), ' - ', _nb_fields, ' ', i18next.t("app_page.common.field", { count: +_nb_fields }), '</i></span>'].join(''));

        var input_geom = document.getElementById("input_geom").parentElement;
        input_geom.innerHTML = input_geom.innerHTML + '<img width="13" height="13" src="/static/img/Trash_font_awesome.png" id="remove_target" style="float:right;margin-top:10px;opacity:0.5">';
        var remove_target = document.getElementById("remove_target");
        remove_target.onclick = function () {
            remove_layer(lyr_name_to_add);
        };
        remove_target.onmouseover = function () {
            this.style.opacity = 1;
        };
        remove_target.onmouseout = function () {
            this.style.opacity = 0.5;
        };
        targeted_layer_added = true;
        li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, eye_open0, button_type.get(type), "</div> ", _lyr_name_display_menu].join('');
        $("[layer-target-tooltip!='']").qtip("destoy");
        $("[layer-target-tooltip!='']").qtip({
            content: { attr: "layer-target-tooltip" },
            style: { classes: 'qtip-rounded qtip-light qtip_layer' },
            events: { show: { solo: true } }
        });

        window._target_layer_file = topoObj;
        scale_to_lyr(lyr_name_to_add);
        center_map(lyr_name_to_add);
        if (current_functionnality) fields_handler.fill(lyr_name_to_add);
    } else if (result_layer_on_add) {
        li.innerHTML = ['<div class="layer_buttons">', sys_run_button_t2, button_trash, button_zoom_fit, eye_open0, button_legend, button_result_type.get(options.func_name ? options.func_name : current_functionnality.name), "</div> ", _lyr_name_display_menu].join('');
        center_map(lyr_name_to_add);
        switch_accordion_section();
    } else {
        li.innerHTML = ['<div class="layer_buttons">', button_style, button_trash, button_zoom_fit, eye_open0, button_type.get(type), "</div> ", _lyr_name_display_menu].join('');
    }

    if (!target_layer_on_add && current_functionnality && current_functionnality.name == "smooth") {
        fields_handler.fill();
    }

    layers_listed.insertBefore(li, layers_listed.childNodes[0]);
    up_legends();
    handleClipPath(current_proj_name);
    zoom_without_redraw();
    binds_layers_buttons(lyr_name_to_add);

    if (!skip_alert) swal("", i18next.t("app_page.common.layer_success"), "success");
    return lyr_name_to_add;
};

/**
* Change the projection scale and translate properties in order to fit the layer.
* Redraw the path from all the current layers to reflect the change.
*
* @param {string} name - The name of layer to scale on
*/
function scale_to_lyr(name) {
    name = current_layers[name].ref_layer_name || name;
    var bbox_layer_path = undefined;
    map.select("#" + name).selectAll('path').each(function (d, i) {
        var bbox_path = path.bounds(d);
        if (bbox_layer_path === undefined) {
            bbox_layer_path = bbox_path;
        } else {
            bbox_layer_path[0][0] = bbox_path[0][0] < bbox_layer_path[0][0] ? bbox_path[0][0] : bbox_layer_path[0][0];
            bbox_layer_path[0][1] = bbox_path[0][1] < bbox_layer_path[0][1] ? bbox_path[0][1] : bbox_layer_path[0][1];
            bbox_layer_path[1][0] = bbox_path[1][0] > bbox_layer_path[1][0] ? bbox_path[1][0] : bbox_layer_path[1][0];
            bbox_layer_path[1][1] = bbox_path[1][1] > bbox_layer_path[1][1] ? bbox_path[1][1] : bbox_layer_path[1][1];
        }
    });
    s = 0.95 / Math.max((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h) * proj.scale();
    proj.scale(s).translate([0, 0]).rotate([0, 0, 0]);
    map.selectAll(".layer").selectAll("path").attr("d", path);
};

/**
* Center and zoom to a layer (using zoom scale and translate properties).
* Projection properties stay unchanged.
*
* @param {string} name - The name of layer to zoom on
*/
function center_map(name) {
    var bbox_layer_path = undefined;
    //    name = current_layers[name].ref_layer_name || name;
    name = current_layers[name].symbol && current_layers[name].ref_layer_name ? current_layers[name].ref_layer_name : name;
    map.select("#" + name).selectAll('path').each(function (d, i) {
        var bbox_path = path.bounds(d);
        if (!bbox_layer_path) bbox_layer_path = bbox_path;else {
            bbox_layer_path[0][0] = bbox_path[0][0] < bbox_layer_path[0][0] ? bbox_path[0][0] : bbox_layer_path[0][0];
            bbox_layer_path[0][1] = bbox_path[0][1] < bbox_layer_path[0][1] ? bbox_path[0][1] : bbox_layer_path[0][1];
            bbox_layer_path[1][0] = bbox_path[1][0] > bbox_layer_path[1][0] ? bbox_path[1][0] : bbox_layer_path[1][0];
            bbox_layer_path[1][1] = bbox_path[1][1] > bbox_layer_path[1][1] ? bbox_path[1][1] : bbox_layer_path[1][1];
        }
    });
    var zoom_scale = .95 / Math.max((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    var zoom_translate = [(w - zoom_scale * (bbox_layer_path[1][0] + bbox_layer_path[0][0])) / 2, (h - zoom_scale * (bbox_layer_path[1][1] + bbox_layer_path[0][1])) / 2];
    var _zoom = svg_map.__zoom;
    _zoom.k = zoom_scale;
    _zoom.x = zoom_translate[0];
    _zoom.y = zoom_translate[1];
};

function select_layout_features() {
    var available_features = [["north_arrow", i18next.t("app_page.layout_features_box.north_arrow")], ["scale", i18next.t("app_page.layout_features_box.scale")], ["sphere", i18next.t("app_page.layout_features_box.sphere")], ["graticule", i18next.t("app_page.layout_features_box.graticule")], ["text_annot", i18next.t("app_page.layout_features_box.text_annot")], ["arrow", i18next.t("app_page.layout_features_box.arrow")], ["ellipse", i18next.t("app_page.layout_features_box.ellipse")], ["symbol", i18next.t("app_page.layout_features_box.symbol")]];
    var selected_ft;

    make_confirm_dialog("sampleLayoutFtDialogBox", i18next.t("app_page.layout_features_box.title")).then(function (confirmed) {
        if (confirmed) add_layout_feature(selected_ft);
    });

    var box_body = d3.select(".sampleLayoutFtDialogBox");
    box_body.node().parentElement.style.width = "auto";
    box_body.append('h3').html(i18next.t("app_page.layout_features_box.subtitle"));

    var layout_ft_selec = box_body.append('p').html('').insert('select').attrs({ class: 'sample_layout',
        size: available_features.length });

    available_features.forEach(function (ft) {
        layout_ft_selec.append("option").html(ft[1]).attr("value", ft[0]);
    });
    layout_ft_selec.on("change", function () {
        selected_ft = this.value;
    });

    if (!window.default_symbols) {
        window.default_symbols = [];
        prepare_available_symbols();
    }
}

function setSphereBottom() {
    var layers = document.querySelectorAll(".layer"),
        layers_list = document.querySelector(".layer_list");

    svg_map.insertBefore(layers[layers.length - 1], layers[0]);
    layers_list.appendChild(layers_list.childNodes[0]);
}

function add_layout_feature(selected_feature) {
    if (selected_feature == "text_annot") {
        var existing_annotation = document.querySelectorAll(".txt_annot"),
            existing_id = [],
            new_id = void 0;
        if (existing_annotation) existing_id = Array.prototype.map.call(existing_annotation, function (elem) {
            return +elem.childNodes[0].id.split('text_annotation_')[1];
        });
        for (var i = 0; i < 25; i++) {
            if (existing_id.indexOf(i) == -1) {
                existing_id.push(i);
                new_id = ["text_annotation_", i].join('');
                break;
            } else continue;
        }
        if (!new_id) {
            swal(i18next.t("app_page.common.error") + "!", i18next.t("Maximum number of text annotations has been reached"), "error");
            return;
        }
        var txt_box = new Textbox(svg_map, new_id);
    } else if (selected_feature == "sphere") {
        if (current_layers.Sphere) return;
        current_layers["Sphere"] = { "type": "Polygon", "n_features": 1, "stroke-width-const": 0.5, "fill_color": { single: "#add8e6" } };
        map.append("g").attrs({ id: "Sphere", class: "layer", "stroke-width": "0.5px", "stroke": "black" }).append("path").datum({ type: "Sphere" }).styles({ fill: "lightblue", "fill-opacity": 0.2 }).attr("id", "sphere").attr("clip-path", "url(#clip)").attr("d", path);
        create_li_layer_elem("Sphere", null, "Polygon", "sample");
        zoom_without_redraw();
        setSphereBottom();
    } else if (selected_feature == "graticule") {
        if (current_layers["Graticule"] != undefined) return;
        map.append("g").attrs({ id: "Graticule", class: "layer" }).append("path").attr("class", "graticule").style("stroke-dasharray", 5).datum(d3.geoGraticule()).attr("clip-path", "url(#clip)").attr("d", path).style("fill", "none").style("stroke", "grey");
        current_layers["Graticule"] = { "type": "Line", "n_features": 1, "stroke-width-const": 1, "fill_color": { single: "grey" } };
        create_li_layer_elem("Graticule", null, "Line", "sample");
        zoom_without_redraw();
    } else if (selected_feature == "scale") {
        if (!scaleBar.displayed) scaleBar.create();else swal(i18next.t("app_page.common.error") + "!", i18next.t("app_page.common.error_existing_scalebar"), "error");
    } else if (selected_feature == "north_arrow") {
        northArrow.display();
    } else if (selected_feature == "arrow") {
        handleClickAddArrow();
    } else if (selected_feature == "ellipse") {
        handleClickAddEllipse();
    } else if (selected_feature == "symbol") {
        var a = box_choice_symbol(window.default_symbols).then(function (result) {
            if (result) {
                add_single_symbol(result);
            }
        });
    } else {
        swal(i18next.t("app_page.common.error") + "!", i18next.t("app_page.common.error"), "error");
    }
}

function add_single_symbol(symbol_dataurl) {
    var context_menu = new ContextMenu(),
        getItems = function getItems(self_parent) {
        return [{ "name": "Edit style...", "action": function action() {
                make_style_box_indiv_symbol(self_parent);
            } }, { "name": "Delete", "action": function action() {
                self_parent.style.display = "none";
            } }];
    };

    map.append("g").attrs({ class: "legend_features legend single_symbol" }).insert("image").attr("x", w / 2).attr("y", h / 2).attr("width", "30px").attr("height", "30px").attr("xlink:href", symbol_dataurl.split("url(")[1].substring(1).slice(0, -2)).on("mouseover", function () {
        this.style.cursor = "pointer";
    }).on("mouseout", function () {
        this.style.cursor = "initial";
    }).on("dblclick contextmenu", function () {
        context_menu.showMenu(d3.event, document.querySelector("body"), getItems(this));
    }).call(drag_elem_geo);
}

var drag_lgd_features = d3.drag().subject(function () {
    var t = d3.select(this),
        prev_translate = t.attr("transform");
    prev_translate = prev_translate ? prev_translate.slice(10, -1).split(',').map(function (f) {
        return +f;
    }) : [0, 0];
    return {
        x: t.attr("x") + prev_translate[0], y: t.attr("y") + prev_translate[1]
    };
}).on("start", function () {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
}).on("end", function () {
    if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
}).on("drag", function () {
    var t = d3.select(this),
        scale_value = t.attr("scale"),
        rotation_value = t.attr("rotate");
    scale_value = scale_value ? "scale(" + scale_value + ")" : "";
    rotation_value = rotation_value ? "rotate(" + rotation_value + ",0,0)" : "";
    t.attr('transform', 'translate(' + [d3.event.x, d3.event.y] + ')' + scale_value + rotation_value);
});

function add_layout_layers() {
    var selec = { layout: null };
    var layout_layers = [[i18next.t("app_page.layout_layer_box.nuts0"), "nuts0"], [i18next.t("app_page.layout_layer_box.nuts1"), "nuts1"], [i18next.t("app_page.layout_layer_box.nuts2"), "nuts2"], [i18next.t("app_page.layout_layer_box.world_countries"), "world_country"], [i18next.t("app_page.layout_layer_box.world_capitals"), "world_cities"]];

    make_confirm_dialog("sampleLayoutDialogBox", i18next.t("app_page.layout_layer_box.title")).then(function (confirmed) {
        if (confirmed) {
            if (selec.layout && selec.layout.length > 0) {
                for (var i = 0; i < selec.layout.length; ++i) {
                    add_sample_geojson(selec.layout[i]);
                }
            }
        }
    });

    var box_body = d3.select(".sampleLayoutDialogBox").style("text-align", "center");
    box_body.node().parentElement.style.width = "auto";
    box_body.append('h3').html(i18next.t("app_page.layout_layer_box.msg_select_layer"));
    box_body.append("p").style("color", "grey").html(i18next.t("app_page.layout_layer_box.msg_select_multi"));

    var layout_layer_selec = box_body.append('p').html('').insert('select').attrs({ class: 'sample_layout', multiple: "multiple", size: layout_layers.length });
    layout_layers.forEach(function (layer_info) {
        layout_layer_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);
    });
    layout_layer_selec.on("change", function () {
        var selected_asArray = Array.prototype.slice.call(this.selectedOptions);
        selec.layout = selected_asArray.map(function (elem) {
            return elem.value;
        });
    });
    box_body.append("span").style("font-size", "0.65rem").html(i18next.t("app_page.layout_layer_box.disclamer_nuts"));
}

function add_sample_layer() {
    var dialog_res = [],
        selec = { layout: null, target: null },
        sample_datasets = undefined;

    d3.json('/static/json/sample_layers.json', function (error, json) {
        sample_datasets = json[0];
    });

    var target_layers = [[i18next.t("app_page.sample_layer_box.target_layer"), ""], [i18next.t("app_page.sample_layer_box.paris_hospitals"), "paris_hospitals"], [i18next.t("app_page.sample_layer_box.grandparismunicipalities"), "GrandParisMunicipalities"], [i18next.t("app_page.sample_layer_box.martinique"), "martinique"], [i18next.t("app_page.sample_layer_box.nuts2_data"), "nuts2_data"], [i18next.t("app_page.sample_layer_box.nuts3_data"), "nuts3_data"], [i18next.t("app_page.sample_layer_box.world_countries"), "world_countries_50m"], [i18next.t("app_page.sample_layer_box.us_county"), "us_county"], [i18next.t("app_page.sample_layer_box.us_states"), "us_states"]];

    var tabular_datasets = [[i18next.t("app_page.sample_layer_box.tabular_dataset"), ""], [i18next.t("app_page.sample_layer_box.twincities"), "twincities"], [i18next.t("app_page.sample_layer_box.gpm_dataset"), 'gpm_dataset'], [i18next.t("app_page.sample_layer_box.martinique_data"), 'martinique_data'],
    //                    ['GDP - GNIPC - Population - WGI - etc. (World Bank 2015 datasets extract) <i>(To link with World countries geometries)</i>', 'wb_extract.csv'],
    [i18next.t("app_page.sample_layer_box.bondcountries"), 'bondcountries']];

    make_confirm_dialog("sampleDialogBox", i18next.t("app_page.sample_layer_box.title")).then(function (confirmed) {
        if (confirmed) {
            var url = undefined;
            if (selec.target) {
                add_sample_geojson(selec.target, { target_layer_on_add: true });
            }
            if (selec.dataset) {
                url = sample_datasets[selec.dataset];
                d3.csv(url, function (error, data) {
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
    target_layers.forEach(function (layer_info) {
        t_layer_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);
    });
    t_layer_selec.on("change", function () {
        selec.target = this.value;
    });

    var title_tab_dataset = box_body.append('h3').html(i18next.t("app_page.sample_layer_box.subtitle2"));

    var dataset_selec = box_body.append('p').html('').insert('select').attr("class", "sample_dataset");
    tabular_datasets.forEach(function (layer_info) {
        dataset_selec.append("option").html(layer_info[0]).attr("value", layer_info[1]);
    });
    dataset_selec.on("change", function () {
        selec.dataset = this.value;
    });

    if (targeted_layer_added) {
        title_tgt_layer.style("color", "grey").html("<i>" + i18next.t("app_page.sample_layer_box.subtitle1") + "</i>");
        t_layer_selec.node().disabled = true;
    }

    if (joined_dataset.length > 0) {
        title_tab_dataset.style("color", "grey").html("<i>" + i18next.t("app_page.sample_layer_box.subtitle2") + "</i>");
        dataset_selec.node().disabled = true;
    }
}

function add_sample_geojson(name, options) {
    var formToSend = new FormData();
    formToSend.append("layer_name", name);
    $.ajax({
        processData: false,
        contentType: false,
        url: '/cache_topojson/sample_data',
        data: formToSend,
        type: 'POST',
        success: function success(data) {
            add_layer_topojson(data, options);
        },
        error: function error(_error6) {
            console.log(_error6);
        }
    });
}

function send_remove_server(layer_name) {
    var formToSend = new FormData();
    formToSend.append("layer_name", current_layers[layer_name].key_name);
    $.ajax({
        processData: false,
        contentType: false,
        global: false,
        url: '/layers/delete',
        data: formToSend,
        type: 'POST',
        success: function success(data) {
            console.log(JSON.parse(data));
        },
        error: function error(_error7) {
            console.log(_error7);
        }
    });
}

function get_map_xy0() {
    var bbox = svg_map.getBoundingClientRect();
    return { x: bbox.left, y: bbox.top };
}

function handleClickAddEllipse() {
    var getId = function getId() {
        var ellipses = document.querySelectorAll(".user_ellipse");
        if (!ellipses) {
            return 0;
        } else if (ellipses.length > 30) {
            swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_max_arrows"), "error");
            return null;
        } else {
            var ids = [];
            for (var i = 0; i < ellipses.length; i++) {
                ids.push(+ellipses[i].id.split("user_ellipse_")[1]);
            }
            if (ids.indexOf(ellipses.length) == -1) {
                return ellipses.length;
            } else {
                for (var _i2 = 0; _i2 < ellipses.length; _i2++) {
                    if (ids.indexOf(_i2) == -1) {
                        return _i2;
                    }
                }
            }
            return null;
        }
        return null;
    };

    var start_point = void 0,
        tmp_start_point = void 0,
        ellipse_id = getId();

    if (ellipse_id === null) {
        swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_message", { msg: "" }), "error");
        return;
    } else {
        ellipse_id = "user_ellipse_" + ellipse_id;
    }

    map.style("cursor", "crosshair").on("click", function () {
        start_point = [d3.event.layerX, d3.event.layerY];
        tmp_start_point = map.append("rect").attr("x", start_point[0] - 2).attr("y", start_point[1] - 2).attr("height", 4).attr("width", 4).style("fill", "red");
        setTimeout(function () {
            tmp_start_point.remove();
        }, 1000);
        map.style("cursor", "").on("click", null);
        new UserEllipse(ellipse_id, start_point, svg_map);
    });
}

function handleClickAddArrow() {
    var getId = function getId() {
        var arrows = document.querySelectorAll(".arrow");
        if (!arrows) {
            return 0;
        } else if (arrows.length > 30) {
            swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_max_arrows"), "error");
            return null;
        } else {
            var ids = [];
            for (var i = 0; i < arrows.length; i++) {
                ids.push(+arrows[i].id.split("arrow_")[1]);
            }
            if (ids.indexOf(arrows.length) == -1) {
                return arrows.length;
            } else {
                for (var _i3 = 0; _i3 < arrows.length; _i3++) {
                    if (ids.indexOf(_i3) == -1) {
                        return _i3;
                    }
                }
            }
            return null;
        }
        return null;
    };

    var start_point = void 0,
        tmp_start_point = void 0,
        end_point = void 0,
        tmp_end_point = void 0,
        arrow_id = getId();

    if (arrow_id === null) {
        swal(i18next.t("app_page.common.error"), i18next.t("app_page.common.error_message", { msg: "" }), "error");
        return;
    } else {
        arrow_id = "arrow_" + arrow_id;
    }

    map.style("cursor", "crosshair").on("click", function () {
        if (!start_point) {
            start_point = [d3.event.layerX, d3.event.layerY];
            tmp_start_point = map.append("rect").attr("x", start_point[0] - 2).attr("y", start_point[1] - 2).attr("height", 4).attr("width", 4).style("fill", "red");
        } else {
            end_point = [d3.event.layerX, d3.event.layerY];
            tmp_end_point = map.append("rect").attr("x", end_point[0] - 2).attr("y", end_point[1] - 2).attr("height", 4).attr("width", 4).style("fill", "red");
        }
        if (start_point && end_point) {
            setTimeout(function () {
                tmp_start_point.remove();
                tmp_end_point.remove();
            }, 1000);
            map.style("cursor", "").on("click", null);
            new UserArrow(arrow_id, start_point, end_point, svg_map);
        }
    });
}

function prepare_available_symbols() {
    var list_symbols = request_data('GET', '/static/json/list_symbols.json', null).then(function (list_res) {
        list_res = JSON.parse(list_res.target.responseText);
        Q.all(list_res.map(function (name) {
            return request_data('GET', "/static/img/svg_symbols/" + name, null);
        })).then(function (symbols) {
            for (var i = 0; i < list_res.length; i++) {
                default_symbols.push([list_res[i], symbols[i].target.responseText]);
            }
        });
    });
}
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function handle_join() {
    var layer_name = Object.getOwnPropertyNames(user_data);

    if (!(layer_name.length === 1 && joined_dataset.length === 1)) {
        swal("", i18next.t("app_page.join_box.unable_join"), "error");
        return;
    } else if (field_join_map.length != 0) {
        make_confirm_dialog(undefined, undefined, { html_content: i18next.t("app_page.join_box.ask_forget_join") }).then(function (confirmed) {
            if (confirmed) {
                field_join_map = [];
                createJoinBox(layer_name[0]);
            }
        });
    } else if (user_data[layer_name].length != joined_dataset[0].length) {
        make_confirm_dialog(undefined, undefined, { html_content: i18next.t("app_page.join_box.ask_diff_nb_features") }).then(function (confirmed) {
            if (confirmed) {
                createJoinBox(layer_name[0]);
            }
        });
    } else {
        createJoinBox(layer_name[0]);
    }
}

// Function called to update the menu according to user operation (triggered when layers/dataset are added and after a join operation)
function valid_join_check_display(val, prop) {
    if (!val) {
        var ext_dataset_img = document.getElementById("img_data_ext");
        ext_dataset_img.setAttribute("src", "/static/img/b/joinfalse.svg");
        ext_dataset_img.setAttribute("alt", "Non-validated join");
        ext_dataset_img.style.width = "28px";
        ext_dataset_img.style.height = "28px";
        ext_dataset_img.onclick = handle_join;

        var join_sec = document.getElementById("join_section");
        join_sec.innerHTML = [prop, i18next.t('app_page.join_box.state_not_joined')].join('');

        var button = document.createElement("button");
        button.setAttribute("id", "join_button");
        button.style.display = "inline";
        button.innerHTML = '<button style="font-size: 11px;" class="button_st3" id="_join_button">' + i18next.t("app_page.join_box.button_join") + '</button>';
        button.onclick = handle_join;
        join_sec.appendChild(button);
    } else {
        var _ext_dataset_img = document.getElementById("img_data_ext");
        _ext_dataset_img.setAttribute("src", "/static/img/b/jointrue.svg");
        _ext_dataset_img.setAttribute("alt", "Validated join");
        _ext_dataset_img.style.width = "28px";
        _ext_dataset_img.style.height = "28px";
        _ext_dataset_img.onclick = null;

        var _prop$split$map = prop.split("/").map(function (d) {
            return +d;
        });

        var _prop$split$map2 = _slicedToArray(_prop$split$map, 2);

        var v1 = _prop$split$map2[0];
        var v2 = _prop$split$map2[1];


        var _join_sec = document.getElementById("join_section");
        _join_sec.innerHTML = [' <b>', prop, i18next.t("app_page.join_box.match", { count: v1 }), '</b>'].join(' ');

        var _button = document.createElement("button");
        _button.setAttribute("id", "join_button");
        _button.style.display = "inline";
        _button.innerHTML = [" - <i> ", i18next.t("app_page.join_box.change_field"), " </i>"].join('');
        _button.onclick = handle_join;
        _join_sec.appendChild(_button);
    }
}

// Where the real join is done
// Its two main results are:
//    -the update of the global "field_join_map" array
//       (storing the relation between index of the geometry layer and index of the external dataset)
//    -the update of the global "user_data" object, adding actualy the value to each object representing each feature of the layer
function valid_join_on(layer_name, field1, field2) {
    var join_values1 = [],
        join_values2 = [],
        hits = 0,
        val = undefined;

    field_join_map = [];

    for (var i = 0, len = joined_dataset[0].length; i < len; i++) {
        join_values2.push(joined_dataset[0][i][field2]);
    }

    var join_set2 = new Set(join_values2);
    if (join_set2.size != join_values2.length) {
        swal("", i18next.t("app_page.join_box.error_not_uniques"), "warning");
        return;
    }

    for (var _i = 0, _len = user_data[layer_name].length; _i < _len; _i++) {
        join_values1.push(user_data[layer_name][_i][field1]);
    }

    var join_set1 = new Set(join_values1);
    if (join_set1.size != join_values1.length) {
        swal("", i18next.t("app_page.join_box.error_not_uniques"), "warning");
        return;
    }

    if (typeof join_values1[0] === "number" && typeof join_values2[0] === "string") {
        for (var _i2 = 0, _len2 = join_values1.length; _i2 < _len2; _i2++) {
            val = join_values2.indexOf(String(join_values1[_i2]));
            if (val != -1) {
                field_join_map.push(val);hits++;
            } else {
                field_join_map.push(undefined);
            }
        }
    } else if (typeof join_values2[0] === "number" && typeof join_values1[0] === "string") {
        for (var _i3 = 0, _len3 = join_values1.length; _i3 < _len3; _i3++) {
            val = join_values2.indexOf(Number(join_values1[_i3]));
            if (val != -1) {
                field_join_map.push(val);hits++;
            } else {
                field_join_map.push(undefined);
            }
        }
    } else {
        for (var _i4 = 0, _len4 = join_values1.length; _i4 < _len4; _i4++) {
            val = join_values2.indexOf(String(join_values1[_i4]));
            if (val != -1) {
                field_join_map.push(val);hits++;
            } else {
                field_join_map.push(undefined);
            }
        }
    }

    var prop = [hits, "/", join_values1.length].join(""),
        f_name = "";

    if (hits == join_values1.length) {
        var fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]);
        for (var _i5 = 0, _len5 = join_values1.length; _i5 < _len5; _i5++) {
            val = field_join_map[_i5];
            for (var j = 0, leng = fields_name_to_add.length; j < leng; j++) {
                f_name = fields_name_to_add[j];
                if (f_name.length > 0) {
                    user_data[layer_name][_i5][f_name] = joined_dataset[0][val][f_name];
                }
            }
        }
        valid_join_check_display(true, prop);
        return true;
    } else if (hits > 0) {
        //        var rep = confirm(["Partial join : ", prop, " geometries found a match. Validate ?"].join(""));
        var rep = confirm(i18next.t("app_page.join_box.partial_join", { ratio: prop }));
        if (rep) {
            var _fields_name_to_add = Object.getOwnPropertyNames(joined_dataset[0][0]),
                i_id = _fields_name_to_add.indexOf("id");

            if (i_id > -1) {
                _fields_name_to_add.splice(i_id, 1);
            }
            for (var _i6 = 0, _len6 = join_values1.length; _i6 < _len6; _i6++) {
                val = field_join_map[_i6];
                for (var _j = 0, _leng = _fields_name_to_add.length; _j < _leng; _j++) {
                    f_name = _fields_name_to_add[_j];
                    if (f_name.length > 0) {
                        user_data[layer_name][_i6][f_name] = val ? joined_dataset[0][val][f_name] : null;
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
        swal("", i18next.t("app_page.join_box.no_match", { field1: field1, field2: field2 }), "error");
        field_join_map = [];
        return false;
    }
}

// Function creating the join box , filled by to "select" input linked one to
// the geometry layer and the other to the external dataset, in order to choose
// the common field to do the join.
function createJoinBox(layer) {
    var geom_layer_fields = Object.getOwnPropertyNames(user_data[layer][0]),
        ext_dataset_fields = Object.getOwnPropertyNames(joined_dataset[0][0]),
        button1 = ["<select id=button_field1>"],
        button2 = ["<select id=button_field2>"],
        last_choice = { "field1": geom_layer_fields[0], "field2": ext_dataset_fields[0] };

    for (var i = 0, len = geom_layer_fields.length; i < len; i++) {
        button1.push(['<option value="', geom_layer_fields[i], '">', geom_layer_fields[i], '</option>'].join(''));
    }button1.push("</select>");

    for (var _i7 = 0, _len7 = ext_dataset_fields.length; _i7 < _len7; _i7++) {
        if (ext_dataset_fields[_i7].length > 0) button2.push(['<option value="', ext_dataset_fields[_i7], '">', ext_dataset_fields[_i7], '</option>'].join(''));
    }button2.push("</select>");

    var inner_box = ['<p><b><i>', i18next.t("app_page.join_box.select_fields"), '</i></b></p>', '<div style="padding:10px"><p>', i18next.t("app_page.join_box.geom_layer_field"), '</p>', button1.join(''), '<em style="float:right;">(', layer, ')</em></div>', '<div style="padding:15px 10px 10px"><p>', i18next.t("app_page.join_box.ext_dataset_field"), '<br></p>', button2.join(''), '<em style="float:right;">(', dataset_name, '.csv)</em></div>', '<br><p><strong>', i18next.t("app_page.join_box.ask_join"), '<strong></p></div>'].join('');

    make_confirm_dialog("joinBox", i18next.t("app_page.join_box.title"), { html_content: inner_box }).then(function (confirmed) {
        if (confirmed) {
            var join_res = valid_join_on(layer, last_choice.field1, last_choice.field2);
            if (join_res && window.fields_handler) {
                fields_handler.unfill();
                fields_handler.fill(layer);
            }
        }
    });
    d3.select(".joinBox").styles({ "text-align": "center", "line-height": "0.9em" });
    d3.select("#button_field1").style("float", "left").on("change", function () {
        last_choice.field1 = this.value;
    });
    d3.select("#button_field2").style("float", "left").on("change", function () {
        last_choice.field2 = this.value;
    });
}
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function handle_click_layer(layer_name) {
    if (current_layers[layer_name].renderer && (current_layers[layer_name].renderer.indexOf("PropSymbol") > -1 || current_layers[layer_name].renderer.indexOf("Dorling") > -1)) createStyleBox_ProbSymbol(layer_name);else if (current_layers[layer_name].renderer && current_layers[layer_name].renderer == "Label") createStyleBoxLabel(layer_name);else if (current_layers[layer_name].renderer && current_layers[layer_name].renderer == "TypoSymbols") createStyleBoxTypoSymbols(layer_name);else createStyleBox(layer_name);
    return;
};

var setSelected = function setSelected(selectNode, value) {
    selectNode.value = value;
    selectNode.dispatchEvent(new Event('change'));
};

function make_single_color_menu(layer, fill_prev) {
    var symbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "path";

    var fill_color_section = d3.select("#fill_color_section"),
        g_lyr_name = "#" + layer,
        last_color = fill_prev && fill_prev.single ? fill_prev.single : undefined;
    fill_color_section.insert('p').html(i18next.t("app_page.layer_style_popup.fill_color")).insert('input').attrs({ type: 'color', "value": last_color }).on('change', function () {
        map.select(g_lyr_name).selectAll(symbol).style("fill", this.value);
        current_layers[layer].fill_color = { "single": this.value };
    });
}

function make_random_color(layer) {
    var symbol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "path";

    d3.select("#fill_color_section").style("text-align", "center").html(i18next.t("app_page.layer_style_popup.toggle_colors")).on("click", function (d, i) {
        map.select("#" + layer).selectAll(symbol).style("fill", function () {
            return Colors.names[Colors.random()];
        });
        current_layers[layer].fill_color = { "random": true };
        make_random_color(layer, symbol);
    });
}

function fill_categorical(layer, field_name, symbol, color_cat_map, ref_layer) {
    var data_layer = ref_layer ? user_data[ref_layer] : user_data[layer] ? user_data[layer] : result_data[layer];

    if (ref_layer && current_layers[layer].features_order) {
        (function () {
            var features_order = current_layers[layer].features_order;
            map.select("#" + layer).selectAll(symbol).style("fill", function (d, i) {
                var idx = features_order[i][0];
                return color_cat_map.get(data_layer[idx][field_name]);
            });
        })();
    } else if (ref_layer) map.select("#" + layer).selectAll(symbol).style("fill", function (d, i) {
        return color_cat_map.get(data_layer[i][field_name]);
    });else map.select("#" + layer).selectAll(symbol).style("fill", function (d) {
        return color_cat_map.get(d.properties[field_name]);
    });
}

function make_categorical_color_menu(fields, layer, fill_prev) {
    var symbol = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "path";
    var ref_layer = arguments[4];

    var fill_color_section = d3.select("#fill_color_section");
    var field_selec = fill_color_section.insert("p").html(i18next.t("app_page.layer_style_popup.categorical_field")).insert("select");
    fields.forEach(function (field) {
        if (field != "id") field_selec.append("option").text(field).attr("value", field);
    });
    if (fill_prev.categorical && fill_prev.categorical instanceof Array) setSelected(field_selec.node(), fill_prev.categorical[0]);

    field_selec.on("change", function () {
        var field_name = this.value,
            data_layer = ref_layer ? user_data[ref_layer] : current_layers[layer].is_result ? result_data[layer] : user_data[layer],
            values = data_layer.map(function (i) {
            return i[field_name];
        }),
            cats = new Set(values),
            txt = [cats.size, " cat."].join('');
        d3.select("#nb_cat_txt").html(txt);
        var color_cat_map = new Map();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = cats[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var val = _step.value;

                color_cat_map.set(val, Colors.names[Colors.random()]);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        current_layers[layer].fill_color = { "categorical": [field_name, color_cat_map] };
        fill_categorical(layer, field_name, symbol, color_cat_map, ref_layer);
    });

    if ((!fill_prev || !fill_prev.categorical) && field_selec.node().options.length > 0) setSelected(field_selec.node(), field_selec.node().options[0].value);

    fill_color_section.append("p").attr("id", "nb_cat_txt").html("");
};

var cloneObj = function cloneObj(obj) {
    if (obj === null || (typeof obj === "undefined" ? "undefined" : _typeof(obj)) !== "object") return obj;else if (obj.toString() == "[object Map]") {
        return new Map(obj.entries());
    } else {
        return Object.assign({}, obj);
    }
};

function createStyleBoxTypoSymbols(layer_name) {
    function get_prev_settings() {
        var features = selection._groups[0];
        for (var i = 0; i < features.length; i++) {
            prev_settings.push({
                "display": features[i].style.display ? features[i].style.display : null,
                "size": features[i].getAttribute("width"),
                "position": [features[i].getAttribute("x"), features[i].getAttribute("y")]
            });
        }
        prev_settings_defaults["size"] = current_layers[layer_name].default_size;
    }

    function restore_prev_settings() {
        var features = selection._groups[0];
        for (var i = 0; i < features.length; i++) {
            features[i].setAttribute("width", prev_settings[i]["size"]);
            features[i].setAttribute("height", prev_settings[i]["size"]);
            features[i].setAttribute("x", prev_settings[i]["position"][0]);
            features[i].setAttribute("y", prev_settings[i]["position"][1]);
            features[i].style.display = prev_settings[i]["display"];
        }
        current_layers[layer_name].default_size = prev_settings_defaults.size;
    }

    var selection = map.select("#" + layer_name).selectAll("image"),
        ref_layer_name = current_layers[layer_name].ref_layer_name,
        ref_layer_selection = document.getElementById(ref_layer_name).querySelectorAll("path"),
        symbols_map = current_layers[layer_name].symbols_map,
        rendered_field = current_layers[layer_name].rendered_field,
        ref_coords = [];

    var prev_settings = [],
        prev_settings_defaults = {};

    get_prev_settings();

    for (var i = 0; i < ref_layer_selection.length; i++) {
        ref_coords.push(path.centroid(ref_layer_selection[i].__data__));
    }

    make_confirm_dialog("styleBox", layer_name, { top: true }).then(function (confirmed) {
        if (!confirmed) {
            restore_prev_settings();
        }
    });

    var popup = d3.select(".styleBox");
    popup.append("p").styles({ "text-align": "center", "color": "grey" }).html([i18next.t("app_page.layer_style_popup.rendered_field", { field: rendered_field }), i18next.t("app_page.layer_style_popup.reference_layer", { layer: ref_layer_name })].join(''));

    popup.append("p").style("text-align", "center").insert("button").attr("id", "reset_symb_loc").attr("class", "button_st4").text(i18next.t("app_page.layer_style_popup.reset_symbols_location")).on("click", function () {
        selection.attr("x", function (d, i) {
            return ref_coords[i][0] - symbols_map.get(d.Symbol_field)[1] / 2;
        }).attr("y", function (d, i) {
            return ref_coords[i][1] - symbols_map.get(d.Symbol_field)[1] / 2;
        });
    });

    popup.append("p").style("text-align", "center").insert("button").attr("id", "reset_symb_display").attr("class", "button_st4").text(i18next.t("app_page.layer_style_popup.redraw_symbols")).on("click", function () {
        selection.style("display", undefined);
    });

    //    popup.append("p").style("text-align", "center")
    //            .insert("button")
    //            .attr("id","modif_symb")
    //            .attr("class", "button_st4")
    //            .text(i18next.t("app_page.layer_style_popup.modify_symbols"))
    //            .on("click", function(){
    //                display_box_symbol_typo(ref_layer_name, rendered_field)().then(function(confirmed){
    //                    if(confirmed){
    //                        rendering_params = {
    //                            nb_cat: confirmed[0],
    //                            symbols_map: confirmed[1],
    //                            field: rendered_field
    //                        };
    //                        map.select("#" + layer_name)
    //                            .selectAll("image")
    //                            .attr("x", d => d.coords[0] - rendering_params.symbols_map.get(d.Symbol_field)[1] / 2)
    //                            .attr("y", d => d.coords[1] - rendering_params.symbols_map.get(d.Symbol_field)[1] / 2)
    //                            .attr("width", d => rendering_params.symbols_map.get(d.Symbol_field)[1] + "px")
    //                            .attr("height", d => rendering_params.symbols_map.get(d.Symbol_field)[1] + "px")
    //                            .attr("xlink:href", (d,i) => rendering_params.symbols_map.get(d.Symbol_field)[0]);
    //                    }
    //                });
    //            });
}

function createStyleBoxLabel(layer_name) {
    function get_prev_settings() {
        var features = selection._groups[0];
        prev_settings = [];
        for (var i = 0; i < features.length; i++) {
            prev_settings.push({
                "color": features[i].style.fill,
                "size": features[i].style.fontSize,
                "display": features[i].style.display ? features[i].style.display : null,
                "position": [features[i].getAttribute("x"), features[i].getAttribute("y")]
            });
        }
        prev_settings_defaults = {
            "color": current_layers[layer_name].fill_color,
            "size": current_layers[layer_name].default_size
        };
    };

    function restore_prev_settings() {
        var features = selection._groups[0];
        for (var i = 0; i < features.length; i++) {
            features[i].style.fill = prev_settings[i]["color"];
            features[i].style.fontSize = prev_settings[i]["size"];
            features[i].style.display = prev_settings[i]["display"];
            features[i].setAttribute("x", prev_settings[i]["position"][0]);
            features[i].setAttribute("y", prev_settings[i]["position"][1]);
        }

        current_layers[layer_name].fill_color = prev_settings_defaults.color;
        current_layers[layer_name].default_size = prev_settings_defaults.size;
    };

    var selection = map.select("#" + layer_name).selectAll("text"),
        ref_layer_name = current_layers[layer_name].ref_layer_name,
        ref_layer_selection = document.getElementById(ref_layer_name).querySelectorAll("path"),
        ref_coords = [];

    var prev_settings = [],
        prev_settings_defaults = {},
        rendering_params = {};

    get_prev_settings();

    for (var i = 0; i < ref_layer_selection.length; i++) {
        ref_coords.push(path.centroid(ref_layer_selection[i].__data__));
    }

    make_confirm_dialog("styleBox", layer_name, { top: true }).then(function (confirmed) {
        if (!confirmed) {
            restore_prev_settings();
        }
    });
    var popup = d3.select(".styleBox");
    popup.append("p").styles({ "text-align": "center", "color": "grey" }).html([i18next.t("app_page.layer_style_popup.rendered_field", { field: current_layers[layer_name].rendered_field }), i18next.t("app_page.layer_style_popup.reference_layer", { layer: ref_layer_name })].join(''));
    popup.append("p").style("text-align", "center").insert("button").attr("id", "reset_labels_loc").attr("class", "button_st4").text(i18next.t("app_page.layer_style_popup.reset_labels_location")).on("click", function () {
        selection.attr("x", function (d, i) {
            return ref_coords[i][0];
        }).attr("y", function (d, i) {
            return ref_coords[i][1];
        });
    });

    popup.append("p").style("text-align", "center").insert("button").attr("id", "reset_labels_display").attr("class", "button_st4").text(i18next.t("app_page.layer_style_popup.redraw_labels")).on("click", function () {
        selection.style("display", undefined);
    });

    popup.insert("p").style("text-align", "center").style("font-size", "9px").html(i18next.t("app_page.layer_style_popup.overrride_warning"));
    var label_sizes = popup.append("p").html(i18next.t("app_page.layer_style_popup.labels_default_size"));
    label_sizes.insert("input").attr("type", "number").attr("value", +current_layers[layer_name].default_size.replace("px", "")).on("change", function () {
        var size = this.value + "px";
        current_layers[layer_name].default_size = size;
        selection.style("font-size", size);
    });
    label_sizes.insert("span").html(" px");
    popup.insert("p").html(i18next.t("app_page.layer_style_popup.labels_default_color")).insert("input").attr("type", "color").attr("value", current_layers[layer_name].fill_color).on("change", function () {
        current_layers[layer_name].fill_color = this.value;
        selection.style("fill", this.value);
    });
}

function createStyleBox(layer_name) {
    var type = current_layers[layer_name].type,
        rendering_params = null,
        renderer = current_layers[layer_name].renderer,
        g_lyr_name = "#" + layer_name,
        selection = map.select(g_lyr_name).selectAll("path"),
        opacity = selection.style('fill-opacity');

    var fill_prev = cloneObj(current_layers[layer_name].fill_color),
        prev_col_breaks;

    if (current_layers[layer_name].colors_breaks && current_layers[layer_name].colors_breaks instanceof Array) prev_col_breaks = current_layers[layer_name].colors_breaks.concat([]);

    var stroke_prev = selection.style('stroke'),
        border_opacity = selection.style('stroke-opacity'),
        stroke_width = +current_layers[layer_name]['stroke-width-const'];

    if (stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev);

    make_confirm_dialog("styleBox", layer_name, { top: true }).then(function (confirmed) {
        if (confirmed) {
            // Update the object holding the properties of the layer if Yes is clicked
            //                if(stroke_width != current_layers[layer_name]['stroke-width-const'])
            //                    current_layers[layer_name].fixed_stroke = true;
            if (renderer != undefined && rendering_params != undefined && renderer != "Stewart" && renderer != "Categorical") {
                current_layers[layer_name].fill_color = { "class": rendering_params.colorsByFeature };
                var colors_breaks = [];
                for (var i = rendering_params['breaks'].length - 1; i > 0; --i) {
                    colors_breaks.push([[rendering_params['breaks'][i - 1], " - ", rendering_params['breaks'][i]].join(''), rendering_params['colors'][i - 1]]);
                }
                current_layers[layer_name].colors_breaks = colors_breaks;
                current_layers[layer_name].rendered_field = rendering_params.field;
                current_layers[layer_name].options_disc = {
                    schema: rendering_params.schema,
                    colors: rendering_params.colors,
                    no_data: rendering_params.no_data };
            } else if (renderer == "Stewart") {
                current_layers[layer_name].colors_breaks = rendering_params.breaks;
                current_layers[layer_name].fill_color.class = rendering_params.breaks.map(function (obj) {
                    return obj[1];
                });
            }
            // Also change the legend if there is one displayed :
            var _type_layer_links = renderer == "DiscLayer" || renderer == "Links";
            var lgd = document.querySelector([_type_layer_links ? "#legend_root_links.lgdf_" : "#legend_root.lgdf_", layer_name].join(''));
            if (lgd) {
                var transform_param = lgd.getAttribute("transform"),
                    lgd_title = lgd.querySelector("#legendtitle").innerHTML,
                    lgd_subtitle = lgd.querySelector("#legendsubtitle").innerHTML,
                    boxgap = lgd.getAttribute("boxgap");

                if (_type_layer_links) {
                    lgd.remove();
                    createLegend_discont_links(layer_name, current_layers[layer_name].rendered_field, lgd_title, lgd_subtitle);
                } else {
                    var no_data_txt = document.getElementById("no_data_txt");
                    no_data_txt = no_data_txt != null ? no_data_txt.textContent : null;
                    lgd.remove();
                    createLegend_choro(layer_name, rendering_params.field, lgd_title, lgd_subtitle, boxgap, undefined, undefined, no_data_txt);
                }
                lgd = document.querySelector([_type_layer_links ? "#legend_root_links.lgdf_" : "#legend_root.lgdf_", layer_name].join(''));
                if (transform_param) lgd.setAttribute("transform", transform_param);
            }
            zoom_without_redraw();
        } else {
            // Reset to original values the rendering parameters if "no" is clicked
            selection.style('fill-opacity', opacity).style('stroke-opacity', border_opacity);
            var zoom_scale = +d3.zoomTransform(map.node()).k;
            map.select(g_lyr_name).style('stroke-width', stroke_width / zoom_scale + "px");
            current_layers[layer_name]['stroke-width-const'] = stroke_width;
            var fill_meth = Object.getOwnPropertyNames(fill_prev)[0];
            if (type == "Line") {
                if (fill_meth == "single") selection.style("stroke", fill_prev.single).style("stroke-opacity", previous_stroke_opacity);else if (fill_meth == "random") selection.style("stroke-opacity", previous_stroke_opacity).style("stroke", function () {
                    return Colors.name[Colors.random()];
                });else if (fill_math == "class" && renderer == "Links") selection.style('stroke-opacity', function (d, i) {
                    return current_layers[layer_name].linksbyId[i][0];
                }).style("stroke", stroke_prev);
            } else {
                if (current_layers[layer_name].renderer == "Stewart") {
                    recolor_stewart(prev_palette.name, prev_palette.reversed);
                } else if (fill_meth == "single") {
                    selection.style('fill', fill_prev.single).style('stroke', stroke_prev);
                } else if (fill_meth == "class") {
                    selection.style('fill-opacity', opacity).style("fill", function (d, i) {
                        return fill_prev.class[i];
                    }).style('stroke-opacity', previous_stroke_opacity).style("stroke", stroke_prev);
                } else if (fill_meth == "random") {
                    selection.style('fill', function () {
                        return Colors.name[Colors.random()];
                    }).style('stroke', stroke_prev);
                } else if (fill_meth == "categorical") {
                    fill_categorical(layer_name, fill_prev.categorical[0], "path", fill_prev.categorical[1]);
                }
            }
            if (current_layers[layer_name].colors_breaks) current_layers[layer_name].colors_breaks = prev_col_breaks;
            current_layers[layer_name].fill_color = fill_prev;
            zoom_without_redraw();
        }
    });

    var popup = d3.select(".styleBox");

    if (type !== 'Line') {
        var field_selec;
        var table_layer_name;
        var fields;
        var field_selec;
        var prev_palette;
        var recolor_stewart;
        var button_reverse;

        (function () {
            if (current_layers[layer_name].colors_breaks == undefined && renderer != "Categorical") {
                if (current_layers[layer_name].targeted || current_layers[layer_name].is_result) {
                    (function () {
                        var fields = type_col(layer_name, "string");
                        var fill_method = popup.append("p").html("Fill color").insert("select");
                        [[i18next.t("app_page.layer_style_popup.single_color"), "single"], [i18next.t("app_page.layer_style_popup.categorical_color"), "categorical"], [i18next.t("app_page.layer_style_popup.random_color"), "random"]].forEach(function (d, i) {
                            fill_method.append("option").text(d[0]).attr("value", d[1]);
                        });
                        popup.append('div').attrs({ id: "fill_color_section" });
                        fill_method.on("change", function () {
                            d3.select("#fill_color_section").html("").on("click", null);
                            if (this.value == "single") make_single_color_menu(layer_name, fill_prev);else if (this.value == "categorical") make_categorical_color_menu(fields, layer_name, fill_prev);else if (this.value == "random") make_random_color(layer_name);
                        });
                        setSelected(fill_method.node(), Object.getOwnPropertyNames(fill_prev)[0]);
                    })();
                } else {
                    popup.append('div').attrs({ id: "fill_color_section" });
                    make_single_color_menu(layer_name, fill_prev);
                }
            } else if (renderer == "Categorical") {
                (function () {
                    var renderer_field = current_layers[layer_name].rendered_field,
                        ref_layer_name = current_layers[layer_name].ref_layer_name,
                        fields_layer = type_col(ref_layer_name),
                        fields_name = Object.getOwnPropertyNames(fields_layer),
                        field_to_render = void 0;

                    field_selec = popup.append('p').html(i18next.t("app_page.layer_style_popup.field_to_render")).insert('select').attr('class', 'params').on("change", function () {
                        field_to_render = this.value;
                    });


                    fields_name.forEach(function (f_name) {
                        field_selec.append("option").text(f_name).attr("value", f_name);
                    });
                    setSelected(field_selec.node(), current_layers[layer_name].rendered_field);
                    popup.insert('p').style("margin", "auto").html("").append("button").attr("class", "button_disc").styles({ "font-size": "0.8em", "text-align": "center" }).html(i18next.t("app_page.layer_style_popup.choose_colors")).on("click", function () {
                        display_categorical_box(ref_layer_name, field_selec.node().value).then(function (confirmed) {
                            if (confirmed) {
                                rendering_params = {
                                    nb_class: confirmed[0], color_map: confirmed[1], colorByFeature: confirmed[2],
                                    renderer: "Categorical", rendered_field: field_selec.node().value
                                };
                                render_categorical(layer_name, rendering_params);
                            }
                        });
                    });
                })();
            } else if (renderer != "Stewart") {
                (function () {
                    var field_to_discretize = void 0;
                    table_layer_name = layer_name;

                    if (renderer == "Gridded") field_to_discretize = "densitykm";else {
                        if (renderer == "Choropleth") table_layer_name = current_layers[layer_name].ref_layer_name;
                        fields = type_col(table_layer_name, "number");
                        field_selec = popup.append('p').html(i18next.t("app_page.layer_style_popup.field")).insert('select').attr('class', 'params').on("change", function () {
                            field_to_discretize = this.value;
                        });

                        field_to_discretize = fields[0];
                        fields.forEach(function (field) {
                            field_selec.append("option").text(field).attr("value", field);
                        });
                        if (current_layers[layer_name].rendered_field && fields.indexOf(current_layers[layer_name].rendered_field) > -1) setSelected(field_selec.node(), current_layers[layer_name].rendered_field);
                    }
                    popup.append('p').style("margin", "auto").html("").append("button").attr("class", "button_disc").html(i18next.t("app_page.layer_style_popup.choose_discretization")).on("click", function () {
                        display_discretization(table_layer_name, field_to_discretize, current_layers[layer_name].colors_breaks.length, "quantiles", current_layers[layer_name].options_disc).then(function (confirmed) {
                            if (confirmed) {
                                rendering_params = {
                                    nb_class: confirmed[0],
                                    type: confirmed[1],
                                    breaks: confirmed[2],
                                    colors: confirmed[3],
                                    colorsByFeature: confirmed[4],
                                    schema: confirmed[5],
                                    no_data: confirmed[6],
                                    renderer: "Choropleth",
                                    field: field_to_discretize
                                };
                                selection.style('fill-opacity', 0.9).style("fill", function (d, i) {
                                    return rendering_params.colorsByFeature[i];
                                });
                            }
                        });
                    });
                })();
            } else if (renderer == "Stewart") {
                (function () {
                    var field_to_colorize = "min",
                        nb_ft = current_layers[layer_name].n_features;
                    prev_palette = cloneObj(current_layers[layer_name].color_palette);

                    rendering_params = { breaks: [].concat(current_layers[layer_name].colors_breaks) };

                    recolor_stewart = function recolor_stewart(coloramp_name, reversed) {
                        var new_coloramp = getColorBrewerArray(nb_ft, coloramp_name);
                        if (reversed) new_coloramp.reverse();
                        for (var i = 0; i < nb_ft; ++i) {
                            rendering_params.breaks[i][1] = new_coloramp[i];
                        }selection.style("fill", function (d, i) {
                            return new_coloramp[i];
                        });
                        current_layers[layer_name].color_palette = { name: coloramp_name, reversed: reversed };
                    };

                    var seq_color_select = popup.insert("p").html(i18next.t("app_page.layer_style_popup.color_palette")).insert("select").attr("id", "coloramp_params").on("change", function () {
                        recolor_stewart(this.value, false);
                    });

                    ['Blues', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'].forEach(function (name) {
                        seq_color_select.append("option").text(name).attr("value", name);
                    });
                    seq_color_select.node().value = prev_palette.name;

                    button_reverse = popup.insert("button").styles({ "display": "inline", "margin-left": "10px" }).attrs({ "class": "button_st3", "id": "reverse_colramp" }).html(i18next.t("app_page.layer_style_popup.reverse_palette")).on("click", function () {
                        var pal_name = document.getElementById("coloramp_params").value;
                        recolor_stewart(pal_name, true);
                    });
                })();
            }
            var fill_opacity_section = popup.append('p');
            fill_opacity_section.append("span").html(i18next.t("app_page.layer_style_popup.fill_opacity"));
            fill_opacity_section.insert('input').attr('type', 'range').attr("min", 0).attr("max", 1).attr("step", 0.1).attr("value", opacity).styles({ "width": "70px", "vertical-align": "middle" }).on('change', function () {
                selection.style('fill-opacity', this.value);
                fill_opacity_section.select("#fill_opacity_txt").html(+this.value * 100 + "%");
            });
            fill_opacity_section.append("span").attr("id", "fill_opacity_txt").html(+opacity * 100 + "%");
        })();
    } else if (type === "Line" && renderer == "Links") {
        var prev_min_display;

        (function () {
            prev_min_display = current_layers[layer_name].min_display || 0;

            var max_val = 0,
                previous_stroke_opacity = selection.style("stroke-opacity");
            selection.each(function (d) {
                if (d.properties.fij > max_val) max_val = d.properties.fij;
            });
            var threshold_part = popup.append('p').html(i18next.t("app_page.layer_style_popup.display_flow_larger"));
            // The legend will be updated in order to start on the minimum value displayed instead of
            //   using the minimum value of the serie (skipping unused class if necessary)
            threshold_part.insert('input').attrs({ type: 'range', min: 0, max: max_val, step: 0.5, value: prev_min_display }).styles({ width: "70px", "vertical-align": "middle" }).on("change", function () {
                var val = +this.value;
                popup.select("#larger_than").html(["<i> ", val, " </i>"].join(''));
                selection.style("display", function (d) {
                    return +d.properties.fij > val ? null : "none";
                });
                current_layers[layer_name].min_display = val;
            });
            threshold_part.insert('label').attr("id", "larger_than").html(["<i> ", prev_min_display, " </i>"].join(''));
            popup.append("button").attr("class", "button_disc").html(i18next.t("app_page.layer_style_popup.modify_size_class")).on("click", function () {
                display_discretization_links_discont(layer_name, current_layers[layer_name].rendered_field, current_layers[layer_name].breaks.length, "user_defined").then(function (result) {
                    if (result) {
                        (function () {
                            var serie = result[0];
                            serie.setClassManually(result[2]);
                            var sizes = result[1].map(function (ft) {
                                return ft[1];
                            });
                            var links_byId = current_layers[layer_name].linksbyId;
                            current_layers[layer_name].breaks = result[1];
                            for (var i = 0; i < nb_ft; ++i) {
                                links_byId[i][2] = sizes[serie.getClass(+links_byId[i][1])];
                            }
                            console.log(links_byId);
                            selection.style('fill-opacity', 0).style("stroke-width", function (d, i) {
                                return links_byId[i][2];
                            });
                        })();
                    }
                });
            });
        })();
    } else if (type === "Line" && renderer == "DiscLayer") {
        var prev_min_display = current_layers[layer_name].min_display || 0;
        var _max_val = Math.max.apply(null, result_data[layer_name].map(function (i) {
            return i.disc_value;
        }));
        var disc_part = popup.append("p").html(i18next.t("app_page.layer_style_popup.discont_threshold"));
        disc_part.insert("input").attrs({ type: "range", min: 0, max: 1, step: 0.1, value: prev_min_display }).styles({ width: "70px", "vertical-align": "middle" }).on("change", function () {
            var val = +this.value;
            var lim = val != 0 ? val * current_layers[layer_name].n_features : -1;
            popup.select("#discont_threshold").html(["<i> ", val, " </i>"].join(''));
            selection.style("display", function (d, i) {
                return i <= lim ? null : "none";
            });
            current_layers[layer_name].min_display = val;
        });
        disc_part.insert("label").attr("id", "discont_threshold").html(["<i> ", prev_min_display, " </i>"].join(''));
        popup.append("button").attr("class", "button_disc").html(i18next.t("app_page.layer_style_popup.choose_discretization")).on("click", function () {
            display_discretization_links_discont(layer_name, "disc_value", current_layers[layer_name].breaks.length, "user_defined").then(function (result) {
                if (result) {
                    (function () {
                        console.log(result);
                        var serie = result[0];
                        serie.setClassManually(result[2]);
                        var sizes = result[1].map(function (ft) {
                            return ft[1];
                        });
                        current_layers[layer_name].breaks = result[1];
                        current_layers[layer_name].size = [sizes[0], sizes[sizes.length - 1]];
                        selection.style('fill-opacity', 0).style("stroke-width", function (d, i) {
                            return sizes[serie.getClass(+d.properties.disc_value)];
                        });
                    })();
                }
            });
        });
    }
    popup.append('p').html(type === 'Line' ? i18next.t("app_page.layer_style_popup.color") : i18next.t("app_page.layer_style_popup.border_color")).insert('input').attr('type', 'color').attr("value", stroke_prev).on('change', function () {
        selection.style("stroke", this.value);
        current_layers[layer_name].fill_color.single = this.value;
    });
    var opacity_section = popup.append('p').html(type === 'Line' ? i18next.t("app_page.layer_style_popup.opacity") : i18next.t("app_page.layer_style_popup.border_opacity"));
    opacity_section.insert('input').attrs({ type: "range", min: 0, max: 1, step: 0.1, value: border_opacity }).styles({ "width": "70px", "vertical-align": "middle" }).on('change', function () {
        opacity_section.select("#opacity_val_txt").html(" " + this.value);
        selection.style('stroke-opacity', this.value);
    });

    opacity_section.append("span").attr("id", "opacity_val_txt").style("display", "inline").html(" " + border_opacity);

    if (renderer != "DiscLayer" && renderer != "Links") popup.append('p').html(type === 'Line' ? i18next.t("app_page.layer_style_popup.width") : i18next.t("app_page.layer_style_popup.border_width")).insert('input').attr('type', 'number').attrs({ min: 0, step: 0.1, value: stroke_width }).style("width", "70px").on('change', function () {
        var val = +this.value;
        var zoom_scale = +d3.zoomTransform(map.node()).k;
        map.select(g_lyr_name).style("stroke-width", val / zoom_scale + "px");
        current_layers[layer_name]['stroke-width-const'] = val;
    });
}

function createStyleBox_ProbSymbol(layer_name) {
    var g_lyr_name = "#" + layer_name,
        ref_layer_name = current_layers[layer_name].ref_layer_name,
        type_method = current_layers[layer_name].renderer,
        type_symbol = current_layers[layer_name].symbol,
        field_used = current_layers[layer_name].rendered_field,
        selection = d3.select(g_lyr_name).selectAll(type_symbol),
        rendering_params,
        old_size = [current_layers[layer_name].size[0], current_layers[layer_name].size[1]];

    var stroke_prev = selection.style('stroke'),
        opacity = selection.style('fill-opacity'),
        border_opacity = selection.style('stroke-opacity'),
        stroke_width = selection.style('stroke-width');

    var fill_prev = cloneObj(current_layers[layer_name].fill_color),
        prev_col_breaks;

    var d_values = [],
        abs = Math.abs,
        comp = function comp(a, b) {
        return abs(b) - abs(a);
    };
    for (var i = 0, i_len = user_data[ref_layer_name].length; i < i_len; ++i) {
        d_values.push(+user_data[ref_layer_name][i][field_used]);
    }d_values.sort(comp);

    var redraw_prop_val = function redraw_prop_val(prop_values) {
        var selec = selection._groups[0];

        if (type_symbol === "circle") {
            for (var _i = 0, len = prop_values.length; _i < len; _i++) {
                selec[_i].setAttribute('r', prop_values[_i]);
            }
        } else if (type_symbol === "rect") {
            for (var _i2 = 0, _len = prop_values.length; _i2 < _len; _i2++) {
                var old_rect_size = +selec[_i2].getAttribute('height'),
                    centr = [+selec[_i2].getAttribute("x") + old_rect_size / 2 - prop_values[_i2] / 2, +selec[_i2].getAttribute("y") + old_rect_size / 2 - prop_values[_i2] / 2];

                selec[_i2].setAttribute('x', centr[0]);
                selec[_i2].setAttribute('y', centr[1]);
                selec[_i2].setAttribute('height', prop_values[_i2]);
                selec[_i2].setAttribute('width', prop_values[_i2]);
            }
        }
    };

    if (current_layers[layer_name].colors_breaks && current_layers[layer_name].colors_breaks instanceof Array) prev_col_breaks = [].concat(current_layers[layer_name].colors_breaks);else if (current_layers[layer_name].break_val != undefined) prev_col_breaks = current_layers[layer_name].break_val;

    if (stroke_prev.startsWith("rgb")) stroke_prev = rgb2hex(stroke_prev);
    if (stroke_width.endsWith("px")) stroke_width = stroke_width.substring(0, stroke_width.length - 2);

    make_confirm_dialog("styleBox", layer_name, { top: true }).then(function (confirmed) {
        if (confirmed) {
            if (current_layers[layer_name].size != old_size) {
                var lgd_prop_symb = document.querySelector(["#legend_root2.lgdf_", layer_name].join(''));
                if (lgd_prop_symb) {
                    redraw_legends_symbols(lgd_prop_symb);
                }
            }

            if (type_method == "PropSymbolsChoro") {
                console.log(rendering_params.breaks);
                current_layers[layer_name].fill_color = { "class": [].concat(rendering_params.colorsByFeature) };
                current_layers[layer_name].colors_breaks = [];
                for (var _i3 = rendering_params['breaks'].length - 1; _i3 > 0; --_i3) {
                    current_layers[layer_name].colors_breaks.push([[rendering_params['breaks'][_i3 - 1], " - ", rendering_params['breaks'][_i3]].join(''), rendering_params['colors'][_i3 - 1]]);
                }
                current_layers[layer_name].rendered_field2 = rendering_params.field;
                // Also change the legend if there is one displayed :
                var lgd_choro = document.querySelector(["#legend_root.lgdf_", layer_name].join(''));
                if (lgd_choro) {
                    var transform_param = lgd_choro.getAttribute("transform"),
                        lgd_title = lgd_choro.querySelector("#legendtitle").innerHTML,
                        lgd_subtitle = lgd_choro.querySelector("#legendsubtitle").innerHTML,
                        boxgap = lgd_choro.getAttribute("boxgap");
                    lgd_choro.remove();
                    createLegend_choro(layer_name, rendering_params.field, lgd_title, lgd_subtitle, boxgap);
                    lgd_choro = document.querySelector(["#legend_root.lgdf_", layer_name].join(''));
                    if (transform_param) lgd_choro.setAttribute("transform", transform_param);
                }
            }
        } else {
            selection.style('fill-opacity', opacity).style('stroke-opacity', border_opacity);
            d3.select(g_lyr_name).style('stroke-width', stroke_width);
            current_layers[layer_name]['stroke-width-const'] = stroke_width;
            var fill_meth = Object.getOwnPropertyNames(fill_prev)[0];
            if (fill_meth == "single") {
                selection.style('fill', fill_prev.single).style('stroke-opacity', previous_stroke_opacity).style('stroke', stroke_prev);
            } else if (fill_meth == "two") {
                current_layers[layer_name].break_val = prev_col_breaks;
                current_layers[layer_name].fill_color = { "two": [fill_prev.two[0], fill_prev.two[1]] };
                selection.style('fill', function (d, i) {
                    return d_values[i] > prev_col_breaks ? fill_prev.two[1] : fill_prev.two[0];
                }).style('stroke-opacity', previous_stroke_opacity).style('stroke', stroke_prev);
            } else if (fill_meth == "class") {
                selection.style('fill-opacity', opacity).style("fill", function (d, i) {
                    return current_layers[layer_name].fill_color.class[i];
                }).style('stroke-opacity', previous_stroke_opacity).style("stroke", stroke_prev);
                current_layers[layer_name].colors_breaks = prev_col_breaks;
            } else if (fill_meth == "random") {
                selection.style('fill', function () {
                    return Colors.name[Colors.random()];
                }).style('stroke-opacity', previous_stroke_opacity).style('stroke', stroke_prev);
            } else if (fill_meth == "categorical") {
                fill_categorical(layer_name, fill_prev.categorical[0], type_symbol, fill_prev.categorical[1], ref_layer_name);
            }
            current_layers[layer_name].fill_color = fill_prev;
            if (current_layers[layer_name].size[1] != old_size[1]) {
                var prop_values = prop_sizer3_e(d_values, old_size[0], old_size[1], type_symbol);
                redraw_prop_val(prop_values);
                current_layers[layer_name].size = [old_size[0], old_size[1]];
            }
        }
        zoom_without_redraw();
    });

    var popup = d3.select(".styleBox");
    popup.append("p").styles({ "text-align": "center", "color": "grey" }).html([i18next.t("app_page.layer_style_popup.rendered_field", { field: current_layers[layer_name].rendered_field }), i18next.t("app_page.layer_style_popup.reference_layer", { layer: ref_layer_name })].join(''));
    if (type_method === "PropSymbolsChoro") {
        (function () {
            var field_color = current_layers[layer_name].rendered_field2;
            popup.append('p').style("margin", "auto").html(i18next.t("app_page.layer_style_popup.field_symbol_color", { field: field_color })).append("button").attr("class", "button_disc").html(i18next.t("app_page.layer_style_popup.choose_discretization")).on("click", function () {
                display_discretization(ref_layer_name, field_color, current_layers[layer_name].colors_breaks.length, "quantiles", current_layers[layer_name].options_disc).then(function (confirmed) {
                    if (confirmed) {
                        (function () {
                            rendering_params = {
                                nb_class: confirmed[0], type: confirmed[1],
                                breaks: confirmed[2], colors: confirmed[3],
                                colorsByFeature: confirmed[4],
                                renderer: "PropSymbolsChoro",
                                field: field_color
                            };
                            console.log(rendering_params);
                            var features = current_layers[layer_name].features_order;
                            selection.style('fill-opacity', 0.9).style("fill", function (d, i) {
                                return rendering_params.colorsByFeature[+features[i][0]];
                            });
                        })();
                    }
                });
            });
        })();
    } else if (current_layers[layer_name].break_val != undefined) {
        var fill_color_section = popup.append('div').attr("id", "fill_color_section");
        fill_color_section.append("p").style("text-align", "center").html(i18next.t("app_page.layer_style_popup.color_break"));
        var p2 = fill_color_section.append("p").style("display", "inline");
        var col1 = p2.insert("input").attr("type", "color").attr("id", "col1").attr("value", current_layers[layer_name].fill_color.two[0]).on("change", function () {
            var _this = this;

            var new_break_val = +b_val.node().value;
            current_layers[layer_name].fill_color.two[0] = this.value;
            selection.style("fill", function (d, i) {
                return d_values[i] > new_break_val ? col2.node().value : _this.value;
            });
        });
        var col2 = p2.insert("input").attr("type", "color").attr("id", "col2").attr("value", current_layers[layer_name].fill_color.two[1]).on("change", function () {
            var _this2 = this;

            var new_break_val = +b_val.node().value;
            current_layers[layer_name].fill_color.two[1] = this.value;
            selection.style("fill", function (d, i) {
                return d_values[i] > new_break_val ? _this2.value : col1.node().value;
            });
        });
        fill_color_section.insert("span").html(i18next.t("app_page.layer_style_popup.break_value"));
        var b_val = fill_color_section.insert("input").attrs({ type: "number", value: current_layers[layer_name].break_val }).style("width", "75px").on("change", function () {
            var new_break_val = +this.value;
            current_layers[layer_name].break_val = new_break_val;
            selection.style("fill", function (d, i) {
                return d_values[i] > new_break_val ? col2.node().value : col1.node().value;
            });
        });
    } else {
        (function () {
            var fields = type_col(ref_layer_name, "string"),
                fill_method = popup.append("p").html(i18next.t("app_page.layer_style_popup.fill_color")).insert("select");

            [[i18next.t("app_page.layer_style_popup.single_color"), "single"], [i18next.t("app_page.layer_style_popup.categorical_color"), "categorical"], [i18next.t("app_page.layer_style_popup.random_color"), "random"]].forEach(function (d, i) {
                fill_method.append("option").text(d[0]).attr("value", d[1]);
            });
            popup.append('div').attr("id", "fill_color_section");
            fill_method.on("change", function () {
                d3.select("#fill_color_section").html("").on("click", null);
                if (this.value == "single") make_single_color_menu(layer_name, fill_prev, type_symbol);else if (this.value == "categorical") make_categorical_color_menu(fields, layer_name, fill_prev, type_symbol, ref_layer_name);else if (this.value == "random") make_random_color(layer_name, type_symbol);
            });
            setSelected(fill_method.node(), Object.getOwnPropertyNames(fill_prev)[0]);
        })();
    }

    var fill_opct_section = popup.append('p').html(i18next.t("app_page.layer_style_popup.fill_opacity"));
    fill_opct_section.insert('input').attrs({ type: "range", min: 0, max: 1, step: 0.1, value: opacity }).styles({ width: "70px", "vertical-align": "middle" }).on('change', function () {
        selection.style('fill-opacity', this.value);
        fill_opct_section.select("#fill_opacity_txt").html(+this.value * 100 + "%");
    });
    fill_opct_section.append("span").attr("id", "fill_opacity_txt").html(+opacity * 100 + "%");
    popup.append('p').html(i18next.t("app_page.layer_style_popup.border_color")).insert('input').attr('type', 'color').attr("value", stroke_prev).on('change', function () {
        selection.style("stroke", this.value);
    });

    var border_opacity_section = popup.append('p').html(i18next.t("app_page.layer_style_popup.border_opacity"));
    border_opacity_section.insert('input').attrs({ type: "range", min: 0, max: 1, step: 0.1, value: border_opacity }).styles({ width: "70px", "vertical-align": "middle" }).on('change', function () {
        selection.style('stroke-opacity', this.value);
        border_opacity_section.select("#border_opacity_txt").html(+this.value * 100 + "%");
    });
    border_opacity_section.append("span").attr("id", "border_opacity_txt").html(+border_opacity * 100 + "%");

    popup.append('p').html(i18next.t("app_page.layer_style_popup.border_width")).insert('input').attr('type', 'number').attrs({ min: 0, step: 0.1, value: stroke_width }).style("width", "70px").on('change', function () {
        selection.style("stroke-width", this.value + "px");
        current_layers[layer_name]['stroke-width-const'] = +this.value;
    });

    var prop_val_content = popup.append("p").html([i18next.t("app_page.layer_style_popup.field_symbol_size", { field: field_used }), i18next.t("app_page.layer_style_popup.symbol_fixed_size")].join(''));
    prop_val_content.insert('input').attr("type", "number").style("width", "50px").attrs({ id: "max_size_range", min: 0.1, max: 40, step: "any", value: current_layers[layer_name].size[1] }).on("change", function () {
        var f_size = +this.value,
            prop_values = prop_sizer3_e(d_values, current_layers[layer_name].size[0], f_size, type_symbol);
        current_layers[layer_name].size[1] = f_size;
        redraw_prop_val(prop_values);
    });
    prop_val_content.append("span").html(' px');

    prop_val_content.append("p").html(i18next.t("app_page.layer_style_popup.on_value")).insert("input").style("width", "100px").attrs({ type: "number", min: 0.1, step: 0.1,
        value: +current_layers[layer_name].size[0] }).on("change", function () {
        var f_val = +this.value,
            prop_values = prop_sizer3_e(d_values, f_val, current_layers[layer_name].size[1], type_symbol);
        redraw_prop_val(prop_values);
        current_layers[layer_name].size[0] = f_val;
    });
}

// Todo : find a "light" way to recompute the "force" on the node after changing their size
//              if(type_method.indexOf('Dorling') > -1){
//                let nodes = selection[0].map((d, i) => {
//                    let pt = path.centroid(d.__data__.geometry);
//                    return {x: pt[0], y: pt[1],
//                            x0: pt[0], y0: pt[1],
//                            r: +prop_values[i],
//                            value: +d_values[i]};
//                    });
//                  current_layers[layer_name].force.nodes(nodes).start()
//              }
//}
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserArrow = function () {
    function UserArrow(id, origin_pt, destination_pt) {
        var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

        _classCallCheck(this, UserArrow);

        this.parent = parent || svg_map;
        this.svg_elem = d3.select(this.parent);
        this.pt1 = origin_pt;
        this.pt2 = destination_pt;
        this.id = id;
        this.lineWeight = 4;
        this.color = "rgb(0, 0, 0)";

        var self = this;
        this.drag_behavior = d3.drag().subject(function () {
            var t = d3.select(this.querySelector("line"));
            return { x: +t.attr("x2") - +t.attr("x1"),
                y: +t.attr("y2") - +t.attr("y1"),
                x1: t.attr("x1"), x2: t.attr("x2"),
                y1: t.attr("y1"), y2: t.attr("y2") };
        }).on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
        }).on("end", function () {
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
        }).on("drag", function () {
            d3.event.sourceEvent.preventDefault();
            var _t = this.querySelector("line"),
                subject = d3.event.subject,
                tx = +d3.event.x - +subject.x,
                ty = +d3.event.y - +subject.y;
            self.pt1 = [+subject.x1 + tx, +subject.y1 + ty];
            self.pt2 = [+subject.x2 + tx, +subject.y2 + ty];
            _t.x1.baseVal.value = self.pt1[0];
            _t.x2.baseVal.value = self.pt2[0];
            _t.y1.baseVal.value = self.pt1[1];
            _t.y2.baseVal.value = self.pt2[1];
        });

        var defs = parent.querySelector("defs"),
            markers = defs ? defs.querySelector("marker") : null;

        if (!markers) {
            this.add_defs_marker();
        }
        this.draw();
    }

    _createClass(UserArrow, [{
        key: "add_defs_marker",
        value: function add_defs_marker() {
            defs.append("marker").attrs({ "id": "arrow_head", "viewBox": "0 -5 10 10",
                "refX": 5, "refY": 0, "orient": "auto",
                "markerWidth": 4, "markerHeight": 4 }).style("stroke-width", 1).append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrowHead");
            if (this.parent.childNodes[0].tagName != "defs") {
                this.parent.insertBefore(defs.node(), this.parent.childNodes[0]);
            }
        }
    }, {
        key: "draw",
        value: function draw() {
            var _this = this;

            var context_menu = new ContextMenu(),
                getItems = function getItems() {
                return [{ "name": i18next.t("app_page.common.edit_style"), "action": function action() {
                        _this.editStyle();
                    } }, { "name": i18next.t("app_page.common.up_element"), "action": function action() {
                        _this.up_element();
                    } }, { "name": i18next.t("app_page.common.down_element"), "action": function action() {
                        _this.down_element();
                    } }, { "name": i18next.t("app_page.common.delete"), "action": function action() {
                        _this.arrow.remove();
                    } }];
            };

            this.arrow = this.svg_elem.append('g').attrs({ "class": "arrow legend_features legend", "id": this.id });

            this.arrow.insert("line").attrs({ "class": "legend_features",
                "marker-end": "url(#arrow_head)",
                "x1": this.pt1[0], "y1": this.pt1[1],
                "x2": this.pt2[0], "y2": this.pt2[1] }).styles({ "stroke-width": this.lineWeight, stroke: "rgb(0, 0, 0)" });

            this.arrow.call(this.drag_behavior);

            this.arrow.on("contextmenu dblclick", function () {
                context_menu.showMenu(d3.event, document.querySelector("body"), getItems());
            });
        }
    }, {
        key: "up_element",
        value: function up_element() {
            up_legend(this.arrow.node());
        }
    }, {
        key: "down_element",
        value: function down_element() {
            down_legend(this.arrow.node());
        }
    }, {
        key: "calcAngle",
        value: function calcAngle() {
            var dx = this.pt2[0] - this.pt1[0],
                dy = this.pt2[1] - this.pt1[1];
            return Math.atan2(dy, dx) * (180 / Math.PI);
        }
    }, {
        key: "calcDestFromOAD",
        value: function calcDestFromOAD(origin, angle, distance) {
            var theta = angle / (180 / Math.PI),
                dx = distance * Math.cos(theta),
                dy = distance * Math.sin(theta);
            return [origin[0] + dx, origin[1] + dy];
        }
    }, {
        key: "editStyle",
        value: function editStyle() {
            var current_options = { pt1: this.pt1.slice(),
                pt2: this.pt2.slice() };
            var self = this,
                line = self.arrow.node().querySelector("line");

            var angle = (-this.calcAngle()).toFixed(0);

            make_confirm_dialog("styleBoxArrow", i18next.t("app_page.arrow_edit_box.title")).then(function (confirmed) {
                if (confirmed) {
                    // Store shorcut of useful values :
                    self.lineWeight = line.style.strokeWidth;
                    self.color = line.style.stroke;
                } else {
                    //Rollback on initials parameters :
                    line.x1.baseVal.value = current_options.pt1[0];
                    line.y1.baseVal.value = current_options.pt1[1];
                    line.x2.baseVal.value = current_options.pt2[0];
                    line.y2.baseVal.value = current_options.pt2[1];
                    self.pt1 = current_options.pt1.slice();
                    self.pt2 = current_options.pt2.slice();
                    line.style.strokeWidth = self.lineWeight;
                    line.style.stroke = self.color;
                }
            });
            var box_content = d3.select(".styleBoxArrow").insert("div").attr("id", "styleBoxArrow");
            var s1 = box_content.append("p");
            s1.append("p").html(i18next.t("app_page.arrow_edit_box.arrowWeight"));
            s1.append("input").attrs({ type: "range", id: "arrow_lineWeight", min: 0, max: 34, step: 0.1, value: self.lineWeight }).styles({ width: "80px", "vertical-align": "middle" }).on("change", function () {
                line.style.strokeWidth = this.value;
                txt_line_weight.html(this.value + "px");
            });
            var txt_line_weight = s1.append("span").html(self.lineWeight + " px");

            var s2 = box_content.append("p");
            s2.append("p").html(i18next.t("app_page.arrow_edit_box.arrowAngle"));
            s2.insert("input").attrs({ id: "arrow_angle", type: "range", value: angle, min: 0, max: 360, step: 1 }).styles({ width: "80px", "vertical-align": "middle" }).on("change", function () {
                var distance = Math.sqrt((self.pt1[0] - self.pt2[0]) * (self.pt1[0] - self.pt2[0]) + (self.pt1[1] - self.pt2[1]) * (self.pt1[1] - self.pt2[1]));
                var angle = -+this.value;

                var _self$calcDestFromOAD = self.calcDestFromOAD(self.pt1, angle, distance);

                var _self$calcDestFromOAD2 = _slicedToArray(_self$calcDestFromOAD, 2);

                var nx = _self$calcDestFromOAD2[0];
                var ny = _self$calcDestFromOAD2[1];

                line.x2.baseVal.value = nx;
                line.y2.baseVal.value = ny;
                document.getElementById("arrow_angle_text").value = +this.value;
            });

            s2.insert("input").attrs({ id: "arrow_angle_text", class: "without_spinner", value: angle, min: 0, max: 1, step: 1 }).styles({ width: "30px", "margin-left": "10px" }).on("input", function () {
                var elem = document.getElementById("arrow_angle");
                elem.value = this.value;
                elem.dispatchEvent(new Event('change'));
            });

            s2.insert("span").html("°");
            var s3 = box_content.append("p");
            s3.append("button").attr("class", "button_st4").html(i18next.t("app_page.arrow_edit_box.move_points")).on("click", function () {
                var tmp_start_point = map.append("rect").attr("x", self.pt1[0] - 3).attr("y", self.pt1[1] - 3).attr("height", 6).attr("width", 6).style("fill", "red").style("cursor", "grab").call(d3.drag().on("drag", function () {
                    var t = d3.select(this);
                    var nx = d3.event.x,
                        ny = d3.event.y;
                    t.attr("x", nx).attr("y", ny);
                    line.x1.baseVal.value = nx;
                    line.y1.baseVal.value = ny;
                }));

                var tmp_end_point = map.append("rect").attr("x", self.pt2[0] - 3).attr("y", self.pt2[1] - 3).attr("height", 6).attr("width", 6).style("fill", "red").style("cursor", "grab").call(d3.drag().on("drag", function () {
                    var t = d3.select(this);
                    var nx = d3.event.x,
                        ny = d3.event.y;
                    t.attr("x", nx).attr("y", ny);
                    line.x2.baseVal.value = nx;
                    line.y2.baseVal.value = ny;
                }));
                var arrowDialog = $(".styleBoxArrow"),
                    original_position = arrowDialog.dialog("option", "position");
                arrowDialog.dialog("option", "position", { my: "left", at: "left", of: window });
                arrowDialog.dialog("option", "draggable", false);
                arrowDialog.hide();
                document.querySelector(".ui-widget-overlay").style.display = "none";
                var el = document.createElement("button");
                el.className = "button_st3";
                el.style = "float:right;background:forestgreen;font-size:22px;";
                el.innerHTML = i18next.t("app_page.common.done");
                el.onclick = function () {
                    document.querySelector(".ui-widget-overlay").style.display = "";
                    self.pt1 = [line.x1.baseVal.value, line.y1.baseVal.value];
                    self.pt2 = [line.x2.baseVal.value, line.y2.baseVal.value];
                    tmp_end_point.remove();
                    tmp_start_point.remove();
                    el.remove();
                    arrowDialog.show();
                    arrowDialog.dialog("option", "draggable", true);
                    arrowDialog.dialog("option", "position", original_position);
                };
                document.querySelector(".styleBoxArrow").parentElement.appendChild(el);
            });
        }
    }]);

    return UserArrow;
}();

var Textbox = function () {
    // woo lets use ES2015 classes !
    function Textbox(parent, new_id_txt_annot) {
        var _this2 = this;

        var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [10, 30];

        _classCallCheck(this, Textbox);

        this.x = position[0];
        this.y = position[1];
        this.fontsize = 14;

        function end_edit_action() {
            inner_ft.attr("contentEditable", "false");
            inner_ft.style("background-color", "transparent");
            inner_ft.style("border", "");
            // Recompute the size of the p inside the foreignObj
            var inner_bbox = inner_p.getBoundingClientRect();
            foreign_obj.setAttributeNS(null, "width", [inner_bbox.width + 2, "px"].join('')); // +2px are for the border
            foreign_obj.setAttributeNS(null, "height", [inner_bbox.height + 2, "px"].join(''));
            d3.select("body").classed("noselect", false);
            state = null;
        };

        var current_timeout, state;
        var context_menu = new ContextMenu(),
            getItems = function getItems() {
            return [{ "name": i18next.t("app_page.common.edit_style"), "action": function action() {
                    _this2.editStyle();
                } }, { "name": i18next.t("app_page.common.up_element"), "action": function action() {
                    _this2.up_element();
                } }, { "name": i18next.t("app_page.common.down_element"), "action": function action() {
                    _this2.down_element();
                } }, { "name": i18next.t("app_page.common.delete"), "action": function action() {
                    _this2.text_annot.remove();
                } }];
        };

        var drag_txt_annot = d3.drag().subject(function () {
            var t = d3.select(this.parentElement),
                prev_translate = t.attr("transform");
            prev_translate = prev_translate ? prev_translate.slice(10, -1).split(',').map(function (f) {
                return +f;
            }) : [0, 0];
            return {
                x: t.attr("x") - prev_translate[0],
                y: t.attr("y") - prev_translate[1]
            };
        }).on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
        }).on("end", function () {
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
        }).on("drag", function () {
            d3.event.sourceEvent.preventDefault();
            d3.select(this.parentElement).attr("x", d3.event.x).attr("y", d3.event.y);
        });

        var foreign_obj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreign_obj.setAttributeNS(null, "x", this.x);
        foreign_obj.setAttributeNS(null, "y", this.y);
        foreign_obj.setAttributeNS(null, "overflow", "visible");
        foreign_obj.setAttributeNS(null, "width", "100%");
        foreign_obj.setAttributeNS(null, "height", "100%");
        foreign_obj.setAttributeNS(null, "class", "legend txt_annot");
        foreign_obj.id = new_id_txt_annot;

        var inner_p = document.createElement("p");
        inner_p.setAttribute("id", "in_" + new_id_txt_annot);
        inner_p.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        inner_p.style = "display:table-cell;padding:10px;color:#000;" + "opacity:1;font-family:'Verdana,Geneva,sans-serif';font-size:14px;white-space: pre;" + "word-wrap: normal; overflow: visible; overflow-y: visible; overflow-x: visible;";
        inner_p.innerHTML = i18next.t("app_page.text_box_edit_box.constructor_default");
        foreign_obj.appendChild(inner_p);
        parent.appendChild(foreign_obj);

        // foreignObj size was set to 100% for fully rendering its content,
        // now we can reduce its size to the inner content
        // (it will avoid it to overlay some other svg elements)
        {
            var inner_bbox = inner_p.getBoundingClientRect();
            foreign_obj.setAttributeNS(null, "width", [inner_bbox.width + 2, "px"].join('')); // +2px are for the border
            foreign_obj.setAttributeNS(null, "height", [inner_bbox.height + 2, "px"].join(''));
        }

        var frgn_obj = map.select("#" + new_id_txt_annot),
            inner_ft = frgn_obj.select('p');
        inner_ft.call(drag_txt_annot);

        inner_ft.on("contextmenu", function () {
            context_menu.showMenu(d3.event, document.querySelector("body"), getItems());
        });

        inner_ft.on("dblclick", function () {
            d3.event.stopPropagation();
        });

        inner_ft.on("mouseover", function () {
            inner_ft.attr("contentEditable", "true"); // Not sure if its better to change this than always letting it editable
            inner_ft.style("background-color", "white");
            inner_ft.style("border", "1px solid red");
            inner_ft.on("keyup", function () {
                clearTimeout(current_timeout);
                current_timeout = setTimeout(end_edit_action, 7500);
                state = "keyup";
            });
            // toogle the size of the container to 100% while we are using it :
            foreign_obj.setAttributeNS(null, "width", "100%");
            foreign_obj.setAttributeNS(null, "height", "100%");
            d3.select("body").classed("noselect", true);
        }).on("mouseout", function () {
            // use a small delay after leaving the box before deactiving it :
            if (!state) {
                clearTimeout(current_timeout);
                current_timeout = setTimeout(end_edit_action, 2500);
            }
        });

        this.text_annot = frgn_obj;
        this.font_family = 'Verdana,Geneva,sans-serif';
        this.id = new_id_txt_annot;
    }

    _createClass(Textbox, [{
        key: "editStyle",
        value: function editStyle() {
            var _this3 = this;

            var current_options = { size: this.text_annot.select("p").style("font-size"),
                content: unescape(this.text_annot.select("p").html()),
                font: "" };
            var self = this;
            make_confirm_dialog("styleTextAnnotation", i18next.t("app_page.text_box_edit_box.title")).then(function (confirmed) {
                $("#btn_info_text_annotation[data-tooltip_info!='']").qtip("destroy");
                if (!confirmed) {
                    self.text_annot.select("p").text(current_options.content);
                    self.fontsize = current_options.size;
                }
            });
            var box_content = d3.select(".styleTextAnnotation").insert("div").attr("id", "styleTextAnnotation");
            box_content.append("p").html(i18next.t("app_page.text_box_edit_box.font_size")).append("input").attrs({ type: "number", id: "font_size", min: 0, max: 34, step: 0.1, value: this.fontsize }).on("change", function () {
                self.fontsize = +this.value;
                self.text_annot.select("p").style("font-size", self.fontsize + "px");
            });
            var font_select = box_content.append("p").html(i18next.t("app_page.text_box_edit_box.default_font")).insert("select").on("change", function () {
                self.text_annot.select("p").style("font-family", this.value);
            });
            available_fonts.forEach(function (font) {
                font_select.append("option").text(font[0]).attr("value", font[1]);
            });
            font_select.node().selectedIndex = available_fonts.map(function (d) {
                return d[1] == _this3.font_family ? "1" : "0";
            }).indexOf("1");

            var content_modif_zone = box_content.append("p");
            content_modif_zone.append("span").html(i18next.t("app_page.text_box_edit_box.content"));
            content_modif_zone.append("img").attrs({ "id": "btn_info_text_annotation", "src": "/static/img/Information.png", "width": "17", "height": "17", "alt": "Information",
                class: "info_tooltip", "data-tooltip_info": i18next.t("app_page.text_box_edit_box.info_tooltip") }).styles({ "cursor": "pointer", "vertical-align": "bottom" });
            content_modif_zone.append("span").html("<br>");
            content_modif_zone.append("textarea").attr("id", "annotation_content").style("margin", "5px 0px 0px").on("keyup", function () {
                self._text = this.value;
                self.text_annot.select("p").html(this.value);
            });
            document.getElementById("annotation_content").value = current_options.content;
            $("#btn_info_text_annotation[data-tooltip_info!='']").qtip({
                content: { text: i18next.t("app_page.text_box_edit_box.info_tooltip") },
                style: { classes: 'qtip-bootstrap qtip_help' },
                position: { my: 'bottom left', at: 'center right', target: this },
                show: { solo: true }
            });
        }
    }, {
        key: "up_element",
        value: function up_element() {
            up_legend(this.text_annot.node());
        }
    }, {
        key: "down_element",
        value: function down_element() {
            down_legend(this.text_annot.node());
        }
    }]);

    return Textbox;
}();

/**
* Handler for the scale bar (only designed for one scale bar)
*
*/


var scaleBar = {
    create: function create() {
        var _this4 = this;

        var scale_gp = map.append("g").attr("id", "scale_bar").attr("class", "legend scale"),
            x_pos = 40,
            y_pos = h - 100,
            bar_size = 50,
            self = this;

        this.x = x_pos;
        this.y = y_pos;
        this.bar_size = bar_size;
        this.unit = "km";
        this.precision = 0;
        this.fixed_size = false;
        this.getDist();

        var getItems = function getItems() {
            return [{ "name": i18next.t("app_page.common.edit_style"), "action": function action() {
                    _this4.editStyle();
                } }, { "name": i18next.t("app_page.common.delete"), "action": function action() {
                    _this4.remove();
                } }];
        };

        var scale_context_menu = new ContextMenu();
        scale_gp.insert("rect").attrs({ x: x_pos - 5, y: y_pos - 30, height: 30, width: bar_size + 5 }).style("fill", "none");
        scale_gp.insert("rect").attr("id", "rect_scale").attrs({ x: x_pos, y: y_pos, height: 2, width: bar_size }).style("fill", "black");
        scale_gp.insert("text").attrs({ x: x_pos - 4, y: y_pos - 5 }).style("font", "11px 'Enriqueta', arial, serif").text("0");
        scale_gp.insert("text").attr("id", "text_limit_sup_scale").attrs({ x: x_pos + bar_size, y: y_pos - 5 }).style("font", "11px 'Enriqueta', arial, serif").text(this.dist_txt + " km");

        scale_gp.call(drag_lgd_features);
        scale_gp.on("mouseover", function () {
            this.style.cursor = "pointer";
        }).on("mouseout", function () {
            this.style.cursor = "initial";
        }).on("contextmenu", function (d, i) {
            d3.event.preventDefault();
            return scale_context_menu.showMenu(d3.event, document.querySelector("body"), getItems());
        });
        this.Scale = scale_gp;
        this.displayed = true;
        this.resize(Math.round(this.dist / 10) * 10);
    },
    getDist: function getDist() {
        var x_pos = w / 2,
            y_pos = h / 2,
            transform = d3.zoomTransform(svg_map),
            z_trans = [transform.x, transform.y],
            z_scale = transform.k;

        if (isNaN(this.bar_size)) {
            console.log("scaleBar.bar_size : NaN");
            this.bar_size = 1;
        }

        var pt1 = proj.invert([(x_pos - z_trans[0]) / z_scale, (y_pos - z_trans[1]) / z_scale]),
            pt2 = proj.invert([(x_pos + this.bar_size - z_trans[0]) / z_scale, (y_pos - z_trans[1]) / z_scale]);

        this.dist = coslaw_dist([pt1[1], pt1[0]], [pt2[1], pt2[0]]);
        var mult = this.unit == "km" ? 1 : this.unit == "m" ? 1000 : this.unit == "mi" ? 0.621371 : 1;
        this.dist_txt = (this.dist * mult).toFixed(this.precision);
    },
    resize: function resize(desired_dist) {
        desired_dist = desired_dist || this.fixed_size;
        var ratio = +this.dist / desired_dist;
        var new_size = this.bar_size / ratio;

        this.Scale.select("#rect_scale").attr("width", new_size);
        this.Scale.select("#text_limit_sup_scale").attr("x", this.x + new_size);
        this.bar_size = new_size;
        this.fixed_size = desired_dist;
        this.changeText();
    },
    changeText: function changeText() {
        this.getDist();
        this.Scale.select("#text_limit_sup_scale").text(this.dist_txt + " " + this.unit);
    },
    update: function update() {
        this.changeText();
        if (this.fixed_size) this.resize();
    },
    remove: function remove() {
        this.Scale.remove();
        this.Scale = null;
        this.displayed = false;
    },
    editStyle: function editStyle() {
        var new_val,
            self = this;
        make_confirm_dialog("scaleBarEditBox", i18next.t("app_page.scale_bar_edit_box.title")).then(function (confirmed) {
            if (confirmed) {
                if (new_val) self.resize(new_val);else {
                    self.fixed_size = false;
                    self.changeText();
                }
            }
        });
        var box_body = d3.select(".scaleBarEditBox");
        box_body.node().parentElement.style.width = "auto";
        box_body.append("h3").html(i18next.t("app_page.scale_bar_edit_box.title"));
        box_body.append("p").style("display", "inline").html(i18next.t("app_page.scale_bar_edit_box.fixed_size"));
        box_body.append("input").attr("type", "checkbox").attr("checked", self.fixed_size ? true : null).on("change", function () {
            if (box_body.select("#scale_fixed_field").attr("disabled")) {
                box_body.select("#scale_fixed_field").attr("disabled", null);
                new_val = +box_body.select("#scale_fixed_field").attr("value");
            } else {
                box_body.select("#scale_fixed_field").attr("disabled", true);
                new_val = false;
            }
        });
        box_body.append("input").attr('id', "scale_fixed_field").attr("type", "number").attr("disabled", self.fixed_size ? null : true).attr("value", +this.dist_txt).on("change", function () {
            new_val = +this.value;
        });

        var b = box_body.append("p");
        b.insert("span").html(i18next.t("app_page.scale_bar_edit_box.precision"));
        b.insert("input").attr('id', "scale_precision").attrs({ type: "number", min: 0, max: 6, step: 1, value: +this.precision }).style("width", "60px").on("change", function () {
            self.precision = +this.value;
        });

        var c = box_body.append("p");
        c.insert("span").html(i18next.t("app_page.scale_bar_edit_box.unit"));
        var unit_select = c.insert("select").attr('id', "scale_unit").on("change", function () {
            self.unit = this.value;
        });
        unit_select.append("option").text("km").attr("value", "km");
        unit_select.append("option").text("m").attr("value", "m");
        unit_select.append("option").text("mi").attr("value", "mi");
        unit_select.attr("value", self.unit);
    },
    displayed: false
};

var northArrow = {
    display: function display() {
        var _this5 = this;

        var x_pos = w - 100,
            y_pos = h - 100,
            self = this;

        var arrow_gp = map.append("g").attr("id", "north_arrow").attr("class", "legend").attr("scale", 1).attr("rotate", null).style("cursor", "pointer");

        this.svg_node = arrow_gp;
        this.displayed = true;

        this.arrow_img = arrow_gp.insert("image").attr("x", x_pos).attr("y", y_pos).attr("height", "30px").attr("width", "30px").attr("xlink:href", "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FscXVlXzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIzMTEgMjc4LjYgMzYuOSA1MC41IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDMxMSAyNzguNiAzNi45IDUwLjUiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBvbHlnb24gZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50cz0iMzEyLjMsMzI3LjkgMzI4LjksMzE4LjUgMzI4LjksMjk2LjQgIi8+DQo8cG9seWdvbiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRzPSIzMjkuOSwyOTYuNCAzMjkuOSwzMTguNSAzNDYuNywzMjcuOCAiLz4NCjxnPg0KCTxwYXRoIGQ9Ik0zMjIuOCwyNzguNmgyLjlsNi43LDEwLjN2LTEwLjNoM3YxNS43aC0yLjlsLTYuNy0xMC4zdjEwLjNoLTNWMjc4LjZ6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==");

        this.drag_behavior = d3.drag().subject(function () {
            var t = d3.select(this.querySelector("image"));
            return { x: +t.attr("x"), y: +t.attr("y") };
        }).on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
        }).on("end", function () {
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
        }).on("drag", function () {
            d3.event.sourceEvent.preventDefault();
            var t1 = this.querySelector("image"),
                t2 = this.querySelector("rect"),
                tx = +d3.event.x,
                ty = +d3.event.y,
                dim = t2.width.baseVal.value / 2;
            t1.x.baseVal.value = tx;
            t1.y.baseVal.value = ty;
            t2.x.baseVal.value = tx;
            t2.y.baseVal.value = ty;
            self.x_center = tx + dim;
            self.y_center = ty + dim;
        });

        var getItems = function getItems() {
            return [{ "name": i18next.t("app_page.common.options"), "action": function action() {
                    _this5.editStyle();
                } }, { "name": i18next.t("app_page.common.delete"), "action": function action() {
                    _this5.remove();
                } }];
        };

        var arrow_context_menu = new ContextMenu();

        var bbox = document.getElementById("north_arrow").getBoundingClientRect(),
            xy0_map = get_map_xy0();

        this.under_rect = arrow_gp.append("g").insert("rect").style("fill", "green").style("fill-opacity", 0).attr("x", bbox.left - xy0_map.x).attr("y", bbox.top - xy0_map.y).attr("height", bbox.height).attr("width", bbox.width);

        this.x_center = bbox.left - xy0_map.x + bbox.width / 2;
        this.y_center = bbox.top - xy0_map.y + bbox.height / 2;

        arrow_gp.call(this.drag_behavior);

        arrow_gp.on("mouseover", function () {
            self.under_rect.style("fill-opacity", 0.1);
        }).on("mouseout", function () {
            self.under_rect.style("fill-opacity", 0);
        }).on("contextmenu dblclick", function (d, i) {
            d3.event.preventDefault();
            return arrow_context_menu.showMenu(d3.event, document.querySelector("body"), getItems());
        });
    },
    remove: function remove() {
        this.svg_node.remove();
        this.displayed = false;
    },
    editStyle: function editStyle() {
        var self = this,
            old_dim = +self.under_rect.attr("width"),
            old_rotate = !isNaN(+self.svg_node.attr("rotate")) ? +self.svg_node.attr("rotate") : 0,
            x_pos = +self.x_center - old_dim / 2,
            y_pos = +self.y_center - old_dim / 2;

        make_confirm_dialog("arrowEditBox", i18next.t("app_page.north_arrow_edit_box.title")).then(function (confirmed) {
            if (confirmed) {
                null;
            }
        });

        var box_body = d3.select(".arrowEditBox");
        box_body.node().parentElement.style.width = "auto";
        box_body.append("h3").html(i18next.t("app_page.north_arrow_edit_box.title"));
        box_body.append("p").style("margin-bottom", "0").html(i18next.t("app_page.north_arrow_edit_box.size"));
        box_body.append("input").attrs({ type: "range", min: 1, max: 200, step: 1,
            value: old_dim, id: "range_size_n_arrow" }).styles({ "vertical-align": "middle", "width": "140px" }).on("change", function () {
            var new_size = +this.value;
            self.arrow_img.attr("width", new_size);
            self.arrow_img.attr("height", new_size);
            self.under_rect.attr("width", new_size);
            self.under_rect.attr("height", new_size);
            self.x_center = x_pos + new_size / 2;
            self.y_center = y_pos + new_size / 2;
            document.getElementById("txt_size_n_arrow").value = new_size;
        });
        box_body.append("input").attrs({ type: "number", min: 0, max: 200, step: 1, value: old_dim,
            class: "without_spinner", id: "txt_size_n_arrow" }).style("width", "40px").on("change", function () {
            var elem = document.getElementById("range_size_n_arrow");
            elem.value = +this.value;
            elem.dispatchEvent(new Event("change"));
        });
        box_body.append("span").html(" px");

        box_body.append("p").style("margin-bottom", "0").html(i18next.t("app_page.north_arrow_edit_box.rotation"));
        box_body.append("input").attrs({ type: "range", min: 0, max: 360, step: 0.1, id: "range_rotate_n_arrow" }).attr("value", old_rotate).styles({ "vertical-align": "middle", "width": "140px" }).on("change", function () {
            var rotate_value = +this.value;
            self.svg_node.attr("rotate", rotate_value);
            self.svg_node.attr("transform", "rotate(" + [rotate_value, self.x_center, self.y_center] + ")");
            document.getElementById("txt_rotate_n_arrow").value = rotate_value;
        });
        box_body.append("input").attrs({ type: "number", min: 0, max: 360, step: "any",
            class: "without_spinner", id: "txt_rotate_n_arrow" }).attr("value", old_rotate).style("width", "40px").on("change", function () {
            var rotate_value = +this.value;
            self.svg_node.attr("rotate", rotate_value);
            self.svg_node.attr("transform", "rotate(" + [rotate_value, self.x_center, self.y_center] + ")");
            document.getElementById("range_rotate_n_arrow").value = rotate_value;
        });
        box_body.append("span").html("°");
    },
    displayed: false
};

var UserEllipse = function () {
    function UserEllipse(id, origin_pt) {
        var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

        _classCallCheck(this, UserEllipse);

        this.parent = parent || svg_map;
        this.svg_elem = d3.select(this.parent);
        this.pt1 = origin_pt;
        this.id = id;
        this.strokeWeight = 4;
        this.stroke_color = "rgb(0, 0, 0)";

        var self = this;
        this.drag_behavior = d3.drag().subject(function () {
            var t = d3.select(this.querySelector("ellipse"));
            return { x: +t.attr("cx"), y: +t.attr("cy") };
        }).on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", null);
        }).on("end", function () {
            if (map_div.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
        }).on("drag", function () {
            d3.event.sourceEvent.preventDefault();
            var _t = this.querySelector("ellipse"),
                tx = +d3.event.x,
                ty = +d3.event.y;
            _t.cx.baseVal.value = tx;
            _t.cy.baseVal.value = ty;
            self.pt1[0] = tx;
            self.pt1[1] = ty;
        });

        this.draw();
    }

    _createClass(UserEllipse, [{
        key: "draw",
        value: function draw() {
            var _this6 = this;

            var context_menu = new ContextMenu(),
                getItems = function getItems() {
                return [{ "name": i18next.t("app_page.common.edit_style"), "action": function action() {
                        _this6.editStyle();
                    } }, { "name": i18next.t("app_page.common.up_element"), "action": function action() {
                        _this6.up_element();
                    } }, { "name": i18next.t("app_page.common.down_element"), "action": function action() {
                        _this6.down_element();
                    } }, { "name": i18next.t("app_page.common.delete"), "action": function action() {
                        _this6.ellipse.remove();
                    } }];
            };

            this.ellipse = this.svg_elem.append('g').attrs({ "class": "user_ellipse legend_features legend", "id": this.id });

            this.ellipse.insert("ellipse").attrs({ "class": "legend_features",
                "cx": this.pt1[0], "cy": this.pt1[1],
                "rx": 30, "ry": 40 }).styles({ "stroke-width": this.strokeWeight,
                stroke: this.stroke_color, fill: "rgb(255, 255, 255)",
                "fill-opacity": 0 });

            this.ellipse.call(this.drag_behavior);

            this.ellipse.on("contextmenu dblclick", function () {
                context_menu.showMenu(d3.event, document.querySelector("body"), getItems());
            });
        }
    }, {
        key: "up_element",
        value: function up_element() {
            up_legend(this.ellipse.node());
        }
    }, {
        key: "down_element",
        value: function down_element() {
            down_legend(this.ellipse.node());
        }
    }, {
        key: "editStyle",
        value: function editStyle() {
            var self = this,
                ellipse_elem = self.ellipse.node().querySelector("ellipse"),
                current_options = {
                pt1: this.pt1.slice(),
                rx: ellipse_elem.rx.baseVal.value,
                ry: ellipse_elem.ry.baseVal.value
            };
            //        let angle = (-this.calcAngle()).toFixed(0);

            make_confirm_dialog("styleBoxEllipse", i18next.t("app_page.ellipse_edit_box.title")).then(function (confirmed) {
                map.selectAll(".ctrl_pt").remove();
                if (confirmed) {
                    // Store shorcut of useful values :
                    self.strokeWeight = ellipse_elem.style.strokeWidth;
                    self.stroke_color = ellipse_elem.style.stroke;
                } else {
                    //Rollback on initials parameters :
                    ellipse_elem.cx.baseVal.value = current_options.pt1[0];
                    ellipse_elem.cy.baseVal.value = current_options.pt1[1];
                    ellipse_elem.rx.baseVal.value = current_options.rx;
                    ellipse_elem.ry.baseVal.value = current_options.ry;
                    self.pt1 = current_options.pt1.slice();
                    ellipse_elem.style.strokeWidth = self.strokeWeight;
                    ellipse_elem.style.stroke = self.stroke_color;
                }
            });
            var box_content = d3.select(".styleBoxEllipse").insert("div").attr("id", "styleBoxEllipse");
            var s1 = box_content.append("p");
            s1.append("p").style("margin", "auto").html(i18next.t("app_page.ellipse_edit_box.stroke_width"));
            s1.append("input").attrs({ type: "range", id: "ellipse_strokeWeight", min: 0, max: 34, step: 0.1, value: self.strokeWeight }).styles({ width: "80px", "vertical-align": "middle" }).on("change", function () {
                ellipse_elem.style.strokeWidth = this.value;
                txt_line_weight.html(this.value + "px");
            });
            var txt_line_weight = s1.append("span").html(self.strokeWeight + " px");

            var s2 = box_content.append("p").style("margin", "auto");
            s2.append("p").style("margin", "auto").html(i18next.t("app_page.ellipse_edit_box.stroke_color"));
            s2.append("input").attrs({ type: "color", id: "ellipse_strokeColor", value: self.stroke_color }).on("change", function () {
                ellipse_elem.style.stroke = this.value;
            });

            //        let s2 = box_content.append("p");
            //        s2.append("p").html(i18next.t("app_page.ellipse_edit_box.ellispeAngle"))
            //        s2.insert("input")
            //            .attrs({id: "ellipse_angle", type: "range", value: angle, min: 0, max: 360, step: 1})
            //            .styles({width: "80px", "vertical-align": "middle"})
            //            .on("change", function(){
            //                let distance = Math.sqrt((self.pt1[0] - self.pt2[0]) * (self.pt1[0] - self.pt2[0]) + (self.pt1[1] - self.pt2[1]) * (self.pt1[1] - self.pt2[1]));
            //                let angle = -(+this.value);
            //                let [nx, ny] = self.calcDestFromOAD(self.pt1, angle, distance);
            //                line.x2.baseVal.value = nx;
            //                line.y2.baseVal.value = ny;
            //                document.getElementById("ellipse_angle_text").value = +this.value;
            //            });
            //
            //        s2.insert("input")
            //            .attrs({id: "ellipse_angle_text", class: "without_spinner", value: angle, min: 0, max: 1, step: 1})
            //            .styles({width: "30px", "margin-left": "10px"})
            //            .on("input", function(){
            //                let elem = document.getElementById("ellipse_angle");
            //                elem.value = this.value;
            //                elem.dispatchEvent(new Event('change'));
            //            });
            //
            //        s2.insert("span").html("°");

            var s3 = box_content.append("p");

            s3.append("button").attr("class", "button_st4").html(i18next.t("app_page.ellipse_edit_box.move_points")).on("click", function () {
                var tmp_start_point = map.append("rect").attr("class", "ctrl_pt").attr("x", self.pt1[0] - ellipse_elem.rx.baseVal.value).attr("y", self.pt1[1]).attr("height", 6).attr("width", 6).style("fill", "red").style("cursor", "grab").call(d3.drag().on("drag", function () {
                    var t = d3.select(this);
                    var nx = d3.event.x,
                        ny = d3.event.y;
                    t.attr("x", nx);
                    var dist = self.pt1[0] - +t.attr("x");
                    ellipse_elem.rx.baseVal.value = dist;
                }));

                var tmp_end_point = map.append("rect").attr("class", "ctrl_pt").attr("x", self.pt1[0]).attr("y", self.pt1[1] - ellipse_elem.ry.baseVal.value).attr("height", 6).attr("width", 6).style("fill", "red").style("cursor", "grab").call(d3.drag().on("drag", function () {
                    var t = d3.select(this);
                    var nx = d3.event.x,
                        ny = d3.event.y;
                    t.attr("y", ny);
                    var dist = self.pt1[1] - +t.attr("y");
                    ellipse_elem.ry.baseVal.value = dist;
                }));
                var ellipseDialog = $(".styleBoxEllipse"),
                    original_position = ellipseDialog.dialog("option", "position");
                ellipseDialog.dialog("option", "position", { my: "left", at: "left", of: window });
                ellipseDialog.dialog("option", "draggable", false);
                ellipseDialog.hide();
                document.querySelector(".ui-widget-overlay").style.display = "none";
                var el = document.createElement("button");
                el.className = "button_st3";
                el.style = "float:right;background:forestgreen;font-size:22px;";
                el.innerHTML = i18next.t("app_page.common.done");
                el.onclick = function () {
                    document.querySelector(".ui-widget-overlay").style.display = "";
                    tmp_end_point.remove();
                    tmp_start_point.remove();
                    el.remove();
                    ellipseDialog.show();
                    ellipseDialog.dialog("option", "draggable", true);
                    ellipseDialog.dialog("option", "position", original_position);
                };
                document.querySelector(".styleBoxEllipse").parentElement.appendChild(el);
            });
        }
    }]);

    return UserEllipse;
}();
"use strict";
/**
* Function called on clicking on the legend button of each layer
* - toggle the visibility of the legend (or create the legend if doesn't currently exists)
*
* @param {String} layer - The layer name
*
*/

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function handle_legend(layer) {
    var state = current_layers[layer].renderer;
    if (state != undefined) {
        var class_name = [".lgdf", layer].join('_');
        if (d3.selectAll(class_name).node()) {
            if (!d3.selectAll(class_name).attr("display")) d3.selectAll(class_name).attr("display", "none");else {
                d3.selectAll(class_name).attr("display", null);
                // Redisplay the legend(s) and also
                // verify if still in the visible part
                // of the map, if not, move them in:
                // .. so it's actually a feature if the legend is redrawn on its origin location
                // after being moved too close to the outer border of the map :
                var tol = 7.5,
                    map_xy0 = get_map_xy0(),
                    limit_left = map_xy0.x - tol,
                    limit_right = map_xy0.x + +w + tol,
                    limit_top = map_xy0.y - tol,
                    limit_bottom = map_xy0.y + +h + tol;
                var legends = svg_map.querySelectorAll(class_name);
                for (var i = 0; i < legends.length; i++) {
                    var bbox_legend = legends[i].getBoundingClientRect();
                    if (bbox_legend.left < limit_left || bbox_legend.right > limit_right || bbox_legend.top < limit_top || bbox_legend.bottom > limit_bottom) legends[i].setAttribute("transform", "translate(0, 0)");
                }
            }
        } else {
            createLegend(layer, "");
        }
    }
}

/**
* Function called on the first click on the legend button of each layer
* - delegate legend creation according to the type of function
*
* @param {String} layer - The layer name
* @param {String} title - The desired title (default: empty - can be modified later)
*
*/
function createLegend(layer, title) {
    var field = current_layers[layer].rendered_field;

    if (current_layers[layer].renderer.indexOf("PropSymbolsChoro") != -1) {
        var field2 = current_layers[layer].rendered_field2;
        createLegend_choro(layer, field2, title, field2, 0);
        createLegend_symbol(layer, field, title, field);
    } else if (current_layers[layer].renderer.indexOf("PropSymbols") != -1 || current_layers[layer].renderer.indexOf("DorlingCarto") != -1) createLegend_symbol(layer, field, title, field);else if (current_layers[layer].renderer.indexOf("Links") != -1 || current_layers[layer].renderer.indexOf("DiscLayer") != -1) createLegend_discont_links(layer, field, title, field);else if (current_layers[layer].renderer.indexOf("Choropleth") > -1) createLegend_choro(layer, field, title, field, 0);else if (current_layers[layer].colors_breaks || current_layers[layer].color_map || current_layers[layer].symbols_map) createLegend_choro(layer, field, title, field, 0);else if (current_layers[layer].renderer.indexOf("Carto_doug") != -1) createLegend_nothing(layer, field, "Dougenik Cartogram", field);else swal("Oups..!", i18next.t("No legend available for this representation") + ".<br>" + i18next.t("Want to make a <a href='/'>suggestion</a> ?"), "warning");
}

function up_legend(legend_node) {
    var lgd_features = svg_map.querySelectorAll(".legend"),
        nb_lgd_features = +lgd_features.length,
        self_position = void 0;
    for (var i = 0; i < nb_lgd_features; i++) {
        if (lgd_features[i].id == legend_node.id && lgd_features[i].classList == legend_node.classList) {
            self_position = i;
        }
    }
    if (self_position == nb_lgd_features - 1) {
        return;
    } else {
        svg_map.insertBefore(lgd_features[self_position + 1], lgd_features[self_position]);
    }
}

function down_legend(legend_node) {
    var lgd_features = svg_map.querySelectorAll(".legend"),
        nb_lgd_features = +lgd_features.length,
        self_position = void 0;
    for (var i = 0; i < nb_lgd_features; i++) {
        if (lgd_features[i].id == legend_node.id && lgd_features[i].classList == legend_node.classList) {
            self_position = i;
        }
    }
    if (self_position == 0) {
        return;
    } else {
        svg_map.insertBefore(lgd_features[self_position], lgd_features[self_position - 1]);
    }
}

function make_legend_context_menu(legend_node, layer) {
    var context_menu = new ContextMenu(),
        getItems = function getItems() {
        return [{ "name": i18next.t("app_page.common.edit_style"), "action": function action() {
                createlegendEditBox(legend_node.attr("id"), layer);
            } }, { "name": i18next.t("app_page.common.up_element"), "action": function action() {
                up_legend(legend_node.node());
            } }, { "name": i18next.t("app_page.common.down_element"), "action": function action() {
                down_legend(legend_node.node());
            } }, { "name": i18next.t("app_page.common.hide"), "action": function action() {
                if (!legend_node.attr("display")) legend_node.attr("display", "none");else legend_node.attr("diplay", null);
            } }];
    };
    legend_node.on("dblclick", function () {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        createlegendEditBox(legend_node.attr("id"), layer);
    });

    legend_node.on("contextmenu", function () {
        context_menu.showMenu(d3.event, document.querySelector("body"), getItems());
    });
}

var drag_legend_func = function drag_legend_func(legend_group) {
    return d3.drag().subject(function () {
        var t = d3.select(this),
            prev_translate = t.attr("transform");
        prev_translate = prev_translate ? prev_translate.slice(10, -1).split(',').map(function (f) {
            return +f;
        }) : [0, 0];
        return {
            x: t.attr("x") + prev_translate[0], y: t.attr("y") + prev_translate[1]
        };
    }).on("start", function () {
        d3.event.sourceEvent.stopPropagation();
        d3.event.sourceEvent.preventDefault();
        if (d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
    }).on("end", function () {
        if (d3.select("#hand_button").classed("active")) zoom.on("zoom", zoom_without_redraw);
        legend_group.style("cursor", "grab");
    }).on("drag", function () {
        legend_group.attr('transform', 'translate(' + [d3.event.x, d3.event.y] + ')').style("cursor", "grabbing");
    });
};

function createLegend_nothing(layer, field, title, subtitle, rect_fill_value) {
    var subtitle = subtitle || field,
        space_elem = 18,
        boxgap = 12,
        xpos = 30,
        ypos = h / 2,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        legend_root = map.insert('g').attr('id', 'legend_root_nothing').attr("class", tmp_class_name).style("cursor", "grab");

    var rect_under_legend = legend_root.insert("rect");

    legend_root.insert('text').attr("id", "legendtitle").text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif").attr("x", xpos + space_elem).attr("y", ypos);

    legend_root.insert('text').attr("id", "legendsubtitle").text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif").attr("x", xpos + space_elem).attr("y", ypos + 15);

    legend_root.call(drag_legend_func(legend_root));

    legend_root.append("g").attr("class", "legend_feature").insert("text").attr("id", "legend_bottom_note").attrs({ x: xpos, y: ypos + 2 * space_elem }).style("font", "11px 'Enriqueta', arial, serif").html('');
    make_underlying_rect(legend_root, rect_under_legend, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function createLegend_discont_links(layer, field, title, subtitle, rect_fill_value) {
    var space_elem = 18,
        boxgap = 12,
        xpos = 30,
        ypos = 30,
        y_pos2 = ypos + space_elem,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        legend_root = map.insert('g').attr('id', 'legend_root_links').attr("class", tmp_class_name).style("cursor", "grab"),
        breaks = current_layers[layer].breaks,
        nb_class = breaks.length;

    var rect_under_legend = legend_root.insert("rect");

    legend_root.insert('text').attr("id", "legendtitle").text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif").attr("x", xpos + space_elem).attr("y", ypos);

    legend_root.insert('text').attr("id", "legendsubtitle").text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif").attr("x", xpos + space_elem).attr("y", ypos + 15);

    var ref_symbols_params = [];

    // Prepare symbols for the legend, taking care of not representing values
    // under the display threshold defined by the user (if any) :
    //    if(current_layers[layer].renderer == "Links"){
    var current_min_value = +current_layers[layer].min_display;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = breaks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var b_val = _step.value;

            if (b_val[1] != 0) {
                if (current_min_value >= +b_val[0][0] && current_min_value < +b_val[0][1]) {
                    ref_symbols_params.push({ value: [current_min_value, b_val[0][1]], size: b_val[1] });
                } else if (current_min_value < +b_val[0][0] && current_min_value < +b_val[0][1]) {
                    ref_symbols_params.push({ value: b_val[0], size: b_val[1] });
                }
            }
        }
        //    } else {
        //        for(let b_val of breaks)
        //            ref_symbols_params.push({value:b_val[0], size:b_val[1]});
        //    }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    ref_symbols_params.reverse();

    var legend_elems = legend_root.selectAll('.legend').append("g").data(ref_symbols_params).enter().insert('g').attr('class', function (d, i) {
        return "legend_feature lg legend_" + i;
    });

    var max_size = current_layers[layer].size[1],
        last_size = 0,
        last_pos = y_pos2,
        color = current_layers[layer].fill_color.single,
        xrect = xpos + space_elem + max_size / 2;

    legend_elems.append("rect").attr("x", xrect).attr("y", function (d) {
        last_pos = boxgap + last_pos + last_size;
        last_size = d.size;
        return last_pos;
    }).attr('width', 45).attr('height', function (d) {
        return d.size;
    }).styles({ fill: color, stroke: "rgb(0, 0, 0)", "fill-opacity": 1, "stroke-width": 0 });

    last_pos = y_pos2;
    last_size = 0;

    var x_text_pos = xpos + space_elem + max_size * 1.5 + 45;
    var tmp_pos = void 0;
    legend_elems.append("text").attr("x", x_text_pos).attr("y", function (d) {
        last_pos = boxgap + last_pos + last_size;
        last_size = d.size;
        tmp_pos = last_pos - d.size / 4;
        return tmp_pos;
    }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
        return d.value[1];
    });

    legend_root.insert('text').attr("id", "lgd_choro_min_val").attr("x", x_text_pos).attr("y", tmp_pos + boxgap).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(ref_symbols_params[ref_symbols_params.length - 1].value[0]);

    legend_root.call(drag_legend_func(legend_root));

    legend_root.append("g").attr("class", "legend_feature").insert("text").attr("id", "legend_bottom_note").attrs({ x: xpos + space_elem, y: last_pos + 2 * space_elem }).style("font", "11px 'Enriqueta', arial, serif").html('');
    make_underlying_rect(legend_root, rect_under_legend, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function get_distance(pt1, pt2) {
    var xs = pt2[0] - pt1[1],
        ys = pt2[1] - pt1[1];
    return Math.sqrt(xs * xs + ys * ys);
}

/**
* Function computing the size of the rectangle to be put under the legend
* (called on each change modifying the size of the legend box,
* eg. longer title, switching to nested symbols, etc..)
*
*/
function make_underlying_rect(legend_root, under_rect, fill) {
    under_rect.attrs({ "width": 0, height: 0 });
    console.log(legend_root);
    var bbox_legend = legend_root.node().getBoundingClientRect(),
        translate = legend_root.attr("transform"),
        map_xy0 = get_map_xy0();

    translate = translate ? translate.split("translate(")[1].split(")")[0].split(",").map(function (d) {
        return +d;
    }) : [0, 0];

    var bbox = {
        x_top_left: bbox_legend.left - map_xy0.x - 5 - translate[0],
        y_top_left: bbox_legend.top - map_xy0.y - 5 - translate[1],
        x_top_right: bbox_legend.right - map_xy0.x + 5 - translate[0],
        y_top_right: bbox_legend.top - map_xy0.y - 5 - translate[1],
        x_bottom_left: bbox_legend.left - map_xy0.x - 5 - translate[0],
        y_bottom_left: bbox_legend.bottom - map_xy0.y + 5 - translate[1]
    };
    var rect_height = get_distance([bbox.x_top_left, bbox.y_top_left], [bbox.x_bottom_left, bbox.y_bottom_left]),
        rect_width = get_distance([bbox.x_top_left, bbox.y_top_left], [bbox.x_top_right, bbox.y_top_right]);

    under_rect.attrs({ "class": "legend_feature", "id": "under_rect",
        "height": rect_height, "width": rect_width });
    under_rect.attr("x", bbox.x_top_left).attr("y", bbox.y_top_left);

    if (!fill || !fill.color || !fill.opacity) {
        under_rect.style("fill", "green").style("fill-opacity", 0);
        legend_root.attr("visible_rect", "false");
        legend_root.on("mouseover", function () {
            under_rect.style("fill-opacity", 0.1);
        }).on("mouseout", function () {
            under_rect.style("fill-opacity", 0);
        });
    } else {
        under_rect.style("fill", fill.color).style("fill-opacity", fill.opacity);
        legend_root.attr("visible_rect", "true");
        legend_root.on("mouseover", null).on("mouseout", null);
    }
}

function createLegend_symbol(layer, field, title, subtitle) {
    var nested = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "false";
    var rect_fill_value = arguments[5];

    var space_elem = 18,
        boxgap = 4,
        xpos = 30,
        ypos = 30,
        y_pos2 = ypos + space_elem * 1.5,
        ref_layer_name = current_layers[layer].ref_layer_name,
        nb_features = user_data[ref_layer_name].length,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        symbol_type = current_layers[layer].symbol;

    var color_symb_lgd = current_layers[layer].renderer === "PropSymbolsChoro" ? "#FFF" : current_layers[layer].fill_color.two !== undefined ? "#FFF" : current_layers[layer].fill_color.single;

    var legend_root = map.insert('g').attr('id', 'legend_root2').attr("class", tmp_class_name).attr("transform", "translate(0,0)").style("cursor", "grab");
    var rect_under_legend = legend_root.insert("rect");
    legend_root.insert('text').attr("id", "legendtitle").text(title).style("font", "bold 12px 'Enriqueta', arial, serif").attr("x", xpos + space_elem).attr("y", ypos);
    legend_root.insert('text').attr("id", "legendsubtitle").text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif").attr("x", xpos + space_elem).attr("y", ypos + 15);

    var ref_symbols = document.getElementById(layer).querySelectorAll(symbol_type),
        type_param = symbol_type === 'circle' ? 'r' : 'width';

    var sqrt = Math.sqrt;

    var id_ft_val_min = +ref_symbols[nb_features - 1].id.split(' ')[1].split('_')[1],
        id_ft_val_max = +ref_symbols[0].id.split(' ')[1].split('_')[1],
        size_max = +ref_symbols[nb_features - 1].getAttribute(type_param),
        size_min = +ref_symbols[0].getAttribute(type_param),
        val_min = Math.abs(+user_data[ref_layer_name][id_ft_val_min][field]),
        val_max = Math.abs(+user_data[ref_layer_name][id_ft_val_max][field]),
        nb_decimals = get_nb_decimals(val_max),
        diff_size = sqrt(size_max) - sqrt(size_min),
        diff_val = val_max - val_min,
        val_interm1 = val_min + diff_val / 3,
        val_interm2 = val_interm1 + diff_val / 3,
        size_interm1 = sqrt(size_min) + diff_size / 3,
        size_interm2 = size_interm1 + diff_size / 3,
        z_scale = +d3.zoomTransform(map.node()).k,
        ref_symbols_params = [{ size: size_min * z_scale, value: val_max.toFixed(nb_decimals) }, { size: Math.pow(size_interm1, 2) * z_scale, value: val_interm2.toFixed(nb_decimals) }, { size: Math.pow(size_interm2, 2) * z_scale, value: val_interm1.toFixed(nb_decimals) }, { size: size_max * z_scale, value: val_min.toFixed(nb_decimals) }];

    var legend_elems = legend_root.selectAll('.legend').append("g").data(ref_symbols_params).enter().insert('g').attr('class', function (d, i) {
        return "legend_feature lg legend_" + i;
    });

    var max_size = ref_symbols_params[0].size,
        last_size = 0,
        last_pos = y_pos2;
    if (nested == "false") {
        if (symbol_type === "circle") {
            legend_elems.append("circle").attr("cx", xpos + space_elem + boxgap + max_size / 2).attr("cy", function (d, i) {
                last_pos = i * boxgap + d.size + last_pos + last_size;
                last_size = d.size;
                return last_pos;
            }).attr('r', function (d) {
                return d.size;
            }).styles({ fill: color_symb_lgd, stroke: "rgb(0, 0, 0)", "fill-opacity": 1 });
            last_pos = y_pos2;last_size = 0;
            legend_elems.append("text").attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5).attr("y", function (d, i) {
                last_pos = i * boxgap + d.size + last_pos + last_size;
                last_size = d.size;
                return last_pos + i * 2 / 3;
            }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
                return d.value;
            });
        } else if (symbol_type === "rect") {
            legend_elems.append("rect").attr("x", function (d) {
                return xpos + space_elem + boxgap + max_size / 2 - d.size / 2;
            }).attr("y", function (d, i) {
                last_pos = i * boxgap + d.size / 2 + last_pos + last_size;
                last_size = d.size;
                return last_pos;
            }).attr('width', function (d) {
                return d.size;
            }).attr('height', function (d) {
                return d.size;
            }).styles({ fill: color_symb_lgd, stroke: "rgb(0, 0, 0)", "fill-opacity": 1 });
            last_pos = y_pos2;last_size = 0;
            var x_text_pos = xpos + space_elem + boxgap + max_size * 1.5 + 5;
            legend_elems.append("text").attr("x", x_text_pos).attr("y", function (d, i) {
                last_pos = i * boxgap + d.size / 2 + last_pos + last_size;
                last_size = d.size;
                return last_pos + d.size * 2 / 3;
            }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
                return d.value;
            });
        }
    } else if (nested == "true") {
        if (symbol_type === "circle") {
            legend_elems.append("circle").attr("cx", xpos + space_elem + boxgap + max_size / 2).attr("cy", function (d) {
                return ypos + 45 + max_size + max_size / 2 - d.size;
            }).attr('r', function (d) {
                return d.size;
            }).styles({ fill: color_symb_lgd, stroke: "rgb(0, 0, 0)", "fill-opacity": 1 });
            last_pos = y_pos2;last_size = 0;
            legend_elems.append("text").attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5).attr("y", function (d) {
                return ypos + 45 + max_size * 2 - max_size / 2 - d.size * 2;
            }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
                return d.value;
            });
            last_pos = ypos + 30 + max_size + max_size / 2;
        } else if (symbol_type === "rect") {
            legend_elems.append("rect").attr("x", xpos + space_elem + boxgap).attr("y", function (d) {
                return ypos + 45 + max_size - d.size;
            }).attr('height', function (d) {
                return d.size;
            }).attr('width', function (d) {
                return d.size;
            }).styles({ fill: color_symb_lgd, stroke: "rgb(0, 0, 0)", "fill-opacity": 1 });
            last_pos = y_pos2;last_size = 0;
            legend_elems.append("text").attr("x", xpos + space_elem + boxgap + max_size * 1.5 + 5).attr("y", function (d) {
                return ypos + 45 + max_size - d.size;
            }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
                return d.value;
            });
            last_pos = ypos + 30 + max_size + max_size / 2;
        }
    }

    if (current_layers[layer].break_val) {
        var bottom_colors = legend_root.append("g").attr("class", "legend_feature");
        bottom_colors.insert("text").attr("id", "col1_txt").attr("x", xpos + space_elem).attr("y", last_pos + 1.75 * space_elem).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).html('< ' + current_layers[layer].break_val);
        bottom_colors.insert("rect").attr("id", "col1").attr("x", xpos + space_elem).attr("y", last_pos + 2 * space_elem).attrs({ "width": space_elem, "height": space_elem }).style("fill", current_layers[layer].fill_color.two[0]);
        bottom_colors.insert("text").attr("id", "col1_txt").attr("x", xpos + 3 * space_elem).attr("y", last_pos + 1.75 * space_elem).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).html('> ' + current_layers[layer].break_val);
        bottom_colors.insert("rect").attr("id", "col2").attr("x", xpos + 3 * space_elem).attr("y", last_pos + 2 * space_elem).attrs({ "width": space_elem, "height": space_elem }).style("fill", current_layers[layer].fill_color.two[1]);
    }
    var coef = current_layers[layer].break_val ? 3.75 : 2;
    legend_root.append("g").attr("class", "legend_feature").insert("text").attr("id", "legend_bottom_note").attrs({ x: xpos + space_elem, y: last_pos + coef * space_elem }).style("font", "11px 'Enriqueta', arial, serif").html('');

    legend_root.call(drag_legend_func(legend_root));
    legend_root.attr("nested", nested);
    make_underlying_rect(legend_root, rect_under_legend, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    if (current_layers[layer].renderer == "PropSymbolsChoro") {
        legend_root.attr("transform", "translate(120, 0)");
    }
    make_legend_context_menu(legend_root, layer);
}

function createLegend_choro(layer, field, title, subtitle) {
    var boxgap = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var rect_fill_value = arguments[5];
    var rounding_precision = arguments[6];
    var no_data_txt = arguments[7];

    var boxheight = 18,
        boxwidth = 18,
        xpos = 30,
        ypos = 30,
        last_pos = null,
        y_pos2 = ypos + boxheight * 1.8,
        tmp_class_name = ["legend", "legend_feature", "lgdf_" + layer].join(' '),
        nb_class,
        data_colors_label;

    boxgap = +boxgap;

    var legend_root = map.insert('g').attr('id', 'legend_root').attr("class", tmp_class_name).attr("transform", "translate(0,0)").attr("boxgap", boxgap).attr("rounding_precision", rounding_precision).style("cursor", "grab");

    var rect_under_legend = legend_root.insert("rect");

    legend_root.insert('text').attr("id", "legendtitle").text(title || "Title").style("font", "bold 12px 'Enriqueta', arial, serif").attr("x", xpos + boxheight).attr("y", ypos);
    legend_root.insert('text').attr("id", "legendsubtitle").text(subtitle).style("font", "italic 12px 'Enriqueta', arial, serif").attr("x", xpos + boxheight).attr("y", ypos + 15);

    if (current_layers[layer].renderer.indexOf('Categorical') > -1) {
        data_colors_label = [];
        current_layers[layer].color_map.forEach(function (v, k) {
            data_colors_label.push({ value: v[1], color: v[0] });
        });
        nb_class = current_layers[layer].color_map.size;
    } else if (current_layers[layer].renderer.indexOf('TypoSymbols') > -1) {
        data_colors_label = [];
        current_layers[layer].symbols_map.forEach(function (v, k) {
            data_colors_label.push({ value: k, image: v });
        });
        nb_class = current_layers[layer].symbols_map.size;
    } else {
        data_colors_label = current_layers[layer].colors_breaks.map(function (obj) {
            return { value: obj[0], color: obj[1] };
        });
        nb_class = current_layers[layer].colors_breaks.length;
    }
    var legend_elems = legend_root.selectAll('.legend').append("g").data(data_colors_label).enter().insert('g').attr('class', function (d, i) {
        return "legend_feature lg legend_" + i;
    });

    if (current_layers[layer].renderer.indexOf('TypoSymbols') == -1) legend_elems.append('rect').attr("x", xpos + boxwidth).attr("y", function (d, i) {
        last_pos = y_pos2 + i * boxgap + i * boxheight;
        return last_pos;
    }).attr('width', boxwidth).attr('height', boxheight).style('fill', function (d) {
        return d.color;
    }).style('stroke', function (d) {
        return d.color;
    });else legend_elems.append('image').attr("x", xpos + boxwidth).attr("y", function (d, i) {
        last_pos = y_pos2 + i * boxgap + i * boxheight;
        return last_pos;
    }).attr('width', boxwidth).attr('height', boxheight).attr("xlink:href", function (d) {
        return d.image[0];
    });

    if (current_layers[layer].renderer.indexOf('Choropleth') > -1 || current_layers[layer].renderer.indexOf('PropSymbolsChoro') > -1 || current_layers[layer].renderer.indexOf('Gridded') > -1 || current_layers[layer].renderer.indexOf('Stewart') > -1) {
        (function () {
            var tmp_pos = void 0;
            legend_elems.append('text').attr("x", xpos + boxwidth * 2 + 10).attr("y", function (d, i) {
                tmp_pos = y_pos2 + i * boxheight + i * boxgap;
                return tmp_pos;
            }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
                return round_value(+d.value.split(' - ')[1], rounding_precision);
            });

            legend_root.insert('text').attr("id", "lgd_choro_min_val").attr("x", xpos + boxwidth * 2 + 10).attr("y", tmp_pos + boxheight + boxgap).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
                return round_value(data_colors_label[data_colors_label.length - 1].value.split(' - ')[0], rounding_precision);
            });
        })();
    } else legend_elems.append('text').attr("x", xpos + boxwidth * 2 + 10).attr("y", function (d, i) {
        return y_pos2 + i * boxheight + i * boxgap + boxheight * 2 / 3;
    }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(function (d) {
        return d.value;
    });

    if (current_layers[layer].options_disc && current_layers[layer].options_disc.no_data) {
        var gp_no_data = legend_root.append("g");
        gp_no_data.attr("class", "legend_feature").append('rect').attrs({ x: xpos + boxheight, y: last_pos + 2 * boxheight }).attr('width', boxwidth).attr('height', boxheight).style('fill', current_layers[layer].options_disc.no_data).style('stroke', current_layers[layer].options_disc.no_data);

        gp_no_data.append('text').attrs({ x: xpos + boxwidth * 2 + 10, y: last_pos + 2.7 * boxheight, id: "no_data_txt" }).styles({ 'alignment-baseline': 'middle', 'font-size': '10px' }).text(no_data_txt != null ? no_data_txt : "No data");

        last_pos = last_pos + 2 * boxheight;
    }

    legend_root.append("g").attr("class", "legend_feature").insert("text").attr("id", "legend_bottom_note").attrs({ x: xpos + boxheight, y: last_pos + 2 * boxheight }).style("font", "11px 'Enriqueta', arial, serif").text('');
    legend_root.call(drag_legend_func(legend_root));
    make_underlying_rect(legend_root, rect_under_legend, rect_fill_value);
    legend_root.select('#legendtitle').text(title || "");
    make_legend_context_menu(legend_root, layer);
}

function createlegendEditBox(legend_id, layer_name) {
    function bind_selections() {
        box_class = [layer_name, "_legend_popup"].join('');
        legend_node = svg_map.querySelector(["#", legend_id, ".lgdf_", layer_name].join(''));
        title_content = legend_node.querySelector("#legendtitle");
        subtitle_content = legend_node.querySelector("#legendsubtitle");
        note_content = legend_node.querySelector("#legend_bottom_note");
        no_data_txt = legend_node.querySelector("#no_data_txt");
        legend_node_d3 = d3.select(legend_node);
        legend_boxes = legend_node_d3.selectAll(["#", legend_id, " .lg"].join('')).select("text");
    };

    var box_class, legend_node, title_content, subtitle_content, note_content, source_content;
    var legend_node_d3,
        legend_boxes,
        no_data_txt,
        rect_fill_value = {};

    bind_selections();
    var original_params = {
        title_content: title_content.textContent,
        subtitle_content: subtitle_content.textContent,
        note_content: note_content.textContent,
        no_data_txt: no_data_txt != null ? no_data_txt.textContent : null
    }; //, source_content: source_content.textContent ? source_content.textContent : ""


    if (legend_node.getAttribute("visible_rect") == "true") {
        rect_fill_value = {
            color: legend_node.querySelector("#under_rect").style.fill,
            opacity: legend_node.querySelector("#under_rect").style.fillOpacity
        };
    }

    make_confirm_dialog(box_class, "Layer style options - " + layer_name, { top: true }).then(function (confirmed) {
        if (!confirmed) {
            title_content.textContent = original_params.title_content;
            subtitle_content.textContent = original_params.subtitle_content;
            note_content.textContent = original_params.note_content;
            if (no_data_txt) {
                no_data_txt.textContent = original_params.no_data_txt;
            }
        }
        bind_selections();
        make_underlying_rect(legend_node_d3, legend_node_d3.select("#under_rect"), rect_fill_value);
    });

    var box_body = d3.select([".", box_class].join('')),
        current_nb_dec;

    box_body.append('h3').html(i18next.t("app_page.legend_style_box.subtitle")).append('p').html(i18next.t("app_page.legend_style_box.lgd_title")).insert('input').attr("value", title_content.textContent).on("keyup", function () {
        title_content.textContent = this.value;
    });
    box_body.append('p').html(i18next.t("app_page.legend_style_box.var_name")).insert('input').attr("value", subtitle_content.textContent).on("keyup", function () {
        subtitle_content.textContent = this.value;
    });

    console.log(legend_boxes);

    if (legend_boxes._groups[0].length > 0 && current_layers[layer_name].renderer != "Categorical" && current_layers[layer_name].renderer != "TypoSymbols") {
        // Float precision for label in the legend
        // (actually it's not really the float precision but an estimation based on
        // the string representation of only two values but it will most likely do the job in many cases)
        var max_nb_decimals = 0,
            max_nb_left = 0;
        if (legend_id.indexOf("2") === -1 && legend_id.indexOf("links") === -1) {
            max_nb_decimals = get_max_nb_dec(layer_name);
            max_nb_left = get_max_nb_left_sep(layer_name);
        } else {
            (function () {
                var nb_dec = [],
                    nb_left = [];
                legend_boxes.each(function (d) {
                    nb_dec.push(get_nb_decimals(d.value));
                    nb_left.push(get_nb_left_separator(d.value));
                });
                max_nb_decimals = max_fast(nb_dec);
                max_nb_left = min_fast(nb_left);
            })();
        }

        if (max_nb_decimals > 0) {
            if (legend_node.getAttribute("rounding_precision")) current_nb_dec = legend_node.getAttribute("rounding_precision");else {
                (function () {
                    var nbs = [],
                        nb_dec = [];
                    legend_boxes.each(function () {
                        nbs.push(this.textContent);
                    });
                    for (var i = 0; i < nbs.length; i++) {
                        nb_dec.push(get_nb_decimals(nbs[i]));
                    }
                    current_nb_dec = max_fast(nb_dec);
                })();
            }
            if (max_nb_decimals > +current_nb_dec && max_nb_decimals > 18) max_nb_decimals = 18;
            box_body.append('p').style("display", "inline").attr("id", "precision_change_txt").html([i18next.t("app_page.legend_style_box.float_rounding"), current_nb_dec, ' '].join(''));
            if (legend_id === "legend_root") box_body.append('input').attrs({ id: "precision_range", type: "range", min: -+max_nb_left, max: max_nb_decimals, step: 1, value: current_nb_dec }).styles({ display: "inline", width: "90px", "vertical-align": "middle", "margin-left": "10px" }).on('change', function () {
                var nb_float = +this.value;
                d3.select("#precision_change_txt").html([i18next.t("app_page.legend_style_box.float_rounding"), nb_float, ' '].join(''));
                for (var i = 0; i < legend_boxes._groups[0].length; i++) {
                    var values = legend_boxes._groups[0][i].__data__.value.split(' - ');
                    legend_boxes._groups[0][i].innerHTML = round_value(+values[1], nb_float);
                }
                var min_val = +legend_boxes._groups[0][legend_boxes._groups[0].length - 1].__data__.value.split(' - ')[0];
                legend_node.querySelector('#lgd_choro_min_val').innerHTML = round_value(min_val, nb_float);
                legend_node.setAttribute("rounding_precision", nb_float);
            });else if (legend_id === "legend_root2") box_body.append('input').attrs({ id: "precision_range", type: "range", min: -+max_nb_left, max: max_nb_decimals, step: 1, value: current_nb_dec }).styles({ display: "inline", width: "90px", "vertical-align": "middle", "margin-left": "10px" }).on('change', function () {
                var nb_float = +this.value;
                d3.select("#precision_change_txt").html([i18next.t("app_page.legend_style_box.float_rounding"), nb_float, ' '].join(''));
                for (var i = 0; i < legend_boxes._groups[0].length; i++) {
                    var value = legend_boxes._groups[0][i].__data__.value;
                    legend_boxes._groups[0][i].innerHTML = round_value(+value, nb_float);
                }
                legend_node.setAttribute("rounding_precision", nb_float);
            });else if (legend_id === "legend_root_links") box_body.append('input').attrs({ id: "precision_range", type: "range", min: -+max_nb_left, max: max_nb_decimals, step: 1, value: current_nb_dec }).styles({ display: "inline", width: "90px", "vertical-align": "middle", "margin-left": "10px" }).on('change', function () {
                var nb_float = +this.value,
                    dec_mult = +["1", Array(nb_float).fill("0").join('')].join('');
                d3.select("#precision_change_txt").html([i18next.t("app_page.legend_style_box.float_rounding"), nb_float, ' '].join(''));
                for (var i = 0; i < legend_boxes._groups[0].length; i++) {
                    var value = legend_boxes._groups[0][i].__data__.value[1];
                    legend_boxes._groups[0][i].innerHTML = round_value(+value, nb_float);
                }
                legend_node.setAttribute("rounding_precision", nb_float);
                var min_val = +legend_boxes._groups[0][legend_boxes._groups[0].length - 1].__data__.value[0];
                legend_node.querySelector('#lgd_choro_min_val').innerHTML = round_value(min_val, nb_float);
                legend_node.setAttribute("rounding_precision", nb_float);
            });
        }
    }

    if (legend_id === "legend_root") {
        var current_state = +legend_node.getAttribute("boxgap") == 0 ? true : false;
        box_body.insert("p").html(i18next.t("app_page.legend_style_box.gap_boxes")).insert("input").attr("type", "checkbox").attr("id", "style_lgd").on("change", function () {
            var rendered_field = current_layers[layer_name].rendered_field2 ? current_layers[layer_name].rendered_field2 : current_layers[layer_name].rendered_field;
            legend_node = svg_map.querySelector(["#legend_root.lgdf_", layer_name].join(''));
            var boxgap = +legend_node.getAttribute("boxgap") == 0 ? 4 : 0;
            var rounding_precision = document.getElementById("precision_range") ? document.getElementById("precision_range").value : undefined;
            var transform_param = legend_node.getAttribute("transform"),
                lgd_title = legend_node.querySelector("#legendtitle").innerHTML,
                lgd_subtitle = legend_node.querySelector("#legendsubtitle").innerHTML;

            legend_node.remove();
            createLegend_choro(layer_name, rendered_field, lgd_title, lgd_subtitle, boxgap, rect_fill_value, rounding_precision);
            bind_selections();
            if (transform_param) svg_map.querySelector(["#legend_root.lgdf_", layer_name].join('')).setAttribute("transform", transform_param);
        });
        document.getElementById("style_lgd").checked = current_state;
    } else if (legend_id == "legend_root2") {
        var _current_state = legend_node.getAttribute("nested") == "true" ? true : false;
        box_body.insert("p").html(i18next.t("app_page.legend_style_box.nested_symbols")).insert("input").attr("type", "checkbox").attr("id", "style_lgd").on("change", function () {
            legend_node = svg_map.querySelector(["#legend_root2.lgdf_", layer_name].join(''));
            var rendered_field = current_layers[layer_name].rendered_field;
            var nested = legend_node.getAttribute("nested") == "true" ? "false" : "true";
            var transform_param = legend_node.getAttribute("transform"),
                lgd_title = legend_node.querySelector("#legendtitle").innerHTML,
                lgd_subtitle = legend_node.querySelector("#legendsubtitle").innerHTML;

            legend_node.remove();
            createLegend_symbol(layer_name, rendered_field, lgd_title, lgd_subtitle, nested, rect_fill_value);
            bind_selections();
            if (transform_param) svg_map.querySelector(["#legend_root2.lgdf_", layer_name].join('')).setAttribute("transform", transform_param);
        });
        document.getElementById("style_lgd").checked = _current_state;
    }

    // Todo : Reactivate this functionnality :
    //    box_body.insert("p").html("Display features count ")
    //            .insert("input").attr("type", "checkbox")
    //            .on("change", function(){
    //                alert("to be done!");
    //            });

    //    if(current_layers[layer].options_disc && current_layers[layer].options_disc.no_data){
    if (no_data_txt) {
        box_body.insert('p').html(i18next.t("app_page.legend_style_box.no_data")).insert('input').attr("value", no_data_txt.textContent).style("font-family", "12px Gill Sans Extrabold, sans-serif").on("keyup", function () {
            no_data_txt.textContent = this.value;
        });
    }

    box_body.insert('p').html(i18next.t("app_page.legend_style_box.additionnal_notes")).insert('input').attr("value", note_content.textContent).style("font-family", "12px Gill Sans Extrabold, sans-serif").on("keyup", function () {
        note_content.textContent = this.value;
    });

    var rectangle_options = box_body.insert('p').html(i18next.t("app_page.legend_style_box.under_rectangle"));
    rectangle_options.insert("input").attrs({ type: "checkbox",
        value: rect_fill_value.color || "#ededed",
        checked: rect_fill_value.color === undefined ? null : true,
        id: "rect_lgd_checkbox" }).on("change", function () {
        if (this.checked) {
            rectangle_options.select("#choice_color_under_rect").attr("disabled", null);
            rect_fill_value = { color: "#ffffff", opacity: 1 };
        } else {
            rectangle_options.select("#choice_color_under_rect").attr("disabled", true);
            rect_fill_value = undefined;
        }
        make_underlying_rect(legend_node_d3, legend_node_d3.select("#under_rect"), rect_fill_value);
    });
    rectangle_options.insert("input").attrs({ id: "choice_color_under_rect",
        type: "color",
        value: rect_fill_value ? rgb2hex(rect_fill_value.color) : undefined,
        disabled: rect_fill_value === undefined ? true : null }).on("change", function () {
        rect_fill_value = { color: this.value, opacity: 1 };
        make_underlying_rect(legend_node_d3, legend_node_d3.select("#under_rect"), rect_fill_value);
    });
}

function move_legends(new_shape) {
    var legends = [svg_map.querySelectorAll("#legend_root"), svg_map.querySelectorAll("#legend_root2"), svg_map.querySelectorAll("#legend_root_links")];

    var xy0_map = get_map_xy0();

    for (var j = 0; j < 3; ++j) {
        var legends_type = legends[j];
        for (var i = 0, i_len = legends_type.length; i < i_len; ++i) {
            var legend_bbox = legends_type[i].getBoundingClientRect();
            if (legend_bbox.x + legend_bbox.width / 2 > +new_shape[0] + xy0_map.x) {
                var current_transform = legends_type[i].getAttribute("transform");

                var _$exec$1$split = /\(([^\)]+)\)/.exec(current_transform)[1].split(",");

                var _$exec$1$split2 = _slicedToArray(_$exec$1$split, 2);

                var val_x = _$exec$1$split2[0];
                var val_y = _$exec$1$split2[1];

                var trans_x = legend_bbox.x + legend_bbox.width - (+new_shape[0] + xy0_map.x);
                legends_type[i].setAttribute("transform", ["translate(", +val_x - trans_x, val_y, ")"].join(''));
            }
            if (legend_bbox.y + legend_bbox.height / 2 > +new_shape[1] + xy0_map.y) {
                var _current_transform = legends_type[i].getAttribute("transform");

                var _$exec$1$split3 = /\(([^\)]+)\)/.exec(_current_transform)[1].split(",");

                var _$exec$1$split4 = _slicedToArray(_$exec$1$split3, 2);

                var _val_x = _$exec$1$split4[0];
                var _val_y = _$exec$1$split4[1];

                var trans_y = legend_bbox.y + legend_bbox.height - (+new_shape[1] + xy0_map.y);
                legends_type[i].setAttribute("transform", ["translate(", _val_x, +_val_y - trans_y, ")"].join(''));
            }
        }
    }
}

var get_max_nb_dec = function get_max_nb_dec(layer_name) {
    if (!current_layers[layer_name] || !current_layers[layer_name].colors_breaks) return;
    var max = 0;
    current_layers[layer_name].colors_breaks.forEach(function (el) {
        var tmp = el[0].split(' - ');
        var p1 = tmp[0].indexOf("."),
            p2 = tmp[1].indexOf(".");
        if (p1 > -1) if (tmp[0].length - 1 - p1 > max) max = tmp[0].length - 1 - tmp[0].indexOf('.');
        if (p2 > -1) if (tmp[1].length - 1 - p2 > max) max = tmp[1].length - 1 - tmp[1].indexOf('.');
    });
    return max;
};

var get_max_nb_left_sep = function get_max_nb_left_sep(layer_name) {
    if (!current_layers[layer_name] || !current_layers[layer_name].colors_breaks) return;
    var nb_left = [];
    current_layers[layer_name].colors_breaks.forEach(function (el) {
        var tmp = el[0].split(' - ');
        var p1 = tmp[0].indexOf("."),
            p2 = tmp[1].indexOf(".");
        nb_left.push(p1);
        nb_left.push(p2);
    });
    return min_fast(nb_left);
};
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function get_map_template() {
    var map_config = new Object(),
        layers_style = [],
        layers = map.selectAll("g.layer"),
        map_title = document.getElementById('map_title'),
        displayed_legend = d3.selectAll(".legend_feature:not(.title)"),
        zoom_transform = d3.zoomTransform(svg_map);

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
    map_config.displayed_legend = displayed_legend.size() > 0 ? true : false;

    if (map_title) {
        map_config.title = {
            "content": map_title.textContent,
            "x": map_title.getAttribute("x"),
            "y": map_title.getAttribute("y"),
            "style": map_title.getAttribute("style")
        };
    }

    for (var i = map_config.n_layers - 1; i > -1; --i) {
        var layer_name = layers._groups[0][i].id,
            nb_ft = current_layers[layer_name].n_features,
            selection = void 0;

        layers_style[i] = new Object();
        layers_style[i].layer_name = layer_name;
        layers_style[i].n_features = nb_ft;

        if (current_layers[layer_name]["stroke-width-const"]) layers_style[i]["stroke-width-const"] = current_layers[layer_name]["stroke-width-const"];

        if (current_layers[layer_name].fixed_stroke) layers_style[i].fixed_stroke = current_layers[layer_name].fixed_stroke;

        if (current_layers[layer_name].colors_breaks) layers_style[i].colors_breaks = JSON.stringify(current_layers[layer_name].colors_breaks);

        if (current_layers[layer_name].targeted) {
            selection = map.select("#" + layer_name).selectAll("path");
            layers_style[i].fill_opacity = selection.style("fill-opacity");
            layers_style[i].targeted = true;
            layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
        } else if (!current_layers[layer_name].renderer) {
            selection = map.select("#" + layer_name).selectAll("path");
        } else if (current_layers[layer_name].renderer.indexOf("PropSymbols") > -1) {
            var type_symbol = current_layers[layer_name].symbol;
            selection = map.select("#" + layer_name).selectAll(type_symbol);
            layers_style[i].symbol = type_symbol;
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].renderer = current_layers[layer_name].renderer;
            layers_style[i].size = current_layers[layer_name].size;
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;
            layers_style[i].features_order = JSON.stringify(current_layers[layer_name].features_order);
        } else if (current_layers[layer_name].renderer == "Stewart" || current_layers[layer_name].renderer == "Gridded" || current_layers[layer_name].renderer == "Choropleth" || current_layers[layer_name].renderer == "Carto_doug") {
            (function () {
                selection = map.select("#" + layer_name).selectAll("path");
                layers_style[i].renderer = current_layers[layer_name].renderer;
                layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
                layers_style[i].fill_color = current_layers[layer_name].fill_color;
                layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
                layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;
                var color_by_id = [];
                selection.each(function () {
                    color_by_id.push(rgb2hex(this.style.fill));
                });
                layers_style[i].color_by_id = color_by_id;
                layers_style[i].options_disc = current_layers[layer_name].options_disc;
            })();
        } else if (current_layers[layer_name].renderer == "Links" || current_layers[layer_name].renderer == "DiscLayer") {
            selection = map.select("#" + layer_name).selectAll("path");
            layers_style[i].fill_color = current_layers[layer_name].fill_color;
            layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;
            layers_style[i].size = current_layers[layer_name].size;
            layers_style[i].min_display = current_layers[layer_name].min_display;
            if (current_layers[layer_name].renderer == "DiscLayer") {
                layers_style[i].result = new Array(nb_ft);
                for (var j = 0; j < nb_ft; j++) {
                    layers_style[i].result[j] = nb_ft;
                }
            } else {
                layers_style[i].topo_geom = String(current_layers[layer_name].key_name);
                layers_style[i].linksbyId = current_layers[layer_name].linksbyId.splice(0, nb_ft);
            }
        } else if (current_layers[layer_name].renderer == "TypoSymbols") {
            selection = map.select("#" + layer_name).selectAll("image");
            layers_style[i].symbols_map = JSON.stringify([].concat(_toConsumableArray(current_layers[layer_name].symbols_map)));
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].ref_layer_name = current_layers[layer_name].ref_layer_name;

            var state_to_save = [];
            var selec = selection._groups[0];
            for (var _i = 0; _i < selec.length; _i++) {
                var ft = selec[_i];
                state_to_save.push({ display: ft.style.display,
                    data: ft.__data__,
                    pos: [ft.getAttribute('x'), ft.getAttribute('y')],
                    size: ft.getAttribute('width')
                });
            }
            layers_style[i].current_state = state_to_save;
        } else if (current_layers[layer_name].renderer == "Label") {
            selection = map.select("#" + layer_name).selectAll("text");
            layers_style[i].rendered_field = current_layers[layer_name].rendered_field;
            layers_style[i].contents_pos = [];
        } else {
            selection = map.select("#" + layer_name).selectAll("path");
        }
        layers_style[i].stroke_opacity = selection.style("stroke-opacity");
        layers_style[i].fill_opacity = selection.style("fill-opacity");
    }

    return Q.all(layers_style.map(function (obj) {
        return obj.topo_geom ? request_data("GET", "/get_layer/" + obj.topo_geom, null) : null;
    })).then(function (result) {
        for (var _i2 = 0; _i2 < layers_style.length; _i2++) {
            if (result[_i2] && result[_i2].target) {
                layers_style[_i2].topo_geom = result[_i2].target.responseText;
            }
        }
        console.log(JSON.stringify({ "map_config": map_config, "layers": layers_style }));
        return JSON.stringify({ "map_config": map_config, "layers": layers_style });;
    });
}

// Function triggered when the user request a download of its map preferences
function save_map_template() {
    get_map_template().then(function (json_params) {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(json_params),
            dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "noname_properties.json");
        dlAnchorElem.click();
    });
}

function load_map_template() {
    var input_button = d3.select(document.createElement('input')).attr("type", "file").attr("name", "file").attr("enctype", "text/json").on('change', function () {
        prepareReading(d3.event);
    });

    var prepareReading = function prepareReading(event) {
        var file = event.target.files[0],
            reader = new FileReader();
        reader.onloadend = function () {
            apply_user_preferences(reader.result);
        };
        reader.readAsText(file);
    };

    input_button.node().dispatchEvent(new MouseEvent("click"));
}

function apply_user_preferences(json_pref) {
    var preferences = JSON.parse(json_pref),
        map_config = preferences.map_config,
        layers = preferences.layers;

    var func_name_corresp = new Map([["Links", "flow"], ["PropSymbolsChoro", "choroprop"], ["PropSymbols", "prop"], ["Stewart", "smooth"], ["Gridded", "grid"], ["DiscLayer", "discont"], ["Choropleth", "choro"], ["Categorical", "typo"]]);

    // Update some global variables with the readed values in order to retrieve
    // the same map size / orientation / zoom / etc ...
    w = +map_config.div_width;
    h = +map_config.div_height;
    canvas_mod_size([w, h]);
    document.getElementById("input-width").value = w;
    document.getElementById("input-height").value = h;
    current_proj_name = map_config.projection;
    proj = eval(available_projections.get(current_proj_name));
    s = map_config.projection_scale;
    t = map_config.projection_translate;
    proj.scale(s).translate(t).rotate(map_config.projection_rotation);
    path = d3.geoPath().projection(proj).pointRadius(4);
    map.selectAll(".layer").selectAll("path").attr("d", path);

    var _loop = function _loop(i) {
        var layer_name = layers[i].layer_name,
            symbol = void 0,
            layer_selec = void 0;

        var fill_opacity = layers[i].fill_opacity,
            stroke_opacity = layers[i].stroke_opacity;

        if (layers[i].topo_geom && layer_name != "Sphere" && layer_name != "Simplified_land_polygons") {
            var tmp = { skip_alert: true };
            if (layers[i].targeted) {
                tmp['target_layer_on_add'] = true;
            } else if (layers[i].renderer) {
                tmp['func_name'] = func_name_corresp.get(layers[i].renderer);
                tmp['result_layer_on_add'] = true;
            }
            tmp['choosed_name'] = layer_name;
            handle_reload_TopoJSON(layers[i].topo_geom, tmp).then(function (n_layer_name) {
                console.log([layer_name, n_layer_name]);
                layer_name = n_layer_name;
                if (layers[i].renderer) {
                    current_layers[layer_name].renderer = layers[i].renderer;
                }

                symbol = "path";
                layer_selec = map.select("#" + layer_name);

                current_layers[layer_name].rendered_field = layers[i].rendered_field;
                current_layers[layer_name]['stroke-width-const'] = layers[i]['stroke-width-const'];
                current_layers[layer_name].fixed_stroke = layers[i].fixed_stroke;
                if (layers[i].ref_layer_name) current_layers[layer_name].ref_layer_name = layers[i].ref_layer_name;
                if (layers[i].size) current_layers[layer_name].size = layers[i].size;
                if (layers[i].colors_breaks) current_layers[layer_name].colors_breaks = JSON.parse(layers[i].colors_breaks);
                if (layers[i].fill_color) current_layers[layer_name].fill_color = layers[i].fill_color;
                console.log(layers[i]);
                if (layers[i].renderer) {
                    if (layers[i].renderer == "Choropleth" || layers[i].renderer == "Stewart" || layers[i].renderer == "Gridded") {
                        layer_selec.selectAll("path").style("fill", function (d, j) {
                            return layers[i].color_by_id[j];
                        });
                    } else if (layers[i].renderer == "Links") {
                        current_layers[layer_name].linksbyId = layers[i].linksbyId;
                        current_layers[layer_name].min_display = layers[i].min_display;
                    } else if (layers[i].renderer == "DiscLayer") {
                        current_layers[layer_name].result = new Map(layers[i].result);
                        layer_selec.selectAll("path").style("stroke-width", function (d, i) {
                            return current_layers[layer_name].result.get(d.id);
                        });
                    }
                } else if (layers[i].fill_color.random) {
                    layer_selec.selectAll(symbol).style("fill", function () {
                        return Colors.names[Colors.random()];
                    });
                }
                layer_selec.selectAll(symbol).style("fill-opacity", fill_opacity).style("stroke-opacity", stroke_opacity);
            });
        } else if (layer_name == "Sphere" || layer_name == "Simplified_land_polygons") {
            add_layout_feature(layer_name);
        } else if (layers[i].renderer && layers[i].renderer.startsWith("PropSymbol")) {
            var layer_to_append = map.append("g").attr("id", layer_name).attr("class", "result_layer layer");
            var zs = map_config.zoom_scale;
            var full_params = JSON.parse(layers[i].features_order);
            var n_ft = full_params.length;
            symbol = layers[i].symbol;

            current_layers[layer_name] = {
                renderer: layers[i].renderer,
                rendered_field: layers[i].rendered_field,
                'stroke-width-const': layers[i]['stroke-width-const'],
                fixed_stroke: layers[i].fixed_stroke,
                size: layers[i].size,
                ref_layer_name: layers[i].ref_layer_name,
                fill_color: layers[i].fill_color,
                features_order: full_params,
                symbol: symbol,
                n_features: n_ft
            };

            var ref_size = current_layers[layer_name].size[0],
                max_size = current_layers[layer_name].size[1];

            if (layers[i].colors_breaks) current_layers[layer_name].colors_breaks = JSON.parse(layers[i].colors_breaks);

            if (symbol == "circle") {
                for (var ii = 0; ii < n_ft; ii++) {
                    var params = full_params[ii];
                    layer_to_append.append('circle').attr('cx', params[2][0]).attr("cy", params[2][1]).attr("r", ref_size / zs + params[1]).attr("id", ["PropSymbol_", ii, " feature_", params[0]].join('')).style("fill", params[3]).style("stroke", "black").style("stroke-width", 1 / zs);
                }
            } else if (symbol == "rect") {
                for (var _ii = 0; _ii < n_ft; _ii++) {
                    var _params = full_params[_ii],
                        size = ref_size / zs + _params[1];

                    layer_to_append.append('rect').attr('x', _params[2][0] - size / 2).attr("y", _params[2][1] - size / 2).attr("height", size).attr("width", size).attr("id", ["PropSymbol_", _ii, " feature_", _params[0]].join('')).style("fill", _params[3]).style("stroke", "black").style("stroke-width", 1 / zs);
                };
            }
            layer_selec = map.select("#" + layer_name);
            layer_selec.selectAll(symbol).style("fill-opacity", fill_opacity).style("stroke-opacity", stroke_opacity);
            create_li_layer_elem(layer_name, n_ft, ["Point", "prop"], "result");
        } else if (layers[i].renderer && layers[i].renderer.startsWith("Label")) {
            (function () {
                var layer_to_append = map.append("g").attr("id", layer_name).attr("class", "result_layer layer");
                var nb_ft = layers[i].n_features;
                var symbols_map = new Map(layers[i].symbols_map);
                current_layers[layer_name] = {
                    n_features: nb_ft,
                    renderer: "TypoSymbols",
                    symbols_map: symbols_map,
                    symbol: "image",
                    renderer_field: layers[i].rendered_field,
                    is_result: true,
                    default_size: undefined
                };

                var current_state = layers[i].current_state;
                result_data[layer_name] = [];
                for (var j = 0; j < nb_ft; j++) {
                    result_data[layer_name].push(current_state[j].data);
                }

                layer_to_append.selectAll('image').data(result_data[layer_name]).enter().insert("image").attr("x", function (d, i) {
                    return current_state[i].pos[0];
                }).attr("y", function (d, i) {
                    return current_state[i].pos[1];
                }).attr("width", function (d, i) {
                    return current_state[i].size;
                }).attr("height", function (d, i) {
                    return current_state[i].size;
                }).attr("xlink:href", function (d, i) {
                    return symbols_map.get(d.Symbol_field)[0];
                }).style("display", function (d, i) {
                    return current_state[i].display;
                }).on("mouseover", function () {
                    this.style.cursor = "pointer";
                }).on("mouseout", function () {
                    this.style.cursor = "initial";
                })
                /* .on("dblclick", function(){
                    context_menu.showMenu(d3.event, document.querySelector("body"), getItems(this));
                    })
                .on("contextmenu", function(){
                    context_menu.showMenu(d3.event, document.querySelector("body"), getItems(this));
                    }) */
                .call(drag_elem_geo);
                create_li_layer_elem(layer_name, nb_ft, ["Point", "symbol"], "result");
            })();
        } else if (layers[i].renderer && layers[i].renderer.startsWith("Choropleth")) {
            var rendering_params = {
                "nb_class": "",
                "type": "",
                "schema": layers[i].options_disc.schema,
                "no_data": layers[i].options_disc.no_data,
                "colors": layers[i].options_disc.colors,
                "colorsByFeature": layers[i].color_by_id,
                "renderer": "Choropleth",
                "rendered_field": layers[i].rendered_field,
                "new_name": layer_name
            };
            render_choro(layers[i].ref_layer_name, rendering_params);
        } else {
            null;
        }

        if (layers[i].is_result && map_config.displayed_legend) handle_legend(layer_name);
    };

    for (var i = map_config.n_layers - 1; i > -1; --i) {
        _loop(i);
    }
    var _zoom = svg_map.__zoom;
    _zoom.k = map_config.zoom_scale;
    _zoom.x = map_config.zoom_translate[0];
    _zoom.y = map_config.zoom_translate[1];
    zoom_without_redraw();

    if (map_config.title) {
        var title = document.getElementById("map_title");
        if (title) {
            title.textContent = map_config.title.content;
            title.setAttribute("x", map_config.title.x);
            title.setAttribute("y", map_config.title.y);
            title.setAttribute("style", map_config.title.style);
        } else {
            title = map.append("g").attr("class", "legend_feature title").insert("text").attrs({ id: "map_title", x: map_config.title.x, y: map_config.title.y, "alignment-baseline": "middle", "text-anchor": "middle" }).text(map_config.title.content);
            title.node().setAttribute("style", map_config.title.style);
        }
    }
}

