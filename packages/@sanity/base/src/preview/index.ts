import observeFields from './observeFields'
import {createPathObserver} from './createPathObserver'
import {createPreviewObserver} from './createPreviewObserver'

export {default} from './components/SanityPreview'
export {default as SanityDefaultPreview} from './components/SanityDefaultPreview'
export {default as PreviewFields} from './components/PreviewFields'
export {default as SanityPreview} from './components/SanityPreview'
export {default as PreviewSubscriber} from './components/PreviewSubscriber'
export {default as WithVisibility} from './components/WithVisibility'

export {getPreviewPaths} from './utils/getPreviewPaths'
export {default as prepareForPreview} from './utils/prepareForPreview'

export const observePaths = createPathObserver(observeFields)
export const observeForPreview = createPreviewObserver(observePaths)
