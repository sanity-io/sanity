// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {StateLink} from 'part:@sanity/base/router'
import createButtonLike from './createButtonLike'

export default createButtonLike(StateLink as any, {displayName: 'StateButton'})
