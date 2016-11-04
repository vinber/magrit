#!/bin/bash
# Recompile bootstrap 'less' rules to css to scope them under the "twbs" class name
# (should be done in JS when doing other JS steps)
if [ ! -d bootstrap-3.3.7 ]; then
	wget https://github.com/twbs/bootstrap/archive/v3.3.7.zip
	unzip v3.3.7.zip
fi
echo ".twbs { @import \"bootstrap-3.3.7/less/bootstrap.less\"; }" > style.less
lessc style.less > scoped-bootstrap.css
minify scoped-bootstrap.css > scoped-bootstrap.min.css
rm -rf style.less v3.3.7.zip