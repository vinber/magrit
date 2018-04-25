import { getColorBrewerArray } from './../colors_helpers';
import { isNumber } from './../helpers';
import { round_value } from './../helpers_calc';

const floor = Math.floor;
const log10 = Math.log10;

/**
* Compute the "optimal" (cf. xxx) number of class according to the number
* of features in serie of values.
*
* @param {Integer} len_serie - The length of the serie of values.
* @return {Integer} - The "optimal" number of classes to be used to discretize the serie.
*/
export function getOptNbClass(len_serie) {
  return floor(1 + 3.3 * log10(len_serie));
}


/**
* Compute breaks according to "Q6" method
* and compute the number of item in each bin.
*
* @param {Array} serie - An array of ordered values.
* @param {Number} precision - An integer value decribing the precision of the serie.
* @return {Object} - Object containing the breaks and the stock in each class.
*/
export function getBreaksQ6(serie, precision = null) {
  const len_serie = serie.length;
  const q6_class = [
    1,
    0.05 * len_serie,
    0.275 * len_serie,
    0.5 * len_serie,
    0.725 * len_serie,
    0.95 * len_serie,
    len_serie,
  ];
  let breaks = [];
  let tmp = 0;
  let j;
  const stock_class = [];
  for (let i = 0; i < 7; ++i) {
    j = Mround(q6_class[i]) - 1;
    breaks.push(+serie[j]);
    stock_class.push(j - tmp);
    tmp = j;
  }
  stock_class.shift();
  if (breaks[0] === breaks[1]) {
      // breaks[1] = breaks[0] + (breaks[2] - breaks[1]) / 2;
    breaks[1] = (+serie[1] + breaks[0]) / 2;
  }
  if (breaks[6] === breaks[5]) {
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

/**
* Compute breaks according to our "mean and standard deviation" method
* and compute the number of item in each bin.
*
* @param {Array} serie - An array of ordered values.
* @param {Number} share - The ratio of stddev to be used a size for each class.
* @param {String} mean_position - The position of the mean value.
* @param {Number} precision - An integer value decribing the precision of the serie.
* @return {Object} - Object containing the breaks and the stock in each class.
*/
export function getBreaksStdDev(serie, share, mean_position = 'center', precision) {
  const min = serie.min(),
    max = serie.max(),
    mean = serie.mean(),
    std_dev = serie.stddev(),
    class_size = std_dev * share;
  const breaks = mean_position === 'center'
    ? [mean - (class_size / 2), mean + (class_size / 2)]
    : [mean - class_size, mean, mean + class_size];

  const _precision = precision || serie.precision;

  while (breaks[0] > min) {
    breaks.unshift(breaks[0] - class_size);
  }
  while (breaks[breaks.length - 1] < max) {
    breaks.push(breaks[breaks.length - 1] + class_size);
  }
  const nb_class = breaks.length - 1;
  if (breaks[0] < min) {
    if (breaks[1] < min) {
      console.log('This shouldn\'t happen (min)');
    }
    breaks[0] = min;
  }

  if (breaks[nb_class] > max) {
    if (breaks[nb_class - 1] > max) {
      console.log('This shouldn\'t happen (max)');
    }
    breaks[nb_class] = max;
  }
  return {
    nb_class,
    breaks: breaks.map(v => round_value(v, _precision)),
  };
}

function getBreaks(values, type, n_class) {
  // const _values = values.filter(v => v === 0 || (v && !Number.isNaN(+v))),
  const _values = values.filter(v => isNumber(v)),
    no_data = values.length - _values.length,
    nb_class = +n_class || getOptNbClass(_values.length);
  const serie = new geostats(_values);
  let breaks;
  if (type === 'Q6') {
    const tmp = getBreaksQ6(serie.sorted(), serie.precision);
    breaks = tmp.breaks;
    breaks[0] = serie.min();
    breaks[nb_class] = serie.max();
    serie.setClassManually(breaks);
  } else {
    const _func = discretiz_geostats_switch.get(type);
    breaks = serie[_func](nb_class);
    if (serie.precision) breaks = breaks.map(val => round_value(val, serie.precision));
  }
  return [serie, breaks, nb_class, no_data];
}

export function discretize_to_size(values, type, nb_class, min_size, max_size) {
  const [serie, breaks, n_class] = getBreaks(values, type, nb_class);
  const step = (max_size - min_size) / (n_class - 1),
    class_size = Array(n_class).fill(0).map((d, i) => min_size + (i * step)),
    breaks_prop = [];

  for (let i = 0; i < breaks.length - 1; ++i) {
    breaks_prop.push([[breaks[i], breaks[i + 1]], class_size[i]]);
  }
  return [n_class, type, breaks_prop, serie];
}

export const discretize_to_colors = function discretize_to_colors(values, type, nb_class, col_ramp_name) {
  const name_col_ramp = col_ramp_name || 'Reds';
  const [serie, breaks, n_class, nb_no_data] = getBreaks(values, type, nb_class),
    color_array = getColorBrewerArray(n_class, name_col_ramp),
    no_data_color = nb_no_data > 0 ? '#e7e7e7' : null,
    colors_map = [];
  for (let j = 0; j < values.length; ++j) {
    // if (values[j] === 0 || (values[j] !== null && values[j] !== '' && !Number.isNaN(+values[j]))) {
    if (isNumber(values[j])) {
      const idx = serie.getClass(values[j]);
      colors_map.push(color_array[idx]);
    } else {
      colors_map.push(no_data_color);
    }
  }
  return [n_class, type, breaks, color_array, colors_map, no_data_color];
};

/**
* Parse a string of comma separated break values
* to an actual Array of break values.
* The serie is used to defined if there may be negative values
* in the defined break values.
*
* @param {Array} serie - The serie of values to be discretised with `breaks_list`.
* @param {String} breaks_list - The user_defined break values as String.
* @return {Array} - The actual Array of break values.
*/
function parseUserDefinedBreaks(serie, breaks_list) {
  const separator = has_negative(serie) ? '- ' : '-';
  return breaks_list.split(separator).map(el => +el.trim());
}

/**
* Returns the break values and the stock of each class given
* a list of breaks defined by the user.
*
* @param {Array} serie - The serie of values to be discretised
* @param {Array} breaks - The list of breaks, whether as a String (a typed by the user)
*                    or as an Array.
* @return {Object} - An Object with the stock (number of feature) in each class
*                    and the break values (should be unchanged if provided as an Array)
*/
export function getBreaks_userDefined(serie, breaks) {
  const break_values = (typeof breaks === 'string')
    ? parseUserDefinedBreaks(serie, breaks)
    : breaks;
  const len_serie = serie.length,
    len_break_val = break_values.length,
    stock_class = new Array(len_break_val - 1);
  let j = 0;
  for (let i = 1; i < len_break_val; ++i) {
    const class_max = break_values[i];
    stock_class[i - 1] = 0;
    while (serie[j] <= class_max) {
      stock_class[i - 1] += 1;
      j += 1;
    }
  }
  return {
    breaks: break_values,
    stock_class,
  };
}
