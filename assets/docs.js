"use strict";

const input = document.querySelector("#docs-search");
const results = document.querySelector("#search-results");
let indexPromise;

function closeSearch() {
  results.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

input.addEventListener("input", async () => {
  const query = input.value.trim().toLowerCase();
  if (query.length < 2) return closeSearch();
  try {
    indexPromise ??= fetch("search-index.json").then(response => {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    });
    const index = await indexPromise;
    if (input.value.trim().toLowerCase() !== query) return;
    const terms = query.split(/\s+/);
    const matches = index.filter(page => terms.every(term =>
      `${page.title} ${page.text}`.toLowerCase().includes(term)
    )).sort((a, b) => Number(b.title.toLowerCase().includes(query)) - Number(a.title.toLowerCase().includes(query))).slice(0, 7);
    results.replaceChildren();
    for (const page of matches) {
      const link = document.createElement("a");
      link.href = page.href;
      const title = document.createElement("strong");
      title.textContent = page.title;
      const snippet = document.createElement("span");
      const start = Math.max(0, page.text.toLowerCase().indexOf(terms[0]) - 35);
      snippet.textContent = `${start ? "…" : ""}${page.text.slice(start, start + 155)}…`;
      link.append(title, snippet);
      results.append(link);
    }
    if (!matches.length) {
      const message = document.createElement("p");
      message.textContent = "No matching pages. Try a flag, platform or workflow.";
      results.append(message);
    }
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  } catch {
    results.replaceChildren();
    const message = document.createElement("p");
    message.textContent = "Search is unavailable. Use the documentation navigation.";
    results.append(message);
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
});

input.addEventListener("keydown", event => {
  if (event.key === "ArrowDown" && !results.hidden) {
    event.preventDefault();
    results.querySelector("a")?.focus();
  }
});
results.addEventListener("keydown", event => {
  const links = [...results.querySelectorAll("a")];
  const position = links.indexOf(document.activeElement);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    links[Math.min(position + 1, links.length - 1)]?.focus();
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (position > 0) links[position - 1].focus();
    else input.focus();
  }
});

const menu = document.querySelector("#menu-toggle");
menu.addEventListener("click", () => {
  const opened = document.body.classList.toggle("menu-open");
  menu.setAttribute("aria-expanded", String(opened));
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    input.focus();
  }
  if (event.key === "Escape") {
    closeSearch();
    document.body.classList.remove("menu-open");
    menu.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest(".search-wrap")) closeSearch();
});

for (const block of document.querySelectorAll("pre")) {
  const code = block.querySelector("code");
  if (!code) continue;
  const button = document.createElement("button");
  button.className = "copy-button";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy code example");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "Copied";
      document.querySelector("#copy-status").textContent = "Code copied to clipboard.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Selected";
      document.querySelector("#copy-status").textContent = "Code selected. Copy it using your keyboard.";
    }
    window.setTimeout(() => { button.textContent = "Copy"; }, 1800);
  });
  block.append(button);
}
