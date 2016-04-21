###################################
# SpatialPosition functions
###################################
stewart_to_json <- function(knownpts_json, var_name, typefct = "exponential",
                            span, beta, resolution=NULL, mask_json = NULL){

  latlong_string <- "+init=epsg:4326"
  web_mercator <- "+init=epsg:3857"
  additionnal_infos <- "null"

  knownpts_layer <- geojsonio::geojson_read(knownpts_json, what='sp', stringsAsFactors = FALSE)
  if(is.na(knownpts_layer@proj4string@projargs)) knownpts_layer@proj4string@projargs = latlong_string
  if(isLonLat(knownpts_layer)) knownpts_layer <- sp::spTransform(knownpts_layer, CRS(web_mercator))

  if(is.null(mask_json)){
    mask_layer <- NULL
  } else{
    mask_layer <- geojsonio::geojson_read(mask_json, what='sp', stringsAsFactors = FALSE)
    if(is.na(mask_layer@proj4string@projargs)) mask_layer@proj4string@projargs = latlong_string
    if(isLonLat(mask_layer)) mask_layer <- sp::spTransform(mask_layer, CRS(web_mercator))
    if(!rgeos::gIsValid(mask_layer)){
      print('Invalid geom mask - First test')
      mask_layer <- rgeos::gBuffer(mask_layer, width = 1)
      additionnal_infos <- "Mask layer have been changed to obtain valid geometries"
      if(!rgeos::gIsValid(mask_layer)){
        mask_layer <- NULL
        print('Invalid geom mask, dropping it')
        additionnal_infos <- "Mask not used (invalid geometry)"
      }
    }
  }

  if(class(knownpts_layer@data[, var_name]) == "character"){
    knownpts_layer@data[, var_name] <- as.numeric(knownpts_layer@data[, var_name])
  }
  
  res_poly <- SpatialPosition::quickStewart(spdf = knownpts_layer,
                                            df = knownpts_layer@data,
                                            var = var_name,
                                            typefct = typefct,
                                            span=span, beta=beta,
                                            resolution=resolution,
                                            mask = mask_layer)

  # Always return the result in latitude-longitude for the moment :
  result <- paste0('{"geojson":', geojsonio::geojson_json(spTransform(res_poly, CRS(latlong_string))),',"breaks":',
                   jsonlite::toJSON(list(min = unique(res_poly@data$min), max = unique(res_poly@data$max))),
                   ',"additional_infos":', jsonlite::toJSON(additionnal_infos), '}')
  return(result)
}

make_gridded_map <- function(layer_json_path, var_name, cellsize){
  if(!is.numeric(cellsize)){ cellsize <- as.numeric(cellsize) }
  
  latlong_string = "+init=epsg:4326"
  web_mercator = "+init=epsg:3857"

  spdf <- geojsonio::geojson_read(layer_json_path, what='sp', stringsAsFactors = FALSE)

  if(is.na(spdf@proj4string@projargs)) spdf@proj4string@projargs = latlong_string
  if(isLonLat(spdf)) spdf <- sp::spTransform(spdf, CRS(web_mercator))

  col_names <- colnames(spdf@data)

  if(is.element("pkuid", col_names) && class(spdf@data[,"pkuid"]) == "integer"){
    spdf@data[, "pkuid"] <- as.character(spdf@data[, "pkuid"])
    s_id = "pkuid"
  } else if (is.element("X_uid", col_names) && class(spdf@data[,"X_uid"]) == "integer") {
    spdf@data[, "X_uid"] <- as.character(spdf@data[, "X_uid"])
    s_id = "X_uid"
  } else { s_id = "id"; }

  if(class(spdf@data[, var_name]) == "character"){
    spdf@data[, var_name] <- as.numeric(spdf@data[, var_name])
  }

  mygrid <- cartography::getGridLayer(spdf=spdf, cellsize = cellsize, spdfid = s_id)

  datagrid.df <- cartography::getGridData(x = mygrid, df = spdf@data, var = var_name, dfid = s_id)
  datagrid.df$densitykm <- datagrid.df[, paste0(var_name, '_density')]*1000*1000
  the_grid <- mygrid[[1]]

  m <- match(the_grid@data[,"id"], datagrid.df[, "id_cell"])
  the_grid@data <- data.frame(the_grid@data, datagrid.df[m, ])
  result <- paste0('{"geojson":', geojsonio::geojson_json(spTransform(the_grid, CRS(latlong_string))),
                   ', "additional_infos":null}')
  return(result)
}

# flow_map <- function(tab_data, )

###################################
# MTA functions
###################################

mta_globaldev <- function(x, var1, var2, ref, type_dev){
  x <- jsonlite::fromJSON(x)
  return(jsonlite::toJSON(MTA::globalDev(x, var1, var2, ref, type_dev)))
}

mta_mediumdev <- function(x, var1, var2, key, type_dev){
  x <- jsonlite::fromJSON(x)
  return(jsonlite::toJSON(MTA::mediumDev(x=x, var1=var1, var2=var2, type=type_dev,  key=key)))
}

mta_localdev <- function(spdf_geojs, var1, var2, order = NULL, dist = NULL, type_dev='rel'){
  x <- rgdal::readOGR(spdf_geojs, 'OGRGeoJSON', verbose=FALSE)
  res <- MTA::localDev(spdf = x, x = x@data, spdfid = NULL, xid = NULL,
                       var1 = var1, var2 = var2,
                       order = order, dist = dist, type = type_dev)
  return(jsonlite::toJSON(res))
}

###################################
# flows functions
###################################

getLinkLayer_json <- function(layer_json_path, csv_table, i, j, fij, join_field){
  df <- jsonlite::fromJSON(csv_table)
  spdf <- geojsonio::geojson_read(layer_json_path, what='sp')
  links <- cartography::getLinkLayer(spdf = spdf, df = df, spdfid = join_field, dfids = i, dfide = j)
  links@data <- data.frame(df[match(x = paste(links@data[, i], links@data[, j]), table = paste(df[, i], df[, j])),])
  return(paste0('{"geojson":', geojsonio::geojson_json(links),
                ', "additional_infos":null}'))
}

prepflows_json <- function(mat, i, j, fij, remove_diag=FALSE, direct_stat=FALSE){
  mat <- read.csv(mat)
  myflows <- flows::prepflows(mat, i, j, fij)
  if(remove_diag) diag(myflows) <- 0
  if(direct_stat$direct_stat == FALSE){
    return(jsonlite::toJSON(myflows))
  } else {
    summary <- capture.output(flows::statmat(myflows,
                              output = direct_stat$output,
                              verbose = direct_stat$verbose))
    return(jsonlite::toJSON(summary))
  }
}