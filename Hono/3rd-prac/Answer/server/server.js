import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = new Hono();

// CORS設定
app.use('*', cors());

// JWT秘密鍵（実際のアプリケーションでは環境変数を使用）
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// サンプルデータ
let users = [
    { id: 1, username: 'admin', email: 'admin@example.com', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'admin' }, // password: "password"
    { id: 2, username: 'user1', email: 'user1@example.com', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'user' }
];

let posts = [
    { id: 1, title: 'Honoフレームワーク入門', content: 'Honoは軽量で高速なWebフレームワークです。CloudflareWorkersやBun、Node.jsなど様々なランタイムで動作します。', authorId: 1, categoryId: 1, tags: ['hono', 'web', 'javascript'], createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 2, title: 'REST APIの設計パターン', content: 'RESTful APIの設計における重要なパターンを紹介します。リソース指向の設計やHTTPメソッドの適切な使用方法について解説します。', authorId: 2, categoryId: 2, tags: ['api', 'rest', 'design'], createdAt: new Date('2024-01-02'), updatedAt: new Date('2024-01-02') },
    { id: 3, title: 'JWT認証の実装', content: 'JSON Web Token（JWT）を使った認証システムの実装方法について詳しく解説します。', authorId: 1, categoryId: 2, tags: ['jwt', 'auth', 'security'], createdAt: new Date('2024-01-03'), updatedAt: new Date('2024-01-03') }
];

let categories = [
    { id: 1, name: 'Web開発', description: 'Webアプリケーション開発に関する記事' },
    { id: 2, name: 'API設計', description: 'API設計とアーキテクチャに関する記事' },
    { id: 3, name: 'フロントエンド', description: 'フロントエンド技術に関する記事' },
    { id: 4, name: 'バックエンド', description: 'バックエンド技術に関する記事' }
];

let comments = [
    { id: 1, postId: 1, authorId: 2, content: 'とても参考になりました！Honoは本当に軽量ですね。', createdAt: new Date('2024-01-03') },
    { id: 2, postId: 1, authorId: 1, content: 'ありがとうございます！今後も役立つ情報を発信していきます。', createdAt: new Date('2024-01-04') },
    { id: 3, postId: 2, authorId: 1, content: 'REST APIの設計は奥が深いですね。', createdAt: new Date('2024-01-05') }
];

// ユーティリティ関数
function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// 認証ミドルウェア
async function authMiddleware(c, next) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Authorization token required' }, 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('user', decoded);
    await next();
}

// 管理者権限チェックミドルウェア
async function adminMiddleware(c, next) {
    const user = c.get('user');
    if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }
    await next();
}

/* ===== 認証エンドポイント ===== */

// ユーザー登録
app.post('/api/auth/register', async (c) => {
    try {
        const { username, email, password } = await c.req.json();
        
        // バリデーション
        if (!username || !email || !password) {
            return c.json({ error: 'Username, email, and password are required' }, 400);
        }

        // 既存ユーザーチェック
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return c.json({ error: 'Username or email already exists' }, 409);
        }

        // パスワードハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 新しいユーザー作成
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            username,
            email,
            password: hashedPassword,
            role: 'user'
        };

        users.push(newUser);
        
        // トークン生成
        const token = generateToken(newUser);
        
        return c.json({ 
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
        }, 201);
    } catch (error) {
        return c.json({ error: 'Registration failed' }, 500);
    }
});

// ログイン
app.post('/api/auth/login', async (c) => {
    try {
        const { username, password } = await c.req.json();
        
        // バリデーション
        if (!username || !password) {
            return c.json({ error: 'Username and password are required' }, 400);
        }

        // ユーザー検索
        const user = users.find(u => u.username === username);
        if (!user) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        // パスワード検証
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        // トークン生成
        const token = generateToken(user);
        
        return c.json({ 
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        return c.json({ error: 'Login failed' }, 500);
    }
});

/* ===== ブログ投稿エンドポイント ===== */

// 全投稿取得（ページネーション、検索、カテゴリフィルタリング対応）
app.get('/api/posts', (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const category = c.req.query('category');
    const tag = c.req.query('tag');

    let filteredPosts = posts;

    // 検索フィルタ
    if (search) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(search.toLowerCase()) ||
            post.content.toLowerCase().includes(search.toLowerCase())
        );
    }

    // カテゴリフィルタ
    if (category) {
        filteredPosts = filteredPosts.filter(post => post.categoryId === parseInt(category));
    }

    // タグフィルタ
    if (tag) {
        filteredPosts = filteredPosts.filter(post => post.tags.includes(tag));
    }

    // ページネーション
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // 作成者情報とカテゴリ情報を追加
    const postsWithDetails = paginatedPosts.map(post => {
        const author = users.find(u => u.id === post.authorId);
        const category = categories.find(c => c.id === post.categoryId);
        return {
            ...post,
            author: author ? { id: author.id, username: author.username } : null,
            category: category ? { id: category.id, name: category.name } : null
        };
    });

    return c.json({
        posts: postsWithDetails,
        pagination: {
            currentPage: page,
            limit,
            totalPosts: filteredPosts.length,
            totalPages: Math.ceil(filteredPosts.length / limit)
        }
    });
});

// 特定投稿取得
app.get('/api/posts/:id', (c) => {
    const postId = parseInt(c.req.param('id'));
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return c.json({ error: 'Post not found' }, 404);
    }

    const author = users.find(u => u.id === post.authorId);
    const category = categories.find(c => c.id === post.categoryId);
    const postComments = comments.filter(comment => comment.postId === postId).map(comment => {
        const commentAuthor = users.find(u => u.id === comment.authorId);
        return {
            ...comment,
            author: commentAuthor ? { id: commentAuthor.id, username: commentAuthor.username } : null
        };
    });

    return c.json({
        ...post,
        author: author ? { id: author.id, username: author.username } : null,
        category: category ? { id: category.id, name: category.name } : null,
        comments: postComments
    });
});

// 投稿作成（要認証）
app.post('/api/posts', authMiddleware, async (c) => {
    try {
        const { title, content, categoryId, tags } = await c.req.json();
        const user = c.get('user');
        
        // バリデーション
        if (!title || !content) {
            return c.json({ error: 'Title and content are required' }, 400);
        }

        // 新しい投稿を作成
        const newPost = {
            id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
            title,
            content,
            authorId: user.id,
            categoryId: categoryId || null,
            tags: Array.isArray(tags) ? tags : [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        posts.push(newPost);
        
        // 作成者情報とカテゴリ情報を追加して返す
        const author = users.find(u => u.id === newPost.authorId);
        const category = categories.find(c => c.id === newPost.categoryId);
        
        return c.json({
            ...newPost,
            author: author ? { id: author.id, username: author.username } : null,
            category: category ? { id: category.id, name: category.name } : null
        }, 201);
    } catch (error) {
        return c.json({ error: 'Failed to create post' }, 500);
    }
});

// 投稿更新（要認証、作成者または管理者のみ）
app.put('/api/posts/:id', authMiddleware, async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const user = c.get('user');
        const { title, content, categoryId, tags } = await c.req.json();
        
        // 投稿が存在するかチェック
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
            return c.json({ error: 'Post not found' }, 404);
        }

        const post = posts[postIndex];
        
        // 作成者または管理者かチェック
        if (post.authorId !== user.id && user.role !== 'admin') {
            return c.json({ error: 'Access denied' }, 403);
        }

        // バリデーション
        if (!title || !content) {
            return c.json({ error: 'Title and content are required' }, 400);
        }

        // 投稿を更新
        posts[postIndex] = {
            ...post,
            title,
            content,
            categoryId: categoryId || null,
            tags: Array.isArray(tags) ? tags : [],
            updatedAt: new Date()
        };

        // 更新された投稿に詳細情報を追加して返す
        const author = users.find(u => u.id === posts[postIndex].authorId);
        const category = categories.find(c => c.id === posts[postIndex].categoryId);
        
        return c.json({
            ...posts[postIndex],
            author: author ? { id: author.id, username: author.username } : null,
            category: category ? { id: category.id, name: category.name } : null
        });
    } catch (error) {
        return c.json({ error: 'Failed to update post' }, 500);
    }
});

// 投稿削除（要認証、作成者または管理者のみ）
app.delete('/api/posts/:id', authMiddleware, async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const user = c.get('user');
        
        // 投稿が存在するかチェック
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
            return c.json({ error: 'Post not found' }, 404);
        }

        const post = posts[postIndex];
        
        // 作成者または管理者かチェック
        if (post.authorId !== user.id && user.role !== 'admin') {
            return c.json({ error: 'Access denied' }, 403);
        }

        // 投稿を削除
        posts.splice(postIndex, 1);
        
        // 関連するコメントも削除
        comments = comments.filter(comment => comment.postId !== postId);
        
        return c.json({ message: 'Post deleted successfully' });
    } catch (error) {
        return c.json({ error: 'Failed to delete post' }, 500);
    }
});

/* ===== コメントエンドポイント ===== */

// コメント作成（要認証）
app.post('/api/posts/:id/comments', authMiddleware, async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const user = c.get('user');
        const { content } = await c.req.json();
        
        // 投稿が存在するかチェック
        const post = posts.find(p => p.id === postId);
        if (!post) {
            return c.json({ error: 'Post not found' }, 404);
        }

        // バリデーション
        if (!content) {
            return c.json({ error: 'Content is required' }, 400);
        }

        // 新しいコメントを作成
        const newComment = {
            id: comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1,
            postId,
            authorId: user.id,
            content,
            createdAt: new Date()
        };

        comments.push(newComment);
        
        // 作成者情報を追加して返す
        const author = users.find(u => u.id === newComment.authorId);
        
        return c.json({
            ...newComment,
            author: author ? { id: author.id, username: author.username } : null
        }, 201);
    } catch (error) {
        return c.json({ error: 'Failed to create comment' }, 500);
    }
});

// コメント削除（要認証、作成者または管理者のみ）
app.delete('/api/comments/:id', authMiddleware, async (c) => {
    try {
        const commentId = parseInt(c.req.param('id'));
        const user = c.get('user');
        
        // コメントが存在するかチェック
        const commentIndex = comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            return c.json({ error: 'Comment not found' }, 404);
        }

        const comment = comments[commentIndex];
        
        // 作成者または管理者かチェック
        if (comment.authorId !== user.id && user.role !== 'admin') {
            return c.json({ error: 'Access denied' }, 403);
        }

        // コメントを削除
        comments.splice(commentIndex, 1);
        
        return c.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        return c.json({ error: 'Failed to delete comment' }, 500);
    }
});

/* ===== カテゴリエンドポイント ===== */

// 全カテゴリ取得
app.get('/api/categories', (c) => {
    return c.json(categories);
});

// カテゴリ作成（要認証、管理者のみ）
app.post('/api/categories', authMiddleware, adminMiddleware, async (c) => {
    try {
        const { name, description } = await c.req.json();
        
        // バリデーション
        if (!name) {
            return c.json({ error: 'Name is required' }, 400);
        }

        // 既存カテゴリチェック
        const existingCategory = categories.find(cat => cat.name === name);
        if (existingCategory) {
            return c.json({ error: 'Category already exists' }, 409);
        }

        // 新しいカテゴリを作成
        const newCategory = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            name,
            description: description || ''
        };

        categories.push(newCategory);
        
        return c.json(newCategory, 201);
    } catch (error) {
        return c.json({ error: 'Failed to create category' }, 500);
    }
});

// カテゴリ削除（要認証、管理者のみ）
app.delete('/api/categories/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const categoryId = parseInt(c.req.param('id'));
        
        // カテゴリが存在するかチェック
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex === -1) {
            return c.json({ error: 'Category not found' }, 404);
        }

        // そのカテゴリを使用している投稿があるかチェック
        const postsUsingCategory = posts.filter(post => post.categoryId === categoryId);
        if (postsUsingCategory.length > 0) {
            return c.json({ error: 'Cannot delete category that is being used by posts' }, 409);
        }

        // カテゴリを削除
        categories.splice(categoryIndex, 1);
        
        return c.json({ message: 'Category deleted successfully' });
    } catch (error) {
        return c.json({ error: 'Failed to delete category' }, 500);
    }
});

/* ===== ユーザー管理エンドポイント ===== */

// 全ユーザー取得（要認証、管理者のみ）
app.get('/api/users', authMiddleware, adminMiddleware, (c) => {
    const usersWithoutPasswords = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    }));
    return c.json(usersWithoutPasswords);
});

// ユーザー削除（要認証、管理者のみ）
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const userId = parseInt(c.req.param('id'));
        const currentUser = c.get('user');
        
        // 削除対象のユーザーが存在するかチェック
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return c.json({ error: 'User not found' }, 404);
        }

        // 自分自身を削除しようとしていないかチェック
        if (userId === currentUser.id) {
            return c.json({ error: 'Cannot delete your own account' }, 400);
        }

        // ユーザーを削除
        users.splice(userIndex, 1);
        
        // そのユーザーの投稿を削除
        const userPosts = posts.filter(post => post.authorId === userId);
        userPosts.forEach(post => {
            // 投稿に関連するコメントも削除
            comments = comments.filter(comment => comment.postId !== post.id);
        });
        posts = posts.filter(post => post.authorId !== userId);
        
        // そのユーザーのコメントを削除
        comments = comments.filter(comment => comment.authorId !== userId);
        
        return c.json({ message: 'User deleted successfully' });
    } catch (error) {
        return c.json({ error: 'Failed to delete user' }, 500);
    }
});

/* ===== 統計エンドポイント ===== */

// ブログ統計情報（要認証、管理者のみ）
app.get('/api/stats', authMiddleware, adminMiddleware, (c) => {
    const stats = {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalComments: comments.length,
        totalCategories: categories.length,
        recentPosts: posts.slice(-5).reverse().map(post => {
            const author = users.find(u => u.id === post.authorId);
            return {
                ...post,
                author: author ? { id: author.id, username: author.username } : null
            };
        }),
        popularTags: getPopularTags(5),
        userStats: users.map(user => ({
            id: user.id,
            username: user.username,
            postCount: posts.filter(post => post.authorId === user.id).length,
            commentCount: comments.filter(comment => comment.authorId === user.id).length
        }))
    };
    return c.json(stats);
});

// 人気タグ取得ヘルパー関数
function getPopularTags(limit = 10) {
    const tagCounts = {};
    posts.forEach(post => {
        post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
}

// サーバー起動
serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Blog API Server started at http://localhost:${info.port}`);
    console.log('');
    console.log('Default users:');
    console.log('  Admin: username=admin, password=password');
    console.log('  User:  username=user1, password=password');
    console.log('');
    console.log('API Endpoints:');
    console.log('  POST /api/auth/register - Register new user');
    console.log('  POST /api/auth/login - Login user');
    console.log('  GET  /api/posts - Get all posts (with pagination/search)');
    console.log('  GET  /api/posts/:id - Get specific post');
    console.log('  POST /api/posts - Create new post (auth required)');
    console.log('  PUT  /api/posts/:id - Update post (auth required)');
    console.log('  DELETE /api/posts/:id - Delete post (auth required)');
    console.log('  POST /api/posts/:id/comments - Add comment (auth required)');
    console.log('  DELETE /api/comments/:id - Delete comment (auth required)');
    console.log('  GET  /api/categories - Get all categories');
    console.log('  POST /api/categories - Create category (admin only)');
    console.log('  DELETE /api/categories/:id - Delete category (admin only)');
    console.log('  GET  /api/users - Get all users (admin only)');
    console.log('  DELETE /api/users/:id - Delete user (admin only)');
    console.log('  GET  /api/stats - Get blog statistics (admin only)');
});
