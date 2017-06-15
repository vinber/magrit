Changes
=======

0.3.3 (2017-06-15)
------------------

- Allow to add more than one sphere background (#26).

- Add default projection for sample basemaps.


0.3.2 (2017-06-09)
------------------

- Fix text annotation behavior when clicking on "cancel".

- Fix legend displaying "false" after reloading (when size was not fixed).

- Switch color between "OK" and "Cancel" buttons on modal box.


0.3.1 (2017-06-08)
------------------

- Fix how values are retrieved for cartogram.


0.3.0 (2017-06-07)
------------------

- CSV reading: fix the recognition of some encodings + fix the reading of files whose first column contains an empty name.

- Modifies text annotations (internally): now allows the selection of the alignment (left, center, right) of the text within the block.

- Modifies versioning to follow SemVer more strictly.

- Fix Lambert 93 projection, accessible from the menu of projections (the display was non-existent at certain levels of zoom with this projection).

- Removes two projections that could be considered redundant.

- Fix bug with choice of pictogram size.

- Fix bug in the order in which some features are reloaded from project file.
