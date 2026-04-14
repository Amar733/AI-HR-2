<?php
// api/contact.php

// CORS - adjust origin to your domain in production
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Quick OPTIONS response for preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==================== Config - set via environment or hardcode (not recommended) ====================
$smtpHost = getenv('SMTP_HOST') ?: 'mail.99 AI HR.com';
$smtpPort = getenv('SMTP_PORT') ?: 587;  // 587 (TLS) or 465 (SSL)
$smtpUser = getenv('SMTP_USER') ?: 'noreply@99 AI HR.com';
$smtpPass = getenv('SMTP_PASS') ?: 'your-smtp-password';
$smtpFrom = getenv('SMTP_FROM') ?: 'noreply@99 AI HR.com';
$smtpFromName = getenv('SMTP_FROM_NAME') ?: '99 AI HR Contact';
$toEmail = 'satyajit9830@gmail.com';  // where contact messages will be received

// ==================== Helpers ====================
function respond($success, $message = '', $httpCode = 200)
{
    http_response_code($httpCode);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function getClientIP()
{
    if (!empty($_SERVER['HTTP_CLIENT_IP']))
        return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR']))
        return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// ==================== Input parsing ====================
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    // also accept form-encoded fallback
    $data = $_POST;
}

// required fields
$firstName = trim($data['firstName'] ?? '');
$lastName = trim($data['lastName'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$company = trim($data['company'] ?? '');
$message = trim($data['message'] ?? '');

if (!$firstName || !$email || !$company || !$message) {
    respond(false, 'Required fields missing (firstName, email, company, message).', 422);
}

// validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Invalid email address.', 422);
}

// basic sanitization
$firstName = htmlspecialchars(strip_tags($firstName));
$lastName = htmlspecialchars(strip_tags($lastName));
$email = htmlspecialchars(strip_tags($email));
$phone = htmlspecialchars(strip_tags($phone));
$company = htmlspecialchars(strip_tags($company));
$message = htmlspecialchars(strip_tags($message));

// ==================== Send email via PHPMailer ====================
// Ensure PHPMailer is installed via Composer: `composer require phpmailer/phpmailer`
require __DIR__ . '/vendor/autoload.php';  // adjust path if needed

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

try {
    $mail = new PHPMailer(true);
    // SMTP config
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;

    // choose encryption based on port
    if ($smtpPort == 465) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // ssl
    } else {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;  // tls
    }
    $mail->Port = (int) $smtpPort;

    // sender & recipient
    $mail->setFrom($smtpFrom, $smtpFromName);
    $mail->addAddress($toEmail);
    $mail->addAddress('karptechno@gmail.com');

    // reply-to candidate email
    $mail->addReplyTo($email, $firstName . ($lastName ? ' ' . $lastName : ''));

    $subject = "New contact from website: {$firstName} {$lastName} ({$company})";
    $mail->Subject = $subject;

    // build a nice HTML body (and a plain-text fallback)
    $htmlBody = "
      <h2>New contact request</h2>
      <p><strong>Name:</strong> {$firstName} {$lastName}</p>
      <p><strong>Email:</strong> {$email}</p>
      <p><strong>Phone:</strong> {$phone}</p>
      <p><strong>Company:</strong> {$company}</p>
      <p><strong>Message:</strong><br/>" . nl2br($message) . '</p>
    ';
    $plainBody = "New contact request\n\nName: {$firstName} {$lastName}\nEmail: {$email}\nPhone: {$phone}\nCompany: {$company}\n\nMessage:\n{$message}";

    $mail->isHTML(true);
    $mail->Body = $htmlBody;
    $mail->AltBody = $plainBody;

    // send
    $mail->send();

    respond(true, 'Message sent successfully.');
} catch (Exception $ex) {
    // log server-side
    error_log('Contact mail error: ' . $ex->getMessage());
    respond(false, 'Failed to send message. Please try again later.', 500);
}
