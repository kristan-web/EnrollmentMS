<?php
require_once __DIR__ . '/mail.php';

// Test email
$to = 'kristancharles67@gmail.com'; // Change to your email
$name = 'Test User';
$referenceNumber = 'TEST-2026-0001';

echo "Testing email sending...\n";

// Test approval email
if (sendApplicationApproved($to, $name, $referenceNumber)) {
    echo "✅ Email sent successfully!\n";
} else {
    echo "❌ Failed to send email.\n";
}
?>