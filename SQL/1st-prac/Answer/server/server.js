import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import Database from 'better-sqlite3'

// DB初期化
const db = new Database('db/todos.db')

// テーブル作成（なければ）
db.prepare(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0
  )
`).run()

const app = new Hono()
app.use('*', cors())

// 全件取得
app.get('/get-todo', (c) => {
  const todos = db.prepare('SELECT * FROM todos').all()
  return c.json(todos)
})

// 追加
app.post('/post-todo', async (c) => {
  let data
  try {
    data = await c.req.json()
  } catch {
    return c.json({ success: false, error: '不正なJSONです' }, 400)
  }

  const stmt = db.prepare('INSERT INTO todos (title, completed) VALUES (?, ?)')
  const info = stmt.run(data.title, false)
  return c.json({ success: true, id: info.lastInsertRowid })
})

// 更新
app.put('/put-todo/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!/^\d+$/.test(String(id))) {
    return c.json({ success: false, error: 'IDは数字で指定してください' }, 400)
  }

  let data
  try {
    data = await c.req.json()
  } catch {
    return c.json({ success: false, error: '不正なJSONです' }, 400)
  }

  if (typeof data.title !== 'string' || typeof data.completed !== 'boolean') {
    return c.json({ success: false, error: 'titleとcompletedが正しい形式ではありません' }, 400)
  }

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) {
    return c.json({ success: false, error: '該当IDのTODOが見つかりません' }, 404)
  }

  db.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?')
    .run(data.title, data.completed, id)

  return c.json({ success: true, id })
})

// 削除
app.delete('/delete-todo/:id', (c) => {
  const id = Number(c.req.param('id'))
  if (!/^\d+$/.test(String(id))) {
    return c.json({ success: false, error: 'IDは数字で指定してください' }, 400)
  }

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) {
    return c.json({ success: false, error: 'Todoが見つからないか、すでに削除済みです' }, 410)
  }

  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return c.json({ success: true, id })
})

// サーバー起動
const port = 8000
console.log(`http://localhost:${port} でサーバー起動中`)
serve({ fetch: app.fetch, port })
