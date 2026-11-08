<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

$section   = trim((string)($_GET['section'] ?? ''));
$course    = trim((string)($_GET['course'] ?? ''));
$college   = trim((string)($_GET['college'] ?? ''));
$yearLevel = intval($_GET['year_level'] ?? 4);

try {
    $pdo = get_db_connection();

    if ($section !== '' || $course !== '') {
        [$resolvedDept, $courseCode] = resolve_college_and_code($course, $college);
        $canonSec = compute_canonical_section($course, $section, $yearLevel);

        // Extract section letter (e.g. "4-A" -> "A")
        preg_match('/[A-Z0-9]+$/', strtoupper(trim($section)), $matches);
        $secLetter = !empty($matches) ? $matches[0] : 'A';
        $secEnd = '%-' . $secLetter;
        $courseSecPattern = $courseCode . ' %-' . $secLetter;

        // Priority 1: Exact match on canonical section (e.g. BSCE 4-A)
        $stmt = $pdo->prepare(
            'SELECT id, employee_id, full_name, email, department, role, assigned_section, contact_number 
             FROM professors 
             WHERE assigned_section = :exactSec 
             LIMIT 1'
        );
        $stmt->execute(['exactSec' => $canonSec]);
        $coordinator = $stmt->fetch();

        // Priority 2: Match by course code and section letter (e.g. BSCE 4-A or BSCE %-A)
        if (!$coordinator) {
            $stmt = $pdo->prepare(
                'SELECT id, employee_id, full_name, email, department, role, assigned_section, contact_number 
                 FROM professors 
                 WHERE assigned_section LIKE :courseSecPattern 
                 ORDER BY id ASC LIMIT 1'
            );
            $stmt->execute(['courseSecPattern' => $courseSecPattern]);
            $coordinator = $stmt->fetch();
        }

        // Priority 3: Match by college department and section letter (e.g. College of Engineering with section letter A)
        if (!$coordinator && $resolvedDept !== '') {
            $stmt = $pdo->prepare(
                'SELECT id, employee_id, full_name, email, department, role, assigned_section, contact_number 
                 FROM professors 
                 WHERE department = :dept AND assigned_section LIKE :secEnd 
                 ORDER BY id ASC LIMIT 1'
            );
            $stmt->execute(['dept' => $resolvedDept, 'secEnd' => $secEnd]);
            $coordinator = $stmt->fetch();
        }

        // Priority 4: Match any coordinator from the student\'s college department
        if (!$coordinator && $resolvedDept !== '') {
            $stmt = $pdo->prepare(
                'SELECT id, employee_id, full_name, email, department, role, assigned_section, contact_number 
                 FROM professors 
                 WHERE department = :dept 
                 ORDER BY id ASC LIMIT 1'
            );
            $stmt->execute(['dept' => $resolvedDept]);
            $coordinator = $stmt->fetch();
        }

        // Priority 5: Fallback to lead admin coordinator
        if (!$coordinator) {
            $fallbackStmt = $pdo->query('SELECT id, employee_id, full_name, email, department, role, assigned_section, contact_number FROM professors ORDER BY id ASC LIMIT 1');
            $coordinator = $fallbackStmt->fetch();
        }

        if ($coordinator) {
            respond(200, [
                'success'     => true,
                'found'       => true,
                'coordinator' => [
                    'id'               => (int)$coordinator['id'],
                    'employee_id'      => $coordinator['employee_id'],
                    'full_name'        => $coordinator['full_name'],
                    'email'            => $coordinator['email'],
                    'department'       => $coordinator['department'],
                    'role'             => $coordinator['role'],
                    'assigned_section' => $coordinator['assigned_section'] ?: $canonSec,
                    'contact_number'   => $coordinator['contact_number'],
                ],
                'canonical_section' => $canonSec,
                'course_code'       => $courseCode,
                'department'        => $resolvedDept,
            ]);
        }
    }

    // No section specified -> return all section-coordinator mappings
    $stmt = $pdo->query('SELECT id, employee_id, full_name, email, department, role, assigned_section, contact_number FROM professors ORDER BY assigned_section ASC');
    $all = $stmt->fetchAll();

    $coordinators = array_map(function ($row) {
        return [
            'id'               => (int)$row['id'],
            'employee_id'      => $row['employee_id'],
            'full_name'        => $row['full_name'],
            'email'            => $row['email'],
            'department'       => $row['department'],
            'role'             => $row['role'],
            'assigned_section' => $row['assigned_section'],
            'contact_number'   => $row['contact_number'],
        ];
    }, $all);

    respond(200, [
        'success'      => true,
        'count'        => count($coordinators),
        'coordinators' => $coordinators,
    ]);
} catch (PDOException $e) {
    respond(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
