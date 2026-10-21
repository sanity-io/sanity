// The structure resolver's path array always starts with the root structure
// node's id, which never appears in a browser URL - the URL only encodes
// panes from the first router pane group onward. Dropping the first segment
// keeps a soft-nav registry key in the same form softNavRoute.ts derives from
// a real navigationURL, without assuming the root id is any particular string
// (a custom structure can rename it).

/** @internal */
export function toRegistryPath(resolverPath: string): string {
  return resolverPath.split(';').slice(1).join(';')
}
