# 実装ガイド

## セットアップ手順

### 1. プロジェクト初期化

```bash
# Bunを使用したAstroプロジェクトの作成
bun create astro@latest . --template minimal --typescript strict

# 主要な依存関係のインストール例
bun add astro @astrojs/svelte @astrojs/tailwind
bun add -d @octokit/rest dotenv commander
```

### 2. 主要な設定ファイル

- `astro.config.mjs` - Astro設定（Svelte、TailwindCSS統合）
- `tsconfig.json` - TypeScript設定
- `tailwind.config.cjs` - TailwindCSS設定
- `.env` - 環境変数（GitHub Token等）
- `config.json` - 監視対象アプリ設定

## 主要コンポーネント

- `AppCard.svelte` - 個別アプリ情報表示
- `Dashboard.svelte` - メインダッシュボード
- `index.astro` - エントリーポイント

## CLIスクリプト

### 主要機能
- GitHub API経由でのデータ取得
- iTunes Search APIでのApp Store情報取得
- JSONファイルへのデータ保存

### 実装するファイル
- `scripts/update-data.ts` - メイン更新スクリプト
- `scripts/github-api.ts` - GitHub API操作
- `scripts/store-api.ts` - ストアAPI操作

## 環境変数設定

### .env.example
```bash
# GitHub Personal Access Token
# Required scopes: repo (for private repos), public_repo (for public repos)
GITHUB_TOKEN=your_github_token_here
```

## 設定ファイル

### config.json
```json
{
  "apps": [
    {
      "id": "app1",
      "name": "My iOS App",
      "repository": "username/ios-app",
      "platform": "ios",
      "links": {
        "github": "https://github.com/username/ios-app",
        "appStore": "https://apps.apple.com/jp/app/my-app/id123456789"
      }
    },
    {
      "id": "app2",
      "name": "My Flutter App",
      "repository": "username/flutter-app",
      "platform": "both",
      "links": {
        "github": "https://github.com/username/flutter-app",
        "appStore": "https://apps.apple.com/jp/app/my-app/id123456789",
        "playStore": "https://play.google.com/store/apps/details?id=com.example.app"
      }
    },
    {
      "id": "app3",
      "name": "My Android App",
      "repository": "username/android-app",
      "platform": "android",
      "links": {
        "github": "https://github.com/username/android-app",
        "playStore": "https://play.google.com/store/apps/details?id=com.example.app"
      }
    }
  ]
}
```

## package.jsonスクリプト

主要なコマンド：
- `bun run dev` - 開発サーバー起動
- `bun run build` - 本番ビルド
- `bun run update` - データ更新


## 使用方法

1. **初期設定** - 環境変数とconfig.jsonを設定
2. **データ更新** - `bun run update`でデータ取得
3. **ダッシュボード起動** - `bun run dev`でローカルサーバー開始
4. **本番ビルド** - `bun run build`で静的ファイル生成