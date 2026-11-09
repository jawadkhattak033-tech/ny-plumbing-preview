<?php
/**
 * Service request handler for Hostinger (PHP mail()).
 * Receives every lead form on the site, emails it, keeps a CSV backup
 * one level above public_html, and redirects to /thank-you/.
 *
 * Settings come from contact-config.php, generated at build from
 * src/data/business.json. Nothing in this file needs editing per business.
 */
declare(strict_types=1);

$config = @include __DIR__ . '/contact-config.php';
if (!is_array($config) || empty($config['to'])) {
    http_response_code(500);
    exit('Form is not configured.');
}

function back(string $to): void {
    header('Location: ' . $to, true, 303);
    exit;
}
function field(string $key, int $max = 200): string {
    $v = isset($_POST[$key]) && is_string($_POST[$key]) ? trim($_POST[$key]) : '';
    $v = str_replace(["\r", "\n", "\0"], ' ', $v);   // no header injection
    return mb_substr(strip_tags($v), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    back('/contact/');
}

/* ---- Spam checks: honeypot, time trap, rate limit ---- */
if (!empty($_POST['company_website'])) {
    back($config['thankYou']);                      // bot: pretend success
}
$ts = (int)($_POST['form_ts'] ?? 0);
if ($ts > 0 && time() - $ts < 3) {
    back($config['thankYou']);                      // submitted faster than a human could
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile = sys_get_temp_dir() . '/lead_rl_' . md5($ip);
$hits = array_filter(explode(',', (string)@file_get_contents($rlFile)), fn($t) => (int)$t > time() - 600);
if (count($hits) >= 5) {
    http_response_code(429);
    exit('Too many requests. Please call ' . htmlspecialchars($config['phone']) . '.');
}
$hits[] = time();
@file_put_contents($rlFile, implode(',', $hits));

/* ---- Fields ---- */
$lead = [
    'Form'          => field('form_name', 40),
    'First name'    => field('first_name', 60),
    'Last name'     => field('last_name', 60),
    'Phone'         => field('phone', 30),
    'Email'         => field('email', 120),
    'Location'      => field('location', 80),
    'Customer type' => field('customer_type', 20),
    'Property type' => field('property_type', 60),
    'Units'         => field('units', 10),
    'Recurring'     => field('recurring', 40),
    'Service'       => field('service', 80),
    'Page'          => field('source_page', 200),
];
$message = isset($_POST['message']) && is_string($_POST['message'])
    ? mb_substr(trim(strip_tags($_POST['message'])), 0, 2000) : '';

if ($lead['First name'] === '' || !preg_match('/\d{7,}/', preg_replace('/\D/', '', $lead['Phone']))) {
    back('/contact/?error=missing');
}
$replyTo = filter_var($lead['Email'], FILTER_VALIDATE_EMAIL) ?: '';

/* ---- Email ---- */
$isCareer = $lead['Form'] === 'careers';
$subject = ($isCareer ? 'Job inquiry: ' : 'Service request: ')
    . ($lead['Service'] ?: 'General') . ' - ' . $lead['First name'] . ' ' . $lead['Last name'];

$body = ($isCareer ? "New job inquiry" : "New service request") . " from the {$config['business']} website\n\n";
foreach ($lead as $k => $v) {
    if ($v !== '') $body .= str_pad($k . ':', 16) . $v . "\n";
}
$body .= "\nMessage:\n" . ($message !== '' ? $message : '(none)') . "\n\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\nIP: {$ip}\n";

$from = 'no-reply@' . $config['fromDomain'];
$headers = [
    'From: ' . $config['business'] . ' Website <' . $from . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];
if ($replyTo) $headers[] = 'Reply-To: ' . $replyTo;

$sent = @mail($config['to'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . $from);

/* ---- Backup log outside the web root, so no lead is lost if mail fails ---- */
$log = dirname(__DIR__) . '/form-leads.csv';
if ($fh = @fopen($log, 'a')) {
    fputcsv($fh, array_merge([date('c'), $sent ? 'sent' : 'MAIL FAILED'], array_values($lead), [$message]), ',', '"', '\\');
    fclose($fh);
}

back($sent ? $config['thankYou'] : '/contact/?error=send');
