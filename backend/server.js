require("dotenv").config();

const Fastify = require("fastify");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const Groq = require("groq-sdk");
const cors = require("@fastify/cors");

const fastify = Fastify({ logger: true });

/* -------------------- CORS -------------------- */
fastify.register(cors, {
  origin: [
    "http://localhost:5173",
    "https://movie-recommendation-frontend-gzpofqrs3.vercel.app"
  ],
  methods: ["GET", "POST"]
});

/* -------------------- DATABASE -------------------- */
const dbDir = path.join(__dirname, "db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, "movies.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ SQLite Error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_input TEXT NOT NULL,
    recommended_movies TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/* -------------------- GROQ -------------------- */
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing in .env");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* -------------------- ROUTES -------------------- */

fastify.get("/", (req, reply) => {
  reply.send({ message: "Backend is running 🚀" });
});

fastify.post("/test", (req, reply) => {
  reply.send({
    message: "POST working",
    receivedData: req.body
  });
});

/* -------- History -------- */
fastify.get("/history", (req, reply) => {
  db.all(
    "SELECT * FROM recommendations ORDER BY timestamp DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("DB ERROR:", err);
        return reply.code(500).send({ error: "Database error" });
      }

      const data = rows.map(row => ({
        id: row.id,
        user_input: row.user_input,
        recommended_movies: JSON.parse(row.recommended_movies),
        timestamp: row.timestamp
      }));

      reply.send(data);
    }
  );
});

/* -------- Recommend -------- */
fastify.post("/recommend", async (req, reply) => {
  const userInput = req.body?.user_input;

  if (!userInput) {
    return reply.code(400).send({ error: "user_input is required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ stable model
      messages: [
        {
          role: "user",
          content: `Recommend 3 to 5 movies based on this preference: ${userInput}.
Return only movie names separated by commas.`
        }
      ]
    });

    console.log("🔍 GROQ RAW RESPONSE:", completion);

    // ✅ SAFE RESPONSE EXTRACTION
    const aiText =
      completion?.choices?.[0]?.message?.content;

    if (!aiText) {
      throw new Error("No valid response from AI");
    }

    let recommendations = aiText
      .split(",")
      .map(m => m.trim())
      .filter(Boolean);

    if (recommendations.length === 0) {
      recommendations = [
        "Inception",
        "Mad Max: Fury Road",
        "Wonder Woman"
      ];
    }

    // ✅ Save to DB safely
    const insertId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO recommendations (user_input, recommended_movies)
         VALUES (?, ?)`,
        [userInput, JSON.stringify(recommendations)],
        function (err) {
          if (err) {
            console.error("DB INSERT ERROR:", err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });

    return reply.send({
      id: insertId,
      user_input: userInput,
      recommended_movies: recommendations
    });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    console.error("❌ GROQ ERROR:", error.message);
    console.error("❌ GROQ RESPONSE:", error.response?.data);

    return reply.code(500).send({
      error: "AI service failed",
      reason: error.message || "Unknown error"
    });
  }
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 3000;

fastify.listen({ port: PORT, host: "0.0.0.0" }, err => {
  if (err) {
    console.error("❌ SERVER ERROR:", err);
    process.exit(1);
  }
  console.log(`🚀 Server running on port ${PORT}`);
});