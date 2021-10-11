/* eslint-disable no-console */
const readPackages = require('./utils/readPackages')
const path = require('path')
const chalk = require('chalk')

function getMismatches(pkg, monorepoPackages) {
  const pkgDeps = {...pkg.content.dependencies, ...pkg.content.devDependencies}
  const mismatches = Object.keys(pkgDeps)
    .map((depName) => {
      const expectedVersion = pkgDeps[depName]
      const monorepoPackage = getMonorepoPackage(depName)
      if (!monorepoPackage || expectedVersion === monorepoPackage.content.version) {
        return null
      }
      return {
        name: depName,
        dev: Boolean(pkg.content.devDependencies[depName]),
        expected: expectedVersion,
        actual: monorepoPackage.content.version,
      }
    })
    .filter(Boolean)

  return {
    package: pkg,
    mismatches,
  }

  function getMonorepoPackage(candidate) {
    return monorepoPackages.find((package) => package.content.name === candidate)
  }
}

const monorepoPackages = readPackages()
const packageValidations = monorepoPackages.map((pkg) => getMismatches(pkg, monorepoPackages))

const invalidPackages = packageValidations.filter((validation) => validation.mismatches.length > 0)

if (invalidPackages.length > 0) {
  console.log(chalk.red(`⚠️  Monorepo version mismatches detected!\n`))
  console.log(
    invalidPackages
      .map(({package, mismatches}) => {
        const relativePkgJsonPath = `./${path.relative(process.cwd(), package.path)}`
        return [
          `${chalk.bold.whiteBright(package.content.name)}: ${mismatches
            .map(
              (mismatch) => `
  ${mismatch.name}@v${chalk.bold.red(mismatch.expected)} should be @v${chalk.bold.green(
                mismatch.actual
              )}
  👉  ${chalk.greenBright(
    `fix by updating ${chalk.greenBright.bold(
      relativePkgJsonPath
    )} and change the ${chalk.greenBright.bold(mismatch.name)} ${chalk.greenBright.bold(
      mismatch.dev ? 'devDependency' : 'dependency'
    )} to version ${chalk.greenBright.bold(mismatch.actual)}`
  )}`
            )
            .join('\n')}`,
        ]
      })
      .join('\n\n')
  )
  process.exit(1)
}
