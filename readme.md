# 🏠 Mes Bonnes Adresses

### Application mobile et web pour sauvegarder et partager vos adresses favorites

---

## 📖 À propos

**Mes Bonnes Adresses** est une application mobile (et web) développée avec **React Native / Expo** et **Firebase**.  
Elle permet aux utilisateurs de sauvegarder, gérer et partager leurs adresses favorites avec photos, avis, et carte interactive.

> L'ensemble des instructions mis dans ce fichier est fonction du système d'exploitation windows
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

| Domaine                 | Outil / Technologie                                 |
|:------------------------|:----------------------------------------------------|
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


---

## 📁 Structure du projet
```
bonneAdresses-main/
│
├── frontend/
│   ├──_test_ # Tests unitaires
│   │   ├── Auth.test.js  
│   │   ├── AddressesList.test.js
│   │   └── CreateAddress.test.js
│   ├──maestro # Tests e2e
│   │   ├── login.yaml  
│   │   ├── signup.yaml
│   │   ├── public-addresses.yaml
│   │   └── create-addresses.yaml
│   ├── App.js                      
│   ├── app.json
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── assets/                
│   ├── navigation/            
│   ├── screens/            
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
- **un appareil mobile avec Android ou IOS**
- **Crucial: ** **Firebase project** configuré avec :
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
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=CLE_API_GOOGLE_MAPS_API_KEY_ANDROID
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=CLE_API_GOOGLE_MAPS_API_KEY_IOS
```

### 5️⃣ Lancer le projet

#### 📱 Mobile (Android / iOS)
```bash
npx expo start --tunnel 
ou
npx expo start -c --tunnel
```

> Puis scanner le QR Code avec l'application **Expo Go**. si vous recevez une erreur de CommandError: ngrok tunnel took too long to connect. veuillez relancez la commande precedente.

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

---
## Test de l'application

### Test Unitaire et fonctionnel

Pour lancer les tests rendez vous dans le dossier frontend et lancez:

```bash
npm test
```

## Tests e2E
### Étape 1 : Lancer l'Émulateur Android
### Option A : Via Android Studio 

```
1. Ouvrez Android Studio
2. Cliquez sur "More Actions" > "Virtual Device Manager"
3. Si vous n'avez pas d'émulateur :
   - Cliquez sur "Create Device"
   - Sélectionnez "Pixel 5" ou "Pixel 6"
   - Sélectionnez "API 33" ou "API 34" (Android 13/14)
   - Cliquez sur "Finish"
4. Cliquez sur le bouton Play pour lancer l'émulateur
5. Attendez que l'émulateur démarre complètement (1-2 minutes)
```

### Option B : Via Ligne de Commande

```bash
# Lister les émulateurs disponibles
emulator -list-avds

# Lancer un émulateur (remplacez Pixel_5_API_33 par votre nom d'émulateur)
emulator -avd Pixel_5_API_33
```

### Vérifier que l'émulateur est connecté

```bash
adb devices

# Devrait afficher quelque chose comme :
# List of devices attached
# emulator-5554    device
```

### Étape 2 : Récupérer les Clés Google Maps API

### A. Accéder à Google Cloud Console

1. Allez sur : **https://console.cloud.google.com/**
2. Connectez-vous avec votre compte Google
3. Cliquez sur le menu projet en haut → **"NOUVEAU PROJET"**
4. Nom : **"Mes Bonnes Adresses"**
5. Cliquez sur **"CRÉER"**
6. Attendez quelques secondes puis sélectionnez votre projet

### B. Activer l'API Maps SDK for Android

```
1. Menu latéral : "APIs et services" → "Bibliothèque"
2. Recherchez : "Maps SDK for Android"
3. Cliquez dessus
4. Cliquez sur "ACTIVER"
5. Attendez quelques secondes
```

### C. Créer une Clé API

```
1. Menu latéral : "APIs et services" → "Identifiants"
2. En haut : "+ CRÉER DES IDENTIFIANTS" → "Clé API"
3. Une clé est générée
4. Copiez votre clé API : AIzaSyXXXXXXXXXXXXXXXXXXXX
```
### Étape 3 : Prebuild de l'Application

Cette étape génère les fichiers natifs Android avec votre configuration Google Maps.

```bash
# 1. Nettoyer les anciens fichiers
rm -rf node_modules
npm install

# 2. Prebuild (génère le dossier android/ avec la config)
npx expo prebuild --clean
```

**Sur Windows**, remplacez `rm -rf` par `rmdir /s /q` :

```bash
rmdir /s /q node_modules
npm install
npx expo prebuild --clean
```
### Étape 4 : Lancer l'Application

```bash
# Build et lancer l'app sur l'émulateur
npx expo run:android
puis 
Appuyer sur "a"
```

### Étape 5 : Lancer les Tests
```bash
# Sur Windows (PowerShell)
maestro test .\maestro\signup.yaml ou maestro test .\maestro\login.yaml
```
