# AI Snake - Game Collection

Vite + React + TypeScript で構築されたゲームコレクションプロジェクト。各ページに異なるゲームを追加できる構成です。

## 技術スタック

- **Vite** - ビルドツール
- **React** - UI フレームワーク
- **TypeScript** - 型安全
- **React Router** - ページルーティング
- **Tailwind CSS v4** - スタイリング
- **Three.js** (React Three Fiber / Drei) - 3D グラフィックス

## セットアップ

```bash
pnpm install
pnpm dev
```

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド |
| `pnpm preview` | ビルド結果のプレビュー |

## プロジェクト構成

```
src/
├── main.tsx          # エントリポイント (BrowserRouter)
├── App.tsx           # ルーティング定義 + ナビゲーション
├── index.css         # Tailwind CSS インポート
└── pages/
    ├── Home.tsx      # トップページ (ゲーム一覧)
    ├── SnakeGame.tsx # Snake ゲーム (Canvas 2D)
    └── CubeDemo.tsx  # 3D キューブデモ (Three.js)
```

## ゲームの追加方法

1. `src/pages/` に新しいコンポーネントを作成
2. `src/App.tsx` に `<Route>` とナビリンクを追加
3. `src/pages/Home.tsx` の `games` 配列にカード情報を追加
