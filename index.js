const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Import Gmail OAuth routes
const gmailOAuthRoutes = require("./gmail-oauth");

// Middleware to parse JSON
app.use(express.json());

// Mount Gmail OAuth routes
app.use("/gmail-oauth", gmailOAuthRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.send("✅ Gmail backend is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
