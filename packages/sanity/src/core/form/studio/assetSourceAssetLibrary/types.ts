import {type SanityDocument} from '@sanity/types'

/**
 * Config for the Asset Library Asset Source
 * @alpha
 */
export interface SanityAssetLibraryConfig {
  /**
   * Internal config for the plugin (will be populated by defaults if not explicitly set)
   * @internal
   */
  __internal: {
    /**
     * Wether the plugin is running in a local development environment against local Asset Library app
     */
    isLocalDev: boolean
    /**
     * Wether to use the staging or production asset library environment
     */
    env: 'staging' | 'production'
    /**
     * API version needed for using the Asset Library API
     */
    apiVersion: string
    /**
     * The version of the plugin API to use (routes served by the Asset Library app will be prefixed with this version)
     * @defaultValue 'v1'
     */
    pluginApiVersion: string
    /**
     * Base path for the Asset Library app
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
       * Host for the Asset Library app
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
 * Simple version of the Asset Library's Asset type (only stuff that is needed for the plugin)
 * @internal
 */
export interface Asset {
  _id: string
  instanceId: string
  assetType: string
}

/**
 * The type that is returned from the Asset Library for an selected asset item
 * @internal
 */
export interface AssetSelectionItem {
  assetId: string
  assetType: string
  instanceId: string
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

/**
 * Message sent from the plugin that the user wants to upload files
 */
export type PluginPostMessageUploadFilesRequest = {
  type: 'uploadRequest'
  files: File[]
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
  assets: Asset[]
}

export type PluginPostMessage =
  | PluginPostMessageTokenRequest
  | PluginPostMessageTokenResponse
  | PluginPostMessageAssetSelection
  | PluginPostMessagePageLoaded
  | PluginPostMessagePageUnloaded
  | PluginPostMessageUploadFilesRequest
  | PluginPostMessageUploadFilesResponse
  | PluginPostMessageDocumentUpdate
