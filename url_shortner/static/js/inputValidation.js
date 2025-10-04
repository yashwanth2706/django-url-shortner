          function validateAliasInput(value) {
            // Only allow a-z, A-Z, 0-9, length 5-12
            const regex = /^[a-zA-Z0-9]{5,12}$/;
            return value === "" || regex.test(value);
          }

          function validateUrlInput(value) {
            // Basic URL validation (http/https, domain, etc.)
            const regex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
            return regex.test(value);
          }

          document.addEventListener("DOMContentLoaded", function() {
            const aliasInput = document.querySelector('[name="short_code"]');
            const errorDiv = document.getElementById("aliasError");
            const urlInput = document.querySelector('[name="original_url"]');
            const urlErrorDiv = document.getElementById("urlError");
            const form = document.getElementById("urlForm");

            if(aliasInput){
            aliasInput.addEventListener("input", function() {
              if (aliasInput.value.length > 0 && !validateAliasInput(aliasInput.value)) {
                errorDiv.textContent = "Alias must be 5-12 characters (letters and numbers only).";
                errorDiv.style.display = "block";
              } else {
                errorDiv.textContent = "";
                errorDiv.style.display = "none";
              }
            });
            }

            if(urlInput){
            urlInput.addEventListener("input", function() {
              if (!validateUrlInput(urlInput.value)) {
                urlErrorDiv.style.display = "block";
              } else {
                urlErrorDiv.style.display = "none";
              }
            });
            }

            if(form){
            form.addEventListener("submit", function(e){
              let valid = true;
              if(aliasInput && aliasInput.value.length > 0 && !validateAliasInput(aliasInput.value)){
                errorDiv.textContent = "Alias must be 5-12 characters (letters and numbers only).";
                errorDiv.style.display = "block";
                aliasInput.focus();
                valid = false;
              }
              if(urlInput && !validateUrlInput(urlInput.value)){
                urlErrorDiv.style.display = "block";
                urlInput.focus();
                valid = false;
              }
              if(!valid){
                e.preventDefault();
                return false;
              }
            });
            }
          });