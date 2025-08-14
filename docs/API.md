# API ドキュメント

## GitHub CLI 統合

### 使用するGitHub CLIコマンド

#### 1. リポジトリ情報の取得

```bash
gh repo view {owner}/{repo} --json name,description,url,defaultBranchRef,updatedAt
```

**レスポンス例:**

```json
{
  "name": "app-name",
  "description": "アプリの説明",
  "url": "https://github.com/owner/app-name",
  "defaultBranchRef": {
    "name": "main"
  },
  "updatedAt": "2024-08-14T10:00:00Z"
}
```

#### 2. 最新リリースの取得

```bash
gh release view --repo {owner}/{repo} --json tagName,name,publishedAt,url,body
```

**レスポンス例:**

```json
{
  "tagName": "v1.2.3",
  "name": "Release v1.2.3",
  "publishedAt": "2024-08-10T10:00:00Z",
  "url": "https://github.com/owner/app-name/releases/tag/v1.2.3",
  "body": "リリースノート内容"
}
```

#### 3. マイルストーンの取得

```bash
# オープン状態のマイルストーンを取得
gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.state == "open")'

# 完了率でソート
gh api repos/{owner}/{repo}/milestones?sort=completeness&direction=desc
```

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

```bash
# オープンなPRを最新順で取得（最新3件）
gh pr list --repo {owner}/{repo} --state open --limit 3 --json title,url,state,createdAt,updatedAt,mergedAt,author

# マージ済みPRを取得
gh pr list --repo {owner}/{repo} --state merged --limit 5
```

**レスポンス例:**

```json
[
  {
    "title": "認証バグの修正",
    "url": "https://github.com/owner/app-name/pull/42",
    "state": "OPEN",
    "createdAt": "2024-08-12T10:00:00Z",
    "updatedAt": "2024-08-12T14:30:00Z",
    "mergedAt": null,
    "author": {
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
    repository: string; // "owner/repo" 形式
    icon: string; // アイコンファイルパス
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

| オプション   | 説明                           | 例           |
| ------------ | ------------------------------ | ------------ |
| `--app <id>` | 特定のアプリIDのみ更新         | `--app app1` |
| `--verbose`  | 詳細なログを出力               | `--verbose`  |
| `--dry-run`  | 実際の更新を行わずにテスト実行 | `--dry-run`  |

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
