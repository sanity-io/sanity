import {execSync} from 'node:child_process'

import {isGlob} from 'globby'

import {pathToTagMapping} from './test-mappings.mjs'

function getChangedFiles() {
  try {
    // For PRs, compare with base branch
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      const baseSha = process.env.GITHUB_BASE_REF
      return execSync(`git diff --name-only origin/${baseSha}...HEAD`, {encoding: 'utf-8'})
        .trim()
        .split('\n')
        .filter(Boolean)
    }
    // For push events, get last commit changes
    else if (process.env.GITHUB_EVENT_NAME === 'push') {
      return execSync('git diff --name-only HEAD~1 HEAD', {encoding: 'utf-8'})
        .trim()
        .split('\n')
        .filter(Boolean)
    }
    // Fallback - run all tests
    return []
  } catch (error) {
    console.error('Error getting changed files:', error)
    return []
  }
}

// Simple pattern matcher that handles basic glob patterns with * and **
function matchesPattern(filePath, pattern) {
  // Handle exact matches first
  if (!isGlob(pattern)) {
    // For directory patterns (ending with /)
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern) || filePath === pattern.slice(0, -1)
    }
    // For exact file matches
    return filePath === pattern
  }

  // For glob patterns, we'll use a simple regex-based solution
  const regexPattern = pattern
    // Escape all regex special chars except * and /
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Replace ** with a placeholder for any characters including /
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    // Replace * with a placeholder for any characters except /
    .replace(/\*/g, '[^/]*')
    // Restore ** placeholders to match any characters including /
    .replace(/__DOUBLE_STAR__/g, '.*')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(filePath)
}

function getTestSelectors() {
  const changedFiles = getChangedFiles()
  console.log('Changed files:', changedFiles)

  // Log matches for debugging
  const matchedPaths = []

  const tagsToRun = new Set()
  const testPathsToRun = new Set()

  // Check each changed file against path patterns
  if (changedFiles.length > 0) {
    changedFiles.forEach((file) => {
      pathToTagMapping.forEach((mapping) => {
        const matches = mapping.paths.some((pattern) => matchesPattern(file, pattern))
        if (matches) {
          if (mapping.tags) {
            mapping.tags.forEach((tag) => tagsToRun.add(tag))
          }
          if (mapping.testPaths) {
            mapping.testPaths.forEach((testPath) => testPathsToRun.add(testPath))
          }
          matchedPaths.push({
            file,
            pattern: mapping.paths,
            tags: mapping.tags,
            testPaths: mapping.testPaths,
          })
        }
      })
    })
  }

  console.log('File pattern matches:', matchedPaths.length > 0 ? matchedPaths : 'None')

  return {
    tags: Array.from(tagsToRun),
    testPaths: Array.from(testPathsToRun),
  }
}

const testSelectors = getTestSelectors()
console.log('Tags to run:', testSelectors.tags)
console.log('Test paths to run:', testSelectors.testPaths)

// Output for GitHub Actions
if (process.env.GITHUB_OUTPUT) {
  const fs = require('node:fs')
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_tags=${testSelectors.tags.join(',')}\n`)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_paths=${testSelectors.testPaths.join(',')}\n`)
} else {
  console.log(`::set-output name=test_tags::${testSelectors.tags.join(',')}`)
  console.log(`::set-output name=test_paths::${testSelectors.testPaths.join(',')}`)
}
