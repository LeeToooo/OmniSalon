// Gom các api chat trực tuyến
const handleChatRoutes = require('./chat.routes');

async function handleChatDomain(req, res, ctx) {
  if (await handleChatRoutes(req, res, ctx)) return true;
  return false;
}

module.exports = handleChatDomain;
module.exports.handleChatDomain = handleChatDomain;
module.exports.default = handleChatDomain;

