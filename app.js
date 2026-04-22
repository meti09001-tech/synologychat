document.addEventListener('DOMContentLoaded', () => {
    const muteToggle = document.getElementById('mute-toggle');
    const muteLabel = document.getElementById('mute-label');
    const statusMessage = document.getElementById('status-message');

    // ★ ここにURLをハードレコード（編集不可）
    const FIREBASE_DB_URL = "https://synologychat-c1281-default-rtdb.firebaseio.com";

    // 初期ロード
    fetchCurrentStatus();

    // 状態の取得
    async function fetchCurrentStatus() {
        muteToggle.disabled = true;
        statusMessage.textContent = '状態を取得中...';
        statusMessage.style.color = '#aaaaaa';

        try {
            const endpoint = `${FIREBASE_DB_URL}/status.json`;
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error('ネットワークエラー');
            }

            const data = await response.json();
            const isMuted = data && data.is_muted === true;

            muteToggle.checked = isMuted;
            updateLabel(isMuted);
            
            muteToggle.disabled = false;
            statusMessage.textContent = '✅ 接続成功。現在の状態を反映しました。';
            statusMessage.style.color = '#03dac6';
            
        } catch (error) {
            console.error(error);
            statusMessage.textContent = '❌ 状態の取得に失敗しました。';
            statusMessage.style.color = '#cf6679';
        }
    }

    // トグル切り替え時の処理
    muteToggle.addEventListener('change', async (e) => {
        const isMuted = e.target.checked;
        
        muteToggle.disabled = true;
        statusMessage.textContent = '更新中...';
        statusMessage.style.color = '#aaaaaa';
        updateLabel(isMuted); // UIは先に反映

        try {
            const endpoint = `${FIREBASE_DB_URL}/status.json`;
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_muted: isMuted })
            });

            if (!response.ok) {
                throw new Error('更新エラー');
            }

            statusMessage.textContent = '✅ 更新成功！';
            statusMessage.style.color = '#03dac6';
            
        } catch (error) {
            console.error(error);
            statusMessage.textContent = '❌ 更新に失敗しました';
            statusMessage.style.color = '#cf6679';
            // 失敗したら元に戻す
            muteToggle.checked = !isMuted;
            updateLabel(!isMuted);
        } finally {
            muteToggle.disabled = false;
        }
    });

    function updateLabel(isMuted) {
        if (isMuted) {
            muteLabel.textContent = '🔇 ミュート中 (通知OFF)';
            muteLabel.classList.add('muted');
        } else {
            muteLabel.textContent = '🔔 通知: ON (継続中)';
            muteLabel.classList.remove('muted');
        }
    }
});
