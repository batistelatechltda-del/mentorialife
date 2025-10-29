const Pusher = require("pusher");

const pusher = new Pusher({
    appId: "2024492",
    key: "a69d20cc06939b53e5c8",
    secret: "0190019c67816d3dbbd0",
    cluster: "ap2",
    useTLS: true
});

// Função para enviar evento de lembrete expirado
function sendReminderExpiredEvent(userId, message) {
    pusher.trigger('reminders-channel', 'reminder-expired', {
        userId: userId,
        message: message
    });
}

module.exports = { pusher, sendReminderExpiredEvent };