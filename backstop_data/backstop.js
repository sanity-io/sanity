/* eslint-disable import/no-commonjs, camelcase */
const DRONE = process.env.DRONE

const URL = DRONE ? 'https://backstop.sanity.studio' : 'http://host.docker.internal:5000'

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
      cookiePath: './backstop_data/engineScripts/cookies.json',
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
      cookiePath: './backstop_data/engineScripts/cookies.json',
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
      cookiePath: './backstop_data/engineScripts/cookies.json',
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
    bitmaps_reference: 'backstop_data/bitmapsReference',
    bitmaps_test: 'backstop_data/bitmapsTest',
    engine_scripts: 'backstop_data/engineScripts',
    html_report: 'backstop_data/htmlReport',
    ci_report: 'backstop_data/ciReport'
  },
  report: ['browser', 'CI'],
  engine: 'puppeteer',
  engineOptions: {
    args: ['--no-sandbox']
  },
  asyncCaptureLimit: 3,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false
}
