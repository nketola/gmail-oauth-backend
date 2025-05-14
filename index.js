import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// Utility to set credentials
function setCredentialsFromToken(token) {
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: new Date(token.expires_at).getTime(),
  });
}

// Endpoint to send email
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, html, token } = req.body;

    if (!token || !token.access_token) {
      return res.status(400).json({ error: "Missing or invalid token" });
    }

    setCredentialsFromToken(token);

    const rawMessage = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}`
    ).toString("base64");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    res.status(200).json({ success: true, messageId: result.data.id });
  } catch (error) {
    console.error("Gmail Send Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ping endpoint
app.get("/", (_, res) => res.send("Gmail backend is live."));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
