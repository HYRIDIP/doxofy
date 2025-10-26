const connectedUsers = new Map();
const timeout = 15 * 60 * 1000; // 15 минут

function addUser(ip) {
    connectedUsers.set(ip, {
        ip: ip,
        lastSeen: Date.now()
    });
}

function removeUser(ip) {
    connectedUsers.delete(ip);
}

function updateUser(ip) {
    if (connectedUsers.has(ip)) {
        connectedUsers.get(ip).lastSeen = Date.now();
    } else {
        addUser(ip);
    }
}

function cleanupInactiveUsers() {
    const now = Date.now();
    for (const [ip, user] of connectedUsers.entries()) {
        if (now - user.lastSeen > timeout) {
            connectedUsers.delete(ip);
        }
    }
}

function getOnlineCount() {
    cleanupInactiveUsers();
    return connectedUsers.size;
}

function getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

// Очистка неактивных пользователей каждые 5 минут
setInterval(cleanupInactiveUsers, 5 * 60 * 1000);

module.exports = {
    addUser,
    removeUser,
    updateUser,
    getOnlineCount,
    getClientIP,
    connectedUsers
};
