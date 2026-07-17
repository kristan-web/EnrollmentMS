<?php
/**
 * Email Functions
 * All email templates and sending functions
 */

require_once __DIR__ . '/mail.php';

// ============================================
// BASE EMAIL TEMPLATE
// ============================================

/**
 * Generate HTML email wrapper with consistent styling
 */
function getEmailWrapper($content, $title = '') {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>{$title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #1e2a5a, #16244f);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .header .subtitle {
                margin: 5px 0 0;
                font-size: 14px;
                opacity: 0.8;
            }
            .content {
                padding: 30px 25px;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #777;
                border-top: 1px solid #eee;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #1e2a5a, #16244f);
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 15px 0;
            }
            .button:hover {
                background: linear-gradient(135deg, #2b3d7c, #1e2a5a);
            }
            .badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 14px;
            }
            .badge-success {
                background: #d4edda;
                color: #155724;
            }
            .badge-danger {
                background: #f8d7da;
                color: #721c24;
            }
            .badge-info {
                background: #d1ecf1;
                color: #0c5460;
            }
            .info-box {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin: 15px 0;
                border-left: 4px solid #1e2a5a;
            }
            .info-box.warning {
                border-left-color: #ffc107;
            }
            .info-box.danger {
                border-left-color: #dc3545;
            }
            .info-box.success {
                border-left-color: #28a745;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            table th {
                background: #f8f9fa;
                padding: 10px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #dee2e6;
            }
            table td {
                padding: 10px;
                border-bottom: 1px solid #dee2e6;
            }
            @media (max-width: 480px) {
                .content { padding: 20px 15px; }
                .header h1 { font-size: 20px; }
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📚 Enrollment System</h1>
                <div class='subtitle'>Admission & Enrollment Management</div>
            </div>
            <div class='content'>
                {$content}
            </div>
            <div class='footer'>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; " . date('Y') . " Enrollment Management System</p>
                <p style='margin-top:5px;font-size:11px;color:#aaa;'>
                    This email was sent to you as part of the enrollment process.
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
}

// ============================================
// APPLICATION EMAILS
// ============================================

/**
 * Send Application Approval Email
 */
function sendApplicationApproved($to, $name, $referenceNumber, $additionalInfo = '') {
    $content = "
        <h2>🎉 Application Approved!</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>We are pleased to inform you that your application for enrollment has been <span class='badge badge-success'>APPROVED</span>.</p>
        
        <div class='info-box success'>
            <p><strong>Reference Number:</strong> " . htmlspecialchars($referenceNumber) . "</p>
            <p><strong>Status:</strong> <span class='badge badge-success'>Approved</span></p>
        </div>
        
        <p>You can now proceed with the enrollment process. Please follow these steps:</p>
        <ol>
            <li>Log in to your student portal</li>
            <li>Complete the enrollment form</li>
            <li>Submit any additional requirements</li>
            <li>Wait for confirmation</li>
        </ol>
        
        " . ($additionalInfo ? "<p><strong>Additional Information:</strong><br>" . nl2br(htmlspecialchars($additionalInfo)) . "</p>" : "") . "
        
        <p>If you have any questions, please contact the admissions office.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Application Approved');
    $subject = "✅ Application Approved - " . $referenceNumber;
    
    return sendEmail($to, $subject, $html);
}

/**
 * Send Application Refusal Email
 */
function sendApplicationRefused($to, $name, $referenceNumber, $reason) {
    $content = "
        <h2>❌ Application Update</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>We regret to inform you that your application for enrollment has been <span class='badge badge-danger'>REFUSED</span>.</p>
        
        <div class='info-box danger'>
            <p><strong>Reference Number:</strong> " . htmlspecialchars($referenceNumber) . "</p>
            <p><strong>Status:</strong> <span class='badge badge-danger'>Refused</span></p>
        </div>
        
        <div class='info-box warning'>
            <p><strong>Reason for refusal:</strong></p>
            <p>" . nl2br(htmlspecialchars($reason)) . "</p>
        </div>
        
        <p>You may re-apply for the next school year or contact the admissions office for more information.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Application Update');
    $subject = "❌ Application Update - " . $referenceNumber;
    
    return sendEmail($to, $subject, $html);
}

/**
 * Send Application Received / Confirmation Email
 */
function sendApplicationReceived($to, $name, $referenceNumber) {
    $content = "
        <h2>📋 Application Received</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>Thank you for submitting your application for enrollment. We have received your application and it is now being processed.</p>
        
        <div class='info-box'>
            <p><strong>Reference Number:</strong> " . htmlspecialchars($referenceNumber) . "</p>
            <p><strong>Status:</strong> <span class='badge badge-info'>Pending Review</span></p>
        </div>
        
        <p>Please keep your reference number for future correspondence. You can check the status of your application at any time using this reference number.</p>
        
        <p><strong>What happens next?</strong></p>
        <ol>
            <li>Our admissions team will review your application</li>
            <li>You will receive an email notification once a decision is made</li>
            <li>Check your email regularly for updates</li>
        </ol>
        
        <p>Thank you for choosing our institution.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Application Received');
    $subject = "📋 Application Received - " . $referenceNumber;
    
    return sendEmail($to, $subject, $html);
}

// ============================================
// ENROLLMENT EMAILS
// ============================================

/**
 * Send Enrollment Confirmation Email
 */
function sendEnrollmentConfirmed($to, $name, $studentNumber, $section, $schoolYear, $semester) {
    $content = "
        <h2>✅ Enrollment Confirmed!</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>Your enrollment has been successfully confirmed. Welcome to our institution!</p>
        
        <div class='info-box success'>
            <p><strong>Student Number:</strong> " . htmlspecialchars($studentNumber) . "</p>
            <p><strong>Section:</strong> " . htmlspecialchars($section) . "</p>
            <p><strong>School Year:</strong> " . htmlspecialchars($schoolYear) . "</p>
            <p><strong>Semester:</strong> " . htmlspecialchars($semester) . "</p>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
            <li>Check your class schedule</li>
            <li>Attend orientation</li>
            <li>Complete any remaining requirements</li>
        </ol>
        
        <p>For any questions, please contact the registrar's office.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Enrollment Confirmed');
    $subject = "✅ Enrollment Confirmed - " . $studentNumber;
    
    return sendEmail($to, $subject, $html);
}

/**
 * Send Enrollment Dropped Notification
 */
function sendEnrollmentDropped($to, $name, $studentNumber, $reason = '') {
    $content = "
        <h2>⚠️ Enrollment Dropped</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>This is to inform you that your enrollment has been dropped.</p>
        
        <div class='info-box warning'>
            <p><strong>Student Number:</strong> " . htmlspecialchars($studentNumber) . "</p>
            <p><strong>Status:</strong> <span class='badge badge-info'>Dropped</span></p>
        </div>
        
        " . ($reason ? "
        <div class='info-box'>
            <p><strong>Reason:</strong></p>
            <p>" . nl2br(htmlspecialchars($reason)) . "</p>
        </div>
        " : "") . "
        
        <p>If you believe this is a mistake, please contact the registrar's office immediately.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Enrollment Dropped');
    $subject = "⚠️ Enrollment Dropped - " . $studentNumber;
    
    return sendEmail($to, $subject, $html);
}

// ============================================
// STUDENT ACCOUNT EMAILS
// ============================================

/**
 * Send Student Account Created Email
 */
function sendStudentAccountCreated($to, $name, $studentNumber, $password = '') {
    $content = "
        <h2>👤 Student Account Created</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>Your student account has been created successfully.</p>
        
        <div class='info-box'>
            <p><strong>Student Number:</strong> " . htmlspecialchars($studentNumber) . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($to) . "</p>
            " . ($password ? "<p><strong>Temporary Password:</strong> " . htmlspecialchars($password) . "</p>" : "") . "
        </div>
        
        " . ($password ? "
        <p><strong>Important:</strong> Please change your password after your first login.</p>
        " : "") . "
        
        <p>You can now log in to the student portal using your credentials.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Student Account Created');
    $subject = "👤 Student Account Created - " . $studentNumber;
    
    return sendEmail($to, $subject, $html);
}

/**
 * Send Password Reset Email
 */
function sendPasswordReset($to, $name, $resetLink) {
    $content = "
        <h2>🔑 Password Reset Request</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        
        <p style='text-align:center;'>
            <a href='" . htmlspecialchars($resetLink) . "' class='button'>Reset Password</a>
        </p>
        
        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you did not request a password reset, please ignore this email or contact support.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Password Reset');
    $subject = "🔑 Password Reset Request";
    
    return sendEmail($to, $subject, $html);
}

// ============================================
// NOTIFICATION EMAILS
// ============================================

/**
 * Send General Notification Email
 */
function sendNotification($to, $name, $subject, $message, $type = 'info') {
    $badgeClass = $type === 'success' ? 'badge-success' : ($type === 'danger' ? 'badge-danger' : 'badge-info');
    $badgeText = ucfirst($type);
    
    $content = "
        <h2>📨 Notification</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <div class='info-box " . ($type === 'danger' ? 'danger' : ($type === 'success' ? 'success' : '')) . "'>
            <p><span class='badge " . $badgeClass . "'>" . $badgeText . "</span></p>
            <p>" . nl2br(htmlspecialchars($message)) . "</p>
        </div>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, $subject);
    return sendEmail($to, $subject, $html);
}

// ============================================
// SCHEDULE EMAILS
// ============================================

/**
 * Send Class Schedule Email
 */
function sendClassSchedule($to, $name, $scheduleData) {
    $scheduleHtml = "";
    if (!empty($scheduleData)) {
        $scheduleHtml = "<table>
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                </tr>
            </thead>
            <tbody>";
        
        foreach ($scheduleData as $item) {
            $scheduleHtml .= "
                <tr>
                    <td>" . htmlspecialchars($item['subject'] ?? 'N/A') . "</td>
                    <td>" . htmlspecialchars($item['day'] ?? 'N/A') . "</td>
                    <td>" . htmlspecialchars($item['time'] ?? 'N/A') . "</td>
                    <td>" . htmlspecialchars($item['room'] ?? 'N/A') . "</td>
                </tr>
            ";
        }
        
        $scheduleHtml .= "</tbody></table>";
    } else {
        $scheduleHtml = "<p>No schedule available at this time.</p>";
    }
    
    $content = "
        <h2>📅 Your Class Schedule</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>Here is your class schedule for the current term:</p>
        
        " . $scheduleHtml . "
        
        <p>Please check your schedule regularly for any updates or changes.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Class Schedule');
    $subject = "📅 Your Class Schedule";
    
    return sendEmail($to, $subject, $html);
}

// ============================================
// SYSTEM EMAILS
// ============================================

/**
 * Send Welcome Email to New Users
 */
function sendWelcomeEmail($to, $name) {
    $content = "
        <h2>👋 Welcome!</h2>
        
        <p>Dear <strong>" . htmlspecialchars($name) . "</strong>,</p>
        
        <p>Welcome to the Enrollment Management System! We are excited to have you on board.</p>
        
        <p><strong>What you can do:</strong></p>
        <ul>
            <li>Submit and track your applications</li>
            <li>Check your enrollment status</li>
            <li>View your class schedule</li>
            <li>Update your personal information</li>
        </ul>
        
        <p>If you need any assistance, please don't hesitate to contact our support team.</p>
        
        <p style='margin-top:20px;'>
            Best regards,<br>
            <strong>Enrollment Management System</strong>
        </p>
    ";
    
    $html = getEmailWrapper($content, 'Welcome!');
    $subject = "👋 Welcome to Enrollment System!";
    
    return sendEmail($to, $subject, $html);
}

// ============================================
// BULK EMAIL FUNCTIONS
// ============================================

/**
 * Send bulk emails to multiple recipients
 * Returns array of successful and failed emails
 */
function sendBulkEmail($recipients, $subject, $message, $type = 'info') {
    $results = [
        'success' => [],
        'failed' => []
    ];
    
    foreach ($recipients as $recipient) {
        $email = $recipient['email'] ?? $recipient;
        $name = $recipient['name'] ?? 'User';
        
        if (sendNotification($email, $name, $subject, $message, $type)) {
            $results['success'][] = $email;
        } else {
            $results['failed'][] = $email;
        }
    }
    
    return $results;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get email status (for debugging)
 */
function getEmailStatus() {
    return [
        'function_exists' => function_exists('sendEmail'),
        'sendgrid_loaded' => class_exists('\\SendGrid\\Mail\\Mail'),
        'mailer_file_exists' => file_exists(__DIR__ . '/mail.php')
    ];
}

/**
 * Test email configuration
 */
function testEmailConfig($to) {
    $testMessage = "
        <h2>📧 Email Test</h2>
        <p>This is a test email to confirm that the email system is working correctly.</p>
        <p><strong>Time:</strong> " . date('Y-m-d H:i:s') . "</p>
        <p><strong>Server:</strong> " . $_SERVER['SERVER_NAME'] . "</p>
    ";
    
    return sendNotification($to, 'Test User', 'Email System Test', $testMessage, 'info');
}
// ============================================
// BACKWARD COMPATIBILITY FUNCTIONS
// ============================================

/**
 * Send Approval Email (Backward compatibility)
 */
function sendApprovalEmail($to, $name, $referenceNumber) {
    return sendApplicationApproved($to, $name, $referenceNumber);
}

/**
 * Send Refusal Email (Backward compatibility)
 */
function sendRefusalEmail($to, $name, $referenceNumber, $reason) {
    return sendApplicationRefused($to, $name, $referenceNumber, $reason);
}
?>