const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection, setDoc, doc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDocs(collection(db, 'interruptions'));
    console.log('Total interruptions:', snap.size);
    snap.forEach(d => console.log(d.id, d.data().feederName));
    
    // Try a write
    const testId = 'test-' + Date.now();
    await setDoc(doc(db, 'interruptions', testId), {
      id: testId,
      feederName: 'Test Feeder',
      district: 'Team A',
      type: 'Earth Fault',
      status: 'Active',
      startTime: 'now',
      estimatedRestorationTime: 'N/A',
      affectedArea: 'None',
      remark: 'Test',
      lastUpdated: 'now'
    });
    console.log('Write successful!');
  } catch(e) {
    console.error('Firestore Error:', e);
  }
  process.exit();
}
test();
