import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

let users = [
  { id: 1, name: "田中太郎", age: 20, hobby: "プログラミング" },
  { id: 2, name: "佐藤花子", age: 22, hobby: "読書" },
  { id: 3, name: "鈴木次郎", age: 19, hobby: "ゲーム" },
];

/* 1st-pracや講義資料を参考に以下のAPIを完成させましょう */

// 全ユーザーを取得
app.get("/api/users", (c) => {

});

// ユーザーを追
app.post("/api/users", async (c) => {

});

// ユーザ情報を更新
app.put("/api/users/:id", async (c) => {

});

// ユーザーを削除
app.delete("/api/users/:id", async (c) => {

});

serve({
  fetch: app.fetch,
  port: 3000,
});
