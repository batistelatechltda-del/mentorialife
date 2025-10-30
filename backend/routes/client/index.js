const { Router } = require("express");
const router = Router();

const JournalRoutes = require("./journal/journal.routes");
const CalendarEventRoutes = require("./calendarEvent/calendarEvent.routes");
const ConversationRoutes = require("./conversation/conversation.routes");
const MessagesRoutes = require("./messages/messages.routes");
const ReminderRoutes = require("./reminder/reminder.routes");
const GoalRoutes = require("./goal/goal.routes");
const lifearemap = require("./lifearemap/lifearemap.route");
<<<<<<< HEAD

=======
const pushRoutes = require("./push/push.routes");

router.use("/push", pushRoutes);
>>>>>>> e4c5159c12e88163b4dd8120e876ee097583d32f
router.use("/life-areas", lifearemap);
router.use("/journal", JournalRoutes);
router.use("/calendar-event", CalendarEventRoutes);
router.use("/reminder", ReminderRoutes);
router.use("/goal", GoalRoutes);


router.use("/conversation", ConversationRoutes);
router.use("/messages", MessagesRoutes);

module.exports = router;
