const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.post("/gmail-oauth", async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("✅ Token response:", tokenData);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "OAuth failed", details: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
