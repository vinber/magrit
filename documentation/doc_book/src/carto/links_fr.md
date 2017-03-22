# Carte des liens

Ce type de carte représente, avec des lignes d'épaisseur proportionnelle à l'intensité du phénomène, les connexions (flux/liens) existant entre des couples de lieux.
Différents éléments, tels que la présence de chevauchements trop nombreux, peuvent nuire à la lisibilité de ce type de représentation,
Ce type de carte requiert généralement d'effectuer une sélection après le premier rendu, consistant par exemple à ne pas représenter les flux les plus faibles.


> ### Paramètres
> * Le champ contenant les identifiants des entités 'origine'.
> * Le champ contenant les identifiants des entités 'destination'.
> * Le champ contenant les valeurs de l'intensité du phénomène entre 'i' et 'j'.
> * Le type de méthode à utiliser pour discrétiser les valeurs.
> * Le nombre de classes à créer lors de l'application de la méthode précédemment définie.

#### Exemple :

<p style="text-align: center;">
<img src="img/flows.png" alt="link_map" style="width: 480px;"/>
</p>

#### Informations sur le format des données attendues :

La table de données à joindre doit être dans un format supporté par l'application (format .csv, .xls/.xlsx ou .ods). Cette table doit contenir au minimum 3 colonnes : les identifiants des entités d'origine, les identifiants des entités de destination, les valeurs correspondants à l'intensité du phénomène mesuré. La première ligne de cette table est à réserver au nom de colonne; chacune des lignes suivantes décrit un lien, entre un couple de lieu, à créer sur la carte.  
Ainsi, les premières lignes d'une table décrivant des liens entre pays européens pourraient être écrites :  


| Origine       | Destination   | Valeur  |
| ------------- |:-------------:| -----:|
| BE            | LUX           | 12    |
| BE            | FR            | 8     |
| BE            | DE            | 10    |
| LUX           | DE            | 6     |
| LUX           | FR            | 3     |


Une table d'exemple de ce type peut être téléchargée ci-dessous; elle permet la réalisation d'une carte de lien lorsqu'elle est utilisé avec le fond des pays européens.

<p><a href="https://raw.githubusercontent.com/riatelab/magrit/master/magrit_app/static/data_sample/links.csv">Table d'exemple</a></p>
<p><a href="https://raw.githubusercontent.com/riatelab/magrit/master/magrit_app/static/data_sample/nuts0.geojson">Fond de carte des pays européens</a></p>
