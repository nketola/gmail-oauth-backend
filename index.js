const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.post("/gmail-oauth", async (req, res) => {
  const { action } = req.body;
  const authHeader = req.headers.authorization;

  console.log("✅ /gmail-oauth hit with action:", action);
  console.log("🔐 Auth token (first 10):", authHeader?.substring(0, 10));

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  if (!action) {
    return res.status(400).json({ error: "Missing action in request body" });
  }

  if (action === "status") {
    return res.status(200).json({ connected: true }); // stubbed for now
  }

  if (action === "authorize") {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    if (!GOOGLE_CLIENT_ID || !REDIRECT_URI) {
      return res.status(500).json({ error: "Missing GOOGLE_CLIENT_ID or REDIRECT_URI in environment" });
    }

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email')}` +
      `&access_type=offline` +
      `&prompt=consent`;

    return res.status(200).json({ url: authUrl });
  }

  if (action === "disconnect") {
    return res.status(200).json({ success: true }); // stubbed
  }

  if (action === "callback") {
    return res.status(200).json({ success: true }); // stubbed
  }

  return res.status(400).json({ error: `Unhandled action: ${action}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
