import React, { useEffect, useRef, useState } from 'react';
import type { PlayerStats, CampaignState } from '../../types/schemas';
import { LOCATIONS } from '../../engine/world';
import { travelCost } from '../../engine/director';

interface WorldMapSceneProps {
  stats: PlayerStats;
  campaign: CampaignState;
  onTravel: (destination: string, cost: number) => void;
  onEnterTown: (name: string) => void;
  showDialogue: (msg: string) => void;
}

// Finger travel (px) before a gesture counts as a drag rather than a tap.
const DRAG_THRESHOLD = 8;
// On phones the (square) map is drawn this much larger than its covering fit so
// the whole map is reachable edge-to-edge by panning, with a little margin.
const MOBILE_ZOOM = 1.2;

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

export const WorldMapScene: React.FC<WorldMapSceneProps> = ({
  stats,
  campaign,
  onTravel,
  onEnterTown,
  showDialogue
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mobile, setMobile] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const centered = useRef(false);

  // The pannable map layer is a square (the map art is square) sized so it
  // overflows the window in BOTH axes on phones -> every edge is reachable.
  const side = Math.max(size.w, size.h) * MOBILE_ZOOM;
  const pannable = mobile && size.w > 0;

  // Gesture bookkeeping in a ref so a drag never re-renders until the pan moves.
  const drag = useRef({
    down: false,
    moved: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    pointerId: -1,
  });

  // Track the window size + breakpoint (phones pan; md+ shows the whole map).
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight });
      setMobile(window.innerWidth < 768);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const clampPan = (x: number, y: number) => {
    const maxX = Math.max(0, (side - size.w) / 2);
    const maxY = Math.max(0, (side - size.h) / 2);
    return { x: clamp(-maxX, maxX, x), y: clamp(-maxY, maxY, y) };
  };

  // Once the layer is measured on a phone, centre it on the current location so
  // the player starts looking at where their party is.
  useEffect(() => {
    if (!pannable || centered.current) return;
    const loc = LOCATIONS.find(l => l.name === campaign.currentLocation);
    if (loc) {
      setPan(clampPan(side / 2 - (loc.x / 100) * side, side / 2 - (loc.y / 100) * side));
    }
    centered.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pannable, side]);

  // Keep the pan in-bounds when the window/zoom changes (rotate, resize).
  useEffect(() => {
    setPan(p => clampPan(p.x, p.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, mobile]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pannable) return; // nothing to pan on wide screens
    drag.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      pointerId: e.pointerId,
    };
    try { containerRef.current?.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (d.moved) setPan(clampPan(d.panX + dx, d.panY + dy));
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d.pointerId === e.pointerId) {
      d.down = false;
      try { containerRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    }
  };

  const handleLocationClick = (name: string) => {
    // A pan gesture ends with a click on whatever node was under the finger —
    // swallow it so dragging the map never travels to / enters a village.
    if (drag.current.moved) return;

    if (name === campaign.currentLocation) {
      onEnterTown(name); // tap the village you are standing on to enter it
      return;
    }

    const cost = travelCost(campaign.currentLocation, name);
    if (stats.ap >= cost) {
      onTravel(name, cost);
    } else {
      showDialogue('INSUFFICIENT ACTION POINTS FOR TRAVEL.');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#060d20] select-none ${pannable ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Pannable map layer — image, paths, nodes and hero marker move together.
          On phones it is an oversized square positioned from the window centre;
          on md+ it simply fills the window (no panning). */}
      <div
        data-testid="map-layer"
        className={`absolute will-change-transform ${pannable ? '' : 'inset-0'}`}
        style={pannable ? {
          width: side,
          height: side,
          left: '50%',
          top: '50%',
          transform: `translate3d(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px), 0)`,
          transition: drag.current.down ? 'none' : 'transform 0.12s ease-out',
        } : undefined}
      >
        {/* World Map Image */}
        <img
          src="/assets/game/world_map.png"
          className="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
          alt="World Map"
          draggable={false}
        />

        {/* Overlay for dark mood */}
        <div className="absolute inset-0 bg-[#060d20]/30 pointer-events-none" />

        {/* Connection Paths (Simplified as SVG lines) */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={LOCATIONS.map(l => `${l.x},${l.y}`).join(' ')}
            fill="none"
            stroke="#f4d03f66"
            strokeWidth="0.5"
          />
        </svg>

        {/* Location Nodes */}
        {LOCATIONS.map((loc) => (
          <div
            key={loc.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            onClick={() => handleLocationClick(loc.name)}
            onMouseEnter={() => setSelectedLocation(loc.name)}
            onMouseLeave={() => setSelectedLocation(null)}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 -m-6 rounded-full bg-[#f4d03f]/20 blur-xl transition-all duration-500 ${selectedLocation === loc.name ? 'scale-150 opacity-40' : 'scale-100 opacity-20'}`} />

            {/* Map Pin Icon */}
            <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-[#f4d03f] flex items-center justify-center transition-transform ${selectedLocation === loc.name ? 'scale-125' : 'scale-100'} ${campaign.currentLocation === loc.name ? 'bg-[#f4d03f]' : 'bg-[#171f33]'}`}>
              {campaign.currentLocation === loc.name && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />}
            </div>

            {/* Name Tag */}
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#171f33]/90 border border-[#4c4634] whitespace-nowrap transition-all z-10 ${selectedLocation === loc.name ? 'opacity-100 scale-110' : 'opacity-80 scale-100'}`}>
              <span className={`font-label text-[8px] md:text-[10px] uppercase font-bold ${selectedLocation === loc.name ? 'text-[#f4d03f]' : 'text-[#ffeebb]'}`}>
                {loc.name}
              </span>
            </div>
          </div>
        ))}

        {/* Party marker — hand-made SVG arrow that hovers above the current node and
            points down at it (replaces the old /assets/game/hero.png that resolved to
            the default Vite logo). Anchored at the node, bobbing on the AP-gold ring. */}
        {LOCATIONS.filter(l => l.name === campaign.currentLocation).map(loc => (
          <div
            key="hero-marker"
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-1000 ease-in-out z-[6]"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          >
            {/* bob the marker (animate-bounce owns transform, so the vertical lift
                lives on the parent above); mb keeps the tip just clear of the node */}
            <div className="animate-bounce mb-1.5" style={{ animationDuration: '2s' }}>
              <svg
                viewBox="0 0 40 52"
                className="w-9 h-12 md:w-11 md:h-14 drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)]"
                role="img"
                aria-label="Your party is here"
              >
                {/* soft glow behind the pin */}
                <ellipse cx="20" cy="18" rx="15" ry="15" fill="#f4d03f" opacity="0.18" />
                {/* teardrop pin body */}
                <path
                  d="M20 3 C11 3 4 10 4 19 C4 30 20 49 20 49 C20 49 36 30 36 19 C36 10 29 3 20 3 Z"
                  fill="#f4d03f"
                  stroke="#4c4634"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* inner disc */}
                <circle cx="20" cy="18" r="8" fill="#171f33" stroke="#4c4634" strokeWidth="1.5" />
                {/* downward chevron: reinforces that it points AT the node */}
                <path
                  d="M14 15 L20 22 L26 15"
                  fill="none"
                  stroke="#f4d03f"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Drag hint — phones only, where the map is pannable. */}
      {pannable && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-[#171f33]/80 border border-[#4c4634] pointer-events-none animate-in fade-in duration-700">
          <span className="font-label text-[8px] uppercase tracking-widest text-[#ffeebb]/70">Drag to explore &middot; Tap a village</span>
        </div>
      )}
    </div>
  );
};
