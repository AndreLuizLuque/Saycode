const codeInput = document.getElementById("codeInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const analysisContent = document.getElementById("analysisContent");
const languageSelect = document.getElementById("languageSelect");
const lineNumbers = document.getElementById("lineNumbers");
const loadingIndicator = document.getElementById("loadingIndicator");

function updateLineNumbers() {
  const lines = codeInput.value.split('\n').length;
  let lineNumbersHTML = '';
  for (let i = 1; i <= lines; i++) {
    lineNumbersHTML += i + '\n';
  }
  lineNumbers.textContent = lineNumbersHTML || '1';
}

function syncScroll() {
  lineNumbers.scrollTop = codeInput.scrollTop;
}

codeInput.addEventListener("input", updateLineNumbers);
codeInput.addEventListener("scroll", syncScroll);

function formatResponse(text) {
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

function setLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.add('active');
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <div class="btn-spinner"></div>
      Analisando...
    `;
  } else {
    loadingIndicator.classList.remove('active');
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      Analisar Código
    `;
  }
}

analyzeBtn.addEventListener("click", async () => {
  const code = codeInput.value;
  const language = languageSelect.value;

  if (!code.trim()) {
    analysisContent.innerHTML = `
      <div class="error-box">
        <h4>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Código não fornecido
        </h4>
        <p>Por favor, cole algum código no editor antes de analisar.</p>
      </div>
    `;
    return;
  }

  setLoading(true);
  analysisContent.innerHTML = `
    <div class="loading-message">
      <div class="loading-spinner"></div>
      <p>Analisando seu código...</p>
      <small>Isso pode levar até 20 segundos na primeira vez</small>
    </div>
  `;

  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/analisar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language })
    });

    const data = await response.json();
    
    if (data.result.startsWith("ERRO:")) {
      analysisContent.innerHTML = `
        <div class="error-box">
          <h4>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Erro
          </h4>
          <p>${data.result.replace("ERRO: ", "")}</p>
        </div>
      `;
    } else {
      analysisContent.innerHTML = `
        <div class="analysis-result">
          ${formatResponse(data.result)}
        </div>
      `;
    }

  } catch (error) {
    console.error("Erro:", error);
    analysisContent.innerHTML = `
      <div class="error-box">
        <h4>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Erro de Conexão
        </h4>
        <p>Não foi possível conectar ao servidor.</p>
        <small>Verifique se o backend está rodando com <code>npm start</code></small>
      </div>
    `;
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener("click", () => {
  codeInput.value = "";
  updateLineNumbers();
  analysisContent.innerHTML = `
    <div class="placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 13a7 7 0 0 1-14 0"></path>
        <path d="M12 22v-4"></path>
        <path d="M7 22h10"></path>
        <path d="M9 9a3 3 0 0 0-3 3"></path>
        <path d="M15 9a3 3 0 0 1 3 3"></path>
      </svg>
      <p>Cole seu código e clique em "Analisar Código" para receber uma análise detalhada</p>
    </div>
  `;
});

updateLineNumbers();