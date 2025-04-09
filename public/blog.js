let currentUser = localStorage.getItem('user');
const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    loadFullBlog(blogId);
    updateUI();

    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = '/';
    });

    document.getElementById('aboutBtn').addEventListener('click', () => {
        window.location.href = 'about.html';
    });
    

    const userIcon = document.getElementById('userIcon');
    const dropdown = document.getElementById('userDropdown');
    userIcon.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target) && !userIcon.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
        dropdown.style.display = 'none';
        window.location.href = '/#loginForm';
    });

    document.getElementById('signupBtn').addEventListener('click', () => {
        dropdown.style.display = 'none';
        window.location.href = '/#signupForm';
    });

    document.getElementById('profileBtn').addEventListener('click', () => {
        dropdown.style.display = 'none';
        window.location.href = '/#profilePage';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('user');
        updateUI();
        showFeedback('Logged out successfully!');
        dropdown.style.display = 'none';
    });

    document.getElementById('fullLike').addEventListener('click', () => likeBlog(blogId));
    document.getElementById('fullCommentBtn').addEventListener('click', () => commentBlog(blogId));
    document.getElementById('editBlogBtn').addEventListener('click', () => window.location.href = `/#editForm?id=${blogId}`);
    document.getElementById('deleteBlogBtn').addEventListener('click', () => deleteBlog(blogId));
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = '/');
});

function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userIcon = document.getElementById('userIcon');

    if (currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        profileBtn.style.display = 'block';
        logoutBtn.style.display = 'block';
        userIcon.textContent = '🚪';
    } else {
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        profileBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        userIcon.textContent = '👤';
    }
}

function loadFullBlog(id) {
    fetch('/blogs')
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch blogs');
            return res.json();
        })
        .then(blogs => {
            const blog = blogs.find(b => b.id === parseInt(id));
            if (!blog) throw new Error('Blog not found');
            document.getElementById('fullTitle').textContent = blog.title;
            document.getElementById('fullImage').src = blog.image || '';
            document.getElementById('fullImage').style.display = blog.image ? 'block' : 'none';
            document.getElementById('fullContent').textContent = blog.content;
            document.getElementById('fullAuthor').textContent = `By: ${blog.author} on ${new Date(blog.created_at).toLocaleDateString()}`;
            document.getElementById('fullLike').textContent = `Like (${blog.likes})`;
            document.getElementById('fullComments').innerHTML = blog.comments.map(c => 
                `<p>${c.text} (by ${c.user} on ${new Date(c.created_at).toLocaleDateString()})</p>`
            ).join('');
            document.getElementById('fullCommentInput').value = '';

            if (currentUser === blog.author) {
                document.getElementById('editBlogBtn').style.display = 'inline';
                document.getElementById('deleteBlogBtn').style.display = 'inline';
            } else {
                document.getElementById('editBlogBtn').style.display = 'none';
                document.getElementById('deleteBlogBtn').style.display = 'none';
            }
        })
        .catch(err => {
            console.error('Error in loadFullBlog:', err);
            document.getElementById('blogContent').innerHTML = '<p>Error loading blog: ' + err.message + '</p>';
        });
}

function likeBlog(id) {
    if (!currentUser) {
        alert('Please log in to like this blog.');
        return;
    }
    toggleButtonState('fullLike', true);
    fetch(`/blogs/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser })
    }).then(res => {
        if (!res.ok) throw new Error('Failed to like blog');
        return res.text();
    }).then(() => {
        loadFullBlog(id);
        showFeedback('Blog liked!');
    }).catch(err => {
        console.error('Error liking blog:', err);
        if (err.message !== 'Already liked') alert('Failed to like blog');
    }).finally(() => toggleButtonState('fullLike', false));
}

function commentBlog(id) {
    const text = document.getElementById('fullCommentInput').value;
    if (!text || !currentUser) {
        if (!currentUser) alert('Please log in to comment on this blog.');
        return;
    }
    toggleButtonState('fullCommentBtn', true);
    fetch(`/blogs/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser, text })
    }).then(res => {
        if (!res.ok) throw new Error('Failed to add comment');
        return res.text();
    }).then(() => {
        document.getElementById('fullCommentInput').value = '';
        loadFullBlog(id);
        showFeedback('Comment posted!');
    }).catch(err => {
        console.error('Error commenting:', err);
        alert('Failed to post comment');
    }).finally(() => toggleButtonState('fullCommentBtn', false));
}

function deleteBlog(id) {
    if (!currentUser) return;
    toggleButtonState('deleteBlogBtn', true);
    fetch(`/blogs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: currentUser })
    }).then(res => {
        if (!res.ok) throw new Error('Failed to delete blog');
        return res.text();
    }).then(() => {
        window.location.href = '/';
        showFeedback('Blog deleted!');
    }).catch(err => {
        console.error('Error deleting blog:', err);
        alert('Failed to delete blog');
    }).finally(() => toggleButtonState('deleteBlogBtn', false));
}

function showFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.style.display = 'block';
    setTimeout(() => feedback.style.display = 'none', 3000);
}

function toggleButtonState(buttonId, disable) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = disable;
        button.style.opacity = disable ? '0.5' : '1';
    }
}