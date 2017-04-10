"use strict";

var display_box_symbol_typo = function(layer, field, categories){
    var fetch_symbol_categories = function(){
        let categ = document.getElementsByClassName("typo_class"),
            symbol_map = new Map();
        for(let i = 0; i < categ.length; i++){
            let selec =  categ[i].querySelector(".symbol_section"),
                new_name = categ[i].querySelector(".typo_name").value;
            if(selec.style.backgroundImage.length > 7){
                let img = selec.style.backgroundImage.split("url(")[1].substring(1).slice(0,-2);
                let size = +categ[i].querySelector("#symbol_size").value
                symbol_map.set(categ[i].__data__.name, [img, size, new_name, cats[i].nb_elem]);
            } else {
                symbol_map.set(categ[i].__data__.name, [null, 0, new_name, cats[i].nb_elem]);
            }
        }
        return symbol_map;
    }
    var nb_features = current_layers[layer].n_features,
        data_layer = user_data[layer],
        cats = [],
        res_symbols = window.default_symbols,
        default_d_url = 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJmbGFnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjMycHgiIGhlaWdodD0iMzJweCIgdmlld0JveD0iMCAwIDU3OS45OTcgNTc5Ljk5NyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNTc5Ljk5NyA1NzkuOTk3IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggZmlsbD0icGFyYW0oZmlsbCkgIzAwMCIgZmlsbC1vcGFjaXR5PSJwYXJhbShmaWxsLW9wYWNpdHkpIiBzdHJva2U9InBhcmFtKG91dGxpbmUpICNGRkYiIHN0cm9rZS1vcGFjaXR5PSJwYXJhbShvdXRsaW5lLW9wYWNpdHkpIiBzdHJva2Utd2lkdGg9InBhcmFtKG91dGxpbmUtd2lkdGgpIDAiIGQ9Ik0yMzEuODQ2LDQ3Mi41NzJWMzEuODA2aC0yMi4xOHY0NDAuNTU3JiMxMDsmIzk7Yy0zNC4wMTYsMi42NDktNTkuNDE5LDE4Ljc2Ny01OS40MTksMzguODcxYzAsMjIuMDIxLDMwLjQ1NiwzOS4yNzEsNjkuMzM3LDM5LjI3MWMzOC44NzcsMCw2OS4zMzItMTcuMjUsNjkuMzMyLTM5LjI3MSYjMTA7JiM5O0MyODguOTE3LDQ5MS41OTUsMjY0LjY3NCw0NzUuNzY0LDIzMS44NDYsNDcyLjU3MnoiLz4KPHBvbHlnb24gZmlsbD0icGFyYW0oZmlsbCkgIzAwMCIgZmlsbC1vcGFjaXR5PSJwYXJhbShmaWxsLW9wYWNpdHkpIiBzdHJva2U9InBhcmFtKG91dGxpbmUpICNGRkYiIHN0cm9rZS1vcGFjaXR5PSJwYXJhbShvdXRsaW5lLW9wYWNpdHkpIiBzdHJva2Utd2lkdGg9InBhcmFtKG91dGxpbmUtd2lkdGgpIDAiIHBvaW50cz0iMjM1LjI0MywyOS40OTIgMjMzLjcyMywyMDcuNjI4IDQyOS43NDksMjEwLjMyOSAiLz4KPC9zdmc+")';

    if(!categories){
        categories = new Map();
        for(let i = 0; i < nb_features; ++i){
            let value = data_layer[i][field];
            let ret_val = categories.get(value);
            if(ret_val)
                categories.set(value, [ret_val[0] + 1, [i].concat(ret_val[1])]);
            else
                categories.set(value, [1, [i]]);
        }
        categories.forEach( (v,k) => { cats.push({name: k, new_name: k, nb_elem: v[0], img: default_d_url}) });
    } else {
        categories.forEach( (v,k) => { cats.push({name: k, new_name: v[2], nb_elem: v[3], img: "url(" + v[0] + ")"}) });
    }
    let nb_class = cats.length;

    var modal_box = make_dialog_container(
        "symbol_box",
        i18next.t("app_page.symbol_typo_box.title", {layer: layer, nb_features: nb_features}),
        "dialog");
    var newbox = d3.select("#symbol_box").select(".modal-body")
                    .styles({'overflow-y': 'scroll', 'max-height': (window.innerHeight - 145) + 'px'});

    newbox.append("h3").html("")
    newbox.append("p")
            .html(i18next.t("app_page.symbol_typo_box.field_categ", {field: field, nb_class: nb_class, nb_features: nb_features}));
    newbox.append("ul").style("padding", "unset").attr("id", "typo_categories")
            .selectAll("li")
            .data(cats).enter()
            .append("li")
                .styles({margin: "auto", "list-style": "none"})
                .attr("class", "typo_class")
                .attr("id", (d,i) => ["line", i].join('_'));

    newbox.selectAll(".typo_class")
            .append("span")
            .attrs({"class": "three_dots"})
            .style("cursor", "grab");

    newbox.selectAll(".typo_class")
            .append("input")
            .styles({width: "100px", height: "auto", display: "inline-block", "vertical-align": "middle", "margin-right": "7.5px"})
            .attrs(d => ({class: 'typo_name', value: d.new_name, id: d.name}));

    newbox.selectAll(".typo_class")
            .insert("p")
            .attrs({class: 'symbol_section', 'title': i18next.t('app_page.symbol_typo_box.title_click')})
            .style("background-image", d => d.img)
            .styles({width: "32px", height: "32px", margin: "0px 1px 0px 1px",
                    "border-radius": "10%", border: "1px dashed blue",
                    display: "inline-block", "background-size": "32px 32px",
                    'vertical-align': 'middle'})
            .on("click", function(){
                modal_box.hide();
                box_choice_symbol(res_symbols, ".dialog")
                  .then(confirmed => {
                    modal_box.show();
                    if(confirmed){
                        this.style.backgroundImage = confirmed;
                    }
                });
            });

    newbox.selectAll(".typo_class")
            .insert("span")
            .html( d => i18next.t("app_page.symbol_typo_box.count_feature", {nb_features: d.nb_elem}));

    newbox.selectAll(".typo_class")
            .insert('input')
            .attrs({type: 'number', id: 'symbol_size', value: 50})
            .styles({width: '50px', display: 'inline-block'});

    newbox.selectAll(".typo_class")
            .insert("span")
            .style("display", "inline-block")
            .html(" px");
    new Sortable(document.getElementById("typo_categories"));

    let deferred = Promise.pending(),
        container = document.getElementById("symbol_box"),
        fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose); };

    let clean_up_box = function(){
        container.remove();
        overlay_under_modal.hide();
        document.removeEventListener('keydown', fn_cb);
    };

    let _onclose = () => {
        deferred.resolve(false);
        clean_up_box();
    };

    container.querySelector(".btn_ok").onclick = function(){
        let symbol_map = fetch_symbol_categories();
        deferred.resolve([nb_class, symbol_map]);
        clean_up_box();
    };
    container.querySelector(".btn_cancel").onclick = _onclose;
    container.querySelector("#xclose").onclick = _onclose;
    document.addEventListener('keydown', fn_cb);
    overlay_under_modal.display();
    return deferred.promise;
};

function box_choice_symbol(sample_symbols, parent_css_selector){
    var modal_box = make_dialog_container(
        "box_choice_symbol",
        i18next.t("app_page.box_choice_symbol.title"),
        "dialog");
    overlay_under_modal.display();
    let container = document.getElementById("box_choice_symbol");
    let btn_ok = container.querySelector('.btn_ok');
    container.querySelector('.modal-dialog').classList.add('fitContent');
    btn_ok.disabled = "disabled";
    var newbox = d3.select(container).select(".modal-body").style('width', '220px');
    newbox.append("p")
        .html('<b>' + i18next.t("app_page.box_choice_symbol.select_symbol") + '</b>');

    var box_select = newbox.append("div")
        .styles({width: "190px", height: "100px", overflow: "auto", border: "1.5px solid #1d588b"})
        .attr("id", "symbols_select");

    box_select.selectAll("p")
        .data(sample_symbols)
        .enter()
        .append("p")
        .attrs( d => ({
          "id": "p_" + d[0].replace(".svg", ""),
          "title": d[0]
        }))
        .html(d => d[1])
        .styles({width: "32px", height: "32px",
                 margin: "auto", display: "inline-block"});

    box_select.selectAll("svg")
        .attr("id", function(){ return this.parentElement.id.slice(2) })
        .attrs({height: "32px", width: "32px"})
        .on("click", function(){
            box_select.selectAll("svg").each(function(){
                this.parentElement.style.border = "";
                this.parentElement.style.padding = "0px";
            })
            this.parentElement.style.padding = "-1px";
            this.parentElement.style.border = "1px dashed red";
            let svg_dataUrl = [
                'url("data:image/svg+xml;base64,',
                btoa(new XMLSerializer().serializeToString(this)),
                '")'].join('');
            btn_ok.disabled = false;
            newbox.select("#current_symb").style("background-image", svg_dataUrl);
        });

    newbox.append("p")
        .attr("display", "inline")
        .html('<b>' + i18next.t("app_page.box_choice_symbol.upload_symbol") + '</b>');
    newbox.append("p")
        .styles({margin: 'auto', 'text-align': 'center'})
        .append("button")
        .html(i18next.t("app_page.box_choice_symbol.browse"))
        .on("click", function(){
            let input = document.createElement('input');
            input.setAttribute("type", "file");
            input.onchange = function(event){
                let file = event.target.files[0],
                    file_name = file.name,
                    reader = new FileReader();
                reader.onloadend = function(){
                    let dataUrl_res = ['url("', reader.result, '")'].join('');
                    btn_ok.disabled = false;
                    newbox.select("#current_symb").style("background-image", dataUrl_res);
                }
                reader.readAsDataURL(file);
            }
            input.dispatchEvent(new MouseEvent("click"));
        });

    newbox.insert("p")
        .style('text-align', 'center')
        .html(i18next.t("app_page.box_choice_symbol.selected_symbol"));
    newbox.insert('div')
        .style('text-align', 'center')
        .append("p")
        .attrs({"class": "symbol_section", "id": "current_symb"})
        .styles({width: "32px", height: "32px", display: "inline-block",
                "border-radius": "10%", "background-size": "32px 32px",
                "vertical-align": "middle", "margin": "auto", "background-image": "url('')"
              });

    let deferred = Promise.pending();
    let fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose); };
    let clean_up_box = function(){
        container.remove();
        if(parent_css_selector) {
            reOpenParent(parent_css_selector);
        } else {
            overlay_under_modal.hide();
        }
        document.removeEventListener('keydown', fn_cb);
    };

    container.querySelector(".btn_ok").onclick = function(){
        let res_url = newbox.select("#current_symb").style("background-image");
        deferred.resolve(res_url);
        clean_up_box();
    }

    let _onclose = () => {
        deferred.resolve(false);
        clean_up_box();
    };
    container.querySelector(".btn_cancel").onclick = _onclose;
    container.querySelector("#xclose").onclick = _onclose;
    document.addEventListener('keydown', fn_cb);
    return deferred.promise;
}


function make_style_box_indiv_symbol(symbol_node){
    let parent = symbol_node.parentElement;
    let type_obj =  parent.classList.contains("layer") ? 'layer' : 'layout';
    let current_options = {
        size: symbol_node.getAttribute("width"),
        scalable: type_obj == 'layout' && parent.classList.contains('scalable-legend') ? true : false
        };
    let ref_coords = {x: +symbol_node.getAttribute("x") + (+current_options.size.slice(0, -2) / 2),
                      y: +symbol_node.getAttribute("y") + (+current_options.size.slice(0, -2) / 2)};
    let new_params = {};
    let self = this;
    make_confirm_dialog2("styleTextAnnotation", i18next.t('app_page.single_symbol_edit_box.title'))
        .then(function(confirmed){
            if(!confirmed){
                symbol_node.setAttribute("width", current_options.size);
                symbol_node.setAttribute("height", current_options.size);
                symbol_node.setAttribute("x", ref_coords.x - (+current_options.size.slice(0, -2) / 2));
                symbol_node.setAttribute("y", ref_coords.y - (+current_options.size.slice(0, -2) / 2));
                if(current_options.scalable){
                    let zoom_scale = svg_map.__zoom;
                    parent.setAttribute('transform', ['translate(', zoom_scale.x, ',', ') scale(', zoom_scale.k, ',', zoom_scale.k, ')'].join(''));
                } else {
                    parent.setAttribute('transform', undefined);
                }
            }
        });
    let box_content = d3.select(".styleTextAnnotation").select(".modal-body").insert("div");
    let a = box_content.append("p").attr('class', 'line_elem');
    a.append('span')
        .html(i18next.t('app_page.single_symbol_edit_box.image_size'));
    a.append("input")
        .style('float', 'right')
        .attrs({type: "number", id: "font_size", min: 0, max: 150, step: "any", value: +symbol_node.getAttribute("width").slice(0,-2)})
        .on("change", function(){
            let new_val = this.value + "px";
            symbol_node.setAttribute("width", new_val);
            symbol_node.setAttribute("height", new_val);
            symbol_node.setAttribute("x", ref_coords.x - (+this.value / 2));
            symbol_node.setAttribute("y", ref_coords.y - (+this.value / 2));
        });
    if(type_obj == 'layout'){
        let current_state = parent.classList.contains('scalable-legend');
        let b = box_content.append('p').attr('class', 'line_elem');
        b.append('label')
            .attrs({for: 'checkbox_symbol_zoom_scale', class: 'i18n', 'data-i18n': '[html]app_page.single_symbol_edit_box.scale_on_zoom'})
            .html(i18next.t('app_page.single_symbol_edit_box.scale_on_zoom'));
        b.append('input')
            .style('float', 'right')
            .attrs({type: 'checkbox', id: 'checkbox_symbol_zoom_scale'})
            .on('change', function(){
                let zoom_scale = svg_map.__zoom;
                if(this.checked){
                    symbol_node.setAttribute('x', (symbol_node.x.baseVal.value - zoom_scale.x) / zoom_scale.k);
                    symbol_node.setAttribute('y', (symbol_node.y.baseVal.value - zoom_scale.y) / zoom_scale.k);
                    parent.setAttribute('transform', ['translate(', zoom_scale.x, ', ', zoom_scale.y, ') scale(', zoom_scale.k, ',', zoom_scale.k, ')'].join(''));
                    parent.classList.add('scalable-legend');
                } else {
                    symbol_node.setAttribute('x', (zoom_scale.x + symbol_node.x.baseVal.value) * zoom_scale.k);
                    symbol_node.setAttribute('y', (zoom_scale.y + symbol_node.y.baseVal.value) * zoom_scale.k);
                    parent.setAttribute('transform', undefined);
                    parent.classList.remove('scalable-legend');
                }
            });
        document.getElementById("checkbox_symbol_zoom_scale").checked = current_options.scalable;
    }
};
