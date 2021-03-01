// Since we're not bundling this module in our internals,
// this warning will only appear if third-party developers have imported it

// eslint-disable-next-line no-console
console.warn(
  'Importing from `@sanity/components/lib/presence` is deprecated - please import from `@sanity/base/presence` instead'
)

export * from '../../../../presence'
