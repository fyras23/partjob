import { config } from "dotenv";
config(); // loads GROQ_API_KEY from .env

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const models = await groq.models.list();
console.log("Available models:");
models.data
  .filter(m => m.object === "model")
  .sort((a, b) => a.id.localeCompare(b.id))
  .forEach(m => console.log(" -", m.id));
