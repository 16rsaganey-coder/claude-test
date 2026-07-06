const { TeamsActivityHandler, CardFactory, TurnContext } = require('botbuilder');
const storage = require('./storage');
const top3Card = require('./cards/top3Card.json');

class Top3Bot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMembersAdded(async (context, next) => {
      for (const member of context.activity.membersAdded) {
        if (member.id === context.activity.recipient.id) continue;
        storage.saveConversationReference(member.id, TurnContext.getConversationReference(context.activity));
        await context.sendActivity(
          "Hi! Every Monday I'll ask for your Top 3 for the week, and I'll " +
          "compile everyone's answers into a digest for the CIO on Friday. " +
          "Type `top3` any time to fill it in early."
        );
      }
      await next();
    });

    this.onMessage(async (context, next) => {
      // Keep this reference fresh so we can proactively message this user later.
      storage.saveConversationReference(context.activity.from.id, TurnContext.getConversationReference(context.activity));

      if (context.activity.value && context.activity.value.action === 'submitTop3') {
        await this._handleSubmission(context, context.activity.value);
      } else if ((context.activity.text || '').trim().toLowerCase() === 'top3') {
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(top3Card)] });
      }

      await next();
    });
  }

  async _handleSubmission(context, data) {
    const userId = context.activity.from.id;
    const userName = context.activity.from.name || 'Unknown';
    storage.saveSubmission(userId, userName, data);
    await context.sendActivity('Got it — thanks! See you next Monday.');
  }

  async sendWeeklyCard(adapter, botAppId) {
    const references = storage.getConversationReferences();
    for (const userId of Object.keys(references)) {
      const reference = references[userId];
      await adapter.continueConversationAsync(botAppId, reference, async (turnContext) => {
        await turnContext.sendActivity({ attachments: [CardFactory.adaptiveCard(top3Card)] });
      });
    }
  }
}

module.exports.Top3Bot = Top3Bot;
