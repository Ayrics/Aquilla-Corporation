// Shared script for login flow and dashboard file viewing.
// Uses sessionStorage to track authentication state and a global interaction delay.

const AUTH_KEY = 'moonshine_auth'; // value 'cassandra' when authenticated
const REQUIRED_PASSWORD = 'MOONSHINE'; // exact match required
const INTERACTION_DELAY = 3000; // ms - 3 seconds loading between interactions

document.addEventListener('DOMContentLoaded', () => {
  // Login page elements (if present)
  const initBtn = document.getElementById('initBtn');
  const connStatus = document.getElementById('conn-status');
  const passForm = document.getElementById('passForm');
  const passError = document.getElementById('passError');
  const logoutAfter = document.getElementById('logoutAfter');
  const enterDash = document.getElementById('enterDash');

  if (initBtn) {
    // If user is already authenticated, skip to welcome
    if (sessionStorage.getItem(AUTH_KEY) === 'cassandra') {
      showWelcome();
    }

    initBtn.addEventListener('click', async () => {
      initBtn.disabled = true;
      setLoading(true);
      connStatus.textContent = 'Initializing...';
      initBtn.textContent = 'Connecting…';
      await delay(INTERACTION_DELAY);
      setLoading(false);
      connStatus.textContent = 'Connected';
      initBtn.classList.add('hidden');
      showPasswordStep();
    });

    passForm && passForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      passError.classList.add('hidden');
      const pw = (document.getElementById('password').value || '').trim();
      if (!pw) {
        showError('Please enter a password.');
        return;
      }

      setLoading(true);
      connStatus && (connStatus.textContent = 'Authenticating...');
      await delay(INTERACTION_DELAY);

      if (pw === REQUIRED_PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, 'cassandra');
        setLoading(false);
        setLoading(true);
        await delay(INTERACTION_DELAY);
        setLoading(false);
        showWelcome();
      } else {
        setLoading(false);
        showError('Incorrect Password. Authorities have been informed.');
      }
    });

    document.getElementById('resetBtn')?.addEventListener('click', () => {
      document.getElementById('password').value = '';
      passError.classList.add('hidden');
      document.getElementById('step-pass')?.classList.add('hidden');
      document.getElementById('step-init')?.classList.remove('hidden');
      initBtn.classList.remove('hidden');
      initBtn.disabled = false;
      connStatus.textContent = 'Disconnected';
      initBtn.textContent = 'Initiate connection';
    });

    logoutAfter?.addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      document.getElementById('password').value = '';
      passError.classList.add('hidden');
      document.getElementById('step-welcome')?.classList.add('hidden');
      document.getElementById('step-init')?.classList.remove('hidden');
      connStatus.textContent = 'Disconnected';
      initBtn.classList.remove('hidden');
      initBtn.disabled = false;
      initBtn.textContent = 'Initiate connection';
    });

    enterDash?.addEventListener('click', async (e) => {
      e.preventDefault();
      setLoading(true);
      await delay(INTERACTION_DELAY);
      setLoading(false);
      window.location.href = 'dashboard.html';
    });
  }

  // Dashboard page protection & file viewer
  const logoutBtn = document.getElementById('logout');
  const fileItems = document.getElementById('fileItems');
  const viewer = document.getElementById('viewerContainer');
  const downloadLink = document.getElementById('downloadLink');

  if (logoutBtn) {
    if (sessionStorage.getItem(AUTH_KEY) !== 'cassandra') {
      window.location.href = 'index.html';
      return;
    }

    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.href = 'index.html';
    });

    // file click handling
    fileItems?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-path]');
      if (!btn) return;
      const path = btn.getAttribute('data-path');
      setLoading(true);
      if (viewer) viewer.textContent = 'Loading…';
      await delay(INTERACTION_DELAY);
      await openFile(path);
      setLoading(false);
    });
  }
});

// small helpers

function delay(ms){ return new Promise(res => setTimeout(res, ms)); }

function setLoading(on){
  if (on) document.body.classList.add('loading');
  else document.body.classList.remove('loading');
}

function showPasswordStep(){
  const stepPass = document.getElementById('step-pass');
  const stepInit = document.getElementById('step-init');
  if (stepPass && stepInit) {
    stepInit.classList.add('hidden');
    stepPass.classList.remove('hidden');
    stepPass.removeAttribute('aria-hidden');
    const pw = document.getElementById('password');
    if (pw) pw.focus();
  }
}

function showWelcome(){
  const stepPass = document.getElementById('step-pass');
  const stepWelcome = document.getElementById('step-welcome');
  const stepInit = document.getElementById('step-init');
  if (stepPass) stepPass.classList.add('hidden');
  if (stepInit) stepInit.classList.add('hidden');
  if (stepWelcome) {
    stepWelcome.classList.remove('hidden');
    stepWelcome.removeAttribute('aria-hidden');
  }
}

// show error text
function showError(msg){
  const passError = document.getElementById('passError');
  if (passError) {
    passError.textContent = msg;
    passError.classList.remove('hidden');
  }
}

// Dashboard file viewer fetch
async function openFile(path){
  const viewer = document.getElementById('viewerContainer');
  const downloadLink = document.getElementById('downloadLink');
  if (!viewer) return;
  try {
    const res = await fetch(path, {cache: "no-store"});
    if (!res.ok) throw new Error('Not found');
    const text = await res.text();

    viewer.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = text;
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordBreak = 'break-word';
    viewer.appendChild(pre);

    downloadLink.href = path;
    downloadLink.download = path.split('/').pop();
    downloadLink.classList.remove('hidden');
  } catch (err) {
    viewer.textContent = 'Failed to load file.';
    downloadLink.classList.add('hidden');
  }
}
