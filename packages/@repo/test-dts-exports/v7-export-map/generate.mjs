import {writeFileSync} from 'node:fs'

import {readExportMap, V7_EXPORT_MAP_PATH} from './exportMap.mjs'

writeFileSync(V7_EXPORT_MAP_PATH, `${JSON.stringify(readExportMap(), null, 2)}\n`)
