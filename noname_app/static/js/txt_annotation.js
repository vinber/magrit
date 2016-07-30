"use strict";

class Textbox {
    // woo lets use ES2015 classes !
    constructor(parent, new_id_txt_annot, position=[10, 30]){
        this.x = position[0];
        this.y = position[1];
        this.fontsize = 14;

        let context_menu = new ContextMenu(),
            getItems = () =>  [
                {"name": "Edit style...", "action": () => { this.editStyle(); }},
                {"name": "Delete", "action": () => { this.text_annot.remove(); }}
            ];

        let drag_txt_annot = d3.behavior.drag()
                .origin(function() {
                    let t = d3.select(this.parentElement);
                    return {x:  t.attr("x") - d3.transform(d3.event).translate[0],
                            y:  t.attr("y") - d3.transform(d3.event).translate[1]};
                })
                .on("dragstart", () => {
                    d3.event.sourceEvent.stopPropagation();
                    if(d3.select("#hand_button").classed("active"))
                        zoom.on("zoom", null);
                  })
                .on("dragend", () => {
                    if(d3.select("#hand_button").classed("active"))
                        zoom.on("zoom", zoom_without_redraw);
                  })
                .on("drag", function(){
                    d3.event.sourceEvent.preventDefault();
                    d3.select(this.parentElement).attr("x", d3.event.x).attr("y", d3.event.y);
                  });

        let foreign_obj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreign_obj.setAttributeNS(null, "x", this.x);
        foreign_obj.setAttributeNS(null, "y", this.y);
        foreign_obj.setAttributeNS(null, "overflow", "visible");
        foreign_obj.setAttributeNS(null, "width", "100%");
        foreign_obj.setAttributeNS(null, "height", "100%");
        foreign_obj.setAttributeNS(null, "class", "legend txt_annot");
        foreign_obj.id = new_id_txt_annot;

        let inner_p = document.createElement("p");
        inner_p.setAttribute("id", "in_" + new_id_txt_annot);
//        inner_p.setAttribute("contentEditable", "true");
        inner_p.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        inner_p.style = "display:table-cell;padding:10px;color:#000;"
            + "opacity:1;font-family:Verdana;font-size:14px;white-space: pre;"
            + "word-wrap: normal; overflow: visible; overflow-y: visible; overflow-x: visible;"
        inner_p.innerHTML = "Enter your text...";
        foreign_obj.appendChild(inner_p);
        parent.appendChild(foreign_obj);

        let frgn_obj = map.select("#" + new_id_txt_annot);
        let inner_ft = frgn_obj.select('p');
        inner_ft.call(drag_txt_annot);

        inner_ft.on("contextmenu", () => {
            context_menu.showMenu(d3.event,
                                  document.querySelector("body"),
                                  getItems());
            });

        inner_ft.on("dblclick", () => { d3.event.stopPropagation(); });

        inner_ft.on("mouseover", () => {
                    inner_ft.attr("contentEditable", "true"); // Not sure if its better to change this than always letting it editable
                    inner_ft.style("background-color", "white");
                    inner_ft.style("border", "1px solid red");
                    d3.select("body").classed("noselect", true);
                })
                .on("mouseout", () => {
                    inner_ft.attr("contentEditable", "false");
                    inner_ft.style("background-color", "transparent");
                    inner_ft.style("border", "");
                    d3.select("body").classed("noselect", false);
                });

        this.text_annot = frgn_obj;
    }

    editStyle(){
        let current_options = {size: this.text_annot.select("p").style("font-size"),
                               content: this.text_annot.select("p").html(),
                               font: ""};
        let self = this;
        var a = make_confirm_dialog("", "Valid", "Cancel", "Textbox options", "styleTextAnnotation")
            .then(function(confirmed){
                if(!confirmed){
                    self.text_annot.select("p").text(current_options.content);
                    self.fontsize = current_options.size;
                }
            });
        let box_content = d3.select(".styleTextAnnotation").insert("div");
        box_content.append("p").html("Font size ")
                .append("input").attr({type: "number", id: "font_size", min: 0, max: 34, step: 0.1, value: this.fontsize})
                .on("change", function(){
                    self.fontsize = +this.value;
                    self.text_annot.select("p").style("font-size", self.fontsize + "px")
                });
        box_content.append("p").html("Content ")
                .append("textarea").attr({id: "annotation_content"})
                .on("keyup", function(){
                    self._text = this.value;
                    self.text_annot.select("p").html(this.value)
                });
        document.getElementById("annotation_content").value = current_options.content;
    }
}
