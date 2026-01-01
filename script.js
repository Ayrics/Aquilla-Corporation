// Lightweight client-side behavior for demo accessibility and lockout logic
(function(){
  const yearEls = document.querySelectorAll('#year, #year-footer');
  yearEls.forEach(el => el && (el.textContent = new Date().getFullYear()));

  // Respect prefers-reduced-motion at runtime (for dynamic JS-driven motion)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Skeleton loader: reveal content after simulated load
  function revealSkeleton() {
    const skeletons = document.querySelectorAll('[data-skeleton]');
    skeletons.forEach(skel => {
      const content = skel.parentElement.querySelector('.content');
      // Short-circuit if already revealed
      if (!content || !content.classList.contains('hidden')) return;

      // Simulated network delay - shorter if reduced motion is preferred
      const delay = reduceMotion ? 200 : 900;

      setTimeout(() => {
        skel.setAttribute('aria-hidden', 'true');
        skel.classList.add('hidden');
        content.classList.remove('hidden');
        content.removeAttribute('aria-hidden');
        const status = document.getElementById('status-region');
        if (status) status.textContent = 'Dashboard loaded.';
      }, delay);
    });
  }

  // Simple lockout mechanism on login form (client-side demo only)
  function initAuthLockout() {
    const form = document.getElementById('login-form');
    const status = document.getElementById('auth-status');
    if (!form || !status) return;

    const KEY = 'aq_auth_failures_v1';
    const MAX_ATTEMPTS = 5;
    const LOCK_MINUTES = 5; // minutes

    function getState(){
      try{
        return JSON.parse(localStorage.getItem(KEY)) || {fails:0, lockedUntil:null};
      } catch(e){return {fails:0, lockedUntil:null};}
    }

    function setState(s){localStorage.setItem(KEY, JSON.stringify(s));}

    function failedAttempt(){
      const s = getState();
      s.fails = (s.fails || 0) + 1;
      if (s.fails >= MAX_ATTEMPTS){
        s.lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        s.fails = 0; // reset counter after lock
      }
      setState(s);
      updateStatus();
    }

    function resetAttempts(){
      setState({fails:0, lockedUntil:null});
      updateStatus();
    }

    function updateStatus(){
      const s = getState();
      if (s.lockedUntil && Date.now() < s.lockedUntil){
        const remaining = Math.ceil((s.lockedUntil - Date.now())/1000);
        status.hidden = false;
        status.textContent = `Too many failed attempts. Try again in ${remaining} seconds.`;
        // disable form controls
        Array.from(form.elements).forEach(el => el.disabled = true);
        // countdown to re-enable
        setTimeout(updateStatus, 1000);
      } else {
        status.hidden = true;
        Array.from(form.elements).forEach(el => el.disabled = false);
        // clear any stale lock
        if (s.lockedUntil) resetAttempts();
      }
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const state = getState();
      if (state.lockedUntil && Date.now() < state.lockedUntil){
        updateStatus();
        return;
      }

      // Demo: treat any password that isn't literally "password" as a failure
      const pwd = form.querySelector('#password').value || '';
      if (pwd === 'password'){
        // simulated success
        status.hidden = false;
        status.textContent = 'Signed in — redirecting to dashboard...';
        // small delay then navigate (if on index)
        setTimeout(() => { if (location.pathname.endsWith('index.html') || location.pathname === '/') location.href = '/dashboard.html'; }, 700);
      } else {
        failedAttempt();
        // provide immediate screenreader feedback
        status.hidden = false;
        status.textContent = 'Incorrect credentials. Please try again.';
      }
    });

    updateStatus();
  }

  // small helper to announce status changes for screen readers
  function initLiveRegion(){
    const liveEls = document.querySelectorAll('[aria-live]');
    liveEls.forEach(el => {
      // ensure they are focusable for assistive tech if needed
      if (!el.getAttribute('role')) el.setAttribute('role', 'status');
    });
  }

  // init on DOM ready
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => { revealSkeleton(); initAuthLockout(); initLiveRegion(); });
  } else {
    revealSkeleton(); initAuthLockout(); initLiveRegion();
  }
})();