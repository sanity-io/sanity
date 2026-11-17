/**
 * Writes the DOM prop leak guard's vocabulary to a JSON file, for test runners that cannot read
 * the studio's `react-dom` themselves (Endform). Run it after `pnpm install` and before the suite.
 */
import {writeFileSync} from 'node:fs'

import {loadDomPropVocabulary, PREBUILT_VOCABULARY_PATH} from '../helpers/domPropLeaks/vocabulary'

writeFileSync(PREBUILT_VOCABULARY_PATH, `${JSON.stringify(loadDomPropVocabulary(), null, 2)}\n`)
