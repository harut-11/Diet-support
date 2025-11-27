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
    raise ValueError("APIキーが見つかりません。")

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

        # --- AIへの指示（共通プロンプト） ---
        base_prompt = """
        あなたはプロの管理栄養士かつ料理研究家です。
        入力された情報（画像またはテキスト）をもとに、以下の情報をJSON形式で出力してください。

        【ルール】
        1. グラム数や数値は不要です。
        2. 「nutrients」には、含まれる主な栄養素をリストアップし、それぞれの「type」を以下から判定してください。
           - "body" (体を作る：タンパク質、アミノ酸など)
           - "energy" (エネルギーになる：炭水化物、脂質、糖質など)
           - "condition" (調子を整える：ビタミン、ミネラル、食物繊維など)
        3. 「recipes」には、以下の提案を含めてください。
           - それが「食材（例：リンゴ）」なら、それを使ったおすすめレシピを3つ。
           - それが「料理（例：オムライス）」なら、それに合う副菜やスープを3つ。

        【出力フォーマット（厳密なJSON）】
        {
            "name": "食材・料理名（例：アボカド）",
            "nutrients": [
                {"name": "タンパク質", "type": "body"},
                {"name": "脂質", "type": "energy"},
                {"name": "ビタミンE", "type": "condition"},
                {"name": "食物繊維", "type": "condition"}
            ],
            "advice": "この食材の健康効果やアドバイスを100文字以内で。",
            "recipes": [
                {"title": "レシピ名1", "desc": "簡単な説明"},
                {"title": "レシピ名2", "desc": "簡単な説明"},
                {"title": "レシピ名3", "desc": "簡単な説明"}
            ]
        }
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
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        result_json = json.loads(text_response)
        
        return jsonify(result_json)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': '解析に失敗しました'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
