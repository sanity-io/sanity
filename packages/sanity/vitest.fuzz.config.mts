import baseConfig, {FUZZ_TESTS} from './vitest.config.mts'

// Fuzz tests run hundreds of cases and take minutes, so the regular unit test
// run leaves them out (see `vitest.config.mts`). This config runs only them,
// with the same setup. CI runs it from .github/workflows/fuzz-tests.yml.
export default {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: [FUZZ_TESTS],
    exclude: baseConfig.test?.exclude?.filter((pattern: string) => pattern !== FUZZ_TESTS),
    // The type tests already run with the regular unit tests.
    typecheck: {...baseConfig.test?.typecheck, enabled: false},
  },
}
