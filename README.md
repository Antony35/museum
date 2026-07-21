# Musée Couleur & Silence

Musée virtuel explorable en vue subjective, construit avec **Three.js** et **Vite**.
Quatorze œuvres réparties sur trois cimaises ; le clic sur une toile (raycasting) lance
un travelling d'inspection et affiche ses informations à droite de l'œuvre.

## Lancer le projet

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # génère dist/
pnpm preview    # sert le build de production
```

## Commandes de visite

| Action | Touche |
| --- | --- |
| Se déplacer | `Z` `Q` `S` `D` ou les flèches |
| Regarder | souris (pointer lock) |
| Courir | `Maj` |
| Examiner une œuvre | clic (le réticule doit être sur la toile) |
| Libérer la souris / quitter l'inspection | `Échap` |

Sans pointer lock, le clic direct sur un tableau lance également son inspection.

## Architecture

Séparation stricte entre la **logique 3D** et la **logique DOM**. Les deux couches ne
se connaissent pas : elles communiquent uniquement via les callbacks déclarés dans `main.js`.

```
main.js                        Point d'entrée — le SEUL fichier qui touche aux deux couches
src/js/
  Museum.js                    Scène, lumières, boucle de rendu, API par événements
  Room.js                      Sol, plafond, murs, cimaise centrale
  Wall.js                      Un pan de mur + sa Box3 pour les collisions
  Artwork.js                   Cadre + passe-partout + toile + cartel
  Picker.js                    Raycaster (réticule ou pointeur)
  controls/PlayerControls.js   PointerLockControls + clavier + collisions Box3
  ui/Hud.js                    Réticule, info-bulle, aide, compteur FPS  ← zéro import three
  ui/ArtworkPanel.js           Panneau d'informations                    ← zéro import three
  data/artworks.js             Catalogue : la source de vérité unique
  utils/artCanvas.js           Génération procédurale déterministe des toiles
src/utils/
  resizeRenderToDisplaySize.js Redimensionnement du renderer
src/assets/styles/style.css    Variables CSS, Flexbox, Grid, responsive
src/assets/models/             Modèles .glb exportés depuis Blender
```

Vérification automatisable de la séparation :

```bash
grep -rn "document\.\|window\." src/js/ | grep -v "src/js/ui/"   # seule exception : PlayerControls (clavier)
grep -rn "three" src/js/ui/                                       # doit être vide
```

## Choix techniques

- **Géométries partagées** — les 14 tableaux réutilisent une seule `PlaneGeometry` et une
  seule `BoxGeometry` de cadre. La taille passe par `mesh.scale`, pas par une géométrie dédiée.
- **Raycasting ciblé** — `intersectObjects()` ne reçoit que les 14 meshs de toile, jamais la
  scène entière. Le coût d'un raycast est proportionnel au nombre de triangles testés.
- **Boîtes de collision précalculées** — les murs ne bougent pas, leurs `Box3` sont calculées
  une fois au démarrage. Les axes sont testés séparément pour permettre de glisser le long
  d'un mur au lieu de rester bloqué en diagonale.
- **Déplacement en delta time** — la vitesse est multipliée par le temps écoulé, donc identique
  à 30 comme à 144 FPS.
- **`devicePixelRatio` plafonné à 2** — au-delà, le coût en pixels explose pour un gain nul.
- **Toiles procédurales déterministes** — `createArtCanvas()` produit toujours le même
  canvas à partir des données et de la graine ; `Artwork` le convertit en `CanvasTexture`.

## Ajouter une œuvre

Tout se passe dans `src/js/data/artworks.js` — un objet de plus dans le tableau suffit.
Pour utiliser une vraie image plutôt que la toile générée, déposez-la dans `public/artworks/`
et renseignez `image: 'artworks/mon-fichier.jpg'`. Si le fichier est introuvable, la toile
procédurale est conservée et un avertissement s'affiche en console.

## Assets Blender

_(à compléter)_ — modèles `.glb` dans `src/assets/models/`, chargés via `GLTFLoader`.

## Déploiement

Build puis envoi du contenu de `dist/` sur AlwaysData (FTP/SSH).
Si le site n'est pas servi à la racine du domaine, renseigner `base` dans `vite.config.js`.

## Prompts IA majeurs

_À tenir à jour au fil du développement — c'est un livrable noté._

| # | Objectif | Prompt (résumé) | Ce qui a été retenu / corrigé |
| --- | --- | --- | --- |
| 1 | Cadrage du projet | Décrire le sujet imposé et demander une feuille de route technique complète (navigation, architecture des modules, étapes) | Choix de `PointerLockControls`, architecture procédurale avec `Room`/`Wall`, Blender réservé aux objets décoratifs |
| 2 | Implémentation | Demander une première version fonctionnelle complète du musée | Code relu module par module ; à documenter au fur et à mesure des modifications |
| 3 | Inspection immersive | Remplacer la fiche modale par un travelling vers l'œuvre et des informations superposées à droite, façon réalité augmentée | Cadrage frontal avec contexte, panneau translucide sans image dupliquée, retour à la vue initiale et respect de la réduction des animations |

> Ajouter ici chaque prompt significatif : ce que vous avez demandé, ce que l'IA a produit,
> et surtout **ce que vous avez corrigé ou rejeté**. C'est le recul critique qui est noté,
> pas le nombre de prompts.
