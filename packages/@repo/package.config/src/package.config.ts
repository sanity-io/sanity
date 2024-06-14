/* eslint-disable no-console */
import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  define: {
    __DEV__: false,
  },
  dist: 'lib',
  extract: {
    customTags: [
      {
        name: 'hidden',
        allowMultiple: true,
        syntaxKind: 'block',
      },
      {
        name: 'todo',
        allowMultiple: true,
        syntaxKind: 'block',
      },
    ],
    rules: {
      // Disable rules for now
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
  legacyExports: true,
  rollup: {
    optimizeLodash: true,
  },
  tsconfig: 'tsconfig.lib.json',
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'error',
  },
  // /*
  reactCompilerOptions: {
    // panicThreshold: 'NONE',
    logger: {
      logEvent(filename, event) {
        if (
          event.kind === 'CompileError' &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !ignore.has((event.detail as any)?.severity)
        ) {
          console.group(`[${filename}] ${event.kind}`)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const {reason, description, severity, loc, suggestions} = event.detail as any

          console.error(`[${severity}] ${reason}`)
          console.log(`${filename}:${loc.start?.line}:${loc.start?.column} ${description}`)
          console.log(suggestions)

          console.groupEnd()
        }
      },
    },
  },
  // */
})

const ignore = new Set(['CannotPreserveMemoization', 'Todo', 'InvalidReact'])
