'use strict';
////////////////////////////////////////////////////////////////////////
// Browse and upload buttons + related actions (conversion + displaying)
////////////////////////////////////////////////////////////////////////

/**
* Maxium allowed input size in bytes. If the input file is larger than
* this size, the user will receive an alert.
* In the case of sending multiple files unziped, this limit corresponds
* to the sum of the size of each file.
*/
const MAX_INPUT_SIZE = 27300000;

/**
* Function triggered when some images of the interface are clicked
* in order to create an <input> element, simulate a click on it, let the user
* browse its file and dispatch the files to the appropriate handler according
* to the file type
*/
function click_button_add_layer() {
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
  const opts = { target: i18next.t('app_page.common.target_l'), layout: i18next.t('app_page.common.layout_l') };
  let first_reject = false;
  return swal({
    title: '',
    text: i18next.t('app_page.common.layer_type_selection'),
    type: 'info',
    showCancelButton: true,
    showCloseButton: false,
    allowEscapeKey: true,
    allowOutsideClick: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: i18next.t('app_page.common.confirm'),
    input: 'select',
    inputPlaceholder: i18next.t('app_page.common.layer_type_selection'),
    inputOptions: opts,
    inputValidator: (value) => {
      return new Promise(function (resolve, reject) {
        if (value.indexOf('target') < 0 && value.indexOf('layout') < 0) {
          reject(i18next.t('app_page.common.no_value'));
        } else if (value.indexOf('target') > -1 && _app.targeted_layer_added && !first_reject) {
          first_reject = true;
          reject(i18next.t('app_page.common.ask_replace_target_layer'));
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
      title: `${i18next.t('app_page.common.error')}!`,
      text: i18next.t('app_page.common.too_large_input'),
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
        title: `${i18next.t('app_page.common.error')}!`,
        text: i18next.t('app_page.common.alert_upload1'),
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
            title: `${i18next.t('app_page.common.error')}!`,
            text: i18next.t('app_page.common.alert_upload_invalid'),
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
            title: `${i18next.t('app_page.common.error')}!`,
            text: i18next.t('app_page.common.alert_upload_invalid'),
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
        title: `${i18next.t('app_page.common.error')}!`,
        text: i18next.t('app_page.common.alert_upload_shp'),
        type: 'error',
        customClass: 'swal2_custom',
        allowOutsideClick: false,
        allowEscapeKey: false
      })
      .then(valid => null, dismiss => null);
    } else {
      return swal({
        title: `${i18next.t('app_page.common.error')}!`,
        text: i18next.t('app_page.common.alert_upload_invalid'),
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
          `<strong>${i18next.t('app_page.common.shp_one_by_one_msg1')}</strong><br>` +
          `<p style="margin:auto;">${i18next.t('app_page.common.shp_one_by_one_msg2', { name: name })}</p>` +
          `<p><i>${i18next.t('app_page.common.shp_one_by_one_msg3')}</i></p><br>` +
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
    confirmButtonText: i18next.t('app_page.common.confirm'),
    preConfirm: () => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!((shp_slots.size === 4 && !shp_slots.has('.cpg')) || shp_slots.size === 5)) {
          reject(i18next.t('app_page.common.shp_one_by_one_missing_files'));
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
          title: `${i18next.t('app_page.common.error')}!`,
          text: i18next.t('app_page.common.too_large_input'),
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
function prepare_drop_section() {
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
              e.preventDefault(); e.stopPropagation();
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
          const overlay_drop = document.getElementById('overlay_drop');
          overlay_drop.style.display = '';
          const files = prepareFileExt(e.dataTransfer.files);
          if (files.length === 1
              && (files[0]._ext === 'shp' || files[0]._ext === 'dbf' || files[0]._ext === 'shx' || files[0]._ext === 'prj' || files[0]._ext === 'cpg')) {
            Array.prototype.forEach.call(document.querySelectorAll('#map,.overlay_drop'), (_elem) => {
              _elem.removeEventListener('drop', _drop_func);
            });
            handleOneByOneShp(files);
          } else {
            handle_upload_files(files, null);
          }
        });
    });

  // Array.prototype.forEach.call(
  //   document.querySelectorAll('#section1,#section3'),
  //   (elem) => {
  //     elem.addEventListener('dragenter', (e) => {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       if (document.body.classList.contains('no-drop')) return;
  //       elem.style.border = '3px dashed green';
  //     });
  //     elem.addEventListener('dragover', (e) => {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       if (document.body.classList.contains('no-drop')) return;
  //       elem.style.border = '3px dashed green';
  //     });
  //     elem.addEventListener('dragleave', (e) => {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       elem.style.border = '';
  //       if (document.body.classList.contains('no-drop')) {
  //         document.body.classList.remove('no-drop');
  //       }
  //     });
  //     elem.addEventListener('drop', (e) => {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       if (!e.dataTransfer.files.length) {
  //         elem.style.border = '';
  //         return;
  //       }
  //       const files = prepareFileExt(e.dataTransfer.files),
  //         target_layer_on_add = (elem.id === 'section1');
  //       if (files.length === 1
  //             && (files[0]._ext === 'shp' || files[0]._ext === 'dbf' || files[0]._ext === 'shx' || files[0]._ext === 'prj' || files[0]._ext === 'cpg')) {
  //         handleOneByOneShp(files, target_layer_on_add);
  //       } else {
  //         handle_upload_files(files, target_layer_on_add, elem);
  //       }
  //     }, true);
  //   });
}

function ask_replace_dataset() {
  return swal({
    title: '',
    text: i18next.t('app_page.common.ask_replace_dataset'),
    type: 'warning',
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: i18next.t('app_page.common.confirm'),
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
          text: i18next.t('app_page.common.warn_xls_sheet') + (data.message ? '\n' + i18next.t(data.message[0], { sheet_name: data.message[1][0] }) : ''),
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
          dataset_name = data.name;
          add_dataset(tmp_dataset);
        }, dismiss => null);
      }, (error) => {
        display_error_during_computation();
      });
  };

  if (joined_dataset.length !== 0) {
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
      current_layers[layer_name].key_name = key;
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
                title: `${i18next.t('app_page.common.error')}!`,
                text: i18next.t('app_page.common.error_only_one'),
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
        dataset_name = name.substring(0, name.indexOf('.csv'));
        add_dataset(tmp_dataset);
      };
      new_reader.readAsText(f, encoding);
    };
    reader.readAsBinaryString(f);
  };

  if (joined_dataset.length !== 0) {
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
//                             swal({title: i18next.t("app_page.common.error") + "!",
//                                   text: i18next.t('app_page.common.error_only_one'),
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
//                 dataset_name = f.name.substring(0, f.name.indexOf('.csv'));
//                 add_dataset(tmp_dataset);
//             }
//         });
//     }
//
//     if(joined_dataset.length !== 0){
//         ask_replace_dataset().then(() => {
//             remove_ext_dataset_cleanup();
//             box_dataset();
//           }, () => { null; });
//     } else {
//         box_dataset();
//     }
// }

function update_menu_dataset() {
  const d_name = dataset_name.length > 20 ? [dataset_name.substring(0, 17), '(...)'].join('') : dataset_name,
    nb_features = joined_dataset[0].length,
    field_names = Object.getOwnPropertyNames(joined_dataset[0][0]),
    data_ext = document.getElementById('ext_dataset_zone'),
    parent_elem = data_ext.parentElement;

  d3.select('#ext_dataset_zone')
    .styles({
      'text-align': 'center',
      border: null,
      padding: null,
      color: 'black',
    })
    .html([
      '<img id="img_data_ext" class="user_panel" src="static/img/b/tabular.png" width="26" height="26" alt="Additional dataset"></img>',
      ' <b>', d_name, '</b> - <i><span style="font-size:9px;">',
      nb_features, ' ', i18next.t('app_page.common.feature', { count: +nb_features }), ' - ',
      field_names.length, ' ', i18next.t('app_page.common.field', { count: +field_names.length }), '</i></span>',
      '<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_dataset" style="float:right;margin-top:10px;opacity:0.5">',
      '<img width="14" height="14" src="static/img/dataset.png" id="table_dataset_s1" style="float:right;margin:10px 5px 0 0;opacity:1">'].join(''))
  //   .attrs({
  //     id: 'img_data_ext',
  //     class: 'user_panel',
  //     src: 'static/img/b/tabular.png',
  //     width: '26',
  //     height: '26',
  //     alt: 'Additional dataset' });
  //
  // data_ext.classList.remove('i18n');
  // data_ext.removeAttribute('data-i18n');
//   d3.select(data_ext)
//     .html([' <b>', d_name, '</b> - <i><span style="font-size:9px;">',
//       nb_features, ' ', i18next.t('app_page.common.feature', { count: +nb_features }), ' - ',
//       field_names.length, ' ', i18next.t('app_page.common.field', { count: +field_names.length }),
//       '</i></span>'].join(''))
//     .on('click', null);
//   parent_elem.innerHTML += `<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_dataset" style="float:right;margin-top:10px;opacity:0.5">
// <img width="14" height="14" src="static/img/dataset.png" id="table_dataset_s1" style="float:right;margin:10px 5px 0 0;opacity:1">`;

  document.getElementById('remove_dataset').onclick = () => {
    remove_ext_dataset();
  };
  document.getElementById('remove_dataset').onmouseover = function () {
    this.style.opacity = 1;
  };
  document.getElementById('remove_dataset').onmouseout = function () {
    this.style.opacity = 0.5;
  };
  if (_app.targeted_layer_added) {
    valid_join_check_display(false);
  }
  document.getElementById('table_dataset_s1').onclick = () => {
    boxExplore2.create(dataset_name);
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
  joined_dataset.push(readed_dataset);

  update_menu_dataset();

  if (_app.current_functionnality && _app.current_functionnality.name === 'flow') {
    fields_handler.fill();
  }

  if (_app.targeted_layer_added) {
    const layer_name = Object.getOwnPropertyNames(user_data)[0];
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
      dataset_name = undefined;
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
  const _lyr_name_display = +nb_char_display > 23 ? [lyr_name_to_add.substring(0, 18), '(...)'].join('') : lyr_name_to_add;

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
    .html(`
<img src="${_button}" width="26" height="26"></img>
<b>${_lyr_name_display}</b> - <i><span style="font-size:9px;">${nb_ft} ${i18next.t('app_page.common.feature', { count: +nb_ft })} - ${nb_fields} ${i18next.t('app_page.common.field', { count: +nb_fields })}</i></span>
<img width="13" height="13" src="static/img/Trash_font_awesome.png" id="remove_target" style="float:right;margin-top:10px;opacity:0.5">
<img width="14" height="14" src="static/img/dataset.png" id="table_layer_s1" style="float:right;margin:10px 5px 0 0;opacity:1">
<img width="14" height="14" src="static/img/replace_target_layer.svg" id="downgrade_target" style="float: right;margin:10px 5px 0 0;opacity: 1;">`)

  const remove_target = document.getElementById('remove_target');
  remove_target.onclick = () => { remove_layer(Object.getOwnPropertyNames(user_data)[0]); };
  remove_target.onmouseover = function () { this.style.opacity = 1; };
  remove_target.onmouseout = function () { this.style.opacity = 0.5; };
  const table_target = document.getElementById('table_layer_s1');
  table_target.onclick = display_table_target_layer;
  const downgrade_target = document.getElementById('downgrade_target');
  downgrade_target.onclick = downgradeTargetLayer;
}

function get_display_name_on_layer_list(layer_name_to_add) {
  return +layer_name_to_add.length > 40
      ? [layer_name_to_add.substring(0, 37), '(...)'].join('')
      : layer_name_to_add;
}

function ask_replace_target_layer() {
  return swal({
      title: '',
      text: i18next.t('app_page.join_box.before_join_ask'),
      allowOutsideClick: false,
      allowEscapeKey: true,
      type: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: i18next.t('app_page.common.yes'),
      cancelButtonText: i18next.t('app_page.common.no'),
    });
}

function ask_join_now(layer_name, on_add = 'layer') {
  swal({
    title: '',
    text: i18next.t('app_page.join_box.before_join_ask'),
    allowOutsideClick: false,
    allowEscapeKey: true,
    type: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: i18next.t('app_page.common.yes'),
    cancelButtonText: i18next.t('app_page.common.no'),
  }).then(() => {
    createJoinBox(layer_name);
  }, (dismiss) => {
    if (on_add === 'layer') make_box_type_fields(layer_name);
  });
}

function ask_existing_feature(feature_name) {
  return swal({
    title: '',
    text: i18next.t(`app_page.common.error_existing_${feature_name}`),
    allowOutsideClick: false,
    allowEscapeKey: false,
    type: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: i18next.t('app_page.common.yes'),
    cancelButtonText: i18next.t('app_page.common.no'),
  });
}

const display_table_target_layer = () => {
  const layer_name = Object.keys(user_data)[0];
  boxExplore2.create(layer_name);
};

function updateLayer(layer_name) {
  const fields = Object.keys(user_data[layer_name][0]);
  current_layers[layer_name].n_features = user_data[layer_name].length;
  current_layers[layer_name].original_fields = new Set(fields);
  const lyr_id = _app.layer_to_id.get(layer_name);
  const k = Object.keys(_target_layer_file.objects)[0];
  const selection = map.select(`#${lyr_id}`)
    .selectAll('path')
    .data(topojson.feature(_target_layer_file, _target_layer_file.objects[k]).features, d => d.id);
  selection.exit().remove();
  scale_to_lyr(layer_name);
  center_map(layer_name);
  zoom_without_redraw();
  update_section1(current_layers[layer_name].type, fields.length, current_layers[layer_name].n_features, layer_name);
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
function add_layer_topojson(text, options = {}) {
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
    swal('', i18next.t('app_page.common.warning_multiple_layers'), 'warning');
  }

  // Abort if the layer is empty (doesn't contains any feature)
  if (!topoObj_objects.geometries || topoObj_objects.geometries.length === 0) {
    display_error_during_computation(i18next.t('app_page.common.error_invalid_empty'));
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
    display_error_during_computation(i18next.t('app_page.common.error_invalid_empty'));
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

  current_layers[lyr_name_to_add] = {
    type: type,
    n_features: nb_ft,
    'stroke-width-const': type === 'Line' ? 1.5 : 0.4,
    fill_color: { single: random_color1 },
    key_name: parsedJSON.key,
  };

  if (target_layer_on_add) {
    current_layers[lyr_name_to_add].targeted = true;
    user_data[lyr_name_to_add] = [];
    data_to_load = true;
    current_layers[lyr_name_to_add].fields_type = [];
  } else if (result_layer_on_add) {
    result_data[lyr_name_to_add] = [];
    current_layers[lyr_name_to_add].is_result = true;
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
      user_data[lyr_name_to_add].push(d.properties);
    } else if (data_to_load) {
      d.properties.id = d.id = ix; // eslint-disable-line no-param-reassign, no-multi-assign
      user_data[lyr_name_to_add].push({ id: d.properties.id });
    } else if (result_layer_on_add) {
      result_data[lyr_name_to_add].push(d.properties);
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
    current_layers[lyr_name_to_add].original_fields = new Set(Object.getOwnPropertyNames(user_data[lyr_name_to_add][0]));
    if (joined_dataset.length !== 0) {
      valid_join_check_display(false);
    }

    // document.getElementById('sample_zone').style.display = 'none';

    update_section1(type, nb_fields, nb_ft, lyr_name_to_add);
    _app.targeted_layer_added = true;
    li.innerHTML = [_lyr_name_display_menu, '<div class="layer_buttons">', button_trash, sys_run_button_t2, button_replace, button_zoom_fit, button_table, eye_open0, button_type.get(type), '</div>'].join('');

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
    li.innerHTML = [_lyr_name_display_menu, '<div class="layer_buttons">', button_trash, sys_run_button_t2, button_replace, button_zoom_fit, button_table, eye_open0, button_legend, button_result_type.get(options.func_name), '</div>'].join('');
    // Don't fit the viewport on the added layer if it's a result layer (or uncomment following lines..)
    // if (!skip_rescale) {
    //   center_map(lyr_name_to_add);
    // }
  } else {
    li.innerHTML = [_lyr_name_display_menu, '<div class="layer_buttons">', button_trash, sys_run_button_t2, button_replace, button_zoom_fit, button_table, eye_open0, button_type.get(type), '</div>'].join('');
  }

  if (!target_layer_on_add && _app.current_functionnality !== undefined
      && (_app.current_functionnality.name === 'smooth' || _app.current_functionnality.name === 'grid')) {
    fields_handler.fill();
  }
  // if (!target_layer_on_add && _app.current_functionnality !== undefined && _app.current_functionnality.name === 'smooth') {
  //   fields_handler.fill();
  // }

  if (type === 'Point') {
    current_layers[lyr_name_to_add].pointRadius = options.pointRadius || path.pointRadius();
  }

  layers_listed.insertBefore(li, layers_listed.childNodes[0]);
  handleClipPath(current_proj_name);
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
      current_layers[lyr_name_to_add].fields_type = fields_type;
    }
    // No projection was provided was the layer :
    if (_proj === undefined) {
      swal({
        title: '',
        text: i18next.t('app_page.common.layer_success'),
        allowOutsideClick: true,
        allowEscapeKey: true,
        type: 'success',
      }).then(() => {
        if (target_layer_on_add && joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      }, (dismiss) => {
        if (target_layer_on_add && joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      });
    } else {
      swal({
        title: '',
        text: i18next.t('app_page.common.layer_success_and_proj'),
        showCancelButton: true,
        showCloseButton: false,
        allowEscapeKey: true,
        allowOutsideClick: true,
        type: 'success',
      }).then(() => {
        _app.last_projection = parsedJSON.proj;
        current_proj_name = 'def_proj4';
        change_projection_4(_proj);
        const custom_name = tryFindNameProj(_app.last_projection);
        addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
        if (target_layer_on_add && joined_dataset.length > 0) {
          ask_join_now(lyr_name_to_add);
        } else if (target_layer_on_add) {
          make_box_type_fields(lyr_name_to_add);
        }
      }, (dismiss) => {
        if (target_layer_on_add && joined_dataset.length > 0) {
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
      current_proj_name = 'def_proj4';
      _app.last_projection = proj_str;
      change_projection_4(proj4(proj_str));
      addLastProjectionSelect('def_proj4', _app.last_projection, custom_name);
    } else if (options.default_projection[0] === 'd3') {
      current_proj_name = options.default_projection[1];
      change_projection(options.default_projection[1]);
      addLastProjectionSelect(current_proj_name);
    }
  }
  return lyr_name_to_add;
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
  if (current_proj_name === 'ConicConformal') {
    const s1 = Mmax((bbox_layer_path[1][0] - bbox_layer_path[0][0]) / w, (bbox_layer_path[1][1] - bbox_layer_path[0][1]) / h);
    const bbox_layer_path2 = path.bounds({ type: 'MultiPoint', coordinates: [ [ -69.3, -55.1 ], [ 20.9, -36.7 ], [ 147.2, -42.2 ], [ 162.1, 67.0 ], [ -160.2, 65.7 ] ] });
    const s2 = Mmax((bbox_layer_path2[1][0] - bbox_layer_path2[0][0]) / w, (bbox_layer_path2[1][1] - bbox_layer_path2[0][1]) / h);
    if (s2 < s1) bbox_layer_path = bbox_layer_path2;
  } else if (current_proj_name === 'Armadillo') {
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
function scale_to_lyr(name) {
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
function center_map(name) {
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

function fitLayer(layer_name) {
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


function add_layout_feature(selected_feature, options = {}) {
  if (document.body.style.cursor === 'not-allowed') {
    return;
  }
  if (selected_feature === 'text_annot') {
    const existing_annotation = document.getElementsByClassName('txt_annot');
    let existing_id = [];
    let new_id;
    if (existing_annotation) {
      existing_id = Array.prototype.map.call(
        existing_annotation,
        elem => +elem.id.split('text_annotation_')[1]);
    }
    for (let i = 0; i < 50; i++) {
      if (existing_id.indexOf(i) === -1) {
        existing_id.push(i);
        new_id = ['text_annotation_', i].join('');
        break;
      }
    }
    if (!(new_id)) {
      swal(`${i18next.t('app_page.common.error')}!`, i18next.t('app_page.common.error_max_text_annot'), 'error');
      return;
    }
    handleClickTextBox(new_id);
  } else if (selected_feature === 'sphere') {
    // if(current_layers.Sphere) return;
    const layer_to_add = check_layer_name(options.layer_name || 'Sphere');
    const layer_id = encodeId(layer_to_add);
    const fill = options.fill || '#add8e6';
    const fill_opacity = options.fill_opacity || 0.2;
    const stroke_width = options.stroke_width || '0.5px';
    const stroke_opacity = options.stroke_opacity || 1;
    const stroke = options.stroke || '#ffffff';
    _app.layer_to_id.set(layer_to_add, layer_id);
    _app.id_to_layer.set(layer_id, layer_to_add);
    current_layers[layer_to_add] = {
      sphere: true,
      type: 'Polygon',
      n_features: 1,
      'stroke-width-const': +stroke_width.slice(0, -2),
      fill_color: { single: fill },
    };
    map.append('g')
      .attrs({ id: layer_id, class: 'layer' })
      .styles({ 'stroke-width': stroke_width })
      .append('path')
      .datum({ type: 'Sphere' })
      .styles({ fill: fill, 'fill-opacity': fill_opacity, 'stroke-opacity': stroke_opacity, stroke: stroke })
      .attrs({ d: path });
    if (isInterrupted(current_proj_name.toLowerCase())) {
      map.select(`g#${layer_id}`).attr('clip-path', 'url(#clip)');
    }
    create_li_layer_elem(layer_to_add, null, 'Polygon', 'sample');
    alertify.notify(i18next.t('app_page.notification.success_sphere_added'), 'success', 5);
    zoom_without_redraw();
    setSphereBottom(layer_id);
  } else if (selected_feature === 'graticule') {
    if (current_layers.Graticule !== undefined) return;
    const stroke = options.stroke || '#808080';
    const stroke_width = options.stroke_width || '1px';
    const stroke_opacity = options.stroke_opacity || 1;
    const stroke_dasharray = options.stroke_dasharray || 5;
    const step = options.step || 10;
    let graticule = d3.geoGraticule().step([step, step]);
    if (options.extent) {
      const bbox_layer = _target_layer_file.bbox;
      const extent = [
        [Mround((bbox_layer[0] - 10) / 10) * 10, Mround((bbox_layer[1] - 10) / 10) * 10],
        [Mround((bbox_layer[2] + 10) / 10) * 10, Mround((bbox_layer[3] + 10) / 10) * 10]];
      graticule = graticule.extent(extent);
      current_layers.Graticule.extent = extent;
    }
    const layer_to_add = 'Graticule';
    const layer_id = encodeId(layer_to_add);
    _app.layer_to_id.set(layer_to_add, layer_id);
    _app.id_to_layer.set(layer_id, layer_to_add);
    map.insert('g', '.legend')
      .attrs({ id: layer_id, class: 'layer' })
      .styles({ 'stroke-width': stroke_width })
      .append('path')
      .datum(graticule)
      .attrs({ d: path, class: 'graticule' })
      .styles({ 'stroke-dasharray': stroke_dasharray, fill: 'none', stroke: stroke });
    current_layers.Graticule = {
      graticule: true,
      type: 'Line',
      n_features: 1,
      'stroke-width-const': +stroke_width.slice(0, -2),
      fill_color: { single: stroke },
      opacity: stroke_opacity,
      step: step,
      dasharray: stroke_dasharray,
    };
    if (isInterrupted(current_proj_name.toLowerCase())) {
      map.select(`g#${layer_id}`).attr('clip-path', 'url(#clip)');
    }
    create_li_layer_elem('Graticule', null, 'Line', 'sample');
    alertify.notify(i18next.t('app_page.notification.success_graticule_added'), 'success', 5);
    up_legends();
    zoom_without_redraw();
  } else if (selected_feature === 'scale') {
    if (!(scaleBar.displayed)) {
      handleClickAddOther('scalebar');
    } else {
      ask_existing_feature('scalebar')
        .then(() => {
          scaleBar.remove();
          handleClickAddOther('scalebar');
        }, dismiss => null);
    }
  } else if (selected_feature === 'north_arrow') {
    if (!(northArrow.displayed)) {
      handleClickAddOther('north_arrow');
    } else {
      ask_existing_feature('north_arrow')
        .then(() => {
          northArrow.remove();
          handleClickAddOther('north_arrow');
        }, dismiss => null);
    }
  } else if (selected_feature === 'arrow') {
    handleClickAddArrow();
  } else if (selected_feature === 'ellipse') {
    handleClickAddEllipse();
  } else if (selected_feature === 'rectangle') {
    handleClickAddRectangle();
  } else if (selected_feature === 'symbol') {
    handleClickAddPicto();
  } else {
    swal(`${i18next.t('app_page.common.error')}!`, i18next.t('app_page.common.error'), 'error');
  }
}

// function handleCreateFreeDraw(){
//     let start_point,
//         tmp_start_point,
//         active_line,
//         drawing_data = { "lines": [] };
//
//     let render_line = d3.line().x(d => d[0]).y(d => d[1]);
//     let draw_calc = map.append("g")
//                         .append("rect")
//                         .attrs({class: "draw_calc", x: 0, y: 0, width: w, height: h})
//                         .style("opacity", 0.1).style("fill", "grey");
//
//     function redraw() {
//       var lines;
//       lines = draw_calc.selectAll('.line').data(drawing_data.lines);
//       lines.enter().append('path').attrs({
//         "class": 'line',
//         stroke: function(d) {
//           return d.color;
//         }
//       });
//       lines.attr("d", function(d) { return render_line(d.points);});
//       return lines.exit();
//     };
//
//     let drag = d3.drag()
//            .on('start', function() {
//               active_line = {
//                 points: [],
//                 color: "black"
//               };
//               drawing_data.lines.push(active_line);
//               return redraw();
//             })
//             .on('drag', function() {
//               active_line.points.push([d3.event.x, d3.event.y]);
//               console.log(drawing_data);
//               return redraw();
//             })
//             .on('end', function() {
//               if (active_line.points.length === 0) {
//                 drawing_data.lines.pop();
//               }
//               active_line = null;
//               console.log(drawing_data);
//               return;
//             });
//     zoom.on("zoom", null);
//     draw_calc.call(drag);
// }

function add_single_symbol(symbol_dataurl, x, y, width = '30', height = '30', symbol_id = null) {
  const context_menu = new ContextMenu();
  const getItems = self_parent => [
    { name: i18next.t('app_page.common.options'), action: () => { make_style_box_indiv_symbol(self_parent); } },
    { name: i18next.t('app_page.common.up_element'), action: () => { up_legend(self_parent.parentElement); } },
    { name: i18next.t('app_page.common.down_element'), action: () => { down_legend(self_parent.parentElement); } },
    { name: i18next.t('app_page.common.delete'), action: () => { self_parent.parentElement.remove(); } },
  ];

  return map.append('g')
    .attrs({ class: 'legend single_symbol', id: symbol_id })
    .insert('image')
    .attrs({
      x: x || w / 2,
      y: y || h / 2,
      width: width,
      height: height,
      'xlink:href': symbol_dataurl
    })
    .on('mouseover', function () { this.style.cursor = 'pointer'; })
    .on('mouseout', function () { this.style.cursor = 'initial'; })
    .on('dblclick contextmenu', function () {
      context_menu.showMenu(d3.event, document.querySelector('body'), getItems(this));
    })
    .call(drag_elem_geo);
}

/**
* Function to display the dialog allowing the choose and add layout layer(s).
*
* @return {void}
*/
// function add_layout_layers() {
//   check_remove_existing_box('.sampleLayoutDialogBox');
//   const layout_layers = [
//     [i18next.t('app_page.layout_layer_box.nuts0'), 'nuts0'],
//     [i18next.t('app_page.layout_layer_box.nuts1'), 'nuts1'],
//     [i18next.t('app_page.layout_layer_box.nuts2'), 'nuts2'],
//     [i18next.t('app_page.layout_layer_box.brazil'), 'brazil'],
//     [i18next.t('app_page.layout_layer_box.quartier_paris'), 'quartier_paris'],
//     [i18next.t('app_page.layout_layer_box.departements_vor_2016_2-2'), 'departements_vor_2016_2-2'],
//     [i18next.t('app_page.sample_layer_box.departements_2016_2-2'), 'departements_2016_2-2'],
//     [i18next.t('app_page.sample_layer_box.regions_2016_2-2'), 'regions_2016_2-2'],
//     [i18next.t('app_page.layout_layer_box.france_contour_2016_2-2'), 'france_contour_2016_2-2'],
//     [i18next.t('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
//     [i18next.t('app_page.layout_layer_box.world_countries'), 'world_country'],
//     [i18next.t('app_page.layout_layer_box.world_capitals'), 'world_cities'],
//     [i18next.t('app_page.layout_layer_box.tissot'), 'tissot'],
//   ];
//   const selec = { layout: null };
//
//   make_confirm_dialog2('sampleLayoutDialogBox', i18next.t('app_page.layout_layer_box.title'), { widthFitContent: true })
//     .then((confirmed) => {
//       if (confirmed) {
//         if (selec.layout && selec.layout.length > 0) {
//           for (let i = 0; i < selec.layout.length; ++i) {
//             add_sample_geojson(selec.layout[i]);
//           }
//         }
//       }
//     });
//
//   const box_body = d3.select('.sampleLayoutDialogBox').select('.modal-body').style('text-align', 'center');
//   box_body.node().parentElement.style.width = 'auto';
//   box_body.append('h3')
//     .html(i18next.t('app_page.layout_layer_box.msg_select_layer'));
//   box_body.append('p')
//     .style('color', 'grey')
//     .html(i18next.t('app_page.layout_layer_box.msg_select_multi'));
//
//   const layout_layer_selec = box_body.append('p')
//     .html('')
//     .insert('select')
//     .attrs({ class: 'sample_layout', multiple: 'multiple', size: layout_layers.length });
//   layout_layers.forEach((layer_info) => {
//     layout_layer_selec.append('option').html(layer_info[0]).attr('value', layer_info[1]);
//   });
//   layout_layer_selec.on('change', function () {
//     const selected_asArray = Array.prototype.slice.call(this.selectedOptions);
//     selec.layout = selected_asArray.map(elem => elem.value);
//   });
//   box_body.append('span')
//     .style('font-size', '0.65rem')
//     .html(i18next.t('app_page.layout_layer_box.disclamer_nuts'));
// }

/**
* Function to display the dialog allowing the choose and add a sample target layer.
*
* @return {void}
*/
function add_sample_layer() {
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
   [i18next.t('app_page.sample_layer_box.target_layer'), ''],
   [i18next.t('app_page.sample_layer_box.grandparismunicipalities'), 'GrandParisMunicipalities'],
   [i18next.t('app_page.sample_layer_box.quartier_paris'), 'quartier_paris'],
   [i18next.t('app_page.sample_layer_box.martinique'), 'martinique'],
   [i18next.t('app_page.sample_layer_box.departements_2016_2-2'), 'departements_2016_2-2'],
   [i18next.t('app_page.layout_layer_box.departements_vor_2016_2-2'), 'departements_vor_2016_2-2'],
   [i18next.t('app_page.sample_layer_box.regions_2016_2-2'), 'regions_2016_2-2'],
   [i18next.t('app_page.layout_layer_box.france_contour_2016_2-2'), 'france_contour_2016_2-2'],
   [i18next.t('app_page.sample_layer_box.nuts2_data'), 'nuts2-2013-data'],
   [i18next.t('app_page.sample_layer_box.brazil'), 'brazil'],
   [i18next.t('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
   [i18next.t('app_page.sample_layer_box.communes_reg_11'), 'communes_reg_11'],
   [i18next.t('app_page.sample_layer_box.communes_reg_24'), 'communes_reg_24'],
   [i18next.t('app_page.sample_layer_box.communes_reg_27'), 'communes_reg_27'],
   [i18next.t('app_page.sample_layer_box.communes_reg_28'), 'communes_reg_28'],
   [i18next.t('app_page.sample_layer_box.communes_reg_32'), 'communes_reg_32'],
   [i18next.t('app_page.sample_layer_box.communes_reg_44'), 'communes_reg_44'],
   [i18next.t('app_page.sample_layer_box.communes_reg_52'), 'communes_reg_52'],
   [i18next.t('app_page.sample_layer_box.communes_reg_53'), 'communes_reg_53'],
   [i18next.t('app_page.sample_layer_box.communes_reg_75'), 'communes_reg_75'],
   [i18next.t('app_page.sample_layer_box.communes_reg_76'), 'communes_reg_76'],
   [i18next.t('app_page.sample_layer_box.communes_reg_84'), 'communes_reg_84'],
   [i18next.t('app_page.sample_layer_box.communes_reg_93'), 'communes_reg_93'],
   [i18next.t('app_page.sample_layer_box.communes_reg_94'), 'communes_reg_94'],
   [i18next.t('app_page.sample_layer_box.commune_dep_971'), 'commune_dep_971'],
   [i18next.t('app_page.sample_layer_box.commune_dep_972'), 'commune_dep_972'],
   [i18next.t('app_page.sample_layer_box.commune_dep_973'), 'commune_dep_973'],
   [i18next.t('app_page.sample_layer_box.commune_dep_974'), 'commune_dep_974'],
   [i18next.t('app_page.sample_layer_box.commune_dep_976'), 'commune_dep_976'],
   [i18next.t('app_page.sample_layer_box.voronoi_communes_2016_2-2'), 'voronoi_communes_2016_2-2'],
   [i18next.t('app_page.layout_layer_box.nuts0'), 'nuts0'],
   [i18next.t('app_page.layout_layer_box.nuts1'), 'nuts1'],
   [i18next.t('app_page.layout_layer_box.nuts2'), 'nuts2'],
   [i18next.t('app_page.sample_layer_box.world_countries'), 'world_countries_data'],
   [i18next.t('app_page.layout_layer_box.world_countries'), 'world_country'],
   [i18next.t('app_page.layout_layer_box.world_capitals'), 'world_cities'],
   [i18next.t('app_page.layout_layer_box.tissot'), 'tissot'],
  ];
  const dialog_res = [];
  let selec,
    selec_url,
    content;

  make_confirm_dialog2('sampleDialogBox', i18next.t('app_page.sample_layer_box.title'))
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
    content.append('h3').html(i18next.t('app_page.sample_layer_box.subtitle1'));
    content.append('p')
      .append('span')
      .html(i18next.t('app_page.sample_layer_box.extra_basemaps_info'));
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
      .html(i18next.t('app_page.sample_layer_box.back_sample'))
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
    content.append('h3').html(i18next.t('app_page.sample_layer_box.subtitle1'));

    const t_layer_selec = content.append('p').html('').insert('select').attr('class', 'sample_target');
    target_layers.forEach((layer_info) => { t_layer_selec.append('option').html(layer_info[0]).attr('value', layer_info[1]); });
    t_layer_selec.on('change', function () { selec = this.value; });
    content.append('p')
      .styles({ margin: 'auto', 'text-align': 'right', cursor: 'pointer' })
      .append('span')
      .html(i18next.t('app_page.sample_layer_box.more_basemaps'))
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
function add_simplified_land_layer(options = {}) {
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
  current_layers.World = {
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
  formToSend.append('layer_name', current_layers[layer_name].key_name);
  xhrequest('POST', 'layers/delete', formToSend, true)
    .then((data) => {
      const parsed = JSON.parse(data);
      if (!parsed.code || parsed.code !== 'Ok') console.log(data);
    }).catch((err) => {
      console.log(err);
    });
}

/**
* Return the x and y position where the svg element is located
* in the browser window.
*
* @return {Object} - An object with x and y properties.
*/
function get_map_xy0() {
  const bbox = svg_map.getBoundingClientRect();
  return { x: bbox.left, y: bbox.top };
}

const getIdLayoutFeature = (type) => {
  let class_name,
    id_prefix,
    error_name;
  if (type === 'ellipse') {
    class_name = 'user_ellipse';
    id_prefix = 'user_ellipse_';
    error_name = 'error_max_ellipses';
  } else if (type === 'rectangle') {
    class_name = 'user_rectangle';
    id_prefix = 'user_rectangle_';
    error_name = 'error_max_rectangles';
  } else if (type === 'arrow') {
    class_name = 'arrow';
    id_prefix = 'arrow_';
    error_name = 'error_max_arrows';
  } else if (type === 'single_symbol') {
    class_name = 'single_symbol';
    id_prefix = 'single_symbol_';
    error_name = 'error_max_symbols';
  }
  const features = document.getElementsByClassName(class_name);
  if (!features) {
    return 0;
  } else if (features.length > 30) {
    swal(i18next.t('app_page.common.error'), i18next.t(`app_page.common.${error_name}`), 'error').catch(swal.noop);
    return null;
  }
  const ids = [];
  for (let i = 0; i < features.length; i++) {
    ids.push(+features[i].id.split(id_prefix)[1]);
  }
  if (ids.indexOf(features.length) === -1) {
    return features.length;
  }
  for (let i = 0; i < features.length; i++) {
    if (ids.indexOf(i) === -1) {
      return i;
    }
  }
  return null;
};


function handleClickAddRectangle() {
  const esc_cancel = function esc_cancel(evt) {
    evt = evt || window.event;
    if (('key' in evt && (
        evt.key !== 'Escape' && evt.key !== 'Esc')) || evt.keyCode !== 27) {
      return;
    }
    msg.dismiss();
    map.select('.brush_rect_draw').remove();
    document.body.style.cursor = '';
    document.removeEventListener('keydown', esc_cancel);
  };
  function rectbrushended() {
    if (!d3.event.selection) {
      map.select('.brush_rect_draw').remove();
      document.body.style.cursor = '';
      msg.dismiss();
      document.removeEventListener('keydown', esc_cancel);
      alertify.notify(i18next.t('app_page.notification.brush_map_cancelled'), 'warning', 5);
      return;
    }
    msg.dismiss();
    const k = svg_map.__zoom.k;
    const wi = (d3.event.selection[1][0] - d3.event.selection[0][0]) / k;
    const he = (d3.event.selection[1][1] - d3.event.selection[0][1]) / k;
    new UserRectangle(`user_rectangle_${rectangle_id}`, d3.event.selection[0], svg_map, false, wi, he);
    map.select('.brush_rect_draw').remove();
    document.removeEventListener('keydown', esc_cancel);
    document.body.style.cursor = '';
  }
  const rectangle_id = getIdLayoutFeature('rectangle');
  if (rectangle_id === null) {
    return;
  }
  const msg = alertify.notify(i18next.t('app_page.notification.instruction_brush_map'), 'warning', 0);
  document.addEventListener('keydown', esc_cancel);
  document.body.style.cursor = 'not-allowed';
  const _brush = d3.brush().on('end', rectbrushended);
  map.append('g')
    .attr('class', 'brush_rect_draw')
    .call(_brush);
}

function handleClickAddOther(type) {
  const esc_cancel = function esc_cancel(evt) {
    evt = evt || window.event;
    if (('key' in evt && (
        evt.key !== 'Escape' && evt.key !== 'Esc')) || evt.keyCode !== 27) {
      return;
    }
    msg.dismiss();
    document.body.style.cursor = '';
    map.style('cursor', '').on('click', null);
    document.removeEventListener('keydown', esc_cancel);
  };
  const msg = alertify.notify(i18next.t('app_page.notification.instruction_click_map'), 'warning', 0);
  document.addEventListener('keydown', esc_cancel);
  document.body.style.cursor = 'not-allowed';
  map.style('cursor', 'crosshair')
    .on('click', () => {
      msg.dismiss();
      document.removeEventListener('keydown', esc_cancel);
      map.style('cursor', '').on('click', null);
      document.body.style.cursor = '';
      if (type === 'north_arrow') {
        northArrow.display(d3.event.layerX, d3.event.layerY);
      } else if (type === 'scalebar') {
        scaleBar.create(d3.event.layerX, d3.event.layerY);
      }
    });
}

function handleClickAddEllipse() {
  const esc_cancel = function esc_cancel(evt) {
    evt = evt || window.event;
    if (('key' in evt && (
        evt.key !== 'Escape' && evt.key !== 'Esc')) || evt.keyCode !== 27) {
      return;
    }
    msg.dismiss();
    document.body.style.cursor = '';
    map.style('cursor', '').on('click', null);
    document.removeEventListener('keydown', esc_cancel);
  };
  const ellipse_id = getIdLayoutFeature('ellipse');
  if (ellipse_id === null) {
    return;
  }
  document.body.style.cursor = 'not-allowed';
  let start_point,
    tmp_start_point;
  const msg = alertify.notify(i18next.t('app_page.notification.instruction_click_map'), 'warning', 0);
  document.addEventListener('keydown', esc_cancel);
  map.style('cursor', 'crosshair')
    .on('click', () => {
      msg.dismiss();
      document.removeEventListener('keydown', esc_cancel);
      start_point = [d3.event.layerX, d3.event.layerY];
      tmp_start_point = map.append('rect')
        .attrs({ x: start_point[0] - 2, y: start_point[1] - 2, height: 4, width: 4 })
        .style('fill', 'red');
      setTimeout(() => { tmp_start_point.remove(); }, 1000);
      map.style('cursor', '').on('click', null);
      document.body.style.cursor = '';
      new UserEllipse(`user_ellipse_${ellipse_id}`, start_point, svg_map);
    });
}

function handleClickTextBox(text_box_id) {
  const esc_cancel = function esc_cancel(evt) {
    evt = evt || window.event;
    if (('key' in evt && (
        evt.key !== 'Escape' && evt.key !== 'Esc')) || evt.keyCode !== 27) {
      return;
    }
    msg.dismiss();
    document.body.style.cursor = '';
    map.style('cursor', '').on('click', null);
    document.removeEventListener('keydown', esc_cancel);
  };
  const msg = alertify.notify(i18next.t('app_page.notification.instruction_click_map'), 'warning', 0);
  document.body.style.cursor = 'not-allowed';
  map.style('cursor', 'crosshair')
    .on('click', () => {
      msg.dismiss();
      document.removeEventListener('keydown', esc_cancel);
      map.style('cursor', '').on('click', null);
      document.body.style.cursor = '';
      const text_box = new Textbox(svg_map, text_box_id, [d3.event.layerX, d3.event.layerY]);
      setTimeout(() => { text_box.editStyle(); }, 350);
    });
  document.addEventListener('keydown', esc_cancel);
}

function handleClickAddPicto() {
  const esc_cancel = function esc_cancel(evt) {
    evt = evt || window.event;
    if (('key' in evt && (
        evt.key !== 'Escape' && evt.key !== 'Esc')) || evt.keyCode !== 27) {
      return;
    }
    msg.dismiss();
    document.body.style.cursor = '';
    map.style('cursor', '').on('click', null);
    document.removeEventListener('keydown', esc_cancel);
  };
  const symbol_id = getIdLayoutFeature('single_symbol');
  if (symbol_id === null) {
    return;
  }
  const msg = alertify.notify(i18next.t('app_page.notification.instruction_click_map'), 'warning', 0);
  document.addEventListener('keydown', esc_cancel);
  let map_point,
    click_pt,
    prep_symbols,
    available_symbols = false;

  if (!window.default_symbols) {
    window.default_symbols = [];
    prep_symbols = prepare_available_symbols();
  } else {
    available_symbols = true;
  }

  document.body.style.cursor = 'not-allowed';
  map.style('cursor', 'crosshair')
    .on('click', () => {
      msg.dismiss();
      document.removeEventListener('keydown', esc_cancel);
      click_pt = [d3.event.layerX, d3.event.layerY];
      map_point = map.append('rect')
        .attrs({ x: click_pt[0] - 2, y: click_pt[1] - 2, height: 4, width: 4 })
        .style('fill', 'red');
      setTimeout(() => {
        map_point.remove();
      }, 500);
      map.style('cursor', '').on('click', null);
      document.body.style.cursor = '';
      if (!available_symbols) {
        prep_symbols.then((confirmed) => {
          box_choice_symbol(window.default_symbols).then((result) => {
            if (result) {
              add_single_symbol(result.split('url(')[1].substring(1).slice(0, -2), click_pt[0], click_pt[1], 45, 45, `single_symbol_${symbol_id}`);
            }
          });
        });
      } else {
        box_choice_symbol(window.default_symbols).then((result) => {
          if (result) {
            add_single_symbol(result.split('url(')[1].substring(1).slice(0, -2), click_pt[0], click_pt[1], 45, 45, `single_symbol_${symbol_id}`);
          }
        });
      }
    });
}

// function handleFreeDraw(){
//     var line_gen = d3.line(d3.curveBasis);
//     var draw_layer = map.select('#_m_free_draw_layer');
//     if(!draw_layer.node()){
//         draw_layer = map.append('g').attrs({id: "_m_free_draw_layer"});
//     } else {
//         // up the draw_layer ?
//     }
//     var draw_rect = draw_layer.append('rect')
//         .attrs({fill: 'transparent', height: h, width: w, x: 0, y:0});
//     draw_layer.call(d3.drag()
//         .container(function(){ return this; })
//         .subject(_ =>  [[d3.event.x, d3.event.y], [d3.event.x, d3.event.y]])
//         .on('start', _ => {
//             handle_click_hand('lock');
//             let d = d3.event.subject,
//                 active_line = draw_layer.append('path').datum(d),
//                 x0 = d3.event.x,
//                 y0 = d3.event.y;
//             d3.event.on('drag', function(){
//                 var x1 = d3.event.x,
//                     y1 = d3.event.y,
//                     dx = x1 - x0,
//                     dy = y1 - y0;
//                 if(dx * dx + dy * dy > 100) d.push([x0 = x1, y0 = y1]);
//                 else d[d.length -1] = [x1, y1];
//                 active_line.attr('d', line_gen)
//             });
//         }));
// }

function handleClickAddArrow() {
  const esc_cancel = function esc_cancel(evt) {
    evt = evt || window.event;
    if (('key' in evt && (
        evt.key !== 'Escape' && evt.key !== 'Esc')) || evt.keyCode !== 27) {
      return;
    }
    msg.dismiss();
    document.body.style.cursor = '';
    map.style('cursor', '').on('click', null);
    if (tmp_start_point && tmp_start_point.remove) {
      tmp_start_point.remove();
    }
    document.removeEventListener('keydown', esc_cancel);
  };
  const arrow_id = getIdLayoutFeature('arrow');
  if (arrow_id === null) {
    return;
  }
  let start_point,
    tmp_start_point,
    end_point,
    tmp_end_point;
  document.body.style.cursor = 'not-allowed';
  let msg = alertify.notify(i18next.t('app_page.notification.instruction_click_map_arrow1'), 'warning', 0);
  document.addEventListener('keydown', esc_cancel);
  map.style('cursor', 'crosshair')
    .on('click', () => {
      if (!start_point) {
        start_point = [d3.event.layerX, d3.event.layerY];
        tmp_start_point = map.append('rect')
          .attrs({ x: start_point[0] - 2, y: start_point[1] - 2, height: 4, width: 4 })
          .style('fill', 'red');
        msg.dismiss();
        msg = alertify.notify(i18next.t('app_page.notification.instruction_click_map_arrow2'), 'warning', 0);
      } else {
        end_point = [d3.event.layerX, d3.event.layerY];
        tmp_end_point = map.append('rect')
          .attrs({ x: end_point[0] - 2, y: end_point[1] - 2, height: 4, width: 4 })
          .style('fill', 'red');
      }
      if (start_point && end_point) {
        msg.dismiss();
        document.removeEventListener('keydown', esc_cancel);
        setTimeout(() => {
          tmp_start_point.remove();
          tmp_end_point.remove();
        }, 1000);
        map.style('cursor', '').on('click', null);
        document.body.style.cursor = '';
        new UserArrow(`arrow_${arrow_id}`, start_point, end_point, svg_map);
      }
    });
}

function prepare_available_symbols() {
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

function accordionize(css_selector = '.accordion', parent) {
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

function accordionize2(css_selector = '.accordion', parent = document) {
  const acc = parent.querySelectorAll(css_selector);
  for (let i = 0; i < acc.length; i++) {
    acc[i].onclick = function () {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('show');
    };
  }
}

function downgradeTargetLayer() {
  const old_target = Object.keys(user_data)[0];
  if (!old_target) return;
  delete current_layers[old_target].targeted;
  field_join_map = [];
  user_data = {};
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
  current_layers[new_target].targeted = true;
  _app.targeted_layer_added = true;
  user_data[new_target] = Array.from(document.querySelector(`#${_app.layer_to_id.get(new_target)}`).querySelectorAll('path')).map(d => d.__data__.properties);
  const fields = Object.keys(user_data[new_target][0]);
  update_section1(current_layers[new_target].type, fields.length, current_layers[new_target].n_features, new_target);
  current_layers[new_target].original_fields = new Set(fields);
  current_layers[new_target].fields_type =  type_col2(user_data[new_target]);
  scale_to_lyr(new_target);
  center_map(new_target);
  zoom_without_redraw();
  getAvailablesFunctionnalities(new_target);
  const id_new_target_lyr = _app.layer_to_id.get(new_target);
  document.querySelector(`.${id_new_target_lyr}`).classList.add('sortable_target');
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
  //   .html(i18next.t('app_page.section1.add_geom'))
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
