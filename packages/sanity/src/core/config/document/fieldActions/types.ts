import {type Path, type SchemaType} from '@sanity/types'
import {type DocumentFieldActionGroup, type DocumentFieldActionItem} from 'sanity/_singleton'

import {type ComposableOption, type ConfigContext} from '../../types'

/**
 * @hidden
 * @beta */
export interface DocumentFieldAction {
  name: string
  useAction: DocumentFieldActionHook
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionHook {
  (props: DocumentFieldActionProps): DocumentFieldActionItem | DocumentFieldActionGroup
}

/**
 * @hidden
 * @beta */
export interface DocumentFieldActionProps {
  documentId: string
  documentType: string
  path: Path
  schemaType: SchemaType
}

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
