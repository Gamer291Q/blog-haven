let currentUser = localStorage.getItem('user');
let editingBlogId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBlogs();
    updateUI();

    document.getElementById('homeBtn').addEventListener('click', () => {
        console.log('Home button clicked');
        loadBlogs();
    });

    document.getElementById('aboutBtn').addEventListener('click', () => {
        window.location.href = 'about.html';
    });
    

    document.getElementById('searchBar').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        loadBlogs(query);
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
        showSection('loginForm');
    });

    document.getElementById('loginSubmit').addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        toggleButtonState('loginSubmit', true);
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text); });
            return res.text();
        }).then(() => {
            currentUser = username;
            localStorage.setItem('user', username);
            updateUI();
            loadBlogs();
            showSection('blogs');
            showFeedback('Logged in successfully!');
        }).catch(err => {
            alert(err.message);
        }).finally(() => toggleButtonState('loginSubmit', false));
    });

    document.getElementById('loginCancel').addEventListener('click', () => {
        showSection('blogs');
    });

    document.getElementById('signupBtn').addEventListener('click', () => {
        dropdown.style.display = 'none';
        showSection('signupForm');
    });

    document.getElementById('signupSubmit').addEventListener('click', () => {
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        toggleButtonState('signupSubmit', true);
        fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text); });
            return res.text();
        }).then(() => {
            currentUser = username;
            localStorage.setItem('user', username);
            updateUI();
            loadBlogs();
            showSection('blogs');
            showFeedback('Signed up successfully!');
        }).catch(err => {
            alert(err.message);
        }).finally(() => toggleButtonState('signupSubmit', false));
    });

    document.getElementById('signupCancel').addEventListener('click', () => {
        showSection('blogs');
    });

    document.getElementById('profileBtn').addEventListener('click', () => {
        dropdown.style.display = 'none';
        showProfile();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('user');
        updateUI();
        loadBlogs();
        dropdown.style.display = 'none';
        showFeedback('Logged out successfully!');
    });

    document.getElementById('toggleLoginPassword').addEventListener('click', () => {
        const input = document.getElementById('loginPassword');
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('toggleSignupPassword').addEventListener('click', () => {
        const input = document.getElementById('signupPassword');
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('addBlogBtn').addEventListener('click', () => {
        showSection('blogForm');
    });

    document.getElementById('submitBlog').addEventListener('click', () => {
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('content', document.getElementById('content').value);
        formData.append('author', currentUser);
        formData.append('image', document.getElementById('image').files[0]);
        toggleButtonState('submitBlog', true);
        fetch('/blogs', {
            method: 'POST',
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to add blog');
            return res.text();
        }).then(() => {
            document.getElementById('title').value = '';
            document.getElementById('content').value = '';
            document.getElementById('image').value = '';
            loadBlogs();
            showFeedback('Blog posted successfully!');
        }).catch(err => {
            console.error('Error adding blog:', err);
            alert('Failed to add blog');
        }).finally(() => toggleButtonState('submitBlog', false));
    });

    

    setTimeout(() => {
        const profileBackBtn = document.getElementById('profileBackBtn');
        if (profileBackBtn) {
            profileBackBtn.addEventListener('click', () => {
                console.log('Profile back button clicked');
                showSection('blogs');
                loadBlogs();
            });
        } else {
            console.warn('profileBackBtn not found');
        }
    }, 0);
    

});

document.getElementById('cancelBlog').addEventListener('click', () => {
    console.log('Cancel blog form');
    showSection('blogs'); // Hide the form, go back to main blog list
});


function updateUI() {
    const addBlogBtn = document.getElementById('addBlogBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userIcon = document.getElementById('userIcon');

    if (currentUser) {
        addBlogBtn.style.display = 'inline';
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        profileBtn.style.display = 'block';
        logoutBtn.style.display = 'block';
        userIcon.textContent = '🚪';
    } else {
        addBlogBtn.style.display = 'none';
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        profileBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        userIcon.textContent = '👤';
    }
}

function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    const sections = ['blogs', 'siteInfo', 'blogForm', 'editForm', 'fullBlog', 'loginForm', 'signupForm', 'profilePage'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = id === sectionId ? 'block' : (id === 'blogs' || id === 'siteInfo') ? 'block' : 'none';
        }
    });
    document.body.classList.toggle('form-open', sectionId !== 'blogs');
}

function loadBlogs(query = '') {
    console.log('loadBlogs called with query:', query);
    showSection('blogs');
    const blogsDiv = document.getElementById('blogs');
    if (!blogsDiv) {
        console.error('blogsDiv not found');
        return;
    }
    blogsDiv.innerHTML = '<p>Loading blogs...</p>';

    fetch('/blogs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(blogs => {
            console.log('Blogs received:', blogs);
            blogsDiv.innerHTML = '';
            const filteredBlogs = blogs.filter(blog => 
                blog.title.toLowerCase().includes(query) || 
                blog.author.toLowerCase().includes(query)
            );
            if (filteredBlogs.length === 0) {
                blogsDiv.innerHTML = '<p>No blogs found. Add one to get started!</p>';
            } else {
                filteredBlogs.forEach(blog => {
                    const shortContent = blog.content.length > 50 ? blog.content.substring(0, 50) + '...' : blog.content;
                    blogsDiv.innerHTML += `
                        <div class="blog-preview" onclick="window.location.href='/blog.html?id=${blog.id}'">
                            ${blog.image ? `<img src="${blog.image}" alt="${blog.title}">` : ''}
                            <div>
                                <h3>${blog.title}</h3>
                                <p>${shortContent}</p>
                                <p>By: ${blog.author} on ${new Date(blog.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>`;
                });
            }
        })
        .catch(err => {
            console.error('Fetch error in loadBlogs:', err);
            blogsDiv.innerHTML = '<p>Error loading blogs: ' + err.message + '. Please try again.</p>';
        });
}

function showFullBlog(id) {
    // This function is now unused but kept for reference
    console.log('showFullBlog is deprecated; use blog.html instead');
}

function showEditForm(id) {
    console.log('Showing edit form for blog id:', id);
    editingBlogId = id;
    showSection('editForm');
    fetch('/blogs')
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch blogs');
            return res.json();
        })
        .then(blogs => {
            const blog = blogs.find(b => b.id === id);
            if (!blog) throw new Error('Blog not found');
            document.getElementById('editTitle').value = blog.title;
            document.getElementById('editContent').value = blog.content;
        })
        .catch(err => console.error('Error fetching blog for edit:', err));

    document.getElementById('submitEdit').onclick = () => {
        const formData = new FormData();
        formData.append('title', document.getElementById('editTitle').value);
        formData.append('content', document.getElementById('editContent').value);
        formData.append('author', currentUser);
        const newImage = document.getElementById('editImage').files[0];
        if (newImage) formData.append('image', newImage);
        toggleButtonState('submitEdit', true);
        fetch(`/blogs/${id}`, {
            method: 'PUT',
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update blog');
            return res.text();
        }).then(() => {
            loadBlogs();
            showFeedback('Blog updated successfully!');
        }).catch(err => {
            console.error('Error updating blog:', err);
            alert('Failed to update blog');
        }).finally(() => toggleButtonState('submitEdit', false));
    };
}

function showProfile() {
    console.log('Showing profile for user:', currentUser);
    showSection('profilePage');
    document.getElementById('profileTitle').textContent = `${currentUser}'s Blogs`;
    fetch(`/blogs/user/${currentUser}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user blogs');
            return res.json();
        })
        .then(blogs => {
            const profileBlogs = document.getElementById('profileBlogs');
            profileBlogs.innerHTML = '';
            if (blogs.length === 0) {
                profileBlogs.innerHTML = '<p>You haven\'t posted any blogs yet.</p>';
            } else {
                blogs.forEach(blog => {
                    const shortContent = blog.content.length > 50 ? blog.content.substring(0, 50) + '...' : blog.content;
                    profileBlogs.innerHTML += `
                        <div class="blog-preview" onclick="window.location.href='/blog.html?id=${blog.id}'">
                            ${blog.image ? `<img src="${blog.image}" alt="${blog.title}">` : ''}
                            <div>
                                <h3>${blog.title}</h3>
                                <p>${shortContent}</p>
                                <p>By: ${blog.author} on ${new Date(blog.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>`;
                });
            }
        })
        .catch(err => {
            console.error('Error in showProfile:', err);
            document.getElementById('profileBlogs').innerHTML = '<p>Error loading your blogs.</p>';
        });
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