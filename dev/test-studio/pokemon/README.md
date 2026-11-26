# Pokédex workspace

The `pokemon` workspace (`/pokemon` in the test studio) holds every Pokémon up to the newest
generation, along with the 18 elemental types, their abilities and moves, and the generations
they were introduced in. Every document carries a plain-text `summary` and the in-game text
(Pokédex entries, ability and move descriptions), so semantic search and natural-language queries
have prose to match against, not only structured fields. The data comes from [PokéAPI](https://pokeapi.co).

The workspace uses the `pokedex` dataset of the test studio project (`ppsg7ml5`), instead of the
`test` dataset the other workspaces share. Its only tools are Structure, Vision and Themer.

## Schema

| Type                | What it holds                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pokemon`           | One document per species: summary, every distinct English Pokédex entry with its games, types, weaknesses, resistances and immunities, abilities, base stats, EV yields, level-up and signature moves, evolution line and method, forms, breeding data, cries and artwork |
| `pokemonType`       | The 18 elemental types, with their color, icon, damage relations, move damage class, generation and summary                                                                                                                                                               |
| `pokemonAbility`    | Every ability a Pokémon in the dataset can have, with its full and short effect, in-game descriptions, generation and summary                                                                                                                                             |
| `pokemonMove`       | Every move a Pokémon in the dataset learns, with its type, damage class, power, accuracy, PP, effects, stat changes and summary                                                                                                                                           |
| `pokemonGeneration` | Generations I to IX, with their region, games, version groups, counts and summary                                                                                                                                                                                         |

Every document ID starts with `pokemon_` (`pokemon_species_pikachu`, `pokemon_type_electric`,
`pokemon_ability_static`, `pokemon_move_thunderbolt`, `pokemon_generation_1`), so the seed never touches other documents in
the dataset. IDs use underscores because a dot in a document ID makes it path-scoped (private),
and the seed fails if any `_id` or `_ref` it generates contains one.

Each Pokémon's `icon` is its 96×96 game sprite, cropped to the sprite's visible pixels so that it
fills list previews. The original image is uploaded unchanged; the crop and hotspot live on the
image field.

## Seeding

The seed needs a token with write access to the dataset:

```sh
SANITY_AUTH_TOKEN=<token> pnpm --filter sanity-test-studio seed:pokemon
```

The seed is idempotent. Documents are written with `createOrReplace`, and images already in the
dataset are not uploaded again. It also deletes `pokemon`, `pokemonType`, `pokemonAbility`, `pokemonMove`
and `pokemonGeneration` documents whose IDs do not start with `pokemon_` (including the
`pokemon.`-prefixed ones earlier versions wrote), since those were not written by it and do not
match the schema. References between the stale documents are strong, so it unsets the evolution and
damage-relation references first and deletes the documents in batches, species before the abilities,
moves, types and generations they reference. Before writing anything, the seed checks that every
reference it generates resolves and agrees with that order.

The Structure tool shows document counts on the items that list every document of a type: All
Pokémon, Pokémon by type and by generation (which list the types and generations), Types,
Abilities, Moves and Generations.

PokéAPI responses and images are cached in `pokemon/.cache` (gitignored), so a second run makes no
requests to PokéAPI.

| Option              | Default    | Description                                                                                                        |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `--project-id`      | `ppsg7ml5` | Project to seed                                                                                                    |
| `--dataset`         | `pokedex`  | Dataset to seed                                                                                                    |
| `--limit <n>`       |            | Only seed the first `n` Pokémon (all types and generations are still seeded)                                       |
| `--concurrency <n>` | `8`        | Parallel requests to PokéAPI and the Sanity API                                                                    |
| `--dry-run`         |            | Write the documents to `pokemon/.cache/pokedex.ndjson` instead, ready for `sanity dataset import`; no token needed |
| `--no-prune`        |            | Keep documents of the Pokédex types whose IDs do not start with `pokemon_`                                         |

## Evaluating Vision's query generator

The `pokedex` dataset has embeddings, which makes it a good place to check the GROQ that Vision's
AI query generator writes. The eval asks for queries the way Vision does, runs each one against the
dataset and grades the result against a query written by hand. It covers a vague description that
needs semantic search (also with the embeddings read as disabled, where it must not be used), exact
requests that must not use semantic search (a name, a type and generation, a count, a top five by
weight, a flag, the most common ability) and two edits of an existing query. It reads the dataset
and uses AI credits, and it writes nothing. The packages must be built first (`pnpm build`):

```sh
SANITY_AUTH_TOKEN=<token> pnpm --filter sanity-test-studio eval:pokemon-queries
```

| Option          | Default       | Description                                     |
| --------------- | ------------- | ----------------------------------------------- |
| `--project-id`  | `ppsg7ml5`    | Project to query                                |
| `--dataset`     | `pokedex`     | Dataset to query                                |
| `--api-version` | `v2025-02-19` | API version the queries run with                |
| `--runs <n>`    | `3`           | How many times each case is generated           |
| `--only <text>` |               | Only run the cases whose name contains the text |
