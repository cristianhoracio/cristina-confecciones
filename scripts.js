/* Archivo obsoleto en la raíz. */
/* El script activo está en /js/scripts.js */
/* Para editar el comportamiento del carrito y formularios: editar js/scripts.js */


// Attach add-to-cart buttons if present
document.querySelectorAll('.add-cart').forEach((btn)=>{
  btn.addEventListener('click', e=>{
    const product = e.target.closest('.product'); addToCart(product);
    if(cartPanel) { cartPanel.classList.add('open'); cartPanel.setAttribute('aria-hidden','false'); }
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
        // Optionally clear cart: cart.length = 0; saveCart(); renderCart();
      } else {
        const text = await resp.text();
        alert('Respuesta del servidor: ' + (text||resp.status));
      }
    }catch(err){
      // Fallback: show message so developer knows to wire backend
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

// Initialize
renderCart();