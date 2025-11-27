# 食生活をサポート
## あなたの食生活それで大丈夫ですか。栄養素足りてますか。料理作ってますか。周りで食生活の悪化で体調を崩した方がいます。このような問題を解決すべくアプリを開発しました。

## インストールとセットアップ

プロジェクトをローカル環境で動かすための手順を説明します。

### 前提条件

このプロジェクトを実行するために必要なソフトウェアやツールを記載します。
- パソコン(Windows, macOS)
- Google Chrome
- Visual Studio Code(推奨エディタ) → Visual Studio Codeが未インストールの場合は、[こちら](https://code.visualstudio.com/download)
- Python

### 手順

1.  **リポジトリのクローン**

    ```bash
    git clone [https://github.com/あなたのユーザー名/あなたのリポジトリ名.git](https://github.com/あなたのユーザー名/あなたのリポジトリ名.git)
    cd あなたのリポジトリ名
    ```

2.  **仮想環境の構築**

    仮想環境を作成
    ```bash
    python3 -m venv venv
    ```
    ```bash
    python -m venv venv
    ```
- ↑上記のどちらかを

    仮想環境に入る
    ```bash
    venv\Scripts\activate
    ```
    
    仮想環境を終了する(作業を終えてVS Codeなどを閉じるときは、以下のコマンドを実行して仮想環境から抜けてください。)
    ```bash
    deactivate
    ```

2.  **Gemini API キーの作成**

    以下のURLからGemini API キーを作成してください。

    [Gemini API キーの作成](https://ai.google.dev/gemini-api/docs?hl=)

3. **.envファイルの設定**
   
`.env.example`を参考に、プロジェクトのルートディレクトリに`.env`ファイルを作成し、取得したすべてのキーを設定してください。（.env.exampleに設定する場合は、ファイル名を.envに変更することを忘れないようにしましょう）

```
# Gemini APIキー
GEMINI_API_KEY=あなたのGemini APIキー
```

4. **必要なパッケージをインストール**

   ```bash
   pip install flask google-generativeai python-dotenv pillow
   ```
   ↓のようなエラーが出た場合は、パソコンの容量を空けてください。
   ```
   ERROR: Could not install packages due to an OSError: [Errno 28] No space left on device
   ```
   ↓例として、以下のコマンドを入力し再インストールしてください。
   ```
   python -m pip cache purge
   ```
   
   
5.  **アプリケーションの起動**

    以下のコマンドを実行してアプリケーションを起動します。

    ```bash
    python app.py

    ```

---
