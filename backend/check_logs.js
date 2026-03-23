const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://Syed:WnjFWnFePxbnzzKv@atlascluster.t71vqzg.mongodb.net/?appName=smmdripfeed";

const DeliveryLogSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  tick: Number,
  views: Number,
  likes: Number,
  viewsApiResponse: Object,
  likesApiResponse: Object,
  success: Boolean,
  errorMessage: String,
  deliveredAt: { type: Date, default: Date.now },
});

const DeliveryLog = mongoose.model('DeliveryLog', DeliveryLogSchema);

async function checkLogs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const orderId = '69bd7be3f45c0e3aa2c75a1a';
    const logs = await DeliveryLog.find({ order: orderId }).sort({ deliveredAt: -1 }).limit(5);

    console.log(`Found ${logs.length} logs for order ${orderId}`);
    logs.forEach(log => {
      console.log('--- Log Entry ---');
      console.log(`Time: ${log.deliveredAt}`);
      console.log(`Tick: ${log.tick}`);
      console.log(`Success: ${log.success}`);
      console.log(`Error Message: ${log.errorMessage}`);
      console.log(`Views Response:`, JSON.stringify(log.viewsApiResponse));
      console.log(`Likes Response:`, JSON.stringify(log.likesApiResponse));
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkLogs();
