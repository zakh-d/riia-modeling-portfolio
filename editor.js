const canvas = document.getElementById("canvas");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("status");

let catalog = []; // [{ name, ext }]
let items = []; // [{ name, thumb }] in current order
let fileHandle = null;
let dirty = false;
let dragIndex = null;

function setStatus(text, isDirty) {
  statusEl.textContent = text;
  dirty = !!isDirty;
}

async function loadData() {
  const [catalogData, order] = await Promise.all([
    fetch("images.json").then((r) => r.json()),
    fetch("placement.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]);
  catalog = catalogData;

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
  }));
}

// Must mirror script.js exactly, so the editor shows the same columns
// and stagger as the live site.
const COLUMN_OFFSETS = [0, 54, 22, 78];

function getColumnCount() {
  const w = window.innerWidth;
  if (w <= 640) return 1;
  if (w <= 900) return 2;
  return 4;
}

function renderCanvas() {
  canvas.innerHTML = "";
  const columnCount = getColumnCount();

  const columns = [];
  for (let c = 0; c < columnCount; c++) {
    const col = document.createElement("div");
    col.className = "canvas-column";
    col.style.paddingTop = `${COLUMN_OFFSETS[c % COLUMN_OFFSETS.length]}px`;
    canvas.appendChild(col);
    columns.push(col);
  }

  items.forEach((item, index) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.name = item.name;
    tile.draggable = true;

    const img = document.createElement("img");
    img.src = item.thumb;
    img.alt = item.name;
    img.draggable = false;

    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = item.name;

    tile.appendChild(img);
    tile.appendChild(label);
    columns[index % columnCount].appendChild(tile);

    tile.addEventListener("dragstart", (e) => {
      dragIndex = index;
      tile.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    tile.addEventListener("dragend", () => {
      dragIndex = null;
      pointerY = null;
      if (autoScrollFrame !== null) {
        cancelAnimationFrame(autoScrollFrame);
        autoScrollFrame = null;
      }
      renderCanvas();
    });

    tile.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragIndex === null || dragIndex === index) return;
      tile.classList.add("drag-over");
    });

    tile.addEventListener("dragleave", () => {
      tile.classList.remove("drag-over");
    });

    tile.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      [items[dragIndex], items[index]] = [items[index], items[dragIndex]];
      dragIndex = null;
      renderCanvas();
      setStatus("Unsaved changes", true);
    });
  });
}

window.addEventListener("resize", () => renderCanvas());

// Auto-scroll the page while dragging a tile near the top/bottom of the viewport.
const SCROLL_EDGE = 220; // px from viewport edge that triggers scrolling
const SCROLL_MIN_SPEED = 6; // px per animation frame as soon as the zone is entered
const SCROLL_MAX_SPEED = 28; // px per animation frame right at the edge
let pointerY = null;
let autoScrollFrame = null;

function autoScrollStep() {
  if (dragIndex === null || pointerY === null) {
    autoScrollFrame = null;
    return;
  }

  const viewportH = window.innerHeight;
  let delta = 0;

  if (pointerY < SCROLL_EDGE) {
    const proximity = 1 - pointerY / SCROLL_EDGE; // 0 at zone boundary, 1 at edge
    delta = -(SCROLL_MIN_SPEED + (SCROLL_MAX_SPEED - SCROLL_MIN_SPEED) * proximity);
  } else if (pointerY > viewportH - SCROLL_EDGE) {
    const proximity = 1 - (viewportH - pointerY) / SCROLL_EDGE;
    delta = SCROLL_MIN_SPEED + (SCROLL_MAX_SPEED - SCROLL_MIN_SPEED) * proximity;
  }

  if (delta !== 0) {
    window.scrollBy(0, delta);
  }

  autoScrollFrame = requestAnimationFrame(autoScrollStep);
}

document.addEventListener("dragover", (e) => {
  if (dragIndex === null) return;
  pointerY = e.clientY;
  if (autoScrollFrame === null) {
    autoScrollFrame = requestAnimationFrame(autoScrollStep);
  }
});

function resetToCatalogOrder() {
  items = catalog.map((img) => ({
    name: img.name,
    thumb: `images/thumbs/${img.name}.jpg`,
  }));
  renderCanvas();
  setStatus("Unsaved changes", true);
}

function buildPlacementJSON() {
  return JSON.stringify(items.map((item) => item.name), null, 2) + "\n";
}

async function savePlacement() {
  const data = buildPlacementJSON();

  if (window.showSaveFilePicker) {
    try {
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: "placement.json",
          types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
        });
      }
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      setStatus("Saved", false);
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("Save failed — downloaded instead", true);
    }
  }

  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "placement.json";
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus("Downloaded placement.json", false);
}

saveBtn.addEventListener("click", savePlacement);
resetBtn.addEventListener("click", resetToCatalogOrder);

window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

loadData().then((data) => {
  items = data;
  renderCanvas();
  setStatus("Loaded", false);
});
