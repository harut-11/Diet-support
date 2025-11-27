const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const resultArea = document.getElementById('result-area');
const foodName = document.getElementById('food-name');
const foodAdvice = document.getElementById('food-advice');
const nutrientList = document.getElementById('nutrient-list');
const recipeList = document.getElementById('recipe-list');

// 入力要素
const scanBtn = document.getElementById('scan-btn');
const fileInput = document.getElementById('file-input');
const textInput = document.getElementById('text-input');
const textBtn = document.getElementById('text-btn');

// 1. カメラ起動 (変更なし)
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { console.log("カメラなし、または許可されていません"); });

// --- 共通: UIリセット処理 ---
function prepareUI() {
    resultArea.style.display = 'none';
    nutrientList.innerHTML = '';
    recipeList.innerHTML = '';
    
    // ボタンの無効化（連打防止）
    scanBtn.disabled = true;
    textBtn.disabled = true;
    scanBtn.textContent = "AIが解析中...";
    textBtn.textContent = "解析中...";
}

// --- 共通: UI復帰処理 ---
function resetUI() {
    scanBtn.disabled = false;
    textBtn.disabled = false;
    scanBtn.textContent = "📷 カメラで撮影して分析";
    textBtn.textContent = "🔍 名前で検索";
}

// --- 共通: 解析リクエスト送信 ---
async function sendAnalyzeRequest(payload) {
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            alert("解析エラー: " + data.error);
        } else {
            resultArea.style.display = 'block';
            foodName.textContent = `🍽️ ${data.name}`;
            foodAdvice.textContent = `💡 ${data.advice}`;

            // 栄養素タグ
            if (data.nutrients && Array.isArray(data.nutrients)) {
                data.nutrients.forEach(item => {
                    const span = document.createElement('span');
                    span.classList.add('nutrient-tag');
                    if (item.type) span.classList.add(`tag-${item.type}`);
                    span.textContent = item.name;
                    nutrientList.appendChild(span);
                });
            }

            // レシピカード
            if (data.recipes && Array.isArray(data.recipes)) {
                data.recipes.forEach(recipe => {
                    const div = document.createElement('div');
                    div.className = 'recipe-card';
                    div.innerHTML = `<h4>${recipe.title}</h4><p>${recipe.desc}</p>`;
                    div.onclick = () => {
                        const query = encodeURIComponent(`${recipe.title} レシピ`);
                        window.open(`https://www.google.com/search?q=${query}`, '_blank');
                    };
                    recipeList.appendChild(div);
                });
            }
        }
    } catch (error) {
        console.error(error);
        alert("システムエラーが発生しました");
    } finally {
        resetUI();
    }
}

// 2. カメラ撮影ボタン
scanBtn.addEventListener('click', async () => {
    prepareUI();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    // 画像として送信
    await sendAnalyzeRequest({ type: 'image', data: imageData });
});

// 3. ファイルアップロード (ファイルが選択されたら即実行)
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        prepareUI();
        const reader = new FileReader();
        reader.onload = async function(event) {
            const imageData = event.target.result;
            // 画像として送信
            await sendAnalyzeRequest({ type: 'image', data: imageData });
            fileInput.value = ''; // 次回のためにリセット
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// 4. テキスト入力ボタン
textBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
        alert("食材や料理名を入力してください");
        return;
    }
    prepareUI();
    // テキストとして送信
    await sendAnalyzeRequest({ type: 'text', data: text });
});