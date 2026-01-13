require("dotenv").config();
const express = require("express");
const { setupRouting } = require("./routing.service");

const app = express();

app.get("/", (req, res) => {
  res.send("Telegram Helpdesk Bot is running ✅");
});

setupRouting();

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
