import {KeyUtils} from 'slate'
import {randomKey} from '@sanity/block-tools'

// Set our own key generator for Slate (as early as possible)
const keyGenerator = () => randomKey(12)
KeyUtils.setGenerator(keyGenerator)

export {default} from './SyncWrapper'
