# characters/ — drop party art here

Square PNG (transparent), **256×256** min. Name after the `PartyMember.id`.

## Expected now (current seed + recruit pool)

Seed party (`APP/src/persistenceService.ts`) — replaces emoji in `PARTY_ART`:

| file          | who     | role / slot           | placeholder |
|---------------|---------|-----------------------|-------------|
| `p1.png`      | Althea  | Leader — tank / front | 🧝🏻‍♀️ |
| `p2.png`      | Kael    | Vanguard — melee / front | 🧔🏾 |
| `p3.png`      | Elora   | Arcanist — support    | 🧙🏿‍♀️ |

Recruit pool (`APP/src/engine/recruitment.ts`) — optional, for recruited members:

| file                | who     | role         |
|---------------------|---------|--------------|
| `recruit-bram.png`  | Bram    | Vanguard     |
| `recruit-sigrid.png`| Sigrid  | Vanguard     |
| `recruit-mirelle.png`| Mirelle| Arcanist     |
| `recruit-fenwick.png`| Fenwick| Sharpshooter |
| `recruit-isolde.png`| Isolde  | Lightweaver  |

Swap: copy to `APP/public/assets/game/characters/<id>.png`, then set that
member's `avatar` to `/assets/game/characters/<id>.png` (seed or recruit pool).
`<Sprite>` auto-switches emoji → PNG. No other change.
