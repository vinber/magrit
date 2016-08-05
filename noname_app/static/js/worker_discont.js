self.addEventListener('message', function(e) {
    console.log("Message received");
    let data = e.data;
    postMessage("foobar");
}, false);