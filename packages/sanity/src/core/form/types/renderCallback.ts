import {type ReactNode} from 'react'

import {type ObjectItemProps, type PrimitiveItemProps} from './itemProps'

export type {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderArrayOfPrimitivesItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
  RenderPreviewCallbackProps,
} from '@sanity/types'

/**
 * @hidden
 * @public */
export type RenderItemCallback = (
  itemProps: Omit<ObjectItemProps, 'renderDefault'> | Omit<PrimitiveItemProps, 'renderDefault'>,
) => ReactNode
