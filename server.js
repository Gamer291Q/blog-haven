const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const fs = require('fs');
if (!fs.existsSync('public/uploads')) {
    fs.mkdirSync('public/uploads');
}

const db = new sqlite3.Database('./blog.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )`, (err) => { if (err) console.error('Users table error:', err.message); });
    db.run(`CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY,
        title TEXT,
        content TEXT,
        author TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error('Blogs table error:', err.message); });
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY,
        blog_id INTEGER,
        user TEXT,
        FOREIGN KEY (blog_id) REFERENCES blogs(id)
    )`, (err) => { if (err) console.error('Likes table error:', err.message); });
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY,
        blog_id INTEGER,
        user TEXT,
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(id)
    )`, (err) => { if (err) console.error('Comments table error:', err.message); });
});

app.post('/signup', async (req, res) => {
    console.log('Signup request:', req.body);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).send('Database error');
        if (user) return res.status(400).send('Username already exists');
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
                if (err) return res.status(500).send('Error registering');
                res.send('Signup successful');
            });
        } catch (bcryptErr) {
            console.error('Bcrypt error:', bcryptErr);
            res.status(500).send('Error hashing password');
        }
    });
});

app.post('/login', (req, res) => {
    console.log('Login request:', req.body);
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).send('Database error');
        if (!user) return res.status(401).send('Invalid username or password');
        try {
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).send('Invalid username or password');
            res.send('Logged in');
        } catch (bcryptErr) {
            console.error('Bcrypt error:', bcryptErr);
            res.status(500).send('Error verifying password');
        }
    });
});

app.post('/blogs', upload.single('image'), (req, res) => {
    const { title, content, author } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(`INSERT INTO blogs (title, content, author, image) VALUES (?, ?, ?, ?)`, [title, content, author, image], (err) => {
        if (err) {
            console.error('Insert blog error:', err.message);
            return res.status(500).send('Error adding blog');
        }
        console.log('Blog added:', { title, author });
        res.send('Blog added');
    });
});

app.put('/blogs/:id', upload.single('image'), (req, res) => {
    const { title, content, author } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    db.get(`SELECT * FROM blogs WHERE id = ?`, [req.params.id], (err, blog) => {
        if (err) return res.status(500).send('Database error');
        if (blog.author !== author) return res.status(403).send('Not authorized');
        db.run(`UPDATE blogs SET title = ?, content = ?, image = ? WHERE id = ?`, [title, content, image, req.params.id], (err) => {
            if (err) return res.status(500).send('Error updating blog');
            res.send('Blog updated');
        });
    });
});

app.delete('/blogs/:id', (req, res) => {
    const { author } = req.body;
    db.get(`SELECT * FROM blogs WHERE id = ?`, [req.params.id], (err, blog) => {
        if (err) return res.status(500).send('Database error');
        if (blog.author !== author) return res.status(403).send('Not authorized');
        db.run(`DELETE FROM blogs WHERE id = ?`, [req.params.id], (err) => {
            if (err) return res.status(500).send('Error deleting blog');
            res.send('Blog deleted');
        });
    });
});

app.post('/blogs/:id/like', (req, res) => {
    const { user } = req.body;
    db.get(`SELECT * FROM likes WHERE blog_id = ? AND user = ?`, [req.params.id, user], (err, like) => {
        if (err) return res.status(500).send('Database error');
        if (like) return res.status(400).send('Already liked');
        db.run(`INSERT INTO likes (blog_id, user) VALUES (?, ?)`, [req.params.id, user], (err) => {
            if (err) return res.status(500).send('Error liking blog');
            res.send('Blog liked');
        });
    });
});

app.post('/blogs/:id/comment', (req, res) => {
    const { user, text } = req.body;
    db.run(`INSERT INTO comments (blog_id, user, text) VALUES (?, ?, ?)`, [req.params.id, user, text], (err) => {
        if (err) {
            console.error('Insert comment error:', err.message);
            return res.status(500).send('Error adding comment');
        }
        res.send('Comment added');
    });
});

app.get('/blogs', (req, res) => {
    db.all(`
        SELECT b.id, b.title, b.content, b.author, b.image, b.created_at, 
               (SELECT COUNT(*) FROM likes l WHERE l.blog_id = b.id) as likes, 
               GROUP_CONCAT(c.text || '|' || c.user || '|' || c.created_at) as comments
        FROM blogs b
        LEFT JOIN comments c ON b.id = c.blog_id
        GROUP BY b.id, b.title, b.content, b.author, b.image, b.created_at
        ORDER BY b.created_at DESC
    `, (err, rows) => {
        if (err) {
            console.error('Query error in /blogs:', err.message);
            return res.status(500).json([]);
        }
        console.log('Blogs fetched:', rows ? rows.length : 0, 'rows');
        const blogs = (rows || []).map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            author: row.author,
            image: row.image,
            created_at: row.created_at,
            likes: row.likes,
            comments: row.comments ? row.comments.split(',').map(c => {
                const [text, user, created_at] = c.split('|');
                return { text, user, created_at };
            }) : []
        }));
        res.json(blogs);
    });
});

app.get('/blogs/user/:username', (req, res) => {
    const { username } = req.params;
    db.all(`
        SELECT b.id, b.title, b.content, b.author, b.image, b.created_at, 
               (SELECT COUNT(*) FROM likes l WHERE l.blog_id = b.id) as likes, 
               GROUP_CONCAT(c.text || '|' || c.user || '|' || c.created_at) as comments
        FROM blogs b
        LEFT JOIN comments c ON b.id = c.blog_id
        WHERE b.author = ?
        GROUP BY b.id, b.title, b.content, b.author, b.image, b.created_at
        ORDER BY b.created_at DESC
    `, [username], (err, rows) => {
        if (err) {
            console.error('Query error in /blogs/user:', err.message);
            return res.status(500).json([]);
        }
        console.log('User blogs fetched:', rows ? rows.length : 0, 'rows');
        const blogs = (rows || []).map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            author: row.author,
            image: row.image,
            created_at: row.created_at,
            likes: row.likes,
            comments: row.comments ? row.comments.split(',').map(c => {
                const [text, user, created_at] = c.split('|');
                return { text, user, created_at };
            }) : []
        }));
        res.json(blogs);
    });
});

app.get('/blog.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.listen(3000, () => console.log('Server running on port 3000'));