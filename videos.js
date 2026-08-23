const grid = document.getElementById("video-grid");
const lightbox = document.getElementById("video-lightbox");
const stage = document.getElementById("video-lightbox-stage");
const player = document.getElementById("video-lightbox-player");
const originalLink = document.getElementById("video-original-link");
const counter = document.getElementById("video-counter");
const closeBtn = document.getElementById("video-close-btn");
const prevBtn = document.getElementById("video-prev-btn");
const nextBtn = document.getElementById("video-next-btn");

let VIDEOS = [];
let currentIndex = 0;

async function loadVideos() {
  const res = await fetch("videos.json");
  return res.json();
}

function buildGrid() {
  grid.innerHTML = "";

  VIDEOS.forEach((vid, i) => {
    const card = document.createElement("div");
    card.className = "video-card";

    const el = document.createElement("video");
    el.src = vid.url;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = "metadata";

    const overlay = document.createElement("div");
    overlay.className = "video-card-overlay";
    overlay.innerHTML = `<span class="play-icon"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"></path></svg></span>`;

    const label = document.createElement("div");
    label.className = "video-card-label";
    label.textContent = vid.name;

    card.appendChild(el);
    card.appendChild(overlay);
    card.appendChild(label);

    card.addEventListener("mouseenter", () => el.play().catch(() => {}));
    card.addEventListener("mouseleave", () => {
      el.pause();
      el.currentTime = 0;
    });
    card.addEventListener("click", () => openLightbox(i));

    grid.appendChild(card);
  });
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
  player.pause();
  player.src = "";
}

function renderLightbox() {
  const vid = VIDEOS[currentIndex];
  player.src = vid.url;
  player.play().catch(() => {});
  originalLink.href = vid.url;
  counter.textContent = `${currentIndex + 1} / ${VIDEOS.length}`;
}

function showNext() {
  currentIndex = (currentIndex + 1) % VIDEOS.length;
  renderLightbox();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + VIDEOS.length) % VIDEOS.length;
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

loadVideos().then((videos) => {
  VIDEOS = videos;
  buildGrid();
});

document.getElementById("year").textContent = new Date().getFullYear();

if (window.scrollY === 0) {
  setTimeout(() => window.scrollBy({ top: 100, behavior: "smooth" }), 400);
}
