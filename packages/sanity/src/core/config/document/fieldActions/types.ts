import {type DocumentFieldAction, type SchemaType} from '@sanity/types'

import {type ComposableOption, type ConfigContext} from '../../types'

export type {
  DocumentFieldAction,
  DocumentFieldActionDivider,
  DocumentFieldActionGroup,
  DocumentFieldActionHook,
  DocumentFieldActionItem,
  DocumentFieldActionNode,
  DocumentFieldActionProps,
  DocumentFieldActionStatus,
  DocumentFieldActionTone,
} from '@sanity/types'

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionsResolverContext extends ConfigContext {
  documentId: string
  documentType: string
  schemaType: SchemaType
}

/**
 * @hidden
 * @beta */
export type DocumentFieldActionsResolver = ComposableOption<
  DocumentFieldAction[],
  DocumentFieldActionsResolverContext
>
