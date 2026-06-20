import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// ⚠️ API Key ab .env file se aayegi (Security ke liye)
const NVIDIA_KEY = process.env.NVIDIA_KEY;

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: NVIDIA_KEY
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { name, age, gender, answers } = req.body;
        const summaryText = answers.join("\n");

        const systemPrompt = `You are a world-class, elite clinical dermatologist. Generate a highly advanced, yet easy-to-understand skincare report for ${name}.

        CRITICAL RULES FOR CONTENT:
        1. ZERO OBVIOUS ADVICE (Do NOT say "drink water", "wear sunscreen", "wash your face"). Respect the user's intelligence. Provide advanced, lesser-known insights explained in simple terms.
        2. Focus on specific acids, vitamins, and molecular barriers.
        3. For the Product Section, you MUST recommend purely NON-SPONSORED, highly effective products with a rating of 4.5/5 or higher. Include underrated gems.
        4. You MUST wrap the Brand and Product Name EXACTLY in these tags: [PRODUCT]Brand Name - Product Name[/PRODUCT].

        YOUR EXACT OUTPUT TEMPLATE:

        ## **1. Clinical Skin Analysis & Root Causes**
        - [Advanced insight 1 about their specific cellular condition]
        - [Lesser-known trigger causing their issue]

        ## **2. Advanced Protocols (Do's)**
        🟢 [Highly specific, advanced action 1]
        🟢 [Highly specific, advanced action 2]

        ## **3. Critical Restrictions (Avoid)**
        🔴 [Hidden ingredient or chemical combination to strictly avoid]
        🔴 [Specific environmental or dietary trigger most people don't know]

        ## **4. Targeted Active Molecules Needed**
        - **[Molecule/Acid Name]**: [Simple explanation of why their skin cells need this right now].

        ## **5. 🏆 Best Non-Sponsored Products (4.5+ ⭐)**
        - [PRODUCT]Brand Name - Product Name[/PRODUCT]
          Why it works: [Explain which exact acids/vitamins it contains and why it fits perfectly].
          Buy Link: (https://www.google.com/search?tbm=shop&q=[Search+Query])
        `;

        const completion = await client.chat.completions.create({
            model: "meta/llama-3.1-8b-instruct", 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Patient Profile:\nName: ${name}\nAge: ${age}\nGender: ${gender}\nForm Data:\n${summaryText}` }
            ],
            temperature: 0.2, 
            max_tokens: 1500
        });

        res.json({ report: completion.choices[0].message.content });

    } catch (error) {
        console.error("NVIDIA API Error:", error);
        res.status(500).json({ report: `## **API Error**\n🔴 Failed to load: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SKINZA active on port ${PORT}`));
