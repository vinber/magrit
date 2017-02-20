"use strict";

const available_projections = new Map([
	["Armadillo", "d3.geoArmadillo().scale(400)"],
	["AzimuthalEquidistant", "d3.geoAzimuthalEquidistant().scale(700)"],
	["AzimuthalEqualArea", "d3.geoAzimuthalEqualArea().scale(700)"],
	["Baker", "d3.geoBaker().scale(400)"],
	["Boggs", "d3.geoBoggs().scale(400)"],
	["InterruptedBoggs", "d3.geoInterruptedBoggs().scale(400)"],
	["Bonne", "d3.geoBonne().scale(400)"],
	["Bromley", "d3.geoBromley().scale(400)"],
	["Collignon", "d3.geoCollignon().scale(400)"],
	["ConicConformal", "d3.geoConicConformal().scale(400).parallels([44, 49])"],
	["ConicEqualArea", "d3.geoConicEqualArea().scale(400)"],
	["ConicEquidistant", "d3.geoConicEquidistant().scale(400)"],
	["CrasterParabolic", "d3.geoCraster().scale(400)"],
	["EckertI", "d3.geoEckert1().scale(400).translate([300, 250])"],
	["EckertII", "d3.geoEckert2().scale(400).translate([300, 250])"],
	["EckertIII", "d3.geoEckert3().scale(525).translate([150, 125])"],
	["EckertIV", "d3.geoEckert4().scale(525).translate([150, 125])"],
	["EckertV", "d3.geoEckert5().scale(400)"],
	["EckertVI", "d3.geoEckert6().scale(400)"],
	["Eisenlohr", "d3.geoEisenlohr().scale(400)"],
	["Gnomonic", "d3.geoGnomonic().scale(400)"],
	["Gringorten", "d3.geoGringorten().scale(400)"],
	["HEALPix", "d3.geoHealpix().scale(400)"],
	["Homolosine", "d3.geoHomolosine().scale(400)"],
	["InterruptedHomolosine", "d3.geoInterruptedHomolosine().scale(400)"],
	["Loximuthal", "d3.geoLoximuthal().scale(400)"],
	["Mercator",  "d3.geoMercator().scale(375).translate([525, 350])"],
	["NaturalEarth", "d3.geoNaturalEarth().scale(400).translate([375, 50])"],
	["Orthographic",  "d3.geoOrthographic().scale(475).translate([480, 480]).clipAngle(90)"],
	["Peircequincuncial", "d3.geoPeirceQuincuncial().scale(400)"],
	["Robinson", "d3.geoRobinson().scale(400)"],
	["InterruptedSinuMollweide", "d3.geoInterruptedSinuMollweide().scale(400)"],
	["Sinusoidal", "d3.geoSinusoidal().scale(400)"],
	["InterruptedSinusoidal", "d3.geoInterruptedSinusoidal().scale(400)"]
]);

const createBoxCustomProjection = function(){
	let box_content = '<div class="custom_proj_content" style="font-size:0.8rem;"></div>';
	let prev_rotate = proj.rotate(),
			prev_parallels;
	swal({
			title: i18next.t("app_page.section5.title"),
			html: box_content,
			showCancelButton: true,
			showConfirmButton: true,
			cancelButtonText: i18next.t('app_page.common.close'),
			animation: "slide-from-top",
			customClass: "swal2_large",
			onOpen: function(){
					let content = d3.select('.custom_proj_content');
					let lambda_section = content.append('p');
					lambda_section.append('span')
							.style('float', 'left')
							.html(i18next.t('app_page.section5.projection_center_lambda'));
					lambda_section.append('input')
							.styles({'width': '50px', 'float': 'right'})
							.attrs({type: 'number', value: prev_rotate[0], min: -180, max: 180, step: 0.50})
							.on("input", function(){
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
							.styles({'width': '50px', 'float': 'right'})
							.attrs({type: 'number', value: prev_rotate[1], min: -180, max: 180, step: 0.5})
							.on("input", function(){ handle_proj_center_button([null, this.value, null]); });
					let gamma_section = content.append('p')
							.style('clear', 'both');
					gamma_section.append('span')
							.style('float', 'left')
							.html(i18next.t('app_page.section5.projection_center_gamma'));
					gamma_section.append('input')
							.styles({'width': '50px', 'float': 'right'})
							.attrs({type: 'number', value: prev_rotate[2], min: -90, max: 90, step: 0.5})
							.on("input", function(){ handle_proj_center_button([null, null, this.value]); });

					if(current_proj_name.indexOf('Conic') > -1){
							prev_parallels = proj.parallels();
							let parallels_section = content.append('p')
									.styles({'text-align': 'center', 'clear': 'both'});
							parallels_section.append('span')
									.html(i18next.t('app_page.section5.parallels'));
							let inputs = parallels_section.append('p')
									.styles({'text-align': 'center', 'margin': 'auto'});
							inputs.append('input')
									.style('width', '50px').style('display', 'inline')
									.attrs({type: 'number', value: prev_parallels[0], min: -90, max: 90, step: 0.5})
									.on("input", function(){ handle_parallels_change([this.value, null]); });
							inputs.append('input')
									.style('width', '50px').style('display', 'inline')
									.attrs({type: 'number', value: prev_parallels[1], min: -90, max: 90, step: 0.5})
									.on("input", function(){ handle_parallels_change([null, this.value]); });
					}

			}
	 }).then(inputValue => { console.log('a :', inputValue); },
					 dismissValue => {
					 			// Reset the parameters to the previous values if the user click on cancel :
								handle_proj_center_button(prev_rotate);
								if(prev_parallels != undefined){
										handle_parallels_change(prev_parallels);
								}
					 });
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
