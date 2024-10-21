import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const PORT = 4100;
const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN_API_KEY);

// Endpoint untuk menangani permintaan ke model AI
app.post("/gemini", async (req, res) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const history = req.body.history || [];

  // Format history untuk dikirim ke model
  const formattedHistory = history.map((item) => ({
    role: item.role,
    parts: [{ text: item.parts[0].text }],
  }));

  const chat = model.startChat({ history: formattedHistory });
  const msg = req.body.message;

  try {
    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();

    // Kirim respons dalam format JSON
    res.json({ message: text });
  } catch (error) {
    console.error("Error during AI generation:", error);
    // Kirim respons kesalahan dalam format JSON
    res.status(500).json({ error: "Error processing your request." });
  }
});

// Jalankan server
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
