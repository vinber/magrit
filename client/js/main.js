import './../css/style.css';
import { accordionize, add_sample_layer, add_simplified_land_layer, setUpInterface } from './interface';
import { xhrequest } from './helpers';
import { Mceil, Mround } from './helpers_math';
import { round_value } from './helpers_calc';
import { reproj_symbol_layer, rotate_global, zoom_without_redraw } from './map_ctrl';
import { available_projections } from './projections';

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

global.encodeId = function(s) {
  if (s === '') return 'L_';
  return `L_${s.replace(/[^a-zA-Z0-9_-]/g, match => `_${match[0].charCodeAt(0).toString(16)}_`)}`;
}

function bindTooltips() {
  tippy('.tt_menuleft', {
    appendTo: document.querySelector('.twbs'),
    arrow: true,
    duration: [1, 50],
    flip: false,
    onShow: function () {
      Array.prototype.slice.call(document.querySelectorAll('.tippy-popper')).forEach(popper => {
        const instance = popper._tippy

        if (instance.state.visible) {
          instance.popperInstance.disableEventListeners()
          instance.hide()
        }
      });
    },
    onShown: function () {
      const tr = getTransform(this);
      this.style.transform = `translate3d(${tr.translate.x + 360}px, ${tr.translate.y}px, 0)`;
    },
    placement: 'right',
  });

  tippy('.tt', {
    appendTo: document.querySelector('.twbs'),
    arrow: true,
    duration: [50, 50],
    flip: false,
  });

  tippy('.tt_func', {
    appendTo: document.querySelector('.twbs'),
    arrow: false,
    distance: 15,
    duration: [50, 50],
    flip: false,
    placement: 'top',
  });
}

function parseMatrix (matrixString) {
  var c = matrixString.split(/\s*[(),]\s*/).slice(1,-1),
      matrix;

  if (c.length === 6) {
    matrix = {
      m11: +c[0], m21: +c[2], m31: 0, m41: +c[4],
      m12: +c[1], m22: +c[3], m32: 0, m42: +c[5],
      m13: 0,     m23: 0,     m33: 1, m43: 0,
      m14: 0,     m24: 0,     m34: 0, m44: 1,
    };
  } else if (c.length === 16) {
    matrix = {
      m11: +c[0], m21: +c[4], m31: +c[8], m41: +c[12],
      m12: +c[1], m22: +c[5], m32: +c[9], m42: +c[13],
      m13: +c[2], m23: +c[6], m33: +c[10], m43: +c[14],
      m14: +c[3], m24: +c[7], m34: +c[11], m44: +c[15],
    };
  } else {
    // handle 'none' or invalid values.
    matrix = {
      m11: 1, m21: 0, m31: 0, m41: 0,
      m12: 0, m22: 1, m32: 0, m42: 0,
      m13: 0, m23: 0, m33: 1, m43: 0,
      m14: 0, m24: 0, m34: 0, m44: 1,
    };
  }
  return matrix;
}

function getTransform (elem) {
  var matrix = parseMatrix(getComputedStyle(elem, null).transform),
    rotateY = Math.asin(-matrix.m13),
    rotateX,
    rotateZ;

  if (Math.cos(rotateY) !== 0) {
    rotateX = Math.atan2(matrix.m23, matrix.m33);
    rotateZ = Math.atan2(matrix.m12, matrix.m11);
  } else {
    rotateX = Math.atan2(-matrix.m31, matrix.m22);
    rotateZ = 0;
  }
  return {
    rotate: { x: rotateX, y: rotateY, z: rotateZ },
    translate: { x: matrix.m41, y: matrix.m42, z: matrix.m43 },
  };
}


// function bindTooltips(dataAttr = 'tooltip-title') {
//     // bind the mains tooltips
//   const tooltips_elem = document.querySelectorAll(`[${dataAttr}]`);
//   for (let i = tooltips_elem.length - 1; i > -1; i--) {
//     new Tooltip(tooltips_elem[i], {
//       dataAttr: dataAttr,
//       animation: 'slideNfade',
//       duration: 25,
//       delay: 50,
//       container: document.getElementById('twbs'),
//     });
//   }
// }

function make_eye_button(state) {
  if (state === 'open') {
    const eye_open = document.createElement('img');
    eye_open.setAttribute('src', 'static/img/b/eye_open.png');
    eye_open.setAttribute('class', 'active_button i18n');
    eye_open.setAttribute('id', 'eye_open');
    eye_open.setAttribute('width', 17);
    eye_open.setAttribute('height', 17);
    eye_open.setAttribute('alt', 'Visible');
    return eye_open;
  } else if (state === 'closed') {
    const eye_closed = document.createElement('img');
    eye_closed.setAttribute('src', 'static/img/b/eye_closed.png');
    eye_closed.setAttribute('class', 'active_button i18n');
    eye_closed.setAttribute('id', 'eye_closed');
    eye_closed.setAttribute('width', 17);
    eye_closed.setAttribute('height', 17);
    eye_closed.setAttribute('alt', 'Not visible');
    return eye_closed;
  }
}

function change_lang() {
  const new_lang = this.name;
  if (new_lang !== i18next.language) {
    docCookies.setItem('user_lang', new_lang, 31536e3, '/');
    i18next.changeLanguage(new_lang, () => {
      localize('.i18n');
      bindTooltips();
    });
    document.getElementById('current_app_lang').innerHTML = new_lang;
    const menu = document.getElementById('menu_lang');
    if (menu) menu.remove();
  }
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
  to_cancel: undefined,
  targeted_layer_added: false,
  current_functionnality: undefined,
  layer_to_id: new Map([['World', encodeId('World')], ['Graticule', encodeId('Graticule')]]),
  id_to_layer: new Map([[encodeId('World'), 'World'], [encodeId('Graticule'), 'Graticule']]),
  version: document.querySelector('#header').getAttribute('v'),
  existing_lang: ['en', 'es', 'fr'],
  custom_palettes: new Map(),
};

// A bunch of references to the buttons used in the layer manager
// and some mapping to theses reference according to the type of geometry :
global.button_replace = ' <img src="static/img/replace_target_layer.png" id="replace_button" width="16" height="16" alt="replace_button"/>';
global.button_trash = ' <img src="static/img/Trash_font_awesome.png" id="trash_button" width="15" height="15" alt="trash_button"/>';
global.button_legend = ' <img src="static/img/qgis_legend.png" id="legend_button" width="17" height="17" alt="legend_button"/>';
global.button_zoom_fit = ' <img src="static/img/Inkscape_icons_zoom_fit_page.png" id="zoom_fit_button" width="16" height="16" alt="zoom_button"/></button>';
global.button_table = ' <img src="static/img/dataset.png" id="browse_data_button" width="16" height="16" alt="dataset_button"/></button>';
global.button_type = new Map([
    ['Point', '<img src="static/img/type_geom/dot.png" class="ico_type" width="17" height="17" alt="Point"/>'],
    ['Line', '<img src="static/img/type_geom/line.png" class="ico_type" width="17" height="17" alt="Line"/>'],
    ['Polygon', '<img src="static/img/type_geom/poly.png" class="ico_type" width="17" height="17" alt="Polygon"/>'],
  ]);

global.button_result_type = new Map([
  ['flow', '<img src="static/img/type_geom/layer_flow.png" class="ico_type" width="17" height="17" alt="flow"/>'],
  ['symbol', '<img src="static/img/type_geom/layer_symbol.png" class="ico_type" width="17" height="17" alt="symbol"/>'],
  ['grid', '<img src="static/img/type_geom/layer_grid.png" class="ico_type" width="17" height="17" alt="grid"/>'],
  ['propchoro', '<img src="static/img/type_geom/layer_propchoro.png" class="ico_type" width="17" height="17" alt="propchoro"/>'],
  ['typo', '<img src="static/img/type_geom/layer_typo.png" class="ico_type" width="17" height="17" alt="typo"/>'],
  ['discont', '<img src="static/img/type_geom/layer_disc.png" class="ico_type" width="17" height="17" alt="discont"/>'],
  ['cartogram', '<img src="static/img/type_geom/layer_cartogram.png" class="ico_type" width="17" height="17" alt="cartogram"/>'],
  ['label', '<img src="static/img/type_geom/layer_label.png" class="ico_type" width="17" height="17" alt="label"/>'],
  ['choro', '<img src="static/img/type_geom/layer_choro.png" class="ico_type" width="17" height="17" alt="choro"/>'],
  ['smooth', '<img src="static/img/type_geom/layer_smooth.png" class="ico_type" width="17" height="17" alt="smooth"/>'],
  ['prop', '<img src="static/img/type_geom/layer_prop.png" class="ico_type" width="17" height="17" alt="prop"/>'],
  ['waffle', '<img src="static/img/type_geom/layer_waffle.png" class="ico_type" width="17" height="17" alt="waffle"/>'],
]);

global.eye_open0 = '<img src="static/img/b/eye_open.png" class="active_button" id="eye_open"  width="17" height="17" alt="Visible"/>';

// Reference to the sys run button already in two requested sizes are they are called many times :
global.sys_run_button = '<img src="static/img/High-contrast-system-run.png" width="22" height="22" style="vertical-align: inherit;" alt="submit"/>';
global.sys_run_button_t2 = '<img src="static/img/High-contrast-system-run.png" class="style_target_layer" width="18" height="18" alt="Layer_rendering" style="float:right;"/>';

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

// Change color of the background
// (ie the parent "svg" element on the top of which group of elements have been added)
function handle_bg_color(color) {
  map.style('background-color', color);
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
