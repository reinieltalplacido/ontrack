<?php
declare(strict_types=1);

require_once __DIR__ . '/../../common.php';

$professorId = filter_input(INPUT_GET, 'professor_id', FILTER_VALIDATE_INT);
$section = trim((string)($_GET['section'] ?? ''));
$status = trim((string)($_GET['status'] ?? 'all'));
$reportType = trim((string)($_GET['report_type'] ?? 'all'));
$search = trim((string)($_GET['search'] ?? ''));

try {
    $pdo = get_db_connection();

    $where = [];
    $params = [];

    // Filter by assigned professor / coordinator or section
    if ($professorId && $section !== '' && $section !== 'all') {
        $where[] = '(r.professor_id = :pid OR r.course_section = :sec OR s.course_section = :sec2)';
        $params['pid'] = $professorId;
        $params['sec'] = $section;
        $params['sec2'] = $section;
    } elseif ($professorId) {
        $where[] = '(r.professor_id = :pid OR s.professor_id = :pid2)';
        $params['pid'] = $professorId;
        $params['pid2'] = $professorId;
    } elseif ($section !== '' && $section !== 'all') {
        $where[] = '(r.course_section = :sec OR s.course_section = :sec2)';
        $params['sec'] = $section;
        $params['sec2'] = $section;
    }

    if ($status !== '' && $status !== 'all') {
        $where[] = 'r.status = :status';
        $params['status'] = strtolower($status);
    }

    if ($reportType !== '' && $reportType !== 'all') {
        $where[] = 'r.report_type = :rtype';
        $params['rtype'] = $reportType;
    }

    if ($search !== '') {
        $where[] = '(r.student_name LIKE :q OR r.student_no LIKE :q2 OR r.report_title LIKE :q3 OR s.company_name LIKE :q4)';
        $param = '%' . $search . '%';
        $params['q'] = $param;
        $params['q2'] = $param;
        $params['q3'] = $param;
        $params['q4'] = $param;
    }

    $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "SELECT 
                r.*,
                COALESCE(s.company_name, 'Assigned Company') as student_company,
                s.email as student_email,
                s.required_hours,
                s.target_date
            FROM submitted_reports r
            LEFT JOIN students s ON r.user_id = s.id
            {$whereSql} 
            ORDER BY r.id DESC 
            LIMIT 150";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalReports = count($reports);
    $timeLogCount = 0;
    $summaryCount = 0;
    $pendingReview = 0;
    $approvedCount = 0;

    foreach ($reports as &$r) {
        $r['id'] = (int)$r['id'];
        $r['user_id'] = (int)$r['user_id'];
        $r['professor_id'] = $r['professor_id'] !== null ? (int)$r['professor_id'] : null;
        $r['total_hours'] = floatval($r['total_hours']);
        $r['total_days'] = intval($r['total_days']);
        $r['required_hours'] = floatval($r['required_hours'] ?? 500);

        if (!empty($r['report_data']) && is_string($r['report_data'])) {
            $r['report_details'] = json_decode($r['report_data'], true);
        } else {
            $r['report_details'] = null;
        }

        if ($r['report_type'] === 'Time Log') {
            $timeLogCount++;
        } else {
            $summaryCount++;
        }

        if ($r['status'] === 'submitted') {
            $pendingReview++;
        } elseif ($r['status'] === 'approved') {
            $approvedCount++;
        }
    }

    respond(200, [
        'success' => true,
        'count'   => $totalReports,
        'stats'   => [
            'total_reports'  => $totalReports,
            'time_log_count' => $timeLogCount,
            'summary_count'  => $summaryCount,
            'pending_review' => $pendingReview,
            'approved_count' => $approvedCount,
            'total'          => $totalReports,
            'time_log'       => $timeLogCount,
            'summary'        => $summaryCount,
            'submitted'      => $pendingReview,
            'approved'       => $approvedCount,
        ],
        'reports' => $reports,
    ]);
} catch (PDOException $e) {
    respond(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
