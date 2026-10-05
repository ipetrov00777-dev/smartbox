let currentProductCode = null;

// Обработка сканирования в разделе "Інформація"
function handleInfoScan(e) {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        e.target.value = '';
        if (!val) return;

        // Поиск товара по штрих-коду или коду
        const found = globalProducts.find(p => p.barcode === val || p.product_code === val);
        if (found) {
            currentProductCode = found.product_code;
            document.getElementById('infoProdName').innerText = found.name_ua || found.name || 'Товар';
            document.getElementById('infoProdCode').innerText = found.product_code;
            renderLocationsTable();
        } else {
            alert('Товар не знайдено!');
        }
    }
}

// Отрисовка таблицы остатков товара по ячейкам/коробкам
function renderLocationsTable() {
    const container = document.getElementById('infoLocationsTable');
    if (!container || !currentProductCode) return;

    // Фильтруем глобальный сток по нашему product_code
    const items = globalStock.filter(s => s.product_code === currentProductCode);

    if (items.length === 0) {
        container.innerHTML = `<div style="padding: 15px; text-align: center; color: #666;">Немає залишків на складах</div>`;
        return;
    }

    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background: #f1f3f5; text-align: left;">
                    <th style="padding: 8px; border-bottom: 1px solid #ddd;">Склад / Зона</th>
                    <th style="padding: 8px; border-bottom: 1px solid #ddd;">Коробка</th>
                    <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Кількість</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(i => {
        html += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.warehouse_zone || 'Основний'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.box_code || i.box_id || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${i.qty || i.quantity || 0}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}
