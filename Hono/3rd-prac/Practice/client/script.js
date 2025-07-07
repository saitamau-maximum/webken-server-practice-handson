// グローバル変数
let currentUser = null;
let currentPage = 1;
let currentSearch = '';
let currentCategory = '';
let currentTag = '';
let currentPost = null;

// DOM要素の取得
const authModal = document.getElementById('auth-modal');
const postModal = document.getElementById('post-modal');
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const postActions = document.getElementById('post-actions');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadPosts();
    loadCategories();
    setupEventListeners();
});

// 認証状態をチェック
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
                currentUser = payload;
                updateUI();
                return;
            }
        } catch (error) {
            console.error('Invalid token:', error);
        }
    }
    localStorage.removeItem('token');
    currentUser = null;
    updateUI();
}

// UIを更新
function updateUI() {
    if (currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        postActions.style.display = 'block';
        document.getElementById('user-info').textContent = `Hello, ${currentUser.username}!`;
    } else {
        authSection.style.display = 'block';
        userSection.style.display = 'none';
        postActions.style.display = 'none';
    }
}

// イベントリスナーを設定
function setupEventListeners() {
    // 認証関連
    document.getElementById('login-btn').addEventListener('click', () => showAuthModal('login'));
    document.getElementById('register-btn').addEventListener('click', () => showAuthModal('register'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    
    // 検索関連
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // 投稿関連
    document.getElementById('create-post-btn').addEventListener('click', () => showPostModal('create'));
    document.getElementById('save-post-btn').addEventListener('click', savePost);
    document.getElementById('add-comment-btn').addEventListener('click', addComment);
    
    // モーダル関連
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// 認証モーダルを表示
function showAuthModal(type) {
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const emailField = document.getElementById('email');
    
    if (type === 'login') {
        authTitle.textContent = 'Login';
        authSubmit.textContent = 'Login';
        emailField.style.display = 'none';
        emailField.required = false;
    } else {
        authTitle.textContent = 'Register';
        authSubmit.textContent = 'Register';
        emailField.style.display = 'block';
        emailField.required = true;
    }
    
    authModal.style.display = 'flex';
}

// 認証を処理
async function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isRegister = document.getElementById('auth-title').textContent === 'Register';
    
    try {
        const response = await fetch(`http://localhost:3000/api/auth/${isRegister ? 'register' : 'login'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(isRegister ? { username, email, password } : { username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = { id: data.user.id, username: data.user.username };
            updateUI();
            closeModal();
            showMessage('Authentication successful!', 'success');
        } else {
            showMessage(data.error || 'Authentication failed', 'error');
        }
    } catch (error) {
        showMessage('Network error occurred', 'error');
    }
}

// ログアウト
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUI();
    showMessage('Logged out successfully', 'success');
}

// 投稿を読み込み
async function loadPosts() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            search: currentSearch,
            category: currentCategory,
            tag: currentTag
        });
        
        const response = await fetch(`http://localhost:3000/api/posts?${params}`);
        const data = await response.json();
        
        displayPosts(data.posts);
        displayPagination(data.pagination);
    } catch (error) {
        showMessage('Failed to load posts', 'error');
    }
}

// 投稿を表示
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-list');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="loading">No posts found.</p>';
        return;
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card" onclick="showPostDetails(${post.id})">
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.content.substring(0, 150))}...</p>
            <div class="post-meta">
                <span>By ${post.author?.username || 'Unknown'}</span>
                <span>${post.category?.name || 'Uncategorized'}</span>
                <span>${new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// ページネーションを表示
function displayPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    const { currentPage, totalPages } = pagination;
    
    let html = '';
    
    // 前のページボタン
    html += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
    
    // ページ番号ボタン
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // 次のページボタン
    html += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    
    paginationContainer.innerHTML = html;
}

// ページを変更
function changePage(page) {
    currentPage = page;
    loadPosts();
}

// 検索を処理
function handleSearch() {
    currentSearch = document.getElementById('search-input').value;
    currentCategory = document.getElementById('category-filter').value;
    currentTag = document.getElementById('tag-filter').value;
    currentPage = 1;
    loadPosts();
}

// カテゴリを読み込み
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        const categories = await response.json();
        
        const categoryFilter = document.getElementById('category-filter');
        const postCategory = document.getElementById('post-category');
        
        const options = categories.map(cat => 
            `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`
        ).join('');
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + options;
        postCategory.innerHTML = '<option value="">Select Category</option>' + options;
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// 投稿詳細を表示
async function showPostDetails(postId) {
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}`);
        const post = await response.json();
        
        if (response.ok) {
            currentPost = post;
            displayPostDetails(post);
            postModal.style.display = 'flex';
        } else {
            showMessage(post.error || 'Failed to load post', 'error');
        }
    } catch (error) {
        showMessage('Network error occurred', 'error');
    }
}

// 投稿詳細を表示
function displayPostDetails(post) {
    const postDetails = document.getElementById('post-details');
    const postForm = document.getElementById('post-form');
    const commentForm = document.getElementById('comment-form');
    
    // 編集権限チェック
    const canEdit = currentUser && currentUser.id === post.authorId;
    
    postForm.style.display = 'none';
    postDetails.style.display = 'block';
    
    postDetails.innerHTML = `
        <h2>${escapeHtml(post.title)}</h2>
        <div class="post-meta">
            <span>By ${post.author?.username || 'Unknown'}</span>
            <span>Category: ${post.category?.name || 'Uncategorized'}</span>
            <span>Created: ${new Date(post.createdAt).toLocaleDateString()}</span>
            ${canEdit ? `
                <button onclick="showPostModal('edit', ${post.id})" style="margin-left: 1rem;">Edit</button>
                <button onclick="deletePost(${post.id})" style="margin-left: 0.5rem; background: #e74c3c;">Delete</button>
            ` : ''}
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
    `;
    
    // コメント表示
    displayComments(post.comments);
    
    // コメントフォーム表示
    if (currentUser) {
        commentForm.style.display = 'block';
    } else {
        commentForm.style.display = 'none';
    }
}

// コメントを表示
function displayComments(comments) {
    const commentsList = document.getElementById('comments-list');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p>No comments yet.</p>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span><strong>${comment.author?.username || 'Unknown'}</strong></span>
                <span>${new Date(comment.createdAt).toLocaleDateString()}</span>
                ${currentUser && currentUser.id === comment.authorId ? 
                    `<div class="comment-actions">
                        <button onclick="deleteComment(${comment.id})">Delete</button>
                    </div>` : ''}
            </div>
            <p>${escapeHtml(comment.content)}</p>
        </div>
    `).join('');
}

// 投稿モーダルを表示
function showPostModal(mode, postId = null) {
    const postModalTitle = document.getElementById('post-modal-title');
    const postForm = document.getElementById('post-form');
    const postDetails = document.getElementById('post-details');
    
    postDetails.style.display = 'none';
    postForm.style.display = 'block';
    
    if (mode === 'create') {
        postModalTitle.textContent = 'Create New Post';
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('post-category').value = '';
        document.getElementById('post-tags').value = '';
    } else if (mode === 'edit' && currentPost) {
        postModalTitle.textContent = 'Edit Post';
        document.getElementById('post-title').value = currentPost.title;
        document.getElementById('post-content').value = currentPost.content;
        document.getElementById('post-category').value = currentPost.categoryId;
        document.getElementById('post-tags').value = currentPost.tags.join(', ');
    }
    
    postModal.style.display = 'flex';
}

// 投稿を保存
async function savePost() {
    if (!currentUser) {
        showMessage('Please log in to save posts', 'error');
        return;
    }
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const categoryId = parseInt(document.getElementById('post-category').value) || null;
    const tags = document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (!title || !content) {
        showMessage('Title and content are required', 'error');
        return;
    }
    
    try {
        const isEdit = currentPost && document.getElementById('post-modal-title').textContent === 'Edit Post';
        const url = isEdit ? `http://localhost:3000/api/posts/${currentPost.id}` : 'http://localhost:3000/api/posts';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content, categoryId, tags })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(isEdit ? 'Post updated successfully' : 'Post created successfully', 'success');
            closeModal();
            loadPosts();
        } else {
            showMessage(data.error || 'Failed to save post', 'error');
        }
    } catch (error) {
        showMessage('Network error occurred', 'error');
    }
}

// TODO: 以下の関数群を実装してください

// 投稿を削除
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Post deleted successfully', 'success');
            closeModal();
            loadPosts();
        } else {
            showMessage(data.error || 'Failed to delete post', 'error');
        }
    } catch (error) {
        showMessage('Network error occurred', 'error');
    }
}

// コメントを追加
async function addComment() {
    if (!currentUser) {
        showMessage('Please log in to add comments', 'error');
        return;
    }
    
    const content = document.getElementById('comment-content').value;
    
    if (!content) {
        showMessage('Comment content is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${currentPost.id}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Comment added successfully', 'success');
            document.getElementById('comment-content').value = '';
            // 投稿詳細を再読み込み
            showPostDetails(currentPost.id);
        } else {
            showMessage(data.error || 'Failed to add comment', 'error');
        }
    } catch (error) {
        showMessage('Network error occurred', 'error');
    }
}

// コメントを削除
async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Comment deleted successfully', 'success');
            // 投稿詳細を再読み込み
            showPostDetails(currentPost.id);
        } else {
            showMessage(data.error || 'Failed to delete comment', 'error');
        }
    } catch (error) {
        showMessage('Network error occurred', 'error');
    }
}

// ユーティリティ関数

// モーダルを閉じる
function closeModal() {
    authModal.style.display = 'none';
    postModal.style.display = 'none';
    
    // フォームをリセット
    document.getElementById('auth-form').reset();
    document.getElementById('comment-content').value = '';
    currentPost = null;
}

// メッセージを表示
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '130px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '1002';
    messageDiv.style.padding = '1rem';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.maxWidth = '300px';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// HTMLエスケープ
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
