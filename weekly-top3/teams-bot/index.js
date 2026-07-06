require('dotenv').config();
const restify = require('restify');
const cron = require('node-cron');
const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const { Top3Bot } = require('./bot');
const { sendWeeklyDigest } = require('./digest');

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({
  MicrosoftAppId: process.env.BOT_APP_ID,
  MicrosoftAppPassword: process.env.BOT_APP_PASSWORD,
  MicrosoftAppType: 'MultiTenant'
});
const adapter = new CloudAdapter(botFrameworkAuthentication);
const bot = new Top3Bot();

adapter.onTurnError = async (context, error) => {
  console.error('Unhandled bot error:', error);
  await context.sendActivity('Something went wrong processing that.');
};

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, (context) => bot.run(context));
});

server.listen(process.env.PORT || 3978, () => {
  console.log(`Weekly Top 3 bot listening on port ${process.env.PORT || 3978}`);
});

// Monday 9am — proactively ask everyone for their Top 3.
cron.schedule(process.env.REMINDER_CRON || '0 9 * * 1', async () => {
  console.log('Sending weekly Top 3 cards...');
  try {
    await bot.sendWeeklyCard(adapter, process.env.BOT_APP_ID);
  } catch (err) {
    console.error('Failed to send weekly cards:', err);
  }
});

// Friday 8am — compile the digest and email the CIO.
cron.schedule(process.env.DIGEST_CRON || '0 8 * * 5', async () => {
  console.log('Sending weekly digest...');
  try {
    await sendWeeklyDigest();
  } catch (err) {
    console.error('Failed to send digest:', err);
  }
});
