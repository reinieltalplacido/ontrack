<?php
declare(strict_types=1);

require_once __DIR__ . '/../common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$input = read_json_body();
$taskId = filter_var($input['task_id'] ?? ($input['id'] ?? null), FILTER_VALIDATE_INT);
$status = $input['status'] ?? null;

if (!$taskId) {
    respond(400, ['success' => false, 'message' => 'Valid task_id is required.']);
}

try {
    $pdo = get_db_connection();

    $check = $pdo->prepare('SELECT * FROM tasks WHERE id = :id LIMIT 1');
    $check->execute(['id' => $taskId]);
    $existing = $check->fetch();

    if (!$existing) {
        respond(404, ['success' => false, 'message' => 'Task not found.']);
    }

    $title       = trim((string)($input['title'] ?? $existing['title']));
    $description = isset($input['description']) ? trim((string)$input['description']) : $existing['description'];
    $deadline    = isset($input['deadline']) ? (!empty($input['deadline']) ? $input['deadline'] : null) : $existing['deadline'];
    $priority    = in_array($input['priority'] ?? '', ['low', 'medium', 'high']) ? $input['priority'] : $existing['priority'];
    $newStatus   = in_array($status, ['pending', 'in_progress', 'completed']) ? $status : $existing['status'];
    $proofUrl    = isset($input['proof_url']) ? trim((string)$input['proof_url']) : ($existing['proof_url'] ?? null);
    $proofFile   = isset($input['proof_file']) ? trim((string)$input['proof_file']) : ($existing['proof_file'] ?? null);

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

                $fileName = 'task_proof_' . $taskId . '_' . time() . '.' . $ext;
                file_put_contents($uploadsDir . '/' . $fileName, $fileData);
                $proofUrl = 'uploads/tasks/' . $fileName;
                $proofFile = $origName !== '' ? $origName : $fileName;
            } else {
                $proofUrl = $rawData;
                $proofFile = $origName !== '' ? $origName : ('task_proof_' . $taskId . '.bin');
            }
        } else {
            $proofUrl = $rawData;
            $proofFile = $origName !== '' ? $origName : basename($rawData);
        }
    } elseif ($proofUrl && empty($proofFile)) {
        $proofFile = basename($proofUrl);
    }

    $stmt = $pdo->prepare(
        'UPDATE tasks SET title = :title, description = :desc, deadline = :deadline, priority = :priority, status = :status, proof_url = :proof, proof_file = :proof_file WHERE id = :id'
    );
    $stmt->execute([
        'title'      => $title,
        'desc'       => $description,
        'deadline'   => $deadline,
        'priority'   => $priority,
        'status'     => $newStatus,
        'proof'      => $proofUrl,
        'proof_file' => $proofFile,
        'id'         => $taskId,
    ]);

    $tStmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id');
    $tStmt->execute(['id' => $taskId]);
    $updated = $tStmt->fetch();
    $updated['id'] = (int)$updated['id'];
    $updated['user_id'] = (int)($updated['user_id'] ?? 0);

    respond(200, [
        'success' => true,
        'message' => 'Task updated successfully.',
        'task'    => $updated,
    ]);
} catch (PDOException $e) {
    respond(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

