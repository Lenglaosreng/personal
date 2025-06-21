/**
 * Main entry point. Waits for the DOM to be fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Functions to setup the page aesthetics and base functionality
    setupTheme();
    setupMenu();
    setupRippleEffect();
    createParticles(30);
    setupScrollAnimations();
    setupLazyLoading();
    setupPerformanceObservers();
    
    // Initialize the new, upgraded chatbot
    initializeChatbotV2();
});


/* ======================================================================== */
/* CHATBOT V2 LOGIC                            */
/* ======================================================================== */
function initializeChatbotV2() {
    const elements = {
        toggleButton: document.getElementById("chatbot-toggle"),
        popup: document.getElementById("chatbot-popup"),
        body: document.getElementById("chatbot-body"),
        input: document.getElementById("chatbot-input"),
        sendButton: document.getElementById("chatbot-send"),
        apiStatus: document.getElementById("api-status"),
        apiStatusText: document.querySelector("#api-status p"),
    };

    if (Object.values(elements).some(el => !el)) {
        console.error("Chatbot V2 elements not found. Aborting initialization.");
        return;
    }

    let conversationHistory = [];
    const TYPING_INDICATOR_ID = 'typing-indicator';

    const setApiStatus = (status, text) => {
        elements.apiStatus.dataset.status = status;
        elements.apiStatusText.textContent = text;
    };

    const togglePopup = () => {
        const isOpen = elements.popup.classList.toggle('open');
        elements.toggleButton.classList.toggle('open');
        if (isOpen) {
            elements.input.focus();
        }
    };
    
    const appendMessage = (role, text) => {
        removeTypingIndicator();
        const messageId = `msg-${Date.now()}`;
        const avatarSrc = role === 'user' 
            ? 'https://placehold.co/35x35/00f5ff/0f0c29?text=U' 
            : 'https://placehold.co/35x35/74ee15/0f0c29?text=S';

        const messageHTML = `
            <div class="message-container ${role}" id="${messageId}">
                <div class="message-avatar">
                    <img src="${avatarSrc}" alt="${role} avatar">
                </div>
                <div class="message-bubble">${text}</div>
            </div>
        `;
        elements.body.insertAdjacentHTML('beforeend', messageHTML);
        elements.body.scrollTop = elements.body.scrollHeight;
        return messageId;
    };

    const showTypingIndicator = () => {
        if (document.getElementById(TYPING_INDICATOR_ID)) return;
        const typingHTML = `
            <div class="message-container bot typing-indicator" id="${TYPING_INDICATOR_ID}">
                <div class="message-avatar">
                    <img src="https://placehold.co/35x35/74ee15/0f0c29?text=S" alt="SrengBot avatar">
                </div>
                <div class="message-bubble">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </div>
        `;
        elements.body.insertAdjacentHTML('beforeend', typingHTML);
        elements.body.scrollTop = elements.body.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const indicator = document.getElementById(TYPING_INDICATOR_ID);
        if (indicator) indicator.remove();
    };

    const sendMessage = async () => {
        const messageText = elements.input.value.trim();
        if (!messageText || elements.sendButton.disabled) return;
        
        // Append user message to UI and history
        appendMessage('user', messageText);
        conversationHistory.push({ role: 'user', content: messageText });
        saveHistory();

        // Clear input and disable form
        elements.input.value = '';
        elements.input.style.height = 'auto'; // Reset height
        elements.input.disabled = true;
        elements.sendButton.disabled = true;
        showTypingIndicator();

        try {
            const response = await fetch("/.netlify/functions/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: conversationHistory })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "An unknown error occurred.");
            }
            
            const data = await response.json();
            const botReply = data.reply;

            // Append bot message to UI and history
            appendMessage('bot', botReply);
            conversationHistory.push({ role: 'assistant', content: botReply });
            saveHistory();
            setApiStatus('online', 'Online');

        } catch (err) {
            console.error("Error sending message:", err);
            appendMessage('bot', `ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`);
            setApiStatus('error', 'Connection Error');
        } finally {
            elements.input.disabled = false;
            elements.sendButton.disabled = false;
            elements.input.focus();
        }
    };
    
    const saveHistory = () => {
        sessionStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
    };

    const loadHistory = () => {
        const savedHistory = sessionStorage.getItem('chatHistory');
        if (savedHistory) {
            conversationHistory = JSON.parse(savedHistory);
            elements.body.innerHTML = ''; // Clear existing messages
            conversationHistory.forEach(msg => appendMessage(msg.role, msg.content));
        } else {
            // Add a welcome message if no history
            const welcomeText = "សួស្តី! ខ្ញុំ SrengBot ដែលដំណើរការដោយ LLaMA 3 70B។ តើខ្ញុំអាចជួយអ្វីបានខ្លះ?";
            appendMessage('bot', welcomeText);
            conversationHistory.push({ role: 'assistant', content: welcomeText });
            saveHistory();
        }
    };

    const handleInput = () => {
        elements.input.style.height = 'auto';
        elements.input.style.height = `${elements.input.scrollHeight}px`;
    };

    // Event Listeners
    elements.toggleButton.addEventListener("click", togglePopup);
    elements.sendButton.addEventListener("click", sendMessage);
    elements.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    elements.input.addEventListener('input', handleInput);

    // Initial setup
    loadHistory();
    setApiStatus('online', 'Online'); // Assume online initially
}


/* ======================================================================== */
/* Standard Page Setup Functions (Unchanged)                */
/* ======================================================================== */

function setupTheme(){const e=document.getElementById("theme-toggle");if(!e)return;const t=document.documentElement,n=e=>{t.setAttribute("data-theme",e)};n("dark"),e.addEventListener("click",()=>{const e=t.getAttribute("data-theme");n("dark"===e?"light":"dark")})}
function setupMenu(){const e=document.getElementById("menu-icon"),t=document.getElementById("nav-links");e&&t&&(e.addEventListener("click",()=>{const n=e.getAttribute("aria-expanded")==="true";t.classList.toggle("active"),e.setAttribute("aria-expanded",String(!n))}),t.addEventListener("click",n=>{"A"===n.target.tagName&&t.classList.contains("active")&&(t.classList.remove("active"),e.setAttribute("aria-expanded","false"))}))}
function setupRippleEffect(){document.querySelectorAll(".glass-card, .skill-card").forEach(e=>{e.addEventListener("click",function(t){if(t.target.closest("a"))return;const n=e.getBoundingClientRect(),o=document.createElement("span");o.style.left=`${t.clientX-n.left}px`,o.style.top=`${t.clientY-n.top}px`,o.classList.add("ripple");const a=e.querySelector(".ripple");a&&a.remove(),this.appendChild(o),setTimeout(()=>{o.remove()},600)})})}
function createParticles(e){const t=document.getElementById("particle-container");if(!t)return;for(let n=0;n<e;n++){const e=document.createElement("div");e.classList.add("particle");const o=4*Math.random()+1;e.style.width=`${o}px`,e.style.height=`${o}px`,e.style.top=`${100*Math.random()}%`,e.style.left=`${100*Math.random()}%`,e.style.animationDuration=`${5*Math.random()+5}s`,e.style.animationDelay=`${5*Math.random()}s`,t.appendChild(e)}}
function setupScrollAnimations(){const e=document.querySelectorAll(".hidden-section"),t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&e.target.classList.add("visible")})},{threshold:.1});e.forEach(e=>t.observe(e))}
function setupLazyLoading(){const e=document.querySelectorAll(".lazy-image"),t=new IntersectionObserver((e,n)=>{e.forEach(e=>{if(e.isIntersecting){const t=e.target,o=t.parentElement;t.src=t.dataset.src,t.onload=()=>{t.classList.add("loaded"),o.classList.contains("image-skeleton")&&o.classList.add("loaded")},t.onerror=()=>{o.classList.contains("image-skeleton")&&o.classList.add("error")},n.unobserve(t)}})},{rootMargin:"0px 0px 200px 0px"});e.forEach(e=>t.observe(e))}
function setupPerformanceObservers(){const e=document.getElementById("particle-container"),t=document.getElementById("greeting-text"),n=new IntersectionObserver(e=>{e.forEach(e=>{const t=e.target;e.isIntersecting?t.classList.add("animations-active"):t.classList.remove("animations-active")})},{threshold:0});e&&n.observe(e),t&&n.observe(t)}
