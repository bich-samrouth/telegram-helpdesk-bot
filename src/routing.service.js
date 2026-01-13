const { bot } = require("./bot");
const { getOrCreateTopicId } = require("./topic.service");
const { getUserIdByTopicId, touchUser } = require("./db");

const SUPPORT_GROUP_ID = Number(process.env.SUPPORT_GROUP_ID);
if (!SUPPORT_GROUP_ID) throw new Error("SUPPORT_GROUP_ID is missing in .env");

let BOT_ID = null;

// Get bot id once
bot.getMe().then((me) => {
  BOT_ID = me.id;
  console.log("Bot started as:", me.username, me.id);
});

function isPrivateChat(msg) {
  return msg?.chat?.type === "private";
}

function isSupportGroup(msg) {
  return msg?.chat?.id === SUPPORT_GROUP_ID && msg?.chat?.type === "supergroup";
}

function hasTopic(msg) {
  return typeof msg?.message_thread_id === "number";
}

function isFromBot(msg) {
  if (BOT_ID && msg?.from?.id === BOT_ID) return true;
  return Boolean(msg?.from?.is_bot);
}

// Send a helpful header into the topic so supporters can see who the user is.
async function sendUserHeaderToTopic(topicId, from) {
  const uname = from?.username ? `@${from.username}` : "(no username)";
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(" ").trim() || "(no name)";
  const header = `User: ${name}\nUsername: ${uname}\nUser ID: ${from.id}`;

  await bot.sendMessage(SUPPORT_GROUP_ID, header, {
    message_thread_id: topicId,
  });
}

// Copy message into group topic (no "forwarded from", keeps things clean)
async function copyUserMessageToTopic(topicId, msg) {
  // Text-only
  if (msg.text) {
    await bot.sendMessage(SUPPORT_GROUP_ID, msg.text, {
      message_thread_id: topicId,
    });
    return;
  }

  // Media / others: copy the original message
  await bot.copyMessage(SUPPORT_GROUP_ID, msg.chat.id, msg.message_id, {
    message_thread_id: topicId,
  });
}

// Copy agent message back to user (anonymous)
async function copyAgentMessageToUser(userId, msg) {
  // If it's text
  if (msg.text) {
    await bot.sendMessage(userId, msg.text);
    return;
  }

  // If it's media / other types, copy it
  await bot.copyMessage(userId, msg.chat.id, msg.message_id);
}

function shouldIgnoreSupportMessage(msg) {
  // Ignore bot messages in the support group (avoid loops)
  if (isFromBot(msg)) return true;

  // Ignore messages without topic
  if (!hasTopic(msg)) return true;

  // Optional: ignore service messages (like topic created)
  if (msg.new_chat_members || msg.left_chat_member) return true;

  return false;
}

function setupRouting() {
  // /start
  bot.onText(/^\/start$/, async (msg) => {
    if (!isPrivateChat(msg)) return;
    await bot.sendMessage(
      msg.chat.id,
      "Hi! Send your question here and our support team will reply."
    );
  });

  // A) USER DM -> SUPPORT TOPIC
  bot.on("message", async (msg) => {
    try {
      if (!isPrivateChat(msg)) return;
      if (!msg.from) return;
      if (msg.text?.startsWith("/")) return;

      const { topicId, isNew } = await getOrCreateTopicId(msg.from);

      if (isNew) {
        await sendUserHeaderToTopic(topicId, msg.from);
      }

      await copyUserMessageToTopic(topicId, msg);

      touchUser(msg.from.id);
    } catch (err) {
      console.error("Error routing private->group:", err);
      try {
        await bot.sendMessage(msg.chat.id, "Sorry, something went wrong. Please try again.");
      } catch {}
    }
  });

  // B) SUPPORT TOPIC -> USER DM
  bot.on("message", async (msg) => {
    try {
      if (!isSupportGroup(msg)) return;
      if (shouldIgnoreSupportMessage(msg)) return;

      const topicId = msg.message_thread_id;
      const userId = getUserIdByTopicId(topicId);

      if (!userId) {
        // Topic exists but we don't have mapping (db wiped, etc.)
        await bot.sendMessage(SUPPORT_GROUP_ID, "No user mapping found for this topic.", {
          message_thread_id: topicId,
        });
        return;
      }

      await copyAgentMessageToUser(userId, msg);
    } catch (err) {
      console.error("Error routing group->private:", err);
    }
  });
}

module.exports = { setupRouting };
