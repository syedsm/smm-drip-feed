
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://Syed:WnjFWnFePxbnzzKv@atlascluster.t71vqzg.mongodb.net/?appName=smmdripfeed";

// Simple Schema definitions for the script
const PanelSchema = new mongoose.Schema({
  name: String,
  apiUrl: String,
  apiKey: String,
});
const Panel = mongoose.model('Panel', PanelSchema);

const OrderSchema = new mongoose.Schema({
  panel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel' },
  viewsServiceId: String,
  likesServiceId: String,
  status: String,
});
const Order = mongoose.model('Order', OrderSchema);

async function checkDetails() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const orderId = '69bd7be3f45c0e3aa2c75a1a';
    const order = await Order.findById(orderId).populate('panel');
    
    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('--- Order Details ---');
    console.log(`ID: ${order._id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Panel Name: ${order.panel?.name}`);
    console.log(`Panel URL: ${order.panel?.apiUrl}`);
    console.log(`Panel Key: ${order.panel?.apiKey}`);
    console.log(`Views Service ID: ${order.viewsServiceId}`);
    console.log(`Likes Service ID: ${order.likesServiceId}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkDetails();
