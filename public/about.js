let currentUser = localStorage.getItem('user');

document.addEventListener('DOMContentLoaded', () => {
    updateUI();

    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = '/';
    });

    document.getElementById('aboutBtn').addEventListener('click', () => {
        // Already on about page, no action needed
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
        window.location.href = '/profile.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('user');
        updateUI();
        showFeedback('Logged out successfully!');
        dropdown.style.display = 'none';
        window.location.href = '/';
    });

    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/';
    });
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

function showFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.style.display = 'block';
    setTimeout(() => feedback.style.display = 'none', 3000);
}