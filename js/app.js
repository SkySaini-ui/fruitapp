// ============================================================
//  FreshMart App - Complete Logic
// ============================================================

// ---- DEFAULT PRODUCTS ----
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Apple',      emoji: '🍎', category: 'fruit',     price: 120, stock: 30 },
  { id: 2, name: 'Banana',     emoji: '🍌', category: 'fruit',     price: 40,  stock: 50 },
  { id: 3, name: 'Mango',      emoji: '🥭', category: 'fruit',     price: 80,  stock: 20 },
  { id: 4, name: 'Grapes',     emoji: '🍇', category: 'fruit',     price: 90,  stock: 15 },
  { id: 5, name: 'Orange',     emoji: '🍊', category: 'fruit',     price: 60,  stock: 25 },
  { id: 6, name: 'Papaya',     emoji: '🍈', category: 'fruit',     price: 35,  stock: 18 },
  { id: 7, name: 'Tomato',     emoji: '🍅', category: 'vegetable', price: 30,  stock: 40 },
  { id: 8, name: 'Potato',     emoji: '🥔', category: 'vegetable', price: 25,  stock: 60 },
  { id: 9, name: 'Onion',      emoji: '🧅', category: 'vegetable', price: 35,  stock: 45 },
  { id: 10,name: 'Spinach',    emoji: '🥬', category: 'vegetable', price: 20,  stock: 10 },
  { id: 11,name: 'Carrot',     emoji: '🥕', category: 'vegetable', price: 40,  stock: 30 },
  { id: 12,name: 'Capsicum',   emoji: '🫑', category: 'vegetable', price: 55,  stock: 12 },
];

// ---- STATE ----
let products = JSON.parse(localStorage.getItem('fm_products')) || DEFAULT_PRODUCTS;
let orders   = JSON.parse(localStorage.getItem('fm_orders'))   || [];
let paymentDetails = JSON.parse(localStorage.getItem('fm_payment')) || { upiId: '', phone: '', name: '', bank: '' };
let cart = {};
let currentFilter = 'all';
let editingStockId = null;

// ---- SAVE ----
function save() {
  localStorage.setItem('fm_products', JSON.stringify(products));
  localStorage.setItem('fm_orders',   JSON.stringify(orders));
  localStorage.setItem('fm_payment',  JSON.stringify(paymentDetails));
}

// ---- TOAST ----
function toast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ---- PAGE NAV ----
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  event && event.target && event.target.classList.add('active');
  if (name === 'shop')     renderProducts();
  if (name === 'orders')   renderOrders();
  if (name === 'stock')    renderStock();
  if (name === 'payments') renderPayments();
}

// ============================================================
//  SHOP / PRODUCTS
// ============================================================
function filterProducts(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const filtered = currentFilter === 'all'
    ? products
    : products.filter(p => p.category === currentFilter);

  grid.innerHTML = filtered.map(p => {
    const soldQty = calcSold(p.id);
    const avail = p.stock - soldQty;
    const inCart = cart[p.id] || 0;
    const low = avail > 0 && avail <= 5;
    const oos = avail <= 0;

    return `
    <div class="product-card ${oos ? 'out-of-stock' : ''}">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">₹${p.price}/kg</div>
      <div class="product-stock ${low ? 'low' : ''} ${oos ? 'low' : ''}">
        ${oos ? '❌ Out of stock' : low ? `⚠️ Only ${avail} kg left` : `${avail} kg available`}
      </div>
      ${oos
        ? `<button class="btn-add" disabled>Out of Stock</button>`
        : inCart === 0
          ? `<button class="btn-add" onclick="addToCart(${p.id})">+ Add</button>`
          : `<div class="qty-controls">
              <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
              <span class="qty-num">${inCart}</span>
              <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
             </div>`
      }
    </div>`;
  }).join('');
}

function calcSold(productId) {
  let total = 0;
  orders.forEach(o => {
    if (o.status !== 'cancelled') {
      (o.items || []).forEach(i => {
        if (i.productId === productId) total += i.qty;
      });
    }
  });
  return total;
}

function addToCart(id) {
  cart[id] = 1;
  updateCartCount();
  renderProducts();
}

function changeQty(id, delta) {
  const p = products.find(x => x.id === id);
  const avail = p.stock - calcSold(p.id);
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] > avail) { cart[id] = avail; toast('⚠️ Max available stock reached'); }
  if (cart[id] <= 0) delete cart[id];
  updateCartCount();
  renderProducts();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  document.getElementById('cartCount').textContent = count;
}

// ---- CART ----
function showCart() {
  const el = document.getElementById('cartModal');
  el.classList.add('open');
  renderCart();
}

function closeCart(e) {
  if (!e || e.target.classList.contains('modal-overlay'))
    document.getElementById('cartModal').classList.remove('open');
}

function renderCart() {
  const keys = Object.keys(cart);
  const itemsEl = document.getElementById('cartItems');
  let total = 0;

  if (keys.length === 0) {
    itemsEl.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px">Cart is empty 🛒</p>';
    document.getElementById('cartTotal').textContent = 0;
    return;
  }

  itemsEl.innerHTML = keys.map(id => {
    const p = products.find(x => x.id == id);
    const qty = cart[id];
    const subtotal = p.price * qty;
    total += subtotal;
    return `<div class="cart-item">
      <div>${p.emoji} ${p.name}</div>
      <div class="qty-controls" style="gap:6px">
        <button class="qty-btn" onclick="changeQty(${p.id}, -1); renderCart()">−</button>
        <span class="qty-num">${qty} kg</span>
        <button class="qty-btn" onclick="changeQty(${p.id}, 1); renderCart()">+</button>
      </div>
      <div class="cart-item-price">₹${subtotal}</div>
    </div>`;
  }).join('');

  document.getElementById('cartTotal').textContent = total;
}

// ---- CHECKOUT ----
function showCheckout() {
  document.getElementById('cartModal').classList.remove('open');
  renderOrderSummary();
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout(e) {
  if (!e || e.target.classList.contains('modal-overlay'))
    document.getElementById('checkoutModal').classList.remove('open');
}

document.addEventListener('change', function(e) {
  if (e.target.name === 'payMethod') {
    const upiBox = document.getElementById('upiDetails');
    upiBox.style.display = e.target.value === 'upi' ? 'block' : 'none';
    if (e.target.value === 'upi') {
      document.getElementById('shopUpiId').textContent = paymentDetails.upiId || 'Not set';
      document.getElementById('shopPhone').textContent = paymentDetails.phone || 'Not set';
    }
  }
});

function renderOrderSummary() {
  const box = document.getElementById('orderSummaryBox');
  let total = 0;
  const lines = Object.keys(cart).map(id => {
    const p = products.find(x => x.id == id);
    const sub = p.price * cart[id];
    total += sub;
    return `<div>${p.emoji} ${p.name} × ${cart[id]} kg = ₹${sub}</div>`;
  });
  box.innerHTML = lines.join('') + `<div style="border-top:1px solid #ccc;margin-top:8px;padding-top:8px;font-weight:700">Total: ₹${total}</div>`;
}

function placeOrder() {
  const name    = document.getElementById('custName').value.trim();
  const phone   = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const method  = document.querySelector('input[name="payMethod"]:checked').value;
  const utr     = document.getElementById('utrNumber') ? document.getElementById('utrNumber').value.trim() : '';

  if (!name || !phone || !address) { toast('⚠️ Please fill all required fields'); return; }
  if (Object.keys(cart).length === 0) { toast('⚠️ Cart is empty'); return; }

  let total = 0;
  const items = Object.keys(cart).map(id => {
    const p = products.find(x => x.id == id);
    const sub = p.price * cart[id];
    total += sub;
    return { productId: p.id, name: p.name, emoji: p.emoji, qty: cart[id], price: p.price, subtotal: sub };
  });

  const order = {
    id: 'ORD' + Date.now(),
    customer: name,
    phone,
    address,
    paymentMethod: method,
    utr: utr || '',
    paymentStatus: method === 'upi' && utr ? 'paid' : 'pending',
    status: 'pending',
    items,
    total,
    orderDate: new Date().toISOString(),
    deliveryDate: getTomorrow()
  };

  orders.unshift(order);
  cart = {};
  updateCartCount();
  save();

  document.getElementById('checkoutModal').classList.remove('open');
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';
  document.getElementById('utrNumber').value = '';

  toast(`✅ Order placed! ID: ${order.id}`);
  renderProducts();
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
//  ORDERS PAGE
// ============================================================
function renderOrders() {
  const filter = document.getElementById('orderDateFilter').value;
  const today = getToday();
  const tomorrow = getTomorrow();

  let filtered = orders;
  if (filter === 'today')    filtered = orders.filter(o => o.orderDate?.slice(0,10) === today);
  if (filter === 'tomorrow') filtered = orders.filter(o => o.deliveryDate === tomorrow);

  // Stats
  const stats = document.getElementById('orderStats');
  const total = filtered.reduce((a,o) => a + o.total, 0);
  const pending = filtered.filter(o => o.status === 'pending').length;
  const delivered = filtered.filter(o => o.status === 'delivered').length;
  const unpaid = filtered.filter(o => o.paymentStatus === 'pending').reduce((a,o) => a + o.total, 0);

  stats.innerHTML = `
    <div class="stat-card"><div class="stat-val">${filtered.length}</div><div class="stat-label">Orders</div></div>
    <div class="stat-card"><div class="stat-val">₹${total}</div><div class="stat-label">Total Revenue</div></div>
    <div class="stat-card"><div class="stat-val">${pending}</div><div class="stat-label">Pending</div></div>
    <div class="stat-card"><div class="stat-val">₹${unpaid}</div><div class="stat-label">Unpaid</div></div>
  `;

  const list = document.getElementById('ordersList');
  if (filtered.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#6b7280;padding:40px">No orders found</p>';
    return;
  }

  list.innerHTML = filtered.map(o => `
    <div class="order-card ${o.status}">
      <div class="order-card-header">
        <div>
          <div class="order-id">${o.id} · ${fmtDate(o.orderDate)}</div>
          <div class="order-name">👤 ${o.customer}</div>
          <div class="order-phone">📞 ${o.phone}</div>
          <div class="order-phone" style="margin-top:2px">📍 ${o.address}</div>
        </div>
        <div class="order-total">₹${o.total}</div>
      </div>
      <div class="order-items">
        ${o.items.map(i => `${i.emoji} ${i.name} × ${i.qty}kg (₹${i.subtotal})`).join(' &nbsp;|&nbsp; ')}
      </div>
      <div class="order-meta">
        <span class="badge ${o.status === 'delivered' ? 'badge-delivered' : 'badge-pending'}">${o.status}</span>
        <span class="badge ${o.paymentMethod === 'upi' ? 'badge-upi' : 'badge-cash'}">${o.paymentMethod}</span>
        <span class="badge ${o.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}">${o.paymentStatus}</span>
        ${o.utr ? `<span style="font-size:0.78rem;color:#555">UTR: ${o.utr}</span>` : ''}
        <div style="margin-left:auto;display:flex;gap:4px;flex-wrap:wrap">
          ${o.status !== 'delivered' ? `<button class="btn-sm btn-deliver" onclick="markDelivered('${o.id}')">✅ Delivered</button>` : ''}
          ${o.paymentStatus !== 'paid' ? `<button class="btn-sm btn-paid" onclick="markPaid('${o.id}')">💰 Paid</button>` : ''}
          <button class="btn-sm btn-delete" onclick="deleteOrder('${o.id}')">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function markDelivered(id) {
  const o = orders.find(x => x.id === id);
  if (o) { o.status = 'delivered'; save(); renderOrders(); toast('✅ Marked as delivered'); }
}

function markPaid(id) {
  const o = orders.find(x => x.id === id);
  if (o) { o.paymentStatus = 'paid'; save(); renderOrders(); renderPayments(); toast('💰 Marked as paid'); }
}

function deleteOrder(id) {
  if (!confirm('Delete this order?')) return;
  orders = orders.filter(x => x.id !== id);
  save(); renderOrders(); toast('🗑 Order deleted');
}

function exportOrders() {
  const filter = document.getElementById('orderDateFilter').value;
  const today = getToday();
  const tomorrow = getTomorrow();
  let filtered = orders;
  if (filter === 'today')    filtered = orders.filter(o => o.orderDate?.slice(0,10) === today);
  if (filter === 'tomorrow') filtered = orders.filter(o => o.deliveryDate === tomorrow);

  let text = `FreshMart Orders Export\n${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
  filtered.forEach(o => {
    text += `Order: ${o.id}\nCustomer: ${o.customer} | Phone: ${o.phone}\nAddress: ${o.address}\n`;
    text += `Items:\n${o.items.map(i => `  - ${i.emoji} ${i.name}: ${i.qty}kg @ ₹${i.price} = ₹${i.subtotal}`).join('\n')}\n`;
    text += `Total: ₹${o.total} | Payment: ${o.paymentMethod} | Status: ${o.paymentStatus}\n`;
    text += `Delivery: ${o.status}\n${'-'.repeat(40)}\n`;
  });

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `orders_${filter}_${today}.txt`;
  a.click();
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ============================================================
//  STOCK PAGE
// ============================================================
function renderStock() {
  const body = document.getElementById('stockTableBody');
  let totalStock = 0, totalSold = 0, lowItems = 0;

  body.innerHTML = products.map(p => {
    const sold = calcSold(p.id);
    const avail = p.stock - sold;
    totalStock += p.stock;
    totalSold  += sold;
    if (avail > 0 && avail <= 5) lowItems++;
    const cls = avail <= 0 ? 'zero' : avail <= 5 ? 'low' : '';

    return `<tr>
      <td>${p.emoji} ${p.name}</td>
      <td>${p.category === 'fruit' ? '🍎 Fruit' : '🥦 Veg'}</td>
      <td>${p.stock} kg</td>
      <td>${sold} kg</td>
      <td class="stock-avail ${cls}">${avail <= 0 ? '❌ 0' : avail + ' kg'}</td>
      <td>₹${p.price}</td>
      <td>
        <button class="btn-sm btn-deliver" onclick="editStock(${p.id})">✏️</button>
        <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})">🗑</button>
      </td>
    </tr>`;
  }).join('');

  const statsEl = document.getElementById('stockStats');
  statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-val">${products.length}</div><div class="stat-label">Products</div></div>
    <div class="stat-card"><div class="stat-val">${totalStock} kg</div><div class="stat-label">Opening Stock</div></div>
    <div class="stat-card"><div class="stat-val">${totalSold} kg</div><div class="stat-label">Sold</div></div>
    <div class="stat-card"><div class="stat-val ${lowItems ? 'low' : ''}">${lowItems}</div><div class="stat-label">Low Stock</div></div>
  `;
}

function showAddStock() {
  editingStockId = null;
  document.getElementById('stockName').value = '';
  document.getElementById('stockCategory').value = 'fruit';
  document.getElementById('stockEmoji').value = '';
  document.getElementById('stockQty').value = '';
  document.getElementById('stockPrice').value = '';
  document.getElementById('addStockModal').classList.add('open');
}

function editStock(id) {
  const p = products.find(x => x.id === id);
  editingStockId = id;
  document.getElementById('stockName').value = p.name;
  document.getElementById('stockCategory').value = p.category;
  document.getElementById('stockEmoji').value = p.emoji;
  document.getElementById('stockQty').value = p.stock;
  document.getElementById('stockPrice').value = p.price;
  document.getElementById('addStockModal').classList.add('open');
}

function closeAddStock(e) {
  if (!e || e.target.classList.contains('modal-overlay'))
    document.getElementById('addStockModal').classList.remove('open');
}

function saveStock() {
  const name     = document.getElementById('stockName').value.trim();
  const category = document.getElementById('stockCategory').value;
  const emoji    = document.getElementById('stockEmoji').value.trim() || '🛒';
  const stock    = parseInt(document.getElementById('stockQty').value) || 0;
  const price    = parseInt(document.getElementById('stockPrice').value) || 0;

  if (!name) { toast('⚠️ Enter item name'); return; }

  if (editingStockId) {
    const p = products.find(x => x.id === editingStockId);
    p.name = name; p.category = category; p.emoji = emoji; p.stock = stock; p.price = price;
    toast('✅ Item updated');
  } else {
    products.push({ id: Date.now(), name, emoji, category, price, stock });
    toast('✅ Item added');
  }

  save(); closeAddStock(); renderStock(); renderProducts();
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  products = products.filter(x => x.id !== id);
  save(); renderStock(); toast('🗑 Product removed');
}

// ============================================================
//  PAYMENTS PAGE
// ============================================================
function renderPayments() {
  document.getElementById('displayUpiId').textContent = paymentDetails.upiId || '—';
  document.getElementById('displayPhone').textContent  = paymentDetails.phone  || '—';
  document.getElementById('displayName').textContent   = paymentDetails.name   || '—';
  document.getElementById('displayBank').textContent   = paymentDetails.bank   || '—';

  const paid   = orders.filter(o => o.paymentStatus === 'paid').reduce((a, o) => a + o.total, 0);
  const unpaid = orders.filter(o => o.paymentStatus === 'pending').reduce((a, o) => a + o.total, 0);
  const cashPending = orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod === 'cash').reduce((a, o) => a + o.total, 0);
  const upiPending  = orders.filter(o => o.paymentStatus === 'pending' && o.paymentMethod === 'upi').reduce((a, o) => a + o.total, 0);

  document.getElementById('paymentStats').innerHTML = `
    <div class="stat-card"><div class="stat-val">₹${paid}</div><div class="stat-label">Received</div></div>
    <div class="stat-card"><div class="stat-val">₹${unpaid}</div><div class="stat-label">Pending</div></div>
    <div class="stat-card"><div class="stat-val">₹${cashPending}</div><div class="stat-label">Cash Due</div></div>
    <div class="stat-card"><div class="stat-val">₹${upiPending}</div><div class="stat-label">UPI Due</div></div>
  `;

  const pendingOrders = orders.filter(o => o.paymentStatus === 'pending');
  const pendingEl = document.getElementById('pendingPayments');
  if (pendingOrders.length === 0) {
    pendingEl.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px">No pending payments 🎉</p>';
    return;
  }
  pendingEl.innerHTML = pendingOrders.map(o => `
    <div class="pending-item">
      <div>
        <div style="font-weight:700">${o.customer}</div>
        <div style="font-size:0.82rem;color:#6b7280">${o.phone} · ${o.paymentMethod.toUpperCase()}</div>
        ${o.utr ? `<div style="font-size:0.78rem;color:#555">UTR: ${o.utr}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:var(--green);font-size:1.1rem">₹${o.total}</div>
        <button class="btn-sm btn-paid" onclick="markPaid('${o.id}'); renderPayments()">💰 Mark Paid</button>
      </div>
    </div>
  `).join('');
}

function showEditPayment() {
  document.getElementById('editUpiId').value   = paymentDetails.upiId || '';
  document.getElementById('editPhone').value   = paymentDetails.phone  || '';
  document.getElementById('editHolderName').value = paymentDetails.name || '';
  document.getElementById('editBank').value    = paymentDetails.bank   || '';
  document.getElementById('editPaymentModal').classList.add('open');
}

function closeEditPayment(e) {
  if (!e || e.target.classList.contains('modal-overlay'))
    document.getElementById('editPaymentModal').classList.remove('open');
}

function savePaymentDetails() {
  paymentDetails.upiId = document.getElementById('editUpiId').value.trim();
  paymentDetails.phone = document.getElementById('editPhone').value.trim();
  paymentDetails.name  = document.getElementById('editHolderName').value.trim();
  paymentDetails.bank  = document.getElementById('editBank').value.trim();
  save(); closeEditPayment(); renderPayments();
  toast('✅ Payment details saved');
}

// ---- SERVICE WORKER REGISTRATION ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW error', err));
  });
}

// ---- INIT ----
renderProducts();
renderPayments();
