# /Assets — real-art drop folder

Staging zone for the **real** game art that will replace the emoji / inline-SVG
placeholders currently rendered by the demo. Drop finished files here; a build
step (or a quick manual copy) moves web-ready files into `APP/public/assets/…`
and the single swap-point in code (`APP/src/assets/placeholders.tsx`) is flipped
to point at them.

Nothing in this folder is imported by the app directly. It is a human handoff
zone — art in, then integrated.

## Structure

```
Assets/
├── characters/     party members (the 3 starting heroes + future recruits)
├── enemies/        bestiary art (Debt Gnome, Interest Imp, … + bosses)
├── equipment/      weapons, armor, shields (inventory Equipment items)
└── consumables/    potions, scrolls, quest items (inventory Consumable/Quest)
```

## Naming

Name each file after the in-code **id** it replaces so the swap is mechanical:

| Folder        | id source                                   | example filename        |
|---------------|---------------------------------------------|-------------------------|
| `characters/` | `PartyMember.id` (seed/recruit)             | `p1.png`, `recruit-bram.png` |
| `enemies/`    | `BestiaryEnemy.id` (`engine/enemyAI.ts`)    | `debt-gnome.png`        |
| `equipment/`  | `InventoryItem.templateId`                  | `iron-sword.png`        |
| `consumables/`| `InventoryItem.templateId`                  | `health-potion.png`     |

## Format & sizing

- **Format:** PNG (transparent) preferred; SVG accepted for crisp scalable icons.
- **Characters / enemies:** square, **256×256** min (rendered in round frames up
  to ~96px; extra res keeps retina crisp). Transparent background.
- **Equipment / consumables:** square, **128×128**, transparent, centered with a
  little padding (rendered ~48px in the vault grid, ~16px in combat).
- Keep the app palette in mind for cohesion: gold `#f4d03f`, dark `#4c4634`,
  parchment `#ffeebb`.

## How the swap works (for whoever integrates)

Placeholders live in **one file**: `APP/src/assets/placeholders.tsx`.
- **Characters & enemies** render through `<Sprite art={…} />`, which shows a PNG
  when the string is an asset path (`/assets/…`) and an emoji otherwise. To swap:
  copy `characters/p1.png` → `APP/public/assets/game/characters/p1.png` and change
  that member's `avatar` (in `persistenceService.ts` seed / `recruitment.ts` pool)
  from the emoji to `/assets/game/characters/p1.png`. Enemies: extend `ENEMY_ART`
  in `placeholders.tsx` to map the id to the new path.
- **Equipment & consumables** render through `<ItemIcon item={…} />`. Flip
  `USE_REAL_ITEM_ART` to `true` in `placeholders.tsx` (and give items a real
  `sprite` path) to use PNGs instead of the inline-SVG placeholders.

No other code changes are required — the render sites already call these two
components, so real art lands with a per-asset one-line edit.
