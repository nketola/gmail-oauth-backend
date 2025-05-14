const express = require("express");
const cors = require("cors");
const app = express();
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
    return res.status(200).json({ connected: true }); // stubbed response
  }

  if (action === "authorize") {
    return res.status(200).json({ url: "https://accounts.google.com/o/oauth2/v2/auth?stubbed" }); // stubbed auth URL
  }

  if (action === "disconnect") {
    return res.status(200).json({ success: true });
  }

  if (action === "callback") {
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: `Unhandled action: ${action}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
