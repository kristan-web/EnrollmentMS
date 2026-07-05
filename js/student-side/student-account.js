const loginForm = document.getElementById('loginForm');
const regForm = document.getElementById('regForm');
const createAccount = document.getElementById('createAccount');
const loginAccount = document.getElementById('loginAccount');

// Form Field - Create Account
const emailAddress = document.getElementById('email_address');
const contactNumber = document.getElementById('contact_number');
const password = document.getElementById('password');
const confpassword = document.getElementById('confpassword');

// Form Field - Login Account
const emailLogin = document.getElementById('email_login');
const passwordLogin = document.getElementById('password_login');

//Alert
const alert = document.getElementsByClassName('alert');

const regAlert = document.getElementById('regAlert');
const loginAlert = document.getElementById('loginAlert');



// Run at webpage load
if(regForm.classList.contains('active')){
    loginForm.style.setProperty('display', 'none', 'important');
}

// Event Listener
createAccount.addEventListener('submit', createAccountt);
loginAccount.addEventListener('submit', LoginAccount);

contactNumber.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});


// Functions
function changeActiveForm(){ 
    if(regForm.classList.contains('active')){
        regForm.classList.remove('active');
        loginForm.classList.add('active');

        regForm.style.setProperty('display', 'none', 'important');
        loginForm.style.setProperty('display', 'flex', 'important');
        clearFormField();
        return;
    }
    
    if(loginForm.classList.contains('active')){
        loginForm.classList.remove('active');
        regForm.classList.add('active');

        loginForm.style.setProperty('display', 'none', 'important');
        regForm.style.setProperty('display', 'flex', 'important');
        clearFormField();
        return;
    }
}

function clearFormField(){
    emailAddress.value = '';
    contactNumber.value = '';
    password.value = '';
    confpassword.value = '';
    regAlert.textContent = '';
    regAlert.style.setProperty('display', 'none', 'important');

    emailLogin.value = '';
    passwordLogin.value = '';
    loginAlert.textContent = '';
    loginAlert.style.setProperty('display', 'none', 'important');
}

async function createAccountt(e){
    e.preventDefault();

    // // Reset Alert Values
    // if(regAlert.classList.contains('alert-warning')){
    //     regAlert.classList.remove('alert-warning');
    //     regAlert.textContent = '';
    // }

    // if(regAlert.classList.contains('alert-success')){
    //     regAlert.classList.remove('alert-success');
    //     regAlert.textContent = '';
    // }

    // // Check if any of the values is empty
    // if(emailAddress.value.trim() == '' || contactNumber.value.trim() == '' || password.value.trim() == '' || confpassword.value.trim() == ''){
    //     // regAlert.classList.add('alert-warning');
    //     // regAlert.style.setProperty('display', 'block', 'important')
    //     // regAlert.textContent = 'All fields are required';
    //     return;
    // }

    // // Check if contact number is < 9 or > 9 digits
    // if(contactNumber.value.length < 11 || contactNumber.value.length > 11){
    //     // regAlert.classList.add('alert-warning');
    //     // regAlert.style.setProperty('display', 'block', 'important')
    //     // regAlert.textContent = 'Please enter a valid contact number';
    //     return;
    // }

    // if(password.value != confpassword.value){
    //     // regAlert.classList.add('alert-warning');
    //     // regAlert.style.setProperty('display', 'block', 'important')
    //     // regAlert.textContent = 'Passwords did not match';
    //     return;
    // }
    // else{
    //     if(password.value.length <= 8 || password.value.length >= 20){
    //         // regAlert.classList.add('alert-warning');
    //         // regAlert.style.setProperty('display', 'block', 'important')
    //         // regAlert.textContent = 'Password should be longer than 8 and less than 20 characters';
    //         return;
    //     }
    //     else{
    //         // regAlert.classList.add('alert-success');
    //         // regAlert.style.setProperty('display', 'block', 'important')
    //         // regAlert.textContent = 'Success!';
    //         // return;

    //     }

        const data = new FormData(createAccount);

            try {
                // Path: from root directory to Controllers folder
                const response = await fetch('../../Controllers/student-side/student_account_controllers.php', {
                    method: 'POST',
                    body: data
                });

                // const status = await response.json();
                const text = await response.text();
                console.log(text);
                return;

                // If account is verified
                if(status.success){
                    // showAlert('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = 'admission-page.html';
                    }, 1000);
                    return;
                }
                // If account not found
                else{
                    // showAlert(status.message, 'error');
                    return;
                }
            } catch (error) {
                // showAlert('Network error. Please try again.', 'error');
                console.error('Error:', error);
            }
};

async function LoginAccount(e){
    e.preventDefault();
    // // Reset Alert Values
    // if(loginAlert.classList.contains('alert-warning')){
    //     loginAlert.classList.remove('alert-warning');
    //     loginAlert.textContent = '';
    // }

    // if(loginAlert.classList.contains('alert-success')){
    //     loginAlert.classList.remove('alert-success');
    //     loginAlert.textContent = '';
    // }
    
    // // If one of the fields is empty
    // if(emailLogin.value.trim() == '' || passwordLogin.value.trim() == ''){
    //     loginAlert.classList.add('alert-warning');
    //     loginAlert.style.setProperty('display', 'block', 'important')
    //     loginAlert.textContent = 'All fields are required';
    //     return;
    // }
    // else{
    //     if(passwordLogin.value.length <= 8 || passwordLogin.value.length >= 20){
    //         loginAlert.classList.add('alert-warning');
    //         loginAlert.style.setProperty('display', 'block', 'important')
    //         loginAlert.textContent = 'Password should be longer than 8 and less than 20 characters';
    //         return;
    //     }
    //     else{
    //         loginAlert.classList.add('alert-success');
    //         loginAlert.style.setProperty('display', 'block', 'important')
    //         loginAlert.textContent = 'Success!';
    //     }
    // }

    const data = new FormData(loginAccount);

    try{
        const response = await fetch('../../Controllers/student-side/student_account_controllers.php', {
            method: 'POST',
            body: data
        });

        const text = await response.text();
        console.log(text);
        return;

        // If account is verified
        if(status.success){
            // showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'admission-page.html';
            }, 1000);
            return;
        }
        // If account not found
        else{
            // showAlert(status.message, 'error');
            return;
        }
    } catch (error) {
        // showAlert('Network error. Please try again.', 'error');
        console.error('Error:', error);
    }
};