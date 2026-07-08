# enemies/ — drop bestiary art here

Square PNG (transparent), **256×256** min. Name after the `BestiaryEnemy.id`
(`APP/src/engine/enemyAI.ts`).

## Expected now (full bestiary)

| file                 | enemy           | tier | placeholder |
|----------------------|-----------------|------|-------------|
| `debt-gnome.png`     | Debt Gnome      | 1    | 👺 |
| `interest-imp.png`   | Interest Imp    | 1    | 😈 |
| `ledger-wraith.png`  | Ledger Wraith   | 2    | 👻 |
| `overdraft-ogre.png` | Overdraft Ogre  | 2    | 👹 |
| `inflation-djinn.png`| Inflation Djinn | 3    | 🧞 |
| `compound-golem.png` | Compound Golem  | 3    | 🗿 |

Bosses (`engine/world.ts`, no bestiary stats yet): `debt-gnomes.png`, `gorgos.png`.

Swap: copy to `APP/public/assets/game/enemies/<id>.png`, then map the id → that
path in `ENEMY_ART` (`APP/src/assets/placeholders.tsx`). `<Sprite>` auto-switches
emoji → PNG.
