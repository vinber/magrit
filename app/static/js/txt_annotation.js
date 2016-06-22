"use strict";

// Largely inspired by http://jsfiddle.net/eforgy/ppoakf0k/
function Textbox(parent, new_id_txt_annot) {

    var focused = null;

    var keydown_txt_annot = function() {
        if(!focused) return
        let code = d3.event.keyCode;
        if (code == 8) { // Backspace
            d3.event.preventDefault();
            focused.text = focused.text.substring(0,text.length-1);
        } else if (code == 13) { // Enter
            focused.stroke = d3.rgb(240,240,240);
            focused.callback();
        }
    }

    var keypress_txt_annot = function() {
        if(!focused) return;
        let code = d3.event.keyCode;
        focused.text = [focused.text, String.fromCodePoint(code)].join('');
    }

    var text = "Enter your text...",
        fontsize = 12,
        x = 10,
        y = 30,
        width = 100,
        height = 20,
        stroke = d3.rgb(240,240,240),
        fill = d3.rgb(255,255,255);

    var textgroup = parent.append("g")
            .attr("class", "txt_annot");

	var rct = textgroup.append("rect")
		.attr("width", width)
		.attr("height", height)
		.style("fill", "beige")
		.style("fill-opactiy", 0);

	var txt = textgroup.append("text")
            .attr("id", new_id_txt_annot)
            .text(text)
            .style("fill","black")
            .style("font", "12px 'Helvetica Neue'");

	var txt_width = txt.node().getComputedTextLength();
	txt.attr("x",.5*(width-txt_width));
	txt.attr("y",.5*(height+fontsize)-2);

	var callback = function() {
		console.log("Text: " + txt.text());
	}

	var aligntext = function() {
		txt.attr("x", 0.5*(width-txt_width));
		txt.attr("y", 0.5*(height+fontsize)-2);
	};

	function textbox() {}

	Object.defineProperty(textbox,"text",{
		get: function() {return text;},
		set: function(_) {
			text = _;
			txt.text(_);
			txt_width = txt.node().getComputedTextLength();
			aligntext();
		},
		enumerable: true,
		cofigurable: true
	});

	Object.defineProperty(textbox,"x",{
		get: function() {return x;},
		set: function(_) {
			x = _;
			textgroup.attr("transform", "translate(" + x + "," + y + ")");
		},
		enumerable: true,
		cofigurable: true
	});
		Object.defineProperty(textbox,"y",{
		get: function() {return y;},
		set: function(_) {
			y = _;
			textgroup.attr("transform", "translate(" + x + "," + y + ")");
		},
		enumerable: true,
		cofigurable: true
	});

	Object.defineProperty(textbox,"width",{
		get: function() {return width;},
		set: function(_) {
			width = _;
				rct.attr("width",_);
				aligntext();
			},
			enumerable: true,
			cofigurable: true
	});

    Object.defineProperty(textbox,"height",{
		get: function() {return height;},
		set: function(_) {
			height = _;
			rct.attr("height",_);
			aligntext();
		},
		enumerable: true,
		cofigurable: true
	});

    Object.defineProperty(textbox,"position",{
		get: function() {return [x, y, width, height];},
		set: function(_) {
			textbox.x = _[0];
			textbox.y = _[1];
			textbox.width = _[2];
			textbox.height = _[3];
		},
		enumerable: true,
		cofigurable: true
	})

    Object.defineProperty(textbox,"callback",{
        get: function() {return callback;},
        set: function(_) { callback = _; },
        enumerable: true,
        cofigurable: true
    });

    txt.on("click", function() {
        if(rct.classed("active")){
            focused = null;
            rct.style("stroke", null);
            rct.classed("active", false);
            d3.select("body").on("keydown", null)
                             .on("keypress", null);
        } else {
            focused = textbox;
            d3.select("body").on("keydown", keydown_txt_annot)
                .on("keypress", keypress_txt_annot);
            rct.style("stroke","#347bbe");
            rct.classed("active", true);
            d3.event.stopPropagation();
        }
    });

    textgroup.on("mouseover", () => { rct.style("fill-opacity", 0.5); });
    textgroup.on("mouseout", () => { rct.style("fill-opacity", 0); });

    return textbox;
}