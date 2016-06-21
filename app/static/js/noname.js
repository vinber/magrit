"use strict";
// Dispay home page elements
function getMenu(targetdiv,jsonfile) {
    var page = d3.select(targetdiv)
    page.append("div").attr("class","title").append("h1").html("Lets make maps")
    d3.json(jsonfile, function(json) {
     json.forEach(function(d) {
        page.append("div")
            .attr("class","icon")
            .html("<a href='"+d.link+"'><img src='../static/img/"+d.img+"'></img><br/>"+d.desc+"</a>")
       });

        d3.select("#footer")
            .append("p")
            .attr("class","footer")
            .html("<br/>Propulsed by<br/><img src='../static/img/riate.png'></img>")
    });
}

// Dispay header elements
function getHeader(targetdiv,module,version) {
    var header = d3.select(targetdiv);
    header.append("p").style("margin", "auto")
        .html("<a href ='/modules' class='logo'>"+module+" "+version+"</a>")
    header.append("p")
        .attr("class","item-menu")
        .html("<a href='https://github.com/riatelab/noname-stuff' target='_blank'>Sources</a>")
    header.append("p")
        .attr("class","item-menu")
        .html("<a href='#'>Examples</a>")
    header.append("p")
        .attr("class","item-menu")
        .html("<a href='#'>Documentation</a>")
}


