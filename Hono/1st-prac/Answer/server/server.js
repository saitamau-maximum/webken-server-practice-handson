import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'

const app = new Hono()

app.use('*', cors())


/* --------------------------------------------- */
/* 1, サーバーはlocalhost:3000番で動かすこと
   2, 各メソッドのURLを指定すること */
/* --------------------------------------------- */


let todos = [
    { id: 1, title: '最初のタスク', completed: false },
    { id: 2, title: '完了済みのタスク', completed: true }
]


app.get('/get-todo', (c) => {
    return c.json(todos)
})


app.post('/post-todo', async (c) => {
    let data
    try {
        data = await c.req.json()
    } catch {
        return c.json({ success: false, error: '不正なJSONです' }, 400)
    }

    const newTodo = {
        id: todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1,
        title: data.title,
        completed: false
    }

    todos.push(newTodo)
    return c.json({ success: true, id: newTodo.id })
})


app.put('/put-todo/:id', async (c) => {
    const idParam = c.req.param('id')
    if (!/^\d+$/.test(idParam)) {
        return c.json({ success: false, error: 'IDは数字で指定してください' }, 400)
    }

    const id = Number(idParam)

    let data
    try {
        data = await c.req.json()
    } catch {
        return c.json({ success: false, error: '不正なJSONです' }, 400)
    }

    if (
        typeof data.title !== 'string' ||
        typeof data.completed !== 'boolean'
    ) {
        return c.json({ success: false, error: 'titleとcompletedが正しい形式ではありません' }, 400)
    }

    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) {
        return c.json({ success: false, error: '該当IDのTODOが見つかりません' }, 404)
    }

    todos[index] = { id, ...data }
    return c.json({ success: true, id })
})


app.delete('/delete-todo/:id', (c) => {
    const idParam = c.req.param('id')
    if (!/^\d+$/.test(idParam)) {
        return c.json({ success: false, error: 'IDは数字で指定してください' }, 400)
    }

    const id = Number(idParam)
    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) {
        return c.json({ success: false, error: 'Todoが見つからないか、すでに削除済みです' }, 410)
    }

    todos.splice(index, 1)
    return c.json({ success: true, id })
})


const port = 8000
serve({ fetch: app.fetch, port })
