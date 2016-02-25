#!/usr/bin/env Rscript
require(base)
require(methods)
require(stats)
require(pbdZMQ)
require(jsonlite)

startServer_test <- function(port){
  ctx = zmq.ctx.new()
  socket = zmq.socket(ctx, .pbd_env$ZMQ.ST$REP)
  zmq.bind(socket, paste0("ipc:///tmp/feeds/", port))
  
  while(TRUE){
    buf <- NULL
    msg <- NULL
    result <- NULL
    buf = zmq.recv(socket);
    msg = buf$buf
    if(class(msg) == 'raw'){msg = rawToChar(msg)}
    print(msg)
    result <- rEval(msg)
    zmq.send(socket, result[2])
    if(result[1] == -1) break
  }
  zmq.close(socket)
  zmq.ctx.destroy(ctx)
  print('Exiting R...')
  q("no")
}

rEval <- function(message){
  validateOuput <- function(output)encodeString(toString(format(output)))
  if(grepl('system', message) | grepl('exitR', message)){
    out <- c(-1, "Now exiting R\n")
  }
  else{
    output <- tryCatch(
      eval(parse(text=message), envir = .GlobalEnv),
      error = function(e)paste0(e$message, "\n")
    )
    print(output)
    out <- c(0, validateOuput(output))
  }
  return(out)
}

startServer_test(commandArgs(TRUE)[1])