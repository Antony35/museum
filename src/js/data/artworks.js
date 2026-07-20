/**
 * Catalogue du musée.
 *
 * C'est la SEULE source de vérité : la 3D y lit position/taille, la modale y lit le texte.
 * Ajouter une œuvre = ajouter un objet ici, rien d'autre à toucher.
 *
 * Champs :
 *   id        identifiant unique (sert aussi de graine pour la toile procédurale)
 *   title, artist, year, technique, room, description
 *   width/height  dimensions du tableau en mètres
 *   position  {x, y, z} centre du tableau, en mètres, dans le repère du musée
 *   rotationY rotation autour de l'axe vertical (0 = le tableau regarde vers +Z)
 *   palette   couleurs de la toile générée
 *   style     'bands' | 'circles' | 'grid' | 'strokes'
 *   image     (optionnel) chemin vers une vraie image, ex : 'artworks/nuit-etoilee.jpg'
 *             → si présent, elle remplace la toile procédurale.
 */

const EYE = 1.75;   // hauteur des yeux : on centre les tableaux dessus, comme dans un vrai musée

export const artworks = [

  // ---- Mur nord (z = -7), les tableaux regardent vers +Z --------------------
  {
    id: 'aube-mineral',
    title: 'Aube minérale',
    artist: 'Hélène Vasseur',
    year: 1962,
    technique: 'Huile sur toile',
    room: 'Salle 1 — Couleur & Silence',
    width: 1.6, height: 2.1,
    position: {x: -6.5, y: EYE, z: -6.9}, rotationY: 0,
    palette: ['#1d2b3a', '#e0a25e', '#c25b3a', '#f2e4cf'],
    style: 'bands',
    description: `Peinte au retour d'un séjour dans les Alpes, cette toile marque le basculement de Vasseur vers l'abstraction. Les strates de couleur ne représentent plus la montagne : elles en rejouent la stratification géologique. L'artiste disait chercher « le moment exact où la lumière décide de la forme ».`,
  },
  {
    id: 'contre-jour',
    title: 'Contre-jour n°4',
    artist: 'Marek Sadowski',
    year: 1971,
    technique: 'Acrylique et sable sur toile',
    room: 'Salle 1 — Couleur & Silence',
    width: 2.0, height: 1.5, ratio: 1.33,
    position: {x: -2.2, y: EYE, z: -6.9}, rotationY: 0,
    palette: ['#0f1417', '#4a6b7c', '#d9d2c5', '#8fa9a0'],
    style: 'strokes',
    description: `Quatrième d'une série de neuf, cette œuvre pousse à l'extrême le principe du contre-jour : la source lumineuse est hors champ, et seule sa conséquence est peinte. Le sable mélangé à l'acrylique accroche la lumière réelle de la salle — l'œuvre change donc d'aspect selon l'heure de votre visite.`,
  },
  {
    id: 'jardin-clos',
    title: 'Le Jardin clos',
    artist: 'Ana Ferreira',
    year: 1958,
    technique: 'Tempera sur bois',
    room: 'Salle 1 — Couleur & Silence',
    width: 1.4, height: 1.8,
    position: {x: 2.2, y: EYE, z: -6.9}, rotationY: 0,
    palette: ['#20301f', '#6c8f4a', '#c8d68a', '#e8dcae'],
    style: 'circles',
    description: `Ferreira a peint ce panneau dans l'arrière-cour de son atelier de Porto, sur un fragment de porte récupéré. Le motif circulaire répété évoque autant les frondaisons que les azulejos des façades voisines. C'est l'une des rares œuvres où elle a signé au dos, à la mine de plomb.`,
  },
  {
    id: 'partition-silencieuse',
    title: 'Partition silencieuse',
    artist: 'Yuki Tanabe',
    year: 1984,
    technique: 'Encre et pigments sur papier marouflé',
    room: 'Salle 1 — Couleur & Silence',
    width: 1.5, height: 2.0,
    position: {x: 6.5, y: EYE, z: -6.9}, rotationY: 0,
    palette: ['#f4f1ea', '#1b1b1b', '#8c8378', '#c9452f'],
    style: 'grid',
    description: `Tanabe composait ses grilles comme des portées musicales : chaque case correspond à une durée, chaque couleur à une intensité. La partition est jouable — elle l'a été une fois, en 1987, par un quatuor à cordes devant la toile elle-même.`,
  },

  // ---- Mur ouest (x = -10), les tableaux regardent vers +X ------------------
  {
    id: 'derive-lente',
    title: 'Dérive lente',
    artist: 'Marek Sadowski',
    year: 1976,
    technique: 'Acrylique sur toile',
    room: 'Salle 1 — Couleur & Silence',
    width: 1.8, height: 1.4, ratio: 1.29,
    position: {x: -9.85, y: EYE, z: -3.5}, rotationY: Math.PI / 2,
    palette: ['#13202b', '#2f5d62', '#a3c9a8', '#f0efe2'],
    style: 'strokes',
    description: `Le titre fait référence à la dérive des continents, dont Sadowski s'est passionné après avoir lu un article de vulgarisation. Les masses colorées s'éloignent les unes des autres selon un rythme qu'il a calculé, prétend-il, « à l'échelle d'un million d'années par centimètre ».`,
  },
  {
    id: 'tessons',
    title: 'Tessons',
    artist: 'Ana Ferreira',
    year: 1965,
    technique: 'Huile et collage',
    room: 'Salle 1 — Couleur & Silence',
    width: 1.3, height: 1.7,
    position: {x: -9.85, y: EYE, z: 3.5}, rotationY: Math.PI / 2,
    palette: ['#2b1d1a', '#a8452c', '#d9a441', '#efe6d3'],
    style: 'grid',
    description: `Composée à partir de fragments de céramique brisée collés puis recouverts de glacis, cette œuvre inaugure la période dite « des débris ». Ferreira ramassait ses matériaux dans les décharges de la ville basse, et refusait d'en acheter.`,
  },

  // ---- Mur est (x = +10), les tableaux regardent vers -X --------------------
  {
    id: 'horizon-inverse',
    title: 'Horizon inversé',
    artist: 'Hélène Vasseur',
    year: 1969,
    technique: 'Huile sur toile',
    room: 'Salle 1 — Couleur & Silence',
    width: 2.2, height: 1.5, ratio: 1.47,
    position: {x: 9.85, y: EYE, z: -3.5}, rotationY: -Math.PI / 2,
    palette: ['#e9dcc3', '#c2703d', '#3d4a58', '#12161c'],
    style: 'bands',
    description: `Vasseur retourne ici sa propre grammaire : le ciel occupe le bas de la toile, la terre le haut. Elle exigeait que l'œuvre soit accrochée à 1,75 m du sol exactement, « pour que le vertige tombe au niveau du regard ».`,
  },
  {
    id: 'nocturne',
    title: 'Nocturne (sans titre)',
    artist: 'Yuki Tanabe',
    year: 1991,
    technique: 'Pigments minéraux sur papier',
    room: 'Salle 1 — Couleur & Silence',
    width: 1.4, height: 1.9,
    position: {x: 9.85, y: EYE, z: 3.5}, rotationY: -Math.PI / 2,
    palette: ['#080b12', '#1f3557', '#4d6fa8', '#cbd8ef'],
    style: 'circles',
    description: `Dernière œuvre de la série des Nocturnes, réalisée avec des pigments de lapis-lazuli broyés à la main. Tanabe travaillait exclusivement de nuit, à la lumière d'une seule bougie, pour ne juger les valeurs qu'en lumière faible.`,
  },

  // ---- Cloison centrale, face sud (regarde vers +Z) -------------------------
  {
    id: 'seuil',
    title: 'Seuil',
    artist: 'Hélène Vasseur',
    year: 1974,
    technique: 'Huile sur toile',
    width: 1.5, height: 2.0,
    room: 'Cimaise centrale',
    position: {x: -2.6, y: EYE, z: 0.36}, rotationY: 0,
    palette: ['#f5efe3', '#b8482f', '#2a2a28', '#d8a35b'],
    style: 'bands',
    description: `Une porte réduite à sa fonction : une ligne qui sépare. Vasseur a peint cette toile pendant l'aménagement de son second atelier, en regardant les ouvriers percer un mur porteur.`,
  },
  {
    id: 'foule',
    title: 'Foule, un mardi',
    artist: 'Marek Sadowski',
    year: 1988,
    technique: 'Acrylique sur toile',
    width: 2.0, height: 1.4, ratio: 1.43,
    room: 'Cimaise centrale',
    position: {x: 2.6, y: EYE, z: 0.36}, rotationY: 0,
    palette: ['#20232a', '#e5533d', '#f4c95d', '#8bb3c9'],
    style: 'circles',
    description: `Chaque tache correspond à une personne comptée par l'artiste depuis la fenêtre d'un café, entre 12 h et 13 h, un mardi de mars. Le tableau est donc un relevé statistique autant qu'une peinture.`,
  },

  // ---- Cloison centrale, face nord (regarde vers -Z) ------------------------
  {
    id: 'mur-blanc',
    title: 'Mur blanc',
    artist: 'Ana Ferreira',
    year: 1979,
    technique: 'Plâtre et huile sur toile',
    width: 1.6, height: 1.6, ratio: 1,
    room: 'Cimaise centrale',
    position: {x: -2.6, y: EYE, z: -0.36}, rotationY: Math.PI,
    palette: ['#efece4', '#d8d2c4', '#b7ae9c', '#3f3a33'],
    style: 'grid',
    description: `Presque monochrome, l'œuvre se donne à voir uniquement en lumière rasante. Le musée a fait installer un éclairage latéral spécifique : approchez-vous, puis déplacez-vous lentement de gauche à droite.`,
  },
  {
    id: 'chant-grave',
    title: 'Chant grave',
    artist: 'Yuki Tanabe',
    year: 1996,
    technique: 'Encre sur papier marouflé',
    width: 1.5, height: 1.9,
    room: 'Cimaise centrale',
    position: {x: 2.6, y: EYE, z: -0.36}, rotationY: Math.PI,
    palette: ['#101010', '#3a3a3a', '#7d7468', '#e6e0d4'],
    style: 'strokes',
    description: `Réalisée en une seule séance de quarante minutes, sans reprise. Tanabe considérait le geste comme irréversible : « un trait raté reste dans l'œuvre, comme une fausse note reste dans le concert ».`,
  },

  // ---- Mur sud (z = +7), les tableaux regardent vers -Z ---------------------
  {
    id: 'retour',
    title: 'Retour au port',
    artist: 'Ana Ferreira',
    year: 1953,
    technique: 'Huile sur toile',
    width: 2.1, height: 1.4, ratio: 1.5,
    room: 'Salle 1 — Couleur & Silence',
    position: {x: -6.5, y: EYE, z: 6.9}, rotationY: Math.PI,
    palette: ['#16242e', '#3f7a8c', '#d8c9a3', '#bf5b3a'],
    style: 'bands',
    description: `Œuvre de jeunesse, encore figurative dans son intention. Ferreira l'a conservée toute sa vie dans sa cuisine et a toujours refusé de la vendre ; elle est entrée dans les collections par legs en 2004.`,
  },
  {
    id: 'derniere-salle',
    title: 'La Dernière Salle',
    artist: 'Hélène Vasseur',
    year: 1993,
    technique: 'Huile et cire sur toile',
    width: 1.7, height: 2.2,
    room: 'Salle 1 — Couleur & Silence',
    position: {x: 6.5, y: EYE, z: 6.9}, rotationY: Math.PI,
    palette: ['#0e0e10', '#5a4a6b', '#c07c9c', '#f0e7ea'],
    style: 'circles',
    description: `Ultime toile de Vasseur, achevée deux mois avant sa mort. Elle avait demandé qu'elle soit accrochée « près de la sortie, pour qu'on la voie en partant, pas en arrivant ».`,
  },
];

/** Index id → œuvre, pour retrouver une fiche en O(1) depuis le raycaster. */
export const artworksById = new Map(artworks.map((a) => [a.id, a]));
