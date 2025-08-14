# API ドキュメント

## GitHub API 統合

### 認証

GitHub APIへのアクセスには個人アクセストークン（PAT）が必要です。

#### 必要なスコープ
- `public_repo` - パブリックリポジトリへのアクセス
- `repo` - プライベートリポジトリへのアクセス（必要な場合）

#### トークンの設定
```bash
# .envファイルに設定
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### 使用するAPIエンドポイント

#### 1. リポジトリ情報の取得
```typescript
GET /repos/{owner}/{repo}
```

**レスポンス例:**
```json
{
  "name": "app-name",
  "full_name": "owner/app-name",
  "description": "アプリの説明",
  "html_url": "https://github.com/owner/app-name",
  "default_branch": "main",
  "updated_at": "2024-08-14T10:00:00Z"
}
```

#### 2. 最新リリースの取得
```typescript
GET /repos/{owner}/{repo}/releases/latest
```

**レスポンス例:**
```json
{
  "tag_name": "v1.2.3",
  "name": "Release v1.2.3",
  "published_at": "2024-08-10T10:00:00Z",
  "html_url": "https://github.com/owner/app-name/releases/tag/v1.2.3",
  "body": "リリースノート内容"
}
```

#### 3. マイルストーンの取得
```typescript
GET /repos/{owner}/{repo}/milestones
```

**パラメータ:**
- `state`: `open` | `closed` | `all`
- `sort`: `due_on` | `completeness`
- `direction`: `asc` | `desc`

**レスポンス例:**
```json
[
  {
    "title": "v1.3.0",
    "description": "次期バージョンの目標",
    "open_issues": 5,
    "closed_issues": 12,
    "due_on": "2024-09-01T00:00:00Z",
    "html_url": "https://github.com/owner/app-name/milestone/1"
  }
]
```

#### 4. プルリクエストの取得
```typescript
GET /repos/{owner}/{repo}/pulls
```

**パラメータ:**
- `state`: `open` | `closed` | `all`
- `sort`: `created` | `updated` | `popularity`
- `direction`: `asc` | `desc`
- `per_page`: 取得件数（デフォルト: 30、最大: 100）

**レスポンス例:**
```json
[
  {
    "title": "認証バグの修正",
    "html_url": "https://github.com/owner/app-name/pull/42",
    "state": "open",
    "created_at": "2024-08-12T10:00:00Z",
    "updated_at": "2024-08-12T14:30:00Z",
    "merged_at": null,
    "user": {
      "login": "username"
    }
  }
]
```

## データ構造

### App インターフェース

```typescript
interface App {
  // 基本情報
  id: string;
  name: string;
  repository: string;
  icon: string;
  
  // リンク
  links: {
    github: string;
    appStore?: string;
    playStore?: string;
  };
  
  // リリース情報
  latestRelease: {
    version: string;
    date: string;
    url: string;
  } | null;
  
  // マイルストーン
  milestone: {
    title: string;
    openIssues: number;
    closedIssues: number;
  } | null;
  
  // プルリクエスト
  recentPRs: Array<{
    title: string;
    url: string;
    state: 'open' | 'closed' | 'merged';
    mergedAt?: string;
  }>;
  
  // プラットフォーム
  platform: 'ios' | 'android' | 'both';
  
  // アイコン（APIから自動取得）
  icon?: string;
  
  // ストアバージョン
  storeVersions?: {
    appStore?: string;
    playStore?: string;
  };
  
  // メタデータ
  lastUpdated: string;
}
```

### 設定ファイル構造

```typescript
interface Config {
  apps: Array<{
    id: string;
    name: string;
    repository: string;  // "owner/repo" 形式
    icon: string;       // アイコンファイルパス
    links: {
      github: string;
      appStore?: string;
      playStore?: string;
    };
  }>;
}
```

## CLI コマンド

### データ更新コマンド

#### 全アプリの更新
```bash
bun run update
```

#### 特定アプリの更新
```bash
bun run update:app <app-id>
```

### オプション

| オプション | 説明 | 例 |
|---------|------|-----|
| `--app <id>` | 特定のアプリIDのみ更新 | `--app app1` |
| `--verbose` | 詳細なログを出力 | `--verbose` |
| `--dry-run` | 実際の更新を行わずにテスト実行 | `--dry-run` |

## エラーハンドリング

### APIレート制限
GitHub APIには以下のレート制限があります：
- 認証なし: 60リクエスト/時間
- 認証あり: 5,000リクエスト/時間

レート制限に達した場合の対処：
1. 環境変数 `GITHUB_TOKEN` が正しく設定されているか確認
2. キャッシュを活用して不要なリクエストを削減
3. バッチ処理間隔を調整

### エラーコード

| コード | 説明 | 対処法 |
|-------|------|--------|
| 401 | 認証エラー | トークンの有効性を確認 |
| 403 | アクセス権限なし | トークンのスコープを確認 |
| 404 | リソースが見つからない | リポジトリ名を確認 |
| 422 | 検証エラー | リクエストパラメータを確認 |
| 429 | レート制限超過 | 時間をおいて再試行 |

## キャッシュ戦略

### ローカルキャッシュ
```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  etag?: string;
}

// キャッシュの有効期限（ミリ秒）
const CACHE_TTL = {
  release: 3600000,    // 1時間
  milestone: 1800000,  // 30分
  pulls: 600000,       // 10分
};
```

### 条件付きリクエスト
ETagを使用した条件付きリクエスト：
```typescript
const response = await octokit.request('GET /repos/{owner}/{repo}', {
  owner,
  repo,
  headers: {
    'If-None-Match': cachedEtag
  }
});

// 304 Not Modified の場合、キャッシュを使用
if (response.status === 304) {
  return cachedData;
}
```

## App Store 情報の取得

### iTunes Search API

App Storeのバージョン情報はiTunes Search APIを使用して取得します。

#### エンドポイント
```
GET https://itunes.apple.com/lookup?id={app-id}
```

#### App IDの取得方法
App Store URLからIDを抽出：
```
https://apps.apple.com/jp/app/[app-name]/id6446930619
                                            ^^^^^^^^^
                                            この部分がApp ID
```

#### CLIでの実行例
```bash
curl https://itunes.apple.com/lookup?id=6446930619 | jq -r '.results[].version'
```

#### レスポンス例
```json
{
  "resultCount": 1,
  "results": [
    {
      "version": "1.2.3",
      "trackName": "App Name",
      "bundleId": "com.example.app",
      "artworkUrl60": "https://is1-ssl.mzstatic.com/image/thumb/.../60x60bb.jpg",
      "artworkUrl100": "https://is1-ssl.mzstatic.com/image/thumb/.../100x100bb.jpg",
      "artworkUrl512": "https://is1-ssl.mzstatic.com/image/thumb/.../512x512bb.jpg",
      "releaseDate": "2024-08-10T07:00:00Z",
      "currentVersionReleaseDate": "2024-08-10T07:00:00Z",
      "releaseNotes": "リリースノート"
    }
  ]
}
```

#### 取得できる情報
- `version`: 現在のバージョン
- `artworkUrl60/100/512`: アイコン画像のURL（サイズ別）
- `trackName`: アプリ名
- `bundleId`: Bundle ID
- `releaseDate`: 初回リリース日
- `currentVersionReleaseDate`: 現バージョンのリリース日

#### 注意事項
- iTunes Search APIは公式APIで、認証不要
- レート制限は緩やかで、通常の使用では問題になりません
- スクレイピングよりも安定して動作します