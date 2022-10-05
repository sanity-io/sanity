/**
 * Jest has a bug where it does not respect the project `testTimeout`:
 * https://github.com/facebook/jest/issues/9696
 *
 * To prevent having to redeclare a timeout for every single tests, we use this as a replacement
 * (we need a little more leeway on these CLI tests, they are quite slow)
 */

jest.setTimeout(30000) // 30s

export {}
