// Глобальні змінні стану програми
let activeOrderId = null;
let dbCartItems = [];
let globalStock = [];
let globalProducts = [];

// Ініціалізація активного замовлення і завантаження даних бази
async function ensureActiveOrder() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.draft&select=*&limit=1`, { headers: HEADERS });
        const orders = await res.json();

        if (orders && orders.length > 0) {
            activeOrderId = orders[0].id;
        } else {
            const newOrderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify({
                    order_number: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
                    status: 'draft'
                })
            });
            const newOrders = await newOrderRes.json();
            if (newOrders && newOrders.length > 0) {
                activeOrderId = newOrders[0].id;
            }
        }
    } catch (e) {
        console.error("Помилка ініціалізації замовлення", e);
    }
}

async function loadAllData() {
    try {
        const [stockRes, prodRes, cartRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/inventory_boxes?select=*`, { headers: HEADERS }),
            fetch(`${SUPABASE_URL}/rest/v1/view_smartbox_main?select=*`, { headers: HEADERS }),
            activeOrderId ? fetch(`${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${activeOrderId}&select=*`, { headers: HEADERS }) : Promise.resolve({ ok: false })
        ]);
        
        if (stockRes.ok) globalStock = await stockRes.json();
        if (prodRes.ok) globalProducts = await prodRes.json();
        if (cartRes.ok) dbCartItems = await cartRes.json();

        updateCartBadge();
    } catch (e) {
        console.error("Помилка завантаження даних", e);
    }
}

function updateCartBadge() {
    const totalCartItems = dbCartItems.reduce((sum, i) => sum + (parseInt(i.qty_reserved, 10) || 0), 0);
    const badge = document.getElementById('cartBadge');
    if (badge) badge.innerText = totalCartItems;
}

// Навігація по екранах
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
    
    if (screenId === 'infoSection') {
        loadAllData().then(() => {
            if (typeof currentProductCode !== 'undefined' && currentProductCode) {
                renderLocationsTable();
            }
        });
        setTimeout(() => document.getElementById('scanInput').focus(), 100);
    }
    if (screenId === 'cartSection') {
        renderCart();
    }
}

function goToMenu() { showScreen('menuScreen'); }
function openSection(sectionId) { showScreen(sectionId); }

// Первинний запуск при завантаженні сторінки
async function initSystem() {
    await ensureActiveOrder();
    await loadAllData();
    updateCartBadge();
}

window.addEventListener('DOMContentLoaded', initSystem);
