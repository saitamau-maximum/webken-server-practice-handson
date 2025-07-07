import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = new Hono();

// CORS設定
app.use("*", cors());

// JWT秘密鍵（実際のアプリケーションでは環境変数を使用）
const JWT_SECRET = "your-secret-key-change-this-in-production";

// サンプルデータ
let users = [
  {
    id: 1,
    username: "user1",
    email: "user1@example.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  }, // password: "password"
  {
    id: 2,
    username: "user2",
    email: "user2@example.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  },
];

let posts = [
  {
    id: 1,
    title: "Honoフレームワーク入門",
    content:
      "Honoは軽量で高速なWebフレームワークです。CloudflareWorkersやBun、Node.jsなど様々なランタイムで動作します。",
    authorId: 1,
    categoryId: 1,
    tags: ["hono", "web", "javascript"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    title: "REST APIの設計パターン",
    content:
      "RESTful APIの設計における重要なパターンを紹介します。リソース指向の設計やHTTPメソッドの適切な使用方法について解説します。",
    authorId: 2,
    categoryId: 2,
    tags: ["api", "rest", "design"],
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  {
    id: 3,
    title: "JWT認証の実装",
    content:
      "JSON Web Token（JWT）を使った認証システムの実装方法について詳しく解説します。",
    authorId: 1,
    categoryId: 2,
    tags: ["jwt", "auth", "security"],
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
];

let categories = [
  {
    id: 1,
    name: "Web開発",
    description: "Webアプリケーション開発に関する記事",
  },
  {
    id: 2,
    name: "API設計",
    description: "API設計とアーキテクチャに関する記事",
  },
  {
    id: 3,
    name: "フロントエンド",
    description: "フロントエンド技術に関する記事",
  },
  { id: 4, name: "バックエンド", description: "バックエンド技術に関する記事" },
];

let comments = [
  {
    id: 1,
    postId: 1,
    authorId: 2,
    content: "とても参考になりました！Honoは本当に軽量ですね。",
    createdAt: new Date("2024-01-03"),
  },
  {
    id: 2,
    postId: 1,
    authorId: 1,
    content: "ありがとうございます！今後も役立つ情報を発信していきます。",
    createdAt: new Date("2024-01-04"),
  },
  {
    id: 3,
    postId: 2,
    authorId: 1,
    content: "REST APIの設計は奥が深いですね。",
    createdAt: new Date("2024-01-05"),
  },
];

// ユーティリティ関数
function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 認証ミドルウェア
async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Authorization token required" }, 401);
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("user", decoded);
  await next();
}

/* ===== 認証エンドポイント ===== */

// ユーザー登録
app.post("/api/auth/register", async (c) => {
  try {
    const { username, email, password } = await c.req.json();

    // バリデーション
    if (!username || !email || !password) {
      return c.json(
        { error: "Username, email, and password are required" },
        400
      );
    }

    // 既存ユーザーチェック
    const existingUser = users.find(
      (u) => u.username === username || u.email === email
    );
    if (existingUser) {
      return c.json({ error: "Username or email already exists" }, 409);
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 新しいユーザー作成
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
    };

    users.push(newUser);

    // トークン生成
    const token = generateToken(newUser);

    return c.json(
      {
        message: "User registered successfully",
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      },
      201
    );
  } catch (error) {
    return c.json({ error: "Registration failed" }, 500);
  }
});

// ログイン
app.post("/api/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    // バリデーション
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    // ユーザー検索
    const user = users.find((u) => u.username === username);
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // トークン生成
    const token = generateToken(user);

    return c.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    return c.json({ error: "Login failed" }, 500);
  }
});

/* ===== ブログ投稿エンドポイント ===== */

// 全投稿取得（ページネーション、検索、カテゴリフィルタリング対応）
app.get("/api/posts", (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const category = c.req.query("category");
  const tag = c.req.query("tag");

  let filteredPosts = posts;

  // 検索フィルタ
  if (search) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.content.toLowerCase().includes(search.toLowerCase())
    );
  }

  // カテゴリフィルタ
  if (category) {
    filteredPosts = filteredPosts.filter(
      (post) => post.categoryId === parseInt(category)
    );
  }

  // タグフィルタ
  if (tag) {
    filteredPosts = filteredPosts.filter((post) => post.tags.includes(tag));
  }

  // ページネーション
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  // 作成者情報とカテゴリ情報を追加
  const postsWithDetails = paginatedPosts.map((post) => {
    const author = users.find((u) => u.id === post.authorId);
    const category = categories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      author: author ? { id: author.id, username: author.username } : null,
      category: category ? { id: category.id, name: category.name } : null,
    };
  });

  return c.json({
    posts: postsWithDetails,
    pagination: {
      currentPage: page,
      limit,
      totalPosts: filteredPosts.length,
      totalPages: Math.ceil(filteredPosts.length / limit),
    },
  });
});

// 特定投稿取得
app.get("/api/posts/:id", (c) => {
  const postId = parseInt(c.req.param("id"));
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  const author = users.find((u) => u.id === post.authorId);
  const category = categories.find((c) => c.id === post.categoryId);
  const postComments = comments
    .filter((comment) => comment.postId === postId)
    .map((comment) => {
      const commentAuthor = users.find((u) => u.id === comment.authorId);
      return {
        ...comment,
        author: commentAuthor
          ? { id: commentAuthor.id, username: commentAuthor.username }
          : null,
      };
    });

  return c.json({
    ...post,
    author: author ? { id: author.id, username: author.username } : null,
    category: category ? { id: category.id, name: category.name } : null,
    comments: postComments,
  });
});

// 投稿作成（要認証）
app.post("/api/posts", authMiddleware, async (c) => {
  // TODO: 投稿作成機能を実装してください
  // 1. リクエストボディから title, content, categoryId, tags を取得
  // 2. バリデーション（title, content が必須）
  // 3. 新しい投稿オブジェクトを作成（authorId は c.get('user').id を使用）
  // 4. posts 配列に追加
  // 5. 作成された投稿を返す（作成者情報とカテゴリ情報を含む）

  return c.json({ error: "Not implemented" }, 501);
});

// 投稿更新（要認証、作成者のみ）
app.put("/api/posts/:id", authMiddleware, async (c) => {
  // TODO: 投稿更新機能を実装してください
  // 1. パラメータから postId を取得
  // 2. 投稿が存在するかチェック
  // 3. 作成者かどうかチェック（post.authorId === user.id）
  // 4. リクエストボディから更新データを取得
  // 5. バリデーション（title, content が必須）
  // 6. 投稿を更新
  // 7. 更新された投稿を返す（作成者情報とカテゴリ情報を含む）

  return c.json({ error: "Not implemented" }, 501);
});

// 投稿削除（要認証、作成者のみ）
app.delete("/api/posts/:id", authMiddleware, async (c) => {
  // TODO: 投稿削除機能を実装してください
  // 1. パラメータから postId を取得
  // 2. 投稿が存在するかチェック
  // 3. 作成者かどうかチェック（post.authorId === user.id）
  // 4. 投稿を削除
  // 5. 関連するコメントも削除
  // 6. 削除成功メッセージを返す

  return c.json({ error: "Not implemented" }, 501);
});

/* ===== コメントエンドポイント ===== */

// コメント作成（要認証）
app.post("/api/posts/:id/comments", authMiddleware, async (c) => {
  // TODO: コメント作成機能を実装してください
  // 1. パラメータから postId を取得
  // 2. 投稿が存在するかチェック
  // 3. リクエストボディから content を取得
  // 4. バリデーション（content が必須）
  // 5. 新しいコメントを作成（authorId は c.get('user').id を使用）
  // 6. comments 配列に追加
  // 7. 作成されたコメントを返す（作成者情報を含む）

  return c.json({ error: "Not implemented" }, 501);
});

// コメント削除（要認証、作成者のみ）
app.delete("/api/comments/:id", authMiddleware, async (c) => {
  // TODO: コメント削除機能を実装してください
  // 1. パラメータから commentId を取得
  // 2. コメントが存在するかチェック
  // 3. 作成者かどうかチェック（comment.authorId === user.id）
  // 4. コメントを削除
  // 5. 削除成功メッセージを返す

  return c.json({ error: "Not implemented" }, 501);
});

/* ===== カテゴリエンドポイント ===== */

// 全カテゴリ取得
app.get("/api/categories", (c) => {
  return c.json(categories);
});

/* ===== サーバー起動 ===== */

// サーバー起動
serve({
  fetch: app.fetch,
  port: 3000,
});
