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

// Helper to format time as "x days ago"
function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
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
    const cardTemplate = document.getElementById("url-card-template"); // Reference the HTML template

    let currentEdit = null; // Tracks which field is being edited

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

    fetch(recenturl)
        .then((response) => response.json())
        .then((data) => {
            const container = document.getElementById("recent-urls-list");
            container.textContent = ""; // Clear previous content

            if (data.urls && data.urls.length > 0) {
                data.urls.forEach((url) => {
                    
                    // 1. Clone the template
                    const card = cardTemplate.content.cloneNode(true).querySelector(".url-card");
                    
                    // 2. Set ID and map elements
                    card.setAttribute('data-url-id', url.id);
                    const shortUrlDisplay = card.querySelector('.short-url-display'); // Parent H6
                    const shortUrlLink = card.querySelector('.short-url-link');
                    const pOriginal = card.querySelector('.original-url-display');
                    const pCreated = card.querySelector('.created-at-display');
                    
                    // 3. Populate data
                    const displayShort = url.short_url.replace(/^https?:\/\//, "");
                    shortUrlLink.href = url.short_url;
                    shortUrlLink.textContent = displayShort;
                    pOriginal.textContent = url.original_url;
                    pCreated.textContent = timeAgo(url.created_at);

                    // 4. Get buttons and set data attributes
                    const renameBtn = card.querySelector(".rename-btn");
                    const editBtn = card.querySelector(".edit-long-btn");
                    const copyBtn = card.querySelector(".copy-url-btn");
                    
                    copyBtn.setAttribute("data-url", url.short_url);

                    // 5. Attach event listeners
                    
                    renameBtn.addEventListener("click", () => {
                        modalTitle.textContent = "Rename Short URL";
                        modalLabel.textContent = "New alias:";
                        modalInput.value = displayShort;
                        modalError.classList.add("d-none");
                        // Use the H6 element (parent of the link) for updating after success
                        currentEdit = { type: "short", id: url.id, el: shortUrlDisplay, linkEl: shortUrlLink }; 
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

                    // (Attach listeners for qrBtn, shareBtn, deleteBtn here if needed)

                    // 6. Append the card
                    container.append(card);
                });

                // Autofocus input when modal opens (only attach once)
                modalEl.addEventListener("shown.bs.modal", () => {
                    modalInput.focus();
                }, { once: true }); // Use { once: true } to prevent multiple attachments

                // Cleanup when modal closes (only attach once)
                modalEl.addEventListener("hidden.bs.modal", () => {
                    document.body.classList.remove("modal-open");
                    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
                    modalError.classList.add("d-none");
                    modalError.textContent = "";
                }, { once: true });

                // Submit Handler for Modal Form (only attach once)
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
                                // Update the displayed content on success
                                if (currentEdit.type === "short") {
                                    // Update the text and the href of the anchor element
                                    currentEdit.linkEl.href = data.short_url;
                                    currentEdit.linkEl.textContent = data.short_url.replace(/^https?:\/\//, "");
                                } else {
                                    currentEdit.el.textContent = data.original_url;
                                }
                                editModal.hide();
                            }
                        })
                        .catch(() => {
                            modalError.textContent = "Something went wrong with the network request.";
                            modalError.classList.remove("d-none");
                        });
                });

                // Initialize tooltips on the newly created elements
                const tooltipTriggerList = [].slice.call(
                    container.querySelectorAll('[data-bs-toggle="tooltip"]')
                );
                tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));

                // Copy URL button handler (needs to be run every time new cards are loaded)
                container.querySelectorAll(".copy-url-btn").forEach((btn) => {
                    btn.addEventListener("click", async function () {
                        try {
                            await navigator.clipboard.writeText(btn.getAttribute("data-url"));
                            const tooltip = bootstrap.Tooltip.getInstance(btn);
                            btn.setAttribute("data-bs-original-title", "Copied!");
                            tooltip.show();
                            setTimeout(() => {
                                btn.setAttribute("data-bs-original-title", "Copy URL");
                                // Manually dispose/re-init to force tooltip refresh if necessary
                                // bootstrap.Tooltip.getInstance(btn).dispose(); 
                                // new bootstrap.Tooltip(btn);
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
            errorDiv.textContent = `Error fetching URLs: ${e.message}`;
            container.appendChild(errorDiv);
        });
});
