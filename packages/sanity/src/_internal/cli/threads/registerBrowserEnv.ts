import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

mockBrowserEnvironment(process.env.SANITY_BASE_PATH || process.cwd())
