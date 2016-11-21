"use strict";

function box_choice_symbol(sample_symbols, parent_css_selector){
    var modal_box = make_dialog_container(
        "box_choice_symbol",
        i18next.t("app_page.box_choice_symbol.title"),
        "dialog");
    var newbox = d3.select("#box_choice_symbol").select(".modal-body");

    newbox.append("h3").html(i18next.t("app_page.box_choice_symbol.title"));
    newbox.append("p").html(i18next.t("app_page.box_choice_symbol.select_symbol"));

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
            newbox.select("#current_symb").style("background-image", svg_dataUrl);
        });

    newbox.append("p")
        .attr("display", "inline")
        .html(i18next.t("app_page.box_choice_symbol.upload_symbol"));
    newbox.append("button")
        .html(i18next.t("app_page.box_choice_symbol.browse"))
        .on("click", function(){
            let input = document.createElement('input');
            input.setAttribute("type", "file");
            input.onchange = function(event){
                let file = event.target.files[0];
                let file_name = file.name;
                let reader = new FileReader()
                reader.onloadend = function(){
                    let result = reader.result;
                    let dataUrl_res = ['url("', result, '")'].join('');
                    newbox.select("#current_symb").style("background-image", dataUrl_res);
                }
                reader.readAsDataURL(file);
            }
            input.dispatchEvent(new MouseEvent("click"));
        });

    newbox.insert("p").html(i18next.t("app_page.box_choice_symbol.selected_symbol"))
    newbox.insert("p")
            .attrs({"class": "symbol_section", "id": "current_symb"})
            .styles({width: "32px", height: "32px", display: "inline-block",
                    "border-radius": "10%", "background-size": "32px 32px",
                    "vertical-align": "middle", "margin": "auto", "background-image": "url('')"
                  });

    let deferred = Q.defer(),
        container = document.getElementById("box_choice_symbol");

    container.querySelector(".btn_ok").onclick = function(){
        let res_url = newbox.select("#current_symb").style("background-image");
        deferred.resolve(res_url);
        modal_box.close();
        container.remove();
        if(parent_css_selector) reOpenParent(parent_css_selector);
    }

    let _onclose = () => {
        deferred.resolve(false);
        modal_box.close();
        container.remove();
        if(parent_css_selector) reOpenParent(parent_css_selector);

    };
    container.querySelector(".btn_cancel").onclick = _onclose;
    container.querySelector("#xclose").onclick = _onclose;
    return deferred.promise;
};


function make_style_box_indiv_symbol(label_node){
    let current_options = {size: label_node.getAttribute("width")};
    let ref_coords = {x: +label_node.getAttribute("x") + (+current_options.size.slice(0, -2) / 2),
                      y: +label_node.getAttribute("y") + (+current_options.size.slice(0, -2) / 2)};
    let new_params = {};
    let self = this;
    make_confirm_dialog2("styleTextAnnotation", "Label options")
        .then(function(confirmed){
            if(!confirmed){
                label_node.setAttribute("width", current_options.size);
                label_node.setAttribute("height", current_options.size);
                label_node.setAttribute("x", ref_coords.x - (+current_options.size.slice(0, -2) / 2));
                label_node.setAttribute("y", ref_coords.y - (+current_options.size.slice(0, -2) / 2));
            }
        });
    let box_content = d3.select(".styleTextAnnotation").select(".modal-body").insert("div");
    box_content.append("p").html("Image size ")
            .append("input").attrs({type: "number", id: "font_size", min: 0, max: 150, step: "any", value: +label_node.getAttribute("width").slice(0,-2)})
            .on("change", function(){
                let new_val = this.value + "px";
                label_node.setAttribute("width", new_val);
                label_node.setAttribute("height", new_val);
                label_node.setAttribute("x", ref_coords.x - (+this.value / 2));
                label_node.setAttribute("y", ref_coords.y - (+this.value / 2));
            });
};
