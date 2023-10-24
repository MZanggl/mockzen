const { injectDeps } = require('./ast')

function process (src, filename) {
  return { code: injectDeps(src) }
}

module.exports = { process }