/**
 * This export is provided for backwards "compatibility" with older versions of the CLI,
 * but will throw an error if accessed. The error message should be helpful and
 * point users to the documentation.
 */
const HELP_URL = `https://www.sanity.io/docs/help/sanity-cli-sanity-studio-mismatch`

/**
 * This export is server-side only and not importable in a browser.
 * @internal
 */
export const cliProjectCommands: {
  // Actually unused since v3 was released, but kept for type compatibility
  requiredCliVersionRange: string
  // actually `CliCommandDefinition | CliCommandGroupDefinition` but avoiding the import
  commands: Array<unknown>
} = {
  requiredCliVersionRange: '^3.0.0 || ^4.0.0 || ^5.0.0',
  commands: new Proxy([], {
    get() {
      throw new Error(
        `The installed version of "@sanity/cli" is not compatible with the installed version of "sanity". ` +
          `For more information on how to resolve this, see ${HELP_URL}`,
      )
    },
  }),
}
