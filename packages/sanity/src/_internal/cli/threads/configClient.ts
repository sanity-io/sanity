import {getCliClient} from '@sanity/cli'

import {getToken} from '../util/getToken'

// eslint-disable-next-line camelcase
getCliClient.__internal__getToken = getToken
