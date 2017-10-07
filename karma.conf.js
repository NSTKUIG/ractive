module.exports = {
  customContextFile: '../../karma/context.html',
  customDebugFile: '../../karma/context.html',
  singleRun: false,
  plugins: ['karma-qunit', 'karma-failed-reporter', 'karma-phantomjs-launcher'],
  frameworks: ['qunit'],
  reporters: ['failed'],
  browsers: ['PhantomJS'],
  client: { captureConsole: false }
}
