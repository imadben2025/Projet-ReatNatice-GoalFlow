/**
 * Script de test Firebase Storage
 * Exécuter avec : node testFirebaseStorage.js
 */

import { storage, auth } from './firebaseConfig.js';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

console.log('\n=== TEST FIREBASE STORAGE ===\n');

// Test 1 : Vérifier que Storage est initialisé
console.log('1️⃣ Test initialisation Storage...');
if (storage) {
  console.log('   ✅ Storage est initialisé');
  console.log('   📦 Bucket:', storage.app.options.storageBucket);
} else {
  console.log('   ❌ Storage n\'est PAS initialisé');
  process.exit(1);
}

// Test 2 : Vérifier la connexion
console.log('\n2️⃣ Test connexion Storage...');
try {
  const testRef = ref(storage, 'test/hello.txt');
  console.log('   ✅ Référence créée:', testRef.fullPath);
  
  // Tenter un upload test
  console.log('\n3️⃣ Test upload...');
  await uploadString(testRef, 'Hello from GOALFLOW!');
  console.log('   ✅ Upload réussi!');
  
  // Récupérer l'URL
  console.log('\n4️⃣ Test download URL...');
  const url = await getDownloadURL(testRef);
  console.log('   ✅ URL obtenue:', url);
  
  console.log('\n✅ ✅ ✅ TOUS LES TESTS RÉUSSIS! ✅ ✅ ✅');
  console.log('\nFirebase Storage est correctement configuré et fonctionnel.\n');
  
} catch (error) {
  console.log('   ❌ ERREUR:', error.message);
  console.log('\n📋 Code erreur:', error.code);
  
  if (error.code === 'storage/unauthorized') {
    console.log('\n🔧 SOLUTION:');
    console.log('   Les règles de sécurité bloquent l\'accès.');
    console.log('   Allez dans Firebase Console > Storage > Rules');
    console.log('   Et utilisez ces règles pour le développement:');
    console.log(`
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
    `);
  } else if (error.code === 'storage/unknown' || error.message?.includes('not initialized')) {
    console.log('\n🔧 SOLUTION:');
    console.log('   Firebase Storage n\'est pas activé!');
    console.log('\n   Étapes:');
    console.log('   1. Allez sur https://console.firebase.google.com');
    console.log('   2. Sélectionnez votre projet "goalflow-8597a"');
    console.log('   3. Menu latéral > "Storage"');
    console.log('   4. Cliquez sur "Get started" ou "Commencer"');
    console.log('   5. Suivez les étapes d\'activation');
  } else {
    console.log('\n🔧 Erreur inconnue. Vérifiez:');
    console.log('   - Connexion internet');
    console.log('   - Configuration Firebase dans firebaseConfig.js');
    console.log('   - Bucket Storage correct:', storage?.app?.options?.storageBucket);
  }
  
  console.log('\n');
  process.exit(1);
}
