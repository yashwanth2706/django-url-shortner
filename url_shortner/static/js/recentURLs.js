// Django CSRF token helper
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.getElementById("my_urls").addEventListener("click", function () {
  const recenturl = document.getElementById("my_urls").dataset.recentUrlsUrl;
  const modalEl = document.getElementById("editUrlModal");
  const editModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const modalTitle = document.getElementById("modalTitle");
  const modalLabel = document.getElementById("modalLabel");
  const modalInput = document.getElementById("editInputValue");
  const modalError = document.getElementById("modalError");
  const modalForm = document.getElementById("editUrlForm");

  let currentEdit = null; // Tracks which field is being edited

  fetch(recenturl)
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("recent-urls-list");
      container.textContent = ""; // Clear previous content

      if (data.urls && data.urls.length > 0) {
        data.urls.forEach((url) => {
          // Format created_at as "x days ago"
          function timeAgo(dateStr) {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "1 day ago";
            return `${diffDays} days ago`;
          }

          // Card
          const card = document.createElement("div");
          card.className = "card mb-3";

          const cardBody = document.createElement("div");
          cardBody.className = "card-body";

          // Short URL
          const h6 = document.createElement("h6");
          h6.className = "mb-1";
          const a = document.createElement("a");
          a.href = url.short_url;
          a.target = "_blank";
          a.textContent = url.short_url.replace(/^https?:\/\//, "");
          h6.appendChild(a);

          // Original URL
          const pOriginal = document.createElement("p");
          pOriginal.className = "text-muted small mb-2";
          pOriginal.textContent = url.original_url;

          // Created at
          const pCreated = document.createElement("p");
          pCreated.className = "text-muted small";
          pCreated.textContent = timeAgo(url.created_at);

          // Button group
          const btnGroup = document.createElement("div");
          btnGroup.className = "d-flex flex-wrap gap-2";

          // Helper to create buttons
          function createBtn(className, tooltip, iconClass, extra = {}) {
            const btn = document.createElement("button");
            btn.className = className;
            btn.type = "button";
            btn.setAttribute("data-bs-toggle", "tooltip");
            btn.setAttribute("data-bs-title", tooltip);
            if (extra["data-url"]) btn.setAttribute("data-url", extra["data-url"]);
            const icon = document.createElement("i");
            icon.className = iconClass;
            btn.appendChild(icon);
            return btn;
          }

          // Buttons
          const renameBtn = createBtn("btn btn-sm btn-primary", "Rename Short URL", "bi bi-pencil");
          const editBtn = createBtn("btn btn-sm btn-info", "Edit Long URL", "bi bi-gear");
          const qrBtn = createBtn("btn btn-sm btn-secondary", "Generate QR Code", "bi bi-qr-code");
          const shareBtn = createBtn("btn btn-sm btn-success", "Share URL", "bi bi-share");
          const copyBtn = createBtn("btn btn-sm btn-success copy-url-btn", "Copy URL", "bi bi-clipboard", {
            "data-url": url.short_url,
          });
          const deleteBtn = createBtn("btn btn-sm btn-danger", "Delete URL", "bi bi-trash");

          btnGroup.append(renameBtn, editBtn, qrBtn, shareBtn, copyBtn, deleteBtn);

          cardBody.append(h6, pOriginal, pCreated, btnGroup);
          card.append(cardBody);
          container.append(card);

          // === Modal-based Edit Logic ===

          renameBtn.addEventListener("click", () => {
            modalTitle.textContent = "Rename Short URL";
            modalLabel.textContent = "New alias:";
            modalInput.value = url.short_url.replace(/^https?:\/\//, "");
            modalError.classList.add("d-none");
            currentEdit = { type: "short", id: url.id, el: h6 };
            safeShowModal();
          });

          editBtn.addEventListener("click", () => {
            modalTitle.textContent = "Edit Original URL";
            modalLabel.textContent = "New URL:";
            modalInput.value = url.original_url;
            modalError.classList.add("d-none");
            currentEdit = { type: "long", id: url.id, el: pOriginal };
            safeShowModal();
          });
        });

        // === Safely show modal to avoid frozen backdrop ===
        function safeShowModal() {
          // Use Bootstrap's data API trigger to ensure proper backdrop handling
          const triggerBtn = document.createElement("button");
          triggerBtn.type = "button";
          triggerBtn.setAttribute("data-bs-toggle", "modal");
          triggerBtn.setAttribute("data-bs-target", "#editUrlModal");
          triggerBtn.style.display = "none";
          document.body.appendChild(triggerBtn);
          triggerBtn.click();
          triggerBtn.remove();
        }

        // Autofocus input when modal opens
        modalEl.addEventListener("shown.bs.modal", () => {
          modalInput.focus();
        });

        // Cleanup when modal closes (prevents gray unclickable overlay)
        modalEl.addEventListener("hidden.bs.modal", () => {
          document.body.classList.remove("modal-open");
          document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
          modalError.classList.add("d-none");
          modalError.textContent = "";
        });

        // Submit Handler for Modal Form
        modalForm.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!currentEdit) return;

          const newVal = modalInput.value.trim();
          if (!newVal) {
            modalError.textContent = "Value cannot be empty.";
            modalError.classList.remove("d-none");
            return;
          }

          const endpoint =
            currentEdit.type === "short"
              ? `/edit-short-url/${currentEdit.id}/`
              : `/edit-long-url/${currentEdit.id}/`;

          const bodyField =
            currentEdit.type === "short"
              ? { short_code: newVal }
              : { original_url: newVal };

          fetch(endpoint, {
            method: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            body: new URLSearchParams(bodyField),
          })
            .then((res) => res.json())
            .then((data) => {
              if (!data.success) {
                modalError.textContent = data.error || "Failed to update.";
                modalError.classList.remove("d-none");
              } else {
                if (currentEdit.type === "short") {
                  currentEdit.el.innerHTML = `<a href="/${data.short_url}" target="_blank">${data.short_url}</a>`;
                } else {
                  currentEdit.el.textContent = data.original_url;
                }
                editModal.hide();
              }
            })
            .catch(() => {
              modalError.textContent = "Something went wrong.";
              modalError.classList.remove("d-none");
            });
        });

        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));

        // Copy URL button handler
        container.querySelectorAll(".copy-url-btn").forEach((btn) => {
          btn.addEventListener("click", async function () {
            try {
              await navigator.clipboard.writeText(btn.getAttribute("data-url"));
              const tooltip = bootstrap.Tooltip.getInstance(btn);
              btn.setAttribute("data-bs-original-title", "Copied!");
              tooltip.show();
              setTimeout(() => {
                btn.setAttribute("data-bs-original-title", "Copy URL");
              }, 2000);
            } catch (err) {
              alert("Failed to copy");
            }
          });
        });
      } else {
        const noUrlsDiv = document.createElement("div");
        noUrlsDiv.className = "text-muted";
        noUrlsDiv.textContent = "No recent URLs found.";
        container.appendChild(noUrlsDiv);
      }
    })
    .catch((e) => {
      const container = document.getElementById("recent-urls-list");
      container.textContent = "";
      const errorDiv = document.createElement("div");
      errorDiv.className = "text-danger";
      errorDiv.textContent = `${e}`;
      container.appendChild(errorDiv);
    });
});
