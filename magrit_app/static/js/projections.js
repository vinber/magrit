"use strict";

const available_projections = new Map([
	['Albers', {'name': 'geoAlbers', 'scale': '400'}],
	["Armadillo", {'name': 'geoArmadillo', 'scale': '400'}],
	["AzimuthalEquidistant", {'name': 'geoAzimuthalEquidistant' ,'scale': '700'}],
	["AzimuthalEqualArea", {'name': 'geoAzimuthalEqualArea' ,'scale': '700'}],
	["Baker", {'name': 'geoBaker', 'scale': '400'}],
	["Boggs", {'name': 'geoBoggs', 'scale': '400'}],
	["InterruptedBoggs", {'name': 'geoInterruptedBoggs', 'scale': '400'}],
	["Bonne", {'name': 'geoBonne', 'scale': '400'}],
	["Bromley", {'name': 'geoBromley', 'scale': '400'}],
	["Collignon", {'name': 'geoCollignon', 'scale': '400'}],
	["Cassini", {"name": 'geoEquirectangular', 'scale': '400', 'rotate': [0,0,90]}],
	["ConicConformal", {'name': 'geoConicConformal', 'scale': '400', 'parallels': [44, 49]}],
	["ConicEqualArea", {'name': 'geoConicEqualArea', 'scale': '400'}],
	["ConicEquidistant", {'name': 'geoConicEquidistant', 'scale': '400'}],
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

"+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs"

const createBoxCustomProjection = function(){
	let prev_rotate = proj.rotate ? proj.rotate() : undefined,
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

	dialog.style.width = undefined;
	dialog.style.maxWidth = '400px';
	dialog.style.minWidth = '250px';

	if(prev_rotate){
			let lambda_section = content.append('p');
			lambda_section.append('span')
					.style('float', 'left')
					.html(i18next.t('app_page.section5.projection_center_lambda'));
			lambda_section.append('input')
					.styles({'width': '60px', 'float': 'right'})
					.attrs({type: 'number', value: prev_rotate[0], min: -180, max: 180, step: 0.50})
					.on("input", function(){
							if(this.value > 180)
									this.value = 180;
							else if (this.value < -180)
									this.value = -180;
							handle_proj_center_button([this.value, null, null]);
							document.getElementById('form_projection_center').value = this.value;
							document.getElementById('proj_center_value_txt').value = this.value;
					});

			let phi_section = content.append('p')
					.style('clear', 'both');
			phi_section.append('span')
					.style('float', 'left')
					.html(i18next.t('app_page.section5.projection_center_phi'));
			phi_section.append('input')
					.styles({'width': '60px', 'float': 'right'})
					.attrs({type: 'number', value: prev_rotate[1], min: -180, max: 180, step: 0.5})
					.on("input", function(){
							if(this.value > 180)
									this.value = 180;
							else if (this.value < -180)
									this.value = -180;
							handle_proj_center_button([null, this.value, null]);
					});

			let gamma_section = content.append('p')
					.style('clear', 'both');
			gamma_section.append('span')
					.style('float', 'left')
					.html(i18next.t('app_page.section5.projection_center_gamma'));
			gamma_section.append('input')
					.styles({'width': '60px', 'float': 'right'})
					.attrs({type: 'number', value: prev_rotate[2], min: -90, max: 90, step: 0.5})
					.on("input", function(){
							if(this.value > 90)
									this.value = 90;
							else if (this.value < -90)
									this.value = -90;
							handle_proj_center_button([null, null, this.value]);
					});
	}
	if(prev_parallels){
			let parallels_section = content.append('p')
					.styles({'text-align': 'center', 'clear': 'both'});
			parallels_section.append('span')
					.html(i18next.t('app_page.section5.parallels'));
			let inputs = parallels_section.append('p')
					.styles({'text-align': 'center', 'margin': 'auto'});
			inputs.append('input')
					.styles({width: '60px', display: 'inline', 'margin-right': '2px'})
					.attrs({type: 'number', value: prev_parallels[0], min: -90, max: 90, step: 0.5})
					.on("input", function(){
							if(this.value > 90)
									this.value = 90;
							else if (this.value < -90)
									this.value = -90;
							handle_parallels_change([this.value, null]);
					});
			inputs.append('input')
					.styles({width: '60px', display: 'inline', 'margin-left': '2px'})
					.attrs({type: 'number', value: prev_parallels[1], min: -90, max: 90, step: 0.5})
					.on("input", function(){
							if(this.value > 90)
									this.value = 90;
							else if (this.value < -90)
									this.value = -90;
							handle_parallels_change([null, this.value]);
					});
	} else if(prev_parallel){
			let parallel_section = content.append('p')
					.styles({'text-align': 'center', 'clear': 'both'});
			parallel_section.append('span')
					.html(i18next.t('app_page.section5.parallel'));
			let inputs = parallel_section.append('p')
					.styles({'text-align': 'center', 'margin': 'auto'});
			inputs.append('input')
					.styles({width: '60px', display: 'inline', 'margin-right': '2px'})
					.attrs({type: 'number', value: prev_parallel, min: -90, max: 90, step: 0.5})
					.on("input", function(){
							if(this.value > 90)
									this.value = 90;
							else if (this.value < -90)
									this.value = -90;
							handle_parallel_change(this.value);
					});
	}

	let clean_up_box = () => {
			container.remove();
			overlay_under_modal.hide();
			document.removeEventListener('keydown', fn_cb);
	};
	let fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose_cancel); };
  let _onclose_cancel = () => {
					clean_up_box();
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
    proj.parallels(parallel);
    map.selectAll(".layer").selectAll("path").attr("d", path);
    reproj_symbol_layer();
}
