// ★ Firebase Database URL (変更不可)
const FIREBASE_DB_URL = "https://synologychat-c1281-default-rtdb.firebaseio.com";

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const mainCard = document.getElementById('main-card');
    const statusContainer = document.getElementById('status-container');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const statusDesc = document.getElementById('status-desc');
    
    const mutePanel = document.getElementById('mute-panel');
    const muteToggle = document.getElementById('mute-toggle');
    const muteTitle = document.getElementById('mute-title');
    
    const connDot = document.getElementById('conn-dot');
    const connText = document.getElementById('conn-text');

    // 現在の状態を保持
    let currentSystemState = "unknown";
    let isMuted = false;

    // 初期起動時のデータ取得と定期ポーリングの開始
    fetchStateLoop();
    setInterval(fetchStateLoop, 3000); // 3秒おきに最新状態を取得

    // --- Firebaseからデータを取得する処理 ---
    async function fetchStateLoop() {
        try {
            // Firebaseのルートパス (/.json) から全データを一括取得
            const response = await fetch(`${FIREBASE_DB_URL}/.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // 通信成功UI
            connDot.classList.add('active');
            connText.textContent = 'Live Sync Active';

            if (data) {
                // system_state の取り出し (無ければ stopped 扱い)
                const newState = data.system_state || "stopped";
                // is_muted の取り出し
                const newMuteState = data.is_muted === true;

                // 状態が変化した時のみUIを更新する
                if (currentSystemState !== newState || isMuted !== newMuteState) {
                    currentSystemState = newState;
                    isMuted = newMuteState;
                    updateUI();
                }
            } else {
                // データが空の場合
                currentSystemState = "stopped";
                isMuted = false;
                updateUI();
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            // エラー表示
            connDot.classList.remove('active');
            connText.textContent = 'Connection Defaulted. Retrying...';
        }
    }

    // --- UIの描画更新処理 ---
    function updateUI() {
        // 一旦すべての状態クラスをリセット
        statusContainer.className = 'status-container';
        muteToggle.disabled = false;

        // トグルボタンの状態を反映
        muteToggle.checked = isMuted;

        if (isMuted) {
            muteTitle.textContent = "🔇 転送ブロック中";
            muteTitle.style.color = "var(--color-muted)";
        } else {
            muteTitle.textContent = "通知および画像転送は正常";
            muteTitle.style.color = "#f8fafc";
        }

        switch(currentSystemState) {
            case "alerting":
                // 🚨 警報発生中
                statusContainer.classList.add('state-alerting');
                statusIcon.textContent = "🚨";
                statusText.textContent = "Alarm Active!";
                statusDesc.textContent = "監視カメラが警報トリガーを検知しました";
                
                // ミュートパネルをスッと表示
                mutePanel.classList.add('visible');
                break;

            case "monitoring":
                // 🟢 監視中（待機）
                statusContainer.classList.add('state-monitoring');
                statusIcon.textContent = "🛡️";
                statusText.textContent = "Monitoring...";
                statusDesc.textContent = "システムは正常に監視を行っています";
                
                // 警報中ではないのでミュートパネルは隠す
                mutePanel.classList.remove('visible');
                break;

            case "stopped":
            default:
                // ⚪ 停止中
                statusContainer.classList.add('state-stopped');
                statusIcon.textContent = "💤";
                statusText.textContent = "System Stopped";
                statusDesc.textContent = "監視プログラムは現在停止しています";
                
                // 警報中ではないのでミュートパネルは隠す
                mutePanel.classList.remove('visible');
                break;
        }
    }

    // --- ミュートボタン（トグル）が押された時の処理 ---
    muteToggle.addEventListener('change', async (e) => {
        const targetMuteState = e.target.checked;
        
        // 連続クリック防止
        muteToggle.disabled = true;
        
        try {
            // is_muted の項目だけを更新する (HTTP PATCH)
            const response = await fetch(`${FIREBASE_DB_URL}/.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_muted: targetMuteState })
            });

            if (!response.ok) throw new Error('Update failed');
            
            // 成功したらローカルの変数も更新
            isMuted = targetMuteState;
            updateUI(); // 文字色などの変更を反映

        } catch (error) {
            console.error("Update Error:", error);
            alert("ミュートの切り替えに失敗しました。通信環境を確認してください。");
            // 失敗時はスイッチを元に戻す
            muteToggle.checked = !targetMuteState;
        } finally {
            muteToggle.disabled = false;
        }
    });

});
