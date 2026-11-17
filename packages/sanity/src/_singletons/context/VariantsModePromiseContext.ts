import {createContext} from 'react'

import type {VariantsMode} from '../../core/variants/contexts/mode/types'

/**
 * The variants mode as a promise for `use()`, provided by `VariantsStudioProvider`. Settles once
 * the content variants feature check has answered, so only the UI that tells upsell from default
 * waits for it.
 * @internal
 */
export const VariantsModePromiseContext = createContext<Promise<VariantsMode> | null>(null)
