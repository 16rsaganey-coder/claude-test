const https = require('https');
const storage = require('./storage');

const GRAPH_TOKEN_URL = (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const GRAPH_SEND_MAIL_URL = (senderUpn) => `https://graph.microsoft.com/v1.0/users/${senderUpn}/sendMail`;

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => {
          if (res.statusCode >= 400) return reject(new Error(`${res.statusCode}: ${chunks}`));
          resolve(chunks ? JSON.parse(chunks) : {});
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getGraphToken() {
  const params = new URLSearchParams({
    client_id: process.env.AAD_APP_CLIENT_ID,
    client_secret: process.env.AAD_APP_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  }).toString();

  const tokenResponse = await postJson(GRAPH_TOKEN_URL(process.env.AAD_APP_TENANT_ID), params, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(params)
  });
  return tokenResponse.access_token;
}

function buildDigestHtml(submissions) {
  if (submissions.length === 0) {
    return '<p>No submissions this week.</p>';
  }
  return submissions
    .map((s) => {
      const items = s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
      const blockers = s.blockers ? `<p><i>Blockers:</i> ${escapeHtml(s.blockers)}</p>` : '';
      return `<h3>${escapeHtml(s.userName)}</h3><ul>${items}</ul>${blockers}`;
    })
    .join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendWeeklyDigest() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const submissions = storage.getSubmissionsSince(since);

  const token = await getGraphToken();
  const message = {
    message: {
      subject: `Weekly Top 3 — Team Digest (${new Date().toLocaleDateString()})`,
      body: { contentType: 'HTML', content: buildDigestHtml(submissions) },
      toRecipients: [{ emailAddress: { address: process.env.CIO_EMAIL } }]
    }
  };

  await postJson(GRAPH_SEND_MAIL_URL(process.env.MAIL_SENDER_UPN), message, {
    Authorization: `Bearer ${token}`
  });
}

module.exports = { sendWeeklyDigest, buildDigestHtml };
