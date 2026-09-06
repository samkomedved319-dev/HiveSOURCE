#!/usr/bin/env python3
"""Build Windows ICO + PNG app icons from the Hive bee mascot."""
from __future__ import annotations

import io
import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "resources" / "mascot-source.png"
FALLBACK_SRC = ROOT / "src" / "renderer" / "public" / "logo.png"
OUT_DIR = ROOT / "resources"
PUBLIC = ROOT / "src" / "renderer" / "public"

DARK = (11, 12, 14, 255)
GOLD = (242, 193, 78, 255)


def knock_out_white(im: Image.Image, thresh: int = 238) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= thresh and g >= thresh and b >= thresh:
                px[x, y] = (r, g, b, 0)
    return im


def crop_bee(im: Image.Image, pad_ratio: float = 0.1) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    cropped = im.crop(bbox)
    pad = int(max(cropped.size) * pad_ratio)
    out = Image.new("RGBA", (cropped.width + pad * 2, cropped.height + pad * 2), (0, 0, 0, 0))
    out.paste(cropped, (pad, pad), cropped)
    return out


def hexagon(size: int, fill) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = size / 2
    r = size * 0.46
    pts = []
    for k in range(6):
        a = math.radians(-90 + k * 60)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=fill)
    return im


def rounded_square(size: int, radius: int, fill) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=fill)
    return im


def compose_app_icon(bee: Image.Image, size: int) -> Image.Image:
    if size <= 24:
        return hexagon(size, GOLD).resize((size, size), Image.Resampling.LANCZOS)

    radius = max(4, int(size * 0.22))
    icon = rounded_square(size, radius, DARK)
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = max(2, size // 28)
    ImageDraw.Draw(ring).rounded_rectangle(
        [inset, inset, size - 1 - inset, size - 1 - inset],
        radius=max(3, radius - inset),
        outline=GOLD,
        width=max(1, size // 28),
    )
    icon = Image.alpha_composite(icon, ring)

    max_side = int(size * 0.78)
    bee_s = bee.copy()
    bee_s.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    x = (size - bee_s.width) // 2
    y = (size - bee_s.height) // 2 + max(0, size // 64)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(bee_s, (x, y), bee_s)
    return Image.alpha_composite(icon, layer)


def png_bytes(im: Image.Image) -> bytes:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def write_ico(path: Path, images: list[Image.Image]) -> None:
    """ICO with PNG-compressed images (Vista+ / Windows 10/11)."""
    pngs = [png_bytes(im) for im in images]
    count = len(images)
    offset = 6 + 16 * count
    entries = bytearray()
    payload = bytearray()
    for im, data in zip(images, pngs):
        w = 0 if im.width >= 256 else im.width
        h = 0 if im.height >= 256 else im.height
        entries += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(data), offset)
        payload += data
        offset += len(data)
    path.write_bytes(struct.pack("<HHH", 0, 1, count) + entries + payload)


def main() -> None:
    src = SRC if SRC.exists() else FALLBACK_SRC
    if not src.exists():
        raise SystemExit(f"missing source logo: {src}")
    bee = crop_bee(knock_out_white(Image.open(src)))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    sizes = [16, 24, 32, 48, 64, 128, 256]
    frames = [compose_app_icon(bee, s) for s in sizes]
    icon_256 = frames[-1]

    png_path = OUT_DIR / "icon.png"
    icon_256.save(png_path, "PNG")
    (PUBLIC / "icon.png").write_bytes(png_path.read_bytes())

    bee_sq = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    bee_fit = bee.copy()
    bee_fit.thumbnail((240, 240), Image.Resampling.LANCZOS)
    bee_sq.paste(bee_fit, ((256 - bee_fit.width) // 2, (256 - bee_fit.height) // 2), bee_fit)
    bee_sq.save(PUBLIC / "logo.png", "PNG")
    assets = ROOT / "src" / "renderer" / "assets" / "logo.png"
    assets.parent.mkdir(parents=True, exist_ok=True)
    bee_sq.save(assets, "PNG")

    ico_path = OUT_DIR / "icon.ico"
    write_ico(ico_path, frames)
    print("wrote", png_path, png_path.stat().st_size)
    print("wrote", ico_path, ico_path.stat().st_size, "frames", len(frames))
    print("wrote public/logo.png", (PUBLIC / "logo.png").stat().st_size)


if __name__ == "__main__":
    main()
