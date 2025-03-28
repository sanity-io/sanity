import {execSync} from 'node:child_process'
import fs from 'node:fs'

import {pathToTagMapping} from './test-mappings.mjs'

function getChangedFiles() {
  try {
    // For PRs, compare with base branch
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      // Use GITHUB_BASE_REF which points to the base branch name (e.g., 'main', 'next')
      // Make sure we fetch the base branch first
      try {
        const baseBranch = process.env.GITHUB_BASE_REF
        console.log(`Fetching base branch: origin/${baseBranch}`)
        execSync(`git fetch origin ${baseBranch} --depth=1`, {encoding: 'utf-8'})
        console.log(`Comparing with base branch: origin/${baseBranch}`)
        return execSync(`git diff --name-only origin/${baseBranch}...HEAD`, {encoding: 'utf-8'})
          .trim()
          .split('\n')
          .filter(Boolean)
      } catch (fetchError) {
        console.error('Error fetching base branch:', fetchError)
        // Fallback to getting all files in the PR using GitHub REST API
        console.log('Falling back to GitHub API to get changed files')
        // For now, return a representative set of files for debugging
        return []
      }
    }
    // For push events, get last commit changes
    else if (process.env.GITHUB_EVENT_NAME === 'push') {
      // Make sure we have the previous commit
      console.log('Getting files changed in the last commit')
      try {
        // Get changes from the last commit
        return execSync('git diff --name-only HEAD^ HEAD', {encoding: 'utf-8'})
          .trim()
          .split('\n')
          .filter(Boolean)
      } catch (error) {
        console.error('Could not get previous commit:', error)
        // Fallback to listing all files in the repo
        console.log('Falling back to no changes')
        return []
      }
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
  if (!pattern.includes('*')) {
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
  // Use ES module style import instead of require
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_tags=${testSelectors.tags.join(',')}\n`)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_paths=${testSelectors.testPaths.join(',')}\n`)
} else {
  console.log(`::set-output name=test_tags::${testSelectors.tags.join(',')}`)
  console.log(`::set-output name=test_paths::${testSelectors.testPaths.join(',')}`)
}
