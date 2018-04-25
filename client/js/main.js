import './../css/style.css';
import i18next from 'i18next';
import i18nextXHRBackend from 'i18next-xhr-backend';
import locI18next from 'loc-i18next';
import { accordionize, add_sample_layer, add_simplified_land_layer, setUpInterface } from './interface';
import { xhrequest } from './helpers';
import { Mceil, Mround } from './helpers_math';
import { round_value } from './helpers_calc';
import { reproj_symbol_layer, rotate_global, zoom_without_redraw } from './map_ctrl';
import { available_projections } from './projections';
import { bindTooltips } from './tooltips';

Promise.config({
    warnings: true,
    longStackTraces: true,
});


// /*
// * Memoization functions (naive LRU implementation)
// *
// */
// global.Function.prototype.memoized = function (max_size = 25) {
//   this._memo = this._memo || { values: new Map(), stack: [], max_size: max_size };
//   const key = JSON.stringify(Array.prototype.slice.call(arguments));
//   let cache_value = this._memo.values.get(key);
//   if (cache_value !== undefined) {
//     return JSON.parse(cache_value);
//   }
//   cache_value = this.apply(this, arguments);
//   this._memo.values.set(key, JSON.stringify(cache_value));
//   this._memo.stack.push(key);
//   if (this._memo.stack.length >= this._memo.max_size) {
//     const old_key = this._memo.stack.shift();
//     this._memo.values.delete(old_key);
//   }
//   return cache_value;
// };
//
// global.Function.prototype.memoize = function () {
//   const fn = this;
//   return function () {
//     return fn.memoized.apply(fn, arguments);
//   };
// };
global.i18next = i18next;

global.encodeId = function(s) {
  if (s === '') return 'L_';
  return `L_${s.replace(/[^a-zA-Z0-9_-]/g, match => `_${match[0].charCodeAt(0).toString(16)}_`)}`;
}

global.proj = d3.geoNaturalEarth2().scale(1).translate([0, 0]);
global.path = d3.geoPath().projection(proj).pointRadius(4);
global.t = proj.translate();
global.s = proj.scale();
global.current_proj_name = 'NaturalEarth2';
global.zoom = d3.zoom().on('zoom', zoom_without_redraw);
global.w = Mround(window.innerWidth - 361);
global.h = window.innerHeight - 55;
/*
A bunch of global variable, storing oftently reused informations :
    - user_data[layer_name] : will be an Array of Objects containing data for each features of the targeted layer
            (+ the joined features if a join is done)
    - result_data[layer_name] : the same but for any eventual result layers (like Stewart, gridded, etc.)
    - joined_dataset : the joined dataset (read with d3.csv then pushed in the first slot of this array)
    - field_join_map : an array containg mapping between index of geom layer and index of ext. dataset
    - current_layers : the main object describing **all** the layers on the map (incunding detailed (ie. by features) styling properties if needed)
*/

global.user_data = {};
global.result_data = {};
global.joined_dataset = [];
global.field_join_map = [];
global.current_layers = {};
global.dataset_name = null;
global.canvas_rotation_value = null;
global.map_div = d3.select('#map');

global.pos_lgds_elem = new Map();

// The 'map':
// (so actually the `map` variable is a reference to the main `svg` element on which we are drawing)
global.map = map_div.styles({ width: `${w}px`, height: `${h}px` })
  .append('svg')
  .attrs({ id: 'svg_map', width: w, height: h })
  .styles({ position: 'absolute', 'background-color': 'rgba(255, 255, 255, 0)' })
  .on('contextmenu', (event) => { d3.event.preventDefault(); })
  .call(zoom);

global.svg_map = map.node();
global.defs = map.append('defs');

global._app = {
  current_functionnality: undefined,
  custom_palettes: new Map(),
  existing_lang: ['en', 'es', 'fr'],
  layer_to_id: new Map([['World', encodeId('World')], ['Graticule', encodeId('Graticule')]]),
  legendRedrawTimeout: null,
  id_to_layer: new Map([[encodeId('World'), 'World'], [encodeId('Graticule'), 'Graticule']]),
  targeted_layer_added: false,
  to_cancel: undefined,
  version: document.querySelector('#header').getAttribute('v'),
};

// Shortcut to the name of the methods offered by geostats library:
global.discretiz_geostats_switch = new Map([
  ['jenks', 'getJenks'],
  ['equal_interval', 'getEqInterval'],
  // ['std_dev', 'getStdDeviation'],
  ['quantiles', 'getQuantile'],
  ['Q6', 'getBreaksQ6'],
  ['geometric_progression', 'getGeometricProgression'],
]);

// Reference to the available fonts that the user could select :
global.available_fonts = [
  ['Arial', 'Arial,sans-serif'],
  ['Arial Black', 'Arial Black,sans-serif'],
  ['Arimo', 'Arimo,sans-serif'],
  ['Baloo Bhaina', 'Baloo Bhaina,sans-serif'],
  ['Bitter', 'Bitter,sans-serif'],
  ['Dosis', 'Dosis,sans-serif'],
  ['Impact', 'Impact,Charcoal,sans-serif'],
  ['Inconsolata', 'Inconsolata,sans-serif'],
  ['Georgia', 'Georgia,serif'],
  ['Lobster', 'Lobster,serif'],
  ['Lucida', 'Lucida Sans Unicode,Lucida Grande,sans-serif'],
  ['Palatino', 'Palatino Linotype,Book Antiqua,Palatino,serif'],
  ['Roboto', 'Roboto'],
  ['Scope One', 'Scope One'],
  ['Tahoma', 'Tahoma,Geneva,sans-serif'],
  ['Trebuchet MS', 'Trebuchet MS,elvetica,sans-serif'],
  ['Verdana', 'verdana'],
];

// This variable have to be (well, we could easily do this in an other way!) up to date
// with the style-fonts.css file as we are using their order to lookup for their definition
// the .css file.
global.customs_fonts = ['Arimo', 'Baloo Bhaina', 'Bitter', 'Dosis', 'Inconsolata', 'Lobster', 'Roboto', 'Scope One'];

function parseQuery(search) {
  const args = search.substring(1).split('&');
  const argsParsed = {};
  let arg,
    kvp,
    key,
    value;
  for (let i = 0; i < args.length; i++) {
    arg = args[i];
    if (arg.indexOf('=') === -1) {
      argsParsed[decodeURIComponent(arg).trim()] = true;
    } else {
      kvp = arg.split('=');
      key = decodeURIComponent(kvp[0]).trim();
      value = decodeURIComponent(kvp[1]).trim();
      argsParsed[key] = decodeURIComponent(kvp[1]).trim();
    }
  }
  return argsParsed;
}

(function () {
  let lang = docCookies.getItem('user_lang') || window.navigator.language.split('-')[0];
  const params = {};
  document.querySelector('noscript').remove();
  window.isIE = (() => (/MSIE/i.test(navigator.userAgent)
    || /Trident\/\d./i.test(navigator.userAgent)
    || /Edge\/\d./i.test(navigator.userAgent))
  )();
  // window.isOldMS_Firefox = (() => (/Firefox/i.test(navigator.userAgent)
  //   && (/Windows NT 6.0/i.test(navigator.userAgent)
  //       || /Windows NT 6.1/i.test(navigator.userAgent))) ? true : false
  // )();
  if (window.location.search) {
    const parsed_querystring = parseQuery(window.location.search);
    params.reload = parsed_querystring.reload;
    if (typeof (history.replaceState) !== 'undefined') {
      // replaceState should avoid creating a new entry on the history
      const obj = { Page: window.location.search, Url: window.location.pathname };
      history.replaceState(obj, obj.Page, obj.Url);
    }
  }

  lang = global._app.existing_lang.indexOf(lang) > -1 ? lang : 'en';
  i18next.use(i18nextXHRBackend)
    .init({
      debug: true,
      lng: lang,
      fallbackLng: global._app.existing_lang[0],
      backend: {
        loadPath: 'static/locales/{{lng}}/translation.json',
      },
    }, (err, tr) => {
      if (err) {
        throw err;
      } else {
        window.localize = locI18next.init(i18next);
        getEpsgProjection().then((data) => {
          global._app.epsg_projections = JSON.parse(data);
          setUpInterface(params.reload);
          localize('.i18n');
          bindTooltips();
        });
      }
    });
})();


function getEpsgProjection() {
  return xhrequest('GET', 'static/json/epsg.json', undefined, false);
}

/**
* Return the x and y position where the svg element is located
* in the browser window.
*
* @return {Object} - An object with x and y properties.
*/
global.get_map_xy0 = () => {
  const bbox = svg_map.getBoundingClientRect();
  return { x: bbox.left, y: bbox.top };
}

global.helper_esc_key_twbs_cb = function helper_esc_key_twbs_cb(_event, callback) {
  const evt = _event || window.event;
  const isEscape = ('key' in evt) ? (evt.key === 'Escape' || evt.key === 'Esc') : (evt.keyCode === 27);
  if (isEscape) {
    evt.stopPropagation();
    if (callback) {
      callback();
    }
  }
};
