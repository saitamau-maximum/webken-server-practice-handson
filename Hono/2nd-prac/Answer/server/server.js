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

// 全ユーザーを取得
app.get("/api/users", (c) => {
  return c.json(users);
});

// ユーザーを追加
app.post("/api/users", async (c) => {
  try {
    const { name, age, hobby } = await c.req.json();
    
    // 一番idが大きい既存のユーザーのid + 1 を新しいユーザーのidとして採用する
    let newId = 0;
    for (let i = 0; i < users.length; i++) {
      if (users[i].id > newId) {
        newId = users[i].id;
      }
    }
    newId += 1;

    const newUser = {
      id: newId,
      name: name,
      age: parseInt(age, 10),
      hobby: hobby
    };

    users.push(newUser);
    return c.json(users, 201);
  } catch (error) {
    console.error('Failed to parse JSON data.');
    return c.json({ error: 'Invalid JSON format' }, 400);
  }
});

// ユーザ情報を更新
app.put("/api/users/:id", async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { name, age, hobby } = await c.req.json();
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = {
        id: userId,
        name: name,
        age: parseInt(age, 10),
        hobby: hobby
      };
      return c.json(users);
    } else {
      return c.json({ error: 'User not found' }, 404);
    }
  } catch (error) {
    console.error('Failed to parse JSON data.');
    return c.json({ error: 'Invalid JSON format' }, 400);
  }
});

// ユーザーを削除
app.delete("/api/users/:id", async (c) => {
  const userId = parseInt(c.req.param('id'));
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    return c.json(users);
  } else {
    return c.json({ error: 'User not found' }, 404);
  }
});

// 特定のユーザーを取得
app.get("/api/users/:id", (c) => {
  const userId = parseInt(c.req.param('id'));
  const user = users.find(u => u.id === userId);

  if (user) {
    return c.json(user);
  } else {
    return c.json({ error: 'User not found' }, 404);
  }
});

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server started at http://localhost:${info.port}`);
});
