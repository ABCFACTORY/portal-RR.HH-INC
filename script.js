document.addEventListener("DOMContentLoaded", () => {

  // Abrir modales
  document.querySelectorAll("[data-modal-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-modal-target");
      const modal = document.getElementById(id);
      if (modal) modal.classList.remove("modal-hidden");
    });
  });

  // Cerrar modales
  document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-container");
      modal.classList.add("modal-hidden");
    });
  });

  // Buscar tarjetas
  const searchInput = document.getElementById("search-input");
  const cards = document.querySelectorAll(".topic-card");
  searchInput?.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    cards.forEach(card => {
      const text = card.getAttribute("data-search-content").toLowerCase();
      const title = card.querySelector("h3").textContent.toLowerCase();
      card.style.display = (text.includes(filter) || title.includes(filter))
        ? "flex" : "none";
    });
  });

  // Guardar formularios en localStorage
  document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const list = JSON.parse(localStorage.getItem("formularios") || "[]");
      list.push({ ...data, fecha: new Date().toLocaleString() });
      localStorage.setItem("formularios", JSON.stringify(list));
      alert("Formulario enviado correctamente ✅");
      form.reset();
      form.closest(".modal-container").classList.add("modal-hidden");
    });
  });
});
