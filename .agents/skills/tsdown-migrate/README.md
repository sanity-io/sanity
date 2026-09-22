# tsdown-migrate Skill

Agent skill that teaches AI coding agents how to migrate projects from [tsup](https://tsup.egoist.dev/) to [tsdown](https://tsdown.dev).

## Installation

This skill is included when you install the tsdown skills:

```bash
npx skills add rolldown/tsdown
```

Or install it separately:

```bash
npx skills add rolldown/tsdown --skill tsdown-migrate
```

## What's Included

This skill provides AI agents with complete knowledge to perform tsup→tsdown migrations:

- **Option Mappings** - Every tsup option and its tsdown equivalent
- **Config Transformations** - File renames, import changes, value transforms
- **Default Differences** - What changed between tsup and tsdown defaults
- **Unsupported Options** - What to remove and what alternatives exist
- **Package.json Migration** - Dependency, script, and config field changes
- **New Features** - tsdown-exclusive features to suggest after migration

## Usage

Once installed, AI agents will use this knowledge when:

- Migrating tsup projects to tsdown
- Explaining differences between tsup and tsdown
- Troubleshooting post-migration build issues
- Advising on tsdown configuration after migration

### Example Prompts

```
Migrate my tsup project to tsdown
```

```
What are the differences between tsup and tsdown options?
```

```
Convert my tsup.config.ts to tsdown format
```

```
My build broke after migrating from tsup — help me fix it
```

## Documentation

- [tsdown Documentation](https://tsdown.dev)
- [Migration Guide](https://tsdown.dev/guide/migrate-from-tsup)
- [GitHub Repository](https://github.com/rolldown/tsdown)

## Related Skills

- [tsdown](https://github.com/rolldown/tsdown/tree/main/skills/tsdown) - Core tsdown skill for building and configuring TypeScript libraries

## License

MIT
