/* eslint-disable no-process-env */
export const isCi =
  process.env.CI || // Travis CI, CircleCI, Gitlab CI, Appveyor, CodeShip
  process.env.CONTINUOUS_INTEGRATION || // Travis CI
  process.env.BUILD_NUMBER // Jenkins, TeamCity
