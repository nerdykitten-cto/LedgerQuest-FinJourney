#!/usr/bin/env python3
"""
Compose LedgerQuest chibi characters + equipment icons from the "2D Art Maker"
(Layer Lab) Spine asset in Assets/imported_assets/spine/ (gitignored raw art).

WHY SPINE
---------
The art is a Spine skeletal rig: each part is placed by a bone transform + an
attachment offset, and drawn in slot order. Guessing anchors by hand looks wrong,
so this script reproduces Spine's setup-pose placement exactly:

  * bone world transforms (walk the hierarchy: translate·rotate·scale)
  * region attachments  -> place image centre at bone·(x,y), rotated
  * mesh attachments (arms/legs/pant-legs) -> least-squares affine from the
    skinned setup-pose vertices
  * draw order = slot order (back -> front)

The base body + hair ship as white masks; they are tinted (skin tone / hair
colour). Eyes, mouth and clothing are already coloured.

Characters export as a head+shoulders BUST (the avatar, reads in the app's round
frames) and a FULL body. Equipment slots export as square inventory icons.

OUTPUT (committed; raw spine/ is not):
  APP/public/assets/game/characters/<id>.png       (bust avatar)
  APP/public/assets/game/characters/<id>_full.png  (full body)
  APP/public/assets/game/equipment/<slug>.png      (icons)

USAGE:  python3 Assets/tools/compose_characters.py
"""
import json, math, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPINE = os.path.join(ROOT, "Assets/imported_assets/spine")
JSONP = os.path.join(SPINE, "Casual Character.json")
IMG = os.path.join(SPINE, "images")
CHARS_OUT = os.path.join(ROOT, "APP/public/assets/game/characters")
EQUIP_OUT = os.path.join(ROOT, "APP/public/assets/game/equipment")

# ---- palette ----
SKIN = {"light": (238, 195, 154), "medium": (198, 134, 80), "dark": (120, 74, 46)}
HAIR = {"black": (45, 38, 35), "brown": (120, 72, 45), "blonde": (214, 172, 96),
        "auburn": (150, 72, 42), "grey": (175, 175, 180)}

# ---- curated roster: base + one skin per category, plus tints ----
def outfit(eye, brow, mouth, hair, top, bottom, boots, beard=None, back=None):
    s = ["skin/skin_1", "default", f"eyes/eyes_c_{eye}", f"brow/brow_c_{brow}",
         f"mouth/mouth_c_{mouth}", hair, f"top/top_c_{top}", f"bottom/bottom_c_{bottom}",
         f"boots/boots_c_{boots}"]
    if beard:
        s.append(f"beard/beard_c_{beard}")
    if back:
        s.append(f"back/back_c_{back}")
    return s

HEROES = {  # tank/front, melee/front, support
    "p1": dict(skin="light",  hair="brown",  # Althea — Leader
               skins=outfit(3, 2, 4, "hair_short/hair_short_c_10", 24, 5, 3)),
    "p2": dict(skin="medium", hair="black",  # Kael — Vanguard
               skins=outfit(7, 5, 7, "hair_short/hair_short_c_5", 41, 20, 1, beard=4, back=14)),
    "p3": dict(skin="dark",   hair="auburn",  # Elora — Arcanist
               skins=outfit(18, 7, 10, "hair_short/hair_short_c_20", 13, 30, 12)),
    # ---- recruitable cast (avatars for engine/recruitment.ts pool) ----
    "bram":    dict(skin="medium", hair="blonde",  # Bram — Vanguard (front/melee tank)
               skins=outfit(5, 4, 6, "hair_short/hair_short_c_8", 33, 12, 7, beard=2, back=5)),
    "sigrid":  dict(skin="light",  hair="blonde",  # Sigrid — Vanguard (front/melee)
               skins=outfit(9, 3, 5, "hair_short/hair_short_c_15", 28, 8, 6, back=9)),
    "mirelle": dict(skin="light",  hair="auburn",  # Mirelle — Arcanist (support/mage)
               skins=outfit(12, 6, 8, "hair_short/hair_short_c_22", 50, 40, 20)),
    "fenwick": dict(skin="medium", hair="brown",   # Fenwick — Sharpshooter (support/ranged)
               skins=outfit(6, 4, 6, "hair_short/hair_short_c_12", 45, 25, 15, back=20)),
    "isolde":  dict(skin="dark",   hair="grey",    # Isolde — Lightweaver (support)
               skins=outfit(14, 8, 9, "hair_short/hair_short_c_26", 55, 45, 22)),
}

# ---- equipment slug -> raw part image (under images/) ----
EQUIPMENT = {
    "iron-sword":     "gearhand/sickle_1",
    "war-axe":        "gearhand/axe_1",
    "oak-club":       "gearhand/club_1",
    "flintlock":      "gearhand/pistol_1",
    "leather-tunic":  "top/top_11",
    "iron-helm":      "helmet_/helmet_13_",
    "leather-gloves": "gloves_r/gloves_r_1",
    "traveler-boots": "boots/boots_r_1",
    "spectacles":     "eyewear/eyewear_20",
    "wanderer-pack":  "back/back_14",
}

# ================================================================= spine engine
D = json.load(open(JSONP))
BONES = D["bones"]
SLOTS = D["slots"]
SKINS = {s["name"]: s for s in D["skins"]}
SLOT_BONE = {s["name"]: s["bone"] for s in SLOTS}

SKIN_SLOTS = {"head", "body", "arm_l", "arm_r", "leg_l", "leg_r", "pelvis"}
HAIR_SLOTS = {"hair", "hair_long", "brow", "beard"}

CW, CH, OX, OY = 440, 480, 210, 400  # canvas + world-origin


def matrix(x, y, rot, sx, sy):
    r = math.radians(rot); c, s = math.cos(r), math.sin(r)
    return [[c * sx, -s * sy, x], [s * sx, c * sy, y], [0, 0, 1]]

def mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def xform(M, x, y):
    return (M[0][0] * x + M[0][1] * y + M[0][2], M[1][0] * x + M[1][1] * y + M[1][2])

# Small pose correction: rotate the right arm about the shoulder joint (top of
# the arm). Positive = toward body; this leans it slightly away, no translation
# so the arm stays anchored at the shoulder.
BONE_TWEAK = {
    "Shoulder_r": {"drot": -15.0, "dx": 0.0, "dy": 0.0},
}

WORLD = {}
for b in BONES:
    tw = BONE_TWEAK.get(b["name"], {})
    L = matrix(b.get("x", 0) + tw.get("dx", 0), b.get("y", 0) + tw.get("dy", 0),
               b.get("rotation", 0) + tw.get("drot", 0), b.get("scaleX", 1), b.get("scaleY", 1))
    p = b.get("parent")
    WORLD[b["name"]] = mul(WORLD[p], L) if p else L

def bone_angle(M):
    return math.degrees(math.atan2(M[1][0], M[0][0]))

def bone_flip(M):
    return (M[0][0] * M[1][1] - M[0][1] * M[1][0]) < 0

def to_screen(x, y):
    return (OX + x, OY - y)

def load(name):
    return Image.open(os.path.join(IMG, f"{name}.png")).convert("RGBA")

def tint(img, rgb):
    r, g, b = rgb
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            pr, pg, pb, pa = px[x, y]
            if pa:
                px[x, y] = (pr * r // 255, pg * g // 255, pb * b // 255, pa)
    return img

def tint_for(slot, skin, hair):
    if skin and slot in SKIN_SLOTS:
        return SKIN[skin]
    if hair and slot in HAIR_SLOTS:
        return HAIR[hair]
    return None

def _gauss(M, b):
    m = [row[:] + [b[i]] for i, row in enumerate(M)]
    for col in range(3):
        piv = max(range(col, 3), key=lambda r: abs(m[r][col]))
        m[col], m[piv] = m[piv], m[col]
        if abs(m[col][col]) < 1e-9:
            return (0, 0, 0)
        for r in range(3):
            if r != col:
                fct = m[r][col] / m[col][col]
                for k in range(col, 4):
                    m[r][k] -= fct * m[col][k]
    return tuple(m[i][3] / m[i][i] for i in range(3))

def _solve_affine(src, dst):
    n = len(src)
    Sxx = Sxy = Sx = Syy = Sy = 0.0
    for (u, v) in src:
        Sxx += u * u; Sxy += u * v; Sx += u; Syy += v * v; Sy += v
    N = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]]
    def solve(t):
        b = [0.0, 0.0, 0.0]
        for (u, v), tv in zip(src, t):
            b[0] += u * tv; b[1] += v * tv; b[2] += tv
        return _gauss(N, b)
    a, bb, c = solve([d[0] for d in dst])
    d_, e, f = solve([d[1] for d in dst])
    return (a, bb, c, d_, e, f)

def _paste_affine(canvas, img, src, dst):
    a, b, c, d, e, f = _solve_affine(src, dst)
    det = a * e - b * d
    if abs(det) < 1e-6:
        return
    ia, ib, ic = e / det, -b / det, (b * f - e * c) / det
    id_, ie, iff = -d / det, a / det, (d * c - a * f) / det
    warped = img.transform((canvas.width, canvas.height), Image.AFFINE,
                           (ia, ib, ic, id_, ie, iff), resample=Image.BICUBIC)
    canvas.alpha_composite(warped)

def build(skin_names, skin=None, hair=None):
    att = {}
    for sn in skin_names:
        for slot, atts in SKINS[sn].get("attachments", {}).items():
            for att_key, a in atts.items():
                # Spine: a missing "name" means the image == the attachment key.
                att[slot] = (a, a.get("name") or a.get("path") or att_key)
    canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    for s in SLOTS:
        slot = s["name"]
        if slot not in att:
            continue
        a, name = att[slot]
        W = WORLD[SLOT_BONE[slot]]
        typ = a.get("type", "region")
        if not name:
            continue
        try:
            img = load(name)
        except FileNotFoundError:
            continue
        tc = tint_for(slot, skin, hair)
        if tc:
            img = tint(img, tc)
        if typ == "region":
            ax, ay = a.get("x", 0), a.get("y", 0)
            asx, asy = a.get("scaleX", 1), a.get("scaleY", 1)
            if asx != 1 or asy != 1:
                img = img.resize((max(1, int(img.width * asx)), max(1, int(img.height * asy))))
            wx, wy = xform(W, ax, ay)
            ang = bone_angle(W) + a.get("rotation", 0)
            if bone_flip(W):
                img = img.transpose(Image.FLIP_LEFT_RIGHT); ang = -ang + 2 * a.get("rotation", 0)
            rot = img.rotate(ang, expand=True, resample=Image.BICUBIC)
            sx, sy = to_screen(wx, wy)
            canvas.alpha_composite(rot, (int(sx - rot.width / 2), int(sy - rot.height / 2)))
        elif typ in ("mesh", "weightedmesh"):
            uvs, verts = a["uvs"], a["vertices"]
            n = len(uvs) // 2
            pts, i = [], 0
            if len(verts) != n * 2:  # weighted
                for _v in range(n):
                    bc = int(verts[i]); i += 1
                    px = py = 0.0
                    for _b in range(bc):
                        bi = int(verts[i]); vx = verts[i+1]; vy = verts[i+2]; w = verts[i+3]; i += 4
                        wx, wy = xform(WORLD[BONES[bi]["name"]], vx, vy)
                        px += wx * w; py += wy * w
                    pts.append((px, py))
            else:
                for _v in range(n):
                    wx, wy = xform(W, verts[i], verts[i+1]); i += 2
                    pts.append((wx, wy))
            # uv v=0 is the image top (== world top here), so sample v*H directly.
            srcpx = [(uvs[2*k] * img.width, uvs[2*k+1] * img.height) for k in range(n)]
            dstpx = [to_screen(*pts[k]) for k in range(n)]
            _paste_affine(canvas, img, srcpx, dstpx)
    return canvas

# ================================================================= export utils
def _trim(im, pad=0):
    bb = im.getbbox()
    if not bb:
        return im
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))), bb

def _square(im, size):
    side = int(max(im.size) * 1.06)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
    return sq.resize((size, size), Image.LANCZOS)

def full_png(composite, size=256):
    im, _ = _trim(composite)
    return _square(im, size)

def bust_png(composite, size=256):
    bb = composite.getbbox()
    x0, y0, x1, y1 = bb
    w = x1 - x0
    side = int(w * 1.12)                       # head + shoulders square
    cx = (x0 + x1) // 2
    top = y0 - int(w * 0.04)
    crop = composite.crop((cx - side // 2, top, cx + side // 2, top + side))
    return _square(_trim(crop)[0], size)

def gear_png(path, size=128):
    im, _ = _trim(load(path))
    return _square(im, size)

def main():
    os.makedirs(CHARS_OUT, exist_ok=True)
    os.makedirs(EQUIP_OUT, exist_ok=True)
    for pid, h in HEROES.items():
        comp = build(h["skins"], skin=h["skin"], hair=h["hair"])
        bust_png(comp).save(os.path.join(CHARS_OUT, f"{pid}.png"))
        full_png(comp).save(os.path.join(CHARS_OUT, f"{pid}_full.png"))
        print("char", pid, h["skin"], h["hair"])
    for slug, path in EQUIPMENT.items():
        try:
            gear_png(path).save(os.path.join(EQUIP_OUT, f"{slug}.png"))
            print("equip", slug)
        except FileNotFoundError:
            print("SKIP equip", slug, path)


if __name__ == "__main__":
    main()
