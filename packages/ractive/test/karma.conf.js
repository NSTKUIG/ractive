const baseConf = require('../../karma.conf')

module.exports = function (config) {
  config.set(Object.assign({}, baseConf, {
    files: [
      { pattern: 'node_modules/simulant/dist/simulant.umd.js', nocache: true },
      { pattern: 'node_modules/qunit-assert-html/dist/qunit-assert-html.js', nocache: true },
      { pattern: 'dist/lib.umd.js', nocache: true },
      { pattern: 'tmp/test.iife.js', nocache: true },
      { pattern: 'qunit/*.gif', served: true, included: false, watched: false, nocache: false }
    ]
  }))
}
