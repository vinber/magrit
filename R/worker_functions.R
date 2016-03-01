break_val_stewart <- function(x, typec = "equal", nclass = 5){
  if (typec == "equal"){ bks <- seq(cellStats(x, min), cellStats(x, max), length.out = nclass+1)}
  else if (typec == "quantile"){ bks <- quantile (x, probs = seq(0,1, by = 1/nclass))} 
  else {stop('Enter a proper discretisation type: "equal" or "quantile"')}
  return(invisible(unique(bks)))
}

stewart_to_json <- function(knownpts_json, unknownpts_json = NULL,
                            matdist = NULL, varname,
                            typefct = "exponential",
                            span, beta, resolution,
                            longlat = FALSE, mask_json){
  latlong_string = "+init=epsg:4326"
  web_mercator = "+init=epsg:3857"
  knownpts_layer <- geojsonio::geojson_read(knownpts_json, what='sp')
  mask_layer <- geojsonio::geojson_read(mask_json, what='sp')
  if(isLonLat(knownpts_layer)) knownpts_layer <- sp::spTransform(knownpts_layer, CRS(web_mercator))
  if(isLonLat(mask_layer)) mask_layer <- sp::spTransform(mask_layer, CRS(web_mercator))
  pot <- SpatialPosition::stewart(knownpts_layer, varname = varname,
                 typefct = typefct, span = span, resolution=resolution,
                 beta = beta, longlat=longlat, mask = mask_layer)
  print('foo')
  rasterAccessibility <- SpatialPosition::rasterStewart(x = pot, mask = mask_layer)
  breakValues <- break_val_stewart(rasterAccessibility, typec = "equal", nclass = 5)
  contLines <- SpatialPosition::contourStewart(x = rasterAccessibility, breaks = breakValues)
  return(geojsonio::geojson_json(spTransform(contLines, CRS(latlong_string))))
}

huff_to_json <- function(
  knownpts_json, unknownpts_json = NULL, matdist = NULL, varname,
  typefct = "exponential", span, beta, resolution, longlat = FALSE,
  mask_json){
  knownpts_layer <- geojson_read(knownpts_json, method='local')
  mask_layer <- geojson_read(mask_json, method='local')
  catchHuff <- huff(knownpts, varname = varname, typefct = typefct,
                    span = span, beta = beta, longlat = longlat,
                    mask = mask_layer)
  rasterCatch <- rasterHuff(catchHuff, mask = mask_layer)
  return(NULL)
}

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