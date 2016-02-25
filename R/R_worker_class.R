require(pbdZMQ)
require(jsonlite)

R_Worker <- R6::R6Class(
  classname = 'R_Worker',
  
  public = list(
    initialize = function(identifiant, worker_url){
      if (!missing(identifiant)) self$identifiant = identifiant
      if (!missing(worker_url)) self$worker_url = worker_url
      self$preparedEnv = make_env()
    },
    
    validateOuput = function(output)encodeString(toString(format(output))),
    
    bind_socket = function(){
      ctx <<- zmq.ctx.new()
      socket <<- zmq.socket(ctx, .pbd_env$ZMQ.ST$REQ)
      zmq.setsockopt(socket, .pbd_env$ZMQ.SO$IDENTITY, self$identifiant)
      zmq.connect(socket, self$worker_url)
      zmq.send(socket, charToRaw("READY"))
      print(paste0("Worker ", self$identifiant, " is ON"))
    },
    
    rEval = function(message){
      if(grepl('system', message) | grepl('exitR', message))out <- "Now exiting R\n"
      else{
        # Each new expression (or batch of chained expressions) should be computed in 
        # a new environnement (ie. the next client to have something evaluated here
        # dont inherit the variables from previous client requests).
        tmp_env = new.env(parent = self$preparedEnv)
        output <- tryCatch(
          eval(parse(text=message), envir = tmp_env),
          error = function(e)paste0(e$message, "\n")
        )
        out <- self$validateOuput(output)
      }
      return(out)
    },
    
    listen = function(){
      while(TRUE){
        result <- NULL
        request <- NULL
        ret <- NULL
        ret <- zmq.recv.multipart(socket, FALSE)
        print(ret)
        address <- ret[[1]]
        request <- rawToChar(ret[[3]])
        print(paste0('Worker ', self$identifiant, ' received ', request))
#         # Depending on the message received the expression is computed on a
#         # prepared and fresh environnement :
#         if(msg$eval_method == 'reval') result <- self$rEval(msg$expr)
#         # Or on a forked R process with custom parameter regardign to the environnement :
#         if(msg$eval_method == 'eval_fork') result <- eval_fork(msg$expr)
#         # print(paste('Worker', identifiant, ' received :', request, '\n',
#         #             'Result : ', result, sep = ' '))
        result <- self$rEval(request)
        msg = list(
          address,
          charToRaw(''),
          charToRaw(result)
        )
        zmq.send.multipart(socket, msg, FALSE)
        self$histo_count <<- self$histo_count + 1
        if(result == "Now exiting R\n")break
      }
    },
    
    close = function(){
      zmq.close(socket)
      zmq.ctx.destroy(ctx)
      exit_msg <- paste0("Worker ", self$identifiant, " closed after ", self$histo_count, " requests")
      print(exit_msg)
    },
    
    histo_count = 0, identifiant = NA,
    worker_url = NA, preparedEnv = NA
  ),
  
  private = list(socket = NA, ctx = NA)
)

break_val_stewart <- function(x, typec = "equal", nclass = 5){
  if (typec == "equal"){ bks <- seq(cellStats(x, min), cellStats(x, max), length.out = nclass+1)}
  else if (typec == "quantile"){ bks <- quantile (x, probs = seq(0,1, by = 1/nclass))} 
  else {stop('Enter a proper discretisation type: "equal" or "quantile"')}
  return(invisible(unique(bks)))
}

stewart_to_json <- function(
      knownpts_json, unknownpts_json = NULL, matdist = NULL, varname,
      typefct = "exponential", span, beta, resolution, longlat = FALSE,
      mask_json){

  require(raster)
  require(sp)
  require(SpatialPosition)
  require(geojsonio)

  latlong_string = "+init=epsg:4326"
  web_mercator = "+init=epsg:3857"
  knownpts_layer <- geojson_read(knownpts_json, what='sp')
  mask_layer <- geojson_read(mask_json, what='sp')
  if(isLonLat(knownpts_layer)) knownpts_layer <- spTransform(knownpts_layer, CRS(web_mercator))
  if(isLonLat(mask_layer)) mask_layer <- spTransform(mask_layer, CRS(web_mercator))
  pot <- stewart(knownpts_layer, varname = varname,
                 typefct = typefct, span = span, resolution=resolution,
                 beta = beta, longlat=longlat, mask = mask_layer)
  rasterAccessibility <- rasterStewart(x = pot, mask = mask_layer)
  breakValues <- break_val_stewart(rasterAccessibility, typec = "equal", nclass = 5)
  contLines <- contourStewart(x = rasterAccessibility, breaks = breakValues)
  return(geojson_json(spTransform(contLines, CRS(latlong_string))))
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


# flows_prep <- function()

# ToDo : find a better way to prepare an environment or at least
# prepare the environnement once, save it and load it when launching
# the script instead of reevaluate 'make_env'
make_env <- function(lock = FALSE){
  preparedEnv = new.env(hash = TRUE, parent = baseenv())
  preparedEnv$sd <- stats::sd
  preparedEnv$runif <- stats::runif
  preparedEnv$readOGR <- rgdal::readOGR
  preparedEnv$topojson_read <- geojsonio::topojson_read
  preparedEnv$geojson_write <- geojsonio::geojson_write
  preparedEnv$geojson_read <- geojsonio::geojson_read
  preparedEnv$geojson_json <- geojsonio::geojson_json
  preparedEnv$projections <- geojsonio::projections
  preparedEnv$geo_validate <- geojsonio::validate
  preparedEnv$discretization <- cartography::discretization
  preparedEnv$SpatialPosition <- asNamespace('SpatialPosition')
  preparedEnv$flows <- asNamespace('flows')
  preparedEnv$sp <- asNamespace('sp')
  preparedEnv$break_val_stewart <- break_val_stewart
  preparedEnv$stewart_to_json <- stewart_to_json
  if(lock == TRUE) lockEnvironment(preparedEnv)
  return(preparedEnv)
}

eval_fork <- function(..., timeout=60){
  #this limit must always be higher than the timeout on the fork!
  setTimeLimit(timeout+5);		
  
  #dispatch based on method
  ##NOTE!!!!! Due to a bug in mcparallel, we cannot use silent=TRUE for now.
  myfork <- parallel::mcparallel({
    eval(...)
  }, silent=FALSE);
  
  #wait max n seconds for a result.
  myresult <- parallel::mccollect(myfork, wait=FALSE, timeout=timeout);
  
  #kill fork after collect has returned
  tools::pskill(myfork$pid, tools::SIGKILL);	
  tools::pskill(-1 * myfork$pid, tools::SIGKILL);  
  
  #clean up:
  parallel::mccollect(myfork, wait=FALSE);
  
  #timeout?
  if(is.null(myresult)){
    stop("R call did not return within ", timeout, " seconds. Terminating process.", call.=FALSE);		
  }
  
  #move this to distinguish between timeout and NULL returns
  myresult <- myresult[[1]];
  
  #reset timer
  setTimeLimit();	  
  
  #forks don't throw errors themselves
  if(inherits(myresult,"try-error")){
    #stop(myresult, call.=FALSE);
    stop(attr(myresult, "condition"));
  }
  
  #send the buffered response
  return(myresult);  
}


main <- function(identifiant, worker_url){
  worker <- R_Worker$new(identifiant = identifiant, worker_url = worker_url)
  worker$bind_socket()
  none <- tryCatch(
    worker$listen(),
    error = function(j) j,
    interupt = function(i) i,
    finally = worker$close()
  )
  q('no')
  # TryCatch is used to try to close nicely the application
  # (by dereferencing socket and context) when receiving SIGINT,
  # but this could theoricaly lead to race conditions 
  # (if others signals are transmited while handling this one)
}

main(commandArgs(TRUE)[1], 'ipc:///tmp/feeds/workers')

# R_Worker <- setRefClass(
#   'R_Worker',
# 
#   fields = list(
#     identifiant = 'character',
#     worker_url = 'character',
#     histo_count = 'numeric',
#     socket = 'externalptr',
#     ctx = 'externalptr'),
# 
#   methods = list(
#     bind_socket = function(){
#       histo_count <<- 0
#       ctx <<- zmq.ctx.new()
#       socket <<- zmq.socket(ctx, .pbd_env$ZMQ.ST$REQ)
#       zmq.setsockopt(socket, .pbd_env$ZMQ.SO$IDENTITY, identifiant)
#       zmq.connect(socket, worker_url)
#       zmq.send(socket, charToRaw("READY"))
#       print(paste0("Worker ", identifiant, " is ON"))
#     },
# 
#     listen = function(){
#       while(TRUE){
#         ret <- zmq.recv.multipart(socket, FALSE)
#         address <- ret[[1]]
#         request <- rawToChar(ret[[3]])
#         result <- rEval(request)
#         # print(paste('Worker', identifiant, ' received :', request, '\n',
#         #             'Result : ', result, sep = ' '))
#         msg = list(
#           address,
#           charToRaw(''),
#           charToRaw(result)
#         )
#         zmq.send.multipart(socket, msg, FALSE)
#         histo_count <<- histo_count + 1
#         if(result == "Now exiting R\n")break
#       }
#     },
# 
#   rEval = function(message){
#     validateOuput <- function(output)encodeString(toString(format(output)))
#     if(grepl('system', message) | grepl('exitR', message)){
#       out <- "Now exiting R\n"
#     }
#     else{
#       output <- tryCatch(
#         eval(parse(text=message), envir = .GlobalEnv),
#         error = function(e)paste0(e$message, "\n")
#       )
#       # print(output)
#       out <- validateOuput(output)
#     }
#     return(out)
#   },
# 
#   close = function(){
#     zmq.close(socket)
#     zmq.ctx.destroy(ctx)
#     exit_msg <- paste0("Worker ", identifiant, " closed after ", histo_count, " requests")
#     print(exit_msg)
#   }
# ))


# makelock <- function()({
#   state = FALSE
#   this <- environment();
#   function(set){
#     if(!missing(set)){
#       state <<- set;
#       lockEnvironment(this, bindings = TRUE)
#     }
#     state
#   }
# })


