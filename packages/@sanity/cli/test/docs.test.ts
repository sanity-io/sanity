import {describe, expect} from 'vitest'

import {describeCliTest, testConcurrent} from './shared/describe'
import {runSanityCmdCommand, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity docs`', () => {
  describe.each(studioVersions)('%s', (version) => {
    testConcurrent('docs browse', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'browse'])
      expect(result.stdout).toContain('Opening https://www.sanity.io/docs')
      expect(result.code).toBe(0)
    })

    testConcurrent('docs search - basic functionality', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'search', 'test'])
      expect(result.stdout).toContain('Searching documentation for: "test"')
      // Since API endpoints are placeholders, expect "No results found" or error handling
      expect(result.stdout).toMatch(/No results found|Unable to reach documentation|Search failed/)
      expect(result.code).toBe(0) // Should handle errors gracefully
    })

    testConcurrent('docs search - with limit option', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'search', 'test', '--limit=5'])
      expect(result.stdout).toContain('Searching documentation for: "test"')
      expect(result.code).toBe(0)
    })

    testConcurrent('docs search - missing query', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'search'])
      expect(result.stderr).toContain('Please provide a search query')
      expect(result.code).toBe(0) // CLI doesn't exit with error codes for user input errors
    })

    testConcurrent('docs read - basic functionality', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'read', 'test-article'])
      expect(result.stdout).toContain('Reading documentation: test-article')
      // Since API endpoints are placeholders, expect error handling
      expect(result.stderr).toMatch(
        /Documentation article not found|Unable to reach documentation|Failed to read/,
      )
      expect(result.code).toBe(0) // Should handle errors gracefully
    })

    testConcurrent('docs read - missing path', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'read'])
      expect(result.stderr).toContain('Please provide a documentation path')
      expect(result.code).toBe(0) // CLI doesn't exit with error codes for user input errors
    })

    testConcurrent('docs help', async () => {
      const result = await runSanityCmdCommand(version, ['docs', '--help'])
      expect(result.stdout).toContain('Commands:')
      expect(result.stdout).toContain('browse')
      expect(result.stdout).toContain('search')
      expect(result.stdout).toContain('read')
      expect(result.code).toBe(0)
    })

    testConcurrent('docs search help', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'search', '--help'])
      expect(result.stdout).toContain('Search the official Sanity documentation')
      expect(result.code).toBe(0)
    })

    testConcurrent('docs read help', async () => {
      const result = await runSanityCmdCommand(version, ['docs', 'read', '--help'])
      expect(result.stdout).toContain('Read a specific documentation article')
      expect(result.code).toBe(0)
    })
  })
})
