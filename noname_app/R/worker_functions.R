###################################
# SpatialPosition functions
###################################
stewart_to_json <- function(knownpts_json, var, var2, typefct = "exponential",
                            span, beta, resolution=NULL, nb_class=8,
                            user_breaks=NULL, mask_json = NULL){
  s_t <- Sys.time()
  latlong_string <- "+init=epsg:4326"
  web_mercator <- "+init=epsg:3857"
  nat_earth <- "+proj=natearth"
  additionnal_infos <- "null"

  knownpts_layer <- geojsonio::geojson_read(knownpts_json, what='sp', stringsAsFactors = FALSE)

  if(is.na(knownpts_layer@proj4string@projargs)) knownpts_layer@proj4string@projargs = latlong_string
  if(isLonLat(knownpts_layer)) knownpts_layer <- sp::spTransform(knownpts_layer, CRS(nat_earth))

  if(is.null(mask_json)){
    mask_layer <- NULL
  } else {
    mask_layer <- geojsonio::geojson_read(mask_json, what='sp', stringsAsFactors = FALSE)
    if(is.na(mask_layer@proj4string@projargs)) mask_layer@proj4string@projargs = latlong_string
    if(isLonLat(mask_layer)) mask_layer <- sp::spTransform(mask_layer, CRS(nat_earth))
    # if(!rgeos::gIsValid(mask_layer)){
    #   print('Invalid geom mask - First test')
    #   mask_layer <- rgeos::gBuffer(rgeos::gBuffer(mask_layer, width = 1), width = -1)
    #   additionnal_infos <- "Mask layer have been changed to obtain valid geometries"
    #   if(!rgeos::gIsValid(mask_layer)){
    #     # mask_layer <- NULL
    #     print('Invalid geom mask, dropping it')
    #     additionnal_infos <- "Mask not used (invalid geometry)"
    #   }
    # }
  }

  if(class(knownpts_layer@data[, var]) == "character"){
    knownpts_layer@data[, var] <- as.numeric(knownpts_layer@data[, var])
  }
  if(!is.null(var2) && class(knownpts_layer@data[, var2]) == "character"){
    knownpts_layer@data[, var2] <- as.numeric(knownpts_layer@data[, var2])
  }

  file.remove(knownpts_json)
  print(paste0("Layer opening + row management ", round(Sys.time()-s_t,4),"s"))
  s_t <- Sys.time()
  res_poly <- SpatialPosition::quickStewart(spdf = knownpts_layer,
                                            df = knownpts_layer@data,
                                            var = var,
                                            var2 = var2,
                                            typefct = typefct,
                                            span=span, beta=beta,
                                            resolution=resolution,
                                            mask = mask_layer,
                                            nclass = nb_class,
                                            breaks = user_breaks)
  print(paste0("quickStewart ", round(Sys.time()-s_t,4),"s"))
  s_t <- Sys.time()
  # Always return the result in latitude-longitude for the moment :
  geojsonio::geojson_write(sp::spTransform(res_poly, CRS(latlong_string)), file=knownpts_json)
  result <- paste0('{"geojson_path":"', knownpts_json,'","breaks":',
                   jsonlite::toJSON(list(min = unique(res_poly@data$min), max = unique(res_poly@data$max))),
                   ',"additional_infos":', jsonlite::toJSON(additionnal_infos), '}')
  print(paste0("Dump to GeoJSON / Send result ", round(Sys.time()-s_t,4),"s"))
  return(result)
}

###################################
# Cartography functions
###################################

# getBordersJson <- function(layer_json_path){
#   s_t <- Sys.time()
#   latlong_string <- "+init=epsg:4326"
#   spdf <- geojsonio::geojson_read(layer_json_path, what='sp', stringsAsFactors = FALSE)
#   if(is.na(spdf@proj4string@projargs)) spdf@proj4string@projargs = latlong_string
#   file.remove(layer_json_path)
#   result <- cartography::getBorders(spdf)
#   geojsonio::geojson_write(result, file=layer_json_path)
#   result <- paste0('{"geojson_path":"', layer_json_path,'","additional_infos":null}')
#   print(paste0("getBordersJson ", round(Sys.time()-s_t,4),"s"))
#   return(result)
# }

make_gridded_map <- function(layer_json_path, var_name, cellsize){
  s_t <- Sys.time()
  if(!is.numeric(cellsize)){ cellsize <- as.numeric(cellsize) }

  latlong_string <- "+init=epsg:4326"
  eckert_iv <- "+proj=eck4 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs"

  spdf <- geojsonio::geojson_read(layer_json_path, what='sp', stringsAsFactors = FALSE)

  if(is.na(spdf@proj4string@projargs)) spdf@proj4string@projargs = latlong_string
  if(raster::isLonLat(spdf)) spdf <- sp::spTransform(spdf, CRS(eckert_iv))

  col_names <- colnames(spdf@data)

  if(is.element("pkuid", col_names) && class(spdf@data[,"pkuid"]) == "integer"){
    spdf@data[, "pkuid"] <- as.character(spdf@data[, "pkuid"])
    s_id = "pkuid"
  } else if (is.element("X_uid", col_names) && class(spdf@data[,"X_uid"]) == "integer") {
    spdf@data[, "X_uid"] <- as.character(spdf@data[, "X_uid"])
    s_id = "X_uid"
  } else {
    spdf@data <- data.frame(list(spdf@data, n_id=rownames(spdf@data)), row.names = seq(length(spdf)))
    s_id = "n_id";
    spdf@data[, "n_id"] <- as.character(spdf@data[, "n_id"])
  }
  if(class(spdf@data[, var_name]) == "character"){
    spdf@data[, var_name] <- as.numeric(spdf@data[, var_name])
  }
  print(paste0("Opening + row management ", round(Sys.time()-s_t,4),"s"))
  s_t <- Sys.time()

  mygrid <- cartography::getGridLayer(spdf=spdf, cellsize = cellsize, spdfid = s_id)

  datagrid.df <- cartography::getGridData(x = mygrid, df = spdf@data, var = var_name, dfid = s_id)
  datagrid.df$densitykm <- datagrid.df[, paste0(var_name, '_density')]*1000*1000
  the_grid <- mygrid[[1]]

  m <- match(the_grid@data[,"id"], datagrid.df[, "id_cell"])
  the_grid@data <- data.frame(the_grid@data, datagrid.df[m, ])

  print(paste0("getGridLayer + getGridData ", round(Sys.time()-s_t,4),"s"))
  s_t <- Sys.time()
  geojsonio::geojson_write(spTransform(the_grid, CRS(latlong_string)), file=layer_json_path)
  result <- paste0('{"geojson_path":"', layer_json_path,'","additional_infos":null}')
  print(paste0("Save to Geojson ", round(Sys.time()-s_t,4),"s"))
  return(result)
}

###################################
# MTA functions
###################################

mta_generaldev <- function(x, var1, var2, ref, type_dev){
  x <- as.data.frame(jsonlite::fromJSON(x))
  return(paste0('{"values":', jsonlite::toJSON(MTA::generalDev(x, var1, var2, ref, type_dev)), '}'))
}

mta_territorialdev <- function(x, var1, var2, key, type_dev){
  x <- as.data.frame(jsonlite::fromJSON(x))
  return(paste0('{"values":', jsonlite::toJSON(MTA::territorialDev(x=x, var1=var1, var2=var2, type=type_dev,  key=key)), '}'))
}

mta_localdev <- function(geojson_path, var1, var2, order = NULL, dist = NULL, type_dev='rel'){
  latlong_string <- "+init=epsg:4326"
  web_mercator <- "+init=epsg:3857"

  spdf <- geojsonio::geojson_read(geojson_path, what='sp', stringsAsFactors = FALSE)

  if(is.na(spdf@proj4string@projargs)) spdf@proj4string@projargs = latlong_string
  if(isLonLat(spdf)) spdf <- sp::spTransform(spdf, CRS(web_mercator))
  spdf@data[,var1] <- as.numeric(spdf@data[,var1])
  spdf@data[,var2] <- as.numeric(spdf@data[,var2])
  res <- MTA::localDev(spdf = spdf, x = spdf@data, spdfid = NULL, xid = NULL,
                       var1 = var1, var2 = var2,
                       order = order, dist = dist, type = type_dev)
  return(paste0('{"values":', jsonlite::toJSON(res), '}'))
}

###################################
# flows functions
###################################

getLinkLayer_json <- function(layer_json_path, csv_table, i, j, fij, join_field){
  s_t <- Sys.time()
  df <- jsonlite::fromJSON(csv_table)
  spdf <- geojsonio::geojson_read(layer_json_path, what='sp')
  print(paste0("Opening csv table & geojson ", round(Sys.time()-s_t,4),"s"))

  s_t <- Sys.time()
  links <- cartography::getLinkLayer(spdf = spdf, df = df, spdfid = join_field, dfids = i, dfide = j)
  print(paste0("GetLinkLayer ", round(Sys.time()-s_t,4),"s"))

  s_t <- Sys.time()
  links@data <- data.frame(df[match(x = paste(links@data[, i], links@data[, j]), table = paste(df[, i], df[, j])),])
  print(paste0("Match rows ", round(Sys.time()-s_t,4),"s"))

  s_t <- Sys.time()
  geojsonio::geojson_write(links, file=layer_json_path)
  result <- paste0('{"geojson_path":"', layer_json_path,'","additional_infos":null}')
  print(paste0("Save to Geojson ", round(Sys.time()-s_t,4),"s"))

  return(result)
}

prepflows_json <- function(mat, i, j, fij, remove_diag=FALSE, direct_stat=FALSE){
  mat <- jsonlite::fromJSON(mat)
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

# Function slightly adapted from Rcartogram package (comments are from the package author)
prepare_cart_density <- function(json_polygons, variable = 1, nrows = 2^8, ncols = 2^8){
  spdf <- geojsonio::geojson_read(json_polygons, what='sp', stringsAsFactors = FALSE)

  if(is.na(spdf@proj4string@projargs)) spdf@proj4string@projargs = latlong_string
  if(isLonLat(spdf)) spdf <- sp::spTransform(spdf, CRS("+proj=natearth"))

  if (!class(spdf) == "SpatialPolygonsDataFrame")
    stop("argument 'spdf' must be an object of class 'SpatialPolygonsDataFrame'")

  if (length(variable) != 1)
    stop("argument 'variable' must have length 1")
  ## - must be of type numeric or character
  if (!(is.numeric(variable) | is.character(variable)))
    stop("argument 'variable' must be of type 'numeric' or 'character'")
  ## - must refer to a column in spdf
  check <- try(!spdf@data[, variable], silent = TRUE)
  if (class(check) == "try-error")
    stop("argument 'variable' is not a valid data.frame column of argument 'spdf'")

  ## nrows, ncols
  ## - must be coercable to type integer
  nrows <- as.integer(nrows)
  ncols <- as.integer(ncols)
  ## - should be power of 2, otherwise FFTW is slow
  if (!isTRUE(all.equal(log(nrows, 2), floor(log(nrows, 2)))))
    warning("argument 'nrows' should be a power of 2 for faster calculation")
  if (!isTRUE(all.equal(log(ncols, 2), floor(log(ncols, 2)))))
    warning("argument 'nrows' should be a power of 2 for faster calculation")

  ## create a grid

  ## The algorithm by Newman works best if there is a generous "sea" around
  ## the "land", thus by default, add 50% of the x/y ranges to each side and
  ## define a grid of 512x512 points. Because the C code of Mark Newman uses
  ## FFTW, the number of grid points should be a power of two in order for FFTW
  ## to work faster.
  bb <- bbox(spdf)
  range <- diff(t(bbox(spdf)))
  shift <- 0.5 * range  ## FIXME: If one wants to interpolate a coordinate that lies outside
  ##        this region, function "interpolate" will fail!
  dim <- c(x = ncols, y = nrows)
  grid <- SpatialGrid(GridTopology(cellcentre.offset = as.numeric(bb[, "min"] - shift),
                                   cellsize = as.numeric(diff(t(bb + t(rbind(-shift, shift)))) / (dim - 1)),
                                   cells.dim = dim), proj4string = spdf@proj4string)

  ## overlay grid and polygons

  ## This is an extension of the point-in-polygon problem. We obtain a vector of
  ## indices of the polygons in spdf.
  ind <- sp::over(grid,as(spdf,"SpatialPolygons"))

  ## calculate "density"

  ## For each grid cell, we need to determine the fraction of the units of
  ## "variable" as the number of units per cell. For NAs, i.e. for the "sea",
  ## insert the mean value for the whole "land" mass. For the tabulation, the
  ## levels need to be enforced because there might be polygons with count zero.
  ## For these cells, division by zero is corrected by replacing the resulting
  ## infinite result by zero.
  tab <- xtabs(~ factor(ind, levels = seq(along = spdf@polygons)))
  var <- spdf@data[, variable]
  indVar <- var[as.numeric(names(tab))] / tab
  indVar[is.infinite(indVar)] <- 0
  mean <- sum(tab * indVar[as.numeric(names(tab))]) / sum(tab)
  ind[is.na(ind)] <- length(var) + 1
  indVar[length(var) + 1] <- mean
  dens <- matrix(indVar[ind], byrow = TRUE, ncol = dim["x"])
  return(jsonlite::toJSON(as.double(t(
      dens[rev(seq(along = dens[, 1])), ]
      ))))
}

