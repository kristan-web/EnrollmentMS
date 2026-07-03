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

// Reset Change Password Fields


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
        if(emailCreation.value === ''  || passwordCreation.value === '' || confpassCreation.value === '' || fullnameCreation.value === ''){
            alert('All fields are required.');
            return;
        }

        // Check if password and confirm password matches
        if(passwordCreation.value == confpassCreation.value){
            // Check if password <= 7 or >= 20
            if(passwordCreation.value.length <= 7 || passwordCreation.value.length >= 20){
                alert('Password must be longer than 7 and shorter than 20 characters');
                return;
            }

            // If password requirements are met
            else{
                const data = new FormData(accountCreation);

                const response = await fetch('../Controllers/user_controllers.php', {
                    method: 'POST',
                    body: data
                });

                const status = await response.json();

                // If account is created successfully
                if(status.success){
                    alert(status.message);
                    resetAccountCreationField();
                    return;
                }
                // If email exists
                else{
                    alert(status.message);
                    return;
                }
            }
        }
        // If passwords do not match
        else{
            alert('Passwords do not match');
            return;
        }
    });
}

// Login Form
const loginForm = document.getElementById('loginForm')

// Only process this if loginForm exists
if(loginForm){
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Login Form Elements
        const emailLogin = document.getElementById('emailLogin');
        const passwordLogin = document.getElementById('passwordLogin');

        // Check if any of the field is empty
        if(emailLogin.value == '' || passwordLogin.value == ''){
            alert('All fields are required');
            return;
        }
        else{
            const data = new FormData(loginForm);

            const response = await fetch('Controllers/user_controllers.php', {
                method: 'POST',
                body: data
            })

            const status = await response.json();

            // If account is verified
            if(status.success){
                window.location.href = 'Views/dashboard.html';
                return;
            }
            // If account not found
            else{
                alert(status.message);
                return;
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
            alert('All fields are required');
            return;
        }
        else{
            // If new pass and confirm password matches
            if(newpassReset.value.trim() === confpassReset.value.trim()){
                // Password is <= 7 or >= 20
                if(newpassReset.value.length <= 7 || newpassReset >= 20){
                    alert('Password should be longer than 7 and shorter than 20 characters');
                    return;
                }
                else{    
                    const data = new FormData(changePassword);

                    const response = await fetch('../Controllers/user_controllers.php', {
                        method: 'POST',
                        body: data
                    })

                    const status = await response.json();

                    // Password successfully changed
                    if(status.success){
                        alert(status.message);
                        return;
                    }

                    // Password change failed
                    alert(status.message);
                    return;
                }
            }
            // New password and Confirm password did not match
            else{
                alert('Passwords did not match');
                return
            }
        }
    });
}