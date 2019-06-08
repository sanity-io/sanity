import path from 'path'
import zlib from 'zlib'
import fse from 'fs-extra'
import tar from 'tar-fs'
import lazyRequire from '@sanity/util/lib/lazyRequire'

export default async (args, context) => {
  const {apiClient, workDir, chalk, output, prompt} = context
  const flags = Object.assign({build: true}, args.extOptions)
  const sourceDir = path.resolve(
    process.cwd(),
    args.argsWithoutOptions[0] || path.join(workDir, 'dist')
  )

  const client = apiClient({
    requireUser: true,
    requireProject: true
  })

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start()
  const project = await client.projects.getById(client.config().projectId)
  let studioHostname = project && (project.studioHostname || project.studioHost)
  spinner.succeed()

  if (!studioHostname) {
    output.print('Your project has not been assigned a studio hostname.')
    output.print('To deploy your Sanity Studio to our hosted Sanity.Studio service,')
    output.print('you will need one. Please enter the part you want to use.')

    studioHostname = await prompt.single({
      type: 'input',
      filter: inp => inp.replace(/\.sanity\.studio$/i, ''),
      message: 'Studio hostname (<value>.sanity.studio):',
      validate: name => validateHostname(name, client)
    })
  }

  // Always build the project, unless --no-build is passed
  const shouldBuild = flags.build
  if (shouldBuild) {
    const overrides = {project: {basePath: undefined}}
    const buildStaticAssets = lazyRequire(require.resolve('../build/buildStaticAssets'))
    await buildStaticAssets({extOptions: flags, argsWithoutOptions: [], overrides}, context)
  }

  // Ensure that the directory exists, is a directory and seems to have valid content
  spinner = output.spinner('Verifying local content').start()
  try {
    await checkDir(sourceDir)
    spinner.succeed()
  } catch (err) {
    spinner.fail()
    throw err
  }

  // Now create a tarball of the given directory
  const parentDir = path.dirname(sourceDir)
  const base = path.basename(sourceDir)
  const tarball = tar.pack(parentDir, {entries: [base]}).pipe(zlib.createGzip())

  spinner = output.spinner('Deploying to Sanity.Studio').start()
  try {
    const response = await client.request({
      method: 'POST',
      url: '/deploy',
      body: tarball,
      maxRedirects: 0
    })

    spinner.succeed()

    // And let the user know we're done
    output.print(`\nSuccess! Studio deployed to ${chalk.cyan(response.location)}`)
  } catch (err) {
    spinner.fail()
    throw err
  }
}

async function checkDir(sourceDir) {
  try {
    const stats = await fse.stat(sourceDir)
    if (!stats.isDirectory()) {
      throw new Error(`Directory ${sourceDir} is not a directory`)
    }
  } catch (err) {
    const error = err.code === 'ENOENT' ? new Error(`Directory "${sourceDir}" does not exist`) : err

    throw error
  }

  try {
    await fse.stat(path.join(sourceDir, 'index.html'))
  } catch (err) {
    const error =
      err.code === 'ENOENT'
        ? new Error(
            [
              `"${sourceDir}/index.html" does not exist -`,
              '[SOURCE_DIR] must be a directory containing',
              'a Sanity studio built using "sanity build"'
            ].join(' ')
          )
        : err

    throw error
  }
}

function validateHostname(value, client) {
  const projectId = client.config().projectId
  const uri = `/projects/${projectId}`
  const studioHost = value || ''

  // Check that it matches allowed character range
  if (!/^[a-z0-9_-]+$/i.test(studioHost)) {
    return 'Hostname can contain only A-Z, 0-9, _ and -'
  }

  // Check that the hostname is not already taken
  return client
    .request({uri, method: 'PATCH', body: {studioHost}})
    .then(() => true)
    .catch(() => 'Hostname already taken')
}
