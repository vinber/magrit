load <- function(){
  require(pbdZMQ, quietly = TRUE)
  require(jsonlite, quietly = TRUE)
  require(raster, quietly = TRUE)
  require(sp, quietly = TRUE)
  require(SpatialPosition, quietly = TRUE)
  require(geojsonio, quietly = TRUE)
}

# ToDo : find a better way to prepare an environment or at least
# prepare the environnement once, save it and load it when launching
# the script instead of reevaluate 'make_env'
make_env <- function(lock = FALSE){
  source('R/worker_functions.R')
  preparedEnv = new.env(hash = TRUE, parent = baseenv())
  preparedEnv$break_val_stewart <- break_val_stewart
  preparedEnv$stewart_to_json <- stewart_to_json
  preparedEnv$huff_to_json <- huff_to_json
  preparedEnv$reilly_to_json <- reilly_to_json
  preparedEnv$mta_globaldev <- mta_globaldev
  preparedEnv$mta_mediumdev <- mta_mediumdev
  preparedEnv$mta_localdev <- mta_localdev
  preparedEnv$prepflows_json <- prepflows_json
  if(lock == TRUE) lockEnvironment(preparedEnv)
  return(preparedEnv)
}

R_Worker_fuw <- R6::R6Class(
  classname = 'R_Worker_fuw',
  
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
      zmq.setsockopt(socket, .pbd_env$ZMQ.SO$RCVBUF, 60000000L)
      zmq.connect(socket, self$worker_url)
      zmq.send(socket, charToRaw("READY"))
      print(paste0("Worker ", self$identifiant, " is ON"))
    },
    
    do = function(request, data){
      if(grepl('CLOSE', request) | grepl('exitR', request)){
        out <- "Now exiting R\n"
      } else {
        # Each expression (or batch of chained expressions)
        # should be computed in his own environnement
        # (ie. the request come with its list of variable = value)
        # and this list of variables is merged with 
        # the previously prepared environnement :
        the_env <- as.environment(c(data, as.list(self$preparedEnv)))
        # No real trouble to use 'eval' here
        # .. as the request is prepared server-side ?
        output <- tryCatch(
          eval(expr = parse(text = request), envir = the_env),
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
        address <- ret[[1]]
        request <- rawToChar(ret[[3]])
        data <- fromJSON(rawToChar(ret[[5]]))
        # print(data)
        print(paste("Worker", self$identifiant, "received request on", request))
        result <- self$do(request, data)
        msg = list(address, charToRaw(''), charToRaw(result))
        zmq.send.multipart(socket, msg, FALSE)
        self$histo_count <<- self$histo_count + 1
        if(result == "Now exiting R\n") break
      }
    },
    
    close = function(){
      zmq.close(socket)
      zmq.ctx.destroy(ctx)
      print(paste0("Worker ", self$identifiant,
                   " closed after ", self$histo_count, " requests"))
    },
    
    histo_count = 0,
    identifiant = NA,
    worker_url = NA,
    preparedEnv = NA
  ),
  
  private = list(socket = NA, ctx = NA)
)

main_fuw <- function(identifiant, worker_url){
  worker <- R_Worker_fuw$new(identifiant = identifiant,
                             worker_url = worker_url)
  worker$bind_socket()
  none <- tryCatch(
    worker$listen(),
    error = function(j) print(j),
    interupt = function(i) i,
    finally = worker$close()
  )
  q('no')
}

trash_var = NA
tryCatch(load(),
         error=function(e) e,
         warning=function(w) trash_var<-w,
         message=function(m) trash_var<-m)
main_fuw(commandArgs(TRUE)[1], 'ipc:///tmp/feeds/workers')
