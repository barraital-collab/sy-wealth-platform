/**
 * Task Routes
 */

const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET all tasks for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = getConnection();

        // Get available tasks
        const tasks = connection.all(`
            SELECT t.id, t.title, t.description, 
                   CASE WHEN ut.user_id IS NOT NULL THEN 1 ELSE 0 END as completed,
                   ut.completed_at
            FROM tasks t
            LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = ?
            WHERE t.active = 1
            ORDER BY t.id
        `, [userId]);

        res.json({
            success: true,
            tasks: tasks || []
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ success: false, message: 'Error fetching tasks' });
    }
});

// COMPLETE a task
router.post('/:taskId/complete', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const connection = getConnection();

        // Check if task exists
        const task = connection.get('SELECT id, title FROM tasks WHERE id = ?', [taskId]);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Check if already completed
        const existing = connection.get(
            'SELECT id FROM user_tasks WHERE user_id = ? AND task_id = ?',
            [userId, taskId]
        );

        if (existing) {
            return res.status(400).json({ success: false, message: 'Task already completed' });
        }

        // Mark task as completed
        connection.run(
            'INSERT INTO user_tasks (user_id, task_id, completed_at) VALUES (?, ?, datetime(\'now\'))',
            [userId, taskId]
        );

        res.json({
            success: true,
            message: `✅ ${task.title} complétée avec succès!`
        });
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ success: false, message: 'Error completing task' });
    }
});

// GET task completion status
router.get('/:taskId/status', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const connection = getConnection();

        const completion = connection.get(
            'SELECT completed_at FROM user_tasks WHERE user_id = ? AND task_id = ?',
            [userId, taskId]
        );

        res.json({
            success: true,
            completed: !!completion,
            completedAt: completion?.completed_at || null
        });
    } catch (error) {
        console.error('Get task status error:', error);
        res.status(500).json({ success: false, message: 'Error fetching task status' });
    }
});

module.exports = router;
