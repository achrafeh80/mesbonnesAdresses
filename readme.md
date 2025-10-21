# 🏠 Mes Bonnes Adresses

### Application mobile et web pour sauvegarder et partager vos adresses favorites

---

## 📖 À propos

**Mes Bonnes Adresses** est une application mobile (et web) développée avec **React Native / Expo** et **Firebase**.  
Elle permet aux utilisateurs de sauvegarder, gérer et partager leurs adresses favorites avec photos, avis, et carte interactive.

---

## ✨ Fonctionnalités principales

### 🔐 Authentification Firebase

- Inscription / Connexion / Déconnexion avec Firebase Auth
- Réinitialisation de mot de passe par email
- Gestion du profil : nom d'affichage, photo d'avatar
- Mise à jour automatique du profil utilisateur connecté

### 📍 Adresses & Cartes

**Création d'une adresse :**

- Nom, description, image et position GPS
- Sélecteur "Publique / Privée" via un interrupteur (Switch)
- Localisation automatique ou sélection manuelle sur la carte
- Carte interactive (MapView mobile / Leaflet web)

**Visualisation des adresses sur la carte :**

- ✅ Adresses de l'utilisateur → marqueurs **verts**
- 🌍 Adresses publiques des autres → marqueurs **bleus**
- 📍 Position actuelle → marqueur **rouge**
- Affichage des coordonnées et de la position sur carte dynamique

### 🖼️ Galerie & Photos

- Ajout de photos pour chaque adresse via la galerie locale
- Upload des images vers **Firebase Storage**
- Prévisualisation avant envoi
- Possibilité de supprimer l'image sélectionnée avant upload
- Toutes les images d'une adresse sont affichées dans le détail

### ⭐ Notes et commentaires

- Système de **notation par étoiles (1 à 5)**
- Moyenne des notes calculée et affichée dynamiquement
- Commentaires textuels avec date, auteur et photo facultative
- Seul l'auteur d'un commentaire peut le supprimer
- Tous les commentaires sont stockés dans Firestore

### 🧭 Carte (MapScreen)

- Par défaut centrée sur la position actuelle de l'utilisateur
- Marqueur rouge = position de l'utilisateur
- Marqueurs verts = ses propres adresses
- Marqueurs bleus = adresses publiques d'autres utilisateurs
- Interface épurée, fluide et responsive

### 👤 Profil utilisateur

- Affichage des informations Firebase (nom, email, avatar)
- Possibilité de modifier le nom et l'avatar
- Bouton de déconnexion fonctionnel
- Bouton d'inscription visible uniquement si aucun utilisateur n'est connecté

---

## 🛠️ Technologies utilisées

<div align="center">

| Domaine                 | Outil / Technologie                                 |
| :---------------------- | :-------------------------------------------------- |
| **Frontend**            | React Native (Expo)                                 |
| **Base de données**     | Firebase Firestore                                  |
| **Stockage**            | Firebase Storage                                    |
| **Authentification**    | Firebase Auth                                       |
| **Cartographie mobile** | React Native Maps                                   |
| **Cartographie web**    | React Leaflet + OpenStreetMap                       |
| **Langage**             | JavaScript (ES6)                                    |
| **Gestion des images**  | Expo ImagePicker                                    |
| **Localisation GPS**    | Expo Location                                       |
| **UI**                  | StyleSheet React Native, design épuré et responsive |

</div>

---

## 📁 Structure du projet

```
bonneAdresses-main/
│
├── frontend/                   # Application mobile & web
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── assets/                # Images, icônes, splash
│   ├── navigation/            # Navigation par stack/tab
│   ├── screens/               # Pages principales
│   │   ├── LoginScreen.js
│   │   ├── SignupScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── CreateAddressScreen.js
│   │   ├── AddressDetailScreen.js
│   │   ├── MyAddressesScreen.js
│   │   ├── PublicAddressesScreen.js
│   │   ├── MapScreen.js
│   ├── utils/
│       └── firebase.js        # Configuration Firebase
└── README.md                  # Documentation complète
```

---

## 🚀 Installation & exécution

### 1️⃣ Prérequis

- **Node.js 20+**
- **Expo CLI**
- **Firebase project** configuré avec :
  - Firestore
  - Auth (Email/Password)
  - Storage

### 2️⃣ Cloner le projet

```bash
git clone https://github.com/achrafeh80/mesbonnesAdresses.git
cd mesbonnesAdresses/frontend
```

### 3️⃣ Installer les dépendances

```bash
npm install
```

### 4️⃣ Configurer Firebase

Créer un fichier `.env` dans le dossier`/frontend/` :

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=FIREBASE_API_KEY_EXAMPLE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=PROJECT_ID.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=PROJECT_ID_EXAMPLE
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=PROJECT_ID_EXAMPLE.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=MESSAGE_SENDER_ID_EXAMPLE
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456_EXAMPLE
```

### 5️⃣ Lancer le projet

#### 📱 Mobile (Android / iOS)

```bash
npx expo start
```

> Puis scanner le QR Code avec l'application **Expo Go**.

#### 🌐 Web

```bash
npx expo start --web
```

---

## 📦 Déploiement

### Expo Build

```bash
npx expo build:android
npx expo build:ios
```

### Web (hébergement Firebase Hosting)

```bash
npm run build
firebase deploy
```

## Test de l'application

### Test Unitaire et fonctionnel

Dans le soucis de fournir une solution de qualité nous avons implémenter des tests pour nous assurer de la robutesses du livrable, pour ce faire nous avons utilisé Jest pour les tests unitaire et fonctionnels et detox pour les test e2e

```bash
npm test
```

### Tests e2E

```bash
# iOS
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Android
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

```

---
