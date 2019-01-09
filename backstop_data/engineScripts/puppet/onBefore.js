/* eslint-disable import/no-commonjs, no-console */
;(function(original) {
  console.enableLogging = () => {
    console.log = original
  }
  console.disableLogging = () => {
    console.log = () => {}
  }
})(console.log)

module.exports = async (page, scenario, vp) => {
  await require('./loadCookies')(page, scenario)
}
