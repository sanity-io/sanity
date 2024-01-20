// eslint-disable-next-line import/no-unassigned-import
import '@jest/expect'

declare module '@jest/expect' {
  interface Matchers<R extends void | Promise<void>> {
    /**
     * Used to check that a JavaScript object matches a subset of the properties of an object
     *
     * Works around an issue that surfaced after moving from jest types provided by `@types/jest` to the ones provided by `@jest/globals`
     * The `toMatchObject` typing from `@types/jest` allows for any value to be passed as the expected value, but the one from
     * `@jest/globals`, which comes from the types defined in the `expect` package, is stricter, only allowing for records or arrays of records
     * and doesn't allow arrays of arrays, for example.
     *
     * For comparison:
     * - `@types/jest`: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b0a62b6f70772fc34ef27affdcfc350ae7556916/types/jest/index.d.ts#L1078C9-L1078C61
     * - `@jest/globals`/`expect`: https://github.com/jestjs/jest/blob/2178fa2183cb7cb2ac3e262388499bafd032ef03/packages/expect/src/types.ts#L299
     *
     */
    toMatchObject(expected: object): R
  }
}
