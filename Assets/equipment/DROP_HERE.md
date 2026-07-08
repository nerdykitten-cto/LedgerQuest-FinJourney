# equipment/ — drop weapon / armor / shield art here

Square PNG (transparent), **128×128**, centered with a little padding. Name after
the `InventoryItem.templateId`.

## Expected now (current items)

| file               | item          | kind   | source                         |
|--------------------|---------------|--------|--------------------------------|
| `iron-sword.png`   | Budget Slicer | weapon | seed (`persistenceService.ts`) |
| `iron-sword.png`   | Iron Sword    | weapon | shop (`TownScene.tsx`)         |
| `leather-tunic.png`| Leather Tunic | armor  | shop (`TownScene.tsx`)         |

(More equipment templates land as Phases 4–5 add them — same rule: filename = `templateId`.)

Swap: copy to `APP/public/assets/game/equipment/<templateId>.png`, set the item's
`sprite` to that path, and flip `USE_REAL_ITEM_ART = true` in
`APP/src/assets/placeholders.tsx`. `<ItemIcon>` then renders the PNG instead of
the inline-SVG placeholder.
