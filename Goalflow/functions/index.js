/**
 * Firebase Cloud Functions pour les notifications de matchs
 * 
 * Installation:
 * npm install -g firebase-tools
 * firebase init functions
 * 
 * Déploiement:
 * firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Fonction Cron qui s'exécute toutes les 5 minutes
 * Envoie les notifications programmées dont l'heure est arrivée
 */
exports.sendScheduledNotifications = functions.pubsub
  .schedule('*/5 * * * *') // Toutes les 5 minutes
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('🔔 Vérification des notifications à envoyer...');
    
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 5 * 60 * 1000)
    );
    
    try {
      // Récupère les notifications à envoyer
      const snapshot = await admin.firestore()
        .collection('scheduled_notifications')
        .where('status', '==', 'pending')
        .where('notificationTime', '<=', now)
        .where('notificationTime', '>=', fiveMinutesAgo)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ Aucune notification à envoyer');
        return null;
      }
      
      console.log(`📬 ${snapshot.size} notification(s) à envoyer`);
      
      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        try {
          // Récupère le token FCM de l'utilisateur
          const userDoc = await admin.firestore()
            .collection('users')
            .doc(data.userId)
            .get();
          
          if (!userDoc.exists) {
            console.log(`❌ Utilisateur ${data.userId} introuvable`);
            await doc.ref.update({ status: 'failed', failedAt: now });
            return;
          }
          
          const userData = userDoc.data();
          const fcmToken = userData?.fcmToken;
          
          if (!fcmToken) {
            console.log(`❌ Token FCM manquant pour ${data.userId}`);
            await doc.ref.update({ status: 'failed', failedAt: now });
            return;
          }
          
          // Envoie la notification
          const message = {
            token: fcmToken,
            notification: {
              title: '⚽ Match dans 15 minutes !',
              body: `${data.homeTeam} vs ${data.awayTeam}`,
            },
            data: {
              matchId: String(data.matchId),
              type: 'match_start',
              screen: 'MatchDetails',
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'match_reminders',
                color: '#00FF87',
                icon: 'notification_icon',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'content-available': 1,
                },
              },
            },
          };
          
          await admin.messaging().send(message);
          console.log(`✅ Notification envoyée: ${data.homeTeam} vs ${data.awayTeam}`);
          
          // Marque comme envoyée
          await doc.ref.update({ 
            status: 'sent', 
            sentAt: now 
          });
        } catch (error) {
          console.error(`❌ Erreur envoi notification ${doc.id}:`, error);
          await doc.ref.update({ 
            status: 'failed', 
            failedAt: now,
            error: error.message 
          });
        }
      });
      
      await Promise.all(promises);
      console.log('✅ Traitement terminé');
      
      return null;
    } catch (error) {
      console.error('❌ Erreur globale:', error);
      return null;
    }
  });

/**
 * Fonction Cron qui s'exécute tous les jours à 2h du matin
 * Nettoie les notifications expirées (>24h après le match)
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * *') // 2h du matin tous les jours
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('🧹 Nettoyage des anciennes notifications...');
    
    const yesterday = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    try {
      // Supprime les notifications de matchs passés
      const snapshot = await admin.firestore()
        .collection('scheduled_notifications')
        .where('matchTime', '<', yesterday)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ Aucune notification à nettoyer');
        return null;
      }
      
      console.log(`🗑️ Suppression de ${snapshot.size} notification(s)`);
      
      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      console.log('✅ Nettoyage terminé');
      
      return null;
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      return null;
    }
  });

/**
 * Fonction Cron qui s'exécute tous les jours à 3h du matin
 * Nettoie les favoris expirés
 */
exports.cleanupExpiredFavorites = functions.pubsub
  .schedule('0 3 * * *') // 3h du matin tous les jours
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    console.log('🧹 Nettoyage des favoris expirés...');
    
    const now = admin.firestore.Timestamp.now();
    
    try {
      const snapshot = await admin.firestore()
        .collection('favorite_matches')
        .where('expiresAt', '<=', now)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ Aucun favori expiré');
        return null;
      }
      
      console.log(`🗑️ Suppression de ${snapshot.size} favori(s) expiré(s)`);
      
      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      console.log('✅ Nettoyage favoris terminé');
      
      return null;
    } catch (error) {
      console.error('❌ Erreur nettoyage favoris:', error);
      return null;
    }
  });

/**
 * Fonction déclenchée lors de la suppression d'un favori
 * Annule la notification Cloud associée
 */
exports.onFavoriteDeleted = functions.firestore
  .document('favorite_matches/{favoriteId}')
  .onDelete(async (snap, context) => {
    const data = snap.data();
    
    // Si c'était une notification Cloud, la supprimer
    if (data.notificationData && data.notificationData.type === 'cloud') {
      try {
        await admin.firestore()
          .collection('scheduled_notifications')
          .doc(data.notificationData.id)
          .delete();
        
        console.log(`✅ Notification Cloud ${data.notificationData.id} annulée`);
      } catch (error) {
        console.error('❌ Erreur annulation notification:', error);
      }
    }
    
    return null;
  });
