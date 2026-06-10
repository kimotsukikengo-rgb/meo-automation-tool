# デプロイ手順（社内共有用）

このリポジトリを **クローン → 編集 → デプロイ** するための手順です。
Next.js アプリなので **Vercel** へのデプロイが最も簡単です（無料枠で可）。

---

## 0. 必要なもの

- GitHub アカウント（このリポジトリへのアクセス権）
- [Vercel](https://vercel.com) アカウント（GitHubでサインイン可）
- ローカルで動かす場合：Node.js 20以上

---

## 1. ローカルで動かす

```bash
git clone https://github.com/kimotsukikengo-rgb/meo-automation-tool.git
cd meo-automation-tool
npm install
npm run dev
# → http://localhost:3000
```

APIキーが無くても **サンプルモード** で全機能を試せます。

---

## 2. Vercel へデプロイ（推奨・最短）

### A. ダッシュボードから（クリックのみ）

1. [vercel.com/new](https://vercel.com/new) を開く
2. このGitHubリポジトリを **Import**
3. Framework は **Next.js** が自動検出される → そのまま **Deploy**
4. 数十秒で公開URL（`https://<プロジェクト名>.vercel.app`）が発行される

> 環境変数は未設定でOK（サンプルモードで動作）。本物のAI生成を使う場合は手順3を参照。

### B. CLI から

```bash
npm i -g vercel
vercel        # 初回はログイン＆プロジェクト紐付け（プレビュー）
vercel --prod # 本番デプロイ
```

---

## 3. 本物のAI生成を有効にする（任意）

サンプルモードではテンプレート生成になります。Claudeによる生成にするには、
Vercel のプロジェクト設定 → **Settings → Environment Variables** に追加：

| キー | 値 |
|---|---|
| `AI_GATEWAY_API_KEY` | [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) で発行したキー |
| `MEO_GENERATION_MODEL` | `anthropic/claude-sonnet-4-6`（任意。未設定時の既定値） |

追加後に再デプロイすると、各モジュールのバッジが「● AI生成」に変わります。

> ローカルで使う場合は、プロジェクト直下に `.env.local` を作って同じ内容を記載します。
> `.env.local` は `.gitignore` 済みなので、キーがコミットされる心配はありません。

---

## 4. 変更を反映する（誰でもプッシュ→自動デプロイ）

Vercel と GitHub を連携しておくと、**main にプッシュするたびに自動で本番デプロイ**されます。

```bash
git checkout -b feature/xxxx   # 作業ブランチ（推奨）
# 編集...
git add -A
git commit -m "変更内容"
git push -u origin feature/xxxx
# GitHub上でPull Request → main にマージ → 自動デプロイ
```

> このリポジトリへ **プッシュ権限** が必要です。
> 持っていない場合はリポジトリ管理者に **Collaborator 招待**（Settings → Collaborators）を依頼してください。
> Pull Request ごとに **プレビューURL** が自動発行されるので、マージ前に動作確認できます。

---

## 5. 注意

- 試作段階のため、レポートの数値はサンプルデータです（実データはGBP API連携が必要）。
- APIキーなどの秘密情報は **絶対にコードに書かない**。必ず環境変数（Vercel / `.env.local`）で管理してください。
