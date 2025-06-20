/**
 * SECURED VERSION - Main entry point. Waits for the DOM to be fully loaded before running any scripts.
 */
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

/**
 * Security utilities object to centralize all security-related functions.
 */
const Security = {
    /**
     * Sanitizes user input by escaping potentially dangerous characters and limiting length.
     * This is a primary defense against XSS.
     * @param {string} input The string to sanitize.
     * @param {number} maxLength The maximum allowed length of the string.
     * @returns {string} The sanitized string.
     */
    sanitizeInput(input, maxLength = 500) {
        if (typeof input !== 'string') return '';
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        const sanitized = input.replace(/[&<>"'/]/g, s => escapeMap[s]);
        return sanitized.slice(0, maxLength).trim();
    },

    /**
     * Validates form data with comprehensive checks.
     * @param {object} data - The form data object {name, email, phonenumber, message}.
     * @returns {string[]} An array of error messages. Returns an empty array if valid.
     */
    validateFormData(data) {
        const errors = [];
        if (!data.name || data.name.length < 2 || data.name.length > 50) {
            errors.push('ឈ្មោះត្រូវតែមានពី 2 ទៅ 50 តួអក្សរ។');
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវទេ។');
        }
        if (data.phonenumber && !/^[0-9+\-\s()]{8,15}$/.test(data.phonenumber)) {
            errors.push('លេខទូរស័ព្ទមិនត្រឹមត្រូវទេ។');
        }
        if (!data.message || data.message.length < 10 || data.message.length > 1000) {
            errors.push('សារត្រូវតែមានពី 10 ទៅ 1000 តួអក្សរ។');
        }
        return errors;
    },

    /**
     * Validates chatbot messages for length and basic malicious patterns.
     * @param {string} message The chat message to validate.
     * @returns {boolean} True if the message is valid, false otherwise.
     */
    validateChatMessage(message) {
        if (!message || typeof message !== 'string' || message.length < 1 || message.length > 500) {
            return false;
        }
        // A simple check for script tags, a more robust check is done server-side.
        if (/<script/i.test(message)) {
            return false;
        }
        return true;
    }
};

/**
 * Rate limiting utility to prevent spam and abuse.
 */
class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.requests = new Map();
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow; // in milliseconds
    }

    isAllowed(clientId = 'default') {
        const now = Date.now();
        const clientRequests = (this.requests.get(clientId) || []).filter(
            timestamp => now - timestamp < this.timeWindow
        );

        if (clientRequests.length >= this.maxRequests) {
            return false;
        }
        clientRequests.push(now);
        this.requests.set(clientId, clientRequests);
        return true;
    }
    
    getRemainingTime(clientId = 'default') {
        const clientRequests = this.requests.get(clientId) || [];
        if (clientRequests.length < this.maxRequests) return 0;
        const oldestRequest = clientRequests[0];
        return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
    }
}

// Initialize rate limiters for different features
const chatRateLimiter = new RateLimiter(10, 60 * 1000); // 10 messages per minute
const formRateLimiter = new RateLimiter(3, 5 * 60 * 1000);  // 3 submissions per 5 minutes

/**
 * Initializes all page features.
 */
function initializePage() {
    setupTheme();
    setupMenu();
    setupRippleEffect();
    createParticles(30);
    setupScrollAnimations();
    setupLazyLoading();
    initializeChatbot();
    setupContactForm();
    setupPerformanceObservers();
}

// All setup functions (setupTheme, setupMenu, etc.) are kept here for organization.
// No major changes in these non-security related functions.
function setupTheme(){const e=document.getElementById("theme-toggle");if(!e)return;const t=document.documentElement,n=e=>{t.setAttribute("data-theme",e)};n("dark"),e.addEventListener("click",()=>{const e=t.getAttribute("data-theme"),a="dark"===e?"light":"dark";n(a)})}function setupMenu(){const e=document.getElementById("menu-icon"),t=document.getElementById("nav-links");e&&t&&(e.addEventListener("click",()=>{const n=e.getAttribute("aria-expanded")==="true";t.classList.toggle("active"),e.setAttribute("aria-expanded",String(!n))}),t.addEventListener("click",a=>{a.target.tagName==="A"&&t.classList.contains("active")&&(t.classList.remove("active"),e.setAttribute("aria-expanded","false"))}))}function setupRippleEffect(){document.querySelectorAll(".glass-card, .skill-card").forEach(e=>{e.addEventListener("click",function(t){if(t.target.closest("a"))return;const n=e.getBoundingClientRect(),a=document.createElement("span");a.style.left=`${t.clientX-n.left}px`,a.style.top=`${t.clientY-n.top}px`,a.classList.add("ripple");const o=e.querySelector(".ripple");o&&o.remove(),this.appendChild(a),setTimeout(()=>{a.remove()},600)})})}function createParticles(e){const t=document.getElementById("particle-container");if(!t)return;for(let n=0;n<e;n++){const a=document.createElement("div");a.classList.add("particle");const o=Math.random()*4+1;a.style.width=`${o}px`,a.style.height=`${o}px`,a.style.top=`${Math.random()*100}%`,a.style.left=`${Math.random()*100}%`,a.style.animationDuration=`${Math.random()*5+5}s`,a.style.animationDelay=`${Math.random()*5}s`,t.appendChild(a)}}function setupScrollAnimations(){const e=document.querySelectorAll(".hidden-section"),t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&e.target.classList.add("visible")})},{threshold:.1});e.forEach(e=>t.observe(e))}function setupLazyLoading(){const e=document.querySelectorAll(".lazy-image"),t=new IntersectionObserver((e,n)=>{e.forEach(e=>{if(e.isIntersecting){const a=e.target,o=a.parentElement;a.src=a.dataset.src,a.onload=()=>{a.classList.add("loaded"),o.classList.contains("image-skeleton")&&o.classList.add("loaded")},a.onerror=()=>{o.classList.contains("image-skeleton")&&o.classList.add("error")},n.unobserve(a)}})},{rootMargin:"0px 0px 200px 0px"});e.forEach(e=>t.observe(e))}function setupPerformanceObservers(){const e=document.getElementById("particle-container"),t=document.getElementById("greeting-text"),n=new IntersectionObserver(e=>{e.forEach(e=>{const t=e.target;e.isIntersecting?t.classList.add("animations-active"):t.classList.remove("animations-active")})},{threshold:0});e&&n.observe(e),t&&n.observe(t)}


/**
 * SECURED: Initializes the chatbot with security measures.
 */
function initializeChatbot() {
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSend = document.getElementById("chatbot-send");

    if (!chatbotToggle || !chatbotInput || !chatbotSend) return;

    chatbotToggle.addEventListener("click", () => {
        document.getElementById("chatbot-popup").classList.toggle("open");
        if (document.getElementById("chatbot-popup").classList.contains("open")) {
            chatbotInput.focus();
        }
    });
    chatbotSend.addEventListener("click", sendMessage);
    chatbotInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });
}

/**
 * SECURED: Safely appends messages to chatbot with XSS protection using textContent.
 */
function appendMessage(role, text) {
    const chatbotBody = document.getElementById("chatbot-body");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}`;
    const prefix = role === "user" ? "អ្នក៖ " : "🤖៖ ";
    // Use textContent to render text safely, preventing any HTML from being interpreted.
    msgDiv.textContent = prefix + text;
    chatbotBody.appendChild(msgDiv);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

function showTypingIndicator() {
    const indicatorId = "typing-indicator";
    if (document.getElementById(indicatorId)) return;
    const indicator = document.createElement("div");
    indicator.id = indicatorId;
    indicator.className = "message bot";
    indicator.innerHTML = `🤖៖ <span class='dots'><span>.</span><span>.</span><span>.</span></span>`;
    document.getElementById("chatbot-body").appendChild(indicator);
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
}

/**
 * SECURED: Send message with rate limiting and validation.
 */
async function sendMessage() {
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSend = document.getElementById("chatbot-send");
    const message = chatbotInput.value.trim();
    
    if (!message || chatbotSend.disabled) return;

    if (!Security.validateChatMessage(message)) {
        appendMessage("bot", "❌ សារមិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។");
        return;
    }
    if (!chatRateLimiter.isAllowed()) {
        const waitTime = Math.ceil(chatRateLimiter.getRemainingTime() / 1000);
        appendMessage("bot", `❌ អ្នកបានផ្ញើសារច្រើនពេក។ សូមរង់ចាំ ${waitTime} វិនាទី។`);
        return;
    }

    appendMessage("user", message); // Display the original (but validated) message
    chatbotInput.value = "";
    chatbotInput.disabled = true;
    chatbotSend.disabled = true;
    showTypingIndicator();

    try {
        // Data is sanitized server-side
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Request failed.");
        }

        const data = await response.json();
        const reply = typeof data.reply === 'string' ? data.reply : "ការឆ្លើយតបមិនត្រឹមត្រូវទេ។";
        
        removeTypingIndicator();
        appendMessage("bot", reply);

    } catch (err) {
        removeTypingIndicator();
        appendMessage("bot", `❌ មានបញ្ហាក្នុងការតភ្ជាប់។`);
    } finally {
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
        chatbotInput.focus();
    }
}

/**
 * SECURED: Sets up the contact form with comprehensive client-side validation and rate limiting.
 */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('form-submit-btn');
    const btnText = submitBtn.querySelector('.submit-btn-text');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!formRateLimiter.isAllowed()) {
            const waitTime = Math.ceil(formRateLimiter.getRemainingTime() / 1000 / 60);
            showStatus(`អ្នកបានផ្ញើសារច្រើនពេក។ សូមរង់ចាំ ${waitTime} នាទីទៀត។`, 'error');
            return;
        }

        const formData = {
            name: form.elements['name'].value,
            email: form.elements['email'].value,
            phonenumber: form.elements['phonenumber'].value,
            message: form.elements['message'].value
        };

        const validationErrors = Security.validateFormData(formData);
        if (validationErrors.length > 0) {
            showStatus(validationErrors.join(' '), 'error');
            return;
        }

        submitBtn.disabled = true;
        btnText.textContent = 'កំពុងផ្ញើ...';
        showStatus('', '');

        try {
            // Data is sanitized server-side
            const response = await fetch('/.netlify/functions/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showStatus('សូមអរគុណ! សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ។', 'success');
                form.reset();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server error.');
            }
        } catch (error) {
            showStatus('មានបញ្ហាក្នុងការផ្ញើសារ។ សូមព្យាយាមម្តងទៀត។', 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'ផ្ញើសារទៅ Telegram';
        }
    });

    function showStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
    }
}
