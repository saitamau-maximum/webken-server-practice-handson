async function loadTodos() {
    try {
        const res = await fetch('http://localhost:8000/get-todo'); // すべてのTodoを取得
        const todos = await res.json();

        const isValid = Array.isArray(todos) &&
            todos.every(todo =>
                typeof todo.id === 'number' &&
                typeof todo.title === 'string' &&
                typeof todo.completed === 'boolean'
            );

        if (!isValid) {
            throw new Error('JSONの形式が正しくありません');
        }

        const list = document.getElementById('todo-list');
        list.innerHTML = ''; // 一度すべてのtodoリストをリセット

        todos.forEach(todo => { // 取得したtodoに対して以下の操作を実行
            const li = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;

            checkbox.addEventListener('change', async () => { //checkBoxに対してこの関数を割り当て
                await updateTodo(todo.id, { title: todo.title, completed: checkbox.checked });
            });

            const label = document.createElement('span');
            label.textContent = ` ${todo.title}`;

            const deletebox = document.createElement('input');
            deletebox.type = 'button';
            deletebox.id = `delete-button-${todo.id}`; // ユニークなIDに変更
            deletebox.value = '削除';

            deletebox.addEventListener('click', async () => { // deleteBoxに対してこの関数を割り当て
                deletebox.disabled = true;
                try {
                    await deleteTodo(todo.id);
                    loadTodos(); // 再読み込み
                } catch (err) {
                    deletebox.disabled = false;
                    console.error('削除に失敗しました:', err);
                }
            });

            li.appendChild(checkbox);
            li.appendChild(label);
            li.appendChild(deletebox);

            list.appendChild(li);
        });
    } catch (error) {
        console.error('Todoの読み込みに失敗しました:', error);
    }
}

async function updateTodo(id, data) {
    const res = await fetch(`http://localhost:8000/put-todo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        throw new Error('completed更新失敗');
    }
}

async function addTodos() {
    const title = document.getElementById('add-input').value.trim();
    if (title === '') return;

    const res = await fetch('http://localhost:8000/post-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    });

    if (res.ok) {
        document.getElementById('add-input').value = ''; // 修正
        loadTodos();
    } else {
        alert('追加に失敗しました');
    }
}

async function deleteTodo(id) {
    const res = await fetch(`http://localhost:8000/delete-todo/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        throw new Error('DELETE失敗');
    }
}

window.addEventListener('DOMContentLoaded', () => {

    loadTodos();

    const addButton = document.getElementById('add-todo');

    addButton.addEventListener('click', async () => {
        await addTodos();
    });
});