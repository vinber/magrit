Export
===================

L'outil offre la possibilité d'exporter aussi bien les cartes réalisées que les fichiers géographiques de couche sur lesquels elles reposent.
Il est également possible, afin de partager son travail avec un collègue ou afin de le continuer plus tard, de sauvegarder l'état du projet en cours.


----------


Export au format svg
-------------

Grace à cette méthode il est possible d'exporter le rendu actuel selon les spécifications SVG 1.2.

> **Note:**
> * Les spécifications svg ne sont pas implémentées de manière strictement similaire selon les outils de visualisation et d'édition.
> * Les exports svg fournis par l'application visent en priorité l'affichage de l'image par un navigateur web et/ou son édition par un outil comme [Inkscape], Adobe Illustrator ou [SVGEdit].
> * Des fonctionnalités fournissant des exports optimisés sont proposées, pour Inkscape d'une part et pour Adobe Illustrator d'autre part.



Export au format png
-------------
Cette méthde permet d'exporter la carte dans un format dit "matriciel", c'est à dire composé de points.
La résolution de ce type de fichier est fixe.  
Ainsi dans Magrit il est proposé de choisir la résolution du fichier à exporter en fonction de son futur usage (affichage écran, impression petit ou grand format, etc.).

Export d'un fichier de couche géographique
-------------

Cette fonctionnalité n'est disponible que pour pour les types de représentation ayant généré un nouveau fichier géographique.
C'est le cas des méthodes suivantes : carroyages, cartogramme (selon la méthode d'Olson et selon la méthode de Dougenik), cartes lissée, carte des liens et carte des discontinuités.
Les formats proposés à l'export sont les memes que ceux acceptés lors de l'import :
- GeoJSON
- TopoJSON
- Shapefile
- Kml
- Gml

Différents systèmes de projection sont proposés par défaut lors de l'export mais il est possible de choisir tout type de système de référence supporté par le projet [Proj.4].

Sauvegarde du projet en cours
-------------

Cette fonctionnalité permet de sauvegarder l'état d'une session et de l'exporter au format JSON.
Le fichier "projet" ainsi exporté pourra etre ouvert à nouveau, depuis n'importe qu'elle poste d'ordinateur, et permet de continuer la session de travail.
Cette fonctionnalité de sauvegarde du projet est activée automatiquement lorsque l'utilisateur quitte la page; la session est alors sauvegardée localement dans le navigateur pour une éventuelle reprise ultérieure.


  [Inkscape]: https://inkscape.org
  [SVGEdit]: https://github.com/SVG-Edit/svgedit
  [Proj.4]: https://github.com/OSGeo/proj.4/wiki
