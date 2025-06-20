/**
 * Netlify Serverless Function: /netlify/functions/sendMessage
 * SECURITY ENHANCEMENTS:
 * 1. Origin Check: Verifies the request origin to prevent CSRF.
 * 2. Input Sanitization: Cleans all user inputs to prevent XSS.
 * 3. Generic Error Messages: Returns non-specific errors.
 */

// Helper function to sanitize input by escaping HTML characters
const sanitize = (str) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

exports.handler = async function(event) {
    // 1. Origin Check for basic CSRF protection
    const allowedOrigin = 'https://sreng.netlify.app';
    const requestOrigin = event.headers.origin;

    // Allow requests only from the deployed site
    if (requestOrigin !== allowedOrigin) {
        return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const body = JSON.parse(event.body);

        // 2. Sanitize all inputs
        const name = sanitize(body.name);
        const email = sanitize(body.email);
        const phonenumber = sanitize(body.phonenumber);
        const message = sanitize(body.message);

        if (!name || !message) {
            return { statusCode: 400, body: JSON.stringify({ error: "Name and message are required." }) };
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error("Telegram environment variables are not set.");
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        const text = `
*📩 New Message from Portfolio*

*Name:* ${name}
*Email:* ${email || 'Not provided'}
*Phone:* ${phonenumber || 'Not provided'}

*Message:*
${message}
        `;

        const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            console.error('Telegram API error');
            throw new Error('Could not send message to Telegram.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Message sent successfully!" }),
        };

    } catch (error) {
        console.error('Error in sendMessage function:', error);
        // 3. Return a generic error message
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An unexpected error occurred. Please try again later." }),
        };
    }
};
