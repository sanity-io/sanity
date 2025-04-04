import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock child_process.execSync which is used to get changed files
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

// Mock fs which is used to write output
vi.mock('node:fs', () => ({
  appendFileSync: vi.fn(),
}))

// Mock https which is used for GitHub API
vi.mock('node:https', () => ({
  request: vi.fn(() => ({
    on: vi.fn(),
    end: vi.fn(),
  })),
}))

// Mock test-mappings with a simplified version
vi.mock('../test-mappings.mjs', () => ({
  pathToTagMapping: [
    {
      paths: ['packages/sanity/src/core/comments/**'],
      tags: ['@comments'],
      testPaths: ['test/e2e/tests/comments'],
    },
    {
      paths: ['packages/sanity/src/core/releases/**'],
      tags: ['@releases'],
      testPaths: ['test/e2e/tests/releases'],
    },
  ],
  defaultTags: ['@smoke', '@core'],
}))

describe('get-test-tags', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
  })

  it('should correctly match simple patterns', async () => {
    // Import directly from the mts file
    const {matchesPattern} = await import('../get-test-tags.mts')

    // Test very basic patterns
    expect(matchesPattern('file.txt', 'file.txt')).toBe(true)
    expect(matchesPattern('file.txt', 'other.txt')).toBe(false)

    // Test simple glob pattern
    expect(matchesPattern('file.txt', '*.txt')).toBe(true)
    expect(matchesPattern('file.md', '*.txt')).toBe(false)

    // Test directory pattern (with trailing slash)
    expect(matchesPattern('dir/file.txt', 'dir/')).toBe(true)

    // Test ** pattern (multiple segments)
    expect(matchesPattern('dir/subdir/file.txt', 'dir/**')).toBe(true)
    expect(matchesPattern('other/file.txt', 'dir/**')).toBe(false)
  })

  it('should return empty arrays when no files match patterns', async () => {
    // Import child_process for mocking
    const {execSync} = await import('node:child_process')

    // Mock execSync to return files that don't match any patterns
    vi.mocked(execSync).mockReturnValue('README.md\nLICENSE.md')

    // Import the getTestSelectors function
    const {getTestSelectors} = await import('../get-test-tags.mts')

    // Get test selectors
    const selectors = await getTestSelectors()

    // Expect empty arrays for tags and test paths
    expect(selectors.tags).toEqual([])
    expect(selectors.testPaths).toEqual([])
  })

  it('should return tags and paths when files match patterns', async () => {
    // Import child_process for mocking
    const {execSync} = await import('node:child_process')

    // Mock execSync to return files that match the comments pattern
    vi.mocked(execSync).mockReturnValue('packages/sanity/src/core/comments/index.ts')

    // Import the getTestSelectors function
    const {getTestSelectors} = await import('../get-test-tags.mts')

    // Get test selectors
    const selectors = await getTestSelectors()

    // Expect comments tags and paths
    expect(selectors.tags).toEqual(['@comments'])
    expect(selectors.testPaths).toEqual(['test/e2e/tests/comments'])
  })

  it('should combine tags and paths when multiple patterns match', async () => {
    // Import child_process for mocking
    const {execSync} = await import('node:child_process')

    // Mock execSync to return files that match both comments and releases patterns
    vi.mocked(execSync).mockReturnValue(
      'packages/sanity/src/core/comments/index.ts\npackages/sanity/src/core/releases/tool/index.ts',
    )

    // Import the getTestSelectors function
    const {getTestSelectors} = await import('../get-test-tags.mts')

    // Get test selectors
    const selectors = await getTestSelectors()

    // Expect both comments and releases tags and paths
    expect(selectors.tags).toContain('@comments')
    expect(selectors.tags).toContain('@releases')
    expect(selectors.testPaths).toContain('test/e2e/tests/comments')
    expect(selectors.testPaths).toContain('test/e2e/tests/releases')
  })

  it('should return excludeTags array when no files match any patterns', async () => {
    // Import child_process for mocking
    const {execSync} = await import('node:child_process')

    // Mock execSync to return files that don't match any patterns
    vi.mocked(execSync).mockReturnValue('README.md\nLICENSE.md')

    // Import the getTestSelectors function
    const {getTestSelectors} = await import('../get-test-tags.mts')

    // Get test selectors
    const selectors = await getTestSelectors()

    // Should exclude specific tags
    expect(selectors.tags).toEqual([])
    expect(selectors.usingDefaults).toBe(true)
    expect(selectors.excludeTags).toContain('@comments')
    expect(selectors.excludeTags).toContain('@releases')

    // No specific test paths
    expect(selectors.testPaths).toEqual([])
  })
})
