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

## App Store 情報の取得

### iTunes Search API

App StoreのバージョンやアイコンはiTunes Search APIから取得します。

## Google Play Store 情報の取得

### Google Play Scraper

Google Playのバージョンやアイコンはgoogle-play-scraperライブラリから取得します。

- スクレイピングベースのため、仕様変更により動作しなくなる可能性があります
- エラーハンドリングが重要（アプリが見つからない場合等）
- 日本語ロケール（`lang: 'ja'`, `country: 'jp'`）で取得

## エラーハンドリングシステム

### CLIError クラス

カスタムエラークラスを使用してCLI特有のエラーを管理します。

```javascript
export class CLIError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
  }
}
```

#### 使用例

```javascript
// 設定ファイルが見つからない場合
if (!existsSync(configPath)) {
  throw new CLIError(`Configuration file not found at ${configPath}`);
}

// JSON解析エラー
try {
  config = JSON.parse(configContent);
} catch (error) {
  throw new CLIError(`Failed to parse configuration file: ${error.message}`);
}
```

### エラーハンドラー

#### 統一エラー処理

```javascript
export function handleError(error, logger) {
  if (error instanceof CLIError) {
    logger.error(error.message);
    process.exit(error.code);
  } else if (error instanceof Error) {
    logger.error(`Unexpected error: ${error.message}`);
    if (logger.isVerbose) {
      logger.error(error.stack);
    }
    process.exit(1);
  } else {
    logger.error(`Unknown error: ${error}`);
    process.exit(1);
  }
}
```

#### グローバル例外キャッチ

```javascript
export function setupGlobalErrorHandlers(logger) {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error.message);
    if (logger.isVerbose) {
      logger.error(error.stack);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}
```

## ログシステム

### Logger クラス

階層化されたログレベルを提供します。

```javascript
export class Logger {
  constructor(verbose = false) {
    this.isVerbose = verbose;
  }

  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
  }

  verbose(message, ...args) {
    if (this.isVerbose) {
      console.log(`[VERBOSE] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  success(message, ...args) {
    console.log(`[SUCCESS] ${message}`, ...args);
  }
}
```

### ログレベル

| レベル    | 用途                                     | 表示条件         |
| --------- | ---------------------------------------- | ---------------- |
| `INFO`    | 一般的な処理状況の報告                   | 常時表示         |
| `VERBOSE` | 詳細な処理内容やデバッグ情報             | --verbose 時のみ |
| `WARN`    | 警告（処理は継続するが注意が必要な状況） | 常時表示         |
| `ERROR`   | エラー（処理が失敗した場合）             | 常時表示         |
| `SUCCESS` | 処理完了や成功の報告                     | 常時表示         |

### 使用例

```javascript
// ロガーの初期化
const logger = createLogger(options.verbose);

// 各種ログの出力
logger.info('App Dashboard Data Updater');
logger.verbose('Command line options:', options);
logger.warn(`Failed to process ${failedApps.length}`);
logger.error('Configuration file not found');
logger.success(`Update completed in ${duration}s`);
```

### 実装での活用

#### 並列処理でのエラー管理

```javascript
const results = await Promise.allSettled(
  config.repositories.map(async (repoConfig) => {
    logger.verbose(`Processing ${repoConfig.repository}...`);
    const appData = await mergeAppData(repoConfig);
    logger.verbose(`✓ Completed ${repoConfig.repository}`);
    return appData;
  })
);

// 成功・失敗の結果を分離
results.forEach((result, index) => {
  const repoConfig = config.repositories[index];
  if (result.status === 'fulfilled') {
    successfulApps.push(result.value);
  } else {
    logger.error(`Failed to process ${repoConfig.repository}: ${result.reason.message}`);
  }
});
```
