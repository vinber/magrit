function get_menu_option(func){
    var menu_option = {
        "stewart":{
            "title":"Stewart potentials",
            "desc":"Compute stewart potentials...",
            "popup_factory": "createFuncOptionsBox_Stewart",
            "fields":[["select","Variable name", "self.name"],
                      ["input","Span (meters)"],
                      ["input","Beta"],
                      ["list","Function type",["Pareto", "Exponential"]],
                      ["input","Resolution (meters)"],
                      ["input","Number of class (opt.)"]]
            },
        "test":{
            "title":"No functionnality provided here",
            "desc":"Really nothing.."
            },
        "prop_symbol":{
            "title":"Proportional symbols",
            "popup_factory": "createFuncOptionsBox_PropSymbol",
            "desc":"Display proportional symbols with appropriate discretisation on a numerical field of your data"
            },
        "choropleth":{
            "title":"Choropleth map",
            "popup_factory": "createFuncOptionsBox_Choropleth",
            "desc":"Render a choropleth map on a numerical field of your data"
            },
    };
    return menu_option[func.toLowerCase()] || {}
}

function popup_function(){
    var layer_name = Object.getOwnPropertyNames(user_data);

    if(!(layer_name.length === 1)){
        alert("You shouldn't be able to arrive here")
        return;
    }

    layer_name = layer_name[0];

    var modal = eval([
        get_menu_option(func).popup_factory, "(\"", layer_name, "\")"].join(''));

    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
    return center(modal);
};


function createFuncOptionsBox_Stewart(layer){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(layer),
         fields = Object.getOwnPropertyNames(user_data[layer][0]);

     bg.className = 'overlay';
     nwBox.id = [layer, '_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_popup'].join(''));
    dialog_content.append('h3').html('Stewart potentials');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });
    var span = dialog_content.append('p').html('Span :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 0).attr("min", 0).attr("max", 100000).attr("step", 0.1);
    var beta = dialog_content.append('p').html('Beta :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 0).attr("min", 0).attr("max", 10).attr("step", 0.1);
    var resolution = dialog_content.append('p').html('Resolution :').insert('input').attr('type', 'number').attr('class', 'params').attr('value', 0).attr("min", 0).attr("max", 100000).attr("step", 0.1);
    var func_selec = dialog_content.append('p').html('Function type :').insert('select').attr('class', 'params');
    ['Exponential', 'Pareto'].forEach(function(fun_name){func_selec.append("option").text(fun_name).attr("value", fun_name);});
    dialog_content.append('button').attr('id', 'yes').text('Compute')
    dialog_content.append('button').attr('id', 'no').text('Close');
     qs('#yes').onclick=function(){
        console.log([field_selec.node().value, span.node().value, beta.node().value, func_selec.node().value, resolution.node().value]);
        var formToSend = new FormData();
        formToSend.append("json", JSON.stringify({
            "topojson": targeted_topojson,
            "var_name": field_selec.node().value,
            "span": span.node().value,
            "beta": beta.node().value,
            "type_fun": func_selec.node().value,
            "resolution": resolution.node().value}))
        $.ajax({
            processData: false,
            contentType: false,
            cache: false,
            url: '/R_compute/stewart',
            data: formToSend,
            type: 'POST',
            error: function(error) { console.log(error); },
            success: function(data){ add_layer_fun(data) ; }
        });

        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}


function createFuncOptionsBox_PropSymbol(layer){
     var nwBox = document.createElement('div'),
         bg = document.createElement('div'),
         g_lyr_name = "#"+trim(layer),
         fields = Object.getOwnPropertyNames(user_data[layer][0]),
         ref_size_val = undefined,
         selected_disc = undefined;

     bg.className = 'overlay';
     nwBox.id = [layer, '_popup'].join('');
     nwBox.className = 'popup';

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

    var dialog_content = d3.select(["#", layer, '_popup'].join(''));
    dialog_content.append('h3').html('Proportional symbols');
    var field_selec = dialog_content.append('p').html('Field :').insert('select').attr('class', 'params');
    fields.forEach(function(field){ field_selec.append("option").text(field).attr("value", field); });

    var discretization = dialog_content.append('div').attr("id", "discretization").style('border', "solid 2px black")
                                                    .html('<b><i>Discretization</i></b>')
                                                    .insert("p").html("Type")
                                                    .insert("select").attr("class", "params")
                                                    .on("change", function(){});
    ["Jenks", "Q4", "Q6", "Equal interval", "Standard deviation", "Geometric progression"].forEach(function(name){
        discretization.append("option").text(name).attr("value", name);
    });
    var nb_class = d3.select("#discretization").insert('p').html("Number of class")
                                                .append("input")
                                                .attr("type", "number")
                                                .attr({min: 0, max: 20, value: 6, step:1})

    d3.select("#discretization").insert('p').html("")
                                .append("button").html("Display and arrange class")
                                .on("click", function(){
                                    display_discretization(layer, field_selec.node().value, nb_class.node().value, discretization.node().value)});

    var max_size = dialog_content.append('p').html('Max. size (px)')
                                 .insert('input').attr('type', 'range')
                                 .attr('class', 'params')
                                 .attr({min: 0, max: 1000, value: 0, step:0.1});

    var ref_size = dialog_content.append('p').html('Reference (fixed) size (px) :')
                                 .insert('input').attr('type', 'number')
                                 .attr('class', 'params').attr('value', ref_size_val)
                                 .attr({min: 0, max: 1500, value: ref_size_val, step:0.1});

    var symb_selec = dialog_content.append('p').html('Symbol type :').insert('select').attr('class', 'params');
    ['Circle', 'Square'].forEach(function(symb_name){symb_selec.append("option").text(symb_name).attr("value", symb_name);});

    dialog_content.append('button').attr('id', 'yes').text('Compute')
    dialog_content.append('button').attr('id', 'no').text('Close');

     qs('#yes').onclick=function(){
        deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}
