async function loadGlossary() {
  const accordion = document.getElementById("accordion");
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  try {
    const res = await fetch("glossary.txt", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = [];
    for (let i = 0; i < lines.length; i += 2) {
      const term = lines[i];
      const desc = lines[i + 1] || "";
      if (term) items.push({ term, desc });
    }

    if (!items.length) throw new Error("Keine Glossar-Einträge gefunden.");

    accordion.innerHTML = items.map((item, idx) => `
      <div class="accordion-item">
        <button class="accordion-header" aria-expanded="false" aria-controls="panel-${idx}" id="accordion-${idx}">
          <span>${item.term}</span>
          <span class="chevron">▼</span>
        </button>
        <div class="accordion-panel" id="panel-${idx}" role="region" aria-labelledby="accordion-${idx}">
          <p>${item.desc}</p>
        </div>
      </div>
    `).join("");

    accordion.addEventListener("click", (e) => {
      const header = e.target.closest(".accordion-header");
      if (!header) return;
      const expanded = header.getAttribute("aria-expanded") === "true";
      header.setAttribute("aria-expanded", String(!expanded));
      header.classList.toggle("open", !expanded);
      const chevron = header.querySelector(".chevron");
      if (chevron) chevron.textContent = expanded ? "▼" : "▲";
      const panel = document.getElementById(header.getAttribute("aria-controls"));
      if (panel) panel.style.maxHeight = expanded ? null : panel.scrollHeight + "px";
    });

  } catch (err) {
    console.error(err);
    error.hidden = false;
  } finally {
    loading.hidden = true;
  }
}

document.addEventListener("DOMContentLoaded", loadGlossary);
