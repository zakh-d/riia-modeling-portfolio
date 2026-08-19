---
name: add-portfolio-images
description: Onboard new photos into this portfolio site (riia-modeling-portfolio). Use when the user drops new image files into new_images/ (or any folder) and asks to add them to the gallery, or asks how images/thumbnails/images.json/placement.json work on this site.
---

# Adding images to the portfolio site

This is a static site (`index.html` + `script.js`). The gallery is driven entirely by
`images.json` (the catalog) and `images/` + `images/thumbs/` (the actual files). There is
no build step — editing these is enough.

## How the site resolves an image

For a catalog entry `{"name": "IMG_1234", "ext": "JPG"}`, `script.js` (loadImages) builds:

- thumbnail: `images/thumbs/IMG_1234.jpg` (always lowercase `.jpg`, regardless of `ext`)
- full/original: `images/IMG_1234.JPG` (exact `name` + `.` + `ext`, case-sensitive)

`placement.json` is an ordered array of `name`s controlling gallery order. Any catalog
entry not listed there is appended afterward in `images.json` order — so you can add new
images without touching `placement.json` unless the user wants specific positioning.

## Procedure

Given a folder of new source images (commonly `new_images/`), for each file:

### 1. Dedupe check

Compare against everything already in `images/` — by filename **and** content, since
photos are often re-exported/re-added by mistake:

```bash
md5 -q new_images/FILE.ext
md5 -q images/FILE.ext   # if a file with that name already exists
```

- Same name + same md5 → exact duplicate, skip it.
- Same base name (filename without extension) but different content → collision, ask the
  user how to resolve (rename one) rather than silently overwriting.
- Different base name → proceed.

Base names must be unique across the *entire* catalog (existing + new), since the thumb
path only uses `name`, not `ext`.

### 2. Get the file into `images/` in a web-usable format

- `.jpg` / `.jpeg` / `.png` (any case): copy as-is, preserving the original filename and
  extension case exactly — that exact string becomes `ext` in the catalog entry.
- `.HEIC`, `.ARW` (or other RAW/non-web formats): convert to JPEG, since most browsers
  can't render these directly:
  ```bash
  sips -s format jpeg new_images/FILE.HEIC --out images/FILE.jpg
  ```
  The output `ext` in the catalog is then `jpg`.

### 3. ⚠️ Check orientation — especially for RAW files

`sips` does **not** reliably apply EXIF orientation when decoding Sony `.ARW` (and
possibly other camera RAW) files — the output can come out sideways. After converting,
visually check the result (read the file as an image) before trusting it. If it's
rotated, fix it directly on the file:

```bash
sips -r 90 images/FILE.jpg    # or -90 / 180, whichever is correct — check visually
```

Regular `.JPG`/`.HEIC` photos from phones/cameras are fine — `sips` bakes their EXIF
orientation into `pixelWidth`/`pixelHeight` correctly and this step can be skipped.

### 4. Generate the thumbnail

Resize so the longest edge is 1400px, matching every existing thumb in `images/thumbs/`:

```bash
sips -s format jpeg -Z 1400 images/FILE.jpg --out images/thumbs/FILE.jpg
```

### 5. 🐛 Known `sips` bug — verify thumbnails from rotated sources

If step 3 required a manual rotation (`sips -r`), **do not trust `sips -Z`/`-z` run on
that rotated file** — there is a reproducible bug where `sips` silently corrupts
orientation again during thumbnail JPEG re-encoding, even though:
- the full-size rotated file displays correctly, and
- `sips -g pixelWidth -g pixelHeight` reports the *correct* (already-swapped) dimensions
  on the broken thumbnail.

The pixel content is visibly sideways despite correct metadata. This was confirmed to
survive a PNG round-trip too — it's specifically `sips`'s JPEG encoder mishandling this
case, not a metadata/orientation-tag issue.

**Workaround:** if a thumbnail generated this way looks wrong, regenerate it with Pillow
instead of `sips`:

```python
from PIL import Image  # pip3 install --user Pillow  (if not already present)
im = Image.open("images/FILE.jpg")
thumb = im.copy()
thumb.thumbnail((1400, 1400))
thumb.convert("RGB").save("images/thumbs/FILE.jpg", quality=85)
```

**Always visually verify** (read the generated thumbnail as an image) for any file that
went through a manual rotation. For files that never needed rotation, spot-checking a
couple is enough — the plain `sips -Z` path is reliable for those.

### 6. Update `images.json`

Append one `{"name": ..., "ext": ...}` object per new image, preserving `ext` exactly as
the file exists on disk (case-sensitive). Don't reorder or touch existing entries. A
quick Python snippet is safer than manual JSON editing:

```python
import json
with open("images.json") as f:
    catalog = json.load(f)
catalog.append({"name": "IMG_1234", "ext": "JPG"})
with open("images.json", "w") as f:
    json.dump(catalog, f, indent=2)
    f.write("\n")
```

### 7. Sanity check before finishing

Confirm every catalog entry resolves to real files on disk:

```python
import json, os
cat = json.load(open("images.json"))
missing = []
for e in cat:
    for p in (f"images/{e['name']}.{e['ext']}", f"images/thumbs/{e['name']}.jpg"):
        if not os.path.isfile(p):
            missing.append(p)
print(len(cat), "entries;", "missing:" , missing)
```

### 8. Clean up the source folder

Once everything is copied/converted and verified, the source folder (e.g. `new_images/`)
holds nothing the site needs — RAW/HEIC originals were only kept as converted JPEGs.
**Ask the user before deleting it** (or its remaining contents) — this is a destructive
action on their files, even if redundant with what's now in `images/`.

## Notes

- `placement.json` only needs editing if the user wants specific ordering for the new
  images; otherwise the site's fallback (append in catalog order) handles it.
- There's no build/deploy step to run — this is plain static HTML/JS.
