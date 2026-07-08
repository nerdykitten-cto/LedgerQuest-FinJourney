#!/usr/bin/env python3
"""
Compose LedgerQuest chibi characters + equipment icons from the layered
paper-doll art in Assets/imported_assets/images/ (that raw dump is gitignored).

WHAT IT DOES
------------
The imported art is a Unity paper-doll: cropped, centre-pivoted part sprites with
no rig/offset data. This script pins each part's centre to a hand-authored joint
(see JOINTS) and layers them back->front into a full character, then:

  * CHARACTERS  = base body (head/body/arms/legs/pelvis, skin-tinted) + face
                  (eye/brow/mouth/hair/optional beard) + clothing (top+sleeves,
                  bottom). Exported as a head+shoulders BUST (used as the avatar,
                  reads well in the app's round frames) and a FULL body.
  * EQUIPMENT   = the remaining gear slots (helmet/eyewear/gloves/boots/back and
                  gearhand weapons) trimmed into square inventory icons.

Deterministic: HEROES are fixed specs; make_random_spec(seed) spins more.

OUTPUT (committed; the raw dump is not):
  APP/public/assets/game/characters/<id>.png        (bust avatar)
  APP/public/assets/game/characters/<id>_full.png   (full body)
  APP/public/assets/game/equipment/<slug>.png       (icons)

USAGE:  python3 Assets/tools/compose_characters.py
"""
import os
import random
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "Assets/imported_assets/images")
CHARS_OUT = os.path.join(ROOT, "APP/public/assets/game/characters")
EQUIP_OUT = os.path.join(ROOT, "APP/public/assets/game/equipment")

W, H, CX = 220, 340, 110

# centre-anchor joints (cx, cy): part centre (pivot 0.5,0.5) pins here.
JOINTS = {
    "head": (CX, 62), "body": (CX, 132), "pelvis": (CX, 176),
    "leg_l": (98, 215), "leg_r": (122, 215), "arm_l": (72, 120), "arm_r": (148, 120),
    "eye": (CX, 68), "brow": (CX, 54), "mouth": (CX, 86), "hair": (CX, 40), "beard": (CX, 92),
    "top": (CX, 130), "top_arm_l": (72, 120), "top_arm_r": (148, 120), "bottom": (CX, 182),
}

SKIN = {"light": (242, 200, 160), "medium": (198, 134, 66), "dark": (120, 78, 52)}

# --- fixed roster (tank/front, melee/front, support) --------------------------
HEROES = {
    "p1": {"skin": "light",  "top": 48, "bottom": 3, "eye": 10, "brow": 3, "mouth": 4,  "hair": 21, "beard": None},  # Althea
    "p2": {"skin": "medium", "top": 60, "bottom": 7, "eye": 18, "brow": 7, "mouth": 10, "hair": 10, "beard": None},  # Kael
    "p3": {"skin": "dark",   "top": 48, "bottom": 7, "eye": 8,  "brow": 3, "mouth": 3,  "hair": 9,  "beard": None},  # Elora
}

# --- equipment icons: slug -> (slot dir, source basename) ---------------------
EQUIPMENT = {
    "iron-sword":    ("back",     "back_28"),     # steel sword (the "Budget Slicer")
    "leather-tunic": ("top",      "top_11"),      # chest armour
    "war-axe":       ("gearhand", "axe_1"),
    "oak-club":      ("gearhand", "club_1"),
    "flintlock":     ("gearhand", "pistol_1"),
    "iron-helm":     ("helmet",   "helmet_13"),   # metal knight helm
    "leather-gloves":("gloves_r", "gloves_r_10"),
    "traveler-boots":("boots",    "boots_21"),
    "spectacles":    ("eyewear",  "eyewear_20"),  # dark spectacles
    "wanderer-pack": ("back",     "back_14"),      # blue backpack
}


def find(*cands):
    for c in cands:
        if c and os.path.exists(os.path.join(SRC, c)):
            return c
    return None


def tint(img, rgb):
    r, g, b = rgb
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            pr, pg, pb, pa = px[x, y]
            if pa:
                px[x, y] = (pr * r // 255, pg * g // 255, pb * b // 255, pa)
    return img


def load(rel, skin=None):
    im = Image.open(os.path.join(SRC, rel)).convert("RGBA")
    return tint(im, SKIN[skin]) if skin else im


def paste(canvas, im, joint):
    cx, cy = JOINTS[joint]
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def hair_path(idx):
    return find(f"hair/hair_{idx}.png", f"hair_short/hair_short_{idx}.png",
                f"hair_hat/hair_hat_{idx}.png", f"hair_long/hair_long_{idx}.png")


def build(spec):
    """Compose a full-body character from a spec dict."""
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sk, t = spec["skin"], spec["top"]
    layers = [
        ("leg_l", "leg_l.png", sk), ("leg_r", "leg_r.png", sk),
        ("pelvis", "pelvis.png", sk),
        ("bottom", find(f"bottom/bottom_{spec['bottom']}.png"), None),
        ("arm_l", "arm_l.png", sk), ("arm_r", "arm_r.png", sk),
        ("body", "body.png", sk),
        ("top", find(f"top/top_{t}.png"), None),
        ("top_arm_l", find(f"top/top_arm_l_{t}.png", f"top_arm_l/top_arm_l_{t}.png"), None),
        ("top_arm_r", find(f"top_arm_r/top_arm_r_{t}.png", f"top/top_arm_r_{t}.png"), None),
        ("head", "head.png", sk),
        ("beard", find(f"beard/beard_{spec['beard']}.png") if spec.get("beard") else None, None),
        ("eye", find(f"eye/eye_{spec['eye']}.png"), None),
        ("brow", find(f"brow/brow_{spec['brow']}.png"), None),
        ("mouth", find(f"mouth/mouth_{spec['mouth']}.png"), None),
        ("hair", hair_path(spec["hair"]), None),
    ]
    for joint, rel, skin in layers:
        if rel:
            paste(c, load(rel, skin), joint)
    return c


def _square(im, size, pad):
    bb = im.getbbox()
    if not bb:
        return im.resize((size, size), Image.LANCZOS)
    im = im.crop(bb)
    side = int(max(im.size) * (1 + pad))
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
    return sq.resize((size, size), Image.LANCZOS)


def full_square(im, size=256):
    return _square(im, size, 0.10)


def bust_square(im, size=256):
    """Crop to head + shoulders (top ~150px of canvas), then square."""
    bb = im.getbbox()
    if not bb:
        return _square(im, size, 0.12)
    top = bb[1]
    crop = im.crop((0, top, im.width, min(im.height, top + 150)))
    return _square(crop, size, 0.12)


def gear_icon(slot, name, size=128):
    rel = find(f"{slot}/{name}.png")
    if not rel:
        raise FileNotFoundError(f"{slot}/{name}.png")
    return _square(load(rel), size, 0.14)


def make_random_spec(seed):
    """Deterministic random character (for recruits / future rosters)."""
    r = random.Random(seed)
    return {
        "skin": r.choice(list(SKIN)),
        "top": r.randint(10, 60),
        "bottom": r.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
        "eye": r.randint(1, 20), "brow": r.randint(1, 10), "mouth": r.randint(1, 10),
        "hair": r.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 19, 21, 23, 25, 27]),
        "beard": r.choice([None, None, None, r.randint(1, 10)]),
    }


def main():
    os.makedirs(CHARS_OUT, exist_ok=True)
    os.makedirs(EQUIP_OUT, exist_ok=True)

    for pid, spec in HEROES.items():
        base = build(spec)
        bust_square(base).save(os.path.join(CHARS_OUT, f"{pid}.png"))
        full_square(base).save(os.path.join(CHARS_OUT, f"{pid}_full.png"))
        print("char", pid, spec["skin"])

    for slug, (slot, name) in EQUIPMENT.items():
        try:
            gear_icon(slot, name).save(os.path.join(EQUIP_OUT, f"{slug}.png"))
            print("equip", slug)
        except FileNotFoundError as e:
            print("SKIP equip", slug, e)


if __name__ == "__main__":
    main()
