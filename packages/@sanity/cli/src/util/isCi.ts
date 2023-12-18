/* eslint-disable no-process-env */
import {isTrueish} from './isTrueish'

export const isCi =
  isTrueish(process.env.CI) || // Travis CI, CircleCI, Gitlab CI, Appveyor, CodeShip
  isTrueish(process.env.CONTINUOUS_INTEGRATION) || // Travis CI
  process.env.BUILD_NUMBER // Jenkins, TeamCity
