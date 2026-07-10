// Utility function to show alert
function showAlert(message, type = 'error', containerId = null) {
    const alertContainer = document.getElementById(containerId || 'alert');
    if (!alertContainer) {
        // Fallback to browser alert if custom alert not found
        alert(message);
        return;
    }

    const alertTitle = document.getElementById('alertTitle');
    const alertText = document.getElementById('alertText');
    const alertIcon = alertContainer.querySelector('.alert__icon svg');

    // Reset classes
    alertContainer.classList.remove('alert--success', 'alert--error');
    alertContainer.hidden = false;

    if (type === 'success') {
        alertContainer.classList.add('alert--success');
        if (alertTitle) alertTitle.textContent = 'Success!';
        // Change icon to checkmark
        if (alertIcon) {
            alertIcon.innerHTML = '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>';
        }
    } else {
        alertContainer.classList.add('alert--error');
        if (alertTitle) alertTitle.textContent = 'Something Went Wrong';
        if (alertIcon) {
            alertIcon.innerHTML = '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>';
        }
    }

    if (alertText) alertText.textContent = message;
}

// Account Creation Form
const accountCreation = document.getElementById('accountCreation');

// Reset Account Creation Fields
function resetAccountCreationField(){
    const emailCreation = document.getElementById('emailCreation');
    const passwordCreation = document.getElementById('passwordCreation');
    const confpassCreation = document.getElementById('confpassCreation');
    const fullnameCreation = document.getElementById('fullnameCreation');

    emailCreation.value = '';
    passwordCreation.value = '';
    confpassCreation.value = '';
    fullnameCreation.value = '';
}

// Only process this if accountCreation form exists
if(accountCreation){
    // Account Creation Elements
    const emailCreation = document.getElementById('emailCreation');
    const passwordCreation = document.getElementById('passwordCreation');
    const confpassCreation = document.getElementById('confpassCreation');
    const fullnameCreation = document.getElementById('fullnameCreation');

    // Add event listener to form
    accountCreation.addEventListener('submit', async (e) =>{
        // Prevent default submission
        e.preventDefault();

        // Check if any of the field is empty
        if(emailCreation.value.trim() === ''  || passwordCreation.value.trim() === '' || confpassCreation.value.trim() === '' || fullnameCreation.value.trim() === ''){
            showAlert('All fields are required.', 'error');
            return;
        }

        // Check if password and confirm password matches
        if(passwordCreation.value === confpassCreation.value){
            // Check if password <= 7 or >= 20
            if(passwordCreation.value.length <= 7 || passwordCreation.value.length >= 20){
                showAlert('Password must be longer than 7 and shorter than 20 characters', 'error');
                return;
            }

            // If password requirements are met
            else{
                const data = new FormData(accountCreation);

                try {
                    // Path: from Views folder to Controllers folder
                    const response = await fetch('../Controller/user_controllers.php', {
                        method: 'POST',
                        body: data
                    });

                    const status = await response.json();

                    // If account is created successfully
                    if(status.success){
                        showAlert(status.message, 'success');
                        resetAccountCreationField();
                        return;
                    }
                    // If email exists
                    else{
                        showAlert(status.message, 'error');
                        return;
                    }
                } catch (error) {
                    showAlert('Network error. Please try again.', 'error');
                    console.error('Error:', error);
                }
            }
        }
        // If passwords do not match
        else{
            showAlert('Passwords do not match', 'error');
            return;
        }
    });
}

// Login Form
const loginForm = document.getElementById('loginForm');

// Only process this if loginForm exists
if(loginForm){
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Login Form Elements
        const emailLogin = document.getElementById('emailLogin');
        const passwordLogin = document.getElementById('passwordLogin');

        // Check if any of the field is empty
        if(emailLogin.value.trim() === '' || passwordLogin.value.trim() === ''){
            showAlert('All fields are required', 'error');
            return;
        }
        else{
            const data = new FormData(loginForm);

            try {
                // Path: from root directory to Controllers folder
                const response = await fetch('../app/Accounts/Controller/user_controllers.php', {
                    method: 'POST',
                    body: data
                });

                const status = await response.json();

                // If account is verified
                if(status.success){
                    showAlert('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '../app/Dashboards/dashboard.php';
                    }, 1000);
                    return;
                }
                // If account not found
                else{
                    showAlert(status.message, 'error');
                    return;
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
                console.error('Error:', error);
            }
        }
    });
}

// Change Password Form
const changePassword = document.getElementById('changePassword');

if(changePassword){
    changePassword.addEventListener('submit', async (e) =>{
        e.preventDefault();

        // Change Password Elements
        const emailReset = document.getElementById('emailReset');
        const passwordReset = document.getElementById('passwordReset');
        const newpassReset = document.getElementById('newpassReset');
        const confpassReset = document.getElementById('confpassReset');
        
        // Check if any of the field is empty
        if(emailReset.value.trim() === '' || passwordReset.value.trim() === '' || newpassReset.value.trim() === '' || confpassReset.value.trim() === ''){
            showAlert('All fields are required', 'error');
            return;
        }
        else{
            // If new pass and confirm password matches
            if(newpassReset.value.trim() === confpassReset.value.trim()){
                // Password is <= 7 or >= 20
                if(newpassReset.value.length <= 7 || newpassReset.value.length >= 20){
                    showAlert('Password should be longer than 7 and shorter than 20 characters', 'error');
                    return;
                }
                else{    
                    const data = new FormData(changePassword);

                    try {
                        // Path: from Views folder to Controllers folder
                        const response = await fetch('../Controller/user_controllers.php', {
                            method: 'POST',
                            body: data
                        });

                        const status = await response.json();

                        // Password successfully changed
                        if(status.success){
                            showAlert(status.message, 'success');
                            // Reset fields
                            emailReset.value = '';
                            passwordReset.value = '';
                            newpassReset.value = '';
                            confpassReset.value = '';
                            return;
                        }
                        // Password change failed
                        else{
                            showAlert(status.message, 'error');
                            return;
                        }
                    } catch (error) {
                        showAlert('Network error. Please try again.', 'error');
                        console.error('Error:', error);
                    }
                }
            }
            // New password and Confirm password did not match
            else{
                showAlert('Passwords did not match', 'error');
                return;
            }
        }
    });
}