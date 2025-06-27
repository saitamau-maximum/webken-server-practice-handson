function escapeHtml(html) {
    if (html === null || html === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// 全ユーザーの情報を表示する
async function fetchAllUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/users');
        const users = await response.json(); // responseをjson形式で入手
        const field = document.getElementById('result');
        field.innerHTML = '';

        let content = '';
        for (let i = 0; i < users.length; i++) {
            const [name, age, hobby] = [users[i].name, users[i].age, users[i].hobby];
            content +=
                `
                <div class="userTable">
                    <div class="userId">id : ${i + 1}</div>
                    <div class="userName">名前: ${escapeHtml(name)}</div>
                    <div class="userAge">年齢: ${escapeHtml(age.toString())}</div>
                    <div class="userHobby">趣味: ${escapeHtml(hobby)}</div>
                </div>
            `;
        }
        field.innerHTML = content;
    } catch (error) {
        console.error('Error :', error);
    }
}

// 特定のユーザーの情報を表示する
async function fetchUser(id) {
    try {
        const response = await fetch('http://localhost:3000/api/users/' + id);
        const user = await response.json();
        const field = document.getElementById('result');
        field.innerHTML = '';

        const content = `
            <div class="userTable">
                <div class="userId">id : ${id}</div>
                <div class="userName">名前: ${escapeHtml(user.name)}</div>
                <div class="userAge">年齢: ${escapeHtml(user.age.toString())}</div>
                <div class="userHobby">趣味: ${escapeHtml(user.hobby)}</div>
            </div>
        `

        field.innerHTML = content;
    } catch (error) {
        console.error('Error :', error);
    }
}


// ユーザー情報を追加する
async function handleRegister() {
    const name = document.getElementById('name').value;
    const age = parseInt(document.getElementById('age').value, 10);
    const hobby = document.getElementById('hobby').value;

    // 入力欄を空白にする
    document.getElementById('name').value = '';
    document.getElementById('age').value = '';
    document.getElementById('hobby').value = '';

    // 入力されてないフィールドがある場合は処理を中止
    if (!name || isNaN(age) || !hobby) {
        alert('すべてのフィールドを入力してください。');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, age, hobby })
        });

        if (response.ok) {
            alert('ユーザーが追加されました。');
        } else {
            alert('ユーザーの追加に失敗しました。');
        }
    } catch (error) {
        console.error('Error :', error);
    }
}

// 新しいユーザーのデータをPUTメソッドを利用してサーバーに送る
async function handleChange() {

}

// 削除したいユーザーのidをサーバーに送る
async function handleDelete() {

}
