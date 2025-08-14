# アーキテクチャドキュメント

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│                  (Astro + Svelte)                       │
├─────────────────────────────────────────────────────────┤
│                    Static Assets                         │
│              (HTML, CSS, JavaScript)                     │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                           │
│                  (JSON Storage)                         │
├─────────────────────────────────────────────────────────┤
│                  Update Service                         │
│              (CLI with GitHub API)                      │
└─────────────────────────────────────────────────────────┘
```

## ディレクトリ構造（参考）

※ 以下は参考例です。プロジェクトの要件に合わせて適宜調整してください。

```
app-dashboard/
├── src/                      # ソースコード
├── scripts/                  # CLIツール
├── public/                   # 静的アセット
├── docs/                     # ドキュメント
└── [設定ファイル等]
```

### データフロー

1. **データ更新プロセス**

   ```
   GitHub API → CLIスクリプト → データ処理 → JSONへ書き込み → ダッシュボードが読み込み
   ```

2. **レンダリングプロセス**

   ```
   apps.json → Astroページ → Svelteコンポーネント → HTML出力
   ```

3. **ユーザーインタラクション**
   ```
   ユーザークリック → 外部リンクを開く → GitHub/ストアへ移動
   ```

## データスキーマ

### アプリデータ構造

```typescript
interface AppData {
  apps: App[];
}

interface App {
  id: string; // 一意識別子
  name: string; // 表示名
  repository: string; // GitHubリポジトリ (owner/name)
  platform: 'ios' | 'android' | 'both'; // プラットフォーム
  icon?: string; // アイコンURL（APIから自動取得）
  links: AppLinks; // 外部リンク
  latestRelease: Release; // 最新リリース情報（GitHub）
  storeVersions?: {
    // ストアバージョン
    appStore?: string;
    playStore?: string;
  };
  milestone: Milestone; // 現在のマイルストーン
  recentPRs: PullRequest[]; // 最近のPR
  lastUpdated: string; // ISO 8601タイムスタンプ
}

interface AppLinks {
  github: string;
  appStore?: string;
  playStore?: string;
}

interface Release {
  version: string;
  date: string;
  url: string;
}

interface Milestone {
  title: string;
  openIssues: number;
  closedIssues: number;
}

interface PullRequest {
  title: string;
  url: string;
  state: 'open' | 'closed' | 'merged';
  mergedAt?: string;
}
```

## API統合

### 使用するGitHub APIエンドポイント

- `/repos/{owner}/{repo}` - リポジトリ情報
- `/repos/{owner}/{repo}/releases/latest` - 最新リリース
- `/repos/{owner}/{repo}/milestones` - マイルストーンデータ
- `/repos/{owner}/{repo}/pulls` - プルリクエスト

### レート制限戦略

- レスポンスをローカルにキャッシュ
- APIリクエストをバッチ処理
- 条件付きリクエストを使用 (ETags)
- エクスポネンシャルバックオフを実装

## ビルドプロセス

1. **開発ビルド**

   ```bash
   bun run dev
   ```

   - ホットモジュールリプレースメント
   - ソースマップ有効
   - デバッグログ

2. **本番ビルド**
   ```bash
   bun run build
   ```
   - ミニファイ
   - ツリーシェイキング
   - アセット最適化

## ローカル実行

### 開発環境

```bash
bun run dev
```

### ビルドしたファイルの確認

```bash
bun run build
bun run preview
```

※ ローカル環境でのみ使用するため、デプロイは不要です。

