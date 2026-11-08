<?php
declare(strict_types=1);

require_once __DIR__ . '/../common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$input = read_json_body();
$userId = filter_var($input['user_id'] ?? null, FILTER_VALIDATE_INT);
$studentNo = trim((string)($input['student_no'] ?? ''));
$title = trim((string)($input['title'] ?? ''));
$description = trim((string)($input['description'] ?? ''));
$deadline = !empty($input['deadline']) ? $input['deadline'] : null;
$priority = in_array($input['priority'] ?? '', ['low', 'medium', 'high']) ? $input['priority'] : 'medium';

if (!$userId && $studentNo === '') {
    respond(400, ['success' => false, 'message' => 'user_id or student_no is required.']);
}
if ($title === '') {
    respond(422, ['success' => false, 'message' => 'Task title is required.']);
}

try {
    $pdo = get_db_connection();

    // Find student
    if ($userId) {
        $stmt = $pdo->prepare('SELECT id, student_no FROM students WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
    } else {
        $stmt = $pdo->prepare('SELECT id, student_no FROM students WHERE student_no = :sno LIMIT 1');
        $stmt->execute(['sno' => $studentNo]);
    }
    $student = $stmt->fetch();
    $sId = $student ? (int)$student['id'] : ($userId ?? 1);
    $sNo = $student ? $student['student_no'] : ($studentNo !== '' ? $studentNo : '2026-0001');

    $proofUrl = null;
    $proofFile = null;

    if (!empty($input['proof_image'])) {
        $rawData = $input['proof_image'];
        $origName = !empty($input['proof_file_name']) ? preg_replace('/[^a-zA-Z0-9_\.-]/', '_', (string)$input['proof_file_name']) : '';

        if (str_starts_with($rawData, 'data:')) {
            $uploadsDir = dirname(__DIR__, 2) . '/uploads/tasks';
            if (!is_dir($uploadsDir)) {
                @mkdir($uploadsDir, 0777, true);
            }

            preg_match('/^data:([^;]+);base64,/', $rawData, $matches);
            $mime = $matches[1] ?? '';
            $parts = explode(',', $rawData, 2);
            $fileData = base64_decode($parts[1] ?? '');

            if ($fileData !== false) {
                $ext = 'bin';
                if ($origName && pathinfo($origName, PATHINFO_EXTENSION)) {
                    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                } elseif ($mime) {
                    $map = [
                        'image/jpeg' => 'jpg',
                        'image/jpg'  => 'jpg',
                        'image/png'  => 'png',
                        'image/gif'  => 'gif',
                        'image/webp' => 'webp',
                        'application/pdf' => 'pdf',
                        'application/msword' => 'doc',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                        'application/vnd.ms-excel' => 'xls',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
                        'application/zip' => 'zip',
                        'application/x-zip-compressed' => 'zip',
                        'text/plain' => 'txt',
                    ];
                    $ext = $map[$mime] ?? 'bin';
                }

                $fileName = 'task_proof_new_' . time() . '_' . mt_rand(100, 999) . '.' . $ext;
                file_put_contents($uploadsDir . '/' . $fileName, $fileData);
                $proofUrl = 'uploads/tasks/' . $fileName;
                $proofFile = $origName !== '' ? $origName : $fileName;
            }
        }
    }

    $ins = $pdo->prepare(
        "INSERT INTO tasks (user_id, student_no, title, description, deadline, priority, status, proof_url, proof_file)
         VALUES (:uid, :sno, :title, :desc, :deadline, :priority, 'pending', :proof_url, :proof_file)"
    );
    $ins->execute([
        'uid'        => $sId,
        'sno'        => $sNo,
        'title'      => $title,
        'desc'       => $description !== '' ? $description : null,
        'deadline'   => $deadline,
        'priority'   => $priority,
        'proof_url'  => $proofUrl,
        'proof_file' => $proofFile,
    ]);

    $newId = (int)$pdo->lastInsertId();
    $fetchTask = $pdo->prepare('SELECT * FROM tasks WHERE id = :id');
    $fetchTask->execute(['id' => $newId]);
    $created = $fetchTask->fetch();
    $created['id'] = (int)$created['id'];
    $created['user_id'] = (int)($created['user_id'] ?? $sId);

    respond(201, [
        'success' => true,
        'message' => 'Task created successfully.',
        'task'    => $created,
    ]);
} catch (PDOException $e) {
    respond(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

