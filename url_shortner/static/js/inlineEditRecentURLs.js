function makeInlineEditable(targetEl, initialValue, saveHandler) {
    // Clear target element
    targetEl.innerHTML = "";

    // Input field
    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control form-control-sm d-inline-block w-auto";
    input.value = initialValue;

    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-sm btn-success ms-2";
    saveBtn.innerHTML = '<i class="bi bi-check"></i>';

    // Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-sm btn-secondary ms-1";
    cancelBtn.innerHTML = '<i class="bi bi-x"></i>';

    targetEl.appendChild(input);
    targetEl.appendChild(saveBtn);
    targetEl.appendChild(cancelBtn);

    // Handle Save
    saveBtn.addEventListener("click", () => {
        saveHandler(input.value);
    });

    // Handle Cancel -> revert
    cancelBtn.addEventListener("click", () => {
        targetEl.innerHTML = initialValue; // just restore original text
    });
}