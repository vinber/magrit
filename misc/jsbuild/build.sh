#!/bin/bash

cp .babelrc ../../noname_app/static/js/

cd ../../noname_app/static/js/

babel main.js colors_helpers.js context-menu.js discretization_panel.js discrtiz_links_discont.js function.js helpers.js helpers_calc.js interface.js join_popup.js layers_style_popup.js layout_features.js legend.js map_project.js symbols_picto.js tables.js > app.js

#babel main.js colors_helpers.js context-menu.js discretization_panel.js discrtiz_links_discont.js function.js helpers.js helpers_calc.js interface.js join_popup.js layers_style_popup.js layout_features.js legend.js map_project.js symbols_picto.js tables.js --minified > app.min.js

uglifyjs app.js -o app.min.js

rm .babelrc
