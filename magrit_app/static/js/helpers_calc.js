

/**
* Function computing the min of an array of values (tking care of empty/null/undefined slot)
*  - no fancy functionnalities here (it doesn't add anything comparing to Math.min.apply()
*    or d3.min() except a little speed-up)
*
* @param {Array} arr
* @return {Number} min
*/
function min_fast(arr) {
  let min = arr[0];
  for (let i = 1, len_i = arr.length; i < len_i; ++i) {
    const val = +arr[i];
    if (val && val < min) { min = val; }
  }
  return min;
}

/**
* Return the maximum value of an array of numbers
*
* @param {Array} arr - the array of numbers
* @return {Number} max
*/
function max_fast(arr) {
  let max = arr[0];
  for (let i = 1, len_i = arr.length; i < len_i; ++i) {
    const val = +arr[i];
    if (val > max) { max = arr[i]; }
  }
  return max;
}

/**
* Test an array of numbers for negative values
*
* @param {Array} arr - the array of numbers
* @return {Bool} result - True or False, whether it contains negatives values or not
*/
function has_negative(arr) {
  for (let i = 0; i < arr.length; ++i) {
    if (+arr[i] < 0) { return true; }
  }
  return false;
}

/**
* @param {Array} arr - The array to test
* @return {Boolean} result - True or False, according to whether it contains empty values or not
*/
const contains_empty_val = function (arr) {
  for (let i = arr.length - 1; i > -1; --i) {
    if (arr[i] == null) return true;
    else if (isNaN(+arr[i])) return true;
  }
  return false;
};

/**
* @param {Array} arr - The array to test
* @return {Boolean} result - True or False, according to whether it contains duplicate or not
*/
function has_duplicate(arr) {
  let h = {},
    len_arr = arr.length;
  for (let i = 0; i < len_arr; i++) {
    if (h[arr[i]]) return true;
    h[arr[i]] = true;
  }
  return false;
}

/**
* Round a given value with the given precision
*
* @param {Number} val - The value to be rounded.
* @param {Number} precision - The wanted precision.
* @return {Number} value - The rounded value.
*/
const round_value = function (val, nb) {
  if (nb == undefined) { return val; }
  const dec_mult = +['1', Array(Math.abs(nb)).fill('0').join('')].join('');
  return nb >= 0
        ? Math.round(+val * dec_mult) / dec_mult
        : Math.round(+val / dec_mult) * dec_mult;
};

function get_nb_decimals(nb) {
  const tmp = nb.toString().split('.');
  return tmp.length < 2 ? 0 : tmp[1].length;
}

function get_nb_left_separator(nb) {
  const tmp = nb.toString().split('.');
  return tmp[0].length;
}

/**
* Get the decimal separator in user's locale.
* and compute the number of item in each bin.
*
* @return {String} separator - The decimal separator (dot or comma)
*/
function getDecimalSeparator() {
  return 1.1.toLocaleString().substr(1, 1);
}

const get_precision_axis = (serie_min, serie_max, precision) => {
  const range_serie = serie_max - serie_min;
  if (serie_max > 1 && range_serie > 100) {
    return '.0f';
  } else if (range_serie > 10) {
    if (precision == 0) {
      return '.0f';
    }
    return '.1f';
  } else if (range_serie > 1) {
    if (precision < 2) {
      return '.1f';
    }
    return '.2f';
  } else if (range_serie > 0.1) {
    return '.3f';
  } else if (range_serie > 0.01) {
    return '.4f';
  } else if (range_serie > 0.001) {
    return '.5f';
  } else if (range_serie > 0.0001) {
    return '.6f';
  } else if (range_serie > 0.00001) {
    return '.7f';
  }
  return '.8f';
};

const PropSizer = function (fixed_value, fixed_size, type_symbol) {
  this.fixed_value = fixed_value;
  let sqrt = Math.sqrt,
    abs = Math.abs,
    pi = Math.PI;
  if (type_symbol === 'circle') {
    this.smax = fixed_size * fixed_size * pi;
    this.scale = val => sqrt(abs(val) * this.smax / this.fixed_value) / pi;
    this.get_value = size => Math.pow(size * pi, 2) / this.smax * this.fixed_value;
  } else if (type_symbol === 'line') {
    this.smax = fixed_size;
    this.scale = val => abs(val) * this.smax / this.fixed_value;
    this.get_value = size => size / this.smax * this.fixed_value;
  } else {
    this.smax = fixed_size * fixed_size;
    this.scale = val => sqrt(abs(val) * this.smax / this.fixed_value);
    this.get_value = size => Math.pow(size, 2) / this.smax * this.fixed_value;
  }
};

function prop_sizer3_e(arr, fixed_value, fixed_size, type_symbol) {
  let pi = Math.PI,
    abs = Math.abs,
    sqrt = Math.sqrt,
    arr_len = arr.length,
    res = [];

  if (!fixed_value || fixed_value == 0) { fixed_value = max_fast(arr); }

  if (type_symbol == 'circle') {
    const smax = fixed_size * fixed_size * pi;
    const t = smax / fixed_value;
    for (let i = 0; i < arr_len; ++i) { res.push(sqrt(abs(arr[i]) * t) / pi); }
  } else if (type_symbol == 'line') {
    const t = fixed_size / fixed_value;
    for (let i = 0; i < arr_len; ++i) { res.push(abs(arr[i]) * t); }
  } else {
    const smax = fixed_size * fixed_size;
    const t = smax / fixed_value;
    for (let i = 0; i < arr_len; ++i) { res.push(sqrt(abs(arr[i]) * t)); }
  }
  return res;
}

function getOptNbClass(len_serie) {
  return Math.floor(1 + 3.3 * Math.log10(len_serie));
}

/**
* Compute breaks according to "Q6" methods
* and compute the number of item in each bin.
*
* @param {Array} serie - An array of ordered values.
* @param {Number} precision - An integer value decribing the precision of the serie.
* @return {Object} summary - Object containing the breaks and the stock in each class.
*/
function getBreaksQ6(serie, precision = null) {
  const len_serie = serie.length;
  const q6_class = [1, 0.05 * len_serie, 0.275 * len_serie, 0.5 * len_serie, 0.725 * len_serie, 0.95 * len_serie, len_serie];
  let breaks = [];
  let tmp = 0;
  let j;
  const stock_class = [];
  for (let i = 0; i < 7; ++i) {
    j = Math.round(q6_class[i]) - 1;
    breaks.push(+serie[j]);
    stock_class.push(j - tmp);
    tmp = j;
  }
  stock_class.shift();
  if (breaks[0] == breaks[1]) {
      // breaks[1] = breaks[0] + (breaks[2] - breaks[1]) / 2;
    breaks[1] = (+serie[1] + breaks[0]) / 2;
  }
  if (breaks[6] == breaks[5]) {
    breaks[5] = serie[len_serie - 2];
      // breaks[5] = breaks[4] + (breaks[5] - breaks[4]) / 2;
  }
  if (precision != null) {
    breaks = breaks.map(val => round_value(val, precision));
  }
  return {
    breaks,
    stock_class,
  };
}

function getBreaksStdDev(serie, share, mean_position = 'center', precision) {
  const min = serie.min(),
    max = serie.max(),
    mean = serie.mean(),
    std_dev = serie.stddev(),
    class_size = std_dev * share;
  const breaks = mean_position == 'center' ? [mean - (class_size / 2), mean + (class_size / 2)] : [mean - class_size, mean, mean + class_size];

  precision = precision || serie.precision;

  while (breaks[0] > min) {
    breaks.unshift(breaks[0] - class_size);
  }
  while (breaks[breaks.length - 1] < max) {
    breaks.push(breaks[breaks.length - 1] + class_size);
  }
  const nb_class = breaks.length - 1;
  if (breaks[0] < min) {
    if (breaks[1] < min) {
      console.log("This shouldn't happen (min)");
    }
    breaks[0] = min;
  }

  if (breaks[nb_class] > max) {
    if (breaks[nb_class - 1] > max) {
      console.log("This shouldn't happen (max)");
    }
    breaks[nb_class] = max;
  }
  return {
    nb_class,
    breaks: breaks.map(v => round_value(v, precision)),
  };
}

function getBinsCount(_values, bins = 16) {
  const values = _values.filter(a => a).sort((a, b) => a - b);
  const nb_ft = values.length;
  let mean,
    stddev,
    min = values[0],
    max = values[nb_ft - 1],
    extend = max - min,
    bin_size = extend / bins,
    counts = new Array(bins),
    break_values = [min],
    sum = 0,
    ix_med = (nb_ft + 1) / 2;

  for (let i = 0; i < bins; i++) {
    break_values.push(break_values[i] + bin_size);
  }
  for (let i = 1, j = 0; i < nb_ft; i++) {
    const class_max = break_values[i - 1];
    counts[i - 1] = 0;
    while (values[j] <= class_max) {
      sum += values[j];
      counts[i - 1] += 1;
      j++;
    }
  }
  mean = sum / nb_ft;
  stddev = getStdDev(values, mean);

  return {
    breaks: break_values,
    counts,
    min,
    max,
    mean,
    median: (ix_med | 0) == ix_med ? values[ix_med] : (values[Math.floor(ix_med)] + values[Math.ceil(ix_med)]) / 2,
    stddev,
  };
}

function parseUserDefinedBreaks(serie, breaks_list) {
  const separator = has_negative(serie) ? '- ' : '-';
  return breaks_list.split(separator).map(el => +el.trim());
}

function getBreaks_userDefined(serie, break_values) {
  if (typeof break_values === 'string') {
    break_values = parseUserDefinedBreaks(serie, break_values);
  }
  let len_serie = serie.length,
    j = 0,
    len_break_val = break_values.length,
    stock_class = new Array(len_break_val - 1);

  for (let i = 1; i < len_break_val; ++i) {
    const class_max = break_values[i];
    stock_class[i - 1] = 0;
    while (serie[j] <= class_max) {
      stock_class[i - 1] += 1;
      j++;
    }
  }
  return {
    breaks: break_values,
    stock_class,
  };
}

/**
* Return the haversine distance in kilometers between two points (lat/long coordinates)
*
* @param {Array} A - Coordinates of the 1st point as [latitude, longitude]
* @param {Array} B - Coordinates of the 2nd point as [latitude, longitude]
* @return {Number} distance - The distance in km between A and B
*/
function haversine_dist(A, B) {
  const pi_dr = Math.PI / 180;

  let lat1 = +A[0],
    lon1 = +A[1],
    lat2 = +B[0],
    lon2 = +B[1];

  let x1 = lat2 - lat1,
    dLat = x1 * pi_dr,
    x2 = lon2 - lon1,
    dLon = x2 * pi_dr;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * pi_dr) * Math.cos(lat2 * pi_dr) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
* Return the distance in kilometers between two points (lat/long coordinates)
* according to the spherical law of cosines
*
* @param {Array} A - Coordinates of the 1st point as [latitude, longitude]
* @param {Array} B - Coordinates of the 2nd point as [latitude, longitude]
* @return {Number} distance - The distance in km between A and B
*/
function coslaw_dist(A, B) {
  const pi_dr = Math.PI / 180;

  let lat1 = +A[0],
    lon1 = +A[1],
    lat2 = +B[0],
    lon2 = +B[1];
  let phi1 = lat1 * pi_dr,
    phi2 = lat2 * pi_dr,
    d_lambda = (lon2 - lon1) * pi_dr;
  return Math.acos(Math.sin(phi1) * Math.sin(phi2) +
                Math.cos(phi1) * Math.cos(phi2) * Math.cos(d_lambda),
                ) * 6371;
}

/**
* Return the eclidian distance between pt1 and pt2, in the unit provided
*
* @param {Array} pt1 - Coordinates of the 1st point as [x, y].
* @param {Array} pt2 - Coordinates of the 2nd point as [x, y].
* @return {Number} distance - The distance between pt1 and pt2.
*/
function get_distance(pt1, pt2) {
  const xs = pt2[0] - pt1[1];
  const ys = pt2[1] - pt1[1];
  return Math.sqrt((xs * xs) + (ys * ys));
}

function getStdDev(values, mean_val) {
  const nb_val = values.length;
  // const pow = Math.pow;
  let s = 0;
  for (let i = 0; i < nb_val; i++) {
      // s += pow(values[i] - mean_val, 2);
    s += (values[i] - mean_val) ** 2;
  }
  return Math.sqrt((1 / nb_val) * s);
}

/**
* Return the maximal available rectangle in the map
*  in order to locate a new legend without covering existing ones.
*
* Implementation taken from http://www.codinghands.co.uk/blog/2013/02/javascript-implementation-omn-maximal-rectangle-algorithm/
*/
function getMaximalAvailableRectangle(legend_nodes) {
  function getMaxRect() {
    const cache = new Array(rows + 1);
    const stack = [];
    let bestUpperLeft = { x: -1, y: -1 };
    let bestLowerRight = { x: -1, y: -1 };

    for (let i = 0; i < cache.length; i++) {
      cache[i] = 0;
    }

    for (let x = cols - 1; x >= 0; x--) {
      updateCache(x, cache);
      let width = 0;
      for (let y = 0; y < rows + 1; y++) {
        if (cache[y] > width) {
          stack.push({ y, width });
          width = cache[y];
        }
        if (cache[y] < width) {
          while (true) {
            const pop = stack.pop();
            var y0 = pop.y,
              w0 = pop.width;
            if (((width * (y - y0)) > area(bestUpperLeft, bestLowerRight))
                && (y - y0 >= minQuadY) && (width >= minQuadX)) {
              bestUpperLeft = { x, y: y0 };
              bestLowerRight = { x: x + width - 1, y: y - 1 };
            }
            width = w0;
            if (cache[y] >= width) break;
          }
          width = cache[y];
          if (width != 0) stack.push({ y: y0, width: w0 });
        }
      }
    }
    return {
      x: bestUpperLeft.x,
      y: bestUpperLeft.y,
      lenX: bestLowerRight.x - bestUpperLeft.x + 1,
      lenY: bestLowerRight.y - bestUpperLeft.y + 1,
      area: area(bestUpperLeft, bestLowerRight),
    };
  }

  function area(upperLeft, lowerRight) {
    if (upperLeft.x > lowerRight.x || upperLeft.y > lowerRight.y) return 0;
    return ((lowerRight.x + 1) - (upperLeft.x)) * ((lowerRight.y + 1) - (upperLeft.y));
  }

  function updateCache(x, cache) {
    for (let y = 0; y < rows; y++) {
      if (mat[x][y] === 1) cache[y]++;
      else cache[y] = 0;
    }
  }

  function fillMat(xs, ys) {
    for (let x = xs[0]; x < xs[1]; x++) {
      for (let y = ys[0]; y < ys[1]; y++) {
        mat[x][y] = 0;
      }
    }
  }
  let { x: x0, y: y0 } = get_map_xy0();
  x0 = Math.abs(x0);
  y0 = Math.abs(y0);
  let cols = Math.abs(w);
  let rows = Math.abs(h);
  let minQuadY = 100;
  let minQuadX = 40;
  let mat = new Array(cols);
  for (let i = 0; i < cols; i++) {
    mat[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      mat[i][j] = 1;
    }
  }
  for (let i = 0; i < legend_nodes.length; i++) {
    const bbox = legend_nodes[i].getBoundingClientRect();
    const bx = Math.floor(bbox.left - x0);
    const by = Math.floor(bbox.top - y0);
    fillMat([bx, bx + Math.floor(bbox.width)], [by, by + Math.floor(bbox.height)]);
  }
  return getMaxRect(mat);
}

function getTranslateNewLegend() {
  const legends = svg_map.querySelectorAll('.legend_feature');
  if (legends.length === 0) {
    return [0, 0];
  }
  try {
    return getMaximalAvailableRectangle(legends);
  } catch (e) {
    console.log(e);
    return [0, 0];
  }
}

const pidegrad = 0.017453292519943295;
const piraddeg = 57.29577951308232;
const degreesToRadians = function degreesToRadians(degrees) { return degrees * pidegrad; };
const radiansToDegrees = function radiansToDegrees(radians) { return radians * piraddeg; };

function scale_to_bbox(bbox) {
  const [xmin, ymin, xmax, ymax] = bbox;
  const feature = {
    type: 'Feature',
    properties: {},
    id: 0,
    geometry: {
      type: 'LineString',
      coordinates: [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]],
    },
  };
  const bboxPath = path.bounds(feature);
  s = 0.95 / Math.max((bboxPath[1][0] - bboxPath[0][0]) / w, (bboxPath[1][1] - bboxPath[0][1]) / h) * proj.scale();
  t = [0, 0];
  proj.scale(s).translate(t);
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
  const zoom_scale = 1;
  const zoom_translate = [
    (w - zoom_scale * (bboxPath[1][0] + bboxPath[0][0])) / 2,
    (h - zoom_scale * (bboxPath[1][1] + bboxPath[0][1])) / 2];
  const zoom = svg_map.__zoom;
  zoom.k = zoom_scale;
  zoom.x = zoom_translate[0];
  zoom.y = zoom_translate[1];
  zoom_without_redraw();
}
