//Change message.push to banner
//Change alert validation to banner before redirection

const email = document.getElementById('email-input');
const password = document.getElementById('password-input');
const form = document.getElementById('login-form');
const errorElement = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let messages = [];
    if(email.value === '' || email.value == null){
        messages.push('Email is required');
    }

    if(password.value === '' || password.value == null){
        messages.push('Password is required');
    }

    if(messages.length > 0){
        errorElement.innerText = messages.join(', ');
    }

    const formData = new FormData(form);

    const response = await fetch('../Controllers/user_controllers.php', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();

    alert(result.message);

    if (result.success) {
        window.location.href = 'dashboard.html';
    }
});
