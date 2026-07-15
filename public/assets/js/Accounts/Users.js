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

function checkEmptyField(fields){
    for(const field of fields){
        if(field.value.trim() === ''){
            return true;
        }
    }

    return false;
}

function checkPasswordMatch(password, confpass){
    if(password.value.trim() === confpass.value.trim()){
        return true;
    }

    return false;
}

function checkPasswordLength(password){
    if(password.value.length <= 7 || password.value.length >= 20){
        return false;
    }

    return true;
}

// Only process this if accountCreation form exists
if(accountCreation){
    // Account Creation Elements
    const emailCreation = document.getElementById('emailCreation');
    const passwordCreation = document.getElementById('passwordCreation');
    const confpassCreation = document.getElementById('confpassCreation');
    const fullnameCreation = document.getElementById('fullnameCreation');
    const accountRole = document.getElementById('accountRole');

    let fields = 
    [
        emailCreation,
        passwordCreation, 
        confpassCreation, 
        fullnameCreation, 
        accountRole
    ]

    // Add event listener to form
    accountCreation.addEventListener('submit', async (e) =>{
        // Prevent default submission
        e.preventDefault();

        if(checkEmptyField(fields)){
            showAlert("All fields are required", 'error');
            return;
        }

        if(!checkPasswordMatch(passwordCreation, confpassCreation)){
            showAlert("Passwords do not match", 'error');
            return;
        }

        if(!checkPasswordLength(passwordCreation)){
            showAlert("Password should be longer than 7 and less than 20 characters", 'error');
            return;
        }
        
        const data = new FormData(accountCreation);

        try{
            const response = await fetch('/EnrollmentMS/app/Accounts/Controller/user_controllers.php', {
                method: 'POST',
                body: data
            });

            const status = await response.json();

            if(status.success){
                showAlert(status.message, 'success');
                resetAccountCreationField();
                return;
            }
            else{
                showAlert(status.message, 'error');
                return;
            }
        } catch (error) {
            showAlert('Network error. Please try again.', 'error');
            console.error('Error:', error);
        }
    });
}

// Login Form
const loginForm = document.getElementById('loginForm');

// Only process this if loginForm exists
if(loginForm){
    const emailLogin = document.getElementById('emailLogin');
    const passwordLogin = document.getElementById('passwordLogin');
    let fields = 
    [
        emailLogin, 
        passwordLogin
    ];
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if any of the field is empty
        if(checkEmptyField(fields)){
            showAlert("All fields are required", 'error');
            return;
        }

        const data = new FormData(loginForm);

        try {

            const response = await fetch('/EnrollmentMS/app/Accounts/Controller/user_controllers.php', {
                method: 'POST',
                body: data
            });

            const status = await response.json();

            // If account is verified
            if(status.success){
                showAlert('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/EnrollmentMS/app/Dashboards/dashboard.php';
                }, 1000);
                return;
            }
            else{
                showAlert(status.message, 'error');
                return;
            }
        } catch (error) {
            showAlert('Network error. Please try again.', 'error');
            console.error('Error:', error);
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
                        // Path: Absolute from web root to app/Accounts/Controller/user_controllers.php
                        const response = await fetch('/EnrollmentMS/app/Accounts/Controller/user_controllers.php', {
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
