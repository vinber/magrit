#!/usr/bin/env Rscript
require(base)
require(methods)
require(stats)
require(pbdZMQ)
require(jsonlite)

# startServer2 <- function(port){
#   url_sock <- function(name){
#     paste0("ipc:///tmp/feeds/", port, '_', name)
#   }
#   on.exit(q("no"))
#   context <<- zmq.ctx.new()
#   socket <<- list(
#     hb=zmq.socket(context, .pbd_env$ZMQ.ST$REP),
#     iopub=zmq.socket(context, .pbd_env$ZMQ.ST$PUB),
#     control=zmq.socket(context, .pbd_env&ZMQ.ST.ROUTER),
#     stdin=zmq.socket(context, .pbd_env&ZMQ.ST.ROUTER),
#     shell=zmq.socket(context, .pbd_env&ZMQ.ST.ROUTER)
#     )
#   zmq.bind(sockets$hb, url_with_port('hb_port'))
#   zmq.bind(sockets$iopub, url_with_port('iopub_port'))
#   zmq.bind(sockets$control, url_with_port('control_port'))
#   zmq.bind(sockets$stdin, url_with_port('stdin_port'))
#   zmq.bind(sockets$shell, url_with_port('shell_port'))
#   
#   persist <- TRUE
#   while(persist){
#     message = receive.socket(socket, FALSE);
#     if(class(message) != 'character'){message = rawToChar(message)}
#     print(message)
#     output <- rEval(message)
#     send.raw.string(socket, output[["data"]])
#     persist <- output[["keep.alive"]]
#   }
#   q("no")
# }

startServer_test <- function(port){
  ctx = zmq.ctx.new()
  socket = zmq.socket(ctx, .pbd_env$ZMQ.ST$REP)
  zmq.bind(socket, paste0("ipc:///tmp/feeds/", port))

  while(TRUE){
    buf = zmq.recv(socket);
    msg = buf$buf
    if(class(msg) == 'raw'){msg = rawToChar(msg)}
    print(msg)
    result <- rEval(msg)
    result <- paste0(result, ' + OK')
    zmq.send(socket, result)
  }
  q("no")
}


startServer <- function(port){
  on.exit(q("no"))
  context = init.context()
  socket = init.socket(context, "ZMQ_REP")
  bind.socket(socket, paste0("ipc:///tmp/feeds/", port))
  
  persist <- TRUE
  while(persist){
    message = receive.socket(socket, FALSE);
    if(class(message) != 'character'){message = rawToChar(message)}
    print(message)
    output <- rEval(message)
    send.raw.string(socket, output[["data"]])
    persist <- output[["keep.alive"]]
  }
  q("no")
}

exitR <- function()
{
  out <- vector("list", 2)
  names(out) <- c("keep.alive", "data")
  out[["data"]] <- "Now exiting R\n"
  out[["keep.alive"]] <- FALSE
  return(out)
}

# Function to eval/parse external calls to R
rEval <- function(message){
  validateOuput <- function(output)encodeString(toString(format(output)))
  if(grepl('system', message) | grepl('exitR', message)){
    out <- exitR()
  }
  else{
    output <- tryCatch(
      eval(parse(text=message), envir = .GlobalEnv),
      error = function(e)paste0(e$message, "\n")
    )
    print(output)
    output <- validateOuput(output)
    out <- vector("list", 2)
    names(out) <- c("keep.alive", "data")
    out$data <- output
    out$keep.alive <- TRUE
  }
  return(out)
}

startServer_test(commandArgs(TRUE)[1])
#startServer(commandArgs(TRUE)[1])