const admin = require("firebase-admin");
const { google } = require("googleapis");

const SHEET_NAMES = ["TRACTORES", "REMOLQUES", "LICENCIAS", "MARCAS"];
const DEFAULT_ALLOWED_DOMAINS = ["transportesttc.com.mx", "kananlogistic.com.mx"];

function privateKeyFromEnv(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw Object.assign(new Error(`Falta variable de entorno: ${name}`), {
      statusCode: 500,
    });
  }
  return value;
}

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = requiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = privateKeyFromEnv(
    process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY
  );

  if (!clientEmail || !privateKey) {
    throw Object.assign(
      new Error("Faltan credenciales de Firebase Admin"),
      { statusCode: 500 }
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

async function verifyAuthorizedUser(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw Object.assign(new Error("Sesion requerida"), { statusCode: 401 });
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const email = String(decoded.email || "").toLowerCase();
  const allowedDomains = getAllowedEmailDomains();

  if (!email || decoded.email_verified === false) {
    throw Object.assign(new Error("Correo no verificado"), { statusCode: 403 });
  }

  if (!allowedDomains.some(domain => email.endsWith(`@${domain}`))) {
    throw Object.assign(new Error("Correo no autorizado"), { statusCode: 403 });
  }

  return decoded;
}

function getAllowedEmailDomains() {
  const raw =
    process.env.ALLOWED_EMAIL_DOMAINS ||
    process.env.ALLOWED_EMAIL_DOMAIN ||
    DEFAULT_ALLOWED_DOMAINS.join(",");

  return String(raw)
    .split(",")
    .map(domain => domain.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

async function readCatalogSheets() {
  const spreadsheetId = requiredEnv("GOOGLE_SHEET_ID");
  const clientEmail =
    process.env.GOOGLE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = privateKeyFromEnv(
    process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY
  );

  if (!clientEmail || !privateKey) {
    throw Object.assign(
      new Error("Faltan credenciales para Google Sheets"),
      { statusCode: 500 }
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: SHEET_NAMES,
    majorDimension: "ROWS",
    valueRenderOption: "FORMATTED_VALUE",
  });

  const output = {};
  for (const item of response.data.valueRanges || []) {
    const sheetName = String(item.range || "").split("!")[0].replace(/^'|'$/g, "");
    output[sheetName] = item.values || [];
  }

  for (const name of SHEET_NAMES) {
    if (!output[name]) output[name] = [];
  }

  return output;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    initFirebaseAdmin();
    await verifyAuthorizedUser(req);

    const sheets = await readCatalogSheets();
    return res.status(200).json({ sheets });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
      console.error("catalogos api error:", error);
    }

    return res.status(statusCode).json({
      error:
        statusCode >= 500
          ? "Error interno cargando catalogos"
          : error.message,
    });
  }
};
