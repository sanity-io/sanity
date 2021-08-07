// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import userStore from 'part:@sanity/base/user'
import {createUserColorManager} from './manager'

export const userColorManager = createUserColorManager({userStore})
