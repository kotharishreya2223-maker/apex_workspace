// ==========================================
// 🔒 SUPER ADMIN CREDENTIALS & RBAC SYSTEM
// ==========================================
const SUPER_ADMIN_EMAIL = "kotharishreya2223@gmail.com";
const SUPER_ADMIN_PASS = "Roshan@2006";

document.addEventListener("DOMContentLoaded", () => {
    enforcePageSecurity();
    loadDashboardData();
    loadEmployeeTable();
    loadChatsData();
});

// 🔒 STRICT RBAC PAGE GUARD
function enforcePageSecurity() {
    const currentPath = window.location.pathname;
    const sessionRole = localStorage.getItem('apex_user_role');

    if (currentPath.includes("admin-dashboard.html") || currentPath.includes("employees.html")) {
        if (sessionRole !== 'admin') {
            alert("⛔ Access Denied! Super Admin privileges required.");
            window.location.href = "login.html";
        }
    }
}

// 🔑 AUTHENTICATION LOGIC
function handleLoginSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('authEmail').value.trim().toLowerCase();
    const passwordInput = document.getElementById('authPass').value;
    const selectedRole = document.getElementById('authRole').value;

    if (selectedRole === 'admin') {
        if (emailInput === SUPER_ADMIN_EMAIL && passwordInput === SUPER_ADMIN_PASS) {
            localStorage.setItem('apex_user_role', 'admin');
            localStorage.setItem('apex_user_name', 'Shreya (Super Admin)');
            
            alert("✅ Welcome Back Super Admin!");
            window.location.href = "admin-dashboard.html";
            return;
        } else {
            alert("❌ Invalid Super Admin Credentials!");
            return;
        }
    }

    const employeesList = JSON.parse(localStorage.getItem('apex_employees_db')) || [];
    const matchedEmployee = employeesList.find(emp => emp.email === emailInput && emp.pass === passwordInput);

    if (matchedEmployee) {
        localStorage.setItem('apex_user_role', 'employee');
        localStorage.setItem('apex_user_name', matchedEmployee.name);
        
        alert(`✅ Welcome ${matchedEmployee.name}! Redirecting to chats.`);
        window.location.href = "chats.html";
    } else {
        alert("❌ Employee credentials not found or incorrect password!");
    }
}

// 📧 REAL EMAIL PASSWORD RECOVERY (EMAILJS)
function toggleForgotPassword(showForgot) {
    const loginCard = document.getElementById('loginCard');
    const forgotCard = document.getElementById('forgotPassCard');
    
    if (showForgot) {
        loginCard.style.display = 'none';
        forgotCard.style.display = 'block';
    } else {
        loginCard.style.display = 'block';
        forgotCard.style.display = 'none';
    }
}

function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    const role = document.getElementById('forgotRole').value;
    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();

    let targetName = "";
    let targetPassword = "";

    if (role === 'admin') {
        if (email === SUPER_ADMIN_EMAIL) {
            targetName = "Super Admin";
            targetPassword = SUPER_ADMIN_PASS;
        } else {
            alert("❌ Admin email address not found.");
            return;
        }
    } else {
        const employeesList = JSON.parse(localStorage.getItem('apex_employees_db')) || [];
        const matchedEmployee = employeesList.find(emp => emp.email === email);

        if (matchedEmployee) {
            targetName = matchedEmployee.name;
            targetPassword = matchedEmployee.pass;
        } else {
            alert("❌ No registered account found with this email address.");
            return;
        }
    }

    // Send credentials directly via email
    const templateParams = {
        to_email: email,
        user_name: targetName,
        user_password: targetPassword
    };

    // Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID with values from EmailJS
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(function() {
            alert(`✅ Credentials sent! Please check the inbox of ${email}.`);
            toggleForgotPassword(false);
        }, function(error) {
            alert("❌ Error dispatching email. Please verify EmailJS IDs.");
            console.error("EmailJS Error:", error);
        });
}

function logout() {
    localStorage.removeItem('apex_user_role');
    localStorage.removeItem('apex_user_name');
    window.location.href = "login.html";
}

// 👥 PROVISION EMPLOYEE LOGIC
function createEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('empName').value;
    const email = document.getElementById('empEmail').value.trim().toLowerCase();
    const role = document.getElementById('empRole').value;
    const pass = document.getElementById('empPass').value;

    let employees = JSON.parse(localStorage.getItem('apex_employees_db')) || [];
    
    if (employees.some(emp => emp.email === email)) {
        alert("❌ An employee with this email already exists!");
        return;
    }

    employees.push({ name, email, role, pass, status: "Active" });
    localStorage.setItem('apex_employees_db', JSON.stringify(employees));

    alert(`🎉 Account provisioned for ${name}!`);
    e.target.reset();
    loadEmployeeTable();
}

// 📋 RENDER TABLES AND DASHBOARDS
function loadEmployeeTable() {
    const table = document.getElementById('employeeAccountsTable');
    const badge = document.getElementById('empCount');
    const dashEmpCount = document.getElementById('dashEmpCount');
    if (!table && !dashEmpCount) return;

    const employees = JSON.parse(localStorage.getItem('apex_employees_db')) || [];
    
    if (badge) badge.innerText = `${employees.length} Employees`;
    if (dashEmpCount) dashEmpCount.innerText = employees.length;

    if (table) {
        table.innerHTML = "";
        employees.forEach(emp => {
            table.innerHTML += `
                <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.role}</td>
                    <td>${emp.email}</td>
                    <td><code>${emp.pass}</code></td>
                    <td><span style="color:#10b981;">● ${emp.status}</span></td>
                </tr>
            `;
        });
    }
}

function loadChatsData() {
    const table = document.getElementById('chatsTableBody');
    const role = localStorage.getItem('apex_user_role');
    const userName = localStorage.getItem('apex_user_name') || "User";

    const profileSpan = document.getElementById('userProfileName');
    if (profileSpan) profileSpan.innerText = userName;

    const adminNav = document.getElementById('adminNavLinks');
    if (adminNav && role !== 'admin') {
        adminNav.style.display = 'none';
    }

    if (!table) return;

    table.innerHTML = `
        <tr><td><strong>Nike India</strong></td><td>Rahul Verma</td><td>$45,000</td><td><span style="color:#10b981; font-weight:bold;">Paid</span></td><td><button class="btn-sm" onclick="alert('Opening thread...')">💬 View Thread</button></td></tr>
        <tr><td><strong>TechCorp SaaS</strong></td><td>Ananya Sharma</td><td>$30,000</td><td><span style="color:#f59e0b; font-weight:bold;">Pending ($15k)</span></td><td><button class="btn-sm" onclick="alert('Opening thread...')">💬 View Thread</button></td></tr>
    `;
}

function loadDashboardData() {
    const table = document.getElementById('liveActivityTable');
    if (!table) return;

    table.innerHTML = `
        <tr><td><strong>Rahul Verma</strong></td><td>Nike Ads</td><td>Editing Video Creatives</td><td><span style="color:#10b981;">Active Now</span></td><td><button class="btn-sm" onclick="alert('Viewing screen log...')">👁️ Audit</button></td></tr>
        <tr><td><strong>Ananya Sharma</strong></td><td>TechCorp SaaS</td><td>Setting up Google PPC</td><td><span style="color:#10b981;">Active Now</span></td><td><button class="btn-sm" onclick="alert('Viewing screen log...')">👁️ Audit</button></td></tr>
    `;
}