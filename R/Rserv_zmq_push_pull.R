#!/usr/bin/env Rscript
require(base)
require(methods)
require(stats)
require(pbdZMQ)
require(jsonlite)

startServer_test <- function(port){
  ctx = zmq.ctx.new()
  socket_recv = zmq.socket(ctx, .pbd_env$ZMQ.ST$PULL)
  socket_send = zmq.socket(ctx, .pbd_env$ZMQ.ST$PUSH)
  zmq.bind(socket_recv, paste0("ipc:///tmp/feeds/", as.character(as.numeric(port)+1)))
  zmq.bind(socket_send, paste0("ipc:///tmp/feeds/", port))
  
  while(TRUE){
    buf = zmq.recv(socket_recv);
    msg = buf$buf
    if(class(msg) == 'raw'){msg = rawToChar(msg)}
    print(msg)
    result <- rEval(msg)
    zmq.send(socket_send, result[2])
    if(result[1] == -1) break
  }
  zmq.close(socket_send)
  zmq.close(socket_recv)
  zmq.ctx.destroy(ctx)
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