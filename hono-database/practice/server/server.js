import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Database from "better-sqlite3";

// データベースの初期化
const db = new Database("db/users.db");

const app = new Hono();
app.use("*", cors());

// ユーザーを操作するオブジェクトを定義
// このコードではUser内にユーザーを操作するメソッドを定義することで簡単にデータベースを操作できるようになっています
// メソッドとはオブジェクトの中に定義された関数のことです
const Users = {
  // テーブルを作成するメソッド
  createTable: () => {
    db.prepare(
      /*

      ここにテーブルを作成するSQLを記述してください
      CREATE TABLE ...

      */
    ).run();
  },

  // 全ユーザーを取得するメソッド
  // アロー関数は一行で書ける場合はreturnを省略できます
  getAll: () => db.prepare(/* ここにクエリを書いてください */).all(),

  // 特定のユーザーをIDで取得するメソッド
  getById: (id) => db.prepare(/* ここにクエリを書いてください */).get(id),

  // ユーザーを追加するメソッド
  insert: (name, age, hobby) =>
    // ここにユーザーを追加する処理を記述してください
  ,
  // ユーザー情報を更新するメソッド
  update: (id, name, age, hobby) => // ここに更新する処理を記述

  // ユーザーを削除するメソッド
  // delete: ここにdeleteメソッドを完成させてください。削除にはidを使います
};

// テーブルを作成
Users.createTable();

// 以下はルートの定義をしているところです。詳細が気になる人はみてみてください

// 全ユーザーを取得
app.get("/api/users", (c) => {
  // ユーザーを全て取得して返す
  const users = Users.getAll();
  return c.json(users);
});

// ユーザーを追加
app.post("/api/users", async (c) => {
  try {
    const { name, age, hobby } = await c.req.json();

    // ユーザーを追加する処理を呼び出す
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

  // ユーザーを削除する処理を呼び出す
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
    // 特定のユーザーをIDで取得する処理を呼び出す
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
