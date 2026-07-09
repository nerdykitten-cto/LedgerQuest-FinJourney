# /Assets — art staging + character pipeline

Staging zone for game art that replaces the emoji / inline-SVG placeholders in
the demo. Two sources feed `APP/public/assets/…`:

1. **`imported_assets/spine/`** — the "2D Art Maker" (Layer Lab) **Spine** asset:
   `Casual Character.json` (skeleton) + `images/` (part masks). **Gitignored**
   (raw, ~10 MB). `tools/compose_characters.py` composes it.
2. The per-slot folders below — a manual drop-zone for one-off finished PNGs.

## Character pipeline — `tools/compose_characters.py`

The art is a Spine skeletal rig — each part is placed by a bone transform + an
attachment offset and drawn in slot order. The script **reproduces Spine's
setup-pose placement exactly** (hand-guessing anchors looks wrong):

- bone world transforms (walk hierarchy: translate·rotate·scale);
- region attachments → image centre at `bone·(x,y)`, rotated;
- mesh attachments (arms/legs/pant-legs) → least-squares affine from the skinned
  setup-pose vertices;
- draw order = slot order (back → front).

Base body + hair are white masks → tinted (skin tone / hair colour); eyes, mouth
and clothing are already coloured.

- **Characters** = base body + face (eye/brow/mouth/hair/optional beard) +
  clothing (top+sleeves, bottom, boots) + optional back. Exported as a
  head+shoulders **bust** (the avatar, reads in the app's round frames) and a
  **full** body. 3 curated `HEROES` (p1 light/Leader, p2 medium+beard/Vanguard,
  p3 dark/Arcanist) — each = one skin per category + skin/hair tint.
- **Equipment** = weapon / helmet / gloves / boots / back / eyewear part images
  trimmed into square inventory icons (`EQUIPMENT` map).

```
python3 Assets/tools/compose_characters.py
# → APP/public/assets/game/characters/{p1,p2,p3}.png        (bust avatars)
# → APP/public/assets/game/characters/{p1,p2,p3}_full.png   (full body)
# → APP/public/assets/game/equipment/<slug>.png             (icons)
```

The committed outputs (in `APP/public/...`) are what the app loads; regenerate by
re-running. Recast via the `HEROES` / `EQUIPMENT` dicts (category skin ids +
tints). To add a hero, add a spec and point its `avatar` in `PARTY_ART`.

Nothing in *this* folder is imported by the app directly — it is source + staging.

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
