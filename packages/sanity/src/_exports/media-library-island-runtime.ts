// The island-mount runtime for Media Library config apps — a dedicated entry
// (not part of `sanity/media-library`) so the workbench CLI's generated
// `./island-runtime` federation expose pulls only the runtime, never the
// Studio-facing media-library plugin barrel.
export {type IslandHandle, mountIsland} from '../media-library/island-runtime/islandRuntime'
