// `Options` and `Parser` are part of this entry's published type surface: `@sanity/migrate` imports
// `Parser` from it in its own `.d.ts`, so dropping them breaks that package under `skipLibCheck: false`
export {createSafeJsonParser, type Options, type Parser} from '../createSafeJsonParser'
