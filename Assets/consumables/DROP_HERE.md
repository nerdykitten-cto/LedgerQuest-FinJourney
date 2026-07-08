# consumables/ — drop potion / scroll / quest-item art here

Square PNG (transparent), **128×128**, centered with a little padding. Name after
the `InventoryItem.templateId`.

## Expected now (current items)

| file                | item          | kind       | source                         |
|---------------------|---------------|------------|--------------------------------|
| `health-potion.png` | Health Potion | consumable | seed (`persistenceService.ts`) |

(More consumables land as Phases 4–5 add them — same rule: filename = `templateId`.)

Swap: copy to `APP/public/assets/game/consumables/<templateId>.png`, set the
item's `sprite` to that path, and flip `USE_REAL_ITEM_ART = true` in
`APP/src/assets/placeholders.tsx`.
