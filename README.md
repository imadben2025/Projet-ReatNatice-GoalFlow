# ⚽ GoalFlow - Application Mobile Football

Salut ! Bienvenue sur **GoalFlow**, cette une application mobile de football qu on a développée dans le cadre de mon projet universitaire. C'est une app React Native qui te permet de suivre les matchs en direct, consulter les actualités foot, et personnaliser ton expérience avec ton équipe préférée.

##  Pourquoi cette app ?

Franchement, nous en avions marre de jongler entre plusieurs applications pour suivre le football. Nous voulions quelque chose de simple : voir les scores en direct, lire les actualités et recevoir des notifications pour notre équipe favorite. Voilà, c’est tout. Pas besoin de fonctionnalités compliquées.

##  Ce que tu peux faire avec

###  Matchs en Direct
- Voir tous les matchs qui se jouent en temps réel
- Suivre les scores qui se mettent à jour automatiquement
- Ajouter tes matchs préférés pour les retrouver facilement
- Recevoir des notifications 15 minutes avant le coup d'envoi

###  Actualités Football
- Lire les dernières news du monde du foot
- Filtrer par équipe ou compétition
- Articles mis à jour régulièrement

###  Profil Personnalisé
- Créer ton compte avec prénom, nom, date de naissance
- Choisir ton équipe préférée
- Recevoir les actualités de ton équipe toutes les 3 heures
- Modifier tes infos quand tu veux
- Thème clair/sombre selon tes préférences
- Interface en français ou anglais

###  Notifications Intelligentes
- Alertes avant les matchs de tes favoris
- News de ton équipe préférée
- Tout ça sans te spammer !

##  Installation (si tu veux tester)

### Prérequis
Tu vas avoir besoin de :
- **Node.js** (version 18 minimum) - pour faire tourner l'app
- **Expo CLI** - pour le développement React Native
- **Un compte Firebase** - pour la base de données (c'est gratuit, t'inquiète)

### Étapes d'installation

1. **Clone le projet**
   ```bash
   git clone https://github.com/ton-username/goalflow.git
   cd goalflow/Goalflow
   ```

2. **Installe les dépendances**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Va sur [Firebase Console](https://console.firebase.google.com)
   - Crée un nouveau projet (ou utilise un existant)
   - Active **Authentication** (Email/Password et Anonyme)
   - Active **Firestore Database**
   - Copie ta config Firebase dans `firebaseConfig.js`

4. **Lance l'app**
   ```bash
   npm start
   ```

Et voilà ! Scanne le QR code avec Expo Go sur ton téléphone.

##  Technologies utilisées

J'ai utilisé des trucs assez standards pour React Native :

- **React Native** - Le framework principal
- **Expo** - Pour simplifier le développement
- **Firebase** - Pour l'authentification et la base de données
  - Authentication (email/password + mode invité)
  - Firestore (stockage des données utilisateur)
- **React Navigation** - Pour naviguer entre les écrans
- **Football Data API** - Pour les données des matchs
- **News API** - Pour les actualités foot

##  Structure du projet

Voici comment j'ai organisé le code (au cas où tu veux fouiller) :

```
Goalflow/
├── screens/           # Tous les écrans de l'app
│   ├── LoginScreen.js
│   ├── SignUpScreen.js
│   ├── LiveScreen.js
│   ├── MatchsScreen.js
│   ├── NewsScreen.js
│   ├── ProfilScreen.js
│   └── EditProfileScreen.js
├── services/          # Logique métier et appels API
│   ├── footballDataService.js
│   ├── newsService.js
│   ├── userService.js
│   └── notificationService.js
├── contexts/          # Gestion du thème et de la langue
│   ├── ThemeContext.js
│   └── LanguageContext.js
├── translations/      # Traductions FR/EN
│   ├── fr.js
│   └── en.js
└── firebaseConfig.js  # Config Firebase
```

##  Fonctionnalités cool

### Thème Clair/Sombre
L'app s'adapte automatiquement à tes préférences système, mais tu peux aussi forcer le mode que tu préfères. Perso, je suis team mode sombre 

### Multilingue
Interface disponible en français et anglais. Change la langue dans les paramètres, tout se met à jour instantanément.

### Mode Invité
Pas envie de créer un compte ? Pas de problème ! Tu peux utiliser l'app en mode invité pour voir les matchs et les news. Par contre, tu ne pourras pas sauvegarder tes favoris.


##  Gestion des données

### Ce qui est stocké dans Firestore :
- Informations de profil (prénom, nom, email, date de naissance)
- Équipe préférée
- Préférences de notifications
- Matchs favoris

### Ce qui n'est PAS stocké :
- Mots de passe (géré par Firebase Auth)
- Photos (pas besoin de Firebase Storage = solution 100% gratuite !)

##  Note importante sur Firebase

L'app utilise uniquement les services **gratuits** de Firebase :
- ✅ Authentication - Gratuit pour un usage raisonnable
- ✅ Firestore - 50k lectures/jour gratuites (largement suffisant)


Si tu dépasses les quotas gratuits un jour... félicitations, ton app a du succès ! 

##  Problèmes connus

Quelques trucs qui pourraient être améliorés :
- Les scores ne se mettent pas à jour en arrière-plan (limitation d'Expo)
- Parfois, il faut rafraîchir manuellement les news
- L'historique des matchs est limité aux 30 derniers jours

Rien de bloquant, mais si tu veux contribuer, go !

##  Améliorations futures

Des idées pour la suite :
- [ ] Système de prédictions de matchs
- [ ] Chat entre supporters
- [ ] Statistiques détaillées des joueurs
- [ ] Widget iOS/Android
- [ ] Mode hors-ligne avec cache

##  Contribution

C'est un projet étudiant, mais si tu veux contribuer :
1. Fork le projet
2. Crée une branche (`git checkout -b feature/super-fonctionnalite`)
3. Commit tes changements (`git commit -m 'Ajout de...'`)
4. Push (`git push origin feature/super-fonctionnalite`)
5. Ouvre une Pull Request


##  Auteur

**Imad Eddine**
**Ahmed Benebbou**
**Mohamed Faris**

##  Remerciements

Un grand merci à :
- Mes profs qui m'ont aidé à debugger quand je galérais
- La communauté React Native qui est super active
- Football-Data.org pour leur API gratuite


---

**Note** : Cette app a été développée dans un but éducatif. Les données des matchs proviennent d'APIs tierces et peuvent ne pas être 100% à jour.

Si tu trouves des bugs ou si tu as des suggestions, n'hésite pas à ouvrir une issue ! 

Bon match ! ⚽🔥
