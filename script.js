// script.js
// ---------------
// 1) Load a single "sets.json" manifest to discover folder structure.
// 2) Build a nested tree on the left.
// 3) When the user clicks a leaf, fetch that JSON file (array of {q,a}).
// 4) Shuffle, display cards; allow click‐to‐flip, require flip before “Next”.
// ---------------

let manifest = {};
let currentCards = [];
let currentIndex = 0;

// Utility: Fisher–Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Fetch and parse the manifest file ('sets/sets.json').
async function loadManifest() {
  try {
    const resp = await fetch("sets/sets.json");
    if (!resp.ok) throw new Error("Could not load sets.json");
    manifest = await resp.json();
    buildTree(manifest, document.getElementById("tree-root"));
  } catch (err) {
    console.error(err);
    document.getElementById("tree-root").textContent = "Error loading sets.";
  }
}

// Recursively build a nested <ul> / <li> tree from the manifest object.
// If value is a string → treat as leaf (path to JSON file).
function buildTree(obj, container, path = []) {
    const ul = document.createElement("ul");
    Object.entries(obj).forEach(([key, value]) => {
      const li = document.createElement("li");
      li.textContent = key;
      if (typeof value === "string") {
        li.classList.add("leaf");
        li.addEventListener("click", (e) => {
          e.stopPropagation();
          // Pass the full path to loadFlashcards
          loadFlashcards(value, [...path, key].join(" > "));
        });
      } else {
        li.addEventListener("click", (e) => {
          e.stopPropagation();
          const isExpanded = li.classList.toggle("expanded");
          li.querySelector("ul").style.display = isExpanded ? "block" : "none";
        });
        // Pass the current path to child nodes
        buildTree(value, li, [...path, key]);
      }
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

// Fetch a single set (JSON array), shuffle it, and start the quiz.
async function loadFlashcards(path, fullPath) {
    try {
      const resp = await fetch(`sets/${path}`);
      if (!resp.ok) throw new Error(`Could not load ${path}`);
      const data = await resp.json();
      currentCards = data.slice();
      shuffle(currentCards);
      currentIndex = 0;
  
      // Show title and UI
      document.getElementById("set-title").textContent = fullPath;
      showFlashcardUI();
      renderCard();
    } catch (err) {
      console.error(err);
      alert("Failed to load flashcards: " + err.message);
    }
  }

// Show/hide appropriate containers
function showFlashcardUI() {
  document.getElementById("set-selector").style.display = "none";
  document.getElementById("flashcard-container").style.display = "flex";
}

// Return to selector once finished
function resetToSelector() {
  document.getElementById("flashcard-container").style.display = "none";
  document.getElementById("set-selector").style.display = "block";
}

function renderCard() {
    const cardObj = currentCards[currentIndex];
    const cardDiv = document.getElementById("card");
    cardDiv.classList.remove("flipped");
    cardDiv.querySelector(".front").textContent = cardObj.question;
    cardDiv.querySelector(".back").textContent = cardObj.answer;
    document.getElementById("next-btn").disabled = true;
  }
  
  function attachEvents() {
    const cardDiv = document.getElementById("card");
    const nextBtn = document.getElementById("next-btn");
    const backBtn = document.getElementById("back-btn");
  
    // Flip toggle on click; enable Next only when showing back side
    cardDiv.addEventListener("click", () => {
      cardDiv.classList.toggle("flipped");
      nextBtn.disabled = !cardDiv.classList.contains("flipped");
    });
  
    nextBtn.addEventListener("click", () => {
      currentIndex++;
      if (currentIndex >= currentCards.length) {
        resetToSelector();
      } else {
        renderCard();
      }
    });
  
    // “Back” returns to set‐selector immediately
    backBtn.addEventListener("click", () => {
      resetToSelector();
    });
  }

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  loadManifest();
  attachEvents();
});
