import { handle_upload_files } from './../interface';
import { make_box_type_fields, prepareFileExt } from './../helpers';
import { add_sample_layer } from './../layers';

/**
* Function triggered when some images of the interface are clicked
* in order to create an <input> element, simulate a click on it, let the user
* browse its file and dispatch the files to the appropriate handler according
* to the file type
*/
function click_button_add_layer() {
  const self = this;
  const input = document.createElement('input');

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


export default function makeSection1() {
  const section1 = d3.select('#menu').select('#section1');

  const dv1 = section1.append('div');
  // Section for current target layer:
  dv1.append('div')
    .attr('id', 'target_layer_zone')
    .styles({
      'text-align': 'center',
      'margin-bottom': '3px',
      border: '3px dashed #ccc',
      padding: '3px',
      color: '#ccc'
    })
    .html('Pas de couche cible');

  // Section for current dataset:
  dv1.append('div')
    .attr('id', 'ext_dataset_zone')
    .styles({
      'text-align': 'center',
      'margin-bottom': '3px',
      border: '3px dashed #ccc',
      padding: '3px',
      color: '#ccc',
    })
    .html('Pas de jeu de donnée externe');

  // Section about joining target layer and external dataset:
  dv1.append('p')
    .attr('id', 'join_section')
    .styles({ 'text-align': 'center', 'margin-top': '2px' })
    .html('');

  dv1.append('hr').style('border-top', '2px #ccc');

  const dv11 = dv1.append('div').style('width', 'auto');

  dv11.append('img')
    .attrs({ id: 'img_in_geom', src: 'static/img/b/addgeom.png', width: '25', height: '25', alt: 'Geometry layer' })
    .style('cursor', 'pointer')
    .on('click', click_button_add_layer);

  dv11.append('p')
    .attrs({ id: 'input_geom', class: 'i18n' })
    .styles({
      cursor: 'pointer',
      display: 'inline',
      'font-weight': 'bold',
      'margin-left': '4px',
      'vertical-align': 'super',
    })
    .attr('data-i18n', '[html]app_page.section1.add_geom')
    .on('click', click_button_add_layer);

  const dv12 = dv1.append('div');
  dv12.append('img')
    .attrs({ id: 'img_data_ext', src: 'static/img/b/addtabular.png', width: '25', height: '25', alt: 'Additional dataset' })
    .style('cursor', 'pointer')
    .on('click', click_button_add_layer);

  dv12.append('p')
    .attrs({ id: 'data_ext', class: 'i18n', 'data-i18n': '[html]app_page.section1.add_ext_dataset' })
    .styles({ display: 'inline', cursor: 'pointer', 'margin-left': '4px', 'vertical-align': 'super', 'font-weight': 'bold' })
    .on('click', click_button_add_layer);

  const div_sample = dv1.append('div').attr('id', 'sample_zone');
  div_sample.append('img')
    .attrs({ id: 'sample_button', src: 'static/img/b/addsample.png', width: '25', height: '25', alt: 'Sample layers' })
    .style('cursor', 'pointer')
    .on('click', add_sample_layer);

  div_sample.append('span')
    .attrs({
      id: 'sample_link',
      class: 'i18n',
      'data-i18n': '[html]app_page.section1.add_sample_data',
    })
    .styles({
      display: 'inline',
      cursor: 'pointer',
      'margin-left': '4px',
      'vertical-align': 'super',
      'font-weight': 'bold',
    })
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
}
