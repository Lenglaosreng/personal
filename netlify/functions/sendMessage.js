/**
 * Netlify Serverless Function: /netlify/functions/sendMessage
 * -----------------------------------------------------------
 * This function handles submissions from the contact form and sends
 * the message to a specified Telegram chat via a bot.
 * It securely uses environment variables to store sensitive data.
 *
 * Required Environment Variables in Netlify:
 * - TELEGRAM_BOT_TOKEN: Your secret bot token from BotFather.
 * - TELEGRAM_CHAT_ID: The ID of the chat where messages should be sent.
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
        // Parse the incoming data from the form submission
        const { name, email, phonenumber, message } = JSON.parse(event.body);

        // --- Basic Validation ---
        // Ensure the required fields are present.
        if (!name || !message) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: "Name and message are required." }),
            };
        }

        // --- Securely get environment variables ---
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // Check if the API key and Chat ID are set in the Netlify environment
        if (!botToken || !chatId) {
            console.error("Telegram environment variables are not set.");
            return {
                statusCode: 500, // Internal Server Error
                body: JSON.stringify({ error: "Server configuration error. Please contact the administrator." }),
            };
        }

        // --- Format the message to be sent to Telegram ---
        // Using Markdown for bold text and a clean layout.
        // It handles optional fields gracefully.
        const text = `
*📩 សារថ្មីពី Portfolio Website*

*👤 ឈ្មោះ:* ${name}
*📧 អ៊ីមែល:* ${email || 'មិនបានផ្តល់ឱ្យ'}
*☎️ លេខទូរស័ព្ទ:* ${phonenumber || 'មិនបានផ្តល់ឱ្យ'}

*📝 សារ:*
${message}
        `;

        const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        // Send the formatted message to the Telegram API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown', // Enable Markdown formatting (for the asterisks *)
            }),
        });

        // Check if the request to Telegram was successful
        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Telegram API error:', errorBody);
            throw new Error(`Telegram API responded with status ${response.status}`);
        }

        // Return a success response to the frontend if everything went well
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Message sent successfully!" }),
        };

    } catch (error) {
        // Catch any other errors during execution
        console.error('Error in sendMessage function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to send message." }),
        };
    }
};
