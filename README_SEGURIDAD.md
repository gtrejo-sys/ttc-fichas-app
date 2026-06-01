<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generador de Fichas TTC</title>
  <link rel="stylesheet" href="style.css" />
</head>

<body>

  <!-- 🔐 LOGIN -->
  <div id="loginScreen" style="display:flex;min-height:100vh;align-items:center;justify-content:center;background:#0b1220;">
    <div style="background:#111827;padding:32px;border-radius:16px;text-align:center;max-width:420px;width:90%;color:white;">
      <h2 style="margin-top:0;">TTC Fichas</h2>
      <p>Inicia sesión para continuar</p>
      <button id="googleLoginBtn" style="padding:12px 18px;border:none;border-radius:10px;background:#e10600;color:white;cursor:pointer;">
        Continuar con Google
      </button>
      <p id="loginStatus" style="margin-top:14px;color:#cfcfcf;"></p>
    </div>
  </div>

  <!-- 🚀 APP -->
  <div class="app" id="mainApp" style="display:none;">

    <div class="topbar">
      <h1>Generador de Fichas</h1>
      <p id="status">Listo.</p>
    </div>

    <div class="main-menu">
      <button id="btnVistaIndividual" class="menu-btn">Ficha individual</button>
      <button id="btnVistaMasiva" class="menu-btn">Carga masiva</button>
    </div>

    <!-- INDIVIDUAL -->
    <section id="vistaIndividual" class="view">
      <div class="panel">
        <div class="field">
          <label>Operador</label>
          <input id="operadorInput" list="operadoresList" placeholder="Buscar operador" />
          <datalist id="operadoresList"></datalist>
        </div>

        <div class="field">
          <label>Tractor</label>
          <input id="tractorInput" list="tractoresList" placeholder="Buscar tractor" />
          <datalist id="tractoresList"></datalist>
        </div>

        <div class="field">
          <label>Remolque</label>
          <input id="remolqueInput" list="remolquesList" placeholder="Buscar remolque" />
          <datalist id="remolquesList"></datalist>
        </div>

        <button id="generarIndividualBtn">Generar ficha</button>
      </div>

      <div id="individualResult" class="results"></div>
    </section>

    <!-- MASIVA -->
    <section id="vistaMasiva" class="view">
      <div class="panel">
        <input id="excelFile" type="file" accept=".xlsx,.xls" />
        <button id="processBtn">Procesar Excel</button>
      </div>

      <div id="summary"></div>
      <div id="results"></div>
    </section>

  </div>

  <!-- 📦 XLSX -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>

  <!-- 🔥 FIREBASE BASE -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

    const firebaseConfig = {
      apiKey: "AIzaSyAgByxRK8Vkl2kWLG-Dt037zb1ZTFtH8_Y",
      authDomain: "ttc-fichas-app.firebaseapp.com",
      projectId: "ttc-fichas-app",
      storageBucket: "ttc-fichas-app.firebasestorage.app",
      messagingSenderId: "273571785684",
      appId: "1:273571785684:web:8a6854f35c8b4073714441",
      measurementId: "G-DMBVBJW0PT"
    };

    const app = initializeApp(firebaseConfig);
    window.firebaseApp = app;
  </script>

  <!-- 🔐 FIREBASE AUTH -->
  <script type="module">
    import {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      onAuthStateChanged,
      signOut
    } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

    const auth = getAuth(window.firebaseApp);
    const provider = new GoogleAuthProvider();

    window.ttcAuth = {
      auth,
      provider,
      signInWithPopup,
      onAuthStateChanged,
      signOut
    };
  </script>

  <!-- 🧠 TU SCRIPT -->
  <script src="script.js"></script>

</body>
</html>