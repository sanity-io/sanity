import {type SanityDocument} from '@sanity/types'

/**
 * @alpha
 */
export type MediaLibrary = {
  id: string
  organizationId: string
  status: 'active' | 'provisioning'
}

/**
 * Config for the Media Library Asset Source
 * @alpha
 */
export interface SanityMediaLibraryConfig {
  /**
   * Internal config for the plugin (will be populated by defaults if not explicitly set)
   * @internal
   */
  __internal: {
    /**
     * Whether the plugin is running in a local development environment against local Media Library app
     */
    isLocalDev: boolean
    /**
     * Whether to use the staging or production Media Library environment
     */
    env: 'staging' | 'production'
    /**
     * API version needed for using the Media Library API
     */
    apiVersion: string
    /**
     * The version of the plugin API to use (routes served by the Media Library app will be prefixed with this version)
     * @defaultValue 'v1'
     */
    pluginApiVersion: string
    /**
     * Base path for the Media Library app
     */
    appBasePath: string
    /**
     * Hosts that the plugin uses
     */
    hosts: {
      /**
       * Host for the CDN
       */
      cdn: string
      /**
       * Host for the Media Library app
       */
      app: string
      /**
       * Host for the Sanity API
       */
      api: string
    }
  }
}

export type AssetDialogAction = {
  type: 'delete' | 'close'
}

export interface AssetMenuAction {
  type: 'delete' | 'showUsage'
}

export type AssetType = 'image' | 'file'

/**
 * The type that is returned from the Media Library for an selected asset item
 * @internal
 */
export interface AssetSelectionItem {
  asset: {_id: string; _type: string}
  assetInstanceId: string
}

export type PluginPostMessageTokenRequest = {
  type: 'tokenRequest'
}

export type PluginPostMessageTokenResponse = {
  type: 'tokenResponse'
  token: string | null
}

/**
 * Message sent from a plugin page to notify the host that the page is loaded and ready to be interacted with
 */
export type PluginPostMessagePageLoaded = {
  type: 'pageLoaded'
  page: string
}

/**
 * Message sent from a plugin page that a page is unloaded by the user (for closing the dialog and similar)
 */
export type PluginPostMessagePageUnloaded = {
  type: 'pageUnloaded'
  page: string
}

/**
 * Message sent from the plugin that a document has been updated
 */
export type PluginPostMessageDocumentUpdate = {
  type: 'documentUpdate'
  document: SanityDocument | null
}

export type FileStatus = 'pending' | 'uploading' | 'complete' | 'error'

/**
 * Message sent from the plugin when files are uploading
 */
export type PluginPostMessageUploadFilesProgress = {
  type: 'uploadProgress'
  files: {id: string; status: FileStatus; progress: number; error?: Error}[]
}

/**
 * Message sent from the plugin that the user wants to upload files
 */
export type PluginPostMessageUploadFilesRequest = {
  type: 'uploadRequest'
  files: {id: string; file: File}[]
}

export type PluginPostMessageAbortUploadRequest = {
  type: 'abortUploadRequest'
  files?: {id: string}[]
}

export type PluginPostMessageAssetSelection = {
  type: 'assetSelection'
  selection: AssetSelectionItem[]
}

/**
 * Message sent from the app that the pending uploads are uploaded
 */
export type PluginPostMessageUploadFilesResponse = {
  type: 'uploadResponse'
  assets: AssetSelectionItem[]
}

export type PluginPostMessage =
  | PluginPostMessageTokenRequest
  | PluginPostMessageTokenResponse
  | PluginPostMessageAssetSelection
  | PluginPostMessagePageLoaded
  | PluginPostMessagePageUnloaded
  | PluginPostMessageUploadFilesRequest
  | PluginPostMessageAbortUploadRequest
  | PluginPostMessageUploadFilesProgress
  | PluginPostMessageUploadFilesResponse
  | PluginPostMessageDocumentUpdate
