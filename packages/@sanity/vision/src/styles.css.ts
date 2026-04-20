import {globalStyle} from '@vanilla-extract/css'

/**
 * This file is created to verify that vision tool is loading the static css file when using auto updates.
 */
globalStyle('#sanity', {
  vars: {
    '--auto-updating-vision': 'true',
  },
})
