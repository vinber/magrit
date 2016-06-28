"use strict";

class Textbox2 {
    // woo lets use ES2015 classes !
    constructor(parent, new_id_txt_annot){
        this._text = "Enter your text...";
        this.drag_txt_annot = d3.behavior.drag()
                .on("dragstart", () => {
                    if(d3.select("#hand_button").classed("active")) zoom.on("zoom", null);
                    d3.event.sourceEvent.stopPropagation();
                    d3.event.sourceEvent.preventDefault();
                  })
                .on("dragend", () => {
                    if(d3.select("#hand_button").classed("active"))
                        zoom.on("zoom", zoom_without_redraw);
                  })
                .on("drag", () => {
                    console.log(d3.event.x);console.log(d3.event.y);console.log([this._width, this._height]);
                    this.textgroup.attr('transform', 'translate(' + [d3.event.x - this._width / 2, d3.event.y - this._height / 2] + ')');
                  });
        this.fontsize = 12;
        this.x = 10;
        this.y = 30;
        this._width = 100;
        this._height = 20;
        this.focused = null;

        this.textgroup = parent.append("g")
                .attr("class", "txt_annot");

        this.rct = this.textgroup.append("rect")
        		.attr("width", this._width)
        		.attr("height", this._height)
        		.style("fill", "beige")
        		.style("fill-opactiy", 0)
                .on("click", () => { this.focus_on() });

        this.txt = this.textgroup.append("text")
                .attr("id", new_id_txt_annot)
                .text(this._text)
                .style("fill","black")
                .style("font-family", "'Helvetica Neue'")
                .style("font-size", this.fontsize + "px")
                .on("click", () => { this.focus_on() });

        this.txt_width = this.txt.node().getComputedTextLength();
        this.txt.attr("x",.5*(this._width-this.txt_width));
        this.txt.attr("y",.5*(this._height+this.fontsize)-2);

        this.context_menu = new ContextMenu();

        this.textgroup.on("mouseover", () => { this.rct.style("fill-opacity", 0.5); });
        this.textgroup.on("mouseout", () => {
            this.rct.style("fill-opacity", 0);
//                if(this.focused){
//                    this.focused = null;
//                    this.rct.style("stroke", null);
//                    this.rct.classed("active", false);
//                    d3.select("body").on("keydown", null)
//                                     .on("keypress", null);
//                }
            });

        var getItems = () =>  [
                {"name": "Edit style...", "action": () => { this.make_style_box(); }},
                {"name": "Delete", "action": () => { this.txt.node().parentElement.remove(); }}
            ];

        this.textgroup.on("contextmenu", (d,i) => {
            d3.event.preventDefault();
            return this.context_menu
                       .showMenu(d3.event, document.querySelector("body"), getItems());
        });

        this.textgroup.call(this.drag_txt_annot);

        this.keydown_txt_annot = () => {
    //        if(!this.focused) return
            console.log(d3.event)
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
    //        if(!this.focused) return;
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
                .on("keypress", function(){
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
            d3.event.stopPropagation();
        }
    }

}
