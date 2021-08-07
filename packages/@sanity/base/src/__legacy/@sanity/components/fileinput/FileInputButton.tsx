// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import FileInput from 'part:@sanity/components/fileinput/default'
import createButtonLike from '../buttons/createButtonLike'

// @todo: fix typings
export default createButtonLike(FileInput as any, {displayName: 'FileInputButton'})
