import {type BaseSchemaDefinition, type ObjectSchemaType, type PluginOptions} from 'sanity'

/**
 * Config for the Sanity Asset Plugin
 * @alpha
 */
export interface SanityAssetLibraryPluginConfig {
  /**
   * Internal config for the plugin (will be populated by defaults if not explicitly set)
   * @internal
   */
  __internal?: {
    /**
     * Wether the plugin is running in a local development environment against local Asset Library app
     */
    isLocalDev?: boolean
    /**
     * Wether to use the staging or production asset library environment
     */
    env?: 'staging' | 'production'
    /**
     * API version needed for using the Asset Library API
     */
    apiVersion?: string
    /**
     * The version of the plugin API to use (routes served by the Asset Library app will be prefixed with this version)
     * @defaultValue 'v1'
     */
    pluginApiVersion?: string
    /**
     * Base path for the Asset Library app
     */
    appBasePath?: string
    /**
     * Hosts that the plugin uses
     */
    hosts?: {
      /**
       * Host for the CDN
       */
      cdn?: string
      /**
       * Host for the Asset Library app
       */
      app?: string
      /**
       * Host for the Sanity API
       */
      api?: string
    }
  }
}

/**
 * Resolved config for the Sanity Asset Plugin. This is the config that is used internally by the plugin with required defaults applied.
 * @alpha
 */
export interface ResolvedSanityAssetLibraryPluginConfig
  extends SanityAssetLibraryPluginConfig,
    PluginOptions {
  name: 'sanity-asset-library-plugin'
  // __internal: SanityAssetLibraryPluginConfig['__internal'] & {
  //   apiVersion: string
  //   appBasePath: string
  //   hosts: {app: string; api: string; cdn: string}
  //   pluginApiVersion: string
  // }
}

/**
 * The value of a Asset-Library-asset in a local dataset
 *
 * @alpha
 */
export interface SanityAssetLibraryAssetValue {
  // _type: 'sanity.asset-library.asset'
  // assetId: string
  // assetType: string
  // versionId: string
  // libraryId: string
  // /**
  //  * URL to the asset (version)
  //  */
  // url: string
  // asset: {
  //   _ref: string
  // }
  _ref: string // To usage document
}

export interface SanityAssetUsageDocumentValue {
  _type: 'sanity.asset-usage.document'
  _id: string
  asset: {_ref: string} // Either version or container
  [key: string]: unknown
}

export type AssetType = 'image' | 'file' | 'video'

export interface AssetLibraryAssetSchemaTypeDefinition extends BaseSchemaDefinition {
  type: 'sanity.asset-library.asset'
  options: {libraryId: string; assetType: AssetType}
}

export interface AssetLibraryAssetSchemaType extends ObjectSchemaType {
  options: {libraryId: string; assetType: AssetType}
}
