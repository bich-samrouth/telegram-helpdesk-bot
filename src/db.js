const Database = require("better-sqlite3");
const fs = require("fs");

fs.mkdirSync("data", { recursive: true });

const db = new Database("data/helpdesk.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS user_topics (
    user_id TEXT PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME
  )
`).run();

function getTopicIdByUserId(userId) {
  const row = db
    .prepare("SELECT topic_id FROM user_topics WHERE user_id = ?")
    .get(String(userId));
  return row?.topic_id ?? null;
}

function getUserIdByTopicId(topicId) {
  const row = db
    .prepare("SELECT user_id FROM user_topics WHERE topic_id = ?")
    .get(topicId);
  return row?.user_id ?? null;
}

function upsertUserTopic({ userId, topicId, username }) {
  db.prepare(`
    INSERT INTO user_topics (user_id, topic_id, username, last_message_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      topic_id = excluded.topic_id,
      username = excluded.username,
      last_message_at = CURRENT_TIMESTAMP
  `).run(String(userId), topicId, username ?? null);
}

function touchUser(userId) {
  db.prepare(`
    UPDATE user_topics
    SET last_message_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(String(userId));
}

module.exports = {
  db,
  getTopicIdByUserId,
  getUserIdByTopicId,
  upsertUserTopic,
  touchUser,
};
