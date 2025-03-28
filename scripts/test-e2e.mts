import path from 'node:path'

import cac from 'cac'
import execa from 'execa'

export const E2E_ANNOTATION_TAGS = {
  flake: '@flake',
  dragDrop: '@drag-drop',
  pte: '@pte',
  nightly: '@nightly',
}
export type E2E_ANNOTATION_TAG = (typeof E2E_ANNOTATION_TAGS)[keyof typeof E2E_ANNOTATION_TAGS]
const VALID_E2E_TAGS = Object.values(E2E_ANNOTATION_TAGS)

function validateE2ETags(tags: string): string[] {
  const tagList = tags.split(',')
  const invalidTags = tagList.filter((tag) => !VALID_E2E_TAGS.includes(tag as E2E_ANNOTATION_TAG))

  if (invalidTags.length > 0) {
    throw new Error(
      `Invalid tag(s): ${invalidTags.join(', ')}. Valid tags are: ${VALID_E2E_TAGS.join(', ')}`,
    )
  }

  return tagList
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

// Only run the CLI when this is the main entry point
// This prevents double execution when imported by Playwright
if (
  process.argv[1] === path.resolve(process.cwd(), 'scripts/test-e2e') ||
  process.argv[1].endsWith('/scripts/test-e2e')
) {
  const cli = cac('test-e2e')

  cli
    .option('--tag <tags>', 'Run tests with specific tags (comma-separated)')
    .option('--excludeTag <tags>', 'Run tests without specific tags (comma-separated)')
    .help()

  // Allow passing any other arguments directly to Playwright
  cli
    .command('[...args]', 'Additional arguments passed to Playwright')
    .allowUnknownOptions() // This is the key fix - allow unknown options like --project
    .action(async (args, options) => {
      const playwrightArgs: string[] = [...args]

      // Add all unknown options to the playwright args
      for (const [key, value] of Object.entries(options)) {
        if (key !== 'tag' && key !== 'excludeTag' && key !== '--') {
          // Handle boolean flags vs flags with values
          if (value === true) {
            playwrightArgs.push(`--${key}`)
          } else if (value !== false) {
            playwrightArgs.push(`--${key}`, String(value))
          }
        }
      }

      // Process include tags
      if (options.tag) {
        const tags = validateE2ETags(options.tag)
        playwrightArgs.push('--grep', tags.join('|'))
      }

      // Process exclude tags
      if (options.excludeTag) {
        const tags = validateE2ETags(options.excludeTag)
        playwrightArgs.push('--grep-invert', tags.join('|'))
      }

      console.log(`[running] playwright test ${playwrightArgs.join(' ')}`)

      try {
        await execa('npx', ['playwright', 'test', ...playwrightArgs], {stdio: 'inherit'})
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })

  cli.parse()
}
