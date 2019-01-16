/* eslint-disable import/no-commonjs, no-console */
module.exports = async (page, scenario, vp) => {
  console.enableLogging()
  console.log(`SCENARIO > ${scenario.label} (${vp.label}) ${scenario.url}`)
  await require('./clickAndHoverHelper')(page, scenario)
  console.disableLogging()
  // add more ready handlers here...
}
