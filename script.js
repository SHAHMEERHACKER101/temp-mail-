const API_URL = 'https://api.mail.tm';
let currentEmail = localStorage.getItem('temp_mail_address') || '';
let currentToken = localStorage.getItem('temp_mail_token') || '';
let currentAccountId = localStorage.getItem('temp_mail_id') || '';
let emailCheckInterval;

// Elements
const emailInput = document.getElementById('temp-email');
const copyBtn = document.getElementById('copy-btn');
const refreshBtn = document.getElementById('refresh-btn');
const changeBtn = document.getElementById('change-btn');
const copyMsg = document.getElementById('copy-msg');
const inboxBody = document.getElementById('inbox-body');
const messageModal = document.getElementById('message-modal');
const closeModal = document.querySelector('.close-modal');

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    if (!currentEmail || !currentToken) {
        await generateNewEmail();
    } else {
        emailInput.value = currentEmail;
        fetchMessages();
    }
    startPolling();
});

// Generate new email using Mail.tm (More stable)
async function generateNewEmail() {
    console.log('Generating new email via Mail.tm...');
    emailInput.value = "Generating...";

    try {
        // 1. Get Domain
        const domainRes = await fetch(`${API_URL}/domains`);
        const domains = await domainRes.json();
        const domain = domains['hydra:member'][0].domain;

        // 2. Create Account
        const randomUser = Math.random().toString(36).substring(2, 12);
        const address = `${randomUser}@${domain}`;
        const password = 'Password@123'; // Static for temp use

        const createRes = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });

        if (!createRes.ok) throw new Error('Failed to create account');
        const account = await createRes.json();

        // 3. Get Token
        const tokenRes = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });
        const tokenData = await tokenRes.json();

        updateEmailState(address, tokenData.token, account.id);
    } catch (error) {
        console.error('API Error:', error);
        emailInput.value = "API Error. Try again.";
    }
}

function updateEmailState(email, token, id) {
    currentEmail = email;
    currentToken = token;
    currentAccountId = id;
    localStorage.setItem('temp_mail_address', email);
    localStorage.setItem('temp_mail_token', token);
    localStorage.setItem('temp_mail_id', id);

    emailInput.value = email;
    inboxBody.innerHTML = `<tr><td colspan="3" class="empty-state"><div class="empty-icon">📥</div><p>New inbox ready. Waiting for messages...</p></td></tr>`;
    fetchMessages();
}

async function fetchMessages() {
    if (!currentToken) return;

    try {
        const response = await fetch(`${API_URL}/messages`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        updateInboxUI(data['hydra:member']);
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

function updateInboxUI(messages) {
    if (!messages || messages.length === 0) {
        if (inboxBody.querySelector('.empty-state') && inboxBody.children.length === 1) return;
        inboxBody.innerHTML = `<tr><td colspan="3" class="empty-state"><div class="empty-icon">📥</div><p>Your inbox is empty. Waiting...</p></td></tr>`;
        return;
    }

    inboxBody.innerHTML = '';
    messages.forEach(msg => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${msg.from.address}</strong></td>
            <td>${msg.subject || '(No Subject)'}</td>
            <td>${new Date(msg.createdAt).toLocaleTimeString()}</td>
        `;
        row.addEventListener('click', () => openMessage(msg.id));
        inboxBody.appendChild(row);
    });
}

async function openMessage(id) {
    try {
        const response = await fetch(`${API_URL}/messages/${id}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        document.getElementById('modal-subject').innerText = data.subject || '(No Subject)';
        document.getElementById('modal-from').innerText = data.from.address;
        document.getElementById('modal-date').innerText = new Date(data.createdAt).toLocaleString();

        // Use html if available, otherwise intro/text
        const bodyContent = data.html ? data.html[0] : data.intro;
        document.getElementById('modal-body').innerHTML = bodyContent;

        messageModal.style.display = 'block';
    } catch (error) {
        console.error('Error reading message:', error);
    }
}

function startPolling() {
    if (emailCheckInterval) clearInterval(emailCheckInterval);
    emailCheckInterval = setInterval(fetchMessages, 5000);
}

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentEmail).then(() => {
        copyMsg.classList.add('show');
        setTimeout(() => copyMsg.classList.remove('show'), 2000);
    });
});

refreshBtn.addEventListener('click', () => {
    fetchMessages();
    const btnIcon = refreshBtn.querySelector('.btn-icon');
    btnIcon.style.animation = 'none';
    btnIcon.offsetHeight;
    btnIcon.style.animation = 'spin 1s linear';
});

changeBtn.addEventListener('click', () => generateNewEmail());
closeModal.addEventListener('click', () => messageModal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target == messageModal) messageModal.style.display = 'none'; });

const style = document.createElement('style');
style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
