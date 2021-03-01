import userStore from 'part:@sanity/base/user'
import {createUserColorManager} from './manager'

export const userColorManager = createUserColorManager({userStore})
