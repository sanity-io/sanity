import {createContext} from 'react'

import type {UpsellDescriptionSerializerContextValue} from '../../core/studio/upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'

/**
 * @internal
 */
export const UpsellDescriptionSerializerContext =
  createContext<UpsellDescriptionSerializerContextValue | null>(null)
