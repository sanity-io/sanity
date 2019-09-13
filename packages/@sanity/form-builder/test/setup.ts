import {KeyUtils} from 'slate'
import {randomKey} from '@sanity/block-tools'

KeyUtils.setGenerator(() => randomKey(12))
