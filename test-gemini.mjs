import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyD2yFpVOfQwKaim3BN-U3gF6Dkf846ND70";
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("hello");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("EXACT GEMINI ERROR:", e);
    }
}

test();
