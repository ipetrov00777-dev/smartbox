// Рендер корзины
function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (!dbCartItems || dbCartItems.length === 0) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Кошик порожній</div>`;
        return;
    }

    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background: #f1f3f5; text-align: left;">
                    <th style="padding: 8px; border-bottom: 1px solid #ddd;">Товар (Код)</th>
                    <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Кількість</th>
                    <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">Дії</th>
                </tr>
            </thead>
            <tbody>
    `;

    dbCartItems.forEach(item => {
        const prod = globalProducts.find(p => p.product_code === item.product_code);
        const prodName = prod ? (prod.name_ua || prod.name) : item.product_code;

        html += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    <strong>${prodName}</strong><br>
                    <small style="color: #666;">${item.product_code}</small>
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                    ${item.qty_reserved || item.qty || 0}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                    <button onclick="removeCartItem('${item.id}')" style="background: #fa5252; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Видалити</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Удаление позиции из корзины
async function removeCartItem(itemId) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/order_items?id=eq.${itemId}`, {
            method: 'DELETE',
            headers: HEADERS
        });
        if (res.ok) {
            await loadAllData();
            renderCart();
        } else {
            alert('Помилка при видаленні позиції');
        }
    } catch (e) {
        console.error("Помилка видалення", e);
    }
}
