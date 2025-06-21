let recaptchaPassed = false; // This variable is no longer used by the new form logic, but may be used elsewhere.

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
    setupContactForm(); // This will now use the updated function below
    setupPerformanceObservers();
}

/**
 * Sets up theme switching functionality (light/dark mode).
 */
function setupTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    const docElement = document.documentElement;
    const setTheme = (theme) => {
        docElement.setAttribute("data-theme", theme);
    };

    // Set initial theme to dark as default
    setTheme("dark");

    themeToggle.addEventListener("click", () => {
        const currentTheme = docElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(newTheme);
    });
}

/**
 * Sets up the mobile navigation menu toggle.
 */
function setupMenu() {
    const menuIcon = document.getElementById("menu-icon");
    const navLinks = document.getElementById("nav-links");

    if (menuIcon && navLinks) {
        menuIcon.addEventListener("click", () => {
            const isExpanded = menuIcon.getAttribute("aria-expanded") === "true";
            navLinks.classList.toggle("active");
            menuIcon.setAttribute("aria-expanded", String(!isExpanded));
        });

        // Close menu when a link is clicked
        navLinks.addEventListener("click", (e) => {
            if (e.target.tagName === "A" && navLinks.classList.contains("active")) {
                navLinks.classList.remove("active");
                menuIcon.setAttribute("aria-expanded", "false");
            }
        });
    }
}

/**
 * Adds a ripple effect to specified card elements on click.
 */
function setupRippleEffect() {
    document.querySelectorAll(".glass-card, .skill-card").forEach(card => {
        card.addEventListener("click", function(e) {
            // Do not trigger ripple if a link inside the card is clicked
            if (e.target.closest("a")) return;

            const rect = card.getBoundingClientRect();
            const ripple = document.createElement("span");
            
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            ripple.classList.add("ripple");
            
            const existingRipple = card.querySelector(".ripple");
            if (existingRipple) {
                existingRipple.remove();
            }
            
            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * Creates and appends animated particles to the background.
 * @param {number} count - The number of particles to create.
 */
function createParticles(count) {
    const container = document.getElementById("particle-container");
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");

        const size = Math.random() * 4 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        container.appendChild(particle);
    }
}

/**
 * Sets up scroll-triggered animations for sections.
 */
function setupScrollAnimations() {
    const hiddenSections = document.querySelectorAll(".hidden-section");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.1 });

    hiddenSections.forEach(section => observer.observe(section));
}

/**
 * Sets up lazy loading for images.
 */
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll(".lazy-image");
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const skeleton = img.parentElement;
                
                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add("loaded");
                    if (skeleton.classList.contains("image-skeleton")) {
                        skeleton.classList.add("loaded");
                    }
                };
                img.onerror = () => {
                    if (skeleton.classList.contains("image-skeleton")) {
                        skeleton.classList.add("error");
                    }
                };
                
                observer.unobserve(img);
            }
        });
    }, { rootMargin: "0px 0px 200px 0px" });

    lazyImages.forEach(image => observer.observe(image));
}

/**
 * Optimizes performance by pausing animations when they are not visible.
 */
function setupPerformanceObservers() {
    const particleContainer = document.getElementById("particle-container");
    const greetingText = document.getElementById("greeting-text");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const target = entry.target;
            if (entry.isIntersecting) {
                target.classList.add("animations-active");
            } else {
                target.classList.remove("animations-active");
            }
        });
    }, { threshold: 0 });

    if (particleContainer) observer.observe(particleContainer);
    if (greetingText) observer.observe(greetingText);
}


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

    appendMessage("user", message);
    chatbotInput.value = "";
    chatbotInput.disabled = true;
    chatbotSend.disabled = true;
    showTypingIndicator();

    try {
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

// ==================================================================
// == THIS IS THE UPDATED FUNCTION FOR THE CONTACT FORM
// ==================================================================
/**
 * SECURED: Sets up the contact form with comprehensive client-side validation and reCAPTCHA.
 */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('form-submit-btn');
    const btnText = submitBtn.querySelector('.submit-btn-text');
    
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Prevent multiple submissions while processing
        if (submitBtn.disabled) return;

        // Rate limiting check
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
        btnText.textContent = 'កំពុងផ្ទៀងផ្ទាត់...';
        showStatus('', '');

        // Execute reCAPTCHA and then submit
        grecaptcha.ready(function() {
            grecaptcha.execute('6Ler0WUrAAAAAErDAoO4ENDVZBHtEs6Gr7cWFR-b', { action: 'submit' }).then(async function(token) {
                
                // Add the token to our form data
                formData['g-recaptcha-response'] = token;
                
                btnText.textContent = 'កំពុងផ្ញើ...';

                try {
                    const response = await fetch('/.netlify/functions/sendMessage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        showStatus('សូមអរគុណ! សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ។', 'success');
                        form.reset();
                    } else {
                        // Display error message from server
                        throw new Error(result.error || 'Server error.');
                    }
                } catch (error) {
                    showStatus(error.message || 'មានបញ្ហាក្នុងការផ្ញើសារ។ សូមព្យាយាមម្តងទៀត។', 'error');
                } finally {
                    // Re-enable the button
                    submitBtn.disabled = false;
                    btnText.textContent = 'ផ្ញើសារទៅ Telegram';
                }
            });
        });
    });

    function showStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
        // Make it visible
        if (message) {
            formStatus.style.display = 'block';
        } else {
            formStatus.style.display = 'none';
        }
    }
}
