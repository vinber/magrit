Import et manipulation des données
==================================

Deux éléments fondamentaux servent de point de départ à la réalisation d'une carte dans Magrit : le fond de carte et les données qui y sont associées.
De larges possibilités sont offertes à l'utilisateur concernant l'ajout de ces deux éléments.


----------


Import du fond de carte
-----------------------
L'import du fond de carte principal peut se faire de différentes manières : 
- Par un click sur le bouton *'ajout d'un fond de carte'* <img src="img/addgeom.png" alt="image_ajout_couche" style="width: 35px;"/> puis par le choix du fichier.
- Par un glisser-déposer vers le centre de la carte.
- Par un glisser-déposer vers la section appropriée du menu.


Plusieurs formats sont supportés:
- ```Shapefile```
- ```GeoJSON```
- ```TopoJSON```
- ```kml```
- ```gml```
- Fichier ```csv``` avec colonnes x/y ou geometry

> **Note:**
> La plupart des formats permettent de spécifier un système de coordonnées de référence; cette indication est ici obligatoire pour ouvrir correctement le fichier.
> Si aucun système de coordonnées de référence n'est spécifié, l'application considère qu'il s'agit de coordonnées géographiques.



Import d'un tableau de données
------------------------------
L'ajout d'un tableau de données peut ^etre effectué de plusieurs manières :
- Par un glisser-déposer du fichier vers la section appropriée du menu
- Par un click sur le bouton *'ajout d'un jeu de données'* <img src="img/addtabular.png" alt="image_ajout_tableau" style="width: 35px;"/>


Plusieurs format sont pris en charge pour l'import des données : 
- ```csv``` (champs séparés par une virgule ou par un point virgule)
- ```tsv``` (champs séparés par une tabulation)
- ```xls``` et ```xlsx``` (à condition que le feuillet à utiliser contiennent seulement la table de données; cf. example).


Jointure des données
--------------------

Lorsqu'un fond de carte et un jeu de données externes on été ajoutées, il devient possible de les joindres.
Cette opération et appelée "jointure" (c'est également le cas dans les logiciels SIG ou dans certaines bases de données) et s'effectue en choisissant la colonne de données....


<img src="img/data_join.png" alt="image_join" style="width: 480px;"/>

> <img src="img/joinfalse.png" alt="joinfalse" style="width: 35px;"/> Apparence de l'élément avant jointure  
> <img src="img/jointrue.png" alt="jointrue" style="width: 35px;"/> Apparence de l'élément après jointure des champs  



Affichage et enrichissement des tables de données
-------------------------------------------------

L'affichage des tableaux de données correspondant à chaqu'une des couches ajoutées (ou obtenues en résultat d'un type de représentation) est possible via le gestionnaire de couche et le bouton représentant une table de donnée dont est affublée chaque couche.



  [1]: Ref
  [2]: Ref


