const Agenda = require('agenda');
require('dotenv').config();

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI, collection: 'agendaJobs' },
  processEvery: '1 minute',
});

// Import job definitions
const defineDecisionMaker = require('../jobs/decisionMaker');
const defineDripDelivery = require('../jobs/dripDelivery');

// This function defines the jobs but does NOT start the worker
const defineJobs = (io = null) => {
  defineDecisionMaker(agenda);
  defineDripDelivery(agenda, io);
  console.log('[Agenda] Jobs defined');
};

const startAgenda = async (io = null) => {
  defineJobs(io);

  await agenda.start();
  console.log('[Agenda] Started successfully (processing jobs)');

  // Schedule the decision maker job if not already scheduled
  await agenda.every('1 minute', 'check-drip');
};

module.exports = { agenda, defineJobs, startAgenda };
