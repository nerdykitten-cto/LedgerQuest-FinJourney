/**
 * PLACEHOLDER ART — the single swap-point for demo art.
 *
 * Real art is coming later (dropped into the repo-root `/Assets/` folder, then
 * copied to `APP/public/assets/…`). Until then, characters + enemies render as
 * emoji and equipment + consumables render as inline SVG, all routed through the
 * two components at the bottom of this file (`Sprite`, `ItemIcon`). Nothing else
 * in the app hardcodes placeholder art — swap here.
 *
 * To go live with real art:
 *  - Characters/enemies: give the string an asset path (`/assets/…`). `Sprite`
 *    auto-switches emoji → <img>. Update `avatar` in the seed/recruit pools, or
 *    map an enemy id → path in `ENEMY_ART`.
 *  - Equipment/consumables: set `USE_REAL_ITEM_ART = true` and give items a real
 *    `sprite` path.
 */
import React from 'react';
import type { InventoryItem } from '../types/schemas';

/** Minimal shape needed to pick an icon — full InventoryItem satisfies it, as do
 *  ad-hoc shop entries that carry the same descriptive fields. */
export type ItemLike = Pick<InventoryItem, 'name' | 'type' | 'icon' | 'sprite' | 'statBonus'>;

/** App palette. */
const GOLD = '#f4d03f';
const DARK = '#4c4634';

/** A string is real art (not a placeholder) when it points at a file. */
export const isAssetPath = (s: string | undefined): boolean =>
  !!s && /^(\/|https?:)/.test(s.trim());

/* ------------------------------------------------------------------ characters */

/** Seed party ids → distinct emoji (skin-tone modifiers read as distinct people). */
export const PARTY_ART: Record<string, string> = {
  // Baked by Assets/tools/compose_characters.py (head+shoulders bust). Emoji
  // fallback (DEFAULT_PARTY_ART) still covers ids without art.
  p1: '/assets/game/characters/p1.png', // Althea — Leader / tank (front)
  p2: '/assets/game/characters/p2.png', // Kael — Vanguard / melee (front)
  p3: '/assets/game/characters/p3.png', // Elora — Arcanist / support
};

export const DEFAULT_PARTY_ART = '🧑🏽';

/** Resolve a party avatar value: real path passes through, else emoji by id. */
export const partyArt = (idOrAvatar: string): string => {
  if (isAssetPath(idOrAvatar)) return idOrAvatar;
  return PARTY_ART[idOrAvatar] ?? DEFAULT_PARTY_ART;
};

/* --------------------------------------------------------------------- enemies */

/** Bestiary ids (engine/enemyAI.ts) → oni-mask / creepy emoji. */
export const ENEMY_ART: Record<string, string> = {
  'debt-gnome': '👺',
  'interest-imp': '😈',
  'ledger-wraith': '👻',
  'overdraft-ogre': '👹',
  'inflation-djinn': '🧞',
  'compound-golem': '🗿',
};

export const DEFAULT_ENEMY_ART = '👹';

/** Resolve enemy art by id (preferred) or name; unknown → oni mask. */
export const enemyArt = (idOrName: string): string => {
  const key = idOrName.toLowerCase().replace(/\s+/g, '-');
  return ENEMY_ART[key] ?? ENEMY_ART[idOrName] ?? DEFAULT_ENEMY_ART;
};

/* --------------------------------------------------------- equipment / items */

export type ItemArtKind = 'sword' | 'shield' | 'armor' | 'potion' | 'quest';

/** Classify an item for its placeholder SVG. */
export const itemArtKind = (item: ItemLike): ItemArtKind => {
  if (item.type === 'Quest') return 'quest';
  if (item.type === 'Consumable' || item.statBonus?.hpHeal !== undefined) {
    if (item.icon !== 'swords' && item.icon !== 'shield') return 'potion';
  }
  if (item.icon === 'swords' || item.statBonus?.attack !== undefined) return 'sword';
  if (item.icon === 'shield') return 'shield';
  if (item.statBonus?.defense !== undefined) return 'armor';
  return 'armor';
};

/** Real item art lives under these baked dirs (Assets/tools/compose_characters.py).
 *  Only sprites in them are used; legacy sprite paths fall back to the SVG. */
export const isBakedItemArt = (s: string | undefined): boolean =>
  !!s && /^\/assets\/game\/(equipment|consumables)\//.test(s.trim());

/** Master switch for baked equipment/consumable PNGs (else inline-SVG placeholder). */
export const USE_REAL_ITEM_ART = true;

/* ------------------------------------------------------------------ components */

interface SpriteProps {
  /** Emoji or asset path (characters/enemies). */
  art: string;
  className?: string;
  /** Extra classes applied only to the emoji glyph (e.g. text-size). */
  emojiClassName?: string;
  alt?: string;
}

/**
 * Render character/enemy art. Asset path → <img>; emoji → accessible glyph.
 * `className` sizes the box; `emojiClassName` sizes the glyph.
 */
export const Sprite: React.FC<SpriteProps> = ({ art, className, emojiClassName, alt }) => {
  if (isAssetPath(art)) {
    return <img src={art} className={className} alt={alt ?? ''} />;
  }
  return (
    <span
      role="img"
      aria-label={alt || 'character'}
      className={`inline-flex items-center justify-center leading-none select-none ${className ?? ''} ${emojiClassName ?? ''}`}
    >
      {art}
    </span>
  );
};

const ItemSvg: React.FC<{ kind: ItemArtKind; size: number }> = ({ kind, size }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: GOLD,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (kind) {
    case 'sword':
      return (
        <svg {...common} aria-hidden>
          <path d="M14.5 4 L20 4 L20 9.5 L9.5 20 L6 20 L6 16.5 Z" fill={DARK} />
          <line x1="4" y1="18" x2="8" y2="14" />
          <line x1="3" y1="21" x2="6" y2="18" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3 L20 6 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V6 Z" fill={DARK} />
          <path d="M12 7 V17" />
          <path d="M7.5 9.5 H16.5" />
        </svg>
      );
    case 'armor':
      return (
        <svg {...common} aria-hidden>
          <path d="M7 4 L12 6 L17 4 L20 7 L17 10 V19 H7 V10 L4 7 Z" fill={DARK} />
          <path d="M12 6 V19" />
        </svg>
      );
    case 'potion':
      return (
        <svg {...common} aria-hidden>
          <path d="M10 3 H14 V7 L17 13 A5 5 0 0 1 7 13 L10 7 Z" fill={DARK} />
          <path d="M7.7 12 H16.3" stroke={GOLD} />
          <line x1="9.5" y1="3" x2="14.5" y2="3" />
        </svg>
      );
    case 'quest':
      return (
        <svg {...common} aria-hidden>
          <path d="M6 4 H16 A2 2 0 0 1 18 6 V18 A2 2 0 0 0 20 20 H8 A2 2 0 0 1 6 18 Z" fill={DARK} />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="14" x2="13" y2="14" />
        </svg>
      );
  }
};

interface ItemIconProps {
  item: ItemLike;
  /** Rendered SVG box in px. */
  size?: number;
  className?: string;
}

/**
 * Render an inventory item's icon. Placeholder = inline SVG by kind. When real
 * art exists (USE_REAL_ITEM_ART + a real sprite path), renders the PNG instead.
 */
export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 48, className }) => {
  if (USE_REAL_ITEM_ART && isBakedItemArt(item.sprite)) {
    return (
      <img
        src={item.sprite}
        width={size}
        height={size}
        className={`object-contain ${className ?? ''}`}
        alt={item.name}
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      role="img"
      aria-label={item.name}
    >
      <ItemSvg kind={itemArtKind(item)} size={size} />
    </span>
  );
};
