# Hono 3rd Practice - Blog API System

## 概要
この課題では、Honoフレームワークを使用してブログAPIシステムを構築します。JWT認証、CRUD操作、検索機能、ページネーションなど、実際のWebアプリケーションで使用される基本的な機能を実装します。

## 機能概要

### 認証システム
- ユーザー登録 (`POST /api/auth/register`)
- ログイン (`POST /api/auth/login`)
- JWT トークンベース認証
- パスワードハッシュ化 (bcrypt)

### ブログ投稿機能
- 投稿一覧取得 (`GET /api/posts`)
  - ページネーション対応
  - タイトル・内容での検索
  - カテゴリフィルタリング
  - タグフィルタリング
- 特定投稿取得 (`GET /api/posts/:id`)
- 投稿作成 (`POST /api/posts`) - 要認証
- 投稿更新 (`PUT /api/posts/:id`) - 要認証、作成者のみ
- 投稿削除 (`DELETE /api/posts/:id`) - 要認証、作成者のみ

### コメント機能
- コメント作成 (`POST /api/posts/:id/comments`) - 要認証
- コメント削除 (`DELETE /api/comments/:id`) - 要認証、作成者のみ

### カテゴリ機能
- カテゴリ一覧取得 (`GET /api/categories`)

## 実装課題

### Practice版 - 実装が必要な機能
以下のTODOコメントがある**サーバーサイドの機能**を実装してください：

1. **投稿作成機能** (`app.post('/api/posts')`)
   - リクエストボディから title, content, categoryId, tags を取得
   - バリデーションを実施
   - 新しい投稿を作成（authorId は c.get('user').id を使用）
   - posts配列に追加
   - 作成された投稿を返す

2. **投稿更新機能** (`app.put('/api/posts/:id')`)
   - パラメータからpostIdを取得
   - 投稿が存在するかチェック
   - 作成者かチェック
   - リクエストボディから更新データを取得
   - 投稿を更新
   - 更新された投稿を返す

3. **投稿削除機能** (`app.delete('/api/posts/:id')`)
   - パラメータからpostIdを取得
   - 投稿が存在するかチェック
   - 作成者かチェック
   - 投稿を削除
   - 関連するコメントも削除
   - 削除成功メッセージを返す

4. **コメント作成機能** (`app.post('/api/posts/:id/comments')`)
   - パラメータからpostIdを取得
   - 投稿が存在するかチェック
   - リクエストボディからcontentを取得
   - バリデーションを実施
   - 新しいコメントを作成
   - comments配列に追加
   - 作成されたコメントを返す

5. **コメント削除機能** (`app.delete('/api/comments/:id')`)
   - パラメータからcommentIdを取得
   - コメントが存在するかチェック
   - 作成者かチェック
   - コメントを削除
   - 削除成功メッセージを返す
