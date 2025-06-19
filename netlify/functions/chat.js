/**
 * Netlify Serverless Function: /netlify/functions/chat
 * ----------------------------------------------------
 * This file acts as a secure backend proxy for the chatbot.
 * The frontend sends a request here. This function securely adds the
 * OpenRouter API key and forwards the request to the AI service.
 *
 * How to use:
 * 1. Place this file in the `netlify/functions/` directory of your project.
 * 2. In your Netlify site settings (under "Build & deploy" > "Environment"),
 * add an environment variable:
 * - Key: OPENROUTER_API_KEY
 * - Value: Your secret key from OpenRouter (e.g., sk-or-v1-...)
 */

// Use the built-in fetch API available in modern Node.js environments.
exports.handler = async function(event) {
    // Only allow POST requests for security.
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    try {
        // Parse the incoming message from the form submission.
        const { message } = JSON.parse(event.body);

        // Basic validation.
        if (!message) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: "Message is required." }),
            };
        }

        // Securely get the environment variable.
        const apiKey = process.env.OPENROUTER_API_KEY;

        // Check if the API key is configured in the Netlify environment.
        if (!apiKey) {
            console.error("OpenRouter API key is not configured.");
            return {
                statusCode: 500, // Internal Server Error
                body: JSON.stringify({ error: "Server configuration error. Please contact the administrator." }),
            };
        }

        const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

        // Send the request to the OpenRouter API.
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout:free", // Or your preferred model
                messages: [
                    {
                        role: "system",
                        content: "You are SrengBot, a friendly and helpful assistant on Sreng's portfolio website. You respond in Khmer."
                    },
                    {
                        role: "user",
                        content: message
                    },
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        // Check if the request to OpenRouter was successful.
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error('OpenRouter API error:', errorBody);
            throw new Error(`OpenRouter API responded with status ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        // Return a success response to the frontend.
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: reply || "I'm sorry, I couldn't generate a response." }),
        };

    } catch (error) {
        // Catch any other errors during execution.
        console.error('Error in chat function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process chat message." }),
        };
    }
};
