/**
 * Netlify Serverless Function: /netlify/functions/chat
 * SECURITY ENHANCEMENTS:
 * 1. Origin Check: Verifies the request origin.
 * 2. Input Sanitization: Cleans the user's message to prevent XSS.
 * 3. Generic Error Messages: Returns non-specific errors.
 */

// Helper function to sanitize input
const sanitize = (str) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

exports.handler = async function(event) {
    // 1. Origin Check
    const allowedOrigin = 'https://sreng.netlify.app';
    const requestOrigin = event.headers.origin;
    if (requestOrigin !== allowedOrigin) {
        return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const body = JSON.parse(event.body);
        
        // 2. Input Sanitization
        const message = sanitize(body.message);

        if (!message) {
            return { statusCode: 400, body: JSON.stringify({ error: "Message is required." }) };
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.error("OpenRouter API key is not configured.");
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout:free",
                messages: [
                    { role: "system", content: "You are SrengBot, a friendly assistant. Respond in Khmer." },
                    { role: "user", content: message } // Use sanitized message
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            console.error('OpenRouter API error');
            throw new Error('Could not get response from AI service.');
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: reply || "I'm sorry, I couldn't generate a response." }),
        };

    } catch (error) {
        console.error('Error in chat function:', error);
        // 3. Generic Error Message
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unexpected error occurred while processing your message." }),
        };
    }
};
