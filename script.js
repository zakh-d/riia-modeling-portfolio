// Each entry: base filename, original extension
const IMAGES = [
  ["IMG_0269", "JPG"],
  ["IMG_0277", "JPG"],
  ["IMG_0284", "JPG"],
  ["IMG_0425", "JPG"],
  ["IMG_0507", "JPG"],
  ["IMG_0586", "JPG"],
  ["IMG_1917", "JPG"],
  ["IMG_2789", "JPG"],
  ["IMG_2790", "JPG"],
  ["IMG_2811", "PNG"],
  ["IMG_2837", "PNG"],
  ["IMG_2844", "PNG"],
  ["IMG_3175", "JPG"],
  ["IMG_3176", "JPG"],
  ["IMG_3177", "JPG"],
  ["IMG_3178", "JPG"],
  ["IMG_3179", "JPG"],
  ["IMG_3180", "JPG"],
  ["IMG_3183", "JPG"],
  ["IMG_3184", "JPG"],
  ["IMG_3185", "JPG"],
  ["IMG_3186", "JPG"],
  ["IMG_3231", "JPG"],
  ["IMG_3251", "JPG"],
  ["IMG_6439", "JPG"],
  ["IMG_6441", "JPG"],
  ["IMG_6444", "JPG"],
  ["IMG_6447", "JPG"],
  ["IMG_6451", "JPG"],
  ["IMG_6452", "JPG"],
  ["IMG_8822", "JPG"],
  ["IMG_8826", "JPG"],
  ["IMG_8844", "JPG"],
  ["IMG_8849", "JPG"],
  ["IMG_8859", "JPG"],
  ["IMG_8865", "JPG"],
  ["IMG_9002", "JPG"],
  ["IMG_9007", "JPG"],
].map(([name, ext]) => ({
  name,
  thumb: `images/thumbs/${name}.jpg`,
  original: `images/${name}.${ext}`,
}));

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const stage = document.getElementById("lightbox-stage");
const lightboxImg = document.getElementById("lightbox-img");
const originalLink = document.getElementById("original-link");
const counter = document.getElementById("counter");
const closeBtn = document.getElementById("close-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

let currentIndex = 0;

function buildGallery() {
  const frag = document.createDocumentFragment();
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
    frag.appendChild(tile);
  });
  gallery.appendChild(frag);
}

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

buildGallery();
