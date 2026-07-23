
const INITIAL_VISIBLE_LIMIT = 8;
const WELCOME_MESSAGE =
  "Hi! I’m your L'Oréal Routine Coach. Search the product catalog, add products to your shelf, and I’ll organize them into a routine you can ask questions about.";
const ADVISOR_LABEL = "Routine Coach";

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-pressed", selectedIds.has(product.id) ? "true" : "false");
  card.setAttribute("aria-label", `${selectedIds.has(product.id) ? "Unselect" : "Select"} ${product.name}`);
  if (selectedIds.has(product.id)) card.classList.add("selected");

  card.innerHTML = `
    <span class="selection-mark" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
    <div class="product-image-wrap">
      <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" />
    </div>
    <div class="product-card-body">
      <p class="product-brand">${escapeHTML(product.brand)}</p>
      <h4>${escapeHTML(product.name)}</h4>
      <span class="category-pill">${escapeHTML(formatCategory(product.category))}</span>
      <details class="product-details">
        <summary>Why it fits</summary>
        <p>${escapeHTML(product.description)}</p>
      </details>
    </div>`;

  const details = card.querySelector(".product-details");
  details.addEventListener("click", (event) => event.stopPropagation());
  details.addEventListener("keydown", (event) => event.stopPropagation());

  card.addEventListener("click", () => toggleProduct(product.id));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleProduct(product.id);
    }
  });

  return card;
}


const WORKER_URL = "https://sky.mr2075.workers.dev/";

const STORAGE_KEYS = {
  selected: "lorealRoutineSelectedProducts",
  direction: "lorealRoutineDirection",
  webSearch: "lorealRoutineWebSearch",
};

let allProducts = [];
let selectedIds = new Set();
let conversationHistory = [];
let visibleLimit = INITIAL_VISIBLE_LIMIT;
let routineGenerated = false;

const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const resultsCount = document.getElementById("resultsCount");
const showMoreBtn = document.getElementById("showMoreBtn");
const selectedProductsList = document.getElementById("selectedProductsList");
const selectedCount = document.getElementById("selectedCount");
const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");
const generateRoutineBtn = document.getElementById("generateRoutine");
const routineStatus = document.getElementById("routineStatus");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");
const webSearchToggle = document.getElementById("webSearchToggle");
const rtlToggle = document.getElementById("rtlToggle");
const clearChatBtn = document.getElementById("clearChatBtn");
const currentYear = document.getElementById("currentYear");

currentYear.textContent = new Date().getFullYear();
restorePreferences();
loadProducts();
showWelcomeMessage();

async function loadProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("products.json could not be loaded.");

    const data = await response.json();
    allProducts = Array.isArray(data.products) ? data.products : [];

    populateCategories();
    restoreSelectedProducts();
    renderProducts();
    renderSelectedProducts();
  } catch (error) {
    productsContainer.innerHTML = `<p class="empty-state error-state">${escapeHTML(
      error.message
    )}</p>`;
  }
}

function populateCategories() {
  const categories = [...new Set(allProducts.map((product) => product.category))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = formatCategory(category);
    categoryFilter.appendChild(option);
  });
}

function getFilteredProducts() {
  const searchTerm = productSearch.value.trim().toLowerCase();
  const category = categoryFilter.value;

  return allProducts.filter((product) => {
    const searchableText = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const matchesCategory = !category || product.category === category;
    return matchesSearch && matchesCategory;
  });
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  const visibleProducts = filteredProducts.slice(0, visibleLimit);

  resultsCount.textContent = `${filteredProducts.length} product${
    filteredProducts.length === 1 ? "" : "s"
  } found`;

  productsContainer.innerHTML = "";

  if (visibleProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="empty-state">
        <strong>No matching products</strong>
        <span>Try a different search word or category.</span>
      </div>`;
  } else {
    visibleProducts.forEach((product) => {
      productsContainer.appendChild(createProductCard(product));
    });
  }

  showMoreBtn.hidden = visibleProducts.length >= filteredProducts.length;
  showMoreBtn.textContent = `Show more products (${filteredProducts.length - visibleProducts.length})`;
}

function toggleProduct(productId) {
  if (selectedIds.has(productId)) {
    selectedIds.delete(productId);
  } else {
    selectedIds.add(productId);
  }

  saveSelectedProducts();
  renderProducts();
  renderSelectedProducts();

  if (routineGenerated) {
    routineStatus.textContent =
      "Your product choices changed. Generate the routine again to update it.";
    routineStatus.classList.add("needs-update");
  }
}

function renderSelectedProducts() {
  const selectedProducts = getSelectedProducts();
  selectedProductsList.innerHTML = "";
  selectedCount.textContent = selectedProducts.length;

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty">Select product cards to build your routine.</p>`;
  } else {
    selectedProducts.forEach((product) => {
      const item = document.createElement("div");
      item.className = "selected-item";

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = "";

      const text = document.createElement("div");
      const brand = document.createElement("span");
      brand.textContent = product.brand;
      const name = document.createElement("strong");
      name.textContent = product.name;
      text.append(brand, name);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-selected";
      removeButton.setAttribute("aria-label", `Remove ${product.name}`);
      removeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      removeButton.addEventListener("click", () => toggleProduct(product.id));

      item.append(image, text, removeButton);
      selectedProductsList.appendChild(item);
    });
  }

  const hasSelection = selectedProducts.length > 0;
  generateRoutineBtn.disabled = !hasSelection;
  clearSelectionsBtn.disabled = !hasSelection;
}

function getSelectedProducts() {
  return allProducts.filter((product) => selectedIds.has(product.id));
}

function saveSelectedProducts() {
  try {
    localStorage.setItem(STORAGE_KEYS.selected, JSON.stringify([...selectedIds]));
  } catch (error) {
    console.warn("Selections could not be saved.", error);
  }
}

function restoreSelectedProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.selected) || "[]");
    const validIds = new Set(allProducts.map((product) => product.id));
    selectedIds = new Set(saved.filter((id) => validIds.has(id)));
  } catch (error) {
    selectedIds = new Set();
  }
}

function restorePreferences() {
  const savedDirection = localStorage.getItem(STORAGE_KEYS.direction);
  setDirection(savedDirection === "rtl" ? "rtl" : "ltr", false);

  const savedWebSearch = localStorage.getItem(STORAGE_KEYS.webSearch);
  webSearchToggle.checked = savedWebSearch !== "false";
}

function setDirection(direction, save = true) {
  document.documentElement.dir = direction;
  document.documentElement.lang = direction === "rtl" ? "ar" : "en";
  rtlToggle.setAttribute("aria-pressed", direction === "rtl" ? "true" : "false");
  rtlToggle.innerHTML = direction === "rtl"
    ? '<i class="fa-solid fa-left-long" aria-hidden="true"></i><span>LTR layout</span>'
    : '<i class="fa-solid fa-language" aria-hidden="true"></i><span>RTL layout</span>';

  if (save) localStorage.setItem(STORAGE_KEYS.direction, direction);
}

function showWelcomeMessage() {
  addMessage("assistant", WELCOME_MESSAGE);
}

function addMessage(role, message, options = {}) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;
  if (options.isError) row.classList.add("error");

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : ADVISOR_LABEL;

  const content = document.createElement("div");
  content.className = "message-content";

  if (role === "assistant" && options.annotations?.length) {
    renderCitedText(content, message, options.annotations);
  } else {
    content.textContent = message;
  }

  bubble.append(label, content);

  if (options.webSearchUsed) {
    const badge = document.createElement("span");
    badge.className = "web-result-badge";
    badge.innerHTML = '<i class="fa-solid fa-globe" aria-hidden="true"></i> Live web search';
    bubble.appendChild(badge);
  }

  if (options.warning) {
    const warning = document.createElement("small");
    warning.className = "message-warning";
    warning.textContent = options.warning;
    bubble.appendChild(warning);
  }

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

function renderCitedText(container, text, annotations) {
  const citations = annotations
    .map(normalizeCitation)
    .filter((citation) => citation.url)
    .sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));

  let cursor = 0;
  let usedInlineCitation = false;

  citations.forEach((citation) => {
    const start = Number(citation.startIndex);
    const end = Number(citation.endIndex);

    if (
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= cursor &&
      end > start &&
      end <= text.length
    ) {
      container.append(document.createTextNode(text.slice(cursor, start)));
      const link = document.createElement("a");
      link.href = citation.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "inline-citation";
      link.textContent = text.slice(start, end);
      link.title = citation.title || "Open source";
      container.appendChild(link);
      cursor = end;
      usedInlineCitation = true;
    }
  });

  if (usedInlineCitation) {
    container.append(document.createTextNode(text.slice(cursor)));
  } else {
    container.textContent = text;
  }

  const uniqueSources = [];
  const seenUrls = new Set();
  citations.forEach((citation) => {
    if (!seenUrls.has(citation.url)) {
      seenUrls.add(citation.url);
      uniqueSources.push(citation);
    }
  });

  if (uniqueSources.length) {
    const sources = document.createElement("div");
    sources.className = "sources-list";
    const heading = document.createElement("strong");
    heading.textContent = "Sources";
    sources.appendChild(heading);

    uniqueSources.slice(0, 5).forEach((citation, index) => {
      const link = document.createElement("a");
      link.href = citation.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = citation.title || `Source ${index + 1}`;
      sources.appendChild(link);
    });

    container.appendChild(sources);
  }
}

function normalizeCitation(annotation) {
  const citation = annotation?.url_citation || annotation || {};
  return {
    url: citation.url || "",
    title: citation.title || "",
    startIndex: citation.start_index,
    endIndex: citation.end_index,
  };
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.id = "typingIndicator";
  row.innerHTML = `
    <div class="message-bubble typing-bubble" aria-label="${ADVISOR_LABEL} is typing">
      <span class="message-label">${ADVISOR_LABEL}</span>
      <span class="typing-dots"><span></span><span></span><span></span></span>
    </div>`;
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

function setLoading(isLoading) {
  generateRoutineBtn.disabled = isLoading || selectedIds.size === 0;
  sendBtn.disabled = isLoading;
  userInput.disabled = isLoading;
  clearChatBtn.disabled = isLoading;
  generateRoutineBtn.classList.toggle("is-loading", isLoading);
}

async function requestAssistantReply() {
  if (WORKER_URL.includes("PASTE_YOUR")) {
    throw new Error(
      "Paste your deployed Cloudflare Worker URL at the top of script.js first."
    );
  }

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: conversationHistory.slice(-24),
      useWebSearch: webSearchToggle.checked,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The Worker returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || "The request failed.");
  }

  const message = data?.choices?.[0]?.message;
  if (!message?.content) {
    throw new Error("The AI returned an empty response.");
  }

  return {
    text: message.content.trim(),
    annotations: message.annotations || [],
    webSearchUsed: data.webSearchUsed === true,
    warning: data.warning || "",
  };
}

async function sendConversationMessage(displayText, historyText = displayText) {
  addMessage("user", displayText);
  conversationHistory.push({ role: "user", content: historyText });

  setLoading(true);
  const typingIndicator = addTypingIndicator();

  try {
    const reply = await requestAssistantReply();
    typingIndicator.remove();
    addMessage("assistant", reply.text, reply);
    conversationHistory.push({ role: "assistant", content: reply.text });
    return true;
  } catch (error) {
    typingIndicator.remove();
    addMessage("assistant", `Sorry, I could not complete that request. ${error.message}`, {
      isError: true,
    });
    return false;
  } finally {
    setLoading(false);
    userInput.focus();
  }
}

productSearch.addEventListener("input", () => {
  visibleLimit = INITIAL_VISIBLE_LIMIT;
  renderProducts();
});

categoryFilter.addEventListener("change", () => {
  visibleLimit = INITIAL_VISIBLE_LIMIT;
  renderProducts();
});

showMoreBtn.addEventListener("click", () => {
  visibleLimit += INITIAL_VISIBLE_LIMIT;
  renderProducts();
});

clearSelectionsBtn.addEventListener("click", () => {
  selectedIds.clear();
  saveSelectedProducts();
  renderProducts();
  renderSelectedProducts();
  routineStatus.textContent = "Selections cleared.";
  routineStatus.classList.remove("needs-update");
});

generateRoutineBtn.addEventListener("click", async () => {
  const selectedProducts = getSelectedProducts();
  if (!selectedProducts.length) return;

  const productData = selectedProducts.map(({ id, brand, name, category, description }) => ({
    id,
    brand,
    name,
    category,
    description,
  }));

  const prompt = `Create a personalized routine using ONLY the selected products in this JSON data:\n${JSON.stringify(
    productData,
    null,
    2
  )}\n\nGive the steps in a safe and useful order. Separate morning, evening, weekly, hair, makeup, or fragrance steps when they apply. Explain how each selected product fits. Do not add products that are not in the JSON.`;

  const displayText = `Generate a routine with ${selectedProducts.length} selected product${
    selectedProducts.length === 1 ? "" : "s"
  }.`;

  routineStatus.textContent = "Creating your personalized routine…";
  routineStatus.classList.remove("needs-update");
  const success = await sendConversationMessage(displayText, prompt);

  if (success) {
    routineGenerated = true;
    routineStatus.textContent =
      "Routine generated. You can ask follow-up questions in the chat.";
  } else {
    routineStatus.textContent = "The routine could not be generated yet.";
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  userInput.value = "";
  await sendConversationMessage(question);
});

clearChatBtn.addEventListener("click", () => {
  conversationHistory = [];
  routineGenerated = false;
  chatWindow.innerHTML = "";
  routineStatus.textContent = "Conversation cleared. Your selected products are still saved.";
  routineStatus.classList.remove("needs-update");
  showWelcomeMessage();
});

webSearchToggle.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEYS.webSearch, String(webSearchToggle.checked));
});

rtlToggle.addEventListener("click", () => {
  const nextDirection = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
  setDirection(nextDirection);
});

function formatCategory(category) {
  return category
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
