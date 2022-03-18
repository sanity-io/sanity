import {T, Template, TemplateBuilder} from '@sanity/initial-value-templates'
import {Router, RouterState} from '@sanity/state-router'
import {AssetSource, Schema as SanitySchema, Schema} from '@sanity/types'
import React from 'react'
import {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderInputComponentMap,
  FormBuilderMarkersComponent,
  FormInputComponentResolver,
  FormPreviewComponentResolver,
} from '../form'
import {SanityPlugin} from '../plugin'
import {DocumentNodeResolver} from '../structure'
import {SanityTheme} from '../theme'

/**
 * @alpha
 */
export interface InitialValueTemplatesResolver {
  (_T: typeof T, options: {schema: Schema}): Array<Template | TemplateBuilder>
}

export type {SanitySchema}

/**
 * @alpha
 */
export interface SanityAuthConfig {
  mode?: 'append' | 'replace'
  redirectOnSingle?: boolean
  providers?: {
    name: string
    title: string
    url: string
    logo?: string
  }[]
}

/**
 * @alpha
 */

export interface SanityFormBuilderConfig {
  components?: {
    ArrayFunctions?: FormBuilderArrayFunctionComponent
    CustomMarkers?: FormBuilderCustomMarkersComponent
    Markers?: FormBuilderMarkersComponent
    inputs?: FormBuilderInputComponentMap
  }
  file?: {
    assetSources?: AssetSource[]
    directUploads?: boolean
  }
  image?: {
    assetSources?: AssetSource[]
    directUploads?: boolean
  }
  resolveInputComponent?: FormInputComponentResolver
  resolvePreviewComponent?: FormPreviewComponentResolver
}

/**
 * @alpha
 */
export interface SanityTool<Options = any> {
  component: React.ComponentType<{tool: SanityTool<Options>}>
  icon?: React.ComponentType
  name: string
  options: Options
  router?: Router
  title: string
  getIntentState?: (
    intent: string,
    params: Record<string, string>,
    routerState: RouterState | undefined,
    payload: unknown
  ) => unknown
  canHandleIntent?: (intent: string, params: Record<string, unknown>, payload: unknown) => boolean
}

/**
 * @alpha
 */
export interface SanitySourceConfig {
  projectId: string
  dataset: string
  name: string
  title: string
  initialValueTemplates?: Template[] | InitialValueTemplatesResolver
  schemaTypes?: any[]
  structureDocumentNode?: DocumentNodeResolver
}

/**
 * @alpha
 */
export interface SanityConfig {
  auth?: SanityAuthConfig
  formBuilder?: SanityFormBuilderConfig
  plugins?: SanityPlugin[]
  project?: {
    basePath?: string
    name?: string
    logo?: React.ComponentType<{'aria-label'?: string}>
  }
  /**
   * @alpha
   */
  __experimental_spaces?: SanitySpace[] // eslint-disable-line camelcase
  schemaTypes?: any[]
  sources?: SanitySourceConfig[]
  theme?: SanityTheme
  tools?: SanityTool[]
}

/**
 * @alpha
 */
export interface SanitySpace {
  name: string
  title: string
  default?: boolean
  api: SanitySourceConfig
}
