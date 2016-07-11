"use strict";

class Textbox2 {
    // woo lets use ES2015 classes !
    constructor(parent, new_id_txt_annot, position=[10, 30]){
        this._text = "Enter your text...";
        var drag_txt_annot = d3.behavior.drag()
                .origin(function() {
                    let t = d3.select(this);
                    return {x: t.attr("x") + d3.transform(t.attr("transform")).translate[0],
                            y: t.attr("y") + d3.transform(t.attr("transform")).translate[1]};
                })
                .on("dragstart", () => {
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);

                  })
                .on("dragend", () => {
                    if(d3.select("#hand_button").classed("active"))
                        zoom.on("zoom", zoom_without_redraw);
                  })
                .on("drag", () => {
                    textgroup.attr('transform', 'translate(' + [d3.event.x, d3.event.y] + ')');
                  });
        this.fontsize = 12;
        this.x = position[0];
        this.y = position[1];
        this._width = 100;
        this._height = 20;
        this.focused = null;

        var textgroup = parent.append("g").attr("class", "txt_annot"),
            context_menu = new ContextMenu(),
            getItems = () =>  [
                {"name": "Edit style...", "action": () => { this.make_style_box(); }},
                {"name": "Delete", "action": () => { this.txt.node().parentElement.remove(); }}
            ];

        this.rct = textgroup.append("rect")
        		.attr("width", this._width)
        		.attr("height", this._height)
        		.style("fill", "beige")
        		.style("fill-opactiy", 0)
                .on("click", () => { this.focus_on() });

        this.txt = textgroup.append("text")
                .attr("id", new_id_txt_annot)
                .text(this._text)
                .style("fill","black")
                .style("font-family", "'Helvetica Neue'")
                .style("font-size", this.fontsize + "px")
                .on("click", () => { this.focus_on() });

        this.txt_width = this.txt.node().getComputedTextLength();
        this.txt.attr("x",.5*(this._width-this.txt_width));
        this.txt.attr("y",.5*(this._height+this.fontsize)-2);

        textgroup.on("mouseover", () => {
            if(this.t){
                clearTimeout(this.t);
                this.t = undefined;
            }
            this.rct.style("fill-opacity", 0.5);
            });
        textgroup.on("mouseout", () => {
            this.rct.style("fill-opacity", 0);
            if(this.focused)
                this.t = setTimeout(()=>{this.focus_on()}, 2000);
            });
        textgroup.call(drag_txt_annot);
        textgroup.on("contextmenu", () => {
            context_menu.showMenu(d3.event,
                                  document.querySelector("body"),
                                  getItems());
            });
        this.keydown_txt_annot = () => {
            let code = d3.event.keyCode;
            if (code == 8) { // Backspace
                d3.event.preventDefault();
                this._text = this._text.substring(0, this._text.length-1);
                this.setText(this._text);
            } else if (code == 46){
                let tmp = make_confirm_dialog("Delete selected text annotation ?").then(confirmed => {
                    if(confirmed){
                        this.txt.node().parentElement.remove();
                    }
                });
                return;
            } else if (code == 13) { // Enter
                this.callback();
            }
        };

        this.keypress_txt_annot = () => {
            let code = d3.event.charCode;
            console.log(this._text)
            this._text = [this._text, String.fromCodePoint(code)].join('');
            this.setText(this._text);
        };

        this.aligntext = () => {
            this._width = this.txt_width + 5;
            this.txt.attr("x", 0.5*(this._width-this.txt_width));
            this.txt.attr("y", 0.5*(this._height+this.fontsize)-2);
            this.rct.attr("width", +this._width)
                    .attr("height", this.fontsize + 8);
        };

        this.setText = str => {
            if(this._text.length == 0)
                this._text = " ";
            else if (this._text.indexOf(" ") == 0)
                this._text = this._text.substr(1)
            this.txt.text(this._text);
            this.txt_width = this.txt.node().getComputedTextLength();
            this.aligntext();
        };
    }


    get callback(){
        return callback;
    }

    set callback(_){
        this.callback = _;
    }

    get width(){
        return this._width;
    }

    set width(_){
		 this.rct.attr("width",_);
		 this.aligntext();
        this._width = _;
    }

    get height(){
        return this._height;
    }

    set height(_){
        this.rct.attr("height",_);
        this.aligntext();
        this._height = _;
    }

    make_style_box(){
        // Deactivate the "focus" on the text annotation
        // when opening its properties box to avoid fetching input in both boxes
        let start_focused = this.focused;
        if(start_focused)
            this.focus_on();

        let current_options = {size: this.fontsize,
                               content: this._text,
                               font: ""};
        let self = this;
        var a = make_confirm_dialog("", "Valid", "Cancel", "Sample layers...", "styleTextAnnotation")
            .then(function(confirmed){
                let box_ = document.querySelector(".styleTextAnnotation");
                let font_size = box_.querySelector("#font_size"),
                    content = box_.querySelector("#annotation_content");
                if(confirmed){
                    null;
                } else {
                    self._text = current_options.content;
                    self.fontsize = current_options.size;
                }
                // Re-activate focus on the text annotation is previously set:
                if(start_focused)
                    this.focus_on();
            });
        let box_content = d3.select(".styleTextAnnotation").insert("div");
        box_content.append("p").html("Font size ")
                .append("input").attr({type: "number", id: "font_size", min: 0, max: 34, step: 0.1, value: this.fontsize})
                .on("change", function(){
                    self.fontsize = +this.value;
                    self.txt.style("font-size", self.fontsize + "px");
                    self.setText(self._text);
                });
        box_content.append("p").html("Content ")
                .append("input").attr({"value": this._text, id: "annotation_content"})
                .on("keyup", function(){
                    self._text = this.value;
                    self.setText(self._text);
                });
    }

    focus_on(){
        if(this.rct.classed("active")){
            this.focused = null;
            this.rct.style("stroke", null);
            this.rct.classed("active", false);
            d3.select("body").on("keydown", null)
                             .on("keypress", null);
        } else {
            this.focused = true;
            d3.select("body").on("keydown", this.keydown_txt_annot)
                .on("keypress", this.keypress_txt_annot);
            this.rct.style("stroke","#347bbe");
            this.rct.classed("active", true);
        }
        this.t = undefined;
    }

}
