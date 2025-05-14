const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/gmail-oauth", async (req, res) => {
  const { action } = req.body;
  const authHeader = req.headers.authorization;

  console.log("✅ /gmail-oauth hit with action:", action);
  console.log("🔐 Auth token (first 10):", authHeader?.substring(0, 10));

  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });
  if (!action) return res.status(400).json({ error: "Missing action in request body" });

  if (action === "status") return res.status(200).json({ connected: true });

  if (action === "authorize") {
    const { GOOGLE_CLIENT_ID, REDIRECT_URI } = process.env;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email')}` +
      `&access_type=offline&prompt=consent`;

    return res.status(200).json({ url: authUrl });
  }

  if (action === "disconnect") return res.status(200).json({ success: true });
  if (action === "callback") return res.status(200).json({ success: true });

  return res.status(400).json({ error: `Unhandled action: ${action}` });
});

app.post("/refresh-token", async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: tokenRow, error } = await supabase
    .from("email_oauth_tokens")
    .select("*")
    .eq("user_id", user_id)
    .eq("provider", "gmail")
    .maybeSingle();

  if (error || !tokenRow?.refresh_token) {
    return res.status(400).json({ error: "No refresh_token found" });
  }

  const params = new URLSearchParams();
  params.append("client_id", process.env.GOOGLE_CLIENT_ID);
  params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
  params.append("refresh_token", tokenRow.refresh_token);
  params.append("grant_type", "refresh_token");

  const googleRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const googleData = await googleRes.json();

  if (!googleRes.ok) {
    return res.status(googleRes.status).json({ error: googleData });
  }

  await supabase
    .from("email_oauth_tokens")
    .update({
      access_token: googleData.access_token,
      expires_at: new Date(Date.now() + googleData.expires_in * 1000).toISOString()
    })
    .eq("user_id", user_id)
    .eq("provider", "gmail");

  return res.status(200).json({ access_token: googleData.access_token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
