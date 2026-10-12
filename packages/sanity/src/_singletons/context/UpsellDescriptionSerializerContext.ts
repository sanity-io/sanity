import {createContext} from 'sanity/_createContext'

import type {UpsellDescriptionSerializerContextValue} from '../../core/studio/upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'

/**
 * @internal
 */
export const UpsellDescriptionSerializerContext =
  createContext<UpsellDescriptionSerializerContextValue | null>(
    'sanity/_singletons/context/upsell-description-serializer',
    null,
  )
