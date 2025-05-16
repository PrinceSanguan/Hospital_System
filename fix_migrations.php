<?php

// This script manually removes the problematic migration from the migrations table
// without going through Laravel's migration system

// Include autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->boot();

// Get connection and check if the migration exists
$db = $app->make('db');
$migrationExists = $db->table('migrations')
    ->where('migration', '2024_05_12_142600_add_columns_to_doctor_schedules_table')
    ->exists();

if ($migrationExists) {
    // Remove the problematic migration from the migrations table
    $result = $db->table('migrations')
        ->where('migration', '2024_05_12_142600_add_columns_to_doctor_schedules_table')
        ->delete();

    echo "Migration '2024_05_12_142600_add_columns_to_doctor_schedules_table' " .
         ($result ? "removed successfully." : "could not be removed.");
} else {
    echo "Migration '2024_05_12_142600_add_columns_to_doctor_schedules_table' not found in migrations table.";
}

echo "\nDone.\n";
