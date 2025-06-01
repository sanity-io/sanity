# Stable Release Tagging Tasks

## 1.0 Create New GitHub Workflow

- [x] 1.1 Create new GitHub workflow file `.github/workflows/release-stable.yml`
- [x] 1.2 Add manual trigger (`workflow_dispatch`) with semver input validation
- [x] 1.3 Add input field validation (regex pattern for semver: `^\d+\.\d+\.\d+$`)
- [x] 1.4 Add input field description and required validation
- [x] 1.5 Set up environment permissions (contents: read, packages: write)

## 2.0 Git Tag Discovery and Validation

- [x] 2.1 Create script to validate git tag exists (check `v3.2.1` format, since that is how our git tags are)
- [x] 2.2 Add validation to ensure the git tag corresponds to a valid release
- [x] 2.3 Add step to checkout the specific git tag
- [x] 2.4 Validate that the checked out tag has the expected Lerna version (REMOVED - redundant with NPM validation)
- [x] 2.5 Add pre-flight check to ensure tag hasn't already been published as stable (REMOVED - conflicts with rollback scenarios)

## 3.0 Package Discovery from Git Tag

- [x] 3.1 Read Lerna configuration from the checked out git tag
- [x] 3.2 Discover core bundle packages (`sanity`, `@sanity/vision`) from the tag's package.json files
- [x] 3.3 Validate core package versions match the target semver version
- [x] 3.4 List core packages that will be published to NPM with stable tag (for confirmation)
- [x] 3.5 Verify core packages (`sanity`, `@sanity/vision`) require CircleCI deployment for bundle builds

## 4.0 Build and Publish to NPM with Stable Tag

- [x] 4.1 Install dependencies from the git tag
- [x] 4.2 Build all packages from the git tag source
- [x] 4.3 Create script to publish packages with `--tag stable` dist-tag
- [x] 4.4 Implement batch publishing of all packages from Lerna config
- [ ] 4.5 Add error handling for failed publish operations
- [ ] 4.6 Add retry logic for network failures
- [x] 4.7 Create verification step to confirm stable publications were successful

## 5.0 CircleCI Integration for Core Package Bundles

- [ ] 5.1 Research CircleCI API for triggering workflows with git tag parameter
- [ ] 5.2 Add CircleCI API token to GitHub secrets
- [ ] 5.3 Create script to trigger CircleCI build from specific git tag
- [ ] 5.4 Modify CircleCI config to accept git tag and 'stable' channel parameters
- [ ] 5.5 Update CircleCI to checkout the specified git tag
- [ ] 5.6 Update CircleCI bundle upload to use 'stable' bucket path/naming for core packages only
- [ ] 5.7 Verify CircleCI job only processes `sanity` and `@sanity/vision` packages

## 6.0 Bundle Build Configuration for Core Packages

- [ ] 6.1 Investigate current `build:bundle` and `bundle:upload` scripts (confirmed: only handles `sanity` and `@sanity/vision`)
- [ ] 6.2 Ensure CircleCI can build core package bundles from any git tag (not just main/current)
- [ ] 6.3 Update bundle upload paths to include 'stable' channel identifier for core packages
- [ ] 6.4 Ensure stable bundles for core packages are uploaded to correct GCS bucket locations
- [ ] 6.5 Add verification that stable core package bundles were uploaded successfully
- [ ] 6.6 Document that only core packages (`sanity`, `@sanity/vision`) require bundle deployment

## 7.0 Workflow Orchestration

- [ ] 7.1 Implement proper step dependencies in GitHub workflow
- [ ] 7.2 Add step to wait for CircleCI core package bundle job completion
- [ ] 7.3 Add status reporting and failure notifications for both NPM and bundle deployments
- [ ] 7.4 Create rollback mechanism for failed stable publishing (NPM and bundles)
- [ ] 7.5 Add comprehensive logging for debugging both NPM and bundle processes
- [ ] 7.6 Add step to clean up workspace after publishing
- [ ] 7.7 Coordinate NPM publishing of all packages with core package bundle deployment

## 8.0 NPM Authentication and Permissions

- [ ] 8.1 Ensure NPM_TOKEN has publish permissions for all packages in monorepo
- [ ] 8.2 Add npm authentication validation step
- [ ] 8.3 Verify permissions to publish with dist-tags for all packages
- [ ] 8.4 Add check for existing stable versions before publishing any packages

## 9.0 Testing and Validation

- [ ] 9.1 Create test script to verify stable packages work correctly (all NPM packages)
- [ ] 9.2 Test workflow with dry-run mode (no actual publishing to NPM or GCS)
- [ ] 9.3 Validate core package bundle accessibility via stable channel
- [ ] 9.4 Create integration test for full workflow (NPM + core package bundles)
- [ ] 9.5 Test with various git tag formats (v3.2.1 vs 3.2.1)
- [ ] 9.6 Document testing procedures and rollback steps for both NPM and bundles
- [ ] 9.7 Verify non-core packages are correctly published to NPM without bundle builds

## 10.0 Documentation and Monitoring

- [ ] 10.1 Document new workflow in CONTRIBUTING.md
- [ ] 10.2 Add usage examples and troubleshooting guide
- [ ] 10.3 Document stable channel bundle URLs for core packages (`sanity`, `@sanity/vision`) only
- [ ] 10.4 Create monitoring/alerting for failed stable releases (NPM and core package bundles)
- [ ] 10.5 Add workflow status badge or reporting mechanism
- [ ] 10.6 Document git tag requirements and conventions
- [ ] 10.7 Document which packages get NPM-only vs NPM+bundle deployment

## 11.0 Stable Git Tag Management

- [ ] 11.1 Add git tag update permissions to workflow (contents: write)
- [ ] 11.2 Create step to check if 'stable' git tag already exists
- [ ] 11.3 Delete existing 'stable' git tag if it exists (locally and remotely)
- [ ] 11.4 Create new 'stable' git tag pointing to the target version commit
- [ ] 11.5 Push updated 'stable' git tag to remote repository
- [ ] 11.6 Add verification step to confirm 'stable' tag points to correct commit
- [ ] 11.7 Add error handling for git tag update failures
- [ ] 11.8 Add rollback mechanism to restore previous 'stable' tag on failure
