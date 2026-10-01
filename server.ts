import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import agoraTokenPkg from "agora-token";

const { RtcTokenBuilder, RtcRole } = agoraTokenPkg as any;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Real-time server messaging cache & SSE broadcast hub for instant cross-tab / cross-device sync
  const liveMessages: Array<{
    id: string;
    senderId: string;
    recipientId: string;
    text: string;
    timestamp: number;
    [key: string]: any;
  }> = [];

  const sseClients = new Set<express.Response>();

  // Push new real-time message
  app.post("/api/messages", (req, res) => {
    const msg = req.body;
    if (!msg || !msg.id || !msg.senderId || !msg.recipientId) {
      return res.status(400).json({ error: "Missing required message fields" });
    }

    const cleanSender = (msg.senderId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanRecip = (msg.recipientId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const sorted = [cleanSender, cleanRecip].sort();
    const chatRoomId = msg.chatRoomId || `${sorted[0]}_${sorted[1]}`;

    const payload = {
      ...msg,
      chatRoomId,
      timestamp: msg.timestamp || Date.now()
    };

    // Keep rolling history of last 200 messages
    liveMessages.unshift(payload);
    if (liveMessages.length > 200) {
      liveMessages.pop();
    }

    // Broadcast immediately to all connected SSE clients
    const sseData = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(sseData);
      } catch (err) {
        sseClients.delete(client);
      }
    });

    res.json({ success: true, messageId: payload.id, chatRoomId });
  });

  // Query recent messages for a specific chat room
  app.get("/api/chat-rooms/:roomId/messages", (req, res) => {
    const roomId = (req.params.roomId || "").trim().toUpperCase();
    const filtered = liveMessages.filter((m) => {
      if (m.chatRoomId && m.chatRoomId.toUpperCase() === roomId) return true;
      const cleanSender = (m.senderId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      const cleanRecip = (m.recipientId || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      const sorted = [cleanSender, cleanRecip].sort();
      return `${sorted[0]}_${sorted[1]}` === roomId;
    });
    res.json({ roomId, messages: filtered.slice(0, 50) });
  });

  // SSE Stream for instant live message receipt
  app.get("/api/messages/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: "CONNECTED", time: Date.now() })}\n\n`);

    sseClients.add(res);

    // Heartbeat every 20s to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Query recent messages for a user
  app.get("/api/messages", (req, res) => {
    const rawTarget = (req.query.userId as string) || "";
    const cleanTarget = rawTarget.trim().toUpperCase().replace("#", "");

    if (!cleanTarget) {
      return res.json({ messages: liveMessages.slice(0, 50) });
    }

    const filtered = liveMessages.filter((m) => {
      const rec = (m.recipientId || "").trim().toUpperCase().replace("#", "");
      const sen = (m.senderId || "").trim().toUpperCase().replace("#", "");
      return rec === cleanTarget || sen === cleanTarget;
    });

    res.json({ messages: filtered.slice(0, 50) });
  });

  // Direct Firebase Config endpoint for client runtime
  app.get("/api/firebase-config", (req, res) => {
    res.json({
      apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDEn5_wEHzdbhdRLwhCNu9Sq_wEVcJJhBU",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "quickchat-5a4b9.firebaseapp.com",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "quickchat-5a4b9",
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "quickchat-5a4b9.firebasestorage.app",
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "213538671219",
      appId: process.env.VITE_FIREBASE_APP_ID || "1:213538671219:web:19e7bebeb5e255abfdf806"
    });
  });

  // Direct Agora App ID & Credentials Configuration endpoint
  app.get("/api/agora-config", (req, res) => {
    const rawAppId = process.env.VITE_AGORA_APP_ID || process.env.AGORA_APP_ID || "";
    const cleanAppId = rawAppId.trim().replace(/^["']|["']$/g, "");
    res.json({
      appId: cleanAppId,
      hasAppId: Boolean(cleanAppId)
    });
  });

  // Dynamic Agora RTC Token generation endpoint
  app.get("/api/agora-token", (req, res) => {
    const channel = (req.query.channel as string) || "live_roulette";
    const uid = (req.query.uid as string) || "0";
    const rawAppId = process.env.VITE_AGORA_APP_ID || process.env.AGORA_APP_ID || "";
    const appId = rawAppId.trim().replace(/^["']|["']$/g, "");
    const rawCert =
      process.env.AGORA_APP_CERTIFICATE || process.env.VITE_AGORA_APP_CERTIFICATE || "";
    const appCertificate = rawCert.trim().replace(/^["']|["']$/g, "");

    if (!appId) {
      return res.json({
        token: null,
        appId: null,
        hasCertificate: false,
        message: "No Agora App ID configured"
      });
    }

    if (!appCertificate) {
      return res.json({
        token: null,
        appId,
        hasCertificate: false,
        message: "No Agora App Certificate configured. Set AGORA_APP_CERTIFICATE in Settings to generate dynamic tokens."
      });
    }

    try {
      // 2 hours token expiry
      const tokenExpire = Math.floor(Date.now() / 1000) + 7200;
      const privilegeExpire = tokenExpire;
      const role = RtcRole.PUBLISHER;

      // Safe clean UID
      const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "") || "user0";

      const token = RtcTokenBuilder.buildTokenWithUserAccount(
        appId,
        appCertificate,
        channel,
        safeUid,
        role,
        tokenExpire,
        privilegeExpire
      );

      return res.json({
        token,
        appId,
        hasCertificate: true,
        channel,
        uid: safeUid
      });
    } catch (err: any) {
      console.warn("[Agora Token Server] Token generation note:", err?.message || err);
      return res.json({
        token: null,
        appId,
        hasCertificate: false,
        error: err?.message || "Token generation failed"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
