var display_discretization = function(layer_name, field_name, nb_class, type){

    var func_switch = function(name){
        var obj = {
            "Jenks": "serie.getJenks(nb_class)",
            "Equal interval": "serie.getEqInterval(nb_class)",
            "Standard deviation": "serie.getStdDeviation(nb_class)",
            "Quantiles": "serie.getQuantile(nb_class)",
            "Arithmetic progression": "serie.getArithmeticProgression(nb_class)",
            "Q6": "getBreaksQ6(values)"
        }
        return obj[name];
    }

    var display_ref_histo = function(){
        var svg_h = h/7.75,
            svg_w = w/4.75,
            nb_bins = 81 < (values.length / 3) ? 80 : Math.ceil(Math.sqrt(values.length));

        nb_bins = nb_bins < 3 ? 3 : nb_bins;

        var margin = {top: 5, right: 10, bottom: 15, left: 10},
            width = svg_w - margin.right - margin.left;
            height = svg_h - margin.top - margin.bottom;
         
        var ref_histo = newBox.append('div').style({position: "absolute", top: "45px", right: "45px"});
        ref_histo.append('p').style({"text-align": "center", "margin": "0px"}).html('<i>Distribution histogram</i>');

        var svg_ref_histo = ref_histo.append("svg").attr("id", "svg_ref_histo")
            .attr("width", svg_w + margin.left + margin.right)
            .attr("height", svg_h + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .domain([0, serie.max()])
            .range([0, svg_w]);

        var data = d3.layout.histogram()
            .bins(x.ticks(nb_bins))
            (values);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.y; })])
            .range([svg_h, 0]);

        var bar = svg_ref_histo.selectAll(".bar")
            .data(data)
          .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(data[0].dx) - 1)
            .attr("height", function(d) { return height - y(d.y); })
            .style({fill: "beige", stroke: "black", "stroke-width": "0.5px"});

        svg_ref_histo.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis()
                .scale(x)
                .ticks(6)
                .orient("bottom"));

        svg_ref_histo.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0, -20)")
            .call(d3.svg.axis()
                .scale(y)
                .ticks(5)
                .orient("left"));

/*
        // Some tests to draw the kernel density estimation on the reference plot :
        var kde = science.stats.kde();
        kde.bandwidth(0.11);
        kde_values = kde(values);
        kde_values.forEach(function(el, i){el[1] = i;});

        x.domain(d3.extent(kde_values, function(d) { return d[1]; }));
        y.domain(d3.extent(kde_values, function(d) { return d[0]; }));
        
        kde_line_func = d3.svg.line()
                            .x(function(d){return x(d[1])})
                            .y(function(d){return svg_h - y(d[0])});

        svg_ref_histo
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("d", kde_line_func(kde_values));
*/
    }

    var redisplay = function(old_nb_class){
        serie = new geostats(values);
        breaks = []
        values = serie.sorted()
        var val = func_switch(type);
        if(type === "Q6"){
            var tmp = eval(val);
            var stock_class = tmp.stock_class;
            breaks = tmp.breaks;
        } else {
            breaks = eval(val);
            var ir = serie.getInnerRanges();
            if(!ir){
                nb_class = old_nb_class;
                return false;
            }
    
            ir = ir.map(function(el){var tmp=el.split(' - ');return [Number(tmp[0]), Number(tmp[1])]});
            var stock_class = [], bounds = [], _min = undefined, _max = undefined;
            for(var j=0, len_j=ir.length; j < len_j; j++){
                bounds[j] = ir[j];
                _min=values.lastIndexOf(bounds[j][0]);
                _max=values.lastIndexOf(bounds[j][1]);
                stock_class.push(_max - _min);
            }
        }
        console.log(["Breaks val", breaks]);
        console.log(["Stock class", stock_class]);

        // In order to avoid class limit falling out the serie limits with Std class :
        breaks[0] = breaks[0] < serie.min() ? serie.min() : breaks[0];

        // Clean-up previously made histograms :
        d3.select("#svg_discretization").selectAll(".bar").remove();
        d3.select("#svg_discretization").selectAll(".text_bar").remove();
        d3.select("#svg_discretization").selectAll(".y.axis").remove();

        var x = d3.scale.linear()
            .domain([0, serie.max()])
            .range([0, svg_w]);

        var y = d3.scale.linear()
            .domain([serie.min(), serie.max()])
            .range([svg_h, 0]);

        var bins = [];
        for(var i = 0, len = stock_class.length, offset=0; i < len; i++){
            bin = {};
            bin.val = stock_class[i] + 1;
//            bin.offset = bounds[i][0];
//            bin.width = bounds[i][1] - offset;
//            offset = bounds[i+1] ? bin.offset + bin.width + (bounds[i+1][0] - bounds[i][1]) : bin.offset + bin.width;
            bin.offset = breaks[i];
            bin.width = breaks[i+1] - breaks[i];
            bin.height = stock_class[i];
            bins[i] = bin;
        }

        x.domain([0, d3.max(bins.map(function(d) { return d.offset + d.width; }))]);
        y.domain([0, d3.max(bins.map(function(d) { return d.height; }))]);

        var bar = svg_histo.selectAll(".bar")
            .data(bins)
          .enter().append("rect")
            .attr("class", "bar")
            .style("fill", function(d){return Colors.random();})
            .style({"opacity": 0.5, "stroke-opacity":1})
            .attr("x", function(d){ return x(d.offset);})
            .attr("width", function(d){ return x(d.width) - 1;})
            .attr("y", function(d){ return y(d.height);})
            .attr("height", function(d){ return height - y(d.height);})

        svg_histo.selectAll(".txt_bar")
            .data(bins)
          .enter().append("text")
            .attr("dy", ".75em")
            .attr("y", function(d){
                var tmp = y(d.height)+5;
                if(tmp < 90) return tmp;
                else return 90})
            .attr("x", function(d){return x(d.offset + d.width /2)})
            .attr("text-anchor", "middle")
            .attr("class", "text_bar")
            .style("color", "black")
            .text(function(d) { return formatCount(d.val); });

        svg_histo.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0, -20)")
            .call(d3.svg.axis()
                .scale(y)
                .ticks(5)
                .orient("left"));

        var resume = ["<b><i>Summary</b></i><br><br>",  (serie.info()).split("-").join("<br>").split(']').join("]<br>"),
                      "<br><br><b><i>Current break values</i></b> : <br><b>", breaks.join(', '), " <b>"].join('')
        summary.html(resume);
        return true;
    };

    var formatCount = d3.format(",.0f");

    var newBox = d3.select("body").append("div")
                     .style({"font-size":"12px"})
                     .attr("id", "discretiz_charts")
                     .attr("title", layer_name);

    var values = [],
        nb_values = user_data[layer_name].length;

    for(var i=0; i<nb_values; i++){values.push(Number(user_data[layer_name][i][field_name]));}

    var serie = new geostats(values),
        breaks = [];

    values = serie.sorted();
    serie.setPrecision(4);

    newBox.append('h2')
            .style("text-align", "center")
            .html("Discretization panel");

    var discretization = newBox.append('div').style("margin-top", "60px")
                                .attr("id", "discretization_panel")
                                .insert("p").html("<br>Type ")
                                .insert("select").attr("class", "params")
                                .on("change", function(){
                                    type = this.value;
                                    if(type === "Q6"){
                                        nb_class = 6;
                                        txt_nb_class.html(6 + " class");
                                         d3.select("#nb_class_range").node().value = 6;
                                    }
                                    redisplay(nb_class);
                                    });

    ["Jenks", "Quantiles", "Equal interval", "Standard deviation", "Q6"].forEach(function(name){
        discretization.append("option").text(name).attr("value", name);
    });
    discretization.node().value = type;
    display_ref_histo();

    var txt_nb_class = d3.select("#discretization_panel").insert("p").style("display", "inline").html(nb_class+" class"),
        disc_nb_class = d3.select("#discretization_panel")
                            .insert("input")
                            .style("display", "inline")
                            .attr("id", "nb_class_range")
                            .attr("type", "range")
                            .attr({min: 2, max: 20, value: nb_class, step:1})
                            .on("change", function(){
                                var old_nb_class = nb_class;
                                if(type === "Q6"){
                                    this.value = 6;
                                    return;
                                }
                                nb_class = this.value;
                                txt_nb_class.html(nb_class+" class");
                                var ret_val = redisplay(old_nb_class);
                                if(!ret_val){
                                    this.value = old_nb_class;
                                    txt_nb_class.html(old_nb_class+" class");
                                    }
                                });

    var svg_h = h/5,
        svg_w = w - (w/8),
        margin = {top: 10, right: 30, bottom: 7.5, left: 30},
        height = svg_h - margin.top - margin.bottom;
  
    var svg_histo = newBox.append('div').style("margin-top", "20px")
        .append("svg").attr("id", "svg_discretization")
        .attr("width", svg_w + margin.left + margin.right)
        .attr("height", svg_h + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var summary = newBox.append('p').attr("id", "summary").html("");

    var x = d3.scale.linear()
        .domain([serie.min(), serie.max()])
        .range([0, svg_w]);

    svg_histo.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
        .scale(x)
        .orient("bottom"));

    redisplay();
    var deferred = Q.defer();
    $("#discretiz_charts").dialog({
        modal:true,
        resizable: true,
        width: w-10,
        height: h+60,
        buttons:[{
            text: "Confirm",
            click: function(){
                    deferred.resolve([nb_class, type, breaks]);
                    $(this).dialog("close");
                    }
                },
           {
            text: "Cancel",
            click: function(){
                $(this).dialog("close");
                $(this).remove();}
           }],
        close: function(event, ui){
                $(this).dialog("destroy").remove();
                if(deferred.promise.isPending()){
                    deferred.resolve(false);
                }
            }
      });
    return deferred.promise;
}

function getBreaksQ6(serie){
    var breaks = [], tmp = 0, j = undefined,
        len_serie = serie.length, stock_class = [],
        q6_class = [1, 0.05 * len_serie, 0.275 * len_serie, 0.5*len_serie, 0.725*len_serie, 0.95*len_serie, len_serie];
    for(var i=0; i<7; ++i){
        j = Math.round(q6_class[i]) - 1
        breaks[i] = serie[j];
        stock_class.push(j - tmp)
        tmp = j;
    }
    stock_class.shift();
    return {
        breaks: breaks,
        stock_class
        };
}

Colors = {};
Colors.names = {
    aqua: "#00ffff",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    black: "#000000",
    blue: "#0000ff",
    brown: "#a52a2a",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgrey: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkviolet: "#9400d3",
    fuchsia: "#ff00ff",
    gold: "#ffd700",
    green: "#008000",
    indigo: "#4b0082",
    khaki: "#f0e68c",
    lightblue: "#add8e6",
    lightcyan: "#e0ffff",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    magenta: "#ff00ff",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    orange: "#ffa500",
    pink: "#ffc0cb",
    purple: "#800080",
    violet: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    white: "#ffffff",
    yellow: "#ffff00"
};
Colors.random = function() {
    var result;
    var count = 0;
    for (var prop in this.names)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
};