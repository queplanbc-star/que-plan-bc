import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
  }
  return stripeClient;
}

// Fetch config from Google Sheets for server-side rendering of meta tags
async function fetchServerConfig() {
  const SHEET_ID = '179rvDzrKpJ1P94RCDOu6KyGgOf7kGw4BBQupYlFSCw0';
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Configuracion&range=A:B&headers=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const text = await response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1 || end === -1) return null;

    const json = JSON.parse(text.substring(start, end));
    const rows = json.table?.rows || [];

    let config = {
      sharePhrase: "Descubre los mejores eventos culturales y de entretenimiento en Ensenada.",
      previewImageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000"
    };

    rows.forEach((row: any) => {
      const key = row.c?.[0]?.v;
      const value = row.c?.[1]?.v;
      
      if (typeof key === 'string') {
        const normalizedKey = key.trim().toLowerCase();
        if (normalizedKey === 'frase_compartir' && value) {
          config.sharePhrase = String(value);
        }
        if (normalizedKey === 'url_imagen_preview' && value) {
          config.previewImageUrl = String(value);
        }
      }
    });
    
    return config;
  } catch (error) {
    console.error("Error loading server config:", error);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "mxn" } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const stripe = getStripe();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
