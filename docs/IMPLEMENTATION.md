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
- Google Play ScrapeでのGoogle Play情報取得
- 包括的なエラーハンドリングとログ機能
- 並列処理によるデータ取得最適化
- JSONファイルへのデータ保存

### ファイル構造

#### メインスクリプト

- `scripts/update-data.js` - CLI エントリーポイント（Commander.js使用）

#### モジュール (`scripts/lib/`)

- `data-merger.js` - アプリデータの統合処理
- `error-handler.js` - エラーハンドリングとグローバル例外処理
- `github-cli.js` - GitHub CLI ラッパー関数
- `itunes-api.js` - iTunes Search API 統合
- `json-writer.js` - JSON ファイル書き込み処理
- `logger.js` - ログ出力機能（verboseレベル対応）
- `milestones.js` - GitHub マイルストーン取得
- `play-store.js` - Google Play Store データ取得
- `pull-requests.js` - GitHub プルリクエスト取得
- `releases.js` - GitHub リリース情報取得
- `repository.js` - GitHub リポジトリ基本情報取得

### 実装パターン

各モジュールは以下のパターンで実装：

- エラーハンドリング統一
- Promise ベースの非同期処理
- モジュール化された単一責任の関数
- 詳細ログ出力対応

## 設定ファイル

### config.json

```json
{
  "repositories": [
    {
      "repository": "username/ios-app",
      "name": "iOS Application",
      "platforms": ["ios"],
      "appStoreId": "123456789"
    },
    {
      "repository": "username/flutter-app",
      "name": "Flutter App",
      "platforms": ["ios", "android"],
      "appStoreId": "123456789",
      "playStoreId": "com.username.flutterapp"
    },
    {
      "repository": "username/android-app",
      "name": "Android Application",
      "platforms": ["android"],
      "playStoreId": "com.username.androidapp"
    }
  ],
  "outputPath": "src/data/apps.json"
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

## CLIオプション

データ更新コマンド（`bun run update`）には以下のオプションが利用できます：

### 基本的なオプション

```bash
# 通常の実行
bun run update

# 詳細ログ付きで実行
bun run update --verbose

# カスタム設定ファイルを使用
bun run update --config custom-config.json

# ドライラン（ファイル保存なし）
bun run update --dry-run

# 複数オプションの組み合わせ
bun run update --verbose --dry-run --config test-config.json
```

### オプション詳細

| オプション        | 短縮形 | 説明                                            |
| ----------------- | ------ | ----------------------------------------------- |
| `--verbose`       | `-v`   | 詳細なログ出力（デバッグ情報、API呼び出し詳細） |
| `--config <path>` | `-c`   | 設定ファイルパス指定（デフォルト: config.json） |
| `--dry-run`       | なし   | テスト実行（JSONファイル書き込みをスキップ）    |
| `--help`          | `-h`   | ヘルプメッセージ表示                            |
