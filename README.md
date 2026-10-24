# Ménage PC

Un explorateur de fichiers pensé pour faire le tri : il montre ce qui prend de la place et
aide à supprimer l'inutile sans risque.

**Stack** : Node.js sans dépendance (serveur local, `app/server.js`), interface en HTML, CSS et JavaScript
sans framework (`app/public/`), ouverte dans Edge en mode application. Fonctionne sous Windows.

## Lancer

Double-clic sur **`Lancer Menage PC.bat`**. Une fenêtre s'ouvre (Edge, en mode application) ;
une petite console « Menage PC » se range dans la barre des tâches : c'est le moteur.
Pour arrêter : bouton **Quitter** en bas à gauche, ou fermer cette console. Il s'arrête aussi
tout seul 5 minutes après la fermeture de la fenêtre.

## Explorer

- Chaque dossier affiche **sa taille réelle** (calculée en arrière-plan) et **sa part du dossier
  en %**. Tri par taille par défaut : ce qui pèse lourd est en haut.
- Le panneau de droite montre un **aperçu** (images, vidéos, musique, PDF, texte) et, sans
  sélection, **ce qui prend le plus de place** dans le dossier.
- La barre de recherche filtre le dossier ; **Entrée** cherche aussi dans tous les
  sous-dossiers (jokers acceptés : `*.mp4`, `facture*`).
- Clic droit : ouvrir, afficher dans l'Explorateur Windows, copier le chemin, renommer,
  supprimer.

## Nettoyage

Clique sur **Lancer l'analyse** (environ une minute). Les résultats sont rangés par catégorie :
temporaires, caches d'applis, vieux installateurs, `node_modules` et builds, gros fichiers,
doublons, dossiers vides. Seul ce qui est **sans risque** est coché d'office ; le reste, tu
choisis. Coche, puis **Mettre à la corbeille**.

## Ce qui te protège

- **Tout passe par la corbeille** par défaut : une erreur se rattrape. La suppression
  définitive est une option à cocher exprès.
- La place n'est **réellement libérée qu'une fois la corbeille vidée** (bouton « Vider » à
  gauche).
- 🔒 **Cadenas** : élément protégé (Windows, racine des disques, tes dossiers Bureau/Documents
  eux-mêmes…) : impossible à supprimer ici.
- ⚠️ **Triangle** : dans un dossier de programmes (Program Files, AppData…) : il faut cocher
  « Je sais ce que je fais ». Pour enlever un logiciel, passe par « Désinstaller des
  applications ».
- ☁️ Ce qui est dans **OneDrive** disparaît aussi du cloud (récupérable 30 jours dans la
  corbeille OneDrive en ligne).

## Raccourcis

| Touche | Action |
|---|---|
| `Entrée` / double-clic | ouvrir |
| `Retour arrière` | dossier parent |
| `Alt+←` / `Alt+→` | précédent / suivant |
| `Suppr` | corbeille · `Maj+Suppr` : définitif (avec confirmation) |
| `F2` | renommer |
| `Ctrl+F` | filtrer / chercher |
| `Ctrl+L` | taper un chemin (accepte `%TEMP%`, `%APPDATA%`…) |
| `Ctrl+A` · `Espace` | tout sélectionner · cocher |
| `F5` | recalculer les tailles |
