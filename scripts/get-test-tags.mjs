import {execSync} from 'node:child_process'
import fs from 'node:fs'
import https from 'node:https'

import {pathToTagMapping} from './test-mappings.mjs'

function fetchPRFiles() {
  return new Promise((resolve, reject) => {
    const owner = process.env.GITHUB_REPOSITORY_OWNER
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
    const prNumber =
      process.env.GITHUB_EVENT_NAME === 'pull_request'
        ? process.env.GITHUB_REF?.split('/')[2]
        : null

    if (!prNumber) {
      console.log('Not a PR build or PR number not found')
      return resolve([])
    }

    console.log(`Fetching changed files for PR #${prNumber} in ${owner}/${repo}`)

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      method: 'GET',
      headers: {
        'User-Agent': 'GitHub-Actions-PR-Files-Fetcher',
        'Accept': 'application/vnd.github.v3+json',
      },
    }

    // Add GitHub token if available for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      options.headers.Authorization = `token ${process.env.GITHUB_TOKEN}`
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const files = JSON.parse(data)
            const filenames = files.map((file) => file.filename)
            console.log(`Found ${filenames.length} changed files in PR`)
            resolve(filenames)
          } catch (e) {
            console.error('Error parsing GitHub API response:', e)
            resolve([])
          }
        } else {
          console.error(`GitHub API returned status code ${res.statusCode}`)
          console.error(`Response: ${data}`)
          resolve([])
        }
      })
    })

    req.on('error', (error) => {
      console.error('Error fetching PR files:', error)
      resolve([])
    })

    req.end()
  })
}

async function getChangedFiles() {
  try {
    // For PRs, get changed files from GitHub API
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      console.log('Getting changed files from GitHub API for PR')
      return await fetchPRFiles()
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

async function getTestSelectors() {
  const changedFiles = await getChangedFiles()
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

// Convert the function calls to use async/await
const main = async () => {
  const testSelectors = await getTestSelectors()
  console.log('Tags to run:', testSelectors.tags)
  console.log('Test paths to run:', testSelectors.testPaths)

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `test_tags=${testSelectors.tags.join(',')}\n`)
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `test_paths=${testSelectors.testPaths.join(',')}\n`,
    )
  } else {
    console.log(`::set-output name=test_tags::${testSelectors.tags.join(',')}`)
    console.log(`::set-output name=test_paths::${testSelectors.testPaths.join(',')}`)
  }
}

main().catch((error) => {
  console.error('Error in main function:', error)
  process.exit(1)
})
