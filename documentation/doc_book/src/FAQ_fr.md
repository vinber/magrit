# FAQ

### Pourquoi Magrit émet un message d'avertissement lorsque la géométrie de certaines entités d'une couche est nulle ?


### Pourquoi un nombre trop important de couleurs peut nuire à la lisibilité de la carte ?


### Pourquoi certains fond de cartes posent un problème lors de certains traitement ? Qu'est-ce que la "topologie" d'un fond de carte ?


### Pourquoi une limite de taille est-elle fixée lors de l'import d'un fond de carte ?

La taille maximale des fichiers pouvant être importés dans Magrit est limitée à 20Mo. Plusieurs raisons ont motivé ce choix et visent essentiellement à éviter des ralentissements indésirables dans le navigateur de l'utilisateur.
 D'une part le temps d'envoi d'un fichier volumineux peut être non-néligeable en fonction de la qualité de la connexion (un fichier de 20Mo prend en moyenne xx secondes avec une connexion xyz). D'autre part Magrit utilise la technologie SVG pour effectuer le rendu des cartes dans le navigateur. Cette technologie est performante mais se prête difficilement à l'affichage des couches contenant un nombre très élevé d'entitées.
