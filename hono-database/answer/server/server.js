import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Database from "better-sqlite3";

// データベースの初期化
const db = new Database("db/users.db");

const app = new Hono();
app.use("*", cors());

// ユーザーを操作するオブジェクトを定義
const Users = {
  createTable: () => {
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        hobby TEXT NOT NULL
      )
    `
    ).run();
  },
  getAll: () => db.prepare("SELECT * FROM users").all(),
  getById: (id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id),
  insert: (name, age, hobby) =>
    db
      .prepare("INSERT INTO users (name, age, hobby) VALUES (?, ?, ?)")
      .run(name, age, hobby),
  update: (id, name, age, hobby) =>
    db
      .prepare("UPDATE users SET name = ?, age = ?, hobby = ? WHERE id = ?")
      .run(name, age, hobby, id),
  delete: (id) => db.prepare("DELETE FROM users WHERE id = ?").run(id),
};

// テーブルを作成
Users.createTable();

// 全ユーザーを取得
app.get("/api/users", (c) => {
  const users = Users.getAll();
  return c.json(users);
});

// ユーザーを追加
app.post("/api/users", async (c) => {
  try {
    const { name, age, hobby } = await c.req.json();

    const result = Users.insert(name, parseInt(age, 10), hobby);
    return c.json({ id: result.lastInsertRowid, name, age, hobby }, 201);
  } catch (error) {
    console.error("Failed to parse JSON data.");
    return c.json({ error: "Invalid JSON format" }, 400);
  }
});

// ユーザ情報を更新
app.put("/api/users/:id", async (c) => {
  try {
    const userId = parseInt(c.req.param("id"));
    const { name, age, hobby } = await c.req.json();

    const result = Users.update(userId, name, parseInt(age, 10), hobby);

    if (result.changes === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    // 更新後のユーザー情報を返す
    const updatedUser = Users.getById(userId);
    return c.json(updatedUser);
  } catch (error) {
    console.error("Failed to parse JSON data.");
    return c.json({ error: "Invalid JSON format" }, 400);
  }
});

// ユーザーを削除
app.delete("/api/users/:id", async (c) => {
  const userId = parseInt(c.req.param("id"));

  const result = Users.delete(userId);
  if (result.changes > 0) {
    return c.json({ message: "User deleted successfully" });
  } else {
    return c.json({ error: "User not found" }, 404);
  }
});

// 特定のユーザーを取得
app.get("/api/users/:id", (c) => {
  try {
    const userId = parseInt(c.req.param("id"));
    const user = Users.getById(userId);

    // このように先に例を弾くときれいなコードになります
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error("Failed to parse user ID.");
    return c.json({ error: "Invalid user ID format" }, 400);
  }
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server started at http://localhost:${info.port}`);
  }
);
