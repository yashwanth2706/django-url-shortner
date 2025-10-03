    document.getElementById("my_urls").addEventListener("click", function() {
        const recenturl = document.getElementById("my_urls").dataset.recentUrlsUrl;
        fetch(recenturl)
          .then(response => response.json())
          .then(data => {
            const container = document.getElementById("recent-urls-list");
            container.textContent = ""; // Clear previous content

            if (data.urls && data.urls.length > 0) {
              data.urls.forEach(url => {
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
    // Inline Edit logic
    const renameBtn = createBtn("btn btn-sm btn-primary", "Rename URL", "bi bi-pencil");
    const editBtn = createBtn("btn btn-sm btn-info", "Edit URL", "bi bi-gear");
                btnGroup.appendChild(renameBtn);
                btnGroup.appendChild(editBtn);
                btnGroup.appendChild(createBtn("btn btn-sm btn-secondary", "Generate QR Code", "bi bi-qr-code"));
                btnGroup.appendChild(createBtn("btn btn-sm btn-success", "Share URL", "bi bi-share"));
                btnGroup.appendChild(createBtn("btn btn-sm btn-success copy-url-btn", "Copy URL", "bi bi-clipboard", { "data-url": url.short_url }));
                btnGroup.appendChild(createBtn("btn btn-sm btn-danger", "Delete URL", "bi bi-trash"));

                cardBody.appendChild(h6);
                cardBody.appendChild(pOriginal);
                cardBody.appendChild(pCreated);
                cardBody.appendChild(btnGroup);
                card.appendChild(cardBody);
                container.appendChild(card);

// Rename Short URL inline
renameBtn.addEventListener("click", () => {
    makeInlineEditable(h6, url.short_url.replace(/^https?:\/\//, ""), (newVal, showError) => {
        fetch(`/edit-short-url/${url.id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            body: new URLSearchParams({ short_code: newVal })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                showError(data.error);
            } else {
                h6.innerHTML = `<a href="/${data.short_url}" target="_blank">${data.short_url}</a>`;
            }
        })
        .catch(() => showError("Something went wrong"));
    });
});

// Edit Long URL inline
editBtn.addEventListener("click", () => {
    makeInlineEditable(pOriginal, url.original_url, (newVal, showError) => {
        fetch(`/edit-long-url/${url.id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            body: new URLSearchParams({ original_url: newVal })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                showError(data.error);
            } else {
                pOriginal.textContent = data.original_url;
            }
        })
        .catch(() => showError("Something went wrong"));
    });
});
// Django bydefault provides a crsf_tocken inside cookie
// this function call method is helpful if willing to port from template based webpage to framework based webpage
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
              });

              // Re-initialize tooltips for new elements
              const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
              tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

              // Copy URL button handler
              container.querySelectorAll(".copy-url-btn").forEach(btn => {
                btn.addEventListener("click", async function() {
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
            alert(e);
            container.appendChild(errorDiv);
          });
      });