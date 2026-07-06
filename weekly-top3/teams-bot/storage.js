const fs = require('fs');
const path = require('path');

// Prototype storage: flat JSON file on disk.
// Swap this module out for Azure Table Storage / Cosmos DB before relying on
// it in production — a single JSON file has no concurrency safety.

const DATA_FILE = path.join(__dirname, 'data.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return { conversationReferences: {}, submissions: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function saveConversationReference(userId, reference) {
  const data = load();
  data.conversationReferences[userId] = reference;
  save(data);
}

function getConversationReferences() {
  return load().conversationReferences;
}

function saveSubmission(userId, userName, answers) {
  const data = load();
  data.submissions.push({
    userId,
    userName,
    items: [answers.item1, answers.item2, answers.item3].filter(Boolean),
    blockers: answers.blockers || '',
    submittedAt: new Date().toISOString()
  });
  save(data);
}

function getSubmissionsSince(sinceDate) {
  const data = load();
  return data.submissions.filter((s) => new Date(s.submittedAt) >= sinceDate);
}

module.exports = {
  saveConversationReference,
  getConversationReferences,
  saveSubmission,
  getSubmissionsSince
};
