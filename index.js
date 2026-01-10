const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const qs = require('querystring');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const total = new Map();

const uaList = [
  "Mozilla/5.0 (Linux; Android 10) Chrome/105.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11) Chrome/106.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12) Chrome/108.0 Mobile Safari/537.36"
];

/* ================= TOTAL STATUS ================= */
app.get('/total', (req, res) => {
  const data = Array.from(total.values()).map((v, i) => ({
    session: i + 1,
    url: v.url,
    count: v.count,
    target: v.target,
  }));
  res.json(data);
});

/* ================= HOME ================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ================= SUBMIT ================= */
app.post('/api/submit', async (req, res) => {
  const { cookie, url, amount } = req.body;
  if (!cookie || !url || !amount) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const ua = uaList[Math.floor(Math.random() * uaList.length)];
    const token = await extractToken(cookie, ua);

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired cookie' });
    }

    // Start sharing immediately
    share(cookie, token, url, amount, ua);

    res.json({ status: 200, message: 'Sharing started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= SHARE LOGIC ================= */
async function share(cookie, token, link, amount, ua) {
  const id = Date.now(); // unique session id
  total.set(id, { url: link, count: 0, target: amount });

  let sharedCount = 0;

  const sharePromises = Array.from({ length: amount }).map(async () => {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/me/feed`,
        qs.stringify({
          link,
          published: 0,      // 🔒 PREVENT TIMELINE POST
          access_token: token
        }),
        {
          headers: {
            "User-Agent": ua,
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookie
          }
        }
      );

      sharedCount++;
      total.set(id, { url: link, count: sharedCount, target: amount });

    } catch (e) {
      // ignore individual errors
    }
  });

  await Promise.allSettled(sharePromises);

  // After all shares, remove session after 10s
  setTimeout(() => total.delete(id), 10000);
}

/* ================= TOKEN EXTRACT ================= */
async function extractToken(cookie, ua) {
  try {
    const res = await axios.get(
      "https://business.facebook.com/business_locations",
      {
        headers: {
          "User-Agent": ua,
          "Cookie": cookie,
          "Referer": "https://www.facebook.com/"
        }
      }
    );
    const match = res.data.match(/EAAG\w+/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

/* ================= START SERVER ================= */
app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});