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

const fileInputLabel = document.querySelector('.custom-file-upload');

const textInput = document.getElementById('text-input');
const textBtn = document.getElementById('text-btn');

const previewArea = document.getElementById('preview-area');
const previewImg = document.getElementById('preview-img');
const previewOkBtn = document.getElementById('preview-ok-btn');
const previewCancelBtn = document.getElementById('preview-cancel-btn');

let currentUploadImage = null;

// 1. カメラ起動 
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { console.log("カメラなし、または許可されていません"); });

// --- UIリセット処理 (解析開始時) ---
function prepareUI() {
    resultArea.style.display = 'none';
    nutrientList.innerHTML = '';
    recipeList.innerHTML = '';
    
    // 全ボタンの無効化
    scanBtn.disabled = true;
    textBtn.disabled = true;
    
 
    fileInput.disabled = true;
    fileInputLabel.classList.add('disabled'); // 見た目をグレーアウト

    scanBtn.textContent = "AIが分析中...";
    textBtn.textContent = "分析中...";

    // プレビュー画面のボタン制御
    previewOkBtn.disabled = true;
    previewOkBtn.textContent = "⏳ 分析中...";
}

// --- UI復帰処理 (解析終了時) ---
function resetUI() {
    scanBtn.disabled = false;
    textBtn.disabled = false;
    
    // 【追加】画像選択ボタンを復帰（解析が終わったら押せるようにする）
    fileInput.disabled = false;
    fileInputLabel.classList.remove('disabled');

    scanBtn.textContent = "📷 撮影して分析";
    textBtn.textContent = "🔍 名前で検索";

    previewOkBtn.disabled = false;
    previewOkBtn.textContent = "✅ 分析する";
}

// --- 解析リクエスト送信 ---
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

            if (data.nutrients && Array.isArray(data.nutrients)) {
                data.nutrients.forEach(item => {
                    const span = document.createElement('span');
                    span.classList.add('nutrient-tag');
                    if (item.type) span.classList.add(`tag-${item.type}`);
                    span.textContent = item.name;
                    nutrientList.appendChild(span);
                });
            }

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

// カメラ撮影ボタン
scanBtn.addEventListener('click', async () => {
    prepareUI();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    await sendAnalyzeRequest({ type: 'image', data: imageData });
});

// ファイルアップロード (ファイルが選択されたとき)
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            currentUploadImage = event.target.result;

            const videoHeight = video.offsetHeight;
            if (videoHeight > 0) {
                previewImg.style.height = `${videoHeight}px`;
            } else {
                previewImg.style.height = 'auto';
            }

            video.style.display = 'none';
            previewArea.style.display = 'block';
            previewImg.src = currentUploadImage;
            
            previewArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

            
            fileInput.disabled = true;
            fileInputLabel.classList.add('disabled');
        };

        reader.readAsDataURL(e.target.files[0]);
    }
});

// プレビュー画面の「解析する」ボタン
previewOkBtn.addEventListener('click', async () => {
    if (!currentUploadImage) return;

    prepareUI();
    await sendAnalyzeRequest({ type: 'image', data: currentUploadImage });
    
    // 解析後にプレビューを閉じる
    closePreview();
});

// やめるボタンが押されたとき
previewCancelBtn.addEventListener('click', () => {
    closePreview();
    // closePreview内でボタン復帰処理
});

// プレビューを閉じてカメラに戻す関数
function closePreview() {
    previewArea.style.display = 'none';
    video.style.display = 'block';

    
    fileInput.disabled = false;
    fileInputLabel.classList.remove('disabled');

    fileInput.value = ''; 
    currentUploadImage = null;
}

// テキスト入力ボタン
textBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
        alert("食材や料理名を入力してください");
        return;
    }
    prepareUI();
    await sendAnalyzeRequest({ type: 'text', data: text });

    textInput.value = '';
});
