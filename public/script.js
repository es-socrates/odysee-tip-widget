const notification = document.getElementById('notification');
const ws = new WebSocket('ws://localhost:3000');
let AR_TO_USD = 0;

const REMOTE_SOUND_URL = 'https://cdn.streamlabs.com/users/80245534/library/cash-register-2.mp3';

ws.onopen = () => {
    console.log('✅ Connected to the WebSocket server');
    showConnectionStatus(true);
};

ws.onmessage = (event) => {
    try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'tip') {
            showNotification(msg.data);
        }
    } catch (error) {
        console.error('Error processing message:', error);
        showError('Error processing notification');
    }
};

ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
    showError('Server connection error');
};

ws.onclose = () => {
    showConnectionStatus(false);
};

function playRemoteSound() {
  const audio = new Audio(REMOTE_SOUND_URL);
  audio.volume = 0.4;
  
  audio.play()
    .then(() => console.log('🎵 Remote sound played'))
    .catch(e => console.error('Error playing:', e));
}

async function showNotification(data) {
    playRemoteSound();
    
    const notification = document.getElementById('notification');
    
    notification.style.display = 'none';
    void notification.offsetWidth;

async function updateExchangeRate() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd');
    const data = await response.json();
    if (data.arweave?.usd) {
      AR_TO_USD = data.arweave.usd;
    }
  } catch (error) {
    console.error('Error updating exchange rate:', error);
  }
}

await updateExchangeRate();
    
notification.innerHTML = `
    <div class="notification-content" style="background: #080c10;">
        <div class="notification-icon">
            <img src="https://odysee.com/public/favicon_128.png" alt="💰" style="width: 24px; height: 24px;" onerror="this.style.display='none'; this.parentNode.innerHTML='💰'">
        </div>
        <div class="notification-text">
            <div class="notification-title">🎉 New Tip Received!</div>
            
            <div class="amount-container">
                <div class="ar-amount">${data.amount} AR</div>
                <div class="usd-value">≈ $${(data.amount * AR_TO_USD).toFixed(2)} USD</div>
            </div>
            
            <div class="notification-from" style="margin-top: 8px;">
                📦 From: ${data.from.slice(0, 8)}... <span style="color: #00ff7f;">🟢 Thank you! 🤞</span>
            </div>
        </div>
    </div>
    <div class="progress-bar" style="background: #ca004b;"></div>
`;
    
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.style.display = 'none', 500);
    }, 15000);
}

function showError(message) {
    notification.innerHTML = `
        <div class="notification-content" style="color: #ff5555;">
            <div class="notification-icon">⚠️</div>
            <div class="notification-text">
                <div class="notification-title">Error</div>
                <div class="notification-from">${message}</div>
            </div>
        </div>
    `;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function showConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status') || document.createElement('div');
    statusElement.id = 'connection-status';
    // statusElement.innerHTML = connected ? '🟢 Connected' : '🔴 Offline';
    statusElement.style.position = 'absolute';
    statusElement.style.bottom = '10px';
    statusElement.style.left = '10px';
    statusElement.style.color = connected ? '#00ff7f' : '#ff5555';
    statusElement.style.fontFamily = "'Inter', sans-serif";
    statusElement.style.fontSize = '16px';
    document.body.appendChild(statusElement);
}