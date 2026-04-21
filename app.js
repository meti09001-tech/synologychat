document.addEventListener('DOMContentLoaded', () => {
    const dbUrlInput = document.getElementById('db-url');
    const saveBtn = document.getElementById('save-settings');
    const muteToggle = document.getElementById('mute-toggle');
    const muteLabel = document.getElementById('mute-label');
    const statusMessage = document.getElementById('status-message');

    // ローカルストレージから設定を読み込む
    const savedUrl = localStorage.getItem('firebase_db_url');
    if (savedUrl) {
        dbUrlInput.value = savedUrl;
        fetchCurrentStatus();
    } else {
        statusMessage.textContent = '❌ 設定からFirebase URLを入力してください';
        statusMessage.style.color = '#cf6679';
    }

    // 設定保存ボタン
    saveBtn.addEventListener('click', () => {
        let url = dbUrlInput.value.trim();
        if (!url) {
            alert('URLを入力してください');
            return;
        }
        // スラッシュをトリム
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }
        
        localStorage.setItem('firebase_db_url', url);
        statusMessage.textContent = '✅ 設定を保存しました';
        statusMessage.style.color = '#03dac6';
        fetchCurrentStatus();
    });

    // 状態の取得
    async function fetchCurrentStatus() {
        const url = localStorage.getItem('firebase_db_url');
        if (!url) return;

        muteToggle.disabled = true;
        statusMessage.textContent = '状態を取得中...';
        statusMessage.style.color = '#aaaaaa';

        try {
            // Firebase REST API のエンドポイント (status.json)
            const endpoint = `${url}/status.json`;
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
            statusMessage.textContent = '❌ 状態の取得に失敗しました。URLを確認してください。';
            statusMessage.style.color = '#cf6679';
        }
    }

    // トグル切り替え時の処理
    muteToggle.addEventListener('change', async (e) => {
        const isMuted = e.target.checked;
        const url = localStorage.getItem('firebase_db_url');
        
        if (!url) return;

        muteToggle.disabled = true;
        statusMessage.textContent = '更新中...';
        statusMessage.style.color = '#aaaaaa';
        updateLabel(isMuted); // UIは先に反映

        try {
            const endpoint = `${url}/status.json`;
            const response = await fetch(endpoint, {
                method: 'PUT', // 既存データを上書き
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
