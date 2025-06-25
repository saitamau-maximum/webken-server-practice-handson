import http from 'http';

let users = [
    { id: 1, name: '田中太郎', age: 20, hobby: 'プログラミング'},
    { id: 2, name: '佐藤花子', age: 22, hobby: '読書' },
    { id: 3, name: '鈴木次郎', age: 19, hobby: 'ゲーム' }
];

const server = http.createServer((request, response) => {
    const url = request.url;
    const method = request.method;

    // CORS対応
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        // プリフライトリクエストの処理
        response.writeHead(204); // No Content
        response.end();
        return;
    }

    // GETリクエストの処理
    if (url === '/api/users' && method === 'GET') {
        // 全ユーザー情報を返す
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(users, null, 2));
    } else if (url.startsWith('/api/users/') && method === 'GET') {
        // 特定のユーザー情報を返す
        const userId = parseInt(url.split('/')[3]);
        const user = users.find(u => u.id === userId);

        if (user) {
            // ユーザーが存在する場合
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(user, null, 2));
        } else {
            // ユーザーが存在しない場合 
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'User not found' }));
        }
    }
    // ----------------------------------------------------------------- //
    // ---------- ここまで前回のコード (今回用に多少変更済み) -------------- //
    // ----------------------------------------------------------------- //
    
    //  POSTリクエストの処理
    else if (url === '/api/users' && method === 'POST') {

        let body = '';

        request.on('data', (data) => {
            body += data.toString(); // 受け取ったデータを文字列として結合
        })
        
        request.on('end', () => {
            // 一番idが大きい既存のユーザーのid + 1 を新しいユーザーのidとして採用する
            // 最新のユーザーidを取得
            const newId = users.length + 1;
    
            try {
                const { name, age, hobby } = JSON.parse(body);
                const newUser = {
                    id: newId,
                    name: name,
                    age: parseInt(age, 10),
                    hobby: hobby
                }
        
                users.push(newUser);
                response.writeHead(201, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(users));
            } catch {
                console.error('jsonのデータ取得に失敗しました.')
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: '不正なjson形式です' }));
            }

        })
    }
    // PUTリクエストの処理
    // 入力されたid のユーザーの情報を入力されたものに更新するための実装を行ってください
    // hint 1 ... usersは配列になっているのでid 番目のユーザーはusers[id - 1] でアクセスできる (Web研第3回参照)
    // hint 2 ... i 番目のユーザー情報の更新は users[i - 1] に入力値を代入すればよい
    // hint 3 ...POSTの実装や外部サイトを参考にデータの受送信を実装しよう

    // else if (
    // )

    // DELETEリクエストの処理
    // 入力されたid のユーザーを削除するための実装を行ってください
    // hint 1 ... JavaScriptのメソッドでfilterやspliceを使うと実装できます．検索してみましょう
    // hint 2 ... for文を使うことでも実装できます．
    // i番目のユーザー情報をdeleteすることは i + 1番目のユーザー情報を i 番目に代入することを 区間[i, users.length) で繰り返すことでも実現可能です．

    // else if ()
})

server.listen(3000, () => {
    console.log('サーバーが http://localhost:3000 で起動しました');
});
