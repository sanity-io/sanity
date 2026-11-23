# Pokédex workspace

The `pokemon` workspace (`/pokemon` in the test studio) holds every Pokémon up to the newest
generation, along with the 18 elemental types, their abilities and the generations they were
introduced in. The data comes from [PokéAPI](https://pokeapi.co).

The workspace shares the `test` dataset with the other test studio workspaces. It registers only
its own schema types and lists only them in its structure, and its only tools are Structure and
Vision.

## Schema

| Type                | What it holds                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pokemon`           | One document per species: dex number, genus, types, generation, abilities, base stats, evolutions, Pokédex entry, breeding data, official artwork and icon |
| `pokemonType`       | The 18 elemental types, with their color, icon and damage relations to the other types                                                                     |
| `pokemonAbility`    | Every ability a Pokémon in the dataset can have, including hidden abilities                                                                                |
| `pokemonGeneration` | Generations I to IX, with their region and games                                                                                                           |

Every document ID starts with `pokemon.` (`pokemon.species.pikachu`, `pokemon.type.electric`,
`pokemon.ability.static`, `pokemon.generation.1`), so the seed never touches other documents in
the shared dataset.

Each Pokémon's `icon` is its 96×96 game sprite, cropped to the sprite's visible pixels so that it
fills list previews. The original image is uploaded unchanged; the crop and hotspot live on the
image field.

## Seeding

The seed needs a token with write access to the dataset:

```sh
SANITY_AUTH_TOKEN=<token> pnpm --filter sanity-test-studio seed:pokemon
```

The seed is idempotent. Documents are written with `createOrReplace`, and images already in the
dataset are not uploaded again. It also deletes `pokemon`, `pokemonType`, `pokemonAbility` and
`pokemonGeneration` documents whose IDs do not start with `pokemon.`, since those were not written
by it and do not match the schema.

PokéAPI responses and images are cached in `pokemon/.cache` (gitignored), so a second run makes no
requests to PokéAPI.

| Option              | Default    | Description                                                                                                        |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `--project-id`      | `ppsg7ml5` | Project to seed                                                                                                    |
| `--dataset`         | `test`     | Dataset to seed                                                                                                    |
| `--limit <n>`       |            | Only seed the first `n` Pokémon (all types and generations are still seeded)                                       |
| `--concurrency <n>` | `8`        | Parallel requests to PokéAPI and the Sanity API                                                                    |
| `--dry-run`         |            | Write the documents to `pokemon/.cache/pokedex.ndjson` instead, ready for `sanity dataset import`; no token needed |
| `--no-prune`        |            | Keep documents of the Pokédex types whose IDs do not start with `pokemon.`                                         |
