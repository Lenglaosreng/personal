// This code runs on Netlify's servers (Node.js environment).
// You need to install 'node-fetch' for this to work.
// Run `npm install node-fetch` in your project directory.
const fetch = require('node-fetch');

// The main handler for the Netlify Function.
exports.handler = async (event) => {
    // 1. We only accept POST requests.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // Parse the incoming data from the form submission.
        const data = JSON.parse(event.body);
        const { name, email, phonenumber, message } = data;
        const recaptchaToken = data['g-recaptcha-response'];

        // 2. Check if the reCAPTCHA token from the frontend exists.
        if (!recaptchaToken) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'reCAPTCHA token is missing.' }),
            };
        }

        // 3. Verify the reCAPTCHA token with Google's API.
        const recaptchaSecret = process.env.RECAPTCHA_SECRET;
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify`;

        const verificationResponse = await fetch(verificationURL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
        });
        
        const verificationData = await verificationResponse.json();

        // 4. Check if Google's verification was successful and the score is high enough.
        if (!verificationData.success || verificationData.score < 0.5) {
            console.warn('reCAPTCHA verification failed:', verificationData['error-codes']);
            // [UPDATED] Changed the error message to be more user-friendly and accurate for v3.
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'ការផ្ទៀងផ្ទាត់បានបរាជ័យ។ ប្រព័ន្ធសង្ស័យថាមានសកម្មភាពមិនប្រក្រតី។ សូមព្យាយាមម្តងទៀត។' }),
            };
        }
        
        // --- If reCAPTCHA is valid, proceed to send the message to Telegram ---

        // 5. Format the message content to be sent to your Telegram.
        const telegramMessage = `
📬 *New message from Portfolio*

*Name:* ${name}
*Email:* ${email || '_Not provided_'}
*Phone:* ${phonenumber || '_Not provided_'}

*Message:*
${message}
        `;

        // 6. Send the message using the Telegram Bot API.
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
             console.error('Telegram environment variables are not set.');
             return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error.' }),
             };
        }
        
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: telegramMessage,
                parse_mode: 'Markdown'
            }),
        });
        
        if (!telegramResponse.ok) {
             const error = await telegramResponse.json();
             console.error('Telegram API Error:', error);
             return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to send message via Telegram.' }),
             };
        }

        // 7. If everything is successful, return a success message.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent successfully!' }),
        };

    } catch (error) {
        console.error('Server Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal server error occurred.' }),
        };
    }
};
```

### ការផ្លាស់ប្តូរ និងការណែនាំ

1.  **កែសម្រួលសារបញ្ហា (Error Message)**៖ ខ្ញុំបានផ្លាស់ប្តូរសារដែល Server បញ្ជូនមកវិញនៅពេល reCAPTCHA បរាជ័យ។ ឥឡូវនេះវានឹងបង្ហាញថា "ការផ្ទៀងផ្ទាត់បានបរាជ័យ។ ប្រព័ន្ធសង្ស័យថាមានសកម្មភាពមិនប្រក្រតី។ សូមព្យាយាមម្តងទៀត។" ដែលជាសារត្រឹមត្រូវ និងមិនទាមទារឱ្យអ្នកប្រើប្រាស់ធ្វើអ្វីដែលមិនអាចទៅរួច។

2.  **(សំខាន់) បង្ហាញ reCAPTCHA Badge**៖ យោងតាមលក្ខខណ្ឌរបស់ Google អ្នកត្រូវតែបង្ហាញ Badge (ស្លាកសញ្ញា) របស់ reCAPTCHA នៅលើទំព័ររបស់អ្នក។ Badge នេះនឹងបង្ហាញដោយស្វ័យប្រវត្តិ ប៉ុន្តែពេលខ្លះកូដ CSS អាចធ្វើឱ្យវាលាក់បាត់។ សូមបន្ថែម CSS ខាងក្រោមទៅក្នុងឯកសារ `style.css` របស់អ្នក ដើម្បីប្រាកដថាវាត្រូវបានបង្ហាញ៖

    ```css
    .grecaptcha-badge { 
        visibility: visible !important;
        right: 15px !important;
        transition: right 0.3s ease !important; 
    }
    ```

3.  **ត្រួតពិនិត្យម្តងទៀត**៖
    * សូមប្រាកដថាអ្នកបានដាក់ Domain `sreng.netlify.app` នៅក្នុងការកំណត់ reCAPTCHA របស់អ្នកនៅ Google Admin Console។
    * សូមពិនិត្យមើល Environment Variables (`RECAPTCHA_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) នៅលើ Netlify ថាបានដាក់ត្រឹមត្រូវ។

បន្ទាប់ពីអនុវត្តការកែប្រែទាំងនេះ បទពិសោធន៍អ្នកប្រើប្រាស់ (User Experience) នឹងល្អប្រសើរជាងមុន ហើយបញ្ហានឹងត្រូវបានដោះស្រ
