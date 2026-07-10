declare module 'conventional-changelog-conventionalcommits' {
  import {type ParserStreamOptions} from 'conventional-commits-parser'

  /**
   * Minimal typing for the untyped `conventional-changelog-conventionalcommits`
   * preset — only the parts used by this package.
   */
  export default function createPreset(config?: unknown): Promise<{
    parser: ParserStreamOptions
    commits: unknown
    writer: unknown
    whatBump: unknown
  }>
}
