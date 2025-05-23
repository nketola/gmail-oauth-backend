const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("✅ Gmail OAuth endpoint is working");
});

module.exports = router;
