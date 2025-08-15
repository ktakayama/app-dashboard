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

#### 基本的な実行

```bash
# すべてのリポジトリのデータを更新
bun run update
```

#### オプション付きでの実行例

```bash
# 詳細ログ付きで実行（推奨：問題調査時）
bun run update --verbose

# カスタム設定ファイルを使用
bun run update --config path/to/custom-config.json

# テスト実行（データ取得はするがファイル保存しない）
bun run update --dry-run

# デバッグ用（詳細ログ + テスト実行）
bun run update --verbose --dry-run

# 本番用カスタム設定での実行
bun run update --config production-config.json --verbose
```

#### 実行時の出力例

##### 通常実行

```bash
$ bun run update
[INFO] App Dashboard Data Updater
[INFO] Version: 1.0.0
[INFO] Starting update process for 3 repositories...
[INFO] Processing all apps in parallel...
[INFO] Successfully processed: 3
[SUCCESS] Update completed in 12.45s
```

##### Verbose実行

```bash
$ bun run update --verbose
[INFO] App Dashboard Data Updater
[INFO] Version: 1.0.0
[VERBOSE] Command line options: { verbose: true, config: 'config.json', dryRun: false }
[VERBOSE] Loaded configuration from config.json
[VERBOSE] Configuration: { "repositories": [...], "outputPath": "src/data/apps.json" }
[INFO] Starting update process for 3 repositories...
[INFO] Processing all apps in parallel...
[VERBOSE] Processing owner/repo1...
[VERBOSE] ✓ Completed owner/repo1
[VERBOSE] Processing owner/repo2...
[VERBOSE] ✓ Completed owner/repo2
[INFO] Successfully processed: 2
[WARN] Failed to process: 1
[ERROR] Failed to process owner/repo3: API rate limit exceeded
[SUCCESS] Update completed in 15.23s
```

### オプション

| オプション            | 説明                                               | 例                          |
| --------------------- | -------------------------------------------------- | --------------------------- |
| `-v, --verbose`       | 詳細なログを出力（デバッグ情報、処理詳細を表示）   | `--verbose`                 |
| `-c, --config <path>` | 設定ファイルのパスを指定（デフォルト: config.json）| `--config custom.json`      |
| `--dry-run`           | 実際の更新を行わずにテスト実行（ファイル保存なし） | `--dry-run`                 |
| `-h, --help`          | ヘルプメッセージを表示                             | `--help`                    |

#### オプション詳細

##### --verbose (-v)

詳細なログレベルでの実行。以下の情報が追加で表示されます：

- コマンドライン引数の詳細
- 設定ファイルの内容
- 各リポジトリの処理状況
- API呼び出しの詳細
- エラーのスタックトレース

```bash
bun run update --verbose
```

##### --config (-c)

カスタム設定ファイルパスの指定。デフォルトは `config.json`：

```bash
bun run update --config path/to/custom-config.json
```

##### --dry-run

実際のファイル書き込みを行わずに全ての処理をシミュレート：

- すべてのAPI呼び出しは実行される
- データ処理は正常に行われる
- JSONファイルの保存のみスキップされる
- 最終的に何件のアプリがファイルに書き込まれる予定かを表示

```bash
bun run update --dry-run
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

## Google Play Store 情報の取得

### Google Play Scraper

Google Playのバージョン情報とアプリデータはgoogle-play-scraperライブラリを使用して取得します。

#### パッケージ

```javascript
import gplay from 'google-play-scraper';
```

#### アプリ情報の取得

```javascript
const appData = await gplay.app({
  appId: 'com.example.app',
  lang: 'ja',
  country: 'jp',
});
```

#### レスポンス例

```json
{
  "appId": "com.example.app",
  "title": "App Name",
  "url": "https://play.google.com/store/apps/details?id=com.example.app",
  "version": "1.2.3",
  "released": "Aug 10, 2024",
  "updated": "Aug 10, 2024",
  "genre": "Productivity",
  "genreId": "PRODUCTIVITY",
  "familyGenre": null,
  "familyGenreId": null,
  "icon": "https://play-lh.googleusercontent.com/...",
  "headerImage": "https://play-lh.googleusercontent.com/...",
  "screenshots": ["https://play-lh.googleusercontent.com/..."],
  "video": null,
  "summary": "アプリの説明",
  "installs": "1,000+",
  "minInstalls": 1000,
  "score": 4.5,
  "scoreText": "4.5",
  "ratings": 123,
  "reviews": 45,
  "histogram": {
    "1": 2,
    "2": 1,
    "3": 5,
    "4": 12,
    "5": 25
  },
  "price": 0,
  "free": true,
  "currency": "USD",
  "priceText": "Free",
  "developer": "Developer Name",
  "developerId": "1234567890",
  "developerEmail": "developer@example.com",
  "developerWebsite": "https://example.com",
  "developerAddress": "123 Example St, Example City, EX 12345",
  "privacyPolicy": "https://example.com/privacy",
  "contentRating": "Everyone",
  "contentRatingDescription": "No objectionable content",
  "adSupported": false,
  "released": "Aug 1, 2023",
  "updated": 1691654400000,
  "recentChanges": "Bug fixes and improvements"
}
```

#### 取得できる主要な情報

- `version`: 現在のバージョン
- `title`: アプリ名
- `url`: Google Play Store URL
- `icon`: アプリアイコンURL
- `updated`: 最終更新日時
- `summary`: アプリの説明
- `developer`: 開発者名
- `score`: 評価スコア (1-5)
- `ratings`: 評価数

#### 実装上の注意事項

- スクレイピングベースのため、Google Playの仕様変更により動作しなくなる可能性があります
- レート制限を避けるため、適切な間隔での実行を推奨
- エラーハンドリングが重要（アプリが見つからない場合等）
- 日本語ロケール（`lang: 'ja'`, `country: 'jp'`）で取得

#### エラーハンドリング例

```javascript
try {
  const appData = await gplay.app({
    appId: packageId,
    lang: 'ja',
    country: 'jp',
  });
  return formatPlayStoreInfo(appData);
} catch (error) {
  console.warn(`Failed to search app by package ID "${packageId}":`, error.message);
  return null;
}
```

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

| レベル    | 用途                                       | 表示条件           |
| --------- | ------------------------------------------ | ------------------ |
| `INFO`    | 一般的な処理状況の報告                     | 常時表示           |
| `VERBOSE` | 詳細な処理内容やデバッグ情報               | --verbose 時のみ   |
| `WARN`    | 警告（処理は継続するが注意が必要な状況）   | 常時表示           |
| `ERROR`   | エラー（処理が失敗した場合）               | 常時表示           |
| `SUCCESS` | 処理完了や成功の報告                       | 常時表示           |

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
