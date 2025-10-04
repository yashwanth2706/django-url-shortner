  document.addEventListener('DOMContentLoaded', function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
  })

      document.addEventListener("DOMContentLoaded", () => {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

      const copyBtn = document.getElementById("copyBtn");
      if(copyBtn){
        copyBtn.addEventListener("click", async () => {
          const shortUrl = document.getElementById("shortUrlResult").value;
          try {
            await navigator.clipboard.writeText(shortUrl);
            const tooltip = bootstrap.Tooltip.getInstance(copyBtn);
            copyBtn.setAttribute("data-bs-original-title", "Copied!");
            tooltip.show();
            setTimeout(() => {
              copyBtn.setAttribute("data-bs-original-title", "Copy");
            }, 2000);
          } catch (err) {
            alert("Failed to copy");
          }
        });
      }
    });