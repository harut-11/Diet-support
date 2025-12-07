import base64
import io
import os
import json
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") 

if not GEMINI_API_KEY:
    # 実際の運用ではエラーハンドリングを適切に行ってください
    print("Warning: API Key not found.")

# APIキーがある場合のみ設定
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash') 

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        req_data = request.json
        input_type = req_data.get('type') 
        input_data = req_data.get('data')
        
        # アレルギー情報の受け取り
        allergies = req_data.get('allergies', '')

        # アレルギー指示の作成
        allergy_prompt = ""
        if allergies:
            allergy_prompt = f"\n【重要：アレルギー・除外食材】\nユーザーは「{allergies}」が苦手、またはアレルギーがあります。これらを含むレシピや食材は絶対に提案しないでください。"

        # --- AIへの指示（改良版プロンプト） ---
        base_prompt = f"""
        あなたはユーザーの健康を第一に考える、親しみやすい「専属AI管理栄養士」です。
        入力された情報（画像またはテキスト）をもとに、栄養バランスを整え、健康維持に役立つ情報をJSON形式で出力してください。

        {allergy_prompt}

        【基本ルール】
        1. グラム数や細かい数値は不要です。ユーザーが直感的に分かる内容にしてください。
        2. 「nutrients」には、その食材・料理に豊富に含まれる栄養素を挙げ、「type」を以下から判定してください。
           - "body" (体を作る：タンパク質、カルシウムなど)
           - "energy" (エネルギーになる：炭水化物、脂質など)
           - "condition" (調子を整える：ビタミン、ミネラル、食物繊維など)

        3. 「advice」の記述ルール（重要）:
           - 150文字以内で記述してください。
           - 単なる解説ではなく、「〇〇（栄養素）が含まれているので、疲労回復に効果的です」のように、**健康へのメリット**を伝えてください。
           - 入力が「料理」の場合は、「不足しがちな〇〇を副菜で補いましょう」といったアドバイスを含めてください。

        4. 「recipes」の提案ルール（重要）:
           - 提案するレシピ（または付け合わせ）は、必ず【初級】【中級】【上級】からそれぞれ1つずつ選出してください。
           - 合計で3つのレシピを出力してください。
           - 各レシピデータには "difficulty" フィールドを含め、値は "初級", "中級", "上級" のいずれかを明記してください。

        5. シチュエーションと栄養バランス（最重要）:
           - 入力が「食材」の場合：その食材の栄養を逃さず摂れる、または美味しく食べられるレシピを提案してください。
           - 入力が「料理」の場合：**その料理だけでは不足している栄養素（例：野菜、きのこ、海藻など）を補える**副菜やスープを提案してください。（例：ラーメンなら、炭水化物と塩分が多いので、カリウムを含む野菜サラダを提案するなど）

        【難易度の目安】
        - 初級: 包丁をほぼ使わない、レンジだけでできる、5分以内で終わるなど、疲れていても作れるもの。
        - 中級: 一般的な家庭料理レベル。15分〜20分程度。
        - 上級: 手間をかけて美味しく作る、凝った料理。

        【出力フォーマット（厳密なJSON）】
        {{
            "name": "食材・料理名（例：アボカド）",
            "nutrients": [
                {{"name": "タンパク質", "type": "body"}},
                {{"name": "脂質", "type": "energy"}},
                {{"name": "ビタミンE", "type": "condition"}},
                {{"name": "食物繊維", "type": "condition"}}
            ],
            "advice": "アボカドは『森のバター』と呼ばれ、良質な脂質を含みます。ビタミンEも豊富で抗酸化作用があり、若々しさを保つのに最適です。カロリーは高めなので、1日半分程度を目安にしましょう。",
            "recipes": [
                {{"title": "アボカドの海苔和え", "desc": "切って和えるだけ。3分で完成する超時短おつまみ。", "difficulty": "初級"}},
                {{"title": "アボカドとエビのグラタン", "desc": "トースターで焼くだけですが、見栄えの良い一品。", "difficulty": "中級"}},
                {{"title": "自家製ワカモレとハンバーガー", "desc": "スパイスを調合して作る本格派。", "difficulty": "上級"}}
            ]
        }}
        """

        response = None

        if input_type == 'image':
            # 画像の場合
            image_data = base64.b64decode(input_data.split(',')[1])
            image = Image.open(io.BytesIO(image_data))
            
            # 画像を渡して生成
            prompt = base_prompt + "\nこの画像の料理・食材について分析してください。"
            response = model.generate_content([prompt, image])
            
        elif input_type == 'text':
            # テキストの場合
            # テキストのみを渡して生成
            prompt = base_prompt + f"\n入力された料理・食材名は「{input_data}」です。これについて分析してください。"
            response = model.generate_content(prompt)
            
        else:
            return jsonify({'error': '不明な入力タイプです'}), 400
        
        # 整形処理
        if response and response.text:
            text_response = response.text.replace('```json', '').replace('```', '').strip()
            # JSONの前後に余計な文字がある場合のクリーニング
            if '{' in text_response:
                text_response = text_response[text_response.find('{'):text_response.rfind('}')+1]
            
            result_json = json.loads(text_response)
            return jsonify(result_json)
        else:
             return jsonify({'error': 'AIからの応答がありませんでした'}), 500

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': '解析に失敗しました'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)