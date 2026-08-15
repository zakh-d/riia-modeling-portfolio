const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const stage = document.getElementById("lightbox-stage");
const lightboxImg = document.getElementById("lightbox-img");
const originalLink = document.getElementById("original-link");
const counter = document.getElementById("counter");
const closeBtn = document.getElementById("close-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

let IMAGES = [];
let currentIndex = 0;

async function loadImages() {
  const [catalog, order] = await Promise.all([
    fetch("images.json").then((r) => r.json()),
    fetch("placement.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]);

  const byName = new Map(catalog.map((img) => [img.name, img]));
  const ordered = [];
  const seen = new Set();

  order.forEach((name) => {
    const img = byName.get(name);
    if (img && !seen.has(name)) {
      ordered.push(img);
      seen.add(name);
    }
  });
  catalog.forEach((img) => {
    if (!seen.has(img.name)) {
      ordered.push(img);
      seen.add(img.name);
    }
  });

  return ordered.map((img) => ({
    name: img.name,
    thumb: `images/thumbs/${img.name}.jpg`,
    original: `images/${img.name}.${img.ext}`,
  }));
}

// Per-column top offset (px), cycled by column index, so images don't
// align horizontally across columns. First column stays at 0.
const COLUMN_OFFSETS = [0, 54, 22, 78];

let columnCount = 0;
let resizeTimer = null;

function getColumnCount() {
  const w = window.innerWidth;
  if (w <= 640) return 1;
  if (w <= 900) return 2;
  return 4;
}

function buildGallery() {
  columnCount = getColumnCount();
  gallery.innerHTML = "";

  const columns = [];
  for (let c = 0; c < columnCount; c++) {
    const col = document.createElement("div");
    col.className = "gallery-column";
    col.style.paddingTop = `${COLUMN_OFFSETS[c % COLUMN_OFFSETS.length]}px`;
    gallery.appendChild(col);
    columns.push(col);
  }

  IMAGES.forEach((img, i) => {
    const tile = document.createElement("figure");
    tile.className = "tile";
    tile.dataset.index = i;

    const el = document.createElement("img");
    el.src = img.thumb;
    el.alt = `Portfolio image ${img.name}`;
    el.loading = "lazy";
    el.addEventListener("load", () => el.classList.add("loaded"));

    const label = document.createElement("figcaption");
    label.className = "tile-label";
    label.textContent = img.name;

    tile.appendChild(el);
    tile.appendChild(label);
    tile.addEventListener("click", () => openLightbox(i));
    columns[i % columnCount].appendChild(tile);
  });
}

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (getColumnCount() !== columnCount) buildGallery();
  }, 150);
});

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();
  lightbox.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.classList.remove("modal-open");
  lightboxImg.src = "";
}

function renderLightbox() {
  const img = IMAGES[currentIndex];
  stage.classList.add("loading");
  lightboxImg.classList.remove("loaded");

  const full = new Image();
  full.onload = () => {
    stage.classList.remove("loading");
  };
  full.src = img.original;
  lightboxImg.src = img.original;

  originalLink.href = img.original;
  counter.textContent = `${currentIndex + 1} / ${IMAGES.length}`;
}

function showNext() {
  currentIndex = (currentIndex + 1) % IMAGES.length;
  renderLightbox();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + IMAGES.length) % IMAGES.length;
  renderLightbox();
}

closeBtn.addEventListener("click", closeLightbox);
nextBtn.addEventListener("click", showNext);
prevBtn.addEventListener("click", showPrev);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target === stage) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
});

loadImages().then((images) => {
  IMAGES = images;
  buildGallery();
});

document.getElementById("year").textContent = new Date().getFullYear();
