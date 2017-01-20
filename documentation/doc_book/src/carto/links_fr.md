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
