import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'

const app = new Hono()

app.use('*', cors())


/* --------------------------------------------- 

    以下の条件を満たすようにサーバーの欠陥を埋めましょう
    URL等必要な情報は client/client.js にあります

   1, サーバーはlocalhost:3000番で動かすこと
   2, 各メソッドのURLを指定すること
   3, getメソッドのresponseを書くこと
   4, post, putメソッドのdataにclientからの内容を入れること
   5, delete, putメソッドのidParamにidを入れること 
 --------------------------------------------- */


let todos = [
    { id: 1, title: 'Web研に出席する', completed: true },
    { id: 2, title: 'serverをマスターする', completed: false }
]


app.get('/* URLを書く */', (c) => {
    // responseを書く clientを読んでresponseがどのような物か推測してください。
})


app.post('/* URLを書く */', async (c) => {
    let data
    try {
        data = // dataにrequestを入れる
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


app.put('/* URLを書く */', async (c) => {

    const idParam = ;// パラメータからIDを取得する関数を書く

    if (!/^\d+$/.test(idParam)) {
        return c.json({ success: false, error: 'IDは数字で指定してください' }, 400)
    }

    const id = Number(idParam)

    let data
    try {
        data = // dataにrequestを入れる
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


app.delete('/* URLを書く */', (c) => {

    const idParam = // パラメータからIDを取得する関数を書く　
    
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


const port =      // ポート番号を書く
serve({ fetch: app.fetch, port })
