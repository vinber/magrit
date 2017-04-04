"use strict";

const shortListContent = [
		'AzimuthalEqualAreaEurope',
		'ConicConformalFrance',
		'HEALPix',
		'Mercator',
		'NaturalEarth2',
		'Robinson',
		'TransverseMercator',
		'WinkelTriple',
		'more',
		'proj4'
];

const available_projections = new Map([
	['Albers', {'name': 'geoAlbers', 'scale': '400'}],
	["Armadillo", {'name': 'geoArmadillo', 'scale': '400'}],
	["AzimuthalEquidistant", {'name': 'geoAzimuthalEquidistant' ,'scale': '700'}],
	["AzimuthalEqualArea", {'name': 'geoAzimuthalEqualArea' ,'scale': '700'}],
	["AzimuthalEqualAreaEurope", {'name': 'geoAzimuthalEqualArea' ,'scale': '700', rotate: [-10,-52,0], bounds: [-10.6700, 34.5000, 31.5500, 71.0500]}],
	["Baker", {'name': 'geoBaker', 'scale': '400'}],
	["Berhmann", {'name': 'geoCylindricalEqualArea', scale: '400', parallel: 30}],
	["Boggs", {'name': 'geoBoggs', 'scale': '400'}],
	["InterruptedBoggs", {'name': 'geoInterruptedBoggs', 'scale': '400'}],
	["Bonne", {'name': 'geoBonne', 'scale': '400'}],
	["Bromley", {'name': 'geoBromley', 'scale': '400'}],
	["Collignon", {'name': 'geoCollignon', 'scale': '400'}],
	// ["Cassini", {"name": 'geoEquirectangular', 'scale': '400', 'rotate': [0,0,90]}],
	["ConicConformalTangent", {'name': 'geoConicConformal', 'scale': '400', 'parallels': [44, 44]}],
	["ConicConformalSec", {'name': 'geoConicConformal', 'scale': '400', 'parallels': [44, 49]}],
	["ConicConformalFrance", {'name': 'geoConicConformal', 'scale': '400', 'parallels': [44, 49], bounds: [-10.6700, 34.5000, 31.5500, 71.0500]}],
	["ConicEqualArea", {'name': 'geoConicEqualArea', 'scale': '400'}],
	["ConicEquidistantDeslisle", {'name': 'geoConicEquidistant', 'scale': '400', parallels: [40, 45]}],
	["ConicEquidistantTangent", {'name': 'geoConicEquidistant', 'scale': '400', parallels: [40, 40]}],
	["CrasterParabolic", {'name': 'geoCraster', 'scale': '400'}],
	["Equirectangular", {'name': 'geoEquirectangular', 'scale': '400'}],
	["CylindricalEqualArea", {'name': 'geoCylindricalEqualArea', 'scale': '400'}],
	["CylindricalStereographic", {'name': 'geoCylindricalStereographic', 'scale': '400'}],
	["EckertI", {'name': 'geoEckert1', 'scale': '400'}],
	["EckertII", {'name': 'geoEckert2', 'scale': '400'}],
	["EckertIII", {'name': 'geoEckert3', 'scale': '525'}],
	["EckertIV", {'name': 'geoEckert4', 'scale': '525'}],
	["EckertV", {'name': 'geoEckert5', 'scale': '400'}],
	["EckertVI", {'name': 'geoEckert6', 'scale': '400'}],
	["Eisenlohr", {'name': 'geoEisenlohr', 'scale': '400'}],
	['GallPeters', {'name': 'geoCylindricalEqualArea', scale: '400', parallel: 45}],
	['GallStereographic', {'name': 'geoCylindricalStereographic', scale: '400', parallel: 45}],
	['Gilbert', {'name': 'geoGilbert', scale: '400', type: ''}],
	["Gnomonic", {'name': 'geoGnomonic', 'scale': '400'}],
	["Gringorten", {'name': 'geoGringorten', 'scale': '400'}],
	['GringortenQuincuncial', {'name': 'geoGringortenQuincuncial', 'scale': '400'}],
	["HEALPix", {'name': 'geoHealpix', 'scale': '400'}],
	["HoboDyer", {'name': 'geoCylindricalEqualArea', scale: '400', parallel: 37.5}],
	["Homolosine", {'name': 'geoHomolosine', 'scale': '400'}],
	["InterruptedHomolosine", {'name': 'geoInterruptedHomolosine', 'scale': '400'}],
	["Loximuthal", {'name': 'geoLoximuthal', 'scale': '400'}],
	["Mercator",  {'name': 'geoMercator', 'scale': '375'}],
	["Miller",  {'name': 'geoMiller', 'scale': '375'}],
	["MillerOblatedStereographic",  {'name': 'geoModifiedStereographicMiller', 'scale': '375'}],
	["Mollweide", {'name': 'geoMollweide', 'scale': '400'}],
	["NaturalEarth", {'name': 'geoNaturalEarth', 'scale': '400'}],
	["NaturalEarth2", {'name': 'geoNaturalEarth2', 'scale': '400'}],
	["Orthographic",  {'name': 'geoOrthographic', 'scale': '475', 'clipAngle': 90}],
	["Patterson", {'name': 'geoPatterson', 'scale': '400'}],
	["Polyconic", {'name': 'geoPolyconic', 'scale': '400'}],
	["Peircequincuncial", {'name': 'geoPeirceQuincuncial', 'scale':'400'}],
	["Robinson", {'name': 'geoRobinson', 'scale' :'400'}],
	["SinuMollweide", {'name': 'geoSinuMollweide', 'scale': '400'}],
	["InterruptedSinuMollweide", {'name': 'geoInterruptedSinuMollweide', 'scale': '400'}],
	["Sinusoidal", {'name': 'geoSinusoidal', 'scale': '400'}],
	["InterruptedSinusoidal", {'name': 'geoInterruptedSinusoidal', 'scale': '400'}],
	['Stereographic', {'name': 'geoStereographic', 'scale': '400'}],
	["TransverseMercator", {'name': 'geoTransverseMercator', 'scale': '400'}],
	['Werner', {'name': 'geoBonne', scale: '400', parallel: 90}],
	["WinkelTriple", {'name': 'geoWinkel3', 'scale': '400'}]
]);

const createBoxProj4 = function(){
	let modal_box = make_dialog_container(
      "box_projection_input",
      i18next.t("app_page.section5.title"),
      "dialog");
	let container = document.getElementById("box_projection_input"),
			dialog = container.querySelector('.modal-dialog');

	let content = d3.select(container)
			.select(".modal-body")
			.attr('id', 'box_proj4');

	dialog.style.width = undefined;
	dialog.style.maxWidth = '500px';
	dialog.style.minWidth = '400px';

	let input_section = content.append('p');
	input_section.append('span')
			.style('float', 'left')
			.html("Enter a proj4 string");
	input_section.append('input')
			.styles({'width': '90%'})
			.attrs({id: 'input_proj_string', placeholder: "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs"})
			.on("input", function(){
					null;
					let proj_str = this.value;
					if(proj_str.length < 4 || !proj_str.split(' ').every(f => f[0] == '+')){
							container.querySelector('.btn_ok').disabled = 'disabled';
					} else {
							container.querySelector('.btn_ok').disabled = false;
					}
			});

	let clean_up_box = () => {
			container.remove();
			overlay_under_modal.hide();
			document.removeEventListener('keydown', fn_cb);
	};
	let fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, clean_up_box); };
	let _onclose_valid = () => {
			let proj_str = document.getElementById('input_proj_string').value;
			clean_up_box();
			if(proj_str.length < 4 || !proj_str.split(' ').every(f => f[0] == '+')){
					return;
			} else {
					let _p;
					try {
						_p = proj4(proj_str);
					} catch(e){
						return;
					}
					change_projection_4(_p);
			}
	};
  container.querySelector(".btn_cancel").onclick = clean_up_box;
  container.querySelector("#xclose").onclick = clean_up_box;
  container.querySelector(".btn_ok").onclick = _onclose_valid;
  document.addEventListener('keydown', fn_cb);
  overlay_under_modal.display();
}

function addLastProjectionSelect(proj_name){
		let proj_select = document.getElementById('form_projection2');
		if(shortListContent.indexOf(proj_name) > -1){
				proj_select.value = proj_name;
		} else if(proj_select.options.length == 10){
				let prev_elem = proj_select.querySelector("[value='more']"),
						new_option = document.createElement('option');
				new_option.className = 'i18n';
				new_option.value = 'last_projection';
				new_option.name = proj_name;
				new_option.setAttribute('data-i18n', '[text]app_page.projection_name.' + proj_name);
				new_option.innerHTML = i18next.t('app_page.projection_name.' + proj_name);
				proj_select.insertBefore(new_option, prev_elem);
				proj_select.value = 'last_projection';
		} else {
				let option = proj_select.querySelector("[value='last_projection']");
				option.name = proj_name;
				option.innerHTML = i18next.t('app_page.projection_name.' + proj_name);
				option.setAttribute('data-i18n', '[text]app_page.projection_name.' + proj_name);
				proj_select.value = 'last_projection';
		}
}

const createBoxCustomProjection = function(){
	function updateProjOptions(){
			if(proj.rotate){
					rotate_section.style('display', '');
					let param_rotate = proj.rotate();
					lambda_input.node().value = param_rotate[0];
					phi_input.node().value = param_rotate[1];
					gamma_input.node().value = param_rotate[2];
			} else {
					rotate_section.style('display', 'none');
			}
			if(proj.parallels){
					let param_parallels = proj.parallels();
					parallels_section.style('display', '');
					parallel_section.style('display', 'none');
					sp1_input.node().value = param_parallels[0];
					sp2_input.node().value = param_parallels[1];
			} else if (proj.parallel){
					parallels_section.style('display', 'none');
					parallel_section.style('display', '');
					sp_input.node().value = proj.parallel();
			} else {
					parallels_section.style('display', 'none');
					parallel_section.style('display', 'none');
			}
	}
	let prev_projection = current_proj_name,
			prev_translate = [].concat(t),
			prev_scale = s,
			prev_rotate = proj.rotate ? proj.rotate() : undefined,
			prev_parallels = proj.parallels ? proj.parallels() : undefined,
			prev_parallel = proj.parallel ? proj.parallel() : undefined;

	let modal_box = make_dialog_container(
      "box_projection_customization",
      i18next.t("app_page.section5.title"),
      "dialog");
	let container = document.getElementById("box_projection_customization"),
			dialog = container.querySelector('.modal-dialog');

	let content = d3.select(container)
			.select(".modal-body")
			.attr('id', 'box_projection');

	dialog.style.width = '700px';

	var choice_proj = content.append("button")
					.attrs({"class": "accordion_proj active", "id": "btn_choice_proj"})
					.style("padding", "0 6px")
					.html(i18next.t("app_page.projection_box.choice_projection")),
			accordion_choice_projs = content.append("div")
					.attrs({"class": "panel show", "id": "accordion_choice_projection"})
					.style('padding', '10px')
					.style("width", "98%"),
			choice_proj_content =  accordion_choice_projs.append("div")
					.attr("id", "choice_proj_content")
					.style("text-align", "center");

	var column1 = choice_proj_content.append('div')
			.styles({float: 'left', width: '52%'});
	var column2 = choice_proj_content.append('div')
			.styles({float: 'left', width: '52%'});
	var column3 = choice_proj_content.append('div')
			.styles({float: 'left', display: 'contents', width: '45%'});
	choice_proj_content.append('div')
			.style('clear', 'both');

	var filtersection1 = column1.append('div').attr('class', 'switch-field');
	filtersection1.append('div')
			.attrs({class: 'switch-title'})
			.html(i18next.t('app_page.projection_box.filter_nature'));
	['any', 'other', 'cone', 'cylindre', 'plan', 'pseudocone', 'pseudocylindre', 'pseudoplan'].forEach((v, i) => {
			let _id = 'switch_proj1_elem_' + i;
			filtersection1.append('input')
					.attrs({type: 'radio', id: _id, name: 'switch_proj1', value: v});
			filtersection1.append('label')
					.attr('for', _id)
					.html(i18next.t('app_page.projection_box.' + v));
	});

	var filtersection2 = column2.append('div').attr('class', 'switch-field');
	filtersection2.append('div')
			.attrs({class: 'switch-title'})
			.html(i18next.t('app_page.projection_box.filter_prop'));
	['any', 'aphylactic', 'conformal', 'equalarea', 'equidistant'].forEach((v, i) => {
			let _id = 'switch_proj2_elem_' + i;
			filtersection2.append('input')
					.attrs({type: 'radio', id: _id, name: 'switch_proj2', value: v});
			filtersection2.append('label')
					.attr('for', _id)
					.html(i18next.t('app_page.projection_box.' + v));
	});

	var display_select_proj = column3.append('select')
			// .style('margin', '20px 7.5px 0 0')
			.attr('id', 'select_proj')
  		.attr('size', 18);

	for(let proj_name of available_projections.keys()){
      display_select_proj.append('option')
					.attrs({class: 'i18n', value: proj_name, 'data-i18n': 'app_page.projection_name.' + proj_name})
					.text(i18next.t('app_page.projection_name.' + proj_name));
  }

	column3.append('button')
			.style('margin', '5px 0 5px 0')
			// .styles({margin: '5px 0 5px 0', padding: '5px', float: 'right'})
			.attrs({id: 'btn_valid_reproj', class: 'button_st4 i18n'})
			.html(i18next.t('app_page.projection_box.ok_reproject'))
			.on('click', function(){
					current_proj_name = document.getElementById('select_proj').value;
					addLastProjectionSelect(current_proj_name);
					change_projection(current_proj_name);
					updateProjOptions();
			});

	var choice_options = content.append("button")
					.attrs({"class": "accordion_proj", "id": "btn_choice_proj"})
					.style("padding", "0 6px")
					.html(i18next.t("app_page.projection_box.projection_options")),
			accordion_choice_options = content.append("div")
					.attrs({"class": "panel", "id": "accordion_choice_projection"})
					.style('padding', '10px')
					.style("width", "98%"),
			options_proj_content =  accordion_choice_options.append("div")
					.attr("id", "options_proj_content")
					.style('width', '60%')
					.style('transform', 'translateX(45%)');

	// if(prev_rotate){
	let rotate_section = options_proj_content.append('div').style('display', prev_rotate ? '' : 'none');
	let lambda_section = rotate_section.append('p');
	lambda_section.append('span')
			.style('float', 'left')
			.html(i18next.t('app_page.section5.projection_center_lambda'));
	let lambda_input = lambda_section.append('input')
			.styles({'width': '60px', 'float': 'right'})
			.attrs({type: 'number', value: prev_rotate ? prev_rotate[0] : 0, min: -180, max: 180, step: 0.50})
			.on("input", function(){
					if(this.value > 180)
							this.value = 180;
					else if (this.value < -180)
							this.value = -180;
					handle_proj_center_button([this.value, null, null]);
			});

	let phi_section = rotate_section.append('p')
			.style('clear', 'both');
	phi_section.append('span')
			.style('float', 'left')
			.html(i18next.t('app_page.section5.projection_center_phi'));
	let phi_input = phi_section.append('input')
			.styles({'width': '60px', 'float': 'right'})
			.attrs({type: 'number', value: prev_rotate ? prev_rotate[1] : 0, min: -180, max: 180, step: 0.5})
			.on("input", function(){
					if(this.value > 180)
							this.value = 180;
					else if (this.value < -180)
							this.value = -180;
					handle_proj_center_button([null, this.value, null]);
			});

	let gamma_section = rotate_section.append('p')
			.style('clear', 'both');
	gamma_section.append('span')
			.style('float', 'left')
			.html(i18next.t('app_page.section5.projection_center_gamma'));
	let gamma_input = gamma_section.append('input')
			.styles({'width': '60px', 'float': 'right'})
			.attrs({type: 'number', value: prev_rotate ? prev_rotate[2] : 0, min: -90, max: 90, step: 0.5})
			.on("input", function(){
					if(this.value > 90)
							this.value = 90;
					else if (this.value < -90)
							this.value = -90;
					handle_proj_center_button([null, null, this.value]);
			});
	// }
	// if(prev_parallels){
	let parallels_section = options_proj_content.append('div')
			.styles({'text-align': 'center', 'clear': 'both'})
			.style('display', prev_parallels ? '' : 'none');
	parallels_section.append('span')
			.html(i18next.t('app_page.section5.parallels'));
	let inputs = parallels_section.append('p')
			.styles({'text-align': 'center', 'margin': 'auto'});
	let sp1_input = inputs.append('input')
			.styles({width: '60px', display: 'inline', 'margin-right': '2px'})
			.attrs({type: 'number', value: prev_parallels ? prev_parallels[0] : 0, min: -90, max: 90, step: 0.5})
			.on("input", function(){
					if(this.value > 90)
							this.value = 90;
					else if (this.value < -90)
							this.value = -90;
					handle_parallels_change([this.value, null]);
			});
	let sp2_input = inputs.append('input')
			.styles({width: '60px', display: 'inline', 'margin-left': '2px'})
			.attrs({type: 'number', value: prev_parallels ? prev_parallels[1] : 0, min: -90, max: 90, step: 0.5})
			.on("input", function(){
					if(this.value > 90)
							this.value = 90;
					else if (this.value < -90)
							this.value = -90;
					handle_parallels_change([null, this.value]);
			});
	// } else if(prev_parallel){
	let parallel_section = options_proj_content.append('div')
			.styles({'text-align': 'center', 'clear': 'both'})
			.style('display', prev_parallel ? '' : 'none');
	parallel_section.append('span')
			.html(i18next.t('app_page.section5.parallel'));

	let sp_input = parallel_section.append('p')
			.styles({'text-align': 'center', 'margin': 'auto'})
			.append('input')
			.styles({width: '60px', display: 'inline', 'margin-right': '2px'})
			.attrs({type: 'number', value: prev_parallel || 0, min: -90, max: 90, step: 0.5})
			.on("input", function(){
					if(this.value > 90)
							this.value = 90;
					else if (this.value < -90)
							this.value = -90;
					handle_parallel_change(this.value);
			});
	// }
	accordionize2(".accordion_proj", container);
	let clean_up_box = () => {
			container.remove();
			overlay_under_modal.hide();
			document.removeEventListener('keydown', fn_cb);
	};
	let fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose_cancel); };
  let _onclose_cancel = () => {
			clean_up_box();
			if(prev_projection != "proj4"){
					current_proj_name = prev_projection;
					s = prev_scale;
					t = prev_translate.slice();
					change_projection(current_proj_name)
			} else if (prev_projection == "proj4"){

			}
			if(prev_rotate){ handle_proj_center_button(prev_rotate); }
			if(prev_parallels){ handle_parallels_change(prev_parallels); }
			else if(prev_parallel){ handle_parallel_change(prev_parallel); }
  };
  container.querySelector(".btn_cancel").onclick = _onclose_cancel;
  container.querySelector("#xclose").onclick = _onclose_cancel;
  container.querySelector(".btn_ok").onclick = clean_up_box;
  document.addEventListener('keydown', fn_cb);
  overlay_under_modal.display();
};


// Function to change (one of more of) the three rotations axis of a d3 projection
// and redraw all the path (+ move symbols layers) in respect to that
function handle_proj_center_button(param){
    // Fetch the current rotation params :
    let current_rotation = proj.rotate();
    // Reuse it for the missing value passed in arguments :
    param = param.map((val,i) => val ? val : current_rotation[i]);
    // Do the rotation :
    proj.rotate(param);
    // Redraw the path and move the symbols :
    map.selectAll(".layer").selectAll("path").attr("d", path);
    reproj_symbol_layer();
}

function handle_parallels_change(parallels){
    let current_values = proj.parallels();
    parallels = parallels.map((val,i) => val ? val : current_values[i]);
    proj.parallels(parallels);
    map.selectAll(".layer").selectAll("path").attr("d", path);
    reproj_symbol_layer();
}

function handle_parallel_change(parallel){
    proj.parallel(parallel);
    map.selectAll(".layer").selectAll("path").attr("d", path);
    reproj_symbol_layer();
}
