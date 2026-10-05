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

// Звуковой сигнал сканера (Beep)
function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Игнорируем блокировку браузера до первого взаимодействия
    }
}

// Головний обробник сканування на складі (FIFO / Збірка)
async function handleMainScan(e) {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        e.target.value = '';
        if (!val) return;

        playBeep(); // Звуковий сигнал при скануванні

        if (currentScanMode === 'box') {
            scannedBoxCode = val;
            const boxInfoLabel = document.getElementById('scannedBoxInfo');
            if (boxInfoLabel) {
                boxInfoLabel.innerText = `Обрана коробка/полиця: ${val}`;
                boxInfoLabel.style.color = '#1a73e8';
            }
            // Автоматично перемикаємо на режим сканування товару після коробки
            setScanMode('item');
        } else {
            // Режим сканування товару (FIFO)
            const productCode = val;
            if (!scannedBoxCode) {
                alert("Спершу відскануйте коробку або полицю!");
                setScanMode('box');
                return;
            }

            // Додаємо товар у поточну коробку за правилами FIFO
            await addItemToBoxFifo(scannedBoxCode, productCode);
        }
    }
}

async function addItemToBoxFifo(boxCode, productCode) {
    try {
        // Перевіряємо наявність товару в базі через глобальні масиви або API
        const prodInfo = globalProducts.find(p => 
            (p.product_code && p.product_code.toLowerCase() === productCode.toLowerCase()) || 
            (p.barcode && p.barcode.toLowerCase() === productCode.toLowerCase())
        );

        const realProductCode = prodInfo ? prodInfo.product_code : productCode;
        const realProductName = prodInfo ? (prodInfo.product_name || 'Назва не вказана') : 'Невідомий товар';

        if (!activeOrderId) {
            await ensureActiveOrder();
        }

        // Зберігаємо рядок в Supabase (order_items)
        const res = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                order_id: activeOrderId,
                box_name: boxCode,
                product_code: realProductCode,
                product_name: realProductName,
                qty_reserved: 1
            })
        });

        if (res.ok) {
            await loadAllData();
            updateCartBadge();
            
            const infoBox = document.getElementById('lastScannedResult');
            if (infoBox) {
                infoBox.innerHTML = `Успішно додано: <b>${realProductName}</b> (Код: ${realProductCode}) у ящик <b>${boxCode}</b>`;
                infoBox.style.background = '#e2f0cb';
            }
        } else {
            alert("Помилка збереження товару в базу даних.");
        }
    } catch (err) {
        console.error("Помилка FIFO сканування:", err);
    } finally {
        // Повертаємо фокус для наступного сканування
        const input = document.getElementById('mainScanInput');
        if (input) input.focus();
    }
}
