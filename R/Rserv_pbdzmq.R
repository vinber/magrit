#!/usr/bin/env Rscript
require(base)
require(methods)
require(stats)
require(pbdZMQ)
require(jsonlite)

startServer2 <- function(port){
  url_sock <- function(name){
    paste0("ipc:///tmp/feeds/", port, name)
  }
  on.exit(q("no"))
  context <<- zmq.ctx.new()
  sockets <<- list(
    hb=zmq.socket(context, .pbd_env$ZMQ.ST$REP),
    iopub=zmq.socket(context, .pbd_env$ZMQ.ST$PUB),
    control=zmq.socket(context, .pbd_env$ZMQ.ST$ROUTER),
    stdin=zmq.socket(context, .pbd_env$ZMQ.ST$ROUTER),
    shell=zmq.socket(context, .pbd_env$ZMQ.ST$ROUTER)
    )
  zmq.bind(sockets$hb, url_sock('hb_port'))
  zmq.bind(sockets$iopub, url_sock('iopub_port'))
  zmq.bind(sockets$control, url_sock('control_port'))
  zmq.bind(sockets$stdin, url_sock('stdin_port'))
  zmq.bind(sockets$shell, url_sock('shell_port'))

  while (TRUE) {
    zmq.poll(
      c(sockets$hb, sockets$shell, sockets$control),
      rep(.pbd_env$ZMQ.PO$POLLIN, 3))
    
    if(bitwAnd(zmq.poll.get.revents(1), .pbd_env$ZMQ.PO$POLLIN))
      hb_reply()
    
    if(bitwAnd(zmq.poll.get.revents(2), .pbd_env$ZMQ.PO$POLLIN))
      hb_reply()
      # handle_shell()
    
    if(bitwAnd(zmq.poll.get.revents(3), .pbd_env$ZMQ.PO$POLLIN))
      hb_reply()
      # handle_control()
  }
  q("no")
}

hb_reply = function() {
  data <- zmq.msg.recv(sockets$hb, unserialize = FALSE)
  print(rawToChar(data))
  zmq.msg.send(data, sockets$hb, serialize = FALSE)
}

handle_control = function() {
  parts <- zmq.recv.multipart(sockets$control, unserialize = FALSE)
  msg <- wire_to_msg(parts)
  if (msg$header$msg_type == 'shutdown_request') {
    shutdown(msg)
  } else {
    print(paste('Unhandled control message, msg_type:', msg$header$msg_type))
  }
}

handle_shell = function() {
  "React to a shell message coming in"
  parts <- zmq.recv.multipart(sockets$shell, unserialize = FALSE)
  msg <- (parts)
  switch(
    msg$header$msg_type,
    execute_request     = executor$execute(msg),
    kernel_info_request = kernel_info(msg),
    history_request     = history(msg),
    complete_request    = complete(msg),
    is_complete_request = is_complete(msg),
    shutdown_request    = shutdown(msg),
    print(c('Got unhandled msg_type:', msg$header$msg_type)))
}

msg_to_wire = function(msg) {
  "Serialize a message"
  
  #print(msg)
  bodyparts <- list(
    charToRaw(toJSON(msg$header,        auto_unbox = TRUE)),
    charToRaw(toJSON(msg$parent_header, auto_unbox = TRUE)),
    charToRaw(toJSON(msg$metadata,      auto_unbox = TRUE)),
    charToRaw(toJSON(msg$content,       auto_unbox = TRUE)))
  
  signature <- sign_msg(bodyparts)
  c(
    msg$identities,
    list(charToRaw('<IDS|MSG>')),
    list(charToRaw(signature)),
    bodyparts)
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
print(commandArgs(TRUE)[1])
startServer2(commandArgs(TRUE)[1])