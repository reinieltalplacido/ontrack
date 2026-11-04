<?php
declare(strict_types=1);

// Update these values if your local or hosted MySQL configuration differs.
const DB_HOST = 'localhost';
const DB_NAME = 'ionic_students_api';
const DB_USER = 'root';
const DB_PASS = '';

function get_db_connection(): PDO
{
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';

    return new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
