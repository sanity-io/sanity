import execa from 'execa'

export const E2E_ANNOTATION_TAGS = {
  flake: '@flake',
  dragDrop: '@drag-drop',
  pte: '@pte',
}
export type E2E_ANNOTATION_TAG = (typeof E2E_ANNOTATION_TAGS)[keyof typeof E2E_ANNOTATION_TAGS]
const VALID_E2E_TAGS = Object.values(E2E_ANNOTATION_TAGS)

function validateE2ETags(tags: string): string {
  const tagList = tags.split(',')
  const invalidTags = tagList.filter((tag) => !VALID_E2E_TAGS.includes(tag as E2E_ANNOTATION_TAG))

  if (invalidTags.length > 0) {
    throw new Error(
      `Invalid tag(s): ${invalidTags.join(', ')}. Valid tags are: ${VALID_E2E_TAGS.join(', ')}`,
    )
  }

  return tags
}

/**
 * @example
 * Run E2E tests with specific tags:
 *
 * ```bash
 * // Run tests with the "@flake" tag
 * pnpm test:e2e --tag "@flake"
 *
 * // Run tests without the "@pte" tag
 * pnpm test:e2e --excludeTag "@pte"
 *
 * // Run tests with the @flake and @drag-drop tags
 * pnpm test:e2e --tag @flake,@drag-drop
 *
 * // Run tests without the @flake, @drag-drop, and @pte tags
 * pnpm test:e2e --excludeTag @flake,@drag-drop,@pte
 * ```
 */
function processE2EArgs(args: string[]): string[] {
  // Define the tag types with their prefix and whether they should invert the grep
  const TAG_TYPES = [
    {name: 'include', flag: '--tag', useGrepInvert: false},
    {name: 'exclude', flag: '--excludeTag', useGrepInvert: true},
  ]

  function createGrepArgs(tagValue: string, useInvert = false): string[] {
    const grepFlag = useInvert ? '--grep-invert' : '--grep'
    const grepPattern = validateE2ETags(tagValue).split(',').join('|')
    return [grepFlag, grepPattern]
  }

  const tagHandlers = TAG_TYPES.map((tagType) => ({
    flag: tagType.flag,
    match: (arg: string, next: string | null) => arg === tagType.flag && next !== null,
    process: (arg: string, next: string) => ({
      args: createGrepArgs(next, tagType.useGrepInvert),
      skipNext: true, // Skip the next argument since we've consumed it
    }),
  }))

  return ['test'].concat(
    args.reduce<{processedArgs: string[]; indexesToSkip: number[]}>(
      (result, arg, index, array) => {
        if (result.indexesToSkip.includes(index)) {
          return result
        }

        // Get the next argument if it exists, or null if we're at the end of the args array
        // This lets us handle flags that consume their value from the next argument
        const nextArg = index + 1 < array.length ? array[index + 1] : null
        const handler = tagHandlers.find((tagHandler) => tagHandler.match(arg, nextArg))

        if (handler && nextArg) {
          const processed = handler.process(arg, nextArg)
          return {
            processedArgs: [...result.processedArgs, ...processed.args],
            indexesToSkip: processed.skipNext
              ? [...result.indexesToSkip, index + 1]
              : result.indexesToSkip,
          }
        }

        return {
          processedArgs: [...result.processedArgs, arg],
          indexesToSkip: result.indexesToSkip,
        }
      },
      {processedArgs: [], indexesToSkip: []},
    ).processedArgs,
  )
}

const playwrightArgs = processE2EArgs(process.argv.slice(2))

console.log(`[running] playwright ${playwrightArgs.join(' ')}`)

execa('npx', ['playwright', ...playwrightArgs], {stdio: 'inherit'}).catch((error) => {
  console.error(error)
  process.exit(1)
})
