// Gom các api của phần ai
const handleAiRoutes = require('./ai.routes');

async function handleAiDomain(req, res, ctx) {
  return await handleAiRoutes(req, res, ctx);
}

module.exports = handleAiDomain;
module.exports.handleAiDomain = handleAiDomain;
module.exports.default = handleAiDomain;

