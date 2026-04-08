const SHEET_ID = "1ShvndImW2blM-0wBnP7mJ5Riz8zzpvUFAoxlZzEhmNg";
const CATALOG_XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
const loginScreenEl = document.getElementById("loginScreen");
const mainAppEl = document.getElementById("mainApp");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const loginStatusEl = document.getElementById("loginStatus");

const CATALOG_SHEET_NAMES = {
  tractores: "TRACTORES",
  remolques: "REMOLQUES",
  licencias: "LICENCIAS",
  marcas: "MARCAS",
};

const EMPRESA_LOGO_URL = "https://drive.google.com/thumbnail?id=17pkobl5CWMAiRHwRdbAS_uMmrv634bK0&sz=w1000";

const state = {
  tractores: new Map(),
  remolques: new Map(),
  operadores: new Map(),
  marcas: new Map(),
  catalogsLoaded: false,
};

const localOperatorPhotos = {
  "ERNESTO CASTANEDA": "img/1.png",
  "JUAN PEREZ": "img/2.png",
};

const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const resultsEl = document.getElementById("results");
const individualResultEl = document.getElementById("individualResult");

const excelFileEl = document.getElementById("excelFile");
const processBtn = document.getElementById("processBtn");
const generarIndividualBtn = document.getElementById("generarIndividualBtn");

const operadorInput = document.getElementById("operadorInput");
const tractorInput = document.getElementById("tractorInput");
const remolqueInput = document.getElementById("remolqueInput");

const operadoresList = document.getElementById("operadoresList");
const tractoresList = document.getElementById("tractoresList");
const remolquesList = document.getElementById("remolquesList");

const btnVistaIndividual = document.getElementById("btnVistaIndividual");
const btnVistaMasiva = document.getElementById("btnVistaMasiva");
const vistaIndividual = document.getElementById("vistaIndividual");
const vistaMasiva = document.getElementById("vistaMasiva");

let operadorSeleccionadoValido = false;
let catalogsLoading = false;

bloquearFormularioIndividual(true);

btnVistaIndividual.addEventListener("click", async () => {
  cambiarVista("individual");
  bloquearFormularioIndividual(true);

  try {
    await cargarCatalogosSiEsNecesario();
    bloquearFormularioIndividual(false);
  } catch (error) {
    console.error(error);
    resetVistaIndividualPorError();
    setStatus(`Error cargando catálogos: ${error.message}`, "error");
  }
});

btnVistaMasiva.addEventListener("click", async () => {
  cambiarVista("masiva");

  try {
    await cargarCatalogosSiEsNecesario();
  } catch (error) {
    console.error(error);
    cambiarVista(null);
    setStatus(`Error cargando catálogos: ${error.message}`, "error");
  }
});

processBtn.addEventListener("click", processExcelFile);
generarIndividualBtn.addEventListener("click", generarFichaIndividual);

operadorInput.addEventListener("change", () => {
  const valor = operadorInput.value.trim();

  const existe =
    state.operadores.has(normalizeKey(valor)) ||
    state.operadores.has(normalizeKey(stripPrefix(valor)));

  if (existe) {
    operadorSeleccionadoValido = true;
    operadorInput.readOnly = true;
  } else {
    operadorSeleccionadoValido = false;
  }
});

operadorInput.addEventListener("click", () => {
  if (operadorInput.readOnly) {
    operadorInput.readOnly = false;
    operadorInput.value = "";
    operadorSeleccionadoValido = false;
  }
});

window.addEventListener("load", iniciarAutenticacion);

async function iniciarAutenticacion() {
  try {
    if (!window.ttcAuth) {
      throw new Error("Firebase Auth no esta disponible en window.ttcAuth");
    }

    if (!loginScreenEl || !mainAppEl || !googleLoginBtn || !loginStatusEl) {
      throw new Error("Faltan elementos de login en el HTML");
    }

    const { auth, provider, signInWithPopup, onAuthStateChanged } = window.ttcAuth;

    googleLoginBtn.addEventListener("click", async () => {
  try {
    googleLoginBtn.disabled = true;
    loginStatusEl.textContent = "Abriendo Google...";
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Firebase login error:", error);
    loginStatusEl.textContent =
      `No se pudo iniciar sesión: ${error.code || "sin-codigo"} | ${error.message || "sin-mensaje"}`;
  } finally {
    googleLoginBtn.disabled = false;
  }
});

    onAuthStateChanged(auth, (user) => {
      if (user) {
        loginScreenEl.style.display = "none";
        mainAppEl.style.display = "block";
        setStatus(`Sesión iniciada: ${user.email}`, "ok");
      } else {
        loginScreenEl.style.display = "flex";
        mainAppEl.style.display = "none";
        loginStatusEl.textContent = "";
      }
    });
  } catch (error) {
    console.error(error);
    if (loginStatusEl) {
      loginStatusEl.textContent = "Error inicializando autenticación.";
    }
  }
}

function cambiarVista(vista) {
  const esIndividual = vista === "individual";
  const esMasiva = vista === "masiva";

  vistaIndividual.classList.toggle("active", esIndividual);
  vistaMasiva.classList.toggle("active", esMasiva);

  btnVistaIndividual.classList.toggle("active", esIndividual);
  btnVistaMasiva.classList.toggle("active", esMasiva);
}

function bloquearFormularioIndividual(bloquear) {
  operadorInput.disabled = bloquear;
  tractorInput.disabled = bloquear;
  remolqueInput.disabled = bloquear;
  generarIndividualBtn.disabled = bloquear;
}

function resetVistaIndividualPorError() {
  cambiarVista(null);
  bloquearFormularioIndividual(true);

  operadorInput.value = "";
  tractorInput.value = "";
  remolqueInput.value = "";
  operadorInput.readOnly = false;
  operadorSeleccionadoValido = false;

  individualResultEl.innerHTML = "";
  btnVistaIndividual.blur();
  btnVistaMasiva.blur();
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type;
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function titleCase(text) {
  return String(text || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripPrefix(raw) {
  return String(raw || "").replace(/^\d+\s*-\s*/, "").trim();
}

function formatOperatorFromSystem(raw) {
  if (!raw) return "";

  const clean = stripPrefix(raw);
  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length >= 4) {
    const apellidos = parts.slice(0, 2);
    const nombres = parts.slice(2);
    return titleCase([...nombres, ...apellidos].join(" "));
  }

  return titleCase(clean);
}

function getFirst(row, keys) {
  for (const key of keys) {
    const normalized = normalizeHeader(key);
    if (row[normalized] !== undefined && row[normalized] !== null && row[normalized] !== "") {
      return row[normalized];
    }
  }
  return "";
}

function sheetToRowsWithHeaderRow(workbook, sheetName, headerRowIndexZeroBased) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`No se encontró la hoja "${sheetName}"`);
  }

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false
  });

  const headers = (matrix[headerRowIndexZeroBased] || []).map(normalizeHeader);
  const dataRows = matrix.slice(headerRowIndexZeroBased + 1);

  return dataRows.map(row => {
    const out = {};
    headers.forEach((header, index) => {
      if (header) {
        out[header] = row[index] ?? "";
      }
    });
    return out;
  });
}

function convertGoogleDriveImageUrl(url) {
  const text = String(url || "").trim();

  if (!text) return "";

  if (text.includes("drive.google.com/thumbnail")) {
    return text;
  }

  const fileMatch = text.match(/\/file\/d\/([^/]+)/i);
  if (fileMatch) {
    const fileId = fileMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  const idMatch = text.match(/[?&]id=([^&]+)/i);
  if (idMatch) {
    const fileId = idMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return text;
}

async function cargarCatalogosSiEsNecesario() {
  if (state.catalogsLoaded) return;
  if (catalogsLoading) return;

  catalogsLoading = true;

  try {
    setStatus("Cargando catálogos...", "muted-status");
    await ensureCatalogsLoaded();
    setStatus("Listo.", "ok");
  } finally {
    catalogsLoading = false;
  }
}

async function ensureCatalogsLoaded() {
  if (state.catalogsLoaded) return;

  const response = await fetch(CATALOG_XLSX_URL);
  if (!response.ok) {
    throw new Error("No se pudo descargar el workbook remoto");
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const tractoresRows = sheetToRowsWithHeaderRow(workbook, CATALOG_SHEET_NAMES.tractores, 0);
  const remolquesRows = sheetToRowsWithHeaderRow(workbook, CATALOG_SHEET_NAMES.remolques, 0);
  const licenciasRows = sheetToRowsWithHeaderRow(workbook, CATALOG_SHEET_NAMES.licencias, 0);
  const marcasRows = sheetToRowsWithHeaderRow(workbook, CATALOG_SHEET_NAMES.marcas, 0);

  state.tractores.clear();
  state.remolques.clear();
  state.operadores.clear();
  state.marcas.clear();

  for (const row of tractoresRows) {
    const eco = String(
      getFirst(row, ["N° ECO", "NO ECO", "N ECO", "ECO", "ECONOMICO", "N° ECO PLACAS"])
    ).trim();

    if (!eco) continue;

    state.tractores.set(eco, {
      economico: eco,
      placas: getFirst(row, ["PLACAS", "PLACA"]),
      marca: getFirst(row, ["MARCA"]),
      modelo: getFirst(row, ["MODELO", "AÑO", "ANO"]),
      serie: getFirst(row, ["SERIE"]),
    });
  }

  for (const row of remolquesRows) {
    const eco = String(
      getFirst(row, ["N° ECO", "NO ECO", "N ECO", "ECO", "ECONOMICO"])
    ).trim();

    if (!eco) continue;

    state.remolques.set(eco, {
      economico: eco,
      placas: getFirst(row, ["PLACAS", "PLACA"]),
      placasAmericanas: getFirst(row, ["PLACAS AMERICANAS", "PLACAS USA"]),
      marca: getFirst(row, ["MARCA"]),
      modelo: getFirst(row, ["MODELO", "AÑO", "ANO"]),
      serie: getFirst(row, ["SERIE", "POLIZAS"]),
    });
  }

  for (const row of licenciasRows) {
    const nombreSistema = String(
      getFirst(row, ["NOMBRE ZAM", "OPERADOR", "NOMBRE"])
    ).trim();

    if (!nombreSistema) continue;

    const operadorData = {
      nombreSistema,
      nombreBonito: String(
        getFirst(row, ["OPERADOR", "NOMBRE"])
      ).trim() || formatOperatorFromSystem(nombreSistema),
      licencia: String(
        getFirst(row, ["NO. LICENCIA", "NO LICENCIA", "LICENCIA"])
      ).trim(),
      celular: String(
        getFirst(row, ["CELULAR", "CONTACTO", "TELEFONO"])
      ).trim(),
      imagen: convertGoogleDriveImageUrl(
        String(getFirst(row, ["IMAGEN", "FOTO"])).trim()
      ),
    };

    state.operadores.set(normalizeKey(nombreSistema), operadorData);
    state.operadores.set(normalizeKey(stripPrefix(nombreSistema)), operadorData);
  }

  for (const row of marcasRows) {
    const marca = normalizeKey(getFirst(row, ["MARCA"]));
    if (!marca) continue;

    state.marcas.set(marca, {
      marca,
      imagen: getFirst(row, ["IMAGEN", "FOTO"]),
    });
  }

  state.catalogsLoaded = true;
  llenarListasIndividuales();
  setStatus("Catálogos cargados correctamente.", "ok");
}

function llenarListasIndividuales() {
  operadoresList.innerHTML = "";
  tractoresList.innerHTML = "";
  remolquesList.innerHTML = "";

  const operadoresUnicos = new Map();

  for (const [, op] of state.operadores) {
    const key = normalizeKey(op.nombreSistema);
    if (!operadoresUnicos.has(key)) {
      operadoresUnicos.set(key, op);
    }
  }

  for (const [, op] of operadoresUnicos) {
    const option = document.createElement("option");
    option.value = op.nombreSistema;
    option.label = `${op.nombreBonito} | ${op.nombreSistema}`;
    operadoresList.appendChild(option);
  }

  for (const [eco, tractor] of state.tractores) {
    const option = document.createElement("option");
    option.value = eco;
    option.label = `${eco} | ${tractor.marca} | ${tractor.placas}`;
    tractoresList.appendChild(option);
  }

  for (const [eco, remolque] of state.remolques) {
    const option = document.createElement("option");
    option.value = eco;
    option.label = `${eco} | ${remolque.marca} | ${remolque.placas}`;
    remolquesList.appendChild(option);
  }
}

async function processExcelFile() {
  try {
    processBtn.disabled = true;
    await ensureCatalogsLoaded();

    const file = excelFileEl.files[0];
    if (!file) {
      alert("Selecciona un archivo Excel.");
      return;
    }

    setStatus("Leyendo Excel de carga masiva...", "muted-status");
    resultsEl.innerHTML = "";
    summaryEl.innerHTML = "";

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const rows = rawRows.map(row => {
      const out = {};
      Object.keys(row).forEach(key => {
        out[normalizeHeader(key)] = row[key];
      });
      out.__RAW_VALUES = Object.values(row);
      return out;
    });

    const usableRows = rows.filter(row => {
      const operador = String(row["OPERADOR"] || "").trim();
      const unidad = String(row["UNIDAD"] || row["TRACTOR"] || "").trim();
      return operador !== "" && unidad !== "";
    });

    const cards = usableRows.map(buildCardData);
    renderGroupedCardsByClient(cards, resultsEl);

    const ignoradas = rows.length - usableRows.length;

    setStatus(`Se procesaron ${cards.length} filas.`, "ok");
    summaryEl.innerHTML =
      `Fichas generadas: <strong>${cards.length}</strong> · ` +
      `Filas ignoradas: <strong>${ignoradas}</strong> · ` +
      `Clientes detectados: <strong>${new Set(cards.map(c => c.cliente)).size}</strong>`;
  } catch (error) {
    console.error(error);
    setStatus(`Error procesando el Excel: ${error.message}`, "error");
  } finally {
    processBtn.disabled = false;
  }
}

async function generarFichaIndividual() {
  try {
    generarIndividualBtn.disabled = true;
    await ensureCatalogsLoaded();

    const rawOperator = String(operadorInput.value || "").trim();
    const tractorEco = String(tractorInput.value || "").trim();
    const remolqueEco = String(remolqueInput.value || "").trim();

    if (!rawOperator || !tractorEco) {
      alert("Selecciona al menos operador y tractor.");
      return;
    }

    if (!operadorSeleccionadoValido) {
      alert("Selecciona un operador válido de la lista.");
      return;
    }

    const row = {
      OPERADOR: rawOperator,
      UNIDAD: tractorEco,
      "REMOLQUE 1": remolqueEco,
      CLIENTE: "Ficha individual",
      __RAW_VALUES: [],
    };

    const card = buildCardData(row);
    renderCards([card], individualResultEl);

    setStatus("Ficha individual generada.", "ok");
  } catch (error) {
    console.error(error);
    setStatus(`Error generando ficha individual: ${error.message}`, "error");
  } finally {
    generarIndividualBtn.disabled = false;
  }
}

function getClienteFromRow(row) {
  const clientePorNombre = String(
    getFirst(row, ["CLIENTE", "CLIENTE 1", "RAZON SOCIAL", "RAZÓN SOCIAL"])
  ).trim();

  if (clientePorNombre) return clientePorNombre;

  const rawValues = Array.isArray(row.__RAW_VALUES) ? row.__RAW_VALUES : [];
  const columnaC = String(rawValues[2] || "").trim();

  return columnaC || "Sin cliente";
}

function buildCardData(row) {
  const rawOperator = String(row["OPERADOR"] || "").trim();
  const tractorEco = String(row["UNIDAD"] || row["TRACTOR"] || "").trim();
  const remolqueEco = String(row["REMOLQUE 1"] || row["REMOLQUE"] || "").trim();
  const cliente = getClienteFromRow(row);

  const operador =
    state.operadores.get(normalizeKey(rawOperator)) ||
    state.operadores.get(normalizeKey(stripPrefix(rawOperator))) ||
    null;

  const tractorMatch = state.tractores.get(tractorEco) || null;
  const remolqueMatch = remolqueEco ? state.remolques.get(remolqueEco) || null : null;

  const nombreBonito =
    operador?.nombreBonito ||
    formatOperatorFromSystem(rawOperator) ||
    "Sin operador";

  const operatorPhoto =
    isDirectImageUrl(operador?.imagen)
      ? operador.imagen
      : localOperatorPhotos[normalizeKey(nombreBonito)] || "img/1.png";

  const truckBrand = normalizeKey(tractorMatch?.marca || "");
  const marcaMatch = state.marcas.get(truckBrand) || null;

  const truckImage = marcaMatch?.imagen
    ? convertGoogleDriveImageUrl(marcaMatch.imagen)
    : "";

  return {
    cliente,
    operador: nombreBonito,
    licencia: operador?.licencia || "Sin dato",
    contacto: operador?.celular || "Sin dato",

    tractorEco,
    tractorMarca: tractorMatch?.marca || "Sin dato",
    tractorPlacas: tractorMatch?.placas || "Sin dato",
    tractorModelo: tractorMatch?.modelo || "Sin dato",

    remolqueEco: remolqueEco || "Sin remolque",
    remolqueMarca: remolqueMatch?.marca || "Sin dato",
    remolquePlacas: remolqueMatch?.placas || "Sin dato",
    remolqueModelo: remolqueMatch?.modelo || "Sin dato",

    operatorPhoto,
    truckImage,
    companyLogo: EMPRESA_LOGO_URL,
  };
}

function isDirectImageUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderGroupedCardsByClient(cards, targetEl) {
  const grupos = new Map();

  for (const card of cards) {
    const cliente = card.cliente || "Sin cliente";
    if (!grupos.has(cliente)) {
      grupos.set(cliente, []);
    }
    grupos.get(cliente).push(card);
  }

  const clientesOrdenados = Array.from(grupos.keys()).sort((a, b) => a.localeCompare(b, "es"));

  targetEl.innerHTML = clientesOrdenados.map(cliente => {
    const cardsCliente = grupos.get(cliente);

    return `
      <section class="cliente-group">
        <div class="cliente-header">${escapeHtml(cliente)}</div>
        <div class="results">
          ${cardsCliente.map(card => renderSingleCard(card)).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderCards(cards, targetEl) {
  targetEl.innerHTML = cards.map(card => renderSingleCard(card)).join("");
}

function renderSingleCard(card) {
  return `
    <div class="card">
      <div class="left">
        <div class="foto-frame">
          <img class="foto" src="${escapeHtml(card.operatorPhoto)}" alt="Operador">
        </div>

        <div class="logo-box">
          <img class="logo-empresa" src="${escapeHtml(card.companyLogo)}" alt="Logo empresa">
        </div>
      </div>

      <div class="right">
        <div class="hero">
          <div class="hero-info">
            <h2 class="nombre">${escapeHtml(card.operador)}</h2>
            <div class="hero-lines">
              <p class="hero-line"><span class="label">Licencia:</span> ${escapeHtml(card.licencia)}</p>
              <p class="hero-line"><span class="label">Contacto:</span> ${escapeHtml(card.contacto)}</p>
            </div>
          </div>

          <div class="hero-truck">
            ${card.truckImage ? `<img class="camion" src="${escapeHtml(card.truckImage)}" alt="Camión">` : ""}
          </div>
        </div>

        <div class="info-grid">
          <div class="block">
            <div class="block-title">Tractor</div>
            <p class="linea"><span class="muted">Económico:</span> ${escapeHtml(card.tractorEco)}</p>
            <p class="linea"><span class="muted">Marca:</span> ${escapeHtml(card.tractorMarca)}</p>
            <p class="linea"><span class="muted">Placas:</span> ${escapeHtml(card.tractorPlacas)}</p>
            <p class="linea"><span class="muted">Modelo:</span> ${escapeHtml(card.tractorModelo)}</p>
          </div>

          <div class="block">
            <div class="block-title">Remolque</div>
            <p class="linea"><span class="muted">Económico:</span> ${escapeHtml(card.remolqueEco)}</p>
            <p class="linea"><span class="muted">Marca:</span> ${escapeHtml(card.remolqueMarca)}</p>
            <p class="linea"><span class="muted">Placas:</span> ${escapeHtml(card.remolquePlacas)}</p>
            <p class="linea"><span class="muted">Modelo:</span> ${escapeHtml(card.remolqueModelo)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}