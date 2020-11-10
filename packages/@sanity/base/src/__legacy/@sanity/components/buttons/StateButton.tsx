import {StateLink} from 'part:@sanity/base/router'
import createButtonLike from './createButtonLike'

export default createButtonLike(StateLink as any, {displayName: 'StateButton'})
