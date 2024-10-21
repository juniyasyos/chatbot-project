import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCXnicljXsjQrxiMwXET7p0xMwjT8Kj3HM");

export const handler = async (event) => {
    const body = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const history = body.history || [];

    const formattedHistory = history.map((item) => ({
        role: item.role,
        parts: [{ text: item.parts[0].text }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    const msg = body.message;

    try {
        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: text }),
        };
    } catch (error) {
        console.error("Error during AI generation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error processing your request." }),
        };
    }
};
