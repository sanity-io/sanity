/* eslint-disable import/no-commonjs, camelcase, no-process-env */
const URL = 'http://host.docker.internal:5000'

const loggedInUserCookiePath = './test/backstop/engineScripts/cookies.json'

module.exports = {
  id: 'content_studio',
  viewports: [
    {
      label: 'desktop',
      width: 1200,
      height: 960
    },
    {
      label: 'tablet-landscape',
      width: 1024,
      height: 768
    },
    {
      label: 'tablet-portrait',
      width: 768,
      height: 1024
    },
    {
      label: 'mobile',
      width: 320,
      height: 650
    }
  ],
  onBeforeScript: 'puppet/onBefore.js',
  onReadyScript: 'puppet/onReady.js',
  scenarios: [
    {
      label: 'Login',
      url: URL,
      delay: 1000,
      readySelector: '[class^="LoginDialogContent_root"]',
      selectors: ['viewport'],
      selectorExpansion: true,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: 'Front',
      cookiePath: loggedInUserCookiePath,
      url: URL,
      delay: 1000,
      readySelector: '[class^="PaneItem_item"]',
      selectors: ['viewport'],
      selectorExpansion: true,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: 'Book pane',
      cookiePath: loggedInUserCookiePath,
      url: `${URL}/desk/book`,
      delay: 1000,
      readySelector: '[class^="PaneItem_item"]',
      selectors: ['viewport'],
      selectorExpansion: true,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: 'Book document',
      cookiePath: loggedInUserCookiePath,
      url: `${URL}/desk/book;c6b1208f-cd89-4a55-88f1-0b979e005f0a`,
      delay: 1000,
      readySelector: '[class^="Editor_root"]',
      selectors: ['viewport'],
      selectorExpansion: true,
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    }
  ],
  paths: {
    bitmaps_reference: 'test/backstop/bitmapsReference',
    bitmaps_test: 'test/backstop/bitmapsTest',
    engine_scripts: 'test/backstop/engineScripts',
    html_report: 'test/backstop/htmlReport',
    ci_report: 'test/backstop/ciReport'
  },
  report: process.env.CI ? ['browser', 'CI'] : ['browser'],
  engine: 'puppeteer',
  engineOptions: {
    args: ['--no-sandbox']
  },
  asyncCaptureLimit: 3,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false
}
