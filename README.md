# github-pullrequest-review-server

このサーバーは、Model Context Protocol (MCP) に対応した GitHub Pull Request レビューサーバーです。

## 機能

- GitHub の Pull Request の情報を取得
- Pull Request で変更されたファイル一覧の取得

## 対応しているツール

- `get-pull-request` - GitHub の Pull Request の詳細情報を取得
- `get-pull-request-files` - Pull Request で変更されたファイル一覧を取得

## セットアップ

1. `.env`ファイルに GitHub アクセストークンを設定

```
GITHUB_TOKEN=your_github_token
```

2. 依存関係のインストール

```
npm install
```

3. ビルド

```
npm run build
```

## 使用方法

このサーバーは MCP プロトコルを使用して AI アシスタントと通信します。AI アシスタントは、このサーバーが提供するツールを使用して GitHub の Pull Request に関する情報を取得できます。

## 技術スタック

- TypeScript
- Model Context Protocol (MCP) SDK
- GitHub API

## 参考ドキュメント

- https://docs.cursor.com/context/model-context-protocol
- https://modelcontextprotocol.io/quickstart/server
- https://github.com/johnlindquist/mcp-cursor-tool-starter
- https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#running-your-server
