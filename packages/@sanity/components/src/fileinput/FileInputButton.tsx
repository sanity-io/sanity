import FileInput from 'part:@sanity/components/fileinput/default'
import createButtonLike from '../buttons/createButtonLike'

// @todo: fix typings
export default createButtonLike(FileInput as any, {displayName: 'FileInputButton'})
