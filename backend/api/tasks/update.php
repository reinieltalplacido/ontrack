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

    if (!empty($input['proof_image'])) {
        $rawImage = $input['proof_image'];
        if (str_starts_with($rawImage, 'data:image')) {
            $uploadsDir = dirname(__DIR__, 2) . '/uploads/tasks';
            if (!is_dir($uploadsDir)) {
                @mkdir($uploadsDir, 0777, true);
            }
            $parts = explode(',', $rawImage, 2);
            $imgData = base64_decode($parts[1] ?? '');
            if ($imgData !== false) {
                $fileName = 'task_proof_' . $taskId . '_' . time() . '.jpg';
                file_put_contents($uploadsDir . '/' . $fileName, $imgData);
                $proofUrl = 'uploads/tasks/' . $fileName;
            } else {
                $proofUrl = $rawImage;
            }
        } else {
            $proofUrl = $rawImage;
        }
    }

    $stmt = $pdo->prepare(
        'UPDATE tasks SET title = :title, description = :desc, deadline = :deadline, priority = :priority, status = :status, proof_url = :proof WHERE id = :id'
    );
    $stmt->execute([
        'title'    => $title,
        'desc'     => $description,
        'deadline' => $deadline,
        'priority' => $priority,
        'status'   => $newStatus,
        'proof'    => $proofUrl,
        'id'       => $taskId,
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

