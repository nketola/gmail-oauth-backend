const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: "https://recruitlook2.com", // ✅ your live frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.options("*", cors(corsOptions)); // handle preflight CORS

app.post("/gmail-oauth", async (req, res) => {
  const { action, user_id, code, state } = req.body;
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization" });
  }

  const token = authHeader.split(" ")[1];
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Missing Supabase credentials" });
  }

  try {
    if (action === "authorize") {
      // Step 1: Return the OAuth URL
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email&access_type=offline&prompt=consent&state=${user_id}`;
      return res.json({ url });
    }

    if (action === "callback") {
      // Step 2: Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        return res.status(400).json({ error: "Invalid token exchange" });
      }

      // Get email address
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userInfo = await userInfoRes.json();

      // Save tokens + email to Supabase
      await fetch(`${supabaseUrl}/rest/v1/email_oauth_tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          user_id: state || user_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          email: userInfo.email,
          provider: "google",
        }),
      });

      return res.json({ success: true });
    }

    if (action === "status") {
      const result = await fetch(`${supabaseUrl}/rest/v1/email_oauth_tokens?user_id=eq.${user_id}`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      const data = await result.json();
      return res.json({
        connected: !!data.length,
        email: data[0]?.email || null,
      });
    }

    if (action === "disconnect") {
      await fetch(`${supabaseUrl}/rest/v1/email_oauth_tokens?user_id=eq.${user_id}`, {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("OAuth error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Gmail OAuth server running on port ${PORT}`);
});
