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

        page.append("div")
            .attr("class","footer")
            .html("<br/>Propulsed by<br/><img src='../static/img/riate.png'></img>")
    });

}
    
// Dispay header elements
function getHeader(targetdiv,module,version) {
    var header = d3.select(targetdiv)
    header.append("p")
        .html("<a href ='http://localhost/noname-stuff/templates' class='logo'>"+module+" "+version+"</a>")
    header.append("p")
        .attr("class","item-menu")
        .html("<a href='https://github.com/riatelab/noname-stuff' target='_blank' class='menu'>Sources</a>")
    header.append("p")
        .attr("class","item-menu")
        .html("<a href='#' class='menu'>Examples</a>")
    header.append("p")
        .attr("class","item-menu")
        .html("<a href='#' class='menu'>Documentation</a>")
}


