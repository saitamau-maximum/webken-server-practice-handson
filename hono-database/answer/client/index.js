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
        for (let i = 0; i < users.length; i++)
        {
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
    const name = document.getElementById('register-name').value;
    const age = parseInt(document.getElementById('register-age').value, 10);
    const hobby = document.getElementById('register-hobby').value;

    // 入力欄を空白にする
    document.getElementById('register-name').value = '';
    document.getElementById('register-age').value = '';
    document.getElementById('register-hobby').value = '';

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
    const id = parseInt(document.getElementById('change-id').value, 10);
    const name = document.getElementById('change-name').value;
    const age = parseInt(document.getElementById('change-age').value, 10);
    const hobby = document.getElementById('change-hobby').value;

    // 入力欄を空白にする
    document.getElementById('change-id').value = '';
    document.getElementById('change-name').value = '';
    document.getElementById('change-age').value = '';
    document.getElementById('change-hobby').value = '';

    if (isNaN(id) || !name || isNaN(age) || !hobby) {
        alert('すべてのフィールドを入力してください。');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/users/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, age, hobby })
        });

        if (response.ok) {
            alert('ユーザー情報が更新されました。');
        } else {
            alert('ユーザー情報の更新に失敗しました。');
        }
    } catch (error) {
        console.error('Error :', error);
    }
}

// 削除したいユーザーのidをサーバーに送る
async function handleDelete() {
    const id = parseInt(document.getElementById('delete-id').value, 10);
    if (isNaN(id) || id <= 0) {
        alert('有効なユーザーIDを入力してください。');
        return;
    }

    // 入力欄を空白にする
    document.getElementById('delete-id').value = '';
    
    try {
        const response = await fetch('http://localhost:3000/api/users/' + id, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });

        if (response.ok) {
            alert('ユーザーが削除されました。');
        } else {
            alert('ユーザーの削除に失敗しました。');
        }
    } catch (error) {
        console.error('Error :', error);
    }
}
