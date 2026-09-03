import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";
import { DEFAULT_CATEGORIES } from "./src/data/defaultCategories";
import { 
  SEED_EXPENSES, 
  SEED_RECURRING, 
  SEED_INCOMES, 
  SEED_CREDIT_CARDS, 
  SEED_GOALS 
} from "./src/data/seedData";

// Server-side Firebase Firestore initialization
const fbApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const fbDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

interface DatabaseSchema {
  version: number;
  lastModified: string;
  expenses: any[];
  recurringExpenses: any[];
  incomes: any[];
  creditCards: any[];
  goals: any[];
  categories: any[];
  settings: any;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export interface ServerUser {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: "admin" | "user";
  createdAt: string;
  isActive: boolean;
  lastLogin?: string;
}

const DEFAULT_MASTER_USERS: ServerUser[] = [
  {
    id: "user_master",
    username: "admin",
    name: "Administrador Master",
    password: "123",
    role: "admin",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

function loadUsers(): ServerUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }
  saveUsers(DEFAULT_MASTER_USERS);
  return DEFAULT_MASTER_USERS;
}

function saveUsers(users: ServerUser[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save users file:", err);
  }
}

function getBlankUserData(userName?: string): DatabaseSchema {
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    expenses: [],
    recurringExpenses: [],
    incomes: [],
    creditCards: [],
    goals: [],
    categories: DEFAULT_CATEGORIES,
    settings: {
      userName: userName || "Usuário",
      currency: "BRL",
      pinEnabled: false,
      pinCode: "1234",
      notificationsEnabled: true,
      alertDaysAhead: 7,
    },
  };
}

function getDefaultData(): DatabaseSchema {
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    expenses: SEED_EXPENSES,
    recurringExpenses: SEED_RECURRING,
    incomes: SEED_INCOMES,
    creditCards: SEED_CREDIT_CARDS,
    goals: SEED_GOALS,
    categories: DEFAULT_CATEGORIES,
    settings: {
      userName: "Alex Mendes (Master)",
      currency: "BRL",
      pinEnabled: false,
      pinCode: "1234",
      notificationsEnabled: true,
      alertDaysAhead: 7,
    },
  };
}

function getUserDbFilePath(userId: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `finance_user_${safeId}.json`);
}

function loadUserDatabase(userId: string): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = getUserDbFilePath(userId);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        version: parsed.version || 1,
        lastModified: parsed.lastModified || new Date().toISOString(),
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        recurringExpenses: Array.isArray(parsed.recurringExpenses) ? parsed.recurringExpenses : [],
        incomes: Array.isArray(parsed.incomes) ? parsed.incomes : [],
        creditCards: Array.isArray(parsed.creditCards) ? parsed.creditCards : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_CATEGORIES,
        settings: parsed.settings || getBlankUserData().settings,
      };
    }
    // Backward compatibility: If it's user_master or admin, check old primary DB
    if (userId === "user_master" || userId === "primary") {
      const oldDbFile = path.join(DATA_DIR, "finance_db.json");
      if (fs.existsSync(oldDbFile)) {
        const raw = fs.readFileSync(oldDbFile, "utf-8");
        const parsed = JSON.parse(raw);
        saveUserDatabase(userId, parsed);
        return parsed;
      }
      const defaultData = getDefaultData();
      saveUserDatabase(userId, defaultData);
      return defaultData;
    }
  } catch (err) {
    console.error(`Error reading database file for user ${userId}:`, err);
  }

  // Any other user begins completely blank (zerada)
  const blankData = getBlankUserData();
  saveUserDatabase(userId, blankData);
  return blankData;
}

function saveUserDatabase(userId: string, data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = getUserDbFilePath(userId);
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`Failed to persist database for user ${userId}:`, err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for CORS & JSON
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- USER MANAGEMENT & AUTH APIS ---
  // List all users (syncs with Firestore finance_system/users)
  app.get("/api/finance/users", async (_req, res) => {
    try {
      const docRef = doc(fbDb, "finance_system", "users");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.users) && data.users.length > 0) {
          saveUsers(data.users);
          return res.json({ success: true, users: data.users });
        }
      }
    } catch (err) {
      console.warn("Firestore users fetch warning:", err);
    }

    const localUsers = loadUsers();
    // Save to Firestore so it is initialized in cloud
    try {
      const docRef = doc(fbDb, "finance_system", "users");
      await setDoc(docRef, { users: localUsers, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}

    res.json({ success: true, users: localUsers });
  });

  // Create or update a user (Admin Master)
  app.post("/api/finance/users", async (req, res) => {
    try {
      const { id, username, name, password, role, isActive } = req.body;
      if (!username || !name) {
        return res.status(400).json({ success: false, error: "Nome e Usuário são obrigatórios" });
      }

      const users = loadUsers();
      const cleanUsername = String(username).trim().toLowerCase();

      // Check for duplicate username if new user or updating another
      const existing = users.find(u => u.username.toLowerCase() === cleanUsername && u.id !== id);
      if (existing) {
        return res.status(400).json({ success: false, error: "Nome de usuário já está em uso" });
      }

      let targetUser: ServerUser;
      let isNew = false;

      if (id) {
        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
          return res.status(404).json({ success: false, error: "Usuário não encontrado" });
        }
        users[index] = {
          ...users[index],
          username: cleanUsername,
          name: String(name).trim(),
          role: role || users[index].role,
          isActive: isActive !== undefined ? Boolean(isActive) : users[index].isActive,
          ...(password ? { password: String(password).trim() } : {}),
        };
        targetUser = users[index];
      } else {
        isNew = true;
        targetUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          username: cleanUsername,
          name: String(name).trim(),
          password: password ? String(password).trim() : "123",
          role: role === "admin" ? "admin" : "user",
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        users.push(targetUser);

        // Initialize user spreadsheet as completely blank (zerada)
        const blankSheet = getBlankUserData(targetUser.name);
        saveUserDatabase(targetUser.id, blankSheet);
        try {
          const userDocRef = doc(fbDb, "finance_users", targetUser.id);
          await setDoc(userDocRef, {
            ...blankSheet,
            userId: targetUser.id,
            updatedAt: blankSheet.lastModified,
          });
        } catch (fbErr) {
          console.warn("Failed to create blank Firestore sheet for new user:", fbErr);
        }
      }

      saveUsers(users);

      // Persist to Firestore
      try {
        const docRef = doc(fbDb, "finance_system", "users");
        await setDoc(docRef, { users, updatedAt: new Date().toISOString() });
      } catch (fbErr) {
        console.warn("Firestore save users warning:", fbErr);
      }

      res.json({ success: true, user: targetUser, isNew });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Erro ao salvar usuário" });
    }
  });

  // Delete a user
  app.delete("/api/finance/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (id === "user_master") {
        return res.status(400).json({ success: false, error: "O Administrador Master principal não pode ser excluído." });
      }

      let users = loadUsers();
      users = users.filter(u => u.id !== id);
      saveUsers(users);

      try {
        const docRef = doc(fbDb, "finance_system", "users");
        await setDoc(docRef, { users, updatedAt: new Date().toISOString() });
      } catch (fbErr) {
        console.warn("Firestore delete user sync warning:", fbErr);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset a specific user's spreadsheet back to blank (zerada)
  app.post("/api/finance/users/:id/reset", async (req, res) => {
    try {
      const { id } = req.params;
      const users = loadUsers();
      const user = users.find(u => u.id === id);
      const blankData = getBlankUserData(user?.name);
      saveUserDatabase(id, blankData);

      try {
        const docRef = doc(fbDb, "finance_users", id);
        await setDoc(docRef, {
          ...blankData,
          userId: id,
          updatedAt: blankData.lastModified,
        });
      } catch (fbErr) {
        console.warn("Firestore user reset warning:", fbErr);
      }

      res.json({ success: true, message: "Planilha zerada com sucesso", data: blankData });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- MULTI-USER FINANCE DATA APIS ---
  // Get database for a specific user
  app.get("/api/finance/data", async (req, res) => {
    const userId = (req.query.userId as string) || "user_master";

    try {
      // First check user-specific document in Firestore
      const userDocRef = doc(fbDb, "finance_users", userId);
      let snap = await getDoc(userDocRef);

      // Fallback for primary/master migration
      if (!snap.exists() && (userId === "user_master" || userId === "primary")) {
        const legacyDocRef = doc(fbDb, "finance_data", "primary");
        const legacySnap = await getDoc(legacyDocRef);
        if (legacySnap.exists()) {
          snap = legacySnap;
        }
      }

      if (snap.exists()) {
        const data = snap.data();
        const currentDb = loadUserDatabase(userId);
        const updatedDb: DatabaseSchema = {
          version: (currentDb.version || 1) + 1,
          lastModified: data.updatedAt || new Date().toISOString(),
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          recurringExpenses: Array.isArray(data.recurringExpenses) ? data.recurringExpenses : [],
          incomes: Array.isArray(data.incomes) ? data.incomes : [],
          creditCards: Array.isArray(data.creditCards) ? data.creditCards : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          categories: Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES,
          settings: data.settings || currentDb.settings,
        };
        saveUserDatabase(userId, updatedDb);

        return res.json({
          success: true,
          userId,
          ...updatedDb,
          fromFirestore: true,
        });
      }
    } catch (err) {
      console.warn(`Firestore fetch warning for user ${userId}:`, err);
    }

    const dbData = loadUserDatabase(userId);
    res.json({
      success: true,
      userId,
      ...dbData,
      fromFirestore: false,
    });
  });

  // Get version for a user
  app.get("/api/finance/version", async (req, res) => {
    const userId = (req.query.userId as string) || "user_master";

    try {
      const docRef = doc(fbDb, "finance_users", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return res.json({
          success: true,
          userId,
          version: 999999,
          lastModified: data.updatedAt || new Date().toISOString(),
          expensesCount: data.expenses ? data.expenses.length : 0,
        });
      }
    } catch {
      // Fallback
    }

    const dbData = loadUserDatabase(userId);
    res.json({
      success: true,
      userId,
      version: dbData.version,
      lastModified: dbData.lastModified,
      expensesCount: dbData.expenses.length,
    });
  });

  // Synchronize changes to user's database (saves to Firestore AND local file)
  app.post("/api/finance/sync", async (req, res) => {
    try {
      const payload = req.body;
      const userId = payload.userId || "user_master";
      const currentDb = loadUserDatabase(userId);

      const newVersion = (currentDb.version || 1) + 1;
      const newTimestamp = new Date().toISOString();

      const updatedDb: DatabaseSchema = {
        version: newVersion,
        lastModified: newTimestamp,
        expenses: payload.expenses !== undefined ? payload.expenses : currentDb.expenses,
        recurringExpenses: payload.recurringExpenses !== undefined ? payload.recurringExpenses : currentDb.recurringExpenses,
        incomes: payload.incomes !== undefined ? payload.incomes : currentDb.incomes,
        creditCards: payload.creditCards !== undefined ? payload.creditCards : currentDb.creditCards,
        goals: payload.goals !== undefined ? payload.goals : currentDb.goals,
        categories: payload.categories !== undefined ? payload.categories : currentDb.categories,
        settings: payload.settings !== undefined ? payload.settings : currentDb.settings,
      };

      saveUserDatabase(userId, updatedDb);

      // Persist directly to Firebase Firestore for this user
      try {
        const docRef = doc(fbDb, "finance_users", userId);
        await setDoc(docRef, {
          userId,
          expenses: updatedDb.expenses,
          recurringExpenses: updatedDb.recurringExpenses,
          incomes: updatedDb.incomes,
          creditCards: updatedDb.creditCards,
          goals: updatedDb.goals,
          categories: updatedDb.categories,
          settings: updatedDb.settings,
          updatedAt: newTimestamp,
        }, { merge: true });

        // Keep primary in sync if user is master
        if (userId === "user_master") {
          const primaryRef = doc(fbDb, "finance_data", "primary");
          await setDoc(primaryRef, {
            ...updatedDb,
            updatedAt: newTimestamp,
          }, { merge: true });
        }
      } catch (fbErr) {
        console.warn(`Server Firestore save warning for ${userId}:`, fbErr);
      }

      res.json({
        success: true,
        userId,
        version: newVersion,
        lastModified: newTimestamp,
      });
    } catch (err: any) {
      console.error("Sync error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to sync" });
    }
  });

  // Reset database for user
  app.post("/api/finance/reset", async (req, res) => {
    try {
      const userId = (req.body && req.body.userId) || "user_master";
      const isMaster = userId === "user_master";
      const defaultData = isMaster ? getDefaultData() : getBlankUserData();
      const newVersion = (loadUserDatabase(userId).version || 1) + 1;
      defaultData.version = newVersion;
      defaultData.lastModified = new Date().toISOString();
      saveUserDatabase(userId, defaultData);

      try {
        const docRef = doc(fbDb, "finance_users", userId);
        await setDoc(docRef, {
          ...defaultData,
          userId,
          updatedAt: defaultData.lastModified,
        });
      } catch (fbErr) {
        console.warn(`Server Firestore reset warning for ${userId}:`, fbErr);
      }

      res.json({
        success: true,
        userId,
        ...defaultData,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static assets with standard caching for hashed assets
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }));
    app.use(express.static(distPath));
    // ALWAYS serve index.html with NO CACHE to ensure mobile devices get the latest code
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Finance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
