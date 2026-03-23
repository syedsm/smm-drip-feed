// /tmp/dropIndex.js
const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/Sayyed Masud/.gemini/antigravity/scratch/smm-drip-feed/backend/.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('deliverylogs');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Find and drop the unique order_1_tick_1 index
    const targetIndex = indexes.find(idx => idx.name === 'order_1_tick_1');
    if (targetIndex) {
      await collection.dropIndex('order_1_tick_1');
      console.log('Successfully dropped index order_1_tick_1');
    } else {
      console.log('Index order_1_tick_1 not found');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
