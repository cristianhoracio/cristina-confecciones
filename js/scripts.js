// scripts.js (copied to /js) — same logic, kept robust
const cart = JSON.parse(localStorage.getItem('cart')||'[]');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
function formatPrice(p){ return '$' + Number(p).toLocaleString('es-AR'); }

function renderCart(){
  if(cartItems){
    cartItems.innerHTML = '';
  }

  if(cart.length===0){
    if(cartItems) cartItems.innerHTML = '<div style="color:var(--muted)">El carrito está vacío</div>';
    if(cartTotal) cartTotal.textContent = '$0';
    if(cartCount) cartCount.textContent = '0';
    return;
  }

  let total = 0; cart.forEach(item => {
    total += item.price * item.qty;
    if(cartItems){
      const el = document.createElement('div'); el.className='cart-item';
      el.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <div class="meta">
          <div style="font-weight:600">${item.name}</div>
          <div style="color:var(--muted);font-size:0.9rem">
            <button class="qty minus" data-id="${item.id}">-</button>
            <span class="qty-count">${item.qty}</span>
            <button class="qty plus" data-id="${item.id}">+</button>
            &nbsp; × ${formatPrice(item.price)}
          </div>
        </div>
        <div>
          <button data-id="${item.id}" class="remove">Eliminar</button>
        </div>
      `;
      cartItems.appendChild(el);
    }
  });

  if(cartTotal) cartTotal.textContent = formatPrice(total);
  if(cartCount) cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0);
}

function addToCart(productEl){
  if(!productEl) return;
  const id = productEl.dataset.id;
  const price = Number(productEl.dataset.price);
  const name = productEl.querySelector('h3') ? productEl.querySelector('h3').textContent : 'Producto';
  const image = productEl.querySelector('img') ? productEl.querySelector('img').src : '';
  const existing = cart.find(c=>c.id===id);
  if(existing){ existing.qty +=1; } else { cart.push({id,price,qty:1,name,image}); }
  saveCart(); renderCart();
}

// Attach add-to-cart buttons if present
document.querySelectorAll('.add-cart').forEach((btn)=>{
  btn.addEventListener('click', e=>{
    const product = e.target.closest('.product'); addToCart(product);
    if(cartPanel) { cartPanel.classList.add('open'); cartPanel.setAttribute('aria-hidden','false'); }
    // If on arreglos page, show the badge indicating items added from Arreglos
    if(window.location.pathname.includes('arreglos.html')){
      const total = cart.reduce((s,i)=>s+i.qty,0);
      // Update stored values but do not force-show if user dismissed the badge
      window.__updateActiveBadge && window.__updateActiveBadge('Arreglos', total, {from:'cart'});
    }
  });
});

// Cart open/close
if(document.getElementById('openCart')){
  document.getElementById('openCart').addEventListener('click', ()=>{
    if(!cartPanel) return;
    cartPanel.classList.toggle('open');
    const hidden = cartPanel.getAttribute('aria-hidden') === 'true';
    cartPanel.setAttribute('aria-hidden', hidden ? 'false' : 'true');
  });
}
if(document.getElementById('closeCart')){
  document.getElementById('closeCart').addEventListener('click', ()=>{ if(cartPanel){cartPanel.classList.remove('open'); cartPanel.setAttribute('aria-hidden','true')} });
}

// Cart interactions: remove, qty + / -
if(cartItems){
  cartItems.addEventListener('click', e=>{
    const id = e.target.dataset && e.target.dataset.id;
    if(e.target.classList.contains('remove')){
      const idx = cart.findIndex(i=>i.id===id); if(idx>-1){ cart.splice(idx,1); saveCart(); renderCart(); }
    }
    if(e.target.classList.contains('plus')){
      const item = cart.find(i=>i.id===id); if(item){ item.qty+=1; saveCart(); renderCart(); }
    }
    if(e.target.classList.contains('minus')){
      const item = cart.find(i=>i.id===id); if(item){ item.qty = Math.max(1, item.qty-1); saveCart(); renderCart(); }
    }
  });
}

// Checkout (fetch to /checkout) — demo-friendly and with graceful fallback
if(document.getElementById('checkout')){
  document.getElementById('checkout').addEventListener('click', async ()=>{
    if(cart.length===0){ alert('El carrito está vacío.'); return; }
    try{
      const resp = await fetch('/checkout', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({items:cart})
      });
      if(resp.ok){
        alert('Pedido enviado. Serás redirigido al pago (o el backend lo procesará).');
      } else {
        const text = await resp.text();
        alert('Respuesta del servidor: ' + (text||resp.status));
      }
    }catch(err){
      alert('No se pudo conectar con el servidor para el checkout. (Prueba la integración backend en /checkout)');
      console.error(err);
    }
  });
}

// Contact form submit via fetch to /contact (graceful fallback to normal submit if fetch fails)
const contactForm = document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const data = {
      name: this.name.value,
      email: this.email.value,
      message: this.message.value
    };
    try{
      const resp = await fetch(this.action || '/contact', {
        method: this.method || 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
      });
      if(resp.ok){ alert('Gracias, tu mensaje fue enviado.'); this.reset(); }
      else { const text = await resp.text(); alert('Error del servidor: ' + (text||resp.status)); }
    }catch(err){
      alert('No se pudo enviar (sin conexión al backend). El formulario seguirá usando el action cuando lo conectes.');
      console.error(err);
    }
  });
}

// Set active link based on location
(function setActiveNav(){
  const links = document.querySelectorAll('nav a');
  if(!links) return;
  const path = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a=>{
    const href = a.getAttribute('href');
    if(href && href.endsWith(path)){
      a.classList.add('active');
    }
  });
})();

// Attach fallback handler for images with data-fallback (covers cases where inline onerror wasn't added)
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('img[data-fallback]').forEach(img=>{
    if(!img.onerror){
      img.onerror = function(){ this.onerror = null; this.src = this.dataset.fallback; };
    }
  });

  // Shop search & filters + sorting + count
  const searchInput = document.getElementById('search');
  const filterButtons = document.querySelectorAll('.filter');
  const productEls = Array.from(document.querySelectorAll('.product'));
  const productsContainer = document.getElementById('products');
  const productCountEl = document.getElementById('productCount');
  const sortSelect = document.getElementById('sortSelect');

  function updateCount(visibleCount){
    if(productCountEl) productCountEl.textContent = `Mostrando ${visibleCount} producto${visibleCount!==1?'s':''}`;
  }

  function applyFilter(){
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const activeCat = document.querySelector('.filter.active')?.dataset.cat || 'all';
    let visible = 0;
    productEls.forEach(p=>{
      const name = p.querySelector('h3')?.textContent.toLowerCase() || '';
      const cat = p.dataset.category || '';
      const matchesQ = q === '' || name.includes(q);
      const matchesCat = activeCat === 'all' || cat === activeCat;
      const visibleNow = (matchesQ && matchesCat);
      p.style.display = visibleNow ? '' : 'none';
      if(visibleNow) visible++;
    });

    // Apply sort among visible items
    if(sortSelect && productsContainer){
      const opt = sortSelect.value;
      const visibleNodes = productEls.filter(p=>p.style.display !== 'none');
      if(opt === 'price-asc'){
        visibleNodes.sort((a,b)=>Number(a.dataset.price)-Number(b.dataset.price));
      } else if(opt === 'price-desc'){
        visibleNodes.sort((a,b)=>Number(b.dataset.price)-Number(a.dataset.price));
      }
      visibleNodes.forEach(n=>productsContainer.appendChild(n));
    }

    updateCount(visible);
    // Update active badge (category + visible count)
    if(window.__updateActiveBadge){ window.__updateActiveBadge(activeCat, visible); }
  }

  if(searchInput){
    searchInput.addEventListener('input', applyFilter);
  }
  filterButtons.forEach(b=>{
    b.addEventListener('click', ()=>{
      filterButtons.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      applyFilter();
    });
  });

  if(sortSelect){
    sortSelect.addEventListener('change', applyFilter);
  }

  // initialize count
  applyFilter();

  // Add small gallery-count badges to product cards (shows number of images)
  document.querySelectorAll('.product').forEach(p=>{
    const imgs = (p.dataset.images||'').split(',').map(s=>s.trim()).filter(Boolean);
    if(imgs.length>1){
      const count = document.createElement('div'); count.className = 'gallery-count'; count.textContent = imgs.length;
      p.style.position = p.style.position || 'relative'; p.appendChild(count);
    }
  });

  // Search button triggers applyFilter and focuses input
  const searchBtn = document.getElementById('searchBtn');
  if(searchBtn && searchInput){
    searchBtn.addEventListener('click', ()=>{ applyFilter(); searchInput.focus(); });
    searchInput.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); applyFilter(); } });
  }

  // Active category badge (sticky, follows while scrolling)
  (function initActiveCategoryBadge(){
    const path = window.location.pathname || '';
    const isTienda = path.indexOf('tienda.html') !== -1;
    const isArreglos = path.indexOf('arreglos.html') !== -1;
    // Only initialize the badge on the store page or on arreglos (arreglos will keep it hidden until an item is added)
    if(!isTienda && !isArreglos) return;

    const badge = document.createElement('div'); badge.className = 'active-filter-badge'; badge.setAttribute('role','region'); badge.setAttribute('aria-live','polite');
    badge.innerHTML = `<span class="label"><strong id="badgeCat">Todos</strong> <span id="badgeCount" class="muted"></span></span><button class="clear-btn" aria-label="Limpiar filtro">✕</button>`;
    document.body.appendChild(badge);
    const badgeLabel = badge.querySelector('#badgeCat');
    const badgeCount = badge.querySelector('#badgeCount');
    const clearBtn = badge.querySelector('.clear-btn');
    // Dismissal state: if user hides the badge via the clear button, keep it hidden until scroll
    let badgeDismissed = false;
    let lastCat = 'all';
    let lastCount = null;

    function computeVisibleCount(){
      try{
        if(typeof productEls !== 'undefined' && Array.isArray(productEls)){
          return productEls.filter(p=>p.style.display !== 'none').length;
        }
      }catch(e){ }
      // fallback: count product nodes in DOM
      const container = document.getElementById('products');
      if(container) return Array.from(container.querySelectorAll('.product')).filter(p=>p.style.display !== 'none').length;
      return null;
    }

    function showBadge(cat, count){
      badgeLabel.textContent = cat === 'all' ? 'Todos' : cat;
      let cnt = typeof count === 'number' ? count : computeVisibleCount();
      if(typeof cnt === 'number'){ badgeCount.textContent = `— ${cnt}`; }
      else { badgeCount.textContent = ''; }
      badge.classList.add('visible');
    }
    function hideBadge(){ badge.classList.remove('visible'); badgeCount.textContent = ''; }

    // clicking the badge's clear button hides the badge temporarily (will reappear on scroll)
    clearBtn.addEventListener('click', ()=>{
      hideBadge();
      badgeDismissed = true;
    });

    // Clicking the badge focuses the sidebar (for quick access)
    badge.addEventListener('click', (e)=>{
      if(e.target === clearBtn) return; // handled above
      const sidebar = document.querySelector('.sidebar');
      if(sidebar){ sidebar.scrollIntoView({behavior:'smooth',block:'center'}); const firstFilter = sidebar.querySelector('.filter'); if(firstFilter) firstFilter.focus(); }
    });

    // Expose update function to scope used by filters (stores last values; respects user dismissal)
    window.__updateActiveBadge = (cat, count)=>{
      if(!cat) return hideBadge();
      lastCat = cat;
      lastCount = count;
      if(badgeDismissed) return; // stay hidden until user scrolls
      showBadge(cat, count);
    };

    // Show by default only on tienda page (and set last values)
    const initialCnt = computeVisibleCount();
    lastCat = 'all';
    lastCount = initialCnt;
    if(isTienda){
      showBadge('all', initialCnt);
    }

    // Do not auto re-show the badge on scroll when dismissed — it will only reappear when the user selects a category explicitly (filter clicks pass {from:'filter'}).
    // (No scroll listener here)
  })();

  // Update badge whenever a filter changes — hook into filter buttons
  document.querySelectorAll('.filter').forEach(b=>{
    b.addEventListener('click', ()=>{
      const cat = b.dataset.cat || 'all';
      // small delay to let applyFilter update visible items
      setTimeout(()=>{ window.__updateActiveBadge(cat, undefined, {from:'filter'}); }, 80);
    });
  });

  // Repair list: collapsible categories (acordeón — solo una abierta)
  (function initRepairToggles(){
    const repairList = document.querySelector('.repair-list');
    if(!repairList) return;
    // initialize each button/panel
    repairList.querySelectorAll('.toggle-btn').forEach(btn=>{
      const targetId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(targetId);
      if(!panel) return;
      // initialize collapsed state
      panel.style.transition = 'max-height .28s ease';
      panel.style.overflow = 'hidden';
      if(btn.getAttribute('aria-expanded') === 'true'){
        panel.classList.add('open'); panel.style.maxHeight = panel.scrollHeight + 'px'; panel.setAttribute('aria-hidden','false');
      } else { panel.classList.remove('open'); panel.style.maxHeight = '0px'; panel.setAttribute('aria-hidden','true'); }

      btn.addEventListener('click', ()=>{
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if(expanded){
          // close this panel
          btn.setAttribute('aria-expanded','false');
          panel.classList.remove('open'); panel.style.maxHeight = '0px'; panel.setAttribute('aria-hidden','true');
        } else {
          // close all other panels first
          repairList.querySelectorAll('.toggle-btn[aria-expanded="true"]').forEach(otherBtn=>{
            if(otherBtn === btn) return;
            otherBtn.setAttribute('aria-expanded','false');
            const otherPanel = document.getElementById(otherBtn.getAttribute('aria-controls'));
            if(otherPanel){ otherPanel.classList.remove('open'); otherPanel.style.maxHeight = '0px'; otherPanel.setAttribute('aria-hidden','true'); }
          });
          // open clicked panel
          btn.setAttribute('aria-expanded','true');
          panel.classList.add('open'); panel.style.maxHeight = panel.scrollHeight + 'px'; panel.setAttribute('aria-hidden','false');
        }
      });
    });

    // If multiple panels are marked expanded in markup, keep only the first open
    const expandedBtns = repairList.querySelectorAll('.toggle-btn[aria-expanded="true"]');
    if(expandedBtns.length > 1){
      expandedBtns.forEach((b,i)=>{
        if(i > 0){ b.setAttribute('aria-expanded','false'); const p = document.getElementById(b.getAttribute('aria-controls')); if(p){ p.classList.remove('open'); p.style.maxHeight = '0px'; p.setAttribute('aria-hidden','true'); } }
      });
    }
  })();

  // Sidebar categories toggle (replace hover behavior with explicit button)
  (function initSidebarCatsToggle(){
    const btn = document.getElementById('catsToggle');
    const panel = document.getElementById('sidebarCats');
    if(!btn || !panel) return;
    // make the panel animatable and accessible
    panel.style.transition = 'max-height .22s ease';
    panel.style.overflow = 'hidden';

    // initialize collapsed state
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if(expanded){
      panel.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.setAttribute('aria-hidden','false');
    } else {
      panel.classList.remove('open');
      panel.style.maxHeight = '0px';
      panel.setAttribute('aria-hidden','true');
    }

    btn.addEventListener('click', ()=>{
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      if(isExpanded){
        btn.setAttribute('aria-expanded','false');
        panel.classList.remove('open'); panel.style.maxHeight = '0px'; panel.setAttribute('aria-hidden','true');
      } else {
        btn.setAttribute('aria-expanded','true');
        panel.classList.add('open'); panel.style.maxHeight = panel.scrollHeight + 'px'; panel.setAttribute('aria-hidden','false');
      }
    });
  })();

  // Star feature interactions (Estrella del día)
  (function initStarSection(){
    const star = document.getElementById('estrella');
    if(!star) return;
    const pid = star.dataset.product;
    star.addEventListener('click', e=>{
      if(e.target.closest('.view')){
        const el = document.querySelector(`.product[data-id="${pid}"]`);
        if(el){ openQuickView(el); }
      }
      if(e.target.closest('.add-cart')){
        const el = document.querySelector(`.product[data-id="${pid}"]`);
        if(el){ addToCart(el); }
        if(cartPanel){ cartPanel.classList.add('open'); cartPanel.setAttribute('aria-hidden','false'); }
      }
    });
  })();

  // Users / Auth (local demo)
  (function initUsers(){
    // helpers
    const uKey = 'cc_users';
    const curKey = 'cc_current_user';
    function getUsers(){ try{ return JSON.parse(localStorage.getItem(uKey)||'[]'); }catch(e){return[]} }
    function saveUsers(u){ localStorage.setItem(uKey, JSON.stringify(u)); }
    function setCurrent(user){ localStorage.setItem(curKey, JSON.stringify(user)); }
    function getCurrent(){ return JSON.parse(localStorage.getItem(curKey)||'null'); }

    // elements (may exist only on users page)
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const regMsg = document.getElementById('regMsg');
    const loginMsg = document.getElementById('loginMsg');
    const profilePanel = document.getElementById('profilePanel');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const userAvatar = document.getElementById('userAvatar');
    const benefitsEl = document.getElementById('benefits');
    const historyEl = document.getElementById('history');
    const editBtn = document.getElementById('editProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const editForm = document.getElementById('editForm');
    const editName = document.getElementById('editName');
    const editPhone = document.getElementById('editPhone');
    const saveProfile = document.getElementById('saveProfile');
    const cancelEdit = document.getElementById('cancelEdit');

    // auth box elements for toggling
    const registerBox = document.getElementById('registerBox');
    const loginBox = document.getElementById('loginBox');
    const showLoginLink = document.getElementById('showLoginLink');
    const showRegisterLink = document.getElementById('showRegisterLink');

    function showMsg(el,msg,ok=true){ if(el){ el.textContent = msg; el.style.color = ok ? 'green' : 'crimson'; setTimeout(()=>{ if(el) el.textContent=''; },4000); } else { /* silent */ } }

    function showRegisterBox(){ if(registerBox) registerBox.style.display='block'; if(loginBox) loginBox.style.display='none'; if(registerForm) setTimeout(()=>document.getElementById('nameReg')?.focus(),80); }
    function showLoginBox(){ if(registerBox) registerBox.style.display='none'; if(loginBox) loginBox.style.display='block'; if(loginForm) setTimeout(()=>document.getElementById('emailLogin')?.focus(),80); }
    function decideDefaultAuthView(){ const users = getUsers(); const curu = getCurrent(); if(curu){ /* logged in */ showAuthForms(); renderProfileUI(curu); } else { if(users && users.length>0){ showLoginBox(); } else { showRegisterBox(); } } }

    function renderProfileUI(user){ if(!profilePanel) return; profilePanel.style.display='block'; profilePanel.setAttribute('aria-hidden','false');
      profileName.textContent = user.name || '';
      profileEmail.textContent = user.email || '';
      profilePhone.textContent = user.phone || '';
      // avatar: initials
      const initials = (user.name||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() || 'C';
      userAvatar.textContent = initials;
      // benefits (static demo)
      if(benefitsEl){ benefitsEl.innerHTML = '<div class="card">10% OFF próxima compra</div><div class="card">Envío gratis sobre $5000</div>'; }
      // history (sample or stored purchases)
      if(historyEl){ const hist = user.history || [{type:'Compra',label:"Vestido 'Amapola' — $4.200",date:'2025-12-20'},{type:'Arreglo',label:'Dobladillo — $700',date:'2025-11-30'}]; historyEl.innerHTML = hist.map(h=>`<div class="card"><strong>${h.type}</strong><div class="muted">${h.label}</div><div style="margin-top:6px;font-size:0.9rem;color:var(--muted)">${h.date}</div></div>`).join(''); }
      // hide auth boxes when profile visible
      if(registerBox) registerBox.style.display='none'; if(loginBox) loginBox.style.display='none';
    }

    function showAuthForms(){ if(profilePanel){ profilePanel.style.display='none'; profilePanel.setAttribute('aria-hidden','true'); }
      // show login or register depending on existing users
      decideDefaultAuthView();
    }

    // On page load, check current user
    const cur = getCurrent();
    if(cur){ renderProfileUI(cur); } else { decideDefaultAuthView(); }

    // register
    if(registerForm){ registerForm.addEventListener('submit', e=>{
      e.preventDefault(); const name = document.getElementById('nameReg').value.trim(); const email = document.getElementById('emailReg').value.trim().toLowerCase(); const pass = document.getElementById('passReg').value; const phone = document.getElementById('phoneReg').value.trim();
      if(!name || !email || !pass){ return showMsg(regMsg,'Completá todos los campos requeridos',false); }
      const users = getUsers(); if(users.find(u=>u.email===email)) return showMsg(regMsg,'Ya existe una cuenta con ese email',false);
      const newUser = {id: 'u_'+Date.now(), name, email, pass, phone, history:[]}; users.push(newUser); saveUsers(users); setCurrent(newUser); renderProfileUI(newUser); showMsg(regMsg,'Registro correcto — estás logueado');
    }); }

    // login
    if(loginForm){ loginForm.addEventListener('submit', e=>{
      e.preventDefault(); const email = document.getElementById('emailLogin').value.trim().toLowerCase(); const pass = document.getElementById('passLogin').value;
      const users = getUsers(); const u = users.find(x=>x.email===email && x.pass===pass);
      if(!u) return showMsg(loginMsg,'Credenciales inválidas',false);
      setCurrent(u); renderProfileUI(u); showMsg(loginMsg,'Bienvenido/a, ' + (u.name||'') );
    }); }

    // links to toggle forms
    if(showLoginLink){ showLoginLink.addEventListener('click', (ev)=>{ ev.preventDefault(); showLoginBox(); }); }
    if(showRegisterLink){ showRegisterLink.addEventListener('click', (ev)=>{ ev.preventDefault(); showRegisterBox(); }); }

    // edit profile
    if(editBtn){ editBtn.addEventListener('click', ()=>{ const curu = getCurrent(); if(!curu) return; editForm.style.display='block'; editName.value = curu.name || ''; editPhone.value = curu.phone || ''; }); }
    if(cancelEdit){ cancelEdit.addEventListener('click', ()=>{ editForm.style.display='none'; }); }
    if(saveProfile){ saveProfile.addEventListener('click', ()=>{
      const curu = getCurrent(); if(!curu) return; const users = getUsers(); const idx = users.findIndex(u=>u.email===curu.email); if(idx===-1) return;
      users[idx].name = editName.value.trim() || users[idx].name; users[idx].phone = editPhone.value.trim(); saveUsers(users); setCurrent(users[idx]); renderProfileUI(users[idx]); editForm.style.display='none'; showMsg(null,'Perfil guardado');
    }); }

    // logout
    if(logoutBtn){ logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem(curKey); showAuthForms(); showMsg(null,'Has cerrado sesión'); window.scrollTo({top:0,behavior:'smooth'}); }); }

    // simple helper to redirect to users page from anywhere when CTA clicked (header link already does it)
  })();

  // Quick view modal
  const quickView = document.getElementById('quickView');
  const qvTitle = document.getElementById('qvTitle');
  const qvPrice = document.getElementById('qvPrice');
  const qvDesc = document.getElementById('qvDesc');
  const qvImage = quickView ? quickView.querySelector('.qv-image img') : null;
  const qvAdd = document.getElementById('qvAdd');

  function openQuickView(productEl){
    if(!quickView || !productEl) return;
    const title = productEl.querySelector('h3')?.textContent || 'Producto';
    const price = productEl.dataset.price || '0';
    const desc = productEl.dataset.description || '';
    const images = (productEl.dataset.images || productEl.querySelector('img')?.src || '').split(',').map(s=>s.trim()).filter(Boolean);

    qvTitle.textContent = title;
    qvPrice.textContent = formatPrice(Number(price));
    qvDesc.textContent = desc;

    const mainImg = quickView.querySelector('.qv-image img');
    const thumbs = quickView.querySelector('.qv-thumbs');
    const prevBtn = quickView.querySelector('#qvPrev');
    const nextBtn = quickView.querySelector('#qvNext');

    let idx = 0;
    function updateGallery(i){
      if(!images || images.length===0) return;
      idx = (i + images.length) % images.length;
      if(mainImg) mainImg.src = images[idx];
      if(thumbs){
        thumbs.querySelectorAll('.qv-thumb').forEach(t=> t.classList.toggle('active', Number(t.dataset.index)===idx));
        // ensure active thumb visible (not necessary here but useful if overflow)
        const active = thumbs.querySelector('.qv-thumb.active'); if(active) active.scrollIntoView({inline:'center',behavior:'smooth'});
      }
    }

    // populate thumbnails
    if(thumbs){
      thumbs.innerHTML = images.map((src,i)=>`<img src="${src}" class="qv-thumb${i===0?' active':''}" data-index="${i}" alt="${title} foto ${i+1}">`).join('');
    }

    function thumbClickHandler(e){
      if(e.target && e.target.classList.contains('qv-thumb')){
        updateGallery(Number(e.target.dataset.index));
      }
    }

    function prevHandler(){ updateGallery(idx-1); }
    function nextHandler(){ updateGallery(idx+1); }

    if(thumbs){ thumbs.addEventListener('click', thumbClickHandler); }
    if(prevBtn){ prevBtn.addEventListener('click', prevHandler); }
    if(nextBtn){ nextBtn.addEventListener('click', nextHandler); }

    // keyboard navigation while quickView open
    const qvKeyHandler = function(e){ if(e.key === 'ArrowLeft'){ prevHandler(); } else if(e.key === 'ArrowRight'){ nextHandler(); } else if(e.key === 'Escape'){ closeQuickView(); } };
    document.addEventListener('keydown', qvKeyHandler);

    // store references for cleanup on close
    quickView._qvKeyHandler = qvKeyHandler;
    quickView._thumbClickHandler = thumbClickHandler;
    quickView._prevHandler = prevHandler;
    quickView._nextHandler = nextHandler;

    // set initial image
    if(images.length>0){ updateGallery(0); }

    quickView.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    quickView.dataset.productId = productEl.dataset.id;
  }

  function closeQuickView(){
    if(!quickView) return;
    // remove handlers
    const thumbs = quickView.querySelector('.qv-thumbs');
    if(thumbs && quickView._thumbClickHandler){ thumbs.removeEventListener('click', quickView._thumbClickHandler); }
    const prevBtn = quickView.querySelector('#qvPrev');
    const nextBtn = quickView.querySelector('#qvNext');
    if(prevBtn && quickView._prevHandler){ prevBtn.removeEventListener('click', quickView._prevHandler); }
    if(nextBtn && quickView._nextHandler){ nextBtn.removeEventListener('click', quickView._nextHandler); }
    if(quickView._qvKeyHandler){ document.removeEventListener('keydown', quickView._qvKeyHandler); }
    delete quickView._qvKeyHandler; delete quickView._thumbClickHandler; delete quickView._prevHandler; delete quickView._nextHandler;

    quickView.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    delete quickView.dataset.productId;
  }

  // Delegate 'Ver' button clicks
  document.addEventListener('click', e=>{
    if(e.target.closest('.view')){
      const product = e.target.closest('.product');
      openQuickView(product);
    }
    if(e.target.closest('[data-close]')){
      closeQuickView();
    }
  });

  // Close on Esc
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeQuickView(); });

  // Add to cart from quick view
  if(qvAdd){
    qvAdd.addEventListener('click', ()=>{
      const id = quickView.dataset.productId;
      const el = document.querySelector(`.product[data-id="${id}"]`);
      addToCart(el);
      closeQuickView();
    });
  }

});

// Initialize
renderCart();