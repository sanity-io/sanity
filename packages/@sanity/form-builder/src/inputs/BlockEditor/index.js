import {setKeyGenerator} from 'slate'
import randomKey from './utils/randomKey'

// Set our own key generator for Slate (as early as possible)
const keyGenerator = () => randomKey(12)
setKeyGenerator(keyGenerator)

export {default} from './SyncWrapper'
