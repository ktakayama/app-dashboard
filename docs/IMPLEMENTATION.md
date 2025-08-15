# 実装ガイド

## セットアップ手順

### 1. プロジェクト初期化

```bash
# Bunを使用したAstroプロジェクトの作成
bun create astro@latest . --template minimal --typescript strict

# 主要な依存関係のインストール例
bun add astro @astrojs/svelte @astrojs/tailwind
```

### 2. 主要な設定ファイル

- `astro.config.mjs` - Astro設定（Svelte、TailwindCSS統合）
- `tsconfig.json` - TypeScript設定
- `tailwind.config.cjs` - TailwindCSS設定
- `config.json` - 監視対象アプリ設定

## 主要コンポーネント

- `AppCard.svelte` - 個別アプリ情報表示
- `Dashboard.svelte` - メインダッシュボード
- `index.astro` - エントリーポイント

## CLIスクリプト

### 主要機能

- GitHub CLI（`gh`）経由でのデータ取得
- iTunes Search APIでのApp Store情報取得
- JSONファイルへのデータ保存

### 実装するファイル

- `scripts/update-data.js` - メイン更新スクリプト（GitHub CLI使用）
- `scripts/store-api.js` - ストアAPI操作

## 設定ファイル

### config.json

```json
{
  "repositories": [
    {
      "owner": "username",
      "repo": "ios-app",
      "appName": "iOS Application",
      "platforms": ["ios"],
      "appStoreId": "123456789"
    },
    {
      "owner": "username",
      "repo": "flutter-app",
      "appName": "Flutter App",
      "platforms": ["ios", "android"],
      "appStoreId": "123456789"
    },
    {
      "owner": "username",
      "repo": "android-app",
      "appName": "Android Application",
      "platforms": ["android"]
    }
  ],
  "outputPath": "src/data/apps.json",
  "itunesSearchUrl": "https://itunes.apple.com/search"
}
```

## package.jsonスクリプト

主要なコマンド：

- `bun run dev` - 開発サーバー起動
- `bun run build` - 本番ビルド
- `bun run update` - データ更新

## 使用方法

1. **GitHub CLI認証** - `gh auth login`で認証設定
2. **設定ファイル** - config.jsonを設定
3. **データ更新** - `bun run update`でデータ取得
4. **ダッシュボード起動** - `bun run dev`でローカルサーバー開始
5. **本番ビルド** - `bun run build`で静的ファイル生成
