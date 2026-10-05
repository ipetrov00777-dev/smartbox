let currentScanMode = 'box'; // 'box' або 'item'
let scannedBoxCode = null;

function setScanMode(mode) {
    currentScanMode = mode;
    const btnBox = document.getElementById('modeBoxBtn');
    const btnItem = document.getElementById('modeItemBtn');
    const label = document.getElementById('scanInstructionLabel');

    if (mode === 'box') {
        if (btnBox) { btnBox.style.background = '#1a73e8'; btnBox.style.color = '#fff'; }
        if (btnItem) { btnItem.style.background = '#fff'; btnItem.style.color = '#1a73e8'; }
        if (label) label.innerText = 'Скануйте коробку/полицю';
    } else {
        if (btnItem) { btnItem.style.background = '#1a73e8'; btnItem.style.color = '#fff'; }
        if (btnBox) { btnBox.style.background = '#fff'; btnBox.style.color = '#1a73e8'; }
        if (label) label.innerText = 'Скануйте товар (FIFO)';
    }
    const input = document.getElementById('mainScanInput');
    if (input) input.focus();
}

// Головний обробник сканування на складі (FIFO / Збірка)
async function handleMainScan(e) {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        e.target.value = '';
        if (!val) return;

        if (currentScanMode === 'box') {
            // Перевірка існування коробки в стоці
            const boxFound = globalStock.find(s => s.box_code === val || s.box_id === val);
            if (boxFound) {
                scannedBoxCode = val;
                const boxDisplay = document.getElementById('currentBoxDisplay');
                if (boxDisplay) boxDisplay.innerText = `Коробка: ${val}`;
                alert(`Коробку ${val} успішно вибрано! Тепер скануйте товар.`);
                setScanMode('item');
            } else {
                alert('Коробку не знайдено в базі!');
            }
        } else {
            // Режим сканування товару з FIFO
            if (!scannedBoxCode) {
                alert('Спочатку скануйте коробку!');
                setScanMode('box');
                return;
            }

            const prod = globalProducts.find(p => p.barcode === val || p.product_code === val);
            if (!prod) {
                alert('Товар не знайдено за штрих-кодом!');
                return;
            }

            // Додаємо позицію в замовлення через API (з прив'язкою до product_code)
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
                    method: 'POST',
                    headers: HEADERS,
                    body: JSON.stringify({
                        order_id: activeOrderId,
                        product_code: prod.product_code,
                        box_code: scannedBoxCode,
                        qty_reserved: 1
                    })
                });

                if (res.ok) {
                    await loadAllData();
                    alert(`Товар ${prod.name_ua || prod.name} додано до замовлення (FIFO)`);
                } else {
                    alert('Помилка збереження товару');
                }
            } else (err) {
                // виправлено синтаксис catch нижче
            }
        } catch (err) {
            console.error("Помилка FIFO сканування", err);
        }
    }
}

// Автоматична прив'язка обробника подій при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    const scanInput = document.getElementById('mainScanInput');
    if (scanInput) {
        scanInput.addEventListener('keydown', handleMainScan);
        scanInput.focus();
    }
});
