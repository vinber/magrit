import alertify from 'alertifyjs';
import jschardet from 'jschardet';
import ContextMenu from './context-menu';
import { ColorsSelected, rgb2hex } from './colors_helpers';
import { check_remove_existing_box, make_confirm_dialog2 } from './dialogs';
import { available_fonts } from './fonts';
import { check_layer_name, clean_menu_function, get_menu_option, reset_user_values } from './function';
import {
  create_li_layer_elem, createWaitingOverlay, display_error_during_computation,
  drag_elem_geo, getAvailablesFunctionnalities, get_display_name_on_layer_list,
  isValidJSON, make_box_type_fields,
  prepareFileExt, request_data, setSelected, type_col2, xhrequest
} from './helpers';
import { get_nb_decimals, round_value } from './helpers_calc';
import { Mmax, Mround } from './helpers_math';
import { valid_join_check_display } from './join_popup';
import { handle_click_layer } from './layers_style_popup';
import { handle_legend, move_legends } from './legend';
import { reproj_symbol_layer, rotate_global, zoom, zoomClick, zoom_without_redraw } from './map_ctrl';
import { export_compo_png, export_compo_svg, export_layer_geo } from './map_export';
import { apply_user_preferences, get_map_template, load_map_template, save_map_template } from './map_project';
import {
  addLastProjectionSelect, change_projection, change_projection_4,
  handleClipPath, handle_projection_select, shortListContent,
  tryFindNameProj } from './projections';
import { world_topology } from './sample_topo';
import { boxExplore2 } from './tables';
import { bindTooltips } from './tooltips';
import { handleZoomRect } from './zoom_rect';
import { add_layout_feature } from './layout_features/helpers';
import { button_legend, button_replace, button_result_type, button_table, button_trash, button_type, button_zoom_fit, eye_open0, sys_run_button, sys_run_button_t2 } from './ui/buttons';

/**
* Maxium allowed input size in bytes. If the input file is larger than
* this size, the user will receive an alert.
* In the case of sending multiple files unziped, this limit corresponds
* to the sum of the size of each file.
*/
const MAX_INPUT_SIZE = 27300000;


/**
* Function setting-up main elements of the interface
*
* Some of the variables created here are put in global/window scope
* as they are gonna be frequently used
*
*/
export function setUpInterface(reload_project) {
  // Create the waiting overlay to be ready to be displayed when needed:
  global._app.waitingOverlay = createWaitingOverlay();
  // Only ask for confirmation before leaving page if things have been done
  // (layer added, etc..)
  window.addEventListener('beforeunload', beforeUnloadWindow);

  // Remove some layers from the server when user leave the page
  // (ie. result layers are removed but targeted layer and layout layers stay
  // in cache as they have more chance to be added again)
  window.addEventListener('unload', () => {
    const layer_names = Object.getOwnPropertyNames(data_manager.current_layers).filter((name) => {
      if (!(data_manager.current_layers[name].hasOwnProperty('key_name'))) {
        return 0;
      } else if (data_manager.current_layers[name].targeted) {
        return 0;
      } else if (data_manager.current_layers[name].renderer
            && (data_manager.current_layers[name].renderer.indexOf('PropSymbols') > -1
              || data_manager.current_layers[name].renderer.indexOf('Dorling') > -1
              || data_manager.current_layers[name].renderer.indexOf('Choropleth') > -1
              || data_manager.current_layers[name].renderer.indexOf('Categorical') > -1)) {
        return 0;
      }
      return 1;
    });
    if (layer_names.length) {
      const formToSend = new FormData();
      layer_names.forEach((name) => {
        formToSend.append('layer_name', data_manager.current_layers[name].key_name);
      });
      navigator.sendBeacon('/layers/delete', formToSend);
    }
  }, false);

  const bg_drop = document.createElement('div');
  bg_drop.className = 'overlay_drop';
  bg_drop.id = 'overlay_drop';
  bg_drop.style.background = 'black';
  bg_drop.style.opacity = '0.6';
  bg_drop.style.display = 'none';
  bg_drop.style.padding = '10px';
  const inner_div = document.createElement('div');
  inner_div.style.border = 'dashed 2px white';
  inner_div.style.margin = '10px';
  inner_div.style.background = 'rgba(0, 0, 0, 0.33)';
  inner_div.style.borderRadius = '1%';
  inner_div.className = 'overlay_drop';
  const inner_p = document.createElement('p');
  inner_p.className = 'i18n';
  inner_p.style.position = 'fixed';
  inner_p.style.top = '50%';
  inner_p.style.left = '50%';
  inner_p.style.transform = 'translateX(-50%)translateY(-50%)';
  inner_p.style.fontSize = '14px';
  inner_p.style.width = 'auto';
  inner_p.style.bottom = '0px';
  inner_p.style.opacity = '0.85';
  inner_p.style.textAlign = 'center';
  inner_p.style.color = 'white';
  inner_p.style.padding = '0.5em';
  inner_p.setAttribute('data-i18n', '[html]app_page.common.drop_msg');
  inner_p.innerHTML = _tr('app_page.common.drop_msg');
  inner_div.appendChild(inner_p);
  bg_drop.appendChild(inner_div);
  document.body.appendChild(bg_drop);

  const proj_options = d3.select('.header_options_projection')
    .append('div')
    .attr('id', 'const_options_projection')
    .style('display', 'inline-flex');

  const proj_select2 = proj_options.append('div')
    .attrs({ class: 'styled-select' })
    .insert('select')
    .attrs({ class: 'i18n', id: 'form_projection2' })
    .styles({ width: 'calc(100% + 20px)' })
    .on('change', handle_projection_select);

  for (let i = 0; i < shortListContent.length; i++) {
    const option = shortListContent[i];
    proj_select2.append('option')
      .attrs({ class: 'i18n', value: option, 'data-i18n': `app_page.projection_name.${option}` })
      .text(_tr(`app_page.projection_name.${option}`));
  }
  proj_select2.node().value = 'NaturalEarth2';

  const const_options = d3.select('.header_options_right')
    .append('div')
    .attr('id', 'const_options')
    .style('display', 'inline');

  const_options.append('button')
    .attrs({ class: 'const_buttons i18n tt', id: 'new_project', 'data-i18n': '[title]app_page.tooltips.new_project', 'data-tippy-placement': 'bottom' })
    .styles({ cursor: 'pointer', background: 'transparent', 'margin-top': '5px' })
    .html('<img src="static/img/header/File_font_awesome_white.png" width="25" height="auto" alt="Load project file"/>')
    .on('click', () => {
      window.localStorage.removeItem('magrit_project');
      window.removeEventListener('beforeunload', beforeUnloadWindow);
      location.reload();
    });

  const_options.append('button')
    .attrs({ class: 'const_buttons i18n tt', id: 'load_project', 'data-i18n': '[title]app_page.tooltips.load_project_file', 'data-tippy-placement': 'bottom' })
    .styles({ cursor: 'pointer', background: 'transparent', 'margin-top': '5px' })
    .html('<img src="static/img/header/Folder_open_alt_font_awesome_white.png" width="25" height="auto" alt="Load project file"/>')
    .on('click', load_map_template);

  const_options.append('button')
    .attrs({ class: 'const_buttons i18n tt', id: 'save_file_button', 'data-i18n': '[title]app_page.tooltips.save_file', 'data-tippy-placement': 'bottom' })
    .styles({ cursor: 'pointer', background: 'transparent', margin: 'auto' })
    .html('<img src="static/img/header/Breezeicons-actions-22-document-save-white.png" width="25" height="auto" alt="Save project to disk"/>')
    .on('click', save_map_template);

  const_options.append('button')
    .attrs({ class: 'const_buttons i18n tt', id: 'documentation_link', 'data-i18n': '[title]app_page.tooltips.documentation', 'data-tippy-placement': 'bottom' })
    .styles({ cursor: 'pointer', background: 'transparent', 'margin-top': '5px' })
    .html('<img src="static/img/header/Documents_icon_-_noun_project_5020_white.png" width="20" height="auto" alt="Documentation"/>')
    .on('click', () => {
      window.open('static/book/index.html', 'DocWindow', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
    });

  const_options.append('button')
    .attrs({
      id: 'help_btn',
      class: 'const_buttons i18n tt',
      'data-i18n': '[title]app_page.help_box.tooltip_btn',
      'data-tippy-placement': 'bottom',
    })
    .styles({ cursor: 'pointer', background: 'transparent' })
    .html('<img src="static/img/header/High-contrast-help-browser_white.png" width="20" height="20" alt="export_load_preferences" style="margin-bottom:3px;"/>')
    .on('click', () => {
      if (document.getElementById('menu_lang')) document.getElementById('menu_lang').remove();
      const click_func = (window_name, target_url) => {
        window.open(target_url, window_name, 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
      };
      const box_content = '<div class="about_content">' +
        '<p style="font-size: 0.8em; margin-bottom:auto;"><span>' +
        _tr('app_page.help_box.version', { version: global._app.version }) + '</span></p>' +
        '<p><b>' + _tr('app_page.help_box.useful_links') + '</b></p>' +
        '<p><button class="swal2-styled swal2_blue btn_doc">' +
        _tr('app_page.help_box.carnet_hypotheses') + '</button></p>' +
        '<p><button class="swal2-styled swal2_blue btn_contact">' +
        _tr('app_page.help_box.contact') + '</button></p>' +
        '<p><button class="swal2-styled swal2_blue btn_gh">' +
        _tr('app_page.help_box.gh_link') + '</button></p>' +
        '<p style="font-size: 0.8em; margin:auto;"><span>' +
        _tr('app_page.help_box.credits') + '</span></p></div>';
      swal({
        title: _tr('app_page.help_box.title'),
        html: box_content,
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: _tr('app_page.common.close'),
        animation: 'slide-from-top',
        onOpen: () => {
          const content = document.getElementsByClassName('about_content')[0];
          const credit_link = content.querySelector('#credit_link');
          credit_link.style.fontWeight = 'bold';
          credit_link.style.cursor = 'pointer';
          credit_link.color = '#000';
          credit_link.onclick = () => {
            window.open('http://riate.cnrs.fr', 'RiatePage', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
          };
          content.querySelector('.btn_doc').onclick = () => {
            window.open('http://magrit.hypotheses.org/', 'Carnet hypotheses', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
          };
          content.querySelector('.btn_contact').onclick = () => {
            window.open('/contact', 'ContactWindow', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
          };
          content.querySelector('.btn_gh').onclick = () => {
            window.open('https://www.github.com/riatelab/magrit', 'GitHubPage', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
          };
        },
      }).then(inputValue => null,
        dismissValue => null);
    });

  const_options.append('button')
    .attrs({ id: 'current_app_lang', class: 'const_buttons' })
    .styles({
      color: 'white',
      cursor: 'pointer',
      'font-size': '14px',
      'vertical-align': 'super',
      background: 'transparent',
      'font-weight': 'bold'
    })
    .html(i18next.language)
    .on('click', () => {
      if (document.getElementById('menu_lang')) {
        document.getElementById('menu_lang').remove();
      } else {
        const current_lang = i18next.language;
        const other_langs = current_lang === 'en' ? ['es', 'fr'] : current_lang === 'fr' ? ['en', 'es'] : ['en', 'fr'];
        const actions = [
          { name: current_lang, callback: change_lang },
          { name: other_langs[0], callback: change_lang },
          { name: other_langs[1], callback: change_lang },
        ];
        const menu = document.createElement('div');
        menu.style.top = '40px';
        menu.style.right = '0px';
        menu.className = 'context-menu';
        menu.id = 'menu_lang';
        menu.style.minWidth = '30px';
        menu.style.width = '50px';
        menu.style.background = '#000';
        const list_elems = document.createElement('ul');
        menu.appendChild(list_elems);
        for (let i = 0; i < actions.length; i++) {
          const item = document.createElement('li'),
            name = document.createElement('span');
          list_elems.appendChild(item);
          item.setAttribute('data-index', i);
          item.style.textAlign = 'right';
          item.style.paddingRight = '16px';
          name.className = 'context-menu-item-name';
          name.style.color = 'white';
          name.textContent = actions[i].name;
          item.appendChild(name);
          item.onclick = () => {
            actions[i].callback();
            menu.remove();
          };
        }
        document.querySelector('body').appendChild(menu);
      }
    });

  const menu = d3.select('#menu'),
    b_accordion1 = menu.append('button').attr('id', 'btn_s1').attr('class', 'accordion i18n').attr('data-i18n', 'app_page.section1.title'),
    accordion1 = menu.append('div').attr('class', 'panel').attr('id', 'accordion1'),
    b_accordion2_pre = menu.append('button').attr('id', 'btn_s2').attr('class', 'accordion i18n').attr('data-i18n', 'app_page.section2.title'),
    accordion2_pre = menu.append('div').attr('class', 'panel').attr('id', 'accordion2_pre'),
    b_accordion2 = menu.append('button').attr('id', 'btn_s2b').attr('class', 'accordion i18n').style('display', 'none'),
    accordion2 = menu.append('div').attr('class', 'panel').attr('id', 'accordion2b').style('display', 'none'),
    b_accordion3 = menu.append('button').attr('id', 'btn_s3').attr('class', 'accordion i18n').attr('data-i18n', 'app_page.section3.title'),
    accordion3 = menu.append('div').attr('class', 'panel').attr('id', 'accordion3'),
    b_accordion4 = menu.append('button').attr('id', 'btn_s4').attr('class', 'accordion i18n').attr('data-i18n', 'app_page.section4.title'),
    accordion4 = menu.append('div').attr('class', 'panel').attr('id', 'accordion4'),
    b_accordion5 = menu.append('button').attr('id', 'btn_s5').attr('class', 'accordion i18n').attr('data-i18n', 'app_page.section5b.title'),
    accordion5 = menu.append('div').attr('class', 'panel').attr('id', 'accordion5b');

  const section1 = accordion1.append('div')
    .attrs({
      id: 'section1',
      class: 'i18n tt_menuleft',
      'data-i18n': '[title]app_page.tooltips.section1',
      'data-tippy-placement': 'right',
    });
  window.section2_pre = accordion2_pre.append('div').attr('id', 'section2_pre');
  window.section2 = accordion2.append('div').attr('id', 'section2');
  accordion3.append('div').attr('id', 'section3');
  accordion4.append('div').attr('id', 'section4');
  accordion5.append('div').attr('id', 'section5');

  const dv1 = section1.append('div');
  const section_current_target_layer = dv1.append('div')
    .attr('id', 'target_layer_zone')
    .styles({
      'text-align': 'center',
      'margin-bottom': '3px',
      border: '3px dashed #ccc',
      padding: '3px',
      color: '#ccc'
    })
    .html('Pas de couche cible');

  const section_current_dataset = dv1.append('div')
    .attr('id', 'ext_dataset_zone')
    .styles({
      'text-align': 'center',
      'margin-bottom': '3px',
      border: '3px dashed #ccc',
      padding: '3px',
      color: '#ccc',
    })
    .html('Pas de jeu de donnée externe');

  dv1.append('p')
    .attr('id', 'join_section')
    .styles({ 'text-align': 'center', 'margin-top': '2px' })
    .html('');

  dv1.append('hr').style('border-top', '2px #ccc');

  const dv11 = dv1.append('div').style('width', 'auto');

  dv11.append('img')
    .attrs({ id: 'img_in_geom', class: 'user_panel', src: 'static/img/b/addgeom.png', width: '25', height: '25', alt: 'Geometry layer' })
    .style('cursor', 'pointer')
    .on('click', click_button_add_layer);

  dv11.append('p')
    .attrs({ id: 'input_geom', class: 'user_panel i18n' })
    .styles({ display: 'inline', cursor: 'pointer', 'margin-left': '4px', 'vertical-align': 'super', 'font-weight': 'bold' })
    .attr('data-i18n', '[html]app_page.section1.add_geom')
    .on('click', click_button_add_layer);

  const dv12 = dv1.append('div');
  dv12.append('img')
    .attrs({ id: 'img_data_ext', class: 'user_panel', src: 'static/img/b/addtabular.png', width: '25', height: '25', alt: 'Additional dataset' })
    .style('cursor', 'pointer')
    .on('click', click_button_add_layer);

  dv12.append('p')
    .attrs({ id: 'data_ext', class: 'user_panel i18n', 'data-i18n': '[html]app_page.section1.add_ext_dataset' })
    .styles({ display: 'inline', cursor: 'pointer', 'margin-left': '4px', 'vertical-align': 'super', 'font-weight': 'bold' })
    .on('click', click_button_add_layer);

  const div_sample = dv1.append('div').attr('id', 'sample_zone');
  div_sample.append('img')
    .attrs({ id: 'sample_button', class: 'user_panel', src: 'static/img/b/addsample.png', width: '25', height: '25', alt: 'Sample layers' })
    .style('cursor', 'pointer')
    .on('click', add_sample_layer);

  div_sample.append('span')
    .attrs({ id: 'sample_link', class: 'user_panel i18n' })
    .styles({ display: 'inline', cursor: 'pointer', 'margin-left': '4px', 'vertical-align': 'super', 'font-weight': 'bold' })
    .attr('data-i18n', '[html]app_page.section1.add_sample_data')
    .on('click', add_sample_layer);

  dv1.append('p')
    .styles({ 'text-align': 'center', margin: '5px' })
    .insert('button')
    .attrs({
      id: 'btn_type_fields',
      class: 'i18n',
      'data-i18n': '[html]app_page.box_type_fields.title',
      disabled: true,
    })
    .styles({
      cursor: 'pointer',
      'border-radius': '4px',
      border: '1px solid lightgrey',
      padding: '3.5px',
    })
    .html(_tr('app_page.box_type_fields.title'))
    .on('click', () => {
      const layer_name = Object.getOwnPropertyNames(data_manager.user_data)[0];
      make_box_type_fields(layer_name);
    });

  make_ico_choice();

  const section3 = d3.select('#section3');

  window.layer_list = section3.append('div')
    .append('ul')
    .attrs({ id: 'sortable', class: 'layer_list' });

  new Sortable(document.getElementById('sortable'), {
    animation: 100,
    onUpdate: function (a) {
      // Set the layer order on the map in concordance with the user changes
      // in the layer manager with a pretty rusty 'sorting' algorythm :
      const desired_order = [],
        actual_order = [],
        layers = svg_map.querySelectorAll('.layer');
      let at_end = null;
      if (document.getElementById('info_features').className === 'active') {
        displayInfoOnMove();
        at_end = true;
      }

      for (let i = 0, len_i = a.target.childNodes.length; i < len_i; i++) {
        const n = a.target.childNodes[i].getAttribute('layer_name');
        desired_order[i] = global._app.layer_to_id.get(n);
        actual_order[i] = layers[i].id;
      }
      for (let i = 0, len = desired_order.length; i < len; i++) {
        const lyr1 = document.getElementById(desired_order[i]),
          lyr2 = document.getElementById(desired_order[i + 1]) || document.getElementById(desired_order[i]);
        svg_map.insertBefore(lyr2, lyr1);
      }
      if (at_end) displayInfoOnMove();
    },
    onStart: (event) => {
      document.body.classList.add('no-drop');
    },
    onEnd: (event) => {
      document.body.classList.remove('no-drop');
    },
  });

  const section4 = d3.select('#section4');
  const dv4 = section4.append('div')
    .style('margin', 'auto')
    .append('ul')
    .styles({
      display: 'inline-block',
      'list-style': 'outside none none',
      'margin-top': '0px',
      padding: '0px',
      width: '100%',
    });

  const e = dv4.append('li')
    .styles({
      margin: '1px',
      padding: '4px',
      'text-align': 'center',
    });

  e.append('input')
    .attrs({
      id: 'title',
      class: 'list_elem_section4 i18n',
      placeholder: '',
      'data-i18n': '[placeholder]app_page.section4.map_title',
    })
    .styles({ margin: '0px 0px 0px 3px', width: '160px' })
    .on('keyup', function () { handle_title(this.value); });

  e.append('span')
    .styles({ display: 'inline', top: '4px', cursor: 'pointer', 'vertical-align': 'sub' })
    .html(sys_run_button.replace('submit', 'Title properties'))
    .on('click', handle_title_properties);

  const f = dv4.append('li').styles({ margin: '1px', padding: '4px' });
  f.append('input')
    .styles({ position: 'absolute', right: '20px', width: '60px', 'margin-left': '15px' })
    .attrs({ type: 'color', id: 'bg_color', class: 'list_elem_section4 m_elem_right' })
    .property('value', '#ffffff')
    .on('change', function () { handle_bg_color(this.value); });
  f.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.background_color',
    });

  const a1 = dv4.append('li').styles({ margin: '1px', padding: '4px' });
  a1.append('input')
    .attrs({ id: 'input-width', type: 'number', class: 'list_elem_section4 m_elem_right' })
    .property('value', w)
    .on('change', function () {
      const new_width = +this.value;
      if (new_width === 0 || isNaN(new_width)) {
        this.value = w;
        return;
      }
      const ratio_type = document.getElementById('map_ratio_select').value;
      if (ratio_type === 'portrait') {
        h = round_value(new_width / 0.70707, 0);
        canvas_mod_size([new_width, h]);
      } else if (ratio_type === 'landscape') {
        h = round_value(new_width * 0.70707, 0);
        canvas_mod_size([new_width, h]);
      } else {
        canvas_mod_size([new_width, null]);
      }
    });
  a1.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.map_width',
    });

  const a2 = dv4.append('li').styles({ margin: '1px', padding: '4px' });
  a2.append('input')
    .attrs({ id: 'input-height', type: 'number', class: 'm_elem_right list_elem_section4' })
    .property('value', h)
    .on('change', function () {
      const new_height = +this.value;
      if (new_height === 0 || isNaN(new_height)) {
        this.value = h;
        return;
      }
      const ratio_type = document.getElementById('map_ratio_select').value;
      if (ratio_type === 'portrait') {
        w = round_value(new_height * 0.70707, 0);
        canvas_mod_size([w, new_height]);
      } else if (ratio_type === 'landscape') {
        w = round_value(new_height / 0.70707, 0);
        canvas_mod_size([w, new_height]);
      } else {
        canvas_mod_size([null, new_height]);
      }
    });
  a2.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.map_height',
    });

  const b = dv4.append('li').styles({ margin: '1px', padding: '4px 0' });
  const ratio_select = b.append('select')
    .attrs({ class: 'list_elem_section4 i18n m_elem_right', id: 'map_ratio_select' });
  b.append('p').attr('class', 'list_elem_section4 i18n')
    .style('padding', '4px')
    .attr('data-i18n', '[html]app_page.section4.map_ratio');
  ratio_select.append('option').text('').attr('data-i18n', '[html]app_page.section4.ratio_user').attr('value', 'ratio_user');
  ratio_select.append('option').text('').attr('data-i18n', '[html]app_page.section4.ratio_landscape').attr('value', 'landscape');
  ratio_select.append('option').text('').attr('data-i18n', '[html]app_page.section4.ratio_portait').attr('value', 'portrait');
  ratio_select.on('change', function () {
    const map_xy = get_map_xy0();
    const dispo_w = document.innerWidth - map_xy.x - 1;
    const dispo_h = document.innerHeight - map_xy.y - 1;
    const diff_w = dispo_w - w;
    const diff_h = dispo_h - h;
    if (this.value === 'portrait') {
      if (round_value(w / h, 1) === 1.4) {
        const tmp = h;
        h = w;
        w = tmp;
      } else if (diff_h >= diff_w) {
        w = round_value(h * 0.70707, 0);
      } else {
        h = round_value(w / 0.70707, 0);
      }
    } else if (this.value === 'landscape') {
      if (round_value(h / w, 1) === 1.4) {
        const tmp = h;
        h = w;
        w = tmp;
      } else if (diff_h <= diff_w) {
        w = round_value(h / 0.70707, 0);
      } else {
        h = round_value(w * 0.70707, 0);
      }
    }
    canvas_mod_size([w, h]);
    fill_export_png_options(this.value);
  });
  const zoom_prop = svg_map.__zoom;

  const d2 = dv4.append('li').styles({ margin: '1px', padding: '4px' });
  d2.append('button')
    .styles({ margin: 0, padding: 0 })
    .attrs({
      id: 'resize_fit',
      class: 'm_elem_right list_elem_section4 button_st4 i18n',
      'data-i18n': '[html]app_page.common.ok',
    })
    .on('click', () => {
      document.getElementById('btn_s4').click();
      window.scrollTo(0, 0);
      w = Mround(window.innerWidth - 361);
      h = window.innerHeight - 55;
      canvas_mod_size([w, h]);
      document.getElementById('map_ratio_select').value = 'ratio_user';
    });
  d2.append('p').attr('class', 'list_elem_section4 i18n')
    .attr('data-i18n', '[html]app_page.section4.resize_fit');

  const c = dv4.append('li').styles({ margin: '1px', padding: '4px' });
  c.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.map_center_menu',
    })
    .style('cursor', 'pointer');
  c.append('span')
    .attr('id', 'map_center_menu_ico')
    .styles({ display: 'inline-table', cursor: 'pointer' });
  c.on('click', () => {
    const sections = document.getElementsByClassName('to_hide');
    let arg;
    if (sections[0].style.display === 'none') {
      arg = '';
      document.getElementById('map_center_menu_ico').classList.add('active');
    } else {
      arg = 'none';
      document.getElementById('map_center_menu_ico').classList.remove('active');
    }
    sections[0].style.display = arg;
    sections[1].style.display = arg;
    sections[2].style.display = arg;
    sections[3].style.display = arg;
  });

  const c1 = dv4.append('li').style('display', 'none').attr('class', 'to_hide');
  c1.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.map_center_x',
    });
  c1.append('input')
    .style('width', '80px')
    .attrs({
      id: 'input-center-x',
      class: 'm_elem_right',
      type: 'number',
      step: 'any',
    })
    .property('value', round_value(zoom_prop.x, 2))
    .on('change', function () {
      svg_map.__zoom.x = +this.value;
      zoom_without_redraw();
    });

  const c2 = dv4.append('li').style('display', 'none').attr('class', 'to_hide');
  c2.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.map_center_y',
    });
  c2.append('input')
    .attrs({
      id: 'input-center-y',
      class: 'list_elem_section4 m_elem_right',
      type: 'number',
      step: 'any',
    })
    .property('value', round_value(zoom_prop.y, 2))
    .style('width', '80px')
    .on('change', function () {
      svg_map.__zoom.y = +this.value;
      zoom_without_redraw();
    });

  const d = dv4.append('li').style('display', 'none').attr('class', 'to_hide');
  d.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.map_scale_k',
    });
  d.append('input')
    .attrs({
      id: 'input-scale-k',
      class: 'list_elem_section4 m_elem_right',
      type: 'number',
      step: 'any',
    })
    .property('value', () => {
      const _k = zoom_prop.k * proj.scale();
      return _k > 2 || _k < -2 ? round_value(_k, 2) : round_value(_k, Math.round(get_nb_decimals(_k) / 2));
    })
    .style('width', '80px')
    .on('change', function () {
      svg_map.__zoom.k = +this.value / proj.scale();
      zoom_without_redraw();
    });

  const g = dv4.append('li').style('display', 'none').attr('class', 'to_hide');
  g.append('p')
    .attrs({
      class: 'list_elem_section4 i18n',
      'data-i18n': '[html]app_page.section4.canvas_rotation',
    });

  g.append('span')
      .style('float', 'right')
      .html('°');

  g.append('input')
    .attrs({
      id: 'canvas_rotation_value_txt',
      class: 'without_spinner',
      type: 'number',
      min: 0,
      max: 360,
      step: 'any',
    })
    .styles({ width: '30px', 'margin-left': '10px', float: 'right'})
    .property('value', 0)
    .on('change', function () {
      const val = +this.value,
        old_value = document.getElementById('form_rotate').value;
      if (isNaN(val) || val < -361) {
        this.value = old_value;
        return;
      } else if (val < 0 && val > -361) {
        this.value = 360 + val;
      } else if (val > 360) {
        this.value = 360;
      } else { // Should remove trailing zeros (right/left) if any :
        this.value = +this.value;
      }
      rotate_global(this.value);
      document.getElementById('form_rotate').value = this.value;
    });

  g.append('input')
    .attrs({
      type: 'range',
      id: 'form_rotate',
      min: 0,
      max: 360,
      step: 1,
    })
    .styles({
      width: '80px',
      margin: '0px 10px 5px 15px',
      float: 'right',
    })
    .property('value', 0)
    .on('input', function () {
      rotate_global(this.value);
      document.getElementById('canvas_rotation_value_txt').value = this.value;
    });

  const g2 = dv4.append('li').styles({ margin: '1px', padding: '4px' });
  g2.append('input')
    .styles({ margin: 0, padding: 0 })
    .attrs({
      id: 'autoalign_features',
      type: 'checkbox',
      class: 'm_elem_right list_elem_section4 i18n',
    })
    .on('change', function () {
      _app.autoalign_features = this.checked;
    });
  g2.append('p').attr('class', 'list_elem_section4 i18n')
    .attr('data-i18n', '[html]app_page.section4.autoalign_features');

  const _i = dv4.append('li').styles({ 'text-align': 'center' });
  _i.insert('p')
    .styles({ clear: 'both', display: 'block', margin: 0 })
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.section4.layout_features' });
  const p1 = _i.insert('p').styles({ display: 'inline-block', margin: 'auto' });
  p1.insert('span')
    .insert('img')
    .attrs({ id: 'btn_arrow', src: 'static/img/layout_icons/arrow-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.arrow' })
    .on('click', () => add_layout_feature('arrow'));
  p1.insert('span')
    .insert('img')
    .attrs({ id: 'btn_text_annot', src: 'static/img/layout_icons/text-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.text_annot' })
    .on('click', () => add_layout_feature('text_annot'));
  if (!window.isIE) {
    p1.insert('span')
      .insert('img')
      .attrs({ id: 'btn_symbol', src: 'static/img/layout_icons/symbols-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.symbol' })
      .on('click', () => add_layout_feature('symbol'));
  }
  p1.insert('span')
    .insert('img')
    .attrs({ id: 'btn_rectangle', src: 'static/img/layout_icons/rect-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.rectangle' })
    .on('click', () => add_layout_feature('rectangle'));
  p1.insert('span')
    .insert('img')
    .attrs({ id: 'btn_ellipse', src: 'static/img/layout_icons/ellipse-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.ellipse' })
    .on('click', () => add_layout_feature('ellipse'));

  const p2 = _i.insert('p').styles({ display: 'inline-block', margin: 'auto' });
  p2.insert('span')
    .insert('img')
    .attrs({ id: 'btn_graticule', src: 'static/img/layout_icons/graticule-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.graticule' })
    .on('click', () => add_layout_feature('graticule'));
  p2.insert('span')
    .insert('img')
    .attrs({ id: 'btn_north', src: 'static/img/layout_icons/north-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.north_arrow' })
    .on('click', () => add_layout_feature('north_arrow'));
  p2.insert('span')
    .insert('img')
    .attrs({ id: 'btn_scale', src: 'static/img/layout_icons/scale.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.scale' })
    .on('click', () => add_layout_feature('scale'));
  p2.insert('span')
    .insert('img')
    .attrs({ id: 'btn_sphere', src: 'static/img/layout_icons/sphere-01.png', class: 'layout_ft_ico i18n tt', 'data-i18n': '[title]app_page.layout_features_box.sphere' })
    .on('click', () => add_layout_feature('sphere'));

  add_simplified_land_layer();

  const section5b = d3.select('#section5');
  const dv5b = section5b.append('div');

  const type_export = dv5b.append('p');
  type_export.append('span')
    .attr('class', 'i18n')
    .attr('data-i18n', '[html]app_page.section5b.type');
  const select_type_export = type_export.append('select')
    .attrs({ id: 'select_export_type', class: 'm_elem_right' })
    .on('change', function () {
      const type = this.value,
        export_filename = document.getElementById('export_filename');
      if (type === 'svg') {
        document.getElementById('export_options_geo').style.display = 'none';
        document.getElementById('export_options_png').style.display = 'none';
        export_filename.value = 'export.svg';
        export_filename.style.display = '';
        export_filename.previousSibling.style.display = '';
      } else if (type === 'png') {
        document.getElementById('export_options_geo').style.display = 'none';
        document.getElementById('export_options_png').style.display = '';
        export_filename.value = 'export.png';
        export_filename.style.display = '';
        export_filename.previousSibling.style.display = '';
      } else if (type === 'geo') {
        document.getElementById('export_options_png').style.display = 'none';
        document.getElementById('export_options_geo').style.display = '';
        export_filename.style.display = 'none';
        export_filename.previousSibling.style.display = 'none';
      }
    });

  select_type_export.append('option').text('SVG').attr('value', 'svg');
  select_type_export.append('option').text('PNG').attr('value', 'png');
  select_type_export.append('option').text('GEO').attr('value', 'geo');

  const export_png_options = dv5b.append('p')
    .attr('id', 'export_options_png')
    .style('display', 'none');

  export_png_options.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.section5b.format' });

  const select_size_png = export_png_options.append('select')
    .attrs({ id: 'select_png_format', class: 'm_elem_right' });
  fill_export_png_options('user_defined');

  select_size_png.on('change', function () {
    const value = this.value,
      unit = value === 'web' ? ' (px)' : ' (cm)',
      in_h = document.getElementById('export_png_height'),
      in_w = document.getElementById('export_png_width');
    if (value === 'web') {
      in_h.value = h;
      in_w.value = w;
    } else if (value === 'user_defined') {
      in_h.value = Mround(h / 118.11 * 10) / 10;
      in_w.value = Mround(w / 118.11 * 10) / 10;
    } else if (value === 'A4_landscape') {
      in_h.value = 21.0;
      in_w.value = 29.7;
    } else if (value === 'A4_portrait') {
      in_h.value = 29.7;
      in_w.value = 21.0;
    } else if (value === 'A3_landscape') {
      in_h.value = 42.0;
      in_w.value = 29.7;
    } else if (value === 'A3_portrait') {
      in_h.value = 29.7;
      in_w.value = 42.0;
    } else if (value === 'A5_landscape') {
      in_h.value = 14.8;
      in_w.value = 21.0;
    } else if (value === 'A5_portrait') {
      in_h.value = 21.0;
      in_w.value = 14.8;
    }
    document.getElementById('export_png_width_txt').innerHTML = unit;
    document.getElementById('export_png_height_txt').innerHTML = unit;
    if (value.indexOf('portrait') > -1 || value.indexOf('landscape') > -1) {
      in_h.disabled = 'disabled';
      in_w.disabled = 'disabled';
    } else {
      in_h.disabled = undefined;
      in_w.disabled = undefined;
    }
  });

  const exp_a = export_png_options.append('p').style('margin', '20px 0');
  exp_a.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.section5b.width' });

  exp_a.append('input')
    .style('width', '60px')
    .attrs({ id: 'export_png_width', class: 'm_elem_right', type: 'number', step: 0.1 })
    .property('value', w)
    .on('change', function () {
      const ratio = h / w,
        export_png_height = document.getElementById('export_png_height');
      export_png_height.value = Mround(+this.value * ratio * 10) / 10;
    });

  exp_a.append('span')
    .attr('id', 'export_png_width_txt')
    .html(' (px)');

  const exp_b = export_png_options.append('p').style('margin', '20px 0');
  exp_b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.section5b.height' });

  exp_b.append('input')
    .style('width', '60px')
    .attrs({ id: 'export_png_height', class: 'm_elem_right', type: 'number', step: 0.1 })
    .property('value', h)
    .on('change', function () {
      const ratio = h / w,
        export_png_width = document.getElementById('export_png_width');
      export_png_width.value = Mround(+this.value / ratio * 10) / 10;
    });

  exp_b.append('span')
    .attr('id', 'export_png_height_txt')
    .html(' (px)');

  const export_name = dv5b.append('p');
  export_name.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.section5b.filename' });

  export_name.append('input')
    .attrs({ id: 'export_filename', class: 'm_elem_right', type: 'text' })
    .property('value', 'export.svg');

  const export_geo_options = dv5b.append('p')
    .attr('id', 'export_options_geo')
    .style('display', 'none');

  const geo_a = export_geo_options.append('p')
    .style('margin-bottom', '0');
  geo_a.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.export_box.option_layer' });

  const selec_layer = export_geo_options.insert('select')
    .styles({ position: 'sticky', float: 'right' })
    .attrs({ id: 'layer_to_export', class: 'i18n m_elem_right' });

  const geo_b = export_geo_options.append('p')
    .styles({ clear: 'both' }); // 'margin-top': '35px !important'
  geo_b.append('span')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.export_box.option_datatype' });
  const selec_type = geo_b.insert('select')
    .attrs({ id: 'datatype_to_use', class: 'i18n m_elem_right' })
    .style('margin-top', '5px');

  export_geo_options.append('p')
    .style('margin', 'auto')
    .attrs({ class: 'i18n', 'data-i18n': '[html]app_page.export_box.option_projection' });
  const geo_c = export_geo_options.append('p').style('margin', 'auto');
  const selec_projection = geo_c.insert('select')
    .styles({ position: 'relative', float: 'right', 'margin-right': '5px', 'font-size': '10.5px' })
    .attrs({ id: 'projection_to_use', disabled: true, class: 'i18n' });

  const proj4_input = export_geo_options.append('p').style('margin', 'auto')
    .insert('input')
    .attrs({ id: 'proj4str' })
    .styles({ display: 'none', width: '275px', position: 'relative', float: 'right', 'margin-right': '5px', 'font-size': '10.5px' })
    .on('keyup', function () {
      ok_button.disabled = this.value.length === 0 ? 'true' : '';
    });

  ['GeoJSON', 'TopoJSON', 'ESRI Shapefile', 'GML', 'KML'].forEach((name) => {
    selec_type.append('option').attr('value', name).text(name);
  });

  [
    ['app_page.section5b.wgs84', 'epsg:4326'],
    ['app_page.section5b.web_mercator', 'epsg:3857'],
    ['app_page.section5b.laea_europe', 'epsg:3035'],
    ['app_page.section5b.usa_albers', '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=37.5 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs'],
    ['app_page.section5b.british_national_grid', 'epsg:27700'],
    ['app_page.section5b.lambert93', 'epsg:2154'],
    ['app_page.section5b.eckert_4', '+proj=eck4 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs '],
    ['app_page.section5b.proj4_prompt', 'proj4string'],
  ].forEach((projection) => {
    selec_projection.append('option')
      .attrs({ class: 'i18n', value: projection[1], 'data-i18n': projection[0] })
      .text(_tr(projection[0]));
  });

  selec_type.on('change', function () {
    if (this.value === 'TopoJSON' || this.value === 'KML' || this.value === 'GeoJSON') {
      selec_projection.node().options.selectedIndex = 0;
      selec_projection.attr('disabled', true);
      ok_button.disabled = '';
    } else {
      selec_projection.attr('disabled', null);
    }
  });

  selec_projection.on('change', function () {
    if (this.value === 'proj4string') {
      proj4_input.style('display', 'initial');
      if (proj4_input.node().value === '' || proj4_input.node().value === undefined) {
        ok_button.disabled = 'true';
      }
    } else {
      proj4_input.style('display', 'none');
      ok_button.disabled = '';
    }
  });
  let ok_button = dv5b.append('p').style('float', 'left')
    .append('button')
    .attrs({ id: 'export_button_section5b', class: 'i18n button_st4', 'data-i18n': '[html]app_page.section5b.export_button' })
    .on('click', () => {
      const type_exp = document.getElementById('select_export_type').value,
        exp_name = document.getElementById('export_filename').value;
      if (type_exp === 'svg') {
        export_compo_svg(exp_name);
      } else if (type_exp === 'geo') {
        const layer_name = document.getElementById('layer_to_export').value,
          type = document.getElementById('datatype_to_use').value,
          proj = document.getElementById('projection_to_use').value,
          proj4value = document.getElementById('proj4str').value;
        export_layer_geo(layer_name, type, proj, proj4value);
      } else if (type_exp === 'png') {
        let exp_type = document.getElementById('select_png_format').value,
          ratio;
        if (exp_type === 'web') {
          ratio = +document.getElementById('export_png_height').value / +h;
        } else {
          exp_type = 'paper';
          ratio = (+document.getElementById('export_png_height').value * 118.11) / +h;
        }
        export_compo_png(exp_type, ratio, exp_name);
      }
    });

  // Zoom-in, Zoom-out, Info, Hand-Move and RectZoom buttons (on the top of the map) :
  const lm = map_div
    .append('div')
    .attr('class', 'light-menu')
    .styles({ position: 'absolute', right: '0px', bottom: '0px' });

  const lm_buttons = [
    { id: 'zoom_out', i18n: '[title]app_page.lm_buttons.zoom-', tooltip_position: 'left', class: 'zoom_button i18n tt', html: '-' },
    { id: 'zoom_in', i18n: '[title]app_page.lm_buttons.zoom+', tooltip_position: 'left', class: 'zoom_button i18n tt', html: '+' },
    { id: 'info_button', i18n: '[title]app_page.lm_buttons.i', tooltip_position: 'left', class: 'info_button i18n tt', html: 'i' },
    { id: 'brush_zoom_button', i18n: '[title]app_page.lm_buttons.zoom_rect', tooltip_position: 'left', class: 'brush_zoom_button i18n tt', html: '<img src="static/img/Inkscape_icons_zoom_fit_selection_blank.png" width="18" height="18" alt="Zoom_select"/>' },
    { id: 'hand_button', i18n: '[title]app_page.lm_buttons.hand_button', tooltip_position: 'left', class: 'hand_button i18n tt', html: '<img src="static/img/Twemoji_1f513.png" width="18" height="18" alt="Hand_closed"/>' },
  ];

  const selec = lm.selectAll('input')
    .data(lm_buttons)
    .enter()
    .append('p')
    .attr('class', 'cont_map_btn')
    .style('margin', 'auto')
    .insert('button')
    .attrs(elem => ({
      'data-tippy-placement': elem.tooltip_position,
      class: elem.class,
      'data-i18n': elem.i18n,
      id: elem.id }))
    .html(elem => elem.html);

  // Trigger actions when buttons are clicked and set-up the initial view :
  d3.selectAll('.zoom_button').on('click', zoomClick);
  document.getElementById('info_button').onclick = displayInfoOnMove;
  document.getElementById('hand_button').onclick = handle_click_hand;
  document.getElementById('brush_zoom_button').onclick = handleZoomRect;

  // Already append the div for displaying information on features,
  // setting it currently unactive until it will be requested :
  d3.select('body')
    .append('div')
    .attr('id', 'info_features')
    .classed('active', false)
    .style('display', 'none')
    .html('');

  accordionize('.accordion');
  document.getElementById('btn_s1').dispatchEvent(new MouseEvent('click'));
  prepare_drop_section();

  if (reload_project) {
    let url;
    if (reload_project.startsWith('http')) {
      url = reload_project;
    } else {
      url = `https://gist.githubusercontent.com/${reload_project}/raw/`;
    }
    xhrequest('GET', url, undefined, true)
      .then((data) => {
        apply_user_preferences(data);
      });
  } else {
    // Check if there is a project to reload in the localStorage :
    const last_project = window.localStorage.getItem('magrit_project');
    if (last_project && last_project.length && last_project.length > 0) {
      swal({ title: '',
            // text: _tr('app_page.common.resume_last_project'),
        allowOutsideClick: false,
        allowEscapeKey: false,
        type: 'question',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: _tr('app_page.common.new_project'),
        cancelButtonText: _tr('app_page.common.resume_last'),
      }).then(() => {
        // If we don't want to resume from the last project, we can
        // remove it :
        window.localStorage.removeItem('magrit_project');
        // Indicate that that no layer have been added for now :*
        global._app.first_layer = true;
      }, (dismiss) => {
        apply_user_preferences(last_project);
      });
    } else {
        // Indicate that that no layer have been added for now :*
      global._app.first_layer = true;
    }
  }
  // Set the properties for the notification zone :
  alertify.set('notifier', 'position', 'bottom-left');
}

// Change color of the background
// (ie the parent "svg" element on the top of which group of elements have been added)
function handle_bg_color(color) {
  map.style('background-color', color);
}


/**
* Function triggered when some images of the interface are clicked
* in order to create an <input> element, simulate a click on it, let the user
* browse its file and dispatch the files to the appropriate handler according
* to the file type
*/
export function click_button_add_layer() {
  const self = this;
  const input = document.createElement('input');

  let target_layer_on_add = false;

  if (self.id === 'img_data_ext' || self.id === 'data_ext') {
    input.setAttribute('accept', '.xls,.xlsx,.csv,.tsv,.ods,.txt');
    // target_layer_on_add = true;
  } else if (self.id === 'input_geom' || self.id === 'img_in_geom') {
    input.setAttribute('accept', '.gml,.kml,.geojson,.topojson,.shp,.dbf,.shx,.prj,.cpg,.json');
    // target_layer_on_add = true;
  }
  input.setAttribute('type', 'file');
  input.setAttribute('multiple', '');
  input.setAttribute('name', 'file[]');
  input.setAttribute('enctype', 'multipart/form-data');
  input.onchange = (event) => {
    const files = prepareFileExt(event.target.files);
    handle_upload_files(files, self);
    input.remove();
  };
  input.click();
}

/**
*
* @param
*
*
*/
function askTypeLayer () {
  const opts = { target: _tr('app_page.common.target_l'), layout: _tr('app_page.common.layout_l') };
  let first_reject = false;
  return swal({
    title: '',
    text: _tr('app_page.common.layer_type_selection'),
    type: 'info',
    showCancelButton: true,
    showCloseButton: false,
    allowEscapeKey: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: _tr('app_page.common.confirm'),
    input: 'select',
    inputPlaceholder: _tr('app_page.common.layer_type_selection'),
    inputOptions: opts,
    inputValidator: (value) => {
      return new Promise(function (resolve, reject) {
        if (value.indexOf('target') < 0 && value.indexOf('layout') < 0) {
          reject(_tr('app_page.common.no_value'));
        } else if (value.indexOf('target') > -1 && _app.targeted_layer_added && !first_reject) {
          first_reject = true;
          reject(_tr('app_page.common.ask_replace_target_layer'));
        } else {
          if (value.indexOf('target') > -1 && first_reject) {
            downgradeTargetLayer();
          }
          resolve(value);
        }
      });
    },
  });
}


/**
* @param {FileList} files - The files(s) to be handled for this layer
* @param {HTMLElement} elem - Optionnal The parent element on which the file was dropped
*
* @return undefined
*/
function handle_upload_files(files, elem) {
  const tot_size = Array.prototype.map.call(files, f => f.size).reduce((a, b) => a + b, 0);
  if (files[0] && !files[0]._ext) {
    files = prepareFileExt(files);
  }
  if (tot_size > MAX_INPUT_SIZE) {
    return swal({
      title: `${_tr('app_page.common.error')}!`,
      text: _tr('app_page.common.too_large_input'),
      type: 'error',
      customClass: 'swal2_custom',
      allowEscapeKey: false,
      allowOutsideClick: false
    });
  }
  if (!(files.length === 1)) {
    const files_to_send = [];
    Array.prototype.forEach.call(files, f =>
        (f._ext === 'shp' || f._ext === 'dbf' || f._ext === 'shx' || f._ext === 'prj' || f._ext === 'cpg' ? files_to_send.push(f) : null));
    if (files_to_send.length >= 4 && files_to_send.length <= 6) {
      handle_shapefile(files_to_send);
    } else {
      return swal({
        title: `${_tr('app_page.common.error')}!`,
        text: _tr('app_page.common.alert_upload1'),
        customClass: 'swal2_custom',
        type: 'error',
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
    }
  } else if (files[0]._ext.indexOf('json') > -1 || files[0]._ext === 'zip' || files[0]._ext === 'gml' || files[0]._ext === 'kml') {
    if (files[0]._ext.indexOf('json') < 0) {
      handle_single_file(files[0]);
    } else {
      const rd = new FileReader();
      rd.onloadend = () => {
        const [valid, tmp] = isValidJSON(rd.result);
        if (!valid) {
          console.log(tmp);
          return swal({
            title: `${_tr('app_page.common.error')}!`,
            text: _tr('app_page.common.alert_upload_invalid'),
            type: 'error',
            customClass: 'swal2_custom',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
        }
        if (tmp.type && tmp.type === 'FeatureCollection') {
          handle_single_file(files[0]);
        } else if (tmp.type && tmp.type === 'Topology') {
          handle_TopoJSON_files(files);
        } else if (tmp.map_config && tmp.layers) {
          apply_user_preferences(rd.result);
        } else {
          return swal({
            title: `${_tr('app_page.common.error')}!`,
            text: _tr('app_page.common.alert_upload_invalid'),
            type: 'error',
            customClass: 'swal2_custom',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
        }
      };
      rd.readAsText(files[0]);
    }
  } else if (files[0]._ext === 'csv' || files[0]._ext === 'tsv') {
    handle_dataset(files[0]);
  } else if (files[0]._ext.indexOf('xls') > -1 || files[0]._ext.indexOf('ods') > -1) {
    convert_dataset(files[0]);
  } else {
    let shp_part;
    Array.prototype.forEach.call(files, (f) => {
      f._ext === 'shp' || f._ext === 'dbf' || f._ext === 'shx' || f._ext === 'prj' || f._ext === 'cpg' ? shp_part = true : null;
    });
    if (shp_part) {
      return swal({
        title: `${_tr('app_page.common.error')}!`,
        text: _tr('app_page.common.alert_upload_shp'),
        type: 'error',
        customClass: 'swal2_custom',
        allowOutsideClick: false,
        allowEscapeKey: false
      })
      .then(valid => null, dismiss => null);
    } else {
      return swal({
        title: `${_tr('app_page.common.error')}!`,
        text: _tr('app_page.common.alert_upload_invalid'),
        type: 'error',
        customClass: 'swal2_custom',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }
  }
}

function handleOneByOneShp(files) {
  function populate_shp_slot(slots, file) {
    if (file.name.toLowerCase().indexOf('.shp') > -1) {
      slots.set('.shp', file);
      document.getElementById('f_shp').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.shx') > -1) {
      slots.set('.shx', file);
      document.getElementById('f_shx').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.prj') > -1) {
      slots.set('.prj', file);
      document.getElementById('f_prj').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.dbf') > -1) {
      slots.set('.dbf', file);
      document.getElementById('f_dbf').className = 'mini_button_ok';
    } else if (file.name.toLowerCase().indexOf('.cpg') > -1) {
      slots.set('.cpg', file);
      document.getElementById('f_cpg').className = 'mini_button_ok';
    } else {
      return false;
    }
  }
  let name = '';
  let shp_slots = new Map();
  populate_shp_slot(shp_slots, files[0]);

  swal({
    title: '',
    html: '<div style="border: dashed 1px green;border-radius: 1%;" id="dv_drop_shp">' +
          `<strong>${_tr('app_page.common.shp_one_by_one_msg1')}</strong><br>` +
          `<p style="margin:auto;">${_tr('app_page.common.shp_one_by_one_msg2', { name: name })}</p>` +
          `<p><i>${_tr('app_page.common.shp_one_by_one_msg3')}</i></p><br>` +
          '<image id="img_drop" src="static/img/Ic_file_download_48px.svg"><br>' +
          '<p id="f_shp" class="mini_button_none">.shp</p><p id="f_shx" class="mini_button_none">.shx</p>' +
          '<p id="f_dbf" class="mini_button_none">.dbf</p><p id="f_prj" class="mini_button_none">.prj</p>' +
          '<p id="f_cpg" class="mini_button_none_orange">.cpg</p></div>',
    type: 'info',
    showCancelButton: true,
    showCloseButton: false,
    allowEscapeKey: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: _tr('app_page.common.confirm'),
    preConfirm: () => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!((shp_slots.size === 4 && !shp_slots.has('.cpg')) || shp_slots.size === 5)) {
          reject(_tr('app_page.common.shp_one_by_one_missing_files'));
        } else {
          resolve();
        }
      }, 50);
    }),
  }).then(() => {
    const file_list = [shp_slots.get('.shp'), shp_slots.get('.shx'), shp_slots.get('.dbf'), shp_slots.get('.prj')];
    if (shp_slots.has('.cpg')) {
      file_list.push(shp_slots.get('.cpg'));
    }
    for (let i = 0; i < file_list.length; i++) {
      if (file_list[i].size > MAX_INPUT_SIZE) {
        overlay_drop.style.display = 'none';
        return swal({
          title: `${_tr('app_page.common.error')}!`,
          text: _tr('app_page.common.too_large_input'),
          type: 'error',
          allowEscapeKey: false,
          allowOutsideClick: false,
        });
      }
    }
    handle_shapefile(file_list);
  }, (dismiss) => {
    overlay_drop.style.display = 'none';
    console.log(dismiss);
  });
  document.getElementById('dv_drop_shp').addEventListener('drop', function (event) {
    event.preventDefault();
    event.stopPropagation();
    const next_files = prepareFileExt(event.dataTransfer.files);
    for (let f_ix = 0; f_ix < next_files.length; f_ix++) {
      // let file = next_files[f_ix];
      populate_shp_slot(shp_slots, next_files[f_ix]);
    }
    if ((shp_slots.size === 4 && !shp_slots.has('.cpg')) || shp_slots.size === 5) {
      // const elem = document.getElementById('dv_drop_shp');
      // elem.innerHTML = elem.innerHTML.replace('Ic_file_download_48px.svg', 'Ic_check_36px.svg');
      this.innerHTML = this.innerHTML.replace('Ic_file_download_48px.svg', 'Ic_check_36px.svg');
    }
  });
  document.getElementById('dv_drop_shp').addEventListener('dragover', function (event) {
    this.style.border = 'dashed 2.5px green';
    event.preventDefault(); event.stopPropagation();
  });
  document.getElementById('dv_drop_shp').addEventListener('dragleave', function (event) {
    this.style.border = 'dashed 1px green';
    event.preventDefault(); event.stopPropagation();
  });
}

/**
* Function called to bind the "drop zone" on the 2 desired menu elements
*
*/
export function prepare_drop_section() {
  let timeout;
  Array.prototype.forEach.call(
    document.querySelectorAll('#map,.overlay_drop'),
    (elem) => {
        elem.addEventListener('dragenter', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (document.body.classList.contains('no-drop')) return;
          document.getElementById('overlay_drop').style.display = '';
        });

        elem.addEventListener('dragover', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (document.body.classList.contains('no-drop')) return;
          if (timeout) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              // e.preventDefault(); e.stopPropagation();
              document.getElementById('overlay_drop').style.display = 'none';
              timeout = null;
            }, 2500);
          }
        });

        elem.addEventListener('dragleave', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (document.body.classList.contains('no-drop')) {
            document.body.classList.remove('no-drop');
            return;
          }
          timeout = setTimeout(() => {
            document.getElementById('overlay_drop').style.display = 'none';
            timeout = null;
          }, 2500);
        });

        elem.addEventListener('drop', function _drop_func(e) {
          e.preventDefault(); e.stopPropagation();
          if (timeout) {
            clearTimeout(timeout);
          }
          if (document.body.classList.contains('no-drop') || !e.dataTransfer.files.length) {
            document.getElementById('overlay_drop').style.display = 'none';
            return;
          }
          timeout = setTimeout(() => {
            document.getElementById('overlay_drop').style.display = 'none';
            timeout = null;
          }, 750);

          const files = prepareFileExt(e.dataTransfer.files);
          if (files.length === 1
              && (files[0]._ext === 'shp' || files[0]._ext === 'dbf' || files[0]._ext === 'shx' || files[0]._ext === 'prj' || files[0]._ext === 'cpg')) {
            Array.prototype.slice.call(document.querySelectorAll('#map,.overlay_drop'))
              .forEach((_elem) => {
                _elem.removeEventListener('drop', _drop_func);
              });
            handleOneByOneShp(files);
          } else {
            handle_upload_files(files, null);
          }
        });
    });
}

function ask_replace_dataset() {
  return swal({
    title: '',
    text: _tr('app_page.common.ask_replace_dataset'),
    type: 'warning',
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: _tr('app_page.common.confirm'),
  });
}

function convert_dataset(file) {
  const do_convert = () => {
    const ajaxData = new FormData();
    ajaxData.append('action', 'submit_form');
    ajaxData.append('file[]', file);
    xhrequest('POST', 'convert_tabular', ajaxData, true)
      .then((raw_data) => {
        const data = JSON.parse(raw_data);
        swal({
          title: '',
          text: _tr('app_page.common.warn_xls_sheet') + (data.message ? '\n' + _tr(data.message[0], { sheet_name: data.message[1][0] }) : ''),
          type: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          const tmp_dataset = d3.csvParse(data.file);
          const field_names = Object.getOwnPropertyNames(tmp_dataset[0]).map(el => (el.toLowerCase ? el.toLowerCase() : el));
          if (!_app.targeted_layer_added && (field_names.indexOf('x') > -1 || field_names.indexOf('lat') > -1 || field_names.indexOf('latitude') > -1)) {
            if (field_names.indexOf('y') > -1 || field_names.indexOf('lon') > -1 || field_names.indexOf('longitude') > -1 || field_names.indexOf('long') > -1 || field_names.indexOf('lng') > -1) {
              add_csv_geom(data.file, data.name);
              return;
            }
          }
          data_manager.dataset_name = data.name;
          add_dataset(tmp_dataset);
        }, dismiss => null);
      }, (error) => {
        display_error_during_computation();
      });
  };

  if (data_manager.joined_dataset.length !== 0) {
    ask_replace_dataset().then(() => {
      remove_ext_dataset_cleanup();
      do_convert();
    }, () => null);
  } else {
    do_convert();
  }
}

/**
* Handle shapefile opened/dropped on the window by the user.
*
* @param {Array} files - An array of files, containing the mandatory files
*                       for correctly reading shapefiles
*                       (.shp, .shx, .dbf, .prj and optionnaly .cpg).
* @param {Bool} target_layer_on_add - Whether we are trying to add the target layer or not.
* @return {void}
*/
function handle_shapefile(files, target_layer_on_add) {
  askTypeLayer()
    .then((val) => {
      overlay_drop.style.display = 'none';
      let target_layer_on_add;
      if (val.indexOf('target') > -1) {
        target_layer_on_add = true;
      } else {
        target_layer_on_add = false;
      }
      const ajaxData = new FormData();
      ajaxData.append('action', 'submit_form');
      for (let j = 0; j < files.length; j++) {
        ajaxData.append(`file[${j}]`, files[j]);
      }
      xhrequest('POST', 'convert_to_topojson', ajaxData, true)
        .then((data) => {
          add_layer_topojson(data, { target_layer_on_add: target_layer_on_add });
        }, (error) => {
          display_error_during_computation();
        });
    }, (dismiss) => {
      overlay_drop.style.display = 'none';
    });
}


function handle_TopoJSON_files(files) {
  askTypeLayer()
    .then((val) => {
      overlay_drop.style.display = 'none';
      let target_layer_on_add;
      if (val.indexOf('target') > -1) {
        target_layer_on_add = true;
      } else {
        target_layer_on_add = false;
      }
      const f = files[0],
        name = files[0].name,
        reader = new FileReader(),
        ajaxData = new FormData();
      ajaxData.append('file[]', f);
      xhrequest('POST', 'convert_topojson', ajaxData, true)
        .then((res) => {
          const key = JSON.parse(res).key;
          reader.onloadend = () => {
            const text = reader.result;
            const topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
            add_layer_topojson(topoObjText, { target_layer_on_add: target_layer_on_add });
          };
          reader.readAsText(f);
        }, (error) => {
          display_error_during_computation();
        });
    }, (dismiss) => {
      overlay_drop.style.display = 'none';
    });
}

/**
* Function used to reload a TopoJSON layer from a project file.
* The layer is send to the server (for eventual later usage) but
* we are not waiting for its response to actually add the layer to the map.
*
* @param {String} text - The TopoJSON layer stringified in JSON.
* @param {Object} param_add_func - The options Object to be passed to the
*                               'add_layer_topojson' function.
* @return {String} - The actual name of the layer, once added to the map.
*
*/
function handle_reload_TopoJSON(text, param_add_func) {
  const ajaxData = new FormData();
  const f = new Blob([text], { type: 'application/json' });
  ajaxData.append('file[]', f);

  // let topoObjText = ['{"key":null,"file":', text, '}'].join('');
  const layer_name = add_layer_topojson(['{"key":null,"file":', text, '}'].join(''), param_add_func);
  xhrequest('POST', 'convert_topojson', ajaxData, false)
    .then((response) => {
      const key = JSON.parse(response).key;
      data_manager.current_layers[layer_name].key_name = key;
    });
  return layer_name;
}

// function handle_reload_TopoJSON(text, param_add_func){
//     var ajaxData = new FormData();
//     var f = new Blob([text], {type: "application/json"});
//     ajaxData.append('file[]', f);
//
//     return xhrequest("POST", 'cache_topojson/user', ajaxData, false).then(function(response){
//         let res = response,
//             key = JSON.parse(res).key,
//             topoObjText = ['{"key": ', key, ',"file":', text, '}'].join('');
//         let layer_name = add_layer_topojson(topoObjText, param_add_func);
//         return layer_name;
//     });
// }

/**
* Handle a csv dataset by parsing it as an array of Object (ie features) or by
* converting it to topojson if it contains valid x/y/lat/lon/etc. columns and
* adding it to the map
* @param {File} f - The input csv file
*/
function handle_dataset(f, target_layer_on_add) {
  const check_dataset = () => {
    const reader = new FileReader(),
      name = f.name;

    reader.onload = (e) => {
      let data = e.target.result;
      const encoding = jschardet.detect(data).encoding;
      const new_reader = new FileReader();
      new_reader.onload = function (ev) {
        data = ev.target.result;
        let sep = data.split('\n')[0];
        if (sep.indexOf('\t') > -1) {
          sep = '\t';
        } else if (sep.indexOf(';') > -1) {
          sep = ';';
        } else {
          sep = ',';
        }

        const tmp_dataset = d3.dsvFormat(sep).parse(data);
        const field_names = Object.getOwnPropertyNames(tmp_dataset[0]).map(el => (el.toLowerCase ? el.toLowerCase() : el));
        if (field_names.indexOf('x') > -1 || field_names.indexOf('lat') > -1 || field_names.indexOf('latitude') > -1) {
          if (field_names.indexOf('y') > -1 || field_names.indexOf('lon') > -1 || field_names.indexOf('longitude') > -1 || field_names.indexOf('long') > -1 || field_names.indexOf('lng') > -1) {
            if (target_layer_on_add && _app.targeted_layer_added) {
              swal({
                title: `${_tr('app_page.common.error')}!`,
                text: _tr('app_page.common.error_only_one'),
                customClass: 'swal2_custom',
                type: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false });
            } else {
              add_csv_geom(data, name.substring(0, name.indexOf('.csv')));
            }
            return;
          }
        }
        data_manager.dataset_name = name.substring(0, name.indexOf('.csv'));
        add_dataset(tmp_dataset);
      };
      new_reader.readAsText(f, encoding);
    };
    reader.readAsBinaryString(f);
  };

  if (data_manager.joined_dataset.length !== 0) {
    ask_replace_dataset().then(() => {
      remove_ext_dataset_cleanup();
      check_dataset();
    }, dismiss => null);
  } else {
    check_dataset();
  }
}

// function handle_dataset(f, target_layer_on_add){
//     function box_dataset(){
//         createBoxTextImportWizard(f).then(confirm => {
//             if(confirm){
//                 let [tmp_dataset, valid] = confirm;
//                 console.log(tmp_dataset, valid);
//                 let field_name = Object.getOwnPropertyNames(tmp_dataset[0]);
//                 if(field_name.indexOf("x") > -1 || field_name.indexOf("X") > -1 || field_name.indexOf("lat") > -1 || field_name.indexOf("latitude") > -1){
//                     if(field_name.indexOf("y") > -1 || field_name.indexOf("Y") > -1 || field_name.indexOf("lon") > -1 || field_name.indexOf("longitude") > -1 || field_name.indexOf("long") > -1){
//                         if(target_layer_on_add && _app.targeted_layer_added){
//                             swal({title: _tr("app_page.common.error") + "!",
//                                   text: _tr('app_page.common.error_only_one'),
//                                   customClass: 'swal2_custom',
//                                   type: "error",
//                                   allowEscapeKey: false,
//                                   allowOutsideClick: false});
//
//                         } else {
//                             let reader = new FileReader(),
//                                 name = f.name;
//
//                             reader.onload = function(e) {
//                                 add_csv_geom(e.target.result, f.name.substring(0, name.indexOf('.csv')));
//                             }
//                             reader.readAsText();
//                         }
//                         return;
//                     }
//                 }
//                 data_manager.dataset_name = f.name.substring(0, f.name.indexOf('.csv'));
//                 add_dataset(tmp_dataset);
//             }
//         });
//     }
//
//     if(data_manager.joined_dataset.length !== 0){
//         ask_replace_dataset().then(() => {
//             remove_ext_dataset_cleanup();
//             box_dataset();
//           }, () => { null; });
//     } else {
//         box_dataset();
//     }
// }

function update_menu_dataset() {
  const d_name = data_manager.dataset_name.length > 20 ? [data_manager.dataset_name.substring(0, 17), '(...)'].join('') : data_manager.dataset_name,
    nb_features = data_manager.joined_dataset[0].length,
    field_names = Object.getOwnPropertyNames(data_manager.joined_dataset[0][0]),
    data_ext = document.getElementById('ext_dataset_zone'),
    parent_elem = data_ext.parentElement;

  d3.select('#ext_dataset_zone')
    .styles({
      border: null,
      color: 'black',
      'margin-bottom': '3px',
      padding: null,
      'text-align': 'initial',
    })
    .html([
      '<div style="display:inline-block;"><img id="img_data_ext" class="user_panel" src="static/img/b/tabular.png" width="26" height="26" alt="Additional dataset"></img></div>',
      '<div style="display:inline-block;margin-left: 4px;">',
      ' <b>', d_name, '</b><br><i><span style="font-size:9px;">',
      nb_features, ' ', _tr('app_page.common.feature', { count: +nb_features }), ' - ',
      field_names.length, ' ', _tr('app_page.common.field', { count: +field_names.length }), '</i></span>',
      '</div>',
      '<div style="float:right;">',
      '<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_dataset">',
      '<img width="14" height="14" src="static/img/dataset.png" id="table_dataset_s1">',
      '</div>',
    ].join(''))

  document.getElementById('remove_dataset').onclick = () => {
    remove_ext_dataset();
  };
  if (_app.targeted_layer_added) {
    valid_join_check_display(false);
  }
  document.getElementById('table_dataset_s1').onclick = () => {
    boxExplore2.create(data_manager.dataset_name);
  };
}


/**
*
*
*/
function add_dataset(readed_dataset) {
  // Check if their is an empty name in the columns name (typically the first one) and replace it by UID:
  if (readed_dataset[0].hasOwnProperty('')) {
    const new_col_name = !readed_dataset[0].hasOwnProperty('UID') ? 'UID' : 'Undefined_Name';
    for (let i = 0; i < readed_dataset.length; ++i) {
      readed_dataset[i][new_col_name] = readed_dataset[i][''];
      delete readed_dataset[i][''];
    }
  }

  const cols = Object.getOwnPropertyNames(readed_dataset[0]);

  // Test if there is an empty last line and remove it if its the case :
  if (cols.map(f => readed_dataset[readed_dataset.length - 1][f]).every(f => f === '' || f === undefined)) {
    readed_dataset = readed_dataset.slice(0, readed_dataset.length - 1);
  }

  // Suboptimal way to convert an eventual comma decimal separator to a point decimal separator :
  for (let i = 0; i < cols.length; i++) {
    const tmp = [];
    // Check that all values of this field can be coerced to Number :
    for (let j = 0; j < readed_dataset.length; j++) {
      if ((readed_dataset[j][cols[i]].replace &&
            (!isNaN(+readed_dataset[j][cols[i]].replace(',', '.')) || !isNaN(+readed_dataset[j][cols[i]].split(' ').join(''))))
         || !isNaN(+readed_dataset[j][cols[i]])) {
        // Add the converted value to temporary field if its ok ...
        const t_val = readed_dataset[j][cols[i]].replace(',', '.').split(' ').join('');
        tmp.push(isFinite(t_val) && t_val !== '' && t_val != null ? +t_val : t_val);
      } else {
        // Or break early if a value can't be coerced :
        break; // So no value of this field will be converted
      }
    }
    // If the whole field has been converted successfully, apply the modification :
    if (tmp.length === readed_dataset.length) {
      for (let j = 0; j < readed_dataset.length; j++) {
        readed_dataset[j][cols[i]] = tmp[j];
      }
    }
  }
  data_manager.joined_dataset.push(readed_dataset);

  update_menu_dataset();

  if (_app.current_functionnality && _app.current_functionnality.name === 'flow') {
    fields_handler.fill();
  }

  if (_app.targeted_layer_added) {
    const layer_name = Object.getOwnPropertyNames(data_manager.user_data)[0];
    ask_join_now(layer_name, 'dataset');
  }
}

/**
* Send a csv file containing x/x columns to the server to convert it
* to a TopoJSON layer.
*
*
* @param {String} file - The csv file to be converted.
* @param {String} name - The original name of the csv file.
* @return {void}
*/
function add_csv_geom(file, name) {
  const ajaxData = new FormData();
  ajaxData.append('filename', name);
  ajaxData.append('csv_file', file);
  xhrequest('POST', 'convert_csv_geo', ajaxData, true)
    .then((data) => {
      data_manager.dataset_name = undefined;
      add_layer_topojson(data, { target_layer_on_add: true });
    }, (error) => {
      display_error_during_computation();
    });
}

/**
* Send a single file (.zip / .kml / .gml / .geojson) to the server in order to get
* the converted layer added to the map
* @param {File} file
*/
function handle_single_file(file, target_layer_on_add) {
  askTypeLayer()
    .then((val) => {
      overlay_drop.style.display = 'none';
      let target_layer_on_add;
      if (val.indexOf('target') > -1) {
        target_layer_on_add = true;
      } else {
        target_layer_on_add = false;
      }
      const ajaxData = new FormData();
      ajaxData.append('action', 'single_file');
      ajaxData.append('file[]', file);
      xhrequest('POST', '/convert_to_topojson', ajaxData, true)
        .then((data) => {
          add_layer_topojson(data, { target_layer_on_add: target_layer_on_add });
        }, (error) => {
          display_error_during_computation();
        });
    }, (dismiss) => {
      overlay_drop.style.display = 'none';
    });
}

function update_section1(type, nb_fields, nb_ft, lyr_name_to_add) {
  const nb_char_display = lyr_name_to_add.length + nb_fields.toString().length + nb_ft.toString().length;
  const _lyr_name_display = +nb_char_display > 40 ? [lyr_name_to_add.substring(0, 35), '(...)'].join('') : lyr_name_to_add;

  // Prepare an icon according to the type of geometry:
  let _button = button_type.get(type);
  _button = _button.substring(10, _button.indexOf('class') - 2);

  // Upate the zone allowed for displaying info on the target layer:
  d3.select('#target_layer_zone')
    .styles({
      'text-align': 'initial',
      padding: null,
      border: null,
      color: 'black',
    })
    .html(`<div style="display:inline-block;">
<img src="${_button}" width="26" height="26"></img>
</div>
<div style="display:inline-block;margin-left: 4px;">
<b>${_lyr_name_display}</b>
<br>
<i><span style="font-size:10px;">${nb_ft} ${_tr('app_page.common.feature', { count: +nb_ft })} - ${nb_fields} ${_tr('app_page.common.field', { count: +nb_fields })}</i></span>
</div>
<div style="float:right;">
<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_target">
<img width="14" height="14" src="static/img/dataset.png" id="table_layer_s1">
<img width="14" height="14" src="static/img/replace_target_layer.svg" id="downgrade_target">
</div>`)

  // const remove_target = document.getElementById('remove_target');
  document.getElementById('remove_target').onclick = () => { remove_layer(Object.getOwnPropertyNames(data_manager.user_data)[0]); };
  // const table_target = document.getElementById('table_layer_s1');
  document.getElementById('table_layer_s1').onclick = display_table_target_layer;
  // const downgrade_target = document.getElementById('downgrade_target');
  document.getElementById('downgrade_target').onclick = downgradeTargetLayer;
}

function ask_replace_target_layer() {
  return swal({
      title: '',
      text: _tr('app_page.join_box.before_join_ask'),
      allowOutsideClick: false,
      allowEscapeKey: true,
      type: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: _tr('app_page.common.yes'),
      cancelButtonText: _tr('app_page.common.no'),
    });
}

function ask_join_now(layer_name, on_add = 'layer') {
  swal({
    title: '',
    text: _tr('app_page.join_box.before_join_ask'),
    allowOutsideClick: false,
    allowEscapeKey: true,
    type: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: _tr('app_page.common.yes'),
    cancelButtonText: _tr('app_page.common.no'),
  }).then(() => {
    createJoinBox(layer_name);
  }, (dismiss) => {
    if (on_add === 'layer') make_box_type_fields(layer_name);
  });
}

const display_table_target_layer = () => {
  const layer_name = Object.keys(data_manager.user_data)[0];
  boxExplore2.create(layer_name);
};

function updateLayer(layer_name) {
  const fields = Object.keys(data_manager.user_data[layer_name][0]);
  data_manager.current_layers[layer_name].n_features = data_manager.user_data[layer_name].length;
  data_manager.current_layers[layer_name].original_fields = new Set(fields);
  const lyr_id = _app.layer_to_id.get(layer_name);
  const k = Object.keys(_target_layer_file.objects)[0];
  const selection = map.select(`#${lyr_id}`)
    .selectAll('path')
    .data(topojson.feature(_target_layer_file, _target_layer_file.objects[k]).features, d => d.id);
  selection.exit().remove();
  scale_to_lyr(layer_name);
  center_map(layer_name);
  zoom_without_redraw();
  update_section1(data_manager.current_layers[layer_name].type, fields.length, data_manager.current_layers[layer_name].n_features, layer_name);
}

/**
* Add a TopoJSON layer to the 'svg' element.
*
* @param {String} text - the text content to be parsed as a JS object.
* @param {Object} url - options regarding the layer to be added (such as wether skipping
*     the 'success' alert or not, which name to use for the layer, etc.).
* @return {String} The actual name of the layer once added, or `undefined` if
*     something went wrong.
*/
export function add_layer_topojson(text, options = {}) {
  const [valid, parsedJSON] = isValidJSON(text);
  // If JSON.parse failed:
  if (!valid){
    display_error_during_computation('Unable to load the layer');
    return;
  }
  // Server returns a JSON reponse like {"Error":"The error"} if something went bad during the conversion:
  if (parsedJSON.Error) {
    display_error_during_computation(parsedJSON.Error);
    return;
  }

  const result_layer_on_add = options.result_layer_on_add ? true : false,
    target_layer_on_add = options.target_layer_on_add ? true : false,
    skip_alert = options.skip_alert ? true : false,
    skip_rescale = options.skip_rescale === true ? true : false,
    fields_type = options.fields_type ? options.fields_type : undefined;
  const topoObj = parsedJSON.file.transform ? parsedJSON.file : topojson.quantize(parsedJSON.file, 1e5);
  const layers_names = Object.getOwnPropertyNames(topoObj.objects);
  const random_color1 = ColorsSelected.random();
  const lyr_name = layers_names[0];
  const lyr_name_to_add = check_layer_name(options.choosed_name ? options.choosed_name : lyr_name);
  const lyr_id = encodeId(lyr_name_to_add);
  const nb_ft = topoObj.objects[lyr_name].geometries.length;
  const topoObj_objects = topoObj.objects[lyr_name];
  let data_to_load = false;
  let type,
    _proj;

  // We don't allow multiple layer to be added at the same time, so the TopoJSON
  // file we are handling is supposed to only contains one layer. If it's not
  // the case, a warning is displayed and only the first layer is added to the svg.
  if (layers_names.length > 1) {
    swal('', _tr('app_page.common.warning_multiple_layers'), 'warning');
  }

  // Abort if the layer is empty (doesn't contains any feature)
  if (!topoObj_objects.geometries || topoObj_objects.geometries.length === 0) {
    display_error_during_computation(_tr('app_page.common.error_invalid_empty'));
    return;
  }

  // "Register" the layer name in the UI and it's corresponding id on the DOM :
  _app.layer_to_id.set(lyr_name_to_add, lyr_id);
  _app.id_to_layer.set(lyr_id, lyr_name_to_add);

  for (let _t_ix = 0; _t_ix < nb_ft; _t_ix++) {
    if (topoObj_objects.geometries[_t_ix] && topoObj_objects.geometries[_t_ix].type) {
      if (topoObj_objects.geometries[_t_ix].type.indexOf('Point') > -1) type = 'Point';
      else if (topoObj_objects.geometries[_t_ix].type.indexOf('LineString') > -1) type = 'Line';
      else if (topoObj_objects.geometries[_t_ix].type.indexOf('Polygon') > -1) type = 'Polygon';
      break;
    }
  }

  // Abort if the layer doesn't contains any feature with a geometry type within
  // "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"
  if (!type) {
    display_error_during_computation(_tr('app_page.common.error_invalid_empty'));
    return;
  }

  // Some special operations if this is the first layer to be added:
  if (_app.first_layer) {
    // Remove the 'world' layout layer displayed when the application starts:
    remove_layer_cleanup('World');
    // const world_id = _app.layer_to_id.get('World');
    // const q = document.querySelector(`.sortable.${world_id} > .layer_buttons > #eye_open`);
    // if (q) q.click();

    // Read the projection information provided with the layer, if any:
    if (parsedJSON.proj) {
      try {
        _proj = proj4(parsedJSON.proj);
      } catch (e) {
        _proj = undefined;
        console.log(e);
      }
    }
    // delete _app.first_layer;
  }

  data_manager.current_layers[lyr_name_to_add] = {
    type: type,
    n_features: nb_ft,
    'stroke-width-const': type === 'Line' ? 1.5 : 0.4,
    fill_color: { single: random_color1 },
    key_name: parsedJSON.key,
  };

  if (target_layer_on_add) {
    data_manager.current_layers[lyr_name_to_add].targeted = true;
    data_manager.user_data[lyr_name_to_add] = [];
    data_to_load = true;
    data_manager.current_layers[lyr_name_to_add].fields_type = [];
  } else if (result_layer_on_add) {
    data_manager.result_data[lyr_name_to_add] = [];
    data_manager.current_layers[lyr_name_to_add].is_result = true;
  }

  const field_names = topoObj_objects.geometries[0].properties
    ? Object.getOwnPropertyNames(topoObj_objects.geometries[0].properties) : [];
  const path_to_use = options.pointRadius
    ? path.pointRadius(options.pointRadius) : path;
  const nb_fields = field_names.length;
  topoObj_objects.geometries.forEach((d, ix) => {
    if (data_to_load && nb_fields > 0) {
      if (d.id !== undefined && d.id !== ix) {
        d.properties._uid = d.id; // eslint-disable-line no-param-reassign
        d.id = +ix; // eslint-disable-line no-param-reassign
      } else if (!d.id) {
        d.id = +ix; // eslint-disable-line no-param-reassign
      }
      data_manager.user_data[lyr_name_to_add].push(d.properties);
    } else if (data_to_load) {
      d.properties.id = d.id = ix; // eslint-disable-line no-param-reassign, no-multi-assign
      data_manager.user_data[lyr_name_to_add].push({ id: d.properties.id });
    } else if (result_layer_on_add) {
      data_manager.result_data[lyr_name_to_add].push(d.properties);
    }
  });

  const func_data_idx = (_, ix) => `feature_${ix}`;

  map.insert('g', '.legend')
    .attrs({ id: lyr_id, class: data_to_load ? 'targeted_layer layer' : 'layer' })
    .styles({ 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    .selectAll('.subunit')
    .data(topojson.feature(topoObj, topoObj_objects).features, d => d.id)
    .enter()
    .append('path')
    .attrs({ d: path_to_use, id: func_data_idx })
    .styles({
      stroke: type !== 'Line' ? 'rgb(0, 0, 0)' : random_color1,
      'stroke-opacity': 1,
      fill: type !== 'Line' ? random_color1 : null,
      'fill-opacity': type !== 'Line' ? 0.90 : 0,
    });

  const class_name = [
    target_layer_on_add ? 'sortable_target ' : result_layer_on_add ? 'sortable_result ' : null,
    lyr_id,
  ].join('');

  const layers_listed = layer_list.node(),
    li = document.createElement('li'),
    _lyr_name_display_menu = get_display_name_on_layer_list(lyr_name_to_add);

  li.setAttribute('class', class_name);
  li.setAttribute('layer_name', lyr_name_to_add);
  d3.select('#layer_to_export').append('option').attr('value', lyr_name_to_add).text(lyr_name_to_add);
  if (target_layer_on_add) {
    data_manager.current_layers[lyr_name_to_add].original_fields = new Set(Object.getOwnPropertyNames(data_manager.user_data[lyr_name_to_add][0]));
    if (data_manager.joined_dataset.length !== 0) {
      valid_join_check_display(false);
    }

    // document.getElementById('sample_zone').style.display = 'none';

    update_section1(type, nb_fields, nb_ft, lyr_name_to_add);
    _app.targeted_layer_added = true;
    li.innerHTML = [_lyr_name_display_menu,
      '<div class="layer_buttons">',
      button_trash,
      sys_run_button_t2,
      button_zoom_fit,
      button_table,
      eye_open0,
      button_type.get(type),
      button_replace,
      '</div>',
    ].join('');

    window._target_layer_file = topoObj;
    if (!skip_rescale) {
      scale_to_lyr(lyr_name_to_add);
      center_map(lyr_name_to_add);
    }
    if (_app.current_functionnality !== undefined) {
      fields_handler.fill(lyr_name_to_add);
    }
    handle_click_hand('lock');

    // If the target layer is a point layer, slightly change the tooltip for the "grid"
    // functionnality:
    document.getElementById('button_grid')
      .setAttribute('data-i18n', type === 'Point'
        ? '[title]app_page.func_description.grid_point'
        : '[title]app_page.func_description.grid');
    localize('#button_grid');
  } else if (result_layer_on_add) {
    li.innerHTML = [
      _lyr_name_display_menu,
      '<div class="layer_buttons">',
      button_trash,
      sys_run_button_t2,
      button_zoom_fit,
      button_table,
      eye_open0,
      button_legend,
      button_result_type.get(options.func_name),
      button_replace,
      '</div>'].join('');
    // Don't fit the viewport on the added layer if it's a result layer (or uncomment following lines..)
    // if (!skip_rescale) {
    //   center_map(lyr_name_to_add);
    // }
  } else {
    li.innerHTML = [
      _lyr_name_display_menu,
      '<div class="layer_buttons">',
      button_trash,
      sys_run_button_t2,
      button_zoom_fit,
      button_table,
      eye_open0,
      button_type.get(type),
      button_replace,
      '</div>'].join('');
  }

  if (!target_layer_on_add && _app.current_functionnality !== undefined
      && (_app.current_functionnality.name === 'smooth' || _app.current_functionnality.name === 'grid')) {
    fields_handler.fill();
  }

  if (type === 'Point') {
    data_manager.current_layers[lyr_name_to_add].pointRadius = options.pointRadius || path.pointRadius();
  }

  layers_listed.insertBefore(li, layers_listed.childNodes[0]);
  handleClipPath(_app.current_proj_name);
  binds_layers_buttons(lyr_name_to_add);
  if (!skip_rescale) {
    zoom_without_redraw();
  }

  // An alert is triggered when the layer is successfully added, except if
  // 'skip_alert' is false.
  // That "success" alert guide the user through other message; one for typing it's
  // data fields, on other (optionnal) for making the jointure between it's layer
  // and it's tabular dataset and another one (optional too)
  // to allow him to use the projection originally provided with the layer.
  if (!skip_alert) {
    if (fields_type) {
      data_manager.current_layers[lyr_name_to_add].fields_type = fields_type;
    }
    // No projection was provided was the layer :
    if (_proj === undefined) {
      swal({
        title: '',
        text: _tr('app_page.common.layer_success'),
        allowOutsideClick: true,
        allowEscapeKey: true,
        type: 'success',
      }).then(() => {
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      }, (dismiss) => {
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      });
    } else {
      swal({
        title: '',
        text: _tr('app_page.common.layer_success_and_proj'),
        showCancelButton: true,
        showCloseButton: false,
        allowEscapeKey: true,
        allowOutsideClick: true,
        type: 'success',
      }).then(() => {
        _app.last_projection = parsedJSON.proj;
        _app.current_proj_name = 'def_proj4';
        change_projection_4(_proj);
        const custom_name = tryFindNameProj(_app.last_projection);
        addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      }, (dismiss) => {
        if (target_layer_on_add && data_manager.joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      });
    }
  }

  // The 'default_projection' property is used for providing a custom projection
  // with our sample layer (it use a separate path compared to the previous
  // block of code, in order to not let the choice to the user)
  if (options.default_projection) {
    if (options.default_projection[0] === 'proj4') {
      let proj_str = options.default_projection[1];
      let custom_name;
      if (proj_str.startsWith('EPSG:')) {
        const code = +proj_str.split('EPSG:')[1];
        const rv = _app.epsg_projections[code];
        proj_str = rv.proj4;
        custom_name = rv.name;
      }
      _app.current_proj_name = 'def_proj4';
      _app.last_projection = proj_str;
      change_projection_4(proj4(proj_str));
      addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
    } else if (options.default_projection[0] === 'd3') {
      _app.current_proj_name = options.default_projection[1];
      change_projection(options.default_projection[1]);
      addLastProjectionSelect(_app.current_proj_name);
    }
  }
  return lyr_name_to_add;
}

export function handle_click_hand(behavior) {
  const hb = d3.select('#hand_button');
  // eslint-disable-next-line no-param-reassign
  const b = typeof behavior === 'object' ? (!hb.classed('locked') ? 'lock' : 'unlock') : (behavior && typeof behavior === 'string' ? behavior : false);
  if (b === 'lock') {
    hb.classed('locked', true);
    hb.html('<img src="static/img/Twemoji_1f512.png" width="18" height="18" alt="locked"/>');
    map.select('.brush').remove();
    document.getElementById('zoom_in').parentElement.style.display = 'none';
    document.getElementById('zoom_out').parentElement.style.display = 'none';
    document.getElementById('brush_zoom_button').parentElement.style.display = 'none';
    zoom.on('zoom', (() => { const blocked = svg_map.__zoom; return function () { this.__zoom = blocked; }; })());
  } else {
    hb.classed('locked', false);
    hb.html('<img src="static/img/Twemoji_1f513.png" width="18" height="18" alt="unlocked"/>');
    zoom.on('zoom', zoom_without_redraw);
    document.getElementById('zoom_in').parentElement.style.display = '';
    document.getElementById('zoom_out').parentElement.style.display = '';
    document.getElementById('brush_zoom_button').parentElement.style.display = '';
    map.select('.brush').remove();
  }
}

/**
*  Get the bounding box (in map/svg coordinates) of a layer using path.bounds()
*
*  @param {string} name - The name of layer
*  @return {Array} The bbox [[xmin, ymin], [xmax, ymax]] of the layer.
*/
function get_bbox_layer_path(name) {
  const selec = svg_map.querySelector('#' + _app.layer_to_id.get(name)).childNodes;
  let bbox_layer_path = [[Infinity, Infinity], [-Infinity, -Infinity]];
  for (let i = 0, len_i = selec.length; i < len_i; i++) {
    const bbox_path = path.bounds(selec[i].__data__);
    bbox_layer_path[0][0] = bbox_path[0][0] < bbox_layer_path[0][0] ? bbox_path[0][0] : bbox_layer_path[0][0];
    bbox_layer_path[0][1] = bbox_path[0][1] < bbox_layer_path[0][1] ? bbox_path[0][1] : bbox_layer_path[0][1];
    bbox_layer_path[1][0] = bbox_path[1][0] > bbox_layer_path[1][0] ? bbox_path[1][0] : bbox_layer_path[1][0];
    bbox_layer_path[1][1] = bbox_path[1][1] > bbox_layer_path[1][1] ? bbox_path[1][1] : bbox_layer_path[1][1];
  }
  if (_app.current_proj_name === 'ConicConformal') {
    const s1 = Mmax((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    const bbox_layer_path2 = path.bounds({ type: 'MultiPoint', coordinates: [ [ -69.3, -55.1 ], [ 20.9, -36.7 ], [ 147.2, -42.2 ], [ 162.1, 67.0 ], [ -160.2, 65.7 ] ] });
    const s2 = Mmax((bbox_layer_path2[1][0] - bbox_layer_path2[0][0]) / w, (bbox_layer_path2[1][1] - bbox_layer_path2[0][1]) / h);
    if (s2 < s1) bbox_layer_path = bbox_layer_path2;
  } else if (_app.current_proj_name === 'Armadillo') {
    const s1 = Mmax((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    const bbox_layer_path2 = path.bounds({ type: 'MultiPoint', coordinates: [ [ -69.3, -35.0 ], [ -170, 10 ], [ -170, 85 ], [ 0, -70 ], [ 20.9, -35.0 ], [ 147.2, -35.0 ], [ 170, 85 ], [ 170, 10 ] ] });
    const s2 = Mmax((bbox_layer_path2[1][0] - bbox_layer_path2[0][0]) / w, (bbox_layer_path2[1][1] - bbox_layer_path2[0][1]) / h);
    if (s2 < s1) bbox_layer_path = bbox_layer_path2;
  }
  return bbox_layer_path;
}

/**
* Change the projection scale and translate properties in order to fit the layer.
* Redraw the path from all the current layers to reflect the change.
*
* @param {string} name - The name of layer to scale on
* @return {void}
*/
export function scale_to_lyr(name) {
  const bbox_layer_path = get_bbox_layer_path(name);
  if (!bbox_layer_path) return;
  s = 0.95 / Mmax(
    (bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w,
    (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h) * proj.scale();
  t = [0, 0];
  proj.scale(s).translate(t);
  map.selectAll('.layer').selectAll('path').attr('d', path);
  reproj_symbol_layer();
}

/**
* Center and zoom to a layer (using zoom scale and translate properties).
* Projection properties stay unchanged.
*
* @param {string} name - The name of layer to zoom on
* @return {void}
*/
export function center_map(name) {
  const bbox_layer_path = get_bbox_layer_path(name);
  const zoom_scale = 0.95 / Mmax(
    (bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w,
    (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
  const zoom_translate = [
    (w - zoom_scale * (bbox_layer_path[1][0] + bbox_layer_path[0][0])) / 2,
    (h - zoom_scale * (bbox_layer_path[1][1] + bbox_layer_path[0][1])) / 2,
  ];
  const _zoom = svg_map.__zoom;
  _zoom.k = zoom_scale;
  _zoom.x = zoom_translate[0];
  _zoom.y = zoom_translate[1];
}

export function fitLayer(layer_name) {
  proj.scale(1).translate([0, 0]);
  const b = get_bbox_layer_path(layer_name);
  const s = 0.95 / Mmax((b[1][0] - b[0][0]) / w, (b[1][1] - b[0][1]) / h);
  const t = [(w - s * (b[1][0] + b[0][0])) / 2, (h - s * (b[1][1] + b[0][1])) / 2];
  proj.scale(s).translate(t);
  return [s, t];
}

/**
* Helper function called when a new 'Sphere' layer is added, in order to put it
* on the bottom of the other layer on the map.
*
* @param {string} sphere_id - The DOM id of the sphere.
* @return {void}
*/
function setSphereBottom(sphere_id) {
  const layers_list = document.querySelector('.layer_list');
  layers_list.appendChild(layers_list.childNodes[0]);
  svg_map.insertBefore(svg_map.querySelector(`#${sphere_id}.layer`), svg_map.childNodes[0]);
  svg_map.insertBefore(defs.node(), svg_map.childNodes[0]);
}

/**
* Function to display the dialog allowing the choose and add a sample target layer.
*
* @return {void}
*/
export function add_sample_layer() {
  const prepare_extra_dataset_availables = () => {
    request_data('GET', 'extrabasemaps').then((result) => {
      _app.list_extrabasemaps = JSON.parse(result.target.responseText).filter(elem => elem[0] !== 'Tunisia');
    });
  };
  check_remove_existing_box('.sampleDialogBox');
  if (!_app.list_extrabasemaps) {
    prepare_extra_dataset_availables();
  }
  const fields_type_sample = new Map([
    ['quartier_paris', [
      { name: 'n_sq_qu', type: 'id' },
      { name: 'c_qu', type: 'id' },
      { name: 'c_quinsee', type: 'id' },
      { name: 'l_qu', type: 'id' },
      { name: 'c_ar', type: 'category', has_duplicate: true },
      { name: 'n_sq_ar', type: 'category', has_duplicate: true },
      { name: 'surface', type: 'stock' },
      { name: 'P12_POP', type: 'stock' },
      { name: 'P07_POP', type: 'stock' }]],
    ['GrandParisMunicipalities', [
      { name: 'DEPARTEMENT', type: 'category', has_duplicate: true },
      { name: 'IDCOM', type: 'id' },
      { name: 'EPT', type: 'category', has_duplicate: true },
      { name: 'REVENUS', type: 'stock' },
      { name: 'LIBCOM', type: 'id' },
      { name: 'LIBEPT', type: 'category', has_duplicate: true },
      { name: 'MENAGES_FISCAUX', type: 'stock' },
      { name: 'UID', type: 'id' },
      { name: 'REVENUS_PAR_MENAGE', type: 'ratio' }]],
    ['martinique', [
      { name: 'INSEE_COM', type: 'id' },
      { name: 'NOM_COM', type: 'id', not_number: true },
      { name: 'STATUT', type: 'category', has_duplicate: true },
      { name: 'SUPERFICIE', type: 'stock' },
      { name: 'P13_POP', type: 'stock' },
      { name: 'P13_LOG', type: 'stock' },
      { name: 'P13_LOGVAC', type: 'stock' },
      { name: 'Part_Logements_Vacants', type: 'ratio' }]],
    ['nuts2-2013-data', [
      { name: 'id', type: 'id', not_number: true },
      { name: 'name', type: 'id', not_number: true },
      { name: 'POP', type: 'stock' },
      { name: 'GDP', type: 'stock' },
      { name: 'UNEMP', type: 'ratio' },
      { name: 'COUNTRY', type: 'category', has_duplicate: true }]],
    ['voronoi_communes_2016_2-2', [
      { name: 'INSEE_COM', type: 'id' }]],
    ['regions_2016_2-2', [
      { name: 'CODE_REG', type: 'id' }]],
    ['departements_2016_2-2', [
      { name: 'CODE_DEPT', type: 'id' },
      { name: 'CODE_REG', type: 'category', has_duplicate: true }]],
    ['brazil', [
      { name: 'ADMIN_NAME', type: 'id', not_number: true },
      { name: 'Abbreviation', type: 'id', not_number: true },
      { name: 'Capital', type: 'id', not_number: true },
      { name: 'GDP_per_capita_2012', type: 'stock' },
      { name: 'Life_expectancy_2014', type: 'ratio' },
      { name: 'Pop2014', type: 'stock' },
      { name: 'REGIONS', type: 'category', has_duplicate: true },
      { name: 'STATE2010', type: 'id' },
      { name: 'popdensity2014', type: 'ratio' }]],
    ['FR_communes', [
      { name: 'INSEE_COM', type: 'id' },
      { name: 'NOM_COM', type: 'id' },
      { name: 'SUPERFICIE', type: 'stock' },
      { name: 'POPULATION', type: 'stock' },
      { name: 'CODE_DEPT', type: 'category', has_duplicate: true },
      { name: 'NOM_DEPT', type: 'category', has_duplicate: true },
      { name: 'CODE_REG', type: 'category', has_duplicate: true },
      { name: 'NOM_REG', type: 'category', has_duplicate: true }]],
    ['world_countries_data', [
      { name: 'ISO2', type: 'id', not_number: true },
      { name: 'ISO3', type: 'id', not_number: true },
      { name: 'ISONUM', type: 'id' },
      { name: 'NAMEen', type: 'id', not_number: true },
      { name: 'NAMEfr', type: 'id', not_number: true },
      { name: 'UNRegion', type: 'category', has_duplicate: true },
      { name: 'GrowthRate', type: 'ratio' },
      { name: 'PopDensity', type: 'ratio' },
      { name: 'PopTotal', type: 'stock' },
      { name: 'JamesBond', type: 'stock' }]],
  ]);

  const suggested_projection = new Map([
    ['quartier_paris', ['proj4', 'EPSG:2154']],
    ['GrandParisMunicipalities', ['proj4', 'EPSG:2154']],
    ['martinique', ['proj4', 'EPSG:2973']],
    ['nuts2-2013-data', ['proj4', 'EPSG:3035']],
    ['voronoi_communes_2016_2-2', ['proj4', 'EPSG:2154']],
    ['departements_2016_2-2', ['proj4', 'EPSG:2154']],
    ['brazil', ['proj4', 'EPSG:5527']],
    ['world_countries_data', ['d3', 'NaturalEarth2']],
    ['commune_dep_971', ['proj4', 'EPSG:32620']],
    ['commune_dep_972', ['proj4', 'EPSG:32620']],
    ['commune_dep_973', ['proj4', 'EPSG:2972']],
    ['commune_dep_974', ['proj4', 'EPSG:2975']],
    ['commune_dep_976', ['proj4', 'EPSG:7075']],
  ]);
  const target_layers = [
   [_tr('app_page.sample_layer_box.target_layer'), ''],
   [_tr('app_page.sample_layer_box.grandparismunicipalities'), 'GrandParisMunicipalities'],
   [_tr('app_page.sample_layer_box.quartier_paris'), 'quartier_paris'],
   [_tr('app_page.sample_layer_box.martinique'), 'martinique'],
   [_tr('app_page.sample_layer_box.departements_2016_2-2'), 'departements_2016_2-2'],
   [_tr('app_page.layout_layer_box.departements_vor_2016_2-2'), 'departements_vor_2016_2-2'],
   [_tr('app_page.sample_layer_box.regions_2016_2-2'), 'regions_2016_2-2'],
   [_tr('app_page.layout_layer_box.france_contour_2016_2-2'), 'france_contour_2016_2-2'],
   [_tr('app_page.sample_layer_box.nuts2_data'), 'nuts2-2013-data'],
   [_tr('app_page.sample_layer_box.brazil'), 'brazil'],
   [_tr('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
   [_tr('app_page.sample_layer_box.communes_reg_11'), 'communes_reg_11'],
   [_tr('app_page.sample_layer_box.communes_reg_24'), 'communes_reg_24'],
   [_tr('app_page.sample_layer_box.communes_reg_27'), 'communes_reg_27'],
   [_tr('app_page.sample_layer_box.communes_reg_28'), 'communes_reg_28'],
   [_tr('app_page.sample_layer_box.communes_reg_32'), 'communes_reg_32'],
   [_tr('app_page.sample_layer_box.communes_reg_44'), 'communes_reg_44'],
   [_tr('app_page.sample_layer_box.communes_reg_52'), 'communes_reg_52'],
   [_tr('app_page.sample_layer_box.communes_reg_53'), 'communes_reg_53'],
   [_tr('app_page.sample_layer_box.communes_reg_75'), 'communes_reg_75'],
   [_tr('app_page.sample_layer_box.communes_reg_76'), 'communes_reg_76'],
   [_tr('app_page.sample_layer_box.communes_reg_84'), 'communes_reg_84'],
   [_tr('app_page.sample_layer_box.communes_reg_93'), 'communes_reg_93'],
   [_tr('app_page.sample_layer_box.communes_reg_94'), 'communes_reg_94'],
   [_tr('app_page.sample_layer_box.commune_dep_971'), 'commune_dep_971'],
   [_tr('app_page.sample_layer_box.commune_dep_972'), 'commune_dep_972'],
   [_tr('app_page.sample_layer_box.commune_dep_973'), 'commune_dep_973'],
   [_tr('app_page.sample_layer_box.commune_dep_974'), 'commune_dep_974'],
   [_tr('app_page.sample_layer_box.commune_dep_976'), 'commune_dep_976'],
   [_tr('app_page.sample_layer_box.voronoi_communes_2016_2-2'), 'voronoi_communes_2016_2-2'],
   [_tr('app_page.layout_layer_box.nuts0'), 'nuts0'],
   [_tr('app_page.layout_layer_box.nuts1'), 'nuts1'],
   [_tr('app_page.layout_layer_box.nuts2'), 'nuts2'],
   [_tr('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
   [_tr('app_page.layout_layer_box.world_countries'), 'world_country'],
   [_tr('app_page.layout_layer_box.world_capitals'), 'world_cities'],
   [_tr('app_page.layout_layer_box.tissot'), 'tissot'],
  ];
  const dialog_res = [];
  let selec,
    selec_url,
    content;

  make_confirm_dialog2('sampleDialogBox', _tr('app_page.sample_layer_box.title'))
    .then((confirmed) => {
      if (confirmed) {
        askTypeLayer()
          .then((_type_layer) => {
            const target_layer = _type_layer.indexOf('target') > -1;
            if (content.attr('id') === 'panel1') {
              if (selec) {
                const sugg_proj = selec.indexOf('communes_reg') > -1
                  ? ['proj4', 'EPSG:2154']
                  : suggested_projection.get(selec);
                const _fields_type = (selec.indexOf('communes_reg') > -1 || selec.indexOf('commune_dep') > 1)
                  ? fields_type_sample.get('FR_communes')
                  : fields_type_sample.get(selec);
                add_sample_geojson(selec, {
                  target_layer_on_add: target_layer,
                  fields_type: _fields_type,
                  default_projection: sugg_proj,
                });
              }
            } else if (content.attr('id') === 'panel2') {
              const formToSend = new FormData();
              formToSend.append('url', selec_url[1]);
              formToSend.append('layer_name', selec_url[0]);
              xhrequest('POST', '/convert_extrabasemap', formToSend, true)
                .then((data) => {
                  add_layer_topojson(data, { target_layer_on_add: target_layer });
                }, (error) => {
                  display_error_during_computation();
                });
            }
          }, dismiss => { console.log(dismiss); });
      }
    });

  function make_panel2() {
    box_body.selectAll('div').remove();
    content = box_body.append('div').attr('id', 'panel2');
    content.append('h3').html(_tr('app_page.sample_layer_box.subtitle1'));
    content.append('p')
      .append('span')
      .html(_tr('app_page.sample_layer_box.extra_basemaps_info'));
    const select_extrabasemap = content.append('p')
      .insert('select')
      .on('change', function () {
        const id_elem = this.value;
        selec_url = [
          _app.list_extrabasemaps[id_elem][0],
          _app.list_extrabasemaps[id_elem][1],
          id_elem,
        ];
      });
    for (let i = 0, len_i = _app.list_extrabasemaps.length; i < len_i; i++) {
      select_extrabasemap.append('option').attr('value', i).html(_app.list_extrabasemaps[i][0]);
    }
    content.append('p')
      .styles({ margin: 'auto', 'text-align': 'right', cursor: 'pointer' })
      .append('span')
      .html(_tr('app_page.sample_layer_box.back_sample'))
      .on('click', () => {
        make_panel1();
      });
    if (selec_url) {
      setSelected(select_extrabasemap.node(), selec_url[2]);
    } else {
      selec_url = [_app.list_extrabasemaps[0][0], _app.list_extrabasemaps[0][1], 0];
    }
    content.select('#link1').on('click', () => {
      window.open('http://www.naturalearthdata.com', 'Natural Earth', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
    });
    content.select('#link2').on('click', () => {
      window.open('https://github.com/riatelab/basemaps/tree/master/Countries', 'riatelab/basemaps', 'toolbar=yes,menubar=yes,resizable=yes,scrollbars=yes,status=yes').focus();
    });
  }

  function make_panel1() {
    box_body.selectAll('div').remove();
    content = box_body.append('div').attr('id', 'panel1');
    content.append('h3').html(_tr('app_page.sample_layer_box.subtitle1'));

    const t_layer_selec = content.append('p').html('').insert('select').attr('class', 'sample_target');
    target_layers.forEach((layer_info) => { t_layer_selec.append('option').html(layer_info[0]).attr('value', layer_info[1]); });
    t_layer_selec.on('change', function () { selec = this.value; });
    content.append('p')
      .styles({ margin: 'auto', 'text-align': 'right', cursor: 'pointer' })
      .append('span')
      .html(_tr('app_page.sample_layer_box.more_basemaps'))
      .on('click', () => {
        make_panel2();
      });
    if (selec) setSelected(t_layer_selec.node(), selec);
  }

  const box_body = d3.select('.sampleDialogBox').select('.modal-body');
  setTimeout((_) => { document.querySelector('select.sample_target').focus(); }, 500);
  make_panel1();
}

/**
* Helper function to add the 'world' layer (notably added) when the application
* is started.
*
* @return {void}
*/
export function add_simplified_land_layer(options = {}) {
  const skip_rescale = options.skip_rescale || false;
  const stroke = options.stroke || 'rgb(0,0,0)';
  const fill = options.fill || '#d3d3d3';
  const stroke_opacity = options.stroke_opacity || 0.0;
  const fill_opacity = options.fill_opacity || 0.75;
  const stroke_width = options.stroke_width || '0.3px';
  const visible = !(options.visible === false);
  const drop_shadow = options.drop_shadow || false;

  const world_id = encodeId('World');
  _app.layer_to_id.set('World', world_id);
  _app.id_to_layer.set(world_id, 'World');
  data_manager.current_layers.World = {
    type: 'Polygon',
    n_features: 125,
    'stroke-width-const': +stroke_width.slice(0, -2),
    fill_color: { single: fill },
  };
  map.insert('g', '.legend')
    .attrs({ id: world_id, class: 'layer', 'clip-path': 'url(#clip)' })
    .style('stroke-width', stroke_width)
    .selectAll('.subunit')
    .data(topojson.feature(world_topology, world_topology.objects.World).features)
    .enter()
    .append('path')
    .attr('d', path)
    .styles({
      stroke: stroke,
      fill: fill,
      'stroke-opacity': stroke_opacity,
      'fill-opacity': fill_opacity,
    });
  create_li_layer_elem('World', null, 'Polygon', 'sample');
  if (drop_shadow) {
    createDropShadow('World');
  }
  if (!skip_rescale) {
    scale_to_lyr('World');
    center_map('World');
  }
  if (!visible) {
    handle_active_layer('World');
  }
  zoom_without_redraw();
}

function add_sample_geojson(name, options) {
  const formToSend = new FormData();
  formToSend.append('layer_name', name);
  xhrequest('POST', 'sample', formToSend, true)
    .then((data) => {
      add_layer_topojson(data, options);
    }).catch((err) => {
      display_error_during_computation();
      console.log(err);
    });
}

function send_remove_server(layer_name) {
  const formToSend = new FormData();
  formToSend.append('layer_name', data_manager.current_layers[layer_name].key_name);
  xhrequest('POST', 'layers/delete', formToSend, true)
    .then((data) => {
      const parsed = JSON.parse(data);
      if (!parsed.code || parsed.code !== 'Ok') console.log(data);
    }).catch((err) => {
      console.log(err);
    });
}

export function prepare_available_symbols() {
  return xhrequest('GET', 'static/json/list_symbols.json', null)
    .then((result) => {
      const list_res = JSON.parse(result);
      return Promise.all(list_res.map(name => getImgDataUrl(`static/img/svg_symbols/${name}`)))
        .then((symbols) => {
          for (let i = 0; i < list_res.length; i++) {
            default_symbols.push([list_res[i], symbols[i]]);
          }
        });
    });
}

export function accordionize(css_selector = '.accordion', parent) {
  const _parent = parent && typeof parent === 'object' ? parent
          : parent && typeof parent === 'string' ? document.querySelector(parent)
          : document;
  const acc = _parent.querySelectorAll(css_selector);
  for (let i = 0; i < acc.length; i++) {
    acc[i].onclick = function () {
      const opened = _parent.querySelector(`${css_selector}.active`);
      if (opened) {
        opened.classList.toggle('active');
        opened.nextElementSibling.classList.toggle('show');
      }
      if (!opened || opened.id !== this.id) {
        this.classList.toggle('active');
        this.nextElementSibling.classList.toggle('show');
      }
    };
  }
}

function downgradeTargetLayer() {
  const old_target = Object.keys(data_manager.user_data)[0];
  if (!old_target) return;
  delete data_manager.current_layers[old_target].targeted;
  data_manager.field_join_map = [];
  data_manager.user_data = {};
  _app.targeted_layer_added = false;
  _target_layer_file = null;
  resetSection1();
  getAvailablesFunctionnalities();
  const id_lyr = _app.layer_to_id.get(old_target);
  document.querySelector(`.${id_lyr}.sortable_target`).classList.remove('sortable_target');
  return old_target;
}

function changeTargetLayer(new_target) {
  const old_target = downgradeTargetLayer();
  data_manager.current_layers[new_target].targeted = true;
  _app.targeted_layer_added = true;
  data_manager.user_data[new_target] = Array.from(document.querySelector(`#${_app.layer_to_id.get(new_target)}`).querySelectorAll('path')).map(d => d.__data__.properties);
  const fields = Object.keys(data_manager.user_data[new_target][0]);
  update_section1(data_manager.current_layers[new_target].type, fields.length, data_manager.current_layers[new_target].n_features, new_target);
  if (!data_manager.current_layers[new_target].fields_type) {
    data_manager.current_layers[new_target].original_fields = new Set(fields);
  }
  if (!data_manager.current_layers[new_target].fields_type) {
      data_manager.current_layers[new_target].fields_type =  type_col2(data_manager.user_data[new_target]);
  }
  document.getElementById('btn_type_fields').removeAttribute('disabled');
  getAvailablesFunctionnalities(new_target);
  scale_to_lyr(new_target);
  center_map(new_target);
  zoom_without_redraw();

  const id_new_target_lyr = _app.layer_to_id.get(new_target);
  document.querySelector(`#sortable > .${id_new_target_lyr}`).classList.add('sortable_target');

  const d = {};
  d[new_target] = {
    type: 'FeatureCollection',
    features: Array.prototype.slice.call(document.querySelectorAll(`#${id_new_target_lyr} > path`)).map(d => d.__data__),
  };
  window._target_layer_file = topojson.topology(d);

  if (!data_manager.current_layers[new_target].key_name) {
    send_layer_server(new_target, '/layers/add');
  }
}

function resetSection1() {
  // Remove infos and buttons about the target layer:
  d3.select('#target_layer_zone')
    .styles({
      'text-align': 'center',
      border: '3px dashed #ccc',
      padding: '3px',
      color: '#ccc',
    })
    .html('Pas de couche cible');

  // document.getElementById('downgrade_target').remove();
  // document.getElementById('table_layer_s1').remove();
  // document.getElementById('remove_target').remove();

  // // Reactivate the buttons allowing to add a layer by browsing local files:
  // d3.select('#img_in_geom')
  //   .attrs({
  //     id: 'img_in_geom',
  //     class: 'user_panel',
  //     src: 'static/img/b/addgeom.png',
  //     width: '24',
  //     height: '24',
  //     alt: 'Geometry layer',
  //   })
  //   .on('click', click_button_add_layer);
  // d3.select('#input_geom')
  //   .attrs({ class: 'user_panel i18n', 'data-i18n': '[html]app_page.section1.add_geom' })
  //   .html(_tr('app_page.section1.add_geom'))
  //   .on('click', click_button_add_layer);

  // // Redisplay the bottom of the section 1 in the menu allowing user to select a sample layer :
  // document.getElementById('sample_zone').style.display = null;

  // Restore the state of the bottom of the section 1 :
  document.getElementById('join_section').innerHTML = '';

  // Disabled the button allowing the user to choose type for its layer :
  document.getElementById('btn_type_fields').setAttribute('disabled', 'true');

  // Set all the representation modes to "unavailable":
  getAvailablesFunctionnalities();

  // Reset some values stored in the functionnality panel:
  reset_user_values();
}

const beforeUnloadWindow = (event) => {
  get_map_template().then((jsonParams) => {
    window.localStorage.removeItem('magrit_project');
    if (jsonParams.length < 5500000) {
      window.localStorage.setItem('magrit_project', jsonParams);
    }
  });
  // eslint-disable-next-line no-param-reassign
  event.returnValue = (global._app.targeted_layer_added
                          || Object.getOwnPropertyNames(data_manager.result_data).length > 0)
                      ? 'Confirm exit' : undefined;
};

function make_ico_choice() {
  const list_fun_ico = [
    'prop.png',
    'choro.png',
    'typo.png',
    'choroprop.png',
    'proptypo.png',
    'grid.png',
    'cartogram.png',
    'smooth.png',
    'discont.png',
    'typosymbol.png',
    'flow.png',
    'two_stocks.png',
  ];

  const function_panel = section2_pre.append('div')
    .attr('id', 'list_ico_func');

  for (let i = 0, len_i = list_fun_ico.length; i < len_i; i++) {
    const ico_name = list_fun_ico[i],
      func_name = ico_name.split('.')[0],
      func_desc = get_menu_option(func_name).desc,
      margin_value = '5px 16px';
        // margin_value = i == 8 ? '5px 16px 5px 55px' : '5px 16px';
    function_panel
      .insert('img')
      .styles({ margin: margin_value, cursor: 'pointer', width: '50px', float: 'left', 'list-style': 'none' })
      .attrs({
        class: 'i18n tt_func',
        'data-i18n': ['[title]app_page.func_description.', func_name].join(''),
        src: ['static/img/func_icons2/', ico_name].join(''),
        id: `button_${func_name}`,
      })
      .on('click', function () {
        // Do some clean-up related to the previously displayed options :
        if (window.fields_handler) {
          if (this.classList.contains('active')) {
            switch_accordion_section('btn_s2b');
            return;
          }
          clean_menu_function();
        }

        document.getElementById('accordion2b').style.display = '';
        // Get the function to fill the menu with the appropriate options (and do it):
        _app.current_functionnality = get_menu_option(func_name);
        // const make_menu = _app.current_functionnality.menu_factory();
        // make_menu();
        _app.current_functionnality.menu_factory()();
        window.fields_handler = _app.current_functionnality.fields_handler();

        // Replace the title of the section:
        const selec_title = document.getElementById('btn_s2b');
        selec_title.innerHTML = '<span class="i18n" data-i18n="app_page.common.representation">' +
                                _tr('app_page.common.representation') +
                                '</span><span> : </span><span class="i18n" data-i18n="app_page.func_title.' +
                                global._app.current_functionnality.name +
                                '">' +
                                _tr('app_page.func_title.' + global._app.current_functionnality.name) +
                                '</span>';
        selec_title.style.display = '';

        // Don't fill the menu / don't highlight the icon if the type of representation is not authorizhed :
        if (this.style.filter !== 'grayscale(100%)') {
          this.classList.add('active');
          // Highlight the icon of the selected functionnality :
          this.style.filter = 'invert(100%) saturate(200%)';

          // Fill the field of the functionnality with the field
          // of the targeted layer if already uploaded by the user :
          if (global._app.targeted_layer_added) {
            const target_layer = Object.getOwnPropertyNames(data_manager.user_data)[0];
            fields_handler.fill(target_layer);
          }

          // Specific case for flow/link functionnality as we are also
          // filling the fields with data from the uploaded tabular file if any :
          if (func_name === 'flow' && data_manager.joined_dataset) {
            fields_handler.fill();
          }
        }
        switch_accordion_section('btn_s2b');
      });
  }
}

// Function to be called after clicking on "render" in order to close the section 2
// and to have the section 3 opened
export function switch_accordion_section(id_elem) {
  document.getElementById(id_elem || 'btn_s3').dispatchEvent(new MouseEvent('click'));
}


// Function to handle the title add and changes
function handle_title(txt) {
  const title = d3.select('#map_title').select('text');
  if (title.node()) {
    title.text(txt);
  } else {
    map.append('g')
      .attrs({ class: 'legend title', id: 'map_title' })
      .style('cursor', 'pointer')
      .insert('text')
      .attrs({ x: w / 2, y: h / 12, 'alignment-baseline': 'middle', 'text-anchor': 'middle' })
      .styles({ 'font-family': 'verdana', 'font-size': '20px', position: 'absolute', color: 'black' })
      .text(txt)
      .on('contextmenu dblclick', () => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        handle_title_properties();
      })
      .call(drag_elem_geo);
  }
}

function handle_title_properties() {
  const title = d3.select('#map_title').select('text');
  if (!title.node() || title.text() === '') {
    swal({
      title: '',
      text: _tr('app_page.common.error_no_title'),
      type: 'error',
      allowOutsideClick: true,
      allowEscapeKey: true,
    }).then(() => null, () => null);
    return;
  }
  const title_props = {
    size: title.style('font-size'),
    font_weight: title.style('font-weight'),
    font_style: title.style('font-style'),
    text_decoration: title.style('text-decoration'),
    color: title.style('fill'),
    position_x: title.attr('x'),
    position_x_pct: round_value(+title.attr('x') / w * 100, 1),
    position_y: title.attr('y'),
    position_y_pct: round_value(+title.attr('y') / h * 100, 1),
    font_family: title.style('font-family'),
    stroke: title.style('stroke'),
    stroke_width: title.style('stroke-width'),
  };
  title_props.font_weight = (title_props.font_weight === '400' || title_props.font_weight === '') ? '' : 'bold';
  // Font name don't seems to be formatted in the same way on Firefox and Chrome
  // (a space is inserted after the comma in Chrome so we are removing it)
  title_props.font_family = title_props.font_family ? title_props.font_family.replace(', ', ',') : title_props.font_family;

  // Properties on the title are changed in real-time by the user
  // then it will be rollbacked to original properties if Cancel is clicked
  make_confirm_dialog2('mapTitleitleDialogBox', _tr('app_page.title_box.title'), { widthFitContent: true })
    .then((confirmed) => {
      if (!confirmed) {
        title.attrs({ x: title_props.position_x, y: title_props.position_y })
          .styles({
            fill: title_props.color,
            stroke: title_props.stroke,
            'stroke-width': title_props.stroke_width,
            'font-family': title_props.font_family,
            'font-size': title_props.size,
            'font-style': title_props.font_style,
            'font-weight': title_props.font_weight,
            'text-decoration': title_props.text_decoration,
          });
      }
    });
  const box_content = d3.select('.mapTitleitleDialogBox').select('.modal-body').append('div').style('margin', '15x');
  box_content.append('p')
    .html(_tr('app_page.title_box.font_size'))
    .insert('input')
    .attrs({ type: 'number', min: 2, max: 40, step: 1 })
    .property('value', +title_props.size.split('px')[0])
    .style('width', '65px')
    .on('change', function () { title.style('font-size', `${this.value}px`); });
  box_content.append('p')
    .html(_tr('app_page.title_box.xpos'))
    .insert('input')
    .attrs({ type: 'number', min: 0, max: 100, step: 1 })
    .property('value', title_props.position_x_pct)
    .style('width', '65px')
    .on('change', function () { title.attr('x', w * +this.value / 100); });
  box_content.append('p')
    .html(_tr('app_page.title_box.ypos'))
    .insert('input')
    .attrs({ type: 'number', min: 0, max: 100, step: 1  })
    .property('value', title_props.position_y_pct)
    .style('width', '65px')
    .on('change', function () { title.attr('y', h * +this.value / 100); });
  box_content.append('p').html(_tr('app_page.title_box.font_color'))
    .insert('input')
    .attr('type', 'color')
    .property('value', rgb2hex(title_props.color))
    .on('change', function () { title.style('fill', this.value); });

  const font_select = box_content.append('p')
    .html(_tr('app_page.title_box.font_family'))
    .insert('select').attr('class', 'params')
    .on('change', function () { title.style('font-family', this.value); });
  available_fonts.forEach((font) => {
    font_select.append('option').text(font[0]).attr('value', font[1]);
  });
  font_select.node().selectedIndex = available_fonts.map(d => (d[1] === title_props.font_family ? '1' : '0')).indexOf('1');

  const options_format = box_content.append('p'),
    btn_bold = options_format.insert('span').attr('class', title_props.font_weight === 'bold' ? 'active button_disc' : 'button_disc').html('<img title="Bold" src="data:image/gif;base64,R0lGODlhFgAWAID/AMDAwAAAACH5BAEAAAAALAAAAAAWABYAQAInhI+pa+H9mJy0LhdgtrxzDG5WGFVk6aXqyk6Y9kXvKKNuLbb6zgMFADs=">'),
    btn_italic = options_format.insert('span').attr('class', title_props.font_style === 'italic' ? 'active button_disc' : 'button_disc').html('<img title="Italic" src="data:image/gif;base64,R0lGODlhFgAWAKEDAAAAAF9vj5WIbf///yH5BAEAAAMALAAAAAAWABYAAAIjnI+py+0Po5x0gXvruEKHrF2BB1YiCWgbMFIYpsbyTNd2UwAAOw==">'),
    btn_underline = options_format.insert('span').attr('class', title_props.text_decoration === 'underline' ? 'active button_disc' : 'button_disc').html('<img title="Underline" src="data:image/gif;base64,R0lGODlhFgAWAKECAAAAAF9vj////////yH5BAEAAAIALAAAAAAWABYAAAIrlI+py+0Po5zUgAsEzvEeL4Ea15EiJJ5PSqJmuwKBEKgxVuXWtun+DwxCCgA7">');

  btn_bold.on('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      title.style('font-weight', '');
    } else {
      this.classList.add('active');
      title.style('font-weight', 'bold');
    }
  });
  btn_italic.on('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      title.style('font-style', '');
    } else {
      this.classList.add('active');
      title.style('font-style', 'italic');
    }
  });
  btn_underline.on('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      title.style('text-decoration', '');
    } else {
      this.classList.add('active');
      title.style('text-decoration', 'underline');
    }
  });

  const hasBuffer = title_props.stroke !== 'none';
  const buffer_section1 = box_content.append('p');
  const buffer_section2 = box_content.append('p').style('display', hasBuffer ? '' : 'none');
  box_content.append('p').style('clear', 'both');

  buffer_section1.append('input')
    .attrs({ type: 'checkbox', id: 'title_buffer_chkbox', checked: hasBuffer ? true : null })
    .on('change', function () {
      if (this.checked) {
        buffer_section2.style('display', '');
        title.style('stroke', buffer_color.node().value)
          .style('stroke-width', `${buffer_width.node().value}px`);
      } else {
        buffer_section2.style('display', 'none');
        title.style('stroke', 'none')
          .style('stroke-width', '1px');
      }
    });

  buffer_section1.append('label')
    .attrs({ for: 'title_buffer_chkbox' })
    .text(_tr('app_page.title_box.buffer'));

  let buffer_color = buffer_section2.insert('input')
    .style('float', 'left')
    .attrs({ type: 'color' })
    .property('value', hasBuffer ? rgb2hex(title_props.stroke) : '#ffffff')
    .on('change', function () {
      title.style('stroke', this.value);
    });

  buffer_section2.insert('span')
    .style('float', 'right')
    .html(' px');

  let buffer_width = buffer_section2.insert('input')
    .styles({ float: 'right', width: '60px' })
    .attrs({ type: 'number', step: '0.1' })
    .property('value', hasBuffer ? +title_props.stroke_width.replace('px', '') : 1)
    .on('change', function () {
      title.style('stroke-width', `${this.value}px`);
    });
}

/** Function triggered by the change of map/canvas size
* @param {Array} shape - An Array of two elements : [width, height] to use;
*                generally only used once at the time so `shape` values
*                are like [null, 750] or [800, null]
*                but also works with the 2 params together like [800, 750])
*/
export function canvas_mod_size(shape) {
  if (shape[0]) {
    w = +shape[0];
    map.attr('width', w)
      .call(zoom_without_redraw);
    map_div.style('width', `${w}px`);
    if (w + 360 + 33 < window.innerWidth) {
      document.querySelector('.light-menu').style.right = '-33px';
    } else {
      document.querySelector('.light-menu').style.right = '0px';
    }
  }
  if (shape[1]) {
    h = +shape[1];
    map.attr('height', h)
      .call(zoom_without_redraw);
    map_div.style('height', `${h}px`);
  }
  move_legends();

  // Lets update the corresponding fields in the export section :
  let ratio;
  const format = document.getElementById('select_png_format').value;
  if (format === 'web') {
    ratio = 1;
  } else if (format === 'user_defined') {
    ratio = 118.11;
  } else {
    return;
  }
  const zoom_params = svg_map.__zoom;
  document.getElementById('export_png_width').value = Mround(w * ratio * 10) / 10;
  document.getElementById('export_png_height').value = Mround(h * ratio * 10) / 10;
  document.getElementById('input-width').value = w;
  document.getElementById('input-height').value = h;
}

function fill_export_png_options(displayed_ratio) {
  const select_size_png = d3.select('#select_png_format');
  select_size_png.selectAll('option').remove();

  select_size_png.append('option')
    .attrs({ value: 'web', class: 'i18n', 'data-i18n': '[text]app_page.section5b.web' });
  select_size_png.append('option')
    .attrs({ value: 'user_defined', class: 'i18n', 'data-i18n': '[text]app_page.section5b.user_defined' });

  if (displayed_ratio === 'portrait') {
    select_size_png.append('option')
      .attrs({ value: 'A5_portrait', class: 'i18n', 'data-i18n': '[text]app_page.section5b.A5_portrait' });
    select_size_png.append('option')
      .attrs({ value: 'A4_portrait', class: 'i18n', 'data-i18n': '[text]app_page.section5b.A4_portrait' });
    select_size_png.append('option')
      .attrs({ value: 'A3_portrait', class: 'i18n', 'data-i18n': '[text]app_page.section5b.A3_portrait' });
  } else if (displayed_ratio === 'landscape') {
    select_size_png.append('option')
      .attrs({ value: 'A5_landscape', class: 'i18n', 'data-i18n': '[text]app_page.section5b.A5_landscape' });
    select_size_png.append('option')
      .attrs({ value: 'A4_landscape', class: 'i18n', 'data-i18n': '[text]app_page.section5b.A4_landscape' });
    select_size_png.append('option')
      .attrs({ value: 'A3_landscape', class: 'i18n', 'data-i18n': '[text]app_page.section5b.A3_landscape' });
  }
  localize('#select_png_format > .i18n');
}

// Function to display information on the top layer (in the layer manager)
export function displayInfoOnMove() {
  const info_features = d3.select('#info_features');
  if (info_features.classed('active')) {
    map.selectAll('.layer').selectAll('path').on('mouseover', null);
    map.selectAll('.layer').selectAll('circle').on('mouseover', null);
    map.selectAll('.layer').selectAll('rect').on('mouseover', null);
    info_features.classed('active', false);
    info_features.style('display', 'none').html('');
    d3.select('#info_button').classed('active', false);
    svg_map.style.cursor = '';
  } else {
    map.select('.brush').remove();
    d3.select('#brush_zoom_button').classed('active', false);
    const layers = svg_map.querySelectorAll('.layer'),
      nb_layer = layers.length;
    let top_visible_layer = null;

    for (let i = nb_layer - 1; i > -1; i--) {
      if (layers[i].style.visibility !== 'hidden') {
        top_visible_layer = global._app.id_to_layer.get(layers[i].id);
        break;
      }
    }

    if (!top_visible_layer) {
      swal('', _tr('app_page.common.error_no_visible'), 'error');
      return;
    }

    const id_top_layer = `#${global._app.layer_to_id.get(top_visible_layer)}`;
    const symbol = data_manager.current_layers[top_visible_layer].symbol || 'path';

    map.select(id_top_layer).selectAll(symbol).on('mouseover', (d, i) => {
      const txt_info = [
        '<h3>', top_visible_layer, '</h3><i>Feature ',
        i + 1, '/', data_manager.current_layers[top_visible_layer].n_features, '</i><p>'];
      const properties = data_manager.result_data[top_visible_layer] ? data_manager.result_data[top_visible_layer][i] : d.properties;
      Object.getOwnPropertyNames(properties).forEach((el) => {
        txt_info.push(`<br><b>${el}</b> : ${properties[el]}`);
      });
      txt_info.push('</p>');
      info_features.style('display', null).html(txt_info.join(''));
    });

    map.select(id_top_layer).selectAll(symbol).on('mouseout', () => {
      info_features.style('display', 'none').html('');
    });

    info_features.classed('active', true);
    svg_map.style.cursor = 'help';
    d3.select('#info_button').classed('active', true);
  }
}

// Function to switch the visibility of a layer the open/closed eye button
function handle_active_layer(name) {
  let fill_value,
    parent_div,
    selec,
    at_end;

  if (document.getElementById('info_features').className === 'active') {
    displayInfoOnMove();
    at_end = true;
  }
  if (!name) {
    selec = this;
    parent_div = selec.parentElement;
    name = parent_div.parentElement.getAttribute('layer_name'); // eslint-disable-line no-param-reassign
  } else {
    selec = document.querySelector(`#sortable .${global._app.layer_to_id.get(name)} .active_button`);
    parent_div = selec.parentElement;
  }
  const func = () => { handle_active_layer(name); };
  if (selec.id === 'eye_closed') {
    fill_value = 1;
    const eye_open = make_eye_button('open');
    eye_open.onclick = func;
    parent_div.replaceChild(eye_open, selec);
  } else {
    fill_value = 0;
    const eye_closed = make_eye_button('closed');
    eye_closed.onclick = func;
    parent_div.replaceChild(eye_closed, selec);
  }
  map.select(`#${global._app.layer_to_id.get(name)}`)
    .style('visibility', fill_value === 0 ? 'hidden' : 'initial');
  map.selectAll(`.lgdf_${global._app.layer_to_id.get(name)}`)
    .style('visibility', fill_value === 0 ? 'hidden' : 'initial');

  if (at_end) {
    displayInfoOnMove();
  }
}

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


// Wrapper to obtain confirmation before actually removing a layer :
function remove_layer(name) {
  // eslint-disable-next-line no-param-reassign
  name = name || this.parentElement.parentElement.getAttribute('layer_name');
  swal({
    title: '',
    text: _tr('app_page.common.remove_layer', { layer: name }),
    type: 'warning',
    customClass: 'swal2_custom',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: `${_tr('app_page.common.delete')}!`,
    cancelButtonText: _tr('app_page.common.cancel'),
  }).then(() => { remove_layer_cleanup(name); },
          () => null);
  // ^^^^^^^^^^^^ Do nothing on cancel, but this avoid having an "uncaught exeption (cancel)" comming in the console if nothing is set here
              //  ^^^^^^^^^^^^^^^^^^^^^^^ Not sure anymore :/
}

function remove_ext_dataset() {
  swal({
    title: '',
    text: _tr('app_page.common.remove_tabular'),
    type: 'warning',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: `${_tr('app_page.common.delete')}!`,
    cancelButtonText: _tr('app_page.common.cancel'),
  }).then(() => {
    remove_ext_dataset_cleanup();
  }, () => null);
}

function remove_ext_dataset_cleanup() {
  data_manager.field_join_map = [];
  data_manager.joined_dataset = [];
  data_manager.dataset_name = undefined;
  d3.select('#ext_dataset_zone')
    .styles({
      border: '3px dashed #ccc',
      color: 'rgb(204, 204, 204)',
      padding: '3px',
      'text-align': 'center',
    })
    .html('Pas de jeu de donnée externe');
  document.getElementById('join_section').innerHTML = '';
}

// Do some clean-up when a layer is removed
// Most of the job is to do when it's the targeted layer which is removed in
// order to restore functionnalities to their initial states
export function remove_layer_cleanup(name) {
  if (!data_manager.current_layers[name]) return;
  const layer_id = global._app.layer_to_id.get(name);
  // Making some clean-up regarding the result layer :
  if (data_manager.current_layers[name].is_result) {
    map.selectAll(['.lgdf_', layer_id].join('')).remove();
    if (data_manager.result_data.hasOwnProperty(name)) {
      delete data_manager.result_data[name];
    }
    if (data_manager.current_layers[name].hasOwnProperty('key_name')
         && data_manager.current_layers[name].renderer.indexOf('Choropleth') < 0
         && data_manager.current_layers[name].renderer.indexOf('Categorical') < 0) {
      send_remove_server(name);
    }
  }
  // Is the layer using a filter ? If yes, remove it:
  const filter_id = map.select(`#${layer_id}`).attr('filter');
  if (filter_id) {
    svg_map.querySelector(filter_id.substr(4).replace(')', '')).remove();
  }

  // Remove the layer from the map and from the layer manager :
  map.select(`#${layer_id}`).remove();
  document.querySelector(`#sortable .${layer_id}`).remove();

  // Remove the layer from the "geo export" menu :
  const a = document.getElementById('layer_to_export').querySelector(`option[value="${name}"]`);
  if (a) a.remove();

  // Remove the layer from the "mask" section if the "smoothed map" menu is open :
  if (global._app.current_functionnality && (
      global._app.current_functionnality.name === 'smooth' || global._app.current_functionnality.name === 'grid')) {
    Array.prototype.slice.call(document.querySelectorAll('.mask_field'))
      .forEach((elem) => {
        const aa = elem.querySelector(`option[value="${name}"]`);
        if (aa) aa.remove();
      });
  }

  // Reset the panel displaying info on the targeted layer if she"s the one to be removed :
  if (data_manager.current_layers[name].targeted) {
    // Unfiling the fields related to the targeted functionnality:
    if (global._app.current_functionnality) {
      clean_menu_function();
    }

    // Update some global variables :
    data_manager.field_join_map = [];
    data_manager.user_data = {};
    global._app.targeted_layer_added = false;

    // Updating the top of the menu (section 1) :
    resetSection1();

    // Reset the projection (if the projection was defined via proj4):
    if (_app.current_proj_name === 'def_proj4') {
      _app.current_proj_name = 'NaturalEarth2';
      change_projection(_app.current_proj_name);
      addLastProjectionSelect(_app.current_proj_name);
    }
  }

  // There is probably better ways in JS to delete the object,
  // but in order to make it explicit that we are removing it :
  delete data_manager.current_layers[name];
}


// To bind the set of small buttons
// (trash icon, paint icon, active/deactive visibility, info tooltip, etc..)
// which are on each feature representing a layer in the layer manager
// (the function is called each time that a new feature is put in this layer manager)
export function binds_layers_buttons(layer_name) {
  const layer_id = global._app.layer_to_id.get(layer_name);
  const sortable_elem = d3.select('#sortable').select(`.${layer_id}`);
  sortable_elem.on('dblclick', () => { handle_click_layer(layer_name); });
  sortable_elem.on('contextmenu', () => { d3.event.preventDefault(); });
  sortable_elem.select('#trash_button').on('click', () => { remove_layer(layer_name); });
  sortable_elem.select('.active_button').on('click', () => { handle_active_layer(layer_name); });
  sortable_elem.select('.style_button').on('click', () => { handle_click_layer(layer_name); });
  sortable_elem.select('.style_target_layer').on('click', () => { handle_click_layer(layer_name); });
  sortable_elem.select('#legend_button').on('click', () => { handle_legend(layer_name); });
  sortable_elem.select('#browse_data_button').on('click', () => { boxExplore2.create(layer_name); });
  sortable_elem.select('#replace_button').on('click', () => { changeTargetLayer(layer_name); });
  sortable_elem.select('#zoom_fit_button').on('click', () => {
    center_map(layer_name);
    zoom_without_redraw();
  });
  // TODO : re-add a tooltip when the mouse is over that sortable element ?
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
