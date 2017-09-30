# FAQ


### Pourquoi Magrit émet un message d'avertissement lorsque la géométrie de certaines entités d'une couche est nulle ?


### Pourquoi un nombre trop important de couleurs dans une palette peut nuire à la lisibilité de la carte ?
L'oeil humain ne distingue correctement qu'un nombre de couleurs limité. L'utilisation d'un nombre de couleurs élevé lors de la conception d'une palette pour une carte choroplèthe empêche de percevoir avec précision les limites entre les classes et rend ainsi difficile de trouver la classe d'appartenance d'une entité.

### Pourquoi certains fond de cartes posent un problème lors de certains traitement ? Qu'est-ce que la "topologie" d'un fond de carte ?


### Pourquoi une limite de taille est-elle fixée lors de l'import d'un fond de carte ?

La taille maximale des fichiers pouvant être importés dans Magrit est limitée à 20Mo. Plusieurs raisons ont motivé ce choix et visent essentiellement à éviter des ralentissements indésirables dans le navigateur de l'utilisateur.
 D'une part le temps d'envoi d'un fichier volumineux peut être non-néligeable en fonction de la qualité de la connexion (un fichier de 20Mo prend en moyenne xx secondes avec une connexion xyz). D'autre part Magrit utilise la technologie SVG pour effectuer le rendu des cartes dans le navigateur. Cette technologie est performante mais se prête difficilement à l'affichage des couches contenant un nombre très élevé d'entitées.
Ce type de limite permet également de s'interroger sur l'intéret d'une carte thématique contenant un nombre d'entités très élevé ou contenant des géométrie très détaillées. En effet, en fonction du type de données ou de l'échelle de travail, il peut être utile de faire appel au préalable à certaines techniques de préparation des données (aggrégation dans le cas d'un semi de points très important par exemple) ou de préparation du fond de carte (généralisation des géométries utilisées par exemple).

### Pourquoi le rendu de certains exports SVG n'est pas le même dans Inkscape/Adobe Illustrator que lors de l'affichage de la carte dans Magrit ?
// TODO: Parler des fonts/ Dire d'ouvrir le fichier svg dans un navigateur pour vérifier le résultat/ Evoquer exports svg spéciaux AI ?


### Pourquoi n'est-il pas possible d'afficher un fond type "OpenStreetMap" lors de la réalisation d'une carte avec Magrit ?
