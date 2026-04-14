const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateAnalysis(transcript) {
  const prompt = `Provide a comprehensive interview analysis as JSON using the following schema: [insert your schema or summary here]. Transcript: ${transcript}`;
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert interview analyst." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });
  try {
    return JSON.parse(response.data.choices[0].message.content);
  } catch (e) {
    throw new Error("Analysis not in JSON format");
  }
}

module.exports = { generateAnalysis };
