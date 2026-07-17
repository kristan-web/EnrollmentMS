<?php
/**
 * Main Mail Configuration
 * Uses SendGrid for email delivery
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// Load all email functions
require_once __DIR__ . '/email_functions.php';

function sendEmail($to, $subject, $body, $altBody = '') {
    // Validate email
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        error_log("Invalid email address: $to");
        return false;
    }
    
    $email = new \SendGrid\Mail\Mail();
    $email->setFrom("verifyeventia@gmail.com", "Enrollment System");
    $email->setSubject($subject);
    $email->addTo($to);
    $email->addContent("text/html", $body);
    
    if ($altBody) {
        $email->addContent("text/plain", $altBody);
    }
    
    // IMPORTANT: Replace with your actual SendGrid API Key
    $apiKey = getenv('SENDGRID_API_KEY') ?: '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';
    $sendgrid = new \SendGrid($apiKey);
    
    try {
        $response = $sendgrid->send($email);
        $statusCode = $response->statusCode();
        
        if ($statusCode == 202) {
            error_log("Email sent successfully to $to");
            return true;
        } else {
            $body = $response->body();
            error_log("SendGrid Error ($statusCode): $body");
            return false;
        }
    } catch (Exception $e) {
        error_log('SendGrid exception: ' . $e->getMessage());
        return false;
    }
}
?>