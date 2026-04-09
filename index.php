<?php
session_start();

// Redirect to login if user is not authenticated
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Define strict user role
$userRole = $_SESSION['role'] ?? 'readonly';

// Route API requests directly to api.php
if (isset($_GET['api'])) {
    require __DIR__ . '/api.php';
    exit;
}

// Load the UI template (schema is no longer injected here)
include __DIR__ . '/templates/template.php';