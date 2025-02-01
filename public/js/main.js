let token = localStorage.getItem('token');
let userEmail = localStorage.getItem('userEmail');

window.onload = () => {
    checkAuth();
};

function showLoginForm() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('emailDashboard').classList.add('hidden');
    document.getElementById('howToSection').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('emailDashboard').classList.add('hidden');
    document.getElementById('howToSection').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showEmailDashboard() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('howToSection').classList.add('hidden');
    document.getElementById('emailDashboard').classList.remove('hidden');
    loadEmailHistory();
}

function showHowTo() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('emailDashboard').classList.add('hidden');
    document.getElementById('howToSection').classList.remove('hidden');
}

async function register(event) {
    event.preventDefault();
    
    try {
        const data = {
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            subdomain: document.getElementById('reg-subdomain').value
        };

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            token = result.token;
            userEmail = result.email;
            localStorage.setItem('token', token);
            localStorage.setItem('userEmail', userEmail);
            showNotification('Registration successful!', 'success');
            checkAuth();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Registration failed: ' + error.message, 'error');
    }
}

async function login(event) {
    event.preventDefault();
    
    try {
        const data = {
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        };

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            token = result.token;
            userEmail = result.email;
            localStorage.setItem('token', token);
            localStorage.setItem('userEmail', userEmail);
            showNotification('Login successful!', 'success');
            checkAuth();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    }
}

function logout() {
    token = null;
    userEmail = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    showNotification('Logged out successfully', 'success');
    checkAuth();
}

async function sendEmail(event) {
    event.preventDefault();
    
    try {
        const data = {
            to: document.getElementById('email-to').value,
            subject: document.getElementById('email-subject').value,
            text: document.getElementById('email-text').value
        };

        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification('Email sent successfully!', 'success');
            document.getElementById('email-to').value = '';
            document.getElementById('email-subject').value = '';
            document.getElementById('email-text').value = '';
            loadEmailHistory();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to send email: ' + error.message, 'error');
    }
}

function updateDashboardStats() {

    document.getElementById('userEmailDisplay').textContent = userEmail;
    

    const emailCount = document.getElementById('emailHistoryBody').childElementCount;
    document.getElementById('sentEmailCount').textContent = `${emailCount} ฉบับ`;
    

    const createdDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('accountCreatedDate').textContent = createdDate;
}


async function loadEmailHistory() {
    try {
        const response = await fetch('/api/email/sent', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const emails = await response.json();
        const tbody = document.getElementById('emailHistoryBody');
        tbody.innerHTML = '';

        emails.forEach(email => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${email.to}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${email.subject}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(email.date).toLocaleDateString('th-TH')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ส่งแล้ว
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });

        updateDashboardStats();
    } catch (error) {
        showNotification('ไม่สามารถโหลดประวัติอีเมลได้: ' + error.message, 'error');
    }
}


function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}


function checkAuth() {
    if (token) {
        document.getElementById('authButtons').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('userEmail').textContent = userEmail;
        showEmailDashboard();
    } else {
        document.getElementById('authButtons').classList.remove('hidden');
        document.getElementById('userInfo').classList.add('hidden');
        document.getElementById('emailDashboard').classList.add('hidden');
        showLoginForm();
    }
} 