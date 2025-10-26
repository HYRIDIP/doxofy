const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const onlineTracker = require('../onlineTracker');

// Путь к базе данных
const dbPath = path.join(__dirname, '..', 'database', 'pastebin.db');

// Создание подключения к базе данных
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database for homepage.');
    }
});

/* GET home page. */
router.get('/', function(req, res, next) {
    const onlineCount = onlineTracker.getOnlineCount();
    
    // Получаем последние публикации
    const query = `
        SELECT p.*, u.username 
        FROM pastes p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE p.is_public = 1 
        ORDER BY p.created_at DESC 
        LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching recent pastes:', err.message);
            return res.status(500).render('pages/homepage', {
                title: 'Doxify - Home',
                recentPastes: [],
                onlineCount: onlineCount,
                error: 'Failed to load recent pastes'
            });
        }

        // Форматируем дату для каждого паста
        const recentPastes = rows.map(paste => {
            return {
                ...paste,
                created_at: new Date(paste.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                preview: paste.content.length > 150 ? paste.content.substring(0, 150) + '...' : paste.content
            };
        });

        // Получаем статистику
        db.get(`
            SELECT 
                COUNT(*) as totalPastes,
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM pastes WHERE created_at >= datetime('now', '-1 day')) as pastesToday
        `, [], (err, stats) => {
            if (err) {
                console.error('Error fetching stats:', err.message);
                stats = { totalPastes: 0, totalUsers: 0, pastesToday: 0 };
            }

            res.render('pages/homepage', {
                title: 'Doxify - Home',
                recentPastes: recentPastes,
                stats: stats,
                onlineCount: onlineCount,
                user: req.user || null,
                success: req.query.success,
                error: req.query.error
            });
        });
    });
});

/* GET about page. */
router.get('/about', function(req, res, next) {
    const onlineCount = onlineTracker.getOnlineCount();
    
    res.render('pages/homepage', {
        title: 'Doxify - About',
        onlineCount: onlineCount,
        user: req.user || null,
        section: 'about'
    });
});

/* GET features page. */
router.get('/features', function(req, res, next) {
    const onlineCount = onlineTracker.getOnlineCount();
    
    res.render('pages/homepage', {
        title: 'Doxify - Features',
        onlineCount: onlineCount,
        user: req.user || null,
        section: 'features'
    });
});

/* GET privacy page. */
router.get('/privacy', function(req, res, next) {
    const onlineCount = onlineTracker.getOnlineCount();
    
    res.render('pages/homepage', {
        title: 'Doxify - Privacy Policy',
        onlineCount: onlineCount,
        user: req.user || null,
        section: 'privacy'
    });
});

/* GET terms page. */
router.get('/terms', function(req, res, next) {
    const onlineCount = onlineTracker.getOnlineCount();
    
    res.render('pages/homepage', {
        title: 'Doxify - Terms of Service',
        onlineCount: onlineCount,
        user: req.user || null,
        section: 'terms'
    });
});

// Закрытие подключения к базе данных при завершении приложения
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

module.exports = router;
