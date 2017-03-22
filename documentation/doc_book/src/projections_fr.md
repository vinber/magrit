# Projections

De nombreuses projections cartographiques sont disponibles dans l'application.   
La séléction d'une projection s'effectue dans la partie supérieure droite de la fenêtre.

<p style="text-align: center;">
<img src="img/win_prc2_fr.png" alt="Changer la projection"/>
</p>

Le choix d'une projection est accompagné du choix de son centrage.
Celui-ci est par défaut sur la longitude 0°.

Plusieurs attributs permettent de distinguer ces projections :
- la conservation locale des surfaces (ces projections sont dites **équivalentes**, c'est par exemple le cas de la *projection azimutale équivalente de Lambert*)
- la conservation locale des angles (ces projections conservent les formes et sont dites **conformes**, c'est par exemple le cas de la *projection Mercator*)
- la représentation du globe sous une forme interrompue (*projection HEALPix* et *projection de Goode* par exemple)

<p style="text-align: center;"><img src="img/anim_projection_transp.gif" alt="animation_projection" style="width: 260px;"/></p>

Selon l'échelle d'affichage de la carte et la déformation appliquée par la projection, la présence d'un figuré indiquant le nord peut s'avérer peu ou pas pertinente.  
Il est toutefois possible d'ajouter une couche représentant le tracé des lignes de latitude et de longitude (cette couche d'informations est ici appelé "graticule" et est disponible dans la section "ajout d'éléments d'habillage"). Cette couche d'information permet une bonne visualisation des déformations apportées par les différentes projections.
Il est également possible (et conseillé lors de l'utilisation des projections dites "interrompues") d'ajouter une couche d'informations représentant les limites du globe selon le découpage appliqué par la projection.

> #### Note:
> - La modification de la projection à utiliser est possible à tout moment.
> - Lors de la réalisation d'une carte d'une faible emprise spatiale, l'utilisation de certaines projection n'est pas pertinent et est désactivé par défaut.

#### Exemple d'utilisation des graticules et du fond de l'emprise du globe avec des représentations originales :
<p style="text-align: center;">
<img src="img/proj_loximuthal.png" alt="proj_loximuthal" style="width: 400px;"/></br>
projection Loximuthal</br></br>
<img src="img/proj_healpix.png" alt="proj_healpix" style="width: 400px;"/></br>
projection HEALPix</br></br>
<img src="img/proj_interrupted.png" alt="proj_interrupted" style="width: 400px;"/></br>
projection Interrupted Homolosine</br></br>
<img src="img/proj_peirce.png" alt="proj_peirce" style="width: 400px;"/></br>
projection Peirce</br></br>
<img src="img/proj_eisenlohr.png" alt="proj_eisenlohr" style="width: 400px;"/></br>
projection Eisenlohr</br></p>
