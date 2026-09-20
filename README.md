# cracked.fun

Hub d’expériences web inspiré par [neal.fun](https://neal.fun/) : jeux, outils, mini-sites interactifs et idées bizarres publiables très simplement.

**CRACK-MAN** est le premier jeu. L’accueil n’affiche que les expériences qui existent vraiment.

## Jouer en local

Dans ce dossier :

```bash
npx --yes serve .
```

Puis ouvre l’URL affichée (souvent `http://localhost:3000`).

## Ajouter une expérience

Deux gestes, rien d’autre :

1. Duplique `games/_modele` → `games/mon-slug`
2. Ajoute une entrée dans `catalog.js` :

```js
{
  slug: "mon-slug",
  title: "Mon jeu",
  type: "jeu",
  blurb: "Une phrase.",
},
```

Le bandeau de l’accueil lit `games/mon-slug/thumb.svg` (sinon `thumb.png` / `thumb.jpg`).

Chaque expérience est une page indépendante : son HTML, son CSS, son JS. Un lien `← cracked.fun` (via `shared.css`) suffit pour revenir à l’accueil.

## CRACK-MAN

Labyrinthe façon Pac-Man : ton visage en héros (**le S**), tes potes en monstres. La photo du S se coupe en deux à la bouche.

Photos : voir `games/crack-man/faces/README.md`. Tant qu’il n’y a pas de fichiers, le jeu utilise des têtes bidon.

Contrôles : flèches ou WASD, swipe ou pad sur téléphone. Super pastilles → les fantômes bleuis se mangent.

## Mettre en ligne

1. Pousse ce dossier sur GitHub.
2. **Settings** → **Pages** → Source : **Deploy from a branch** → `main` / `/ (root)`.
3. Le hub est à `https://<toi>.github.io/<nom-du-repo>/`, Crack-Man à `…/games/crack-man/`.

Autre option sans Git : glisse le dossier sur [https://app.netlify.com/drop](https://app.netlify.com/drop).
