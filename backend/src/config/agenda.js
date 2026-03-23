const Agenda = require('agenda');
require('dotenv').config();

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI, collection: 'agendaJobs' },
  processEvery: '1 minute',
});

// Import job definitions
const defineDecisionMaker = require('../jobs/decisionMaker');
const defineDripDelivery = require('../jobs/dripDelivery');

const startAgenda = async (io) => {
  // Pass socket.io instance to jobs that need it
  defineDecisionMaker(agenda);
  defineDripDelivery(agenda, io);

  await agenda.start();
  console.log('[Agenda] Started successfully');

  // Schedule the decision maker job
  await agenda.every('1 minute', 'check-drip');
};

module.exports = { agenda, startAgenda };
