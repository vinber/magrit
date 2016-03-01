require(pbdZMQ)
require(methods)
require(stats)
require(base)

R_Worker <- function(identifiant, worker_url = 'ipc:///tmp/feeds/workers'){
  ctx = zmq.ctx.new()
  socket = zmq.socket(ctx, .pbd_env$ZMQ.ST$REQ)
  zmq.setsockopt(socket, .pbd_env$ZMQ.SO$IDENTITY, identifiant)
  zmq.connect(socket, worker_url)
  zmq.send(socket, charToRaw("READY"))
  
# tryCatch(
  while(TRUE){
    ret <- zmq.recv.multipart(socket, FALSE)
    address <- ret[[1]]
    request <- rawToChar(ret[[3]])
    result <- rEval(request)
    print(paste('Worker', identifiant, ' received :', request, '\n',
                'Result : ', result, sep = ' '))
    msg = list(
      address,
      charToRaw(''),
      charToRaw(result)
      )
    zmq.send.multipart(socket, msg, FALSE)
    if(result == "Now exiting R\n")break
  }
  zmq.close(socket)
  zmq.ctx.destroy(ctx)
# )
}

rEval <- function(message){
  validateOuput <- function(output)encodeString(toString(format(output)))
  if(grepl('system', message) | grepl('exitR', message)){
    out <- "Now exiting R\n"
  }
  else{
    output <- tryCatch(
      eval(parse(text=message), envir = .GlobalEnv),
      error = function(e)paste0(e$message, "\n")
    )
    # print(output)
    out <- validateOuput(output)
  }
  return(out)
}

R_Worker(commandArgs(TRUE)[1])
