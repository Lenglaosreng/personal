/**
 * Main entry point. Waits for the DOM to be fully loaded before running any scripts.
 */
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

/**
 * Initializes all the interactive and dynamic features of the page.
 */
function initializePage() {
    setupTheme();
    setupMenu();
    setupRippleEffect();
    createParticles(30); // PERFORMANCE: Reduced particle count
    setupScrollAnimations();
    setupLazyLoading();
    initializeChatbot();
    setupContactForm();
    setupPerformanceObservers(); // PERFORMANCE: New observer for animations
}

/**
 * Sets up the theme toggle functionality.
 * FIX: Removed localStorage as it's not available in the execution environment.
 * The theme will default to 'dark' on each load.
 */
function setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const htmlElement = document.documentElement;

    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
    };

    // Defaults to dark theme every time
    applyTheme('dark');

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}


/**
 * Sets up the mobile navigation menu toggle.
 */
function setupMenu() {
    const menuButton = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');

    if (!menuButton || !navLinks) return;

    menuButton.addEventListener('click', () => {
        const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
        navLinks.classList.toggle('active');
        menuButton.setAttribute('aria-expanded', String(!isExpanded));
    });

    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuButton.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Adds a ripple effect on click to elements.
 */
function setupRippleEffect() {
    document.querySelectorAll('.glass-card, .skill-card').forEach(element => {
        element.addEventListener('click', function (e) {
            if (e.target.closest('a')) return;
            const rect = element.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            ripple.classList.add('ripple');

            const existingRipple = element.querySelector('.ripple');
            if (existingRipple) existingRipple.remove();

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/**
 * Generates animated particles in the background.
 */
function createParticles(count) {
    const container = document.getElementById('particle-container');
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
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
 * Sets up scroll animations for hidden sections.
 */
function setupScrollAnimations() {
    const hiddenSections = document.querySelectorAll('.hidden-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    hiddenSections.forEach(section => observer.observe(section));
}

/**
 * Sets up lazy loading for images.
 */
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const parentSkeleton = img.parentElement;

                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add('loaded');
                    if (parentSkeleton.classList.contains('image-skeleton')) {
                        parentSkeleton.classList.add('loaded');
                    }
                };
                img.onerror = () => {
                    if (parentSkeleton.classList.contains('image-skeleton')) {
                        parentSkeleton.classList.add('error');
                    }
                };
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '0px 0px 200px 0px' });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/**
 * PERFORMANCE FIX: Pauses animations that are not on screen.
 */
function setupPerformanceObservers() {
    const particleContainer = document.getElementById('particle-container');
    const greetingText = document.getElementById('greeting-text');

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const targetElement = entry.target;
            if (entry.isIntersecting) {
                targetElement.classList.add('animations-active');
            } else {
                targetElement.classList.remove('animations-active');
            }
        });
    }, { threshold: 0 });

    if (particleContainer) animationObserver.observe(particleContainer);
    if (greetingText) animationObserver.observe(greetingText);
}


/**
 * Initializes the chatbot functionality.
 */
function initializeChatbot() {
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbotPopup = document.getElementById("chatbot-popup");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSend = document.getElementById("chatbot-send");

    if (!chatbotToggle || !chatbotPopup || !chatbotInput || !chatbotSend) return;

    chatbotToggle.addEventListener("click", () => {
        chatbotPopup.classList.toggle("open");
        if (chatbotPopup.classList.contains("open")) {
            chatbotInput.focus();
            const chatbotBody = document.getElementById("chatbot-body");
            if (chatbotBody.children.length === 0) {
                appendMessage("bot", "សួស្តី! ខ្ញុំជា SrengBot។ តើខ្ញុំអាចជួយអ្នកយ៉ាងណាបាន?");
            }
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

function appendMessage(role, text) {
    const chatbotBody = document.getElementById("chatbot-body");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}`;
    msgDiv.innerText = `${role === "user" ? "អ្នក៖" : "🤖៖"} ${text}`;
    chatbotBody.appendChild(msgDiv);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
    msgDiv.style.opacity = "0";
    setTimeout(() => msgDiv.style.opacity = "1", 50);
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

async function sendMessage() {
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSend = document.getElementById("chatbot-send");
    const message = chatbotInput.value.trim();
    if (!message || chatbotSend.disabled) return;

    appendMessage("user", message);
    chatbotInput.value = "";

    chatbotInput.disabled = true;
    chatbotSend.disabled = true;
    showTypingIndicator();

    try {
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Request failed with status: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.reply || "សូមអភ័យទោស! ខ្ញុំមិនអាចឆ្លើយតបបាននាពេលនេះទេ។";

        removeTypingIndicator();
        appendMessage("bot", reply);

    } catch (err) {
        console.error("Chatbot error:", err);
        removeTypingIndicator();
        const userFriendlyError = (err.message.includes("failed to fetch"))
            ? "មិនអាចតភ្ជាប់ទៅកាន់ Server បានទេ។ សូមពិនិត្យមើលអ៊ីនធឺណិតរបស់អ្នក។"
            : `មានបញ្ហាមួយបានកើតឡើង: ${err.message}`;
        appendMessage("bot", `❌ ${userFriendlyError}`);
    } finally {
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
        chatbotInput.focus();
    }
}

/**
 * Sets up the contact form to submit to a Netlify function for Telegram.
 */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('form-submit-btn');
    const btnText = submitBtn.querySelector('.submit-btn-text');
    const emailInput = form.elements['email'];

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = form.elements['name'].value.trim();
        const email = emailInput.value.trim();
        const phonenumber = form.elements['phonenumber'].value.trim();
        const message = form.elements['message'].value.trim();

        if (!name || !message) {
            showStatus('សូមបំពេញឈ្មោះ និងសាររបស់អ្នក។', 'error');
            return;
        }
        if (email && !validateEmail(email)) {
            showStatus('ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវទេ។ សូមពិនិត្យម្តងទៀត។', 'error');
            return;
        }

        submitBtn.disabled = true;
        btnText.textContent = 'កំពុងផ្ញើ...';
        showStatus('', '');

        try {
            const response = await fetch('/.netlify/functions/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phonenumber, message })
            });

            if (response.ok) {
                showStatus('សូមអរគុណ! សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ។', 'success');
                form.reset();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error. Please try again.');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showStatus(`មានបញ្ហា: ${error.message}`, 'error');
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
