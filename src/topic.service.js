const { bot } = require("./bot");
const { getTopicIdByUserId, upsertUserTopic } = require("./db");

const SUPPORT_GROUP_ID = Number(process.env.SUPPORT_GROUP_ID);
if (!SUPPORT_GROUP_ID) throw new Error("SUPPORT_GROUP_ID is missing in .env");

function buildTopicTitle(from) {
  const uname = from?.username ? `@${from.username}` : null;
  const full = [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim();
  if (uname && full) return `${uname} - ${full}`;
  if (uname) return uname;
  if (full) return `${full} (${from.id})`;
  return `User ${from.id}`;
}

async function getOrCreateTopicId(from) {
  const userId = from.id;

  const existingTopicId = getTopicIdByUserId(userId);
  if (existingTopicId) return { topicId: existingTopicId, isNew: false };

  const title = buildTopicTitle(from);

  // Create Telegram forum topic
  const topic = await bot.createForumTopic(SUPPORT_GROUP_ID, title);

  // Save mapping
  upsertUserTopic({
    userId,
    topicId: topic.message_thread_id,
    username: from.username,
  });

  return { topicId: topic.message_thread_id, isNew: true };
}

module.exports = { getOrCreateTopicId };
