# OTDD (Old TweetDeck Desktop) 開発記録

## プロジェクト概要
Twitter/XのTweetDeckを表示し、Old TweetDeck拡張機能やその他のヘルパー拡張機能を適用するシンプルなElectronデスクトップアプリケーション。

## 技術スタック
- **フレームワーク**: Electron
- **言語**: TypeScript
- **パッケージマネージャー**: pnpm
- **拡張機能統合**: electron-chrome-extensions
- **ターゲットURL**: https://x.com/i/tweetdeck

## 開発進捗

### 2025-06-22 基本実装完了

#### 完了項目
1. **プロジェクト構造設定**
   - `src/`, `extensions/`, `preload/` ディレクトリ作成
   - TypeScript設定 (`tsconfig.json`)

2. **基本設定ファイル作成**
   - `package.json`: Electron, TypeScript, electron-chrome-extensions依存関係
   - ビルド設定: `tsc && electron dist/main.js`
   - パッケージング設定: electron-builder

3. **メインプロセス実装** (`src/main.ts`)
   - ElectronChromeExtensions統合
   - BrowserWindow設定 (1400x900, 最小800x600)
   - https://x.com/i/tweetdeck 自動ロード
   - セキュリティ設定: contextIsolation, nodeIntegration無効化

4. **拡張機能システム**
   - `extensions/` ディレクトリの自動スキャン
   - manifest.json検証
   - 拡張機能の動的ロード
   - エラーハンドリング

5. **プリロードスクリプト** (`preload/preload.ts`)
   - 安全なIPC通信ブリッジ
   - 拡張機能管理API
   - ウィンドウ制御API

#### 実装されたファイル
- `/src/main.ts`: メインプロセス (285行)
- `/preload/preload.ts`: プリロードスクリプト (29行)
- `/package.json`: プロジェクト設定とビルド構成
- `/tsconfig.json`: TypeScript設定
- `/extensions/README.md`: 拡張機能使用方法

## 使用方法

### 開発環境セットアップ
```bash
pnpm install
pnpm run dev
```

### 拡張機能追加
1. `extensions/` ディレクトリに拡張機能フォルダを配置
2. 各拡張機能に `manifest.json` が必要
3. アプリケーション再起動で自動ロード

### ビルド
```bash
pnpm run build  # TypeScriptコンパイル
pnpm run pack   # アプリケーションパッケージング
```

6. **Chrome API Polyfill実装** (`preload/chrome-api-polyfill.ts`)
   - contextMenus, notifications, webNavigation, cookies APIのダミー実装
   - 未サポートAPI呼び出し時の警告メッセージ
   - 拡張機能エラー軽減

7. **パフォーマンス最適化**
   - ウィンドウ非表示時の処理軽減
   - レイジーローディング対応
   - スクロールイベント最適化
   - Twitter画像サーバーへのプリコネクション

## 動作確認済み拡張機能
- **Chrome-BTD**: 正常ロード（一部API警告あり）
- **OldTweetDeckChrome**: 正常ロード（一部API警告あり）
- **TweetdeckShortcut**: 正常ロード（Manifest v2 deprecation警告）

## 今後の実装予定
- アプリアイコン追加
- 自動更新機能
- 拡張機能管理UI（将来的）
- Manifest v3対応

## 技術的特徴
- **シンプル設計**: Reactなし、純粋なElectron + TypeScript
- **セキュリティ重視**: contextIsolation有効、nodeIntegration無効
- **拡張機能対応**: Chrome拡張機能の完全サポート
- **クロスプラットフォーム**: macOS, Windows, Linux対応

---
*このファイルは開発進捗と技術仕様を記録するため、定期的に更新されます。*