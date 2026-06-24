/**
 * RichMail Frontend Application
 */

// State
let currentAddress = localStorage.getItem('tempmail_address') || '';
let currentEmailId = null;
let autoRefreshInterval = null;
let currentEmailData = null;

// DOM Elements
const elements = {
  emailAddress: document.getElementById('emailAddress'),
  copyBtn: document.getElementById('copyBtn'),
  domainSelect: document.getElementById('domainSelect'),
  generateBtn: document.getElementById('generateBtn'),
  customUsername: document.getElementById('customUsername'),
  customDomainLabel: document.getElementById('customDomainLabel'),
  customBtn: document.getElementById('customBtn'),
  emailList: document.getElementById('emailList'),
  emailCount: document.getElementById('emailCount'),
  refreshBtn: document.getElementById('refreshBtn'),
  deleteAllBtn: document.getElementById('deleteAllBtn'),
  autoRefresh: document.getElementById('autoRefresh'),
  emailModal: document.getElementById('emailModal'),
  backBtn: document.getElementById('backBtn'),
  deleteEmailBtn: document.getElementById('deleteEmailBtn'),
  emailFrom: document.getElementById('emailFrom'),
  emailTo: document.getElementById('emailTo'),
  emailSubject: document.getElementById('emailSubject'),
  emailDate: document.getElementById('emailDate'),
  emailBody: document.getElementById('emailBody'),
  tabText: document.getElementById('tabText'),
  tabHtml: document.getElementById('tabHtml'),
  tabSource: document.getElementById('tabSource'),
  activeDomains: document.getElementById('activeDomains'),
  emailExpiry: document.getElementById('emailExpiry')
};



// API Helper
async function api(endpoint, options = {}) {
  try {
    const res = await fetch('/api' + endpoint, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    return await res.json();
  } catch (err) {
    showToast('Connection error', 'error');
    return null;
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}



// Load domains
async function loadDomains() {
  const data = await api('/domains');
  if (data && data.domains) {
    elements.domainSelect.innerHTML = '';
    data.domains.forEach(domain => {
      const opt = document.createElement('option');
      opt.value = domain;
      opt.textContent = domain;
      elements.domainSelect.appendChild(opt);
    });
    updateCustomDomainLabel();
  }
}

// Load config info
async function loadConfig() {
  const data = await api('/config');
  if (data) {
    if (elements.activeDomains) elements.activeDomains.textContent = data.domains.join(', ');
    if (elements.emailExpiry) elements.emailExpiry.textContent = data.expiryMinutes;
  }
}

// Update custom domain label
function updateCustomDomainLabel() {
  const domain = elements.domainSelect.value;
  elements.customDomainLabel.textContent = '@' + domain;
}

// Generate new email address
async function generateAddress() {
  const domain = elements.domainSelect.value;
  const data = await api('/generate?domain=' + encodeURIComponent(domain));
  if (data && data.address) {
    setAddress(data.address);
    showToast('New address generated!');
  }
}

// Use custom address
async function useCustomAddress() {
  const username = elements.customUsername.value.trim();
  if (!username) {
    showToast('Please enter a username', 'error');
    return;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    showToast('Invalid username. Use letters, numbers, dots, hyphens', 'error');
    return;
  }
  const domain = elements.domainSelect.value;
  const address = username + '@' + domain;
  const data = await api('/mailbox', {
    method: 'POST',
    body: JSON.stringify({ address })
  });
  if (data && data.address) {
    setAddress(data.address);
    showToast('Custom address set!');
  } else if (data && data.error) {
    showToast(data.error, 'error');
  }
}

// Set current address
function setAddress(address) {
  currentAddress = address;
  elements.emailAddress.value = address;
  localStorage.setItem('tempmail_address', address);
  loadEmails();
}



// Load emails for current address
async function loadEmails() {
  if (!currentAddress) {
    renderEmptyInbox();
    return;
  }
  const data = await api('/emails?address=' + encodeURIComponent(currentAddress));
  if (data) {
    elements.emailCount.textContent = data.count;
    if (data.count === 0) {
      renderEmptyInbox();
    } else {
      renderEmailList(data.emails);
    }
  }
}

// Render empty inbox
function renderEmptyInbox() {
  elements.emailList.innerHTML = `
    <div class="empty-inbox">
      <p>&#128236; No emails yet</p>
      <p class="hint">Waiting for incoming emails...</p>
    </div>
  `;
  elements.emailCount.textContent = '0';
}

// Render email list
function renderEmailList(emails) {
  elements.emailList.innerHTML = '';
  emails.forEach(email => {
    const item = document.createElement('div');
    item.className = 'email-item' + (email.read ? '' : ' unread');
    item.innerHTML = `
      <div class="email-item-content">
        <div class="email-item-from">${escapeHtml(email.from)}</div>
        <div class="email-item-subject">${escapeHtml(email.subject)}</div>
      </div>
      <div class="email-item-date">${formatDate(email.date)}</div>
    `;
    item.addEventListener('click', () => openEmail(email.id));
    elements.emailList.appendChild(item);
  });
}

// Escape HTML
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Open email detail
async function openEmail(id) {
  const data = await api('/email/' + id);
  if (data && data.email) {
    currentEmailId = id;
    currentEmailData = data.email;
    elements.emailFrom.textContent = data.email.from;
    elements.emailTo.textContent = data.email.to;
    elements.emailSubject.textContent = data.email.subject;
    elements.emailDate.textContent = new Date(data.email.date).toLocaleString();
    showEmailBody('text');
    elements.emailModal.classList.remove('hidden');
    // Refresh list to update read status
    loadEmails();
  }
}

// Show email body based on tab
function showEmailBody(tab) {
  if (!currentEmailData) return;
  // Update active tab
  elements.tabText.classList.toggle('active', tab === 'text');
  elements.tabHtml.classList.toggle('active', tab === 'html');
  elements.tabSource.classList.toggle('active', tab === 'source');

  if (tab === 'text') {
    elements.emailBody.textContent = currentEmailData.body || '(No text content)';
  } else if (tab === 'html') {
    if (currentEmailData.html) {
      elements.emailBody.innerHTML = currentEmailData.html;
    } else {
      elements.emailBody.textContent = '(No HTML content)';
    }
  } else {
    elements.emailBody.textContent = 
      `From: ${currentEmailData.from}\nTo: ${currentEmailData.to}\nSubject: ${currentEmailData.subject}\nDate: ${currentEmailData.date}\n\n${currentEmailData.body}`;
  }
}



// Close email modal
function closeEmail() {
  elements.emailModal.classList.add('hidden');
  currentEmailId = null;
  currentEmailData = null;
}

// Delete current email
async function deleteCurrentEmail() {
  if (!currentEmailId) return;
  await api('/email/' + currentEmailId, { method: 'DELETE' });
  closeEmail();
  loadEmails();
  showToast('Email deleted');
}

// Delete all emails
async function deleteAllEmails() {
  if (!currentAddress) return;
  if (!confirm('Delete all emails in this inbox?')) return;
  await api('/emails?address=' + encodeURIComponent(currentAddress), { method: 'DELETE' });
  loadEmails();
  showToast('All emails deleted');
}

// Copy address to clipboard
function copyAddress() {
  if (!currentAddress) {
    showToast('No address to copy', 'error');
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentAddress).then(() => {
      showToast('Copied to clipboard!');
    });
  } else {
    elements.emailAddress.select();
    document.execCommand('copy');
    showToast('Copied to clipboard!');
  }
}

// Auto-refresh toggle
function toggleAutoRefresh() {
  if (elements.autoRefresh.checked) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshInterval = setInterval(() => {
    if (currentAddress) loadEmails();
  }, 5000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Event Listeners
elements.generateBtn.addEventListener('click', generateAddress);
elements.customBtn.addEventListener('click', useCustomAddress);
elements.copyBtn.addEventListener('click', copyAddress);
elements.refreshBtn.addEventListener('click', loadEmails);
elements.deleteAllBtn.addEventListener('click', deleteAllEmails);
elements.backBtn.addEventListener('click', closeEmail);
elements.deleteEmailBtn.addEventListener('click', deleteCurrentEmail);
elements.autoRefresh.addEventListener('change', toggleAutoRefresh);
elements.domainSelect.addEventListener('change', updateCustomDomainLabel);
elements.tabText.addEventListener('click', () => showEmailBody('text'));
elements.tabHtml.addEventListener('click', () => showEmailBody('html'));
elements.tabSource.addEventListener('click', () => showEmailBody('source'));

// Allow Enter key on custom username
elements.customUsername.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') useCustomAddress();
});

// Initialize
async function init() {
  await loadDomains();
  await loadConfig();
  if (currentAddress) {
    elements.emailAddress.value = currentAddress;
    loadEmails();
  }
  startAutoRefresh();
}

init();
