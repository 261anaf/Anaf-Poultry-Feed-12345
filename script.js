(() => {
  "use strict";

  const BRANCH_KEY = "anafPoultryFeedOne.branch";
  const LOCAL_DATABASE_KEY = "anafPoultryFeedOne.localDatabase";
  const LOCAL_SESSION_KEY = "anafPoultryFeedOne.localSession";
  const LOCAL_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
  const apiHost = window.location.hostname || "localhost";
  const apiOrigin = `http://${apiHost}:3000`;
  let storageMode = window.location.protocol === "file:" ? "local" : "api";
  const BRANCH_SCOPED_COLLECTIONS = new Set([
    "products", "Purchase", "Sale", "Stock Transfer", "Damage", "Income", "Expense",
    "Loan", "Banking", "Fixed Assets", "Investment", "Cash Transfer", "Salary"
  ]);
  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const uid = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const currency = (value) => {
    const symbol = { "BDT (৳)": "৳", "USD ($)": "$", "EUR (€)": "€", "GBP (£)": "£" }[state?.settings?.currency] || "৳";
    return `${symbol}${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const dateLabel = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const navigation = [
    { group: "Overview", items: [["Dashboard", "layout-dashboard"]] },
    { group: "Inventory & Sales", items: [["Products", "package"], ["Purchase", "shopping-cart"], ["Stock", "boxes"], ["Stock Transfer", "truck"], ["Sale", "receipt"], ["Damage", "package-x"], ["Commitment", "clipboard-list"]] },
    { group: "Finance", items: [["Income", "trending-up"], ["Expense", "trending-down"], ["Loan", "landmark"], ["Banking", "wallet"], ["Fixed Assets", "building-2"], ["Investment", "chart-no-axes-combined"], ["Cash Transfer", "arrow-left-right"]] },
    { group: "CRM", items: [["Supplier", "factory"], ["Client", "contact-round"], ["Cash Due", "circle-dollar-sign"]] },
    { group: "HRM", items: [["Employee", "users"], ["Salary", "badge-dollar-sign"]] },
    { group: "Reports", items: [["Cash Book", "book-open"], ["Cash In Hand", "banknote"], ["Net Profit", "chart-pie"], ["Balance Sheet", "scale"], ["Purchase Report", "file-bar-chart"], ["Sale Report", "file-bar-chart"], ["Damage Report", "file-bar-chart"], ["Income Report", "file-bar-chart"], ["Expense Report", "file-bar-chart"]] },
    { group: "Administration", items: [["Branches", "git-branch"], ["Users", "user-round"], ["Roles", "shield-check"], ["Settings", "settings"]] }
  ];

  const schemas = {
    Products: [
      { key: "name", label: "Product name", required: true },
      { key: "sku", label: "Product code" },
      { key: "category", label: "Category", type: "select", options: ["Poultry feed", "Supplements", "Medicine", "Equipment", "Other"] },
      { key: "unit", label: "Unit", type: "select", options: ["Bag", "Kg", "Pack", "Piece", "Ton"] },
      { key: "costPrice", label: "Purchase price", type: "number", min: 0, prefix: "৳" },
      { key: "sellingPrice", label: "Selling price", type: "number", min: 0, prefix: "৳" },
      { key: "openingStock", label: "Opening stock", type: "number", min: 0, default: 0 },
      { key: "reorderLevel", label: "Low stock alert at", type: "number", min: 0, default: 10 }
    ],
    Purchase: [
      { key: "date", label: "Purchase date", type: "date", required: true, default: today },
      { key: "supplier", label: "Supplier", required: true },
      { key: "productId", label: "Product", type: "product", required: true },
      { key: "quantity", label: "Quantity", type: "number", min: 0.01, required: true },
      { key: "unitPrice", label: "Unit price", type: "number", min: 0, prefix: "৳", required: true },
      { key: "paymentMethod", label: "Payment method", type: "select", options: ["Cash", "Bank transfer", "Mobile banking"], default: "Cash" },
      { key: "paidAmount", label: "Amount paid", type: "number", min: 0, prefix: "৳", default: 0 },
      { key: "reference", label: "Invoice / reference" }
    ],
    Sale: [
      { key: "date", label: "Sale date", type: "date", required: true, default: today },
      { key: "client", label: "Customer", required: true },
      { key: "productId", label: "Product", type: "product", required: true },
      { key: "quantity", label: "Quantity", type: "number", min: 0.01, required: true },
      { key: "unitPrice", label: "Unit price", type: "number", min: 0, prefix: "৳", required: true },
      { key: "paymentMethod", label: "Payment method", type: "select", options: ["Cash", "Bank transfer", "Mobile banking"], default: "Cash" },
      { key: "paidAmount", label: "Amount received", type: "number", min: 0, prefix: "৳", default: 0 },
      { key: "reference", label: "Invoice / reference" }
    ],
    Expense: [
      { key: "date", label: "Expense date", type: "date", required: true, default: today },
      { key: "category", label: "Category", type: "select", options: ["Transport", "Utilities", "Rent", "Salaries", "Supplies", "Other"], required: true },
      { key: "amount", label: "Amount", type: "number", min: 0.01, prefix: "৳", required: true },
      { key: "paymentMethod", label: "Payment method", type: "select", options: ["Cash", "Bank transfer", "Mobile banking", "Credit"], default: "Cash" },
      { key: "description", label: "Description", type: "textarea", full: true }
    ],
    Income: [
      { key: "date", label: "Date", type: "date", required: true, default: today },
      { key: "category", label: "Income source", type: "select", options: ["Feed sales", "Delivery", "Service", "Other"], required: true },
      { key: "amount", label: "Amount", type: "number", min: 0.01, prefix: "৳", required: true },
      { key: "paymentMethod", label: "Payment method", type: "select", options: ["Cash", "Bank transfer", "Mobile banking", "Other"], default: "Cash" },
      { key: "description", label: "Description", type: "textarea", full: true }
    ],
    Supplier: [
      { key: "name", label: "Supplier name", required: true }, { key: "phone", label: "Phone number", type: "tel" },
      { key: "email", label: "Email", type: "email" }, { key: "address", label: "Address", type: "textarea", full: true }
    ],
    Client: [
      { key: "name", label: "Customer name", required: true }, { key: "phone", label: "Phone number", type: "tel" },
      { key: "email", label: "Email", type: "email" }, { key: "address", label: "Address", type: "textarea", full: true }
    ],
    "Stock Transfer": [
      { key: "date", label: "Transfer date", type: "date", required: true, default: today },
      { key: "fromBranch", label: "From branch", type: "branch", required: true, default: selectedBranch }, { key: "toBranch", label: "To branch", type: "branch", required: true },
      { key: "productId", label: "Product", type: "product", required: true },
      { key: "quantity", label: "Quantity", type: "number", min: 0.01, required: true }, { key: "status", label: "Status", type: "select", options: ["Pending", "In transit", "Completed"], default: "Pending" }
    ],
    Damage: [
      { key: "date", label: "Date", type: "date", required: true, default: today },
      { key: "productId", label: "Product", type: "product", required: true },
      { key: "quantity", label: "Quantity", type: "number", min: 0.01, required: true },
      { key: "reason", label: "Reason", type: "select", options: ["Expired", "Damaged packaging", "Contamination", "Other"], required: true },
      { key: "amount", label: "Loss amount", type: "number", min: 0, prefix: "৳" }
    ],
    Commitment: [
      { key: "date", label: "Date", type: "date", default: today }, { key: "person", label: "Contact / party", required: true },
      { key: "details", label: "Commitment details", type: "textarea", full: true }, { key: "dueDate", label: "Due date", type: "date" },
      { key: "amount", label: "Amount", type: "number", min: 0, prefix: "৳" }, { key: "status", label: "Status", type: "select", options: ["Pending", "Completed", "Cancelled"] }
    ],
    Loan: [
      { key: "date", label: "Loan date", type: "date", default: today }, { key: "lender", label: "Lender", required: true },
      { key: "amount", label: "Principal amount", type: "number", min: 0, prefix: "৳", required: true },
      { key: "interestRate", label: "Interest rate (%)", type: "number", min: 0 }, { key: "dueDate", label: "Due date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Paid", "Overdue"] }
    ],
    Banking: [
      { key: "date", label: "Date", type: "date", default: today }, { key: "bank", label: "Bank / account", required: true },
      { key: "type", label: "Transaction type", type: "select", options: ["Deposit", "Withdrawal", "Transfer"], required: true },
      { key: "amount", label: "Amount", type: "number", min: 0, prefix: "৳", required: true }, { key: "reference", label: "Reference" }
    ],
    "Fixed Assets": [
      { key: "name", label: "Asset name", required: true }, { key: "category", label: "Category", type: "select", options: ["Vehicle", "Equipment", "Property", "Furniture", "Other"] },
      { key: "purchaseDate", label: "Purchase date", type: "date" }, { key: "value", label: "Asset value", type: "number", min: 0, prefix: "৳" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Disposed", "Under maintenance"] }
    ],
    Investment: [
      { key: "date", label: "Investment date", type: "date", default: today }, { key: "investor", label: "Investor / source", required: true },
      { key: "type", label: "Investment type", type: "select", options: ["Owner equity", "Partner contribution", "Other"] },
      { key: "amount", label: "Amount", type: "number", min: 0, prefix: "৳", required: true }, { key: "returnDate", label: "Return date", type: "date" }
    ],
    "Cash Transfer": [
      { key: "date", label: "Date", type: "date", default: today }, { key: "fromAccount", label: "From account", required: true },
      { key: "toAccount", label: "To account", required: true }, { key: "amount", label: "Amount", type: "number", min: 0, prefix: "৳", required: true }
    ],
    Employee: [
      { key: "name", label: "Employee name", required: true }, { key: "phone", label: "Phone number", type: "tel" },
      { key: "role", label: "Job title", required: true }, { key: "salary", label: "Monthly salary", type: "number", min: 0, prefix: "৳" },
      { key: "startDate", label: "Start date", type: "date" }, { key: "status", label: "Status", type: "select", options: ["Active", "On leave", "Inactive"] }
    ],
    Salary: [
      { key: "date", label: "Payment date", type: "date", default: today }, { key: "employee", label: "Employee", required: true },
      { key: "amount", label: "Amount", type: "number", min: 0, prefix: "৳", required: true },
      { key: "method", label: "Payment method", type: "select", options: ["Cash", "Bank transfer", "Mobile banking"], default: "Cash" },
      { key: "status", label: "Status", type: "select", options: ["Paid", "Pending"], default: "Paid" }
    ],
    Branches: [
      { key: "name", label: "Branch name", required: true }, { key: "location", label: "Location" },
      { key: "phone", label: "Phone number", type: "tel" }, { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    Users: [
      { key: "name", label: "Full name", required: true }, { key: "email", label: "Email", type: "email", required: true },
      { key: "role", label: "Role", type: "select", options: ["Administrator", "Manager", "Staff"] },
      { key: "branch", label: "Branch" }, { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    Roles: [
      { key: "name", label: "Role name", required: true }, { key: "description", label: "Description", type: "textarea", full: true },
      { key: "permissions", label: "Permissions", type: "text", placeholder: "e.g. Products, Sales, Reports", full: true }
    ],
    Settings: [
      { key: "businessName", label: "Business name", required: true, default: "Anaf Poultry Feed (One)" },
      { key: "currency", label: "Currency", type: "select", options: ["BDT (৳)", "USD ($)", "EUR (€)", "GBP (£)"], default: "BDT (৳)" },
      { key: "openingBalance", label: "Opening cash balance", type: "number", min: 0, default: 50000 },
      { key: "phone", label: "Contact number", type: "tel" }, { key: "address", label: "Business address", type: "textarea", full: true }
    ]
  };

  const reportConfig = {
    "Purchase Report": { source: "Purchase", title: "Purchase Report", description: "Review purchases made during the selected period." },
    "Sale Report": { source: "Sale", title: "Sale Report", description: "Review sales made during the selected period." },
    "Damage Report": { source: "Damage", title: "Damage Report", description: "Review damaged or written-off stock." },
    "Income Report": { source: "Income", title: "Income Report", description: "Review recorded business income." },
    "Expense Report": { source: "Expense", title: "Expense Report", description: "Review recorded business expenses." }
  };

  let state;
  let currentUser;
  let activePage = "Dashboard";
  let searchTerm = "";

  function createEmptyState() {
    const emptyCollections = Object.fromEntries(
      Object.keys(schemas)
        .filter((page) => page !== "Settings")
        .map((page) => [page === "Products" ? "products" : page, []])
    );
    return {
      ...emptyCollections,
      settings: { businessName: "Anaf Poultry Feed (One)", currency: "BDT (৳)", openingBalance: 0, openingBalanceByBranch: {}, phone: "", address: "" }
    };
  }

  function reportStorageError(error) {
    showToast(`Browser storage is unavailable: ${error.message || "access was denied"}`, true);
  }

  function getStoredValue(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      reportStorageError(error);
      return null;
    }
  }

  function setStoredValue(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      reportStorageError(error);
      return false;
    }
  }

  function removeStoredValue(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      reportStorageError(error);
      return false;
    }
  }

  function readLocalDatabase() {
    const stored = getStoredValue(LOCAL_DATABASE_KEY);
    if (!stored) return { users: [], sessions: [], states: {} };
    try {
      const database = JSON.parse(stored);
      if (!database || !Array.isArray(database.users) || !Array.isArray(database.sessions) ||
          !database.states || typeof database.states !== "object" || Array.isArray(database.states)) {
        throw new Error("The saved browser database has an invalid format.");
      }
      return database;
    } catch (error) {
      throw new Error(`Could not read saved browser data: ${error.message || "invalid data"}`);
    }
  }

  function writeLocalDatabase(database) {
    if (!setStoredValue(LOCAL_DATABASE_KEY, JSON.stringify(database))) {
      throw new Error("Could not save data to this browser's local storage.");
    }
  }

  function toPublicLocalUser(user) {
    return { id: user.id, name: user.name, email: user.email, role: "Administrator" };
  }

  function createLocalSalt() {
    if (!window.crypto?.getRandomValues || !window.crypto?.subtle) {
      throw new Error("Secure local account storage is unavailable in this browser. Please use a current browser.");
    }
    return Array.from(window.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashLocalPassword(password, salt, iterations = 210000) {
    if (!window.crypto?.subtle) {
      throw new Error("Secure local account storage is unavailable in this browser. Please use a current browser.");
    }
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const result = await window.crypto.subtle.deriveBits({
      name: "PBKDF2",
      hash: "SHA-256",
      salt: Uint8Array.from(salt.match(/.{2}/g), (byte) => parseInt(byte, 16)),
      iterations
    }, key, 256);
    return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function saveLocalSession(database, user) {
    const sessionId = uid();
    database.sessions = database.sessions.filter((session) => session.expiresAt > Date.now());
    database.sessions.push({ id: sessionId, userId: user.id, expiresAt: Date.now() + LOCAL_SESSION_DURATION });
    writeLocalDatabase(database);
    if (!setStoredValue(LOCAL_SESSION_KEY, sessionId)) {
      throw new Error("Could not save the browser session.");
    }
    return toPublicLocalUser(user);
  }

  async function authenticateLocally(mode, payload) {
    const email = payload.email.trim().toLowerCase();
    const database = readLocalDatabase();
    let user;
    if (mode === "register") {
      const name = payload.name.trim();
      if (name.length < 2 || name.length > 100) throw new Error("Enter a name between 2 and 100 characters.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address.");
      if (payload.password.length < 10 || payload.password.length > 200) throw new Error("Password must be between 10 and 200 characters.");
      if (database.users.some((existing) => existing.email === email)) throw new Error("An account with that email already exists.");
      const salt = createLocalSalt();
      user = {
        id: uid(),
        name,
        email,
        passwordSalt: salt,
        passwordIterations: 210000,
        passwordHash: await hashLocalPassword(payload.password, salt)
      };
      database.users.push(user);
    } else {
      user = database.users.find((existing) => existing.email === email);
      if (!user || !user.passwordHash ||
          await hashLocalPassword(payload.password, user.passwordSalt, user.passwordIterations) !== user.passwordHash) {
        throw new Error("Email or password is incorrect.");
      }
    }
    currentUser = saveLocalSession(database, user);
    state = loadLocalState();
    return currentUser;
  }

  function loadLocalState() {
    const database = readLocalDatabase();
    const savedState = database.states[currentUser.id];
    if (!savedState) return createEmptyState();
    if (!savedState.settings || typeof savedState.settings !== "object" || Array.isArray(savedState.settings)) {
      throw new Error("Saved browser business settings have an invalid format.");
    }
    return { ...createEmptyState(), ...savedState };
  }

  async function restoreLocalSession() {
    try {
      const database = readLocalDatabase();
      const sessionId = getStoredValue(LOCAL_SESSION_KEY);
      const session = database.sessions.find((item) => item.id === sessionId && item.expiresAt > Date.now());
      const user = session && database.users.find((item) => item.id === session.userId);
      if (!user) {
        renderAuth("login");
        return;
      }
      currentUser = toPublicLocalUser(user);
      state = loadLocalState();
      await showDashboard();
    } catch (error) {
      renderAuth("login", error.message || "Could not read saved browser data.");
    }
  }

  async function logoutLocally() {
    const database = readLocalDatabase();
    const sessionId = getStoredValue(LOCAL_SESSION_KEY);
    database.sessions = database.sessions.filter((session) => session.id !== sessionId);
    writeLocalDatabase(database);
    if (!removeStoredValue(LOCAL_SESSION_KEY)) {
      throw new Error("Could not clear the browser session.");
    }
  }

  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(new URL(path, apiOrigin), {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options
      });
    } catch (error) {
      const connectionError = new Error(`Could not connect to the server: ${error.message || "network request failed"}`);
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    if (response.status === 204) return null;
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(response.ok
        ? "The server returned an invalid response."
        : `Request failed (${response.status}).`);
    }
    if (!response.ok) {
      const requestError = new Error(result.error || `Request failed (${response.status}).`);
      requestError.status = response.status;
      throw requestError;
    }
    return result;
  }

  async function loadState() {
    if (storageMode === "local") return loadLocalState();
    const result = await apiRequest("/api/state");
    let nextState = result.state;
    if (!result.initialized) {
      await apiRequest("/api/state", { method: "PUT", body: JSON.stringify({ state: nextState }) });
    }
    if (!nextState.settings || typeof nextState.settings !== "object" || Array.isArray(nextState.settings)) {
      throw new Error("The server returned invalid business settings.");
    }
    nextState.settings = {
      businessName: "Anaf Poultry Feed (One)", currency: "BDT (৳)", openingBalance: 0, openingBalanceByBranch: {}, phone: "", address: "",
      ...nextState.settings
    };
    return nextState;
  }

  async function persist() {
    if (storageMode === "local") {
      try {
        const database = readLocalDatabase();
        database.states[currentUser.id] = state;
        writeLocalDatabase(database);
        return true;
      } catch (error) {
        showToast(`Could not save data: ${error.message || "browser storage is unavailable"}`, true);
        return false;
      }
    }
    try {
      await apiRequest("/api/state", { method: "PUT", body: JSON.stringify({ state }) });
      return true;
    } catch (error) {
      showToast(`Could not save data: ${error.message || "server is unavailable"}`, true);
      return false;
    }
  }

  function allRecords(key) {
    const collection = key === "Products" ? "products" : key;
    const records = state[collection];
    if (!Array.isArray(records)) return [];
    if (!BRANCH_SCOPED_COLLECTIONS.has(collection)) return records;
    const branch = selectedBranch();
    return records.filter((record) => record.branch === branch || (!record.branch && branch === "Anaf Poultry Feed (One)"));
  }

  function productById(id) {
    return allRecords("products").find((product) => product.id === id);
  }

  function productName(id) {
    return productById(id)?.name || "Unknown product";
  }

  function stockFor(product) {
    const purchased = allRecords("Purchase").filter((record) => record.productId === product.id).reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    const sold = allRecords("Sale").filter((record) => record.productId === product.id).reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    const damaged = allRecords("Damage").filter((record) => record.productId === product.id).reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    return Number(product.openingStock || 0) + purchased - sold - damaged;
  }

  function projectedStock(productId, changedPage, changedId, replacement) {
    const product = productById(productId);
    if (!product) return Number.NEGATIVE_INFINITY;
    let stock = Number(product.openingStock || 0);
    for (const page of ["Purchase", "Sale", "Damage"]) {
      const direction = page === "Purchase" ? 1 : -1;
      for (const record of allRecords(page)) {
        if (page === changedPage && record.id === changedId) continue;
        if (record.productId === productId) stock += direction * Number(record.quantity || 0);
      }
      if (page === changedPage && replacement?.productId === productId) {
        stock += direction * Number(replacement.quantity || 0);
      }
    }
    return stock;
  }

  function recordAmount(record, page) {
    if ((page === "Purchase" || page === "Sale") && record.quantity != null) return Number(record.quantity) * Number(record.unitPrice || 0);
    return Number(record.amount ?? record.value ?? 0);
  }

  function displayValue(key, value, record, page) {
    if (key === "productId") return escapeHtml(productName(value));
    if (["date", "dueDate", "startDate", "purchaseDate", "returnDate"].includes(key)) return dateLabel(value);
    if (["amount", "unitPrice", "paidAmount", "costPrice", "sellingPrice", "value", "salary", "debit", "credit"].includes(key)) return currency(value);
    if (key === "total") return currency(recordAmount(record, page));
    if (key === "stock") return `${stockFor(record)} ${escapeHtml(record.unit || "")}`;
    if (key === "status") {
      const status = value || (page === "Purchase" || page === "Sale" ? (Number(record.paidAmount) >= recordAmount(record, page) ? "Paid" : "Due") : "Active");
      const pending = /pending|due|overdue|transit/i.test(status);
      return `<span class="status-pill${pending ? " pending" : ""}">${escapeHtml(status)}</span>`;
    }
    return escapeHtml(value || "—");
  }

  function pageColumns(page) {
    if (page === "Products") return [["name", "Product"], ["sku", "Code"], ["category", "Category"], ["unit", "Unit"], ["stock", "In stock"], ["costPrice", "Cost price"], ["sellingPrice", "Sell price"]];
    if (page === "Purchase") return [["date", "Date"], ["reference", "Reference"], ["supplier", "Supplier"], ["productId", "Product"], ["quantity", "Quantity"], ["total", "Total"], ["paidAmount", "Paid"], ["paymentMethod", "Method"], ["status", "Status"]];
    if (page === "Sale") return [["date", "Date"], ["reference", "Invoice"], ["client", "Customer"], ["productId", "Product"], ["quantity", "Quantity"], ["total", "Total"], ["paidAmount", "Received"], ["paymentMethod", "Method"], ["status", "Status"]];
    if (page === "Expense" || page === "Income") return [["date", "Date"], ["category", "Category"], ["description", "Description"], ["paymentMethod", "Payment method"], ["amount", "Amount"]];
    if (page === "Damage") return [["date", "Date"], ["productId", "Product"], ["quantity", "Quantity"], ["reason", "Reason"], ["amount", "Loss"]];
    if (page === "Stock") return [["name", "Product"], ["sku", "Code"], ["category", "Category"], ["stock", "Available"], ["reorderLevel", "Alert at"], ["sellingPrice", "Sell price"]];
    const map = {
      Supplier: [["name", "Supplier"], ["phone", "Phone"], ["email", "Email"], ["address", "Address"]],
      Client: [["name", "Customer"], ["phone", "Phone"], ["email", "Email"], ["address", "Address"]],
      "Stock Transfer": [["date", "Date"], ["fromBranch", "From"], ["toBranch", "To"], ["productId", "Product"], ["quantity", "Quantity"], ["status", "Status"]],
      Commitment: [["date", "Date"], ["person", "Contact"], ["details", "Details"], ["dueDate", "Due date"], ["amount", "Amount"], ["status", "Status"]],
      Loan: [["date", "Date"], ["lender", "Lender"], ["amount", "Amount"], ["interestRate", "Interest"], ["dueDate", "Due date"], ["status", "Status"]],
      Banking: [["date", "Date"], ["bank", "Account"], ["type", "Type"], ["amount", "Amount"], ["reference", "Reference"]],
      "Fixed Assets": [["name", "Asset"], ["category", "Category"], ["purchaseDate", "Purchased"], ["value", "Value"], ["status", "Status"]],
      Investment: [["date", "Date"], ["investor", "Investor"], ["type", "Type"], ["amount", "Amount"], ["returnDate", "Return date"]],
      "Cash Transfer": [["date", "Date"], ["fromAccount", "From"], ["toAccount", "To"], ["amount", "Amount"]],
      "Cash Due": [["date", "Date"], ["category", "Type"], ["description", "Party"], ["reference", "Reference"], ["amount", "Due amount"]],
      Employee: [["name", "Employee"], ["phone", "Phone"], ["role", "Position"], ["salary", "Monthly salary"], ["startDate", "Start date"], ["status", "Status"]],
      Salary: [["date", "Date"], ["employee", "Employee"], ["amount", "Amount"], ["method", "Method"], ["status", "Status"]],
      Branches: [["name", "Branch"], ["location", "Location"], ["phone", "Phone"], ["status", "Status"]],
      Users: [["name", "Name"], ["email", "Email"], ["role", "Role"], ["branch", "Branch"], ["status", "Status"]],
      Roles: [["name", "Role"], ["description", "Description"], ["permissions", "Permissions"]],
      "Cash Book": [["date", "Date"], ["type", "Type"], ["party", "Party"], ["reference", "Reference"], ["debit", "Debit"], ["credit", "Credit"]],
      Settings: [["businessName", "Business name"], ["currency", "Currency"], ["phone", "Phone"], ["address", "Address"]]
    };
    return map[page] || [["date", "Date"], ["name", "Name"], ["description", "Description"], ["amount", "Amount"], ["status", "Status"]];
  }

  function pageData(page) {
    if (page === "Stock") return allRecords("products");
    if (page === "Cash Book") {
      const isCash = (record, key = "paymentMethod") => !record[key] || record[key] === "Cash";
      const transactions = [
        ...allRecords("Sale").filter((record) => isCash(record)).map((record) => ({ ...record, type: "Sale", party: record.client, credit: Number(record.paidAmount || 0), debit: 0 })),
        ...allRecords("Purchase").filter((record) => isCash(record)).map((record) => ({ ...record, type: "Purchase", party: record.supplier, credit: 0, debit: Number(record.paidAmount || 0) })),
        ...allRecords("Income").filter((record) => isCash(record)).map((record) => ({ ...record, type: "Income", party: record.category, credit: Number(record.amount || 0), debit: 0 })),
        ...allRecords("Expense").filter((record) => isCash(record)).map((record) => ({ ...record, type: "Expense", party: record.category, credit: 0, debit: Number(record.amount || 0) })),
        ...allRecords("Salary").filter((record) => record.status !== "Pending" && isCash(record, "method")).map((record) => ({ ...record, type: "Salary", party: record.employee, credit: 0, debit: Number(record.amount || 0) })),
        ...allRecords("Cash Transfer").filter((record) => String(record.fromAccount).toLowerCase() === "cash" || String(record.toAccount).toLowerCase() === "cash").map((record) => ({
          ...record, type: "Cash transfer", party: `${record.fromAccount} → ${record.toAccount}`,
          credit: String(record.toAccount).toLowerCase() === "cash" ? Number(record.amount || 0) : 0,
          debit: String(record.fromAccount).toLowerCase() === "cash" ? Number(record.amount || 0) : 0
        }))
      ];
      return transactions.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    }
    if (page === "Cash Due") return [
      ...allRecords("Purchase").map((record) => ({ ...record, id: `supplier-${record.id}`, party: record.supplier, due: Math.max(0, recordAmount(record, "Purchase") - Number(record.paidAmount || 0)), dueType: "Supplier" })),
      ...allRecords("Sale").map((record) => ({ ...record, id: `client-${record.id}`, party: record.client, due: Math.max(0, recordAmount(record, "Sale") - Number(record.paidAmount || 0)), dueType: "Customer" }))
    ].filter((record) => record.due > 0);
    if (reportConfig[page]) return allRecords(reportConfig[page].source);
    return allRecords(page);
  }

  function totalFor(page, records = allRecords(page)) {
    return records.reduce((sum, record) => sum + recordAmount(record, page), 0);
  }

  function cashInHand() {
    const isCash = (record, key = "paymentMethod") => !record[key] || record[key] === "Cash";
    const salesReceived = allRecords("Sale").filter((record) => isCash(record)).reduce((sum, record) => sum + Number(record.paidAmount || 0), 0);
    const purchasesPaid = allRecords("Purchase").filter((record) => isCash(record)).reduce((sum, record) => sum + Number(record.paidAmount || 0), 0);
    const otherIncome = allRecords("Income").filter((record) => isCash(record)).reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const expenses = allRecords("Expense").filter((record) => isCash(record)).reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const salaries = allRecords("Salary").filter((record) => record.status !== "Pending" && isCash(record, "method")).reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const cashTransfers = allRecords("Cash Transfer").reduce((sum, record) => {
      if (String(record.toAccount).toLowerCase() === "cash") return sum + Number(record.amount || 0);
      if (String(record.fromAccount).toLowerCase() === "cash") return sum - Number(record.amount || 0);
      return sum;
    }, 0);
    const openingBalance = state.settings?.openingBalanceByBranch?.[selectedBranch()] ?? state.settings?.openingBalance ?? 50000;
    return Number(openingBalance) + salesReceived + otherIncome - purchasesPaid - expenses - salaries + cashTransfers;
  }

  function renderNavigation() {
    const nav = document.getElementById("sidebar-nav");
    nav.innerHTML = navigation.map(({ group, items }) => `
      <div class="nav-group">
        <div class="nav-group-title">${escapeHtml(group)}</div>
        ${items.map(([label, icon]) => `
          <button class="nav-link${activePage === label ? " active" : ""}" data-page="${escapeHtml(label)}" ${activePage === label ? 'aria-current="page"' : ""}>
            <span class="nav-icon"><i data-lucide="${escapeHtml(icon)}"></i></span><span>${escapeHtml(label)}</span>
          </button>`).join("")}
      </div>`).join("");
    refreshIcons();
  }

  function renderSettings() {
    const settings = state.settings;
    const openingBalance = settings.openingBalanceByBranch?.[selectedBranch()] ?? settings.openingBalance;
    return `<div class="section-heading"><div><h1 class="page-title">Settings</h1><p class="page-subtitle">Manage the business profile, default currency, and opening cash balance.</p></div></div>
      <section class="settings-card"><div><strong>${escapeHtml(settings.businessName)}</strong><p>${escapeHtml(settings.phone || "No contact number")} · ${escapeHtml(settings.currency)}</p></div>
        <div class="settings-actions"><button class="btn btn-danger" type="button" data-reset-dashboard>Clear all data</button><button class="btn btn-primary" type="button" data-edit-settings>Edit business settings</button></div></section>
      <section class="detail-cards"><article class="detail-card"><span>Default currency</span><strong>${escapeHtml(settings.currency)}</strong></article><article class="detail-card"><span>Opening cash balance · ${escapeHtml(selectedBranch())}</span><strong>${currency(openingBalance)}</strong></article><article class="detail-card"><span>Contact</span><strong>${escapeHtml(settings.phone || "Not set")}</strong></article></section>
      <section class="table-card report-placeholder"><div><div class="empty-state-icon">⚙</div><strong>${storageMode === "local" ? "Saved in this browser" : "Saved to your account"}</strong><p>${storageMode === "local" ? "These preferences are stored in this browser and used in the dashboard's cash balance and business profile." : "These preferences are stored in the database and used in the dashboard's cash balance and business profile."}</p></div></section>`;
  }

  async function resetDashboard() {
    if (!window.confirm("Clear all saved business data and reset the dashboard? This cannot be undone.")) return;

    const emptyState = createEmptyState();
    const previousState = state;
    state = emptyState;
    if (!(await persist())) {
      state = previousState;
      return;
    }
    removeStoredValue(BRANCH_KEY);
    activePage = "Dashboard";
    searchTerm = "";
    document.getElementById("branch-select").value = "Anaf Poultry Feed (One)";
    renderPage();
    showToast("All business data cleared. The dashboard has been reset.");
  }

  function refreshIcons() {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
      return;
    }
    document.querySelectorAll(".nav-icon i[data-lucide]").forEach((icon) => {
      icon.textContent = "•";
    });
  }

  function renderDashboard() {
    const date = today();
    const todayPurchases = allRecords("Purchase").filter((record) => record.date === date).reduce((sum, record) => sum + recordAmount(record, "Purchase"), 0);
    const todaySales = allRecords("Sale").filter((record) => record.date === date).reduce((sum, record) => sum + recordAmount(record, "Sale"), 0);
    const todayExpenses = allRecords("Expense").filter((record) => record.date === date).reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const todayIncome = allRecords("Income").filter((record) => record.date === date).reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const supplierDue = allRecords("Purchase").reduce((sum, record) => sum + Math.max(0, recordAmount(record, "Purchase") - Number(record.paidAmount || 0)), 0);
    const totalStock = allRecords("products").reduce((sum, product) => sum + stockFor(product), 0);
    const metrics = [
      ["Supplier Due", currency(supplierDue), "Outstanding supplier balance", "metric-orange", "landmark"],
      ["Today's Purchase", currency(todayPurchases), "Purchases recorded today", "metric-blue", "shopping-cart"],
      ["Today's Sale", currency(todaySales), "Sales recorded today", "metric-green", "receipt"],
      ["Today's Expense", currency(todayExpenses), "Expenses recorded today", "metric-rose", "trending-down"],
      ["Today's Income", currency(todayIncome), "Income recorded today", "metric-purple", "trending-up"],
      ["Stock", `${totalStock.toLocaleString()} units`, `${allRecords("products").length} products in inventory`, "metric-teal", "boxes"],
      ["Cash In Hand", currency(cashInHand()), "Estimated available cash", "metric-yellow", "banknote"]
    ];
    const recent = [
      ...allRecords("Sale").map((record) => ({ ...record, kind: "Sale", party: record.client, value: recordAmount(record, "Sale"), positive: true })),
      ...allRecords("Purchase").map((record) => ({ ...record, kind: "Purchase", party: record.supplier, value: recordAmount(record, "Purchase"), positive: false })),
      ...allRecords("Expense").map((record) => ({ ...record, kind: "Expense", party: record.category, value: Number(record.amount || 0), positive: false })),
      ...allRecords("Income").map((record) => ({ ...record, kind: "Income", party: record.category, value: Number(record.amount || 0), positive: true }))
    ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5);

    return `
      <section class="welcome-banner">
        <div class="welcome-copy">
          <p class="welcome-eyebrow">Your business at a glance</p>
          <h1>Welcome Back, ${escapeHtml(currentUser?.name || "Administrator")}</h1>
          <p>(${escapeHtml(selectedBranch())}) · Here’s what’s happening at your business today.</p>
        </div><div class="banner-art" aria-hidden="true"><span>✳</span></div>
      </section>
      <div class="section-heading"><div><h2>Business overview</h2><p>Keep track of your business performance.</p></div><span class="period-label">${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
      <section class="metrics-grid" aria-label="Business metrics">
        ${metrics.map(([label, value, note, tone, icon]) => `
          <article class="metric-card ${tone}">
            <div><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>
            <div class="metric-icon"><i data-lucide="${icon}"></i></div>
          </article>`).join("")}
      </section>
      <section class="dashboard-lower">
        <article class="panel">
          <div class="panel-heading"><div><h3>Recent activity</h3><p>Your latest business transactions</p></div><button class="text-link" data-page="Sale">View sales →</button></div>
          ${recent.length ? `<div class="data-table-wrap"><table class="activity-table"><thead><tr><th>TRANSACTION</th><th>PARTY</th><th>DATE</th><th>AMOUNT</th><th>TYPE</th></tr></thead><tbody>
            ${recent.map((record) => `<tr><td class="activity-name">${escapeHtml(record.reference || record.kind)}</td><td>${escapeHtml(record.party || "—")}</td><td>${dateLabel(record.date)}</td><td class="${record.positive ? "amount-positive" : "amount-negative"}">${record.positive ? "+" : "−"}${currency(record.value)}</td><td><span class="status-pill${record.kind === "Expense" ? " pending" : ""}">${escapeHtml(record.kind)}</span></td></tr>`).join("")}
          </tbody></table></div>` : emptyState("No activity yet", "Create a sale, purchase, or expense to get started.")}
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h3>Quick actions</h3><p>Common tasks, one click away</p></div></div>
          <div class="quick-actions">
            ${[["New sale", "Sale", "receipt"], ["Add purchase", "Purchase", "shopping-cart"], ["Add product", "Products", "package"], ["Record expense", "Expense", "trending-down"]].map(([label, page, icon]) => `<button class="quick-action" data-add-page="${page}"><span class="quick-action-icon"><i data-lucide="${icon}"></i></span>${label}</button>`).join("")}
          </div>
        </article>
      </section>`;
  }

  function selectedBranch() {
    return document.getElementById("branch-select")?.value || "Anaf Poultry Feed (One)";
  }

  function emptyState(title, message) {
    return `<div class="empty-state"><div class="empty-state-icon">⌑</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
  }

  function tableCell(record, key, page) {
    if (key === "stock") return displayValue(key, "", record, page);
    return displayValue(key, key === "total" ? undefined : record[key], record, page);
  }

  function renderTable(page, records, options = {}) {
    const columns = options.columns || pageColumns(page);
    const canEdit = options.canEdit !== false;
    const canAdd = options.canAdd !== false;
    const title = options.title || page;
    const description = options.description || `Manage and review your ${page.toLowerCase()} records.`;
    const filtered = records.filter((record) => Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(searchTerm)));
    return `
      <div class="section-heading"><div><h1 class="page-title">${escapeHtml(title)}</h1><p class="page-subtitle">${escapeHtml(description)}</p></div></div>
      <div class="page-toolbar"><div class="period-label">${filtered.length} ${filtered.length === 1 ? "record" : "records"}</div>
        <div class="toolbar-actions"><label class="search-box"><span>⌕</span><input id="table-search" type="search" value="${escapeHtml(searchTerm)}" placeholder="Search records..." aria-label="Search records"></label>
          <button class="btn" data-export="${escapeHtml(page)}">↓ <span>Export</span></button>
          ${canAdd ? `<button class="btn btn-primary" data-add-page="${escapeHtml(page)}"><span>＋</span> Add ${escapeHtml(page === "Products" ? "product" : page === "Purchase" ? "purchase" : page === "Sale" ? "sale" : page.toLowerCase())}</button>` : ""}
        </div>
      </div>
      <div class="table-card">
        ${filtered.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr>${columns.map(([, label]) => `<th>${escapeHtml(label.toUpperCase())}</th>`).join("")}<th style="text-align:right">ACTIONS</th></tr></thead>
          <tbody>${filtered.map((record) => `<tr data-record-id="${escapeHtml(record.id)}">${columns.map(([key]) => `<td class="${["name", "businessName", "employee"].includes(key) ? "table-primary" : ""}">${tableCell(record, key, page)}</td>`).join("")}
            <td><div class="row-actions"><button class="row-action" data-view-page="${escapeHtml(page)}" data-record-id="${escapeHtml(record.id)}" aria-label="View record" title="View">⌕</button>
              ${canEdit ? `<button class="row-action" data-edit-page="${escapeHtml(page)}" data-record-id="${escapeHtml(record.id)}" aria-label="Edit record" title="Edit">✎</button><button class="row-action delete" data-delete-page="${escapeHtml(page)}" data-record-id="${escapeHtml(record.id)}" aria-label="Delete record" title="Delete">×</button>` : ""}</div></td></tr>`).join("")}</tbody>
          </table></div><div class="table-footer"><span>Showing ${filtered.length} ${filtered.length === 1 ? "record" : "records"}</span><span>All changes are saved automatically</span></div>` : emptyState(searchTerm ? "No matching records" : `No ${page.toLowerCase()} yet`, searchTerm ? "Try a different search term." : `Add your first ${page.toLowerCase()} to see it here.`)}
      </div>`;
  }

  function renderCashDue() {
    const records = pageData("Cash Due");
    const supplierTotal = records.filter((record) => record.dueType === "Supplier").reduce((sum, record) => sum + record.due, 0);
    const clientTotal = records.filter((record) => record.dueType === "Customer").reduce((sum, record) => sum + record.due, 0);
    const enriched = records.map((record) => ({ ...record, amount: record.due, category: record.dueType, description: record.party }));
    return `<div class="section-heading"><div><h1 class="page-title">Cash Due</h1><p class="page-subtitle">Track outstanding supplier balances and customer receivables.</p></div></div>
      <section class="detail-cards"><article class="detail-card"><span>Supplier payable</span><strong>${currency(supplierTotal)}</strong></article><article class="detail-card"><span>Customer receivable</span><strong>${currency(clientTotal)}</strong></article><article class="detail-card"><span>Total outstanding</span><strong>${currency(supplierTotal + clientTotal)}</strong></article></section>
      ${renderTable("Cash Due", enriched, { columns: [["date", "Date"], ["category", "Type"], ["description", "Party"], ["reference", "Reference"], ["amount", "Due amount"]], canAdd: false, canEdit: false, description: "Outstanding balances from purchase and sale records." })}`;
  }

  function renderFinancialReport(page) {
    if (page === "Cash In Hand") {
      return `<div class="section-heading"><div><h1 class="page-title">Cash In Hand</h1><p class="page-subtitle">Estimated cash position based on recorded transactions.</p></div></div>
        <div class="table-card report-placeholder"><div><div class="empty-state-icon">৳</div><strong>${currency(cashInHand())}</strong><p>Opening balance plus received sales and income, less paid purchases, expenses, and salaries.</p></div></div>`;
    }
    if (page === "Net Profit") {
      const sales = totalFor("Sale"), income = totalFor("Income"), purchases = totalFor("Purchase");
      const expenses = totalFor("Expense") + totalFor("Salary");
      const net = sales + income - purchases - expenses;
      return `<div class="section-heading"><div><h1 class="page-title">Net Profit</h1><p class="page-subtitle">A simple profit overview based on the records you've entered.</p></div></div>
        <section class="detail-cards"><article class="detail-card"><span>Sales revenue</span><strong>${currency(sales)}</strong></article><article class="detail-card"><span>Other income</span><strong>${currency(income)}</strong></article><article class="detail-card"><span>Purchases &amp; expenses</span><strong>${currency(purchases + expenses)}</strong></article></section>
        <div class="table-card report-placeholder"><div><div class="empty-state-icon">↗</div><strong>${currency(net)}</strong><p>Estimated net profit (sales + other income − purchases − expenses). This is an operational summary, not a formal accounting statement.</p></div></div>`;
    }
    const assets = allRecords("products").reduce((sum, product) => sum + Math.max(0, stockFor(product)) * Number(product.costPrice || 0), 0)
      + allRecords("Fixed Assets").reduce((sum, item) => sum + Number(item.value || 0), 0);
    const receivable = allRecords("Sale").reduce((sum, record) => sum + Math.max(0, recordAmount(record, "Sale") - Number(record.paidAmount || 0)), 0);
    const payable = allRecords("Purchase").reduce((sum, record) => sum + Math.max(0, recordAmount(record, "Purchase") - Number(record.paidAmount || 0)), 0);
    const loans = allRecords("Loan").filter((record) => record.status !== "Paid").reduce((sum, record) => sum + Number(record.amount || 0), 0);
    return `<div class="section-heading"><div><h1 class="page-title">Balance Sheet</h1><p class="page-subtitle">A simplified snapshot of recorded assets and liabilities.</p></div></div>
      <section class="detail-cards"><article class="detail-card"><span>Inventory &amp; fixed assets</span><strong>${currency(assets)}</strong></article><article class="detail-card"><span>Customer receivables</span><strong>${currency(receivable)}</strong></article><article class="detail-card"><span>Supplier payables &amp; loans</span><strong>${currency(payable + loans)}</strong></article></section>
      <div class="table-card report-placeholder"><div><div class="empty-state-icon">⚖</div><strong>Estimated net position: ${currency(assets + receivable - payable - loans)}</strong><p>This simplified view uses only data entered in the application and is not a formal balance sheet.</p></div></div>`;
  }

  function renderPage() {
    const app = document.getElementById("app-content");
    refreshBranchOptions();
    document.getElementById("page-breadcrumb").textContent = activePage;
    if (activePage === "Dashboard") app.innerHTML = renderDashboard();
    else if (activePage === "Settings") app.innerHTML = renderSettings();
    else if (activePage === "Cash Due") app.innerHTML = renderCashDue();
    else if (activePage === "Cash Book") app.innerHTML = renderTable("Cash Book", pageData("Cash Book"), { canAdd: false, canEdit: false, description: "Cash received and paid across sales, purchases, income, expenses, and salary." });
    else if (["Cash In Hand", "Net Profit", "Balance Sheet"].includes(activePage)) app.innerHTML = renderFinancialReport(activePage);
    else {
      const report = reportConfig[activePage];
      const sourcePage = report ? report.source : activePage;
      const records = pageData(activePage);
      app.innerHTML = renderTable(sourcePage, records, {
        title: report?.title || activePage,
        description: report?.description || undefined,
        canAdd: !report && activePage !== "Stock",
        canEdit: !report && activePage !== "Stock"
      });
    }
    renderNavigation();
    refreshIcons();
  }

  function renderField(field, existing = {}) {
    const required = field.required ? "required" : "";
    const value = existing[field.key] ?? (typeof field.default === "function" ? field.default() : field.default ?? "");
    const common = `name="${escapeHtml(field.key)}" id="field-${escapeHtml(field.key)}" ${required} ${field.min != null ? `min="${field.min}"` : ""} ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""}`;
    let control;
    if (field.type === "select") {
      control = `<select ${common}><option value="">Select ${escapeHtml(field.label.toLowerCase())}</option>${field.options.map((option) => `<option value="${escapeHtml(option)}"${String(value) === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
    } else if (field.type === "product") {
      control = `<select ${common}><option value="">Select a product</option>${allRecords("products").map((product) => `<option value="${escapeHtml(product.id)}"${value === product.id ? " selected" : ""}>${escapeHtml(product.name)} · ${escapeHtml(product.sku || "No code")}</option>`).join("")}</select>`;
    } else if (field.type === "branch") {
      const branches = [...new Set(["Anaf Poultry Feed (One)", "Anaf Poultry Feed (Two)", "Main Branch", ...allRecords("Branches").map((branch) => branch.name).filter(Boolean)])];
      control = `<select ${common}><option value="">Select ${escapeHtml(field.label.toLowerCase())}</option>${branches.map((branch) => `<option value="${escapeHtml(branch)}"${String(value) === branch ? " selected" : ""}>${escapeHtml(branch)}</option>`).join("")}</select>`;
    } else if (field.type === "textarea") {
      control = `<textarea ${common}>${escapeHtml(value)}</textarea>`;
    } else {
      control = `<input ${common} type="${field.type || "text"}" value="${escapeHtml(value)}"${field.type === "number" ? ' step="any"' : ""}>`;
    }
    return `<div class="form-field${field.full ? " full" : ""}"><label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>${control}</div>`;
  }

  function openForm(page, record) {
    const fields = schemas[page];
    if (!fields) {
      showToast(`The ${page} form is not available yet.`, true);
      return;
    }
    if ((page === "Purchase" || page === "Sale" || page === "Damage" || page === "Stock Transfer") && allRecords("products").length === 0) {
      showToast("Add a product before creating this record.", true);
      return;
    }
    const editing = Boolean(record);
    const formRecord = page === "Settings" && record ? {
      ...record,
      openingBalance: record.openingBalanceByBranch?.[selectedBranch()] ?? record.openingBalance
    } : record;
    const modalRoot = document.getElementById("modal-root");
    modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header"><div><h2 id="modal-title">${editing ? "Edit" : "Add"} ${escapeHtml(page === "Products" ? "product" : page === "Purchase" ? "purchase" : page === "Sale" ? "sale" : page.toLowerCase())}</h2><p>${storageMode === "local" ? "Your changes are saved in this browser automatically." : "Your changes are saved to your account automatically."}</p></div><button class="modal-close" type="button" data-close-modal aria-label="Close">×</button></header>
      <form class="modal-form" id="record-form" data-form-page="${escapeHtml(page)}" data-record-id="${escapeHtml(record?.id || "")}">
        <div class="form-grid">${fields.map((field) => renderField(field, formRecord || {})).join("")}
          ${["Purchase", "Sale"].includes(page) ? `<div class="form-field full"><span class="form-hint">Total is calculated automatically from quantity × unit price.</span></div>` : ""}
        </div>
        <div class="modal-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="submit" class="btn btn-primary">${editing ? "Save changes" : "Save record"}</button></div>
      </form></section></div>`;
    const productSelect = modalRoot.querySelector('[name="productId"]');
    const unitPrice = modalRoot.querySelector('[name="unitPrice"]');
    if (productSelect && unitPrice && !editing) {
      productSelect.addEventListener("change", () => {
        const product = productById(productSelect.value);
        if (product) unitPrice.value = page === "Sale" ? product.sellingPrice : product.costPrice;
      });
    }
    modalRoot.querySelector('[name="name"], [name="businessName"], [name="supplier"], [name="client"]')?.focus();
  }

  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  }

  function openHelp() {
    document.getElementById("modal-root").innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header"><div><h2 id="modal-title">Anaf Poultry Feed help</h2><p>Quick tips for using your business dashboard.</p></div><button class="modal-close" type="button" data-close-modal aria-label="Close">×</button></header>
      <div class="modal-form"><div class="form-field"><strong>Manage records</strong><span class="form-hint">Choose a section in the sidebar, then use Add to create records. Use the row actions to view, edit, or delete entries.</span></div>
      <div class="form-field" style="margin-top:14px"><strong>Inventory</strong><span class="form-hint">Purchases increase available stock. Sales and damage reduce it, and the app prevents recording more than you have.</span></div>
      <div class="form-field" style="margin-top:14px"><strong>Your data</strong><span class="form-hint">${storageMode === "local" ? "Records and settings are saved in this browser. Export important tables as CSV and keep browser data backed up." : "Records are saved to your account in the local SQLite database. Back up the database file and export important tables as CSV."}</span></div>
      <div class="modal-actions"><button class="btn btn-primary" type="button" data-close-modal>Got it</button></div></div></section></div>`;
  }

  function toggleProfileMenu() {
    const menu = document.getElementById("profile-menu");
    const button = document.getElementById("profile-button");
    const isOpen = menu.hidden;
    menu.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
  }

  function closeProfileMenu() {
    const menu = document.getElementById("profile-menu");
    const button = document.getElementById("profile-button");
    if (menu && !menu.hidden) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  }

  function renderAuth(mode = "login", errorMessage = "") {
    const register = mode === "register";
    const screen = document.getElementById("auth-screen");
    screen.hidden = false;
    document.getElementById("sidebar").hidden = true;
    document.querySelector(".main-shell").hidden = true;
    screen.innerHTML = `<div class="auth-card">
      <div class="auth-brand"><div class="brand-mark" aria-hidden="true">A</div><div class="brand-copy"><span>Anaf Poultry</span><small>FEED &amp; FARM</small></div></div>
      <h1>${register ? "Create your account" : "Welcome back"}</h1>
      <p class="auth-subtitle">${register ? "Set up a secure account for your farm dashboard." : "Sign in to manage your poultry feed business."}</p>
      ${storageMode === "local" ? `<p class="auth-storage-note">Browser-local mode: your account and business data stay in this browser and do not sync to a server.</p>` : ""}
      ${errorMessage ? `<div class="auth-error" role="alert">${escapeHtml(errorMessage)}</div>` : ""}
      <form id="auth-form" data-auth-mode="${register ? "register" : "login"}">
        ${register ? `<label class="auth-field">Full name<input name="name" type="text" autocomplete="name" required minlength="2" maxlength="100"></label>` : ""}
        <label class="auth-field">Email address<input name="email" type="email" autocomplete="email" required maxlength="254"></label>
        <label class="auth-field">Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" required minlength="${register ? "10" : "1"}" maxlength="200">${register ? `<small>Use at least 10 characters.</small>` : ""}</label>
        <button class="btn btn-primary auth-submit" type="submit">${register ? "Create account" : "Log in"}</button>
      </form>
      <p class="auth-switch">${register ? "Already have an account?" : "New to Anaf Poultry Feed?"} <button type="button" data-auth-mode="${register ? "login" : "register"}">${register ? "Log in" : "Create an account"}</button></p>
    </div>`;
    screen.querySelector('input[name="email"]')?.focus();
  }

  async function handleAuthSubmit(form) {
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Please wait…";
    const formData = new FormData(form);
    const mode = form.dataset.authMode;
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || "")
    };
    if (mode === "register") payload.name = String(formData.get("name") || "").trim();
    try {
      if (storageMode === "local") {
        await authenticateLocally(mode, payload);
        await showDashboard();
        return;
      }
      const result = await apiRequest(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) });
      await enterDashboard(result.user);
    } catch (error) {
      if (error.isNetworkError && storageMode === "api") {
        storageMode = "local";
        try {
          await authenticateLocally(mode, payload);
          await showDashboard();
          return;
        } catch (localError) {
          renderAuth(mode, localError.message || "Could not authenticate.");
          return;
        }
      }
      renderAuth(mode, error.message || "Could not authenticate.");
    }
  }

  async function showDashboard() {
    const user = currentUser;
    state = await loadState();
    const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    document.querySelector("#profile-button .avatar").textContent = initials;
    document.querySelector("#profile-button .profile-copy strong").textContent = user.name;
    document.querySelector("#profile-button .profile-copy small").textContent = user.role;
    document.querySelector(".profile-menu-heading strong").textContent = user.name;
    document.querySelector(".profile-menu-heading span").textContent = user.email;
    document.getElementById("auth-screen").hidden = true;
    document.getElementById("sidebar").hidden = false;
    document.querySelector(".main-shell").hidden = false;
    renderPage();
  }

  async function enterDashboard(user) {
    currentUser = user;
    await showDashboard();
  }

  async function handleSubmit(form) {
    const page = form.dataset.formPage;
    const recordId = form.dataset.recordId;
    const fields = schemas[page];
    if (!fields) return;
    const formData = new FormData(form);
    const record = {};
    fields.forEach((field) => {
      const value = String(formData.get(field.key) ?? "").trim();
      if (field.type === "number") record[field.key] = value === "" ? 0 : Number(value);
      else record[field.key] = value;
    });
    if (["Purchase", "Sale"].includes(page)) {
      const total = Number(record.quantity || 0) * Number(record.unitPrice || 0);
      if (record.paidAmount > total) {
        showToast("Amount paid cannot be greater than the transaction total.", true);
        return;
      }
      if (page === "Stock Transfer") {
        if (record.fromBranch === record.toBranch) {
          showToast("Choose two different branches for a stock transfer.", true);
          return;
        }
        if (record.fromBranch !== selectedBranch()) {
          showToast("Start a stock transfer from the currently selected branch.", true);
          return;
        }
      }
    }
    if (["Purchase", "Sale", "Damage"].includes(page)) {
      const previousRecord = allRecords(page).find((item) => item.id === recordId);
      const productIds = new Set([previousRecord?.productId, record.productId].filter(Boolean));
      if ([...productIds].some((productId) => projectedStock(productId, page, recordId, record) < 0)) {
        showToast("This change would leave a product with negative stock. Check the available inventory first.", true);
        return;
      }
    }
    if (page === "Products" && recordId) {
      const oldProduct = productById(recordId);
      if (oldProduct) {
        const soldOrDamaged = allRecords("Sale").filter((item) => item.productId === recordId).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          + allRecords("Damage").filter((item) => item.productId === recordId).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const purchased = allRecords("Purchase").filter((item) => item.productId === recordId).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        if (Number(record.openingStock || 0) + purchased < soldOrDamaged) {
          showToast("Opening stock cannot be lower than quantities already sold or damaged.", true);
          return;
        }
      }
    }
    if (page === "Settings") {
      const previousState = JSON.parse(JSON.stringify(state));
      const { openingBalance, ...sharedSettings } = record;
      state.settings = {
        ...state.settings,
        ...sharedSettings,
        openingBalanceByBranch: {
          ...(state.settings.openingBalanceByBranch || {}),
          [selectedBranch()]: openingBalance
        }
      };
      if (!(await persist())) {
        state = previousState;
        return;
      }
      closeModal();
      renderPage();
      showToast("Business settings saved successfully.");
      return;
    }
    if (page === "Branches") {
      const duplicate = allRecords("Branches").some((branch) =>
        branch.id !== recordId && String(branch.name).trim().toLowerCase() === String(record.name).trim().toLowerCase());
      if (duplicate) {
        showToast("A branch with this name already exists.", true);
        return;
      }
    }
    const storageKey = page === "Products" ? "products" : page;
    if (BRANCH_SCOPED_COLLECTIONS.has(storageKey)) record.branch = selectedBranch();
    const previousState = JSON.parse(JSON.stringify(state));
    if (!Array.isArray(state[storageKey])) state[storageKey] = [];
    if (recordId) {
      const index = state[storageKey].findIndex((item) => item.id === recordId);
      if (index < 0) {
        showToast("This record could not be found. Refresh and try again.", true);
        return;
      }
      state[storageKey][index] = { ...state[storageKey][index], ...record, id: recordId };
    } else {
      state[storageKey].unshift({ ...record, id: uid() });
    }
    if (!(await persist())) {
      state = previousState;
      return;
    }
    closeModal();
    searchTerm = "";
    renderPage();
    showToast(`${page} ${recordId ? "updated" : "added"} successfully.`);
  }

  function viewRecord(page, recordId) {
    const records = pageData(page);
    const record = records.find((item) => item.id === recordId);
    if (!record) {
      showToast("Record not found.", true);
      return;
    }
    const columns = pageColumns(page);
    const modalRoot = document.getElementById("modal-root");
    modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header"><div><h2 id="modal-title">${escapeHtml(page)} details</h2><p>Record information</p></div><button class="modal-close" type="button" data-close-modal aria-label="Close">×</button></header>
      <div class="modal-form"><div class="form-grid">${columns.map(([key, label]) => `<div class="form-field${["address", "description"].includes(key) ? " full" : ""}"><label>${escapeHtml(label)}</label><div class="form-hint">${tableCell(record, key, page)}</div></div>`).join("")}</div>
      <div class="modal-actions"><button class="btn" type="button" data-close-modal>Close</button></div></div></section></div>`;
  }

  async function deleteRecord(page, recordId) {
    if (!window.confirm(`Delete this ${page.toLowerCase()} record? This cannot be undone.`)) return;
    const storageKey = page === "Products" ? "products" : page;
    if (!Array.isArray(state[storageKey])) return;
    const recordToDelete = state[storageKey].find((record) => record.id === recordId);
    if (page === "Purchase" && recordToDelete && projectedStock(recordToDelete.productId, page, recordId, null) < 0) {
      showToast("This purchase is needed to cover existing sales or damage and cannot be deleted.", true);
      return;
    }
    if (page === "Products" && ["Purchase", "Sale", "Damage", "Stock Transfer"].some((transaction) =>
      allRecords(transaction).some((record) => record.productId === recordId))) {
      showToast("This product is linked to a transaction and cannot be deleted.", true);
      return;
    }
    if (page === "Branches" && recordToDelete) {
      const protectedBranches = ["Anaf Poultry Feed (One)", "Anaf Poultry Feed (Two)", "Main Branch"];
      if (protectedBranches.includes(recordToDelete.name)) {
        showToast("Default branches cannot be deleted.", true);
        return;
      }
      const hasRecords = [...BRANCH_SCOPED_COLLECTIONS].some((collection) =>
        Array.isArray(state[collection]) && state[collection].some((record) =>
          record.branch === recordToDelete.name || record.fromBranch === recordToDelete.name || record.toBranch === recordToDelete.name));
      if (hasRecords) {
        showToast("This branch has business records and cannot be deleted.", true);
        return;
      }
    }
    const previousState = JSON.parse(JSON.stringify(state));
    const before = state[storageKey].length;
    state[storageKey] = state[storageKey].filter((record) => record.id !== recordId);
    if (state[storageKey].length === before) {
      showToast("Record not found.", true);
      return;
    }
    if (!(await persist())) {
      state = previousState;
      return;
    }
    renderPage();
    showToast(`${page} record deleted.`);
  }

  function exportCsv(page) {
    const report = reportConfig[page];
    const sourcePage = report?.source || page;
    const columns = pageColumns(sourcePage);
    const records = pageData(page);
    const csvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [columns.map(([, label]) => csvValue(label))];
    records.forEach((record) => rows.push(columns.map(([key]) => {
      if (key === "stock") return csvValue(stockFor(record));
      if (key === "productId") return csvValue(productName(record.productId));
      if (key === "total") return csvValue(recordAmount(record, sourcePage));
      return csvValue(record[key] ?? "");
    })));
    const file = new Blob([`\uFEFF${rows.map((row) => row.join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const downloadUrl = URL.createObjectURL(file);
    link.href = downloadUrl;
    link.download = `${page.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    showToast(`${page} exported as CSV.`);
  }

  let toastTimer;
  function showToast(message, error = false) {
    const region = document.getElementById("toast-region");
    const toast = document.createElement("div");
    toast.className = `toast${error ? " error" : ""}`;
    toast.innerHTML = `<span class="toast-icon">${error ? "!" : "✓"}</span><span>${escapeHtml(message)}</span>`;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3300);
  }

  function setPage(page) {
    activePage = page;
    searchTerm = "";
    renderPage();
    closeProfileMenu();
    closeSidebar();
  }

  function refreshBranchOptions() {
    const select = document.getElementById("branch-select");
    if (!select) return;
    const selected = getStoredValue(BRANCH_KEY) || select.value;
    const branches = [...new Set([
      "Anaf Poultry Feed (One)",
      "Anaf Poultry Feed (Two)",
      "Main Branch",
      ...allRecords("Branches").map((branch) => branch.name).filter(Boolean)
    ])];
    select.innerHTML = branches.map((branch) => `<option value="${escapeHtml(branch)}">${escapeHtml(branch)}</option>`).join("");
    select.value = branches.includes(selected) ? selected : branches[0];
    if (select.value !== selected) {
      setStoredValue(BRANCH_KEY, select.value);
    }
    const miniBranch = document.querySelector(".branch-mini span:last-child");
    if (miniBranch) miniBranch.textContent = select.value;
  }

  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("mobile-overlay").classList.remove("visible");
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const authModeButton = target.closest("[data-auth-mode]:not(#auth-form)");
      if (authModeButton) {
        renderAuth(authModeButton.dataset.authMode);
        return;
      }
      if (target.closest("[data-logout]")) {
        const logoutRequest = storageMode === "local"
          ? logoutLocally()
          : apiRequest("/api/auth/logout", { method: "POST" });
        logoutRequest
          .catch((error) => showToast(`Could not log out: ${error.message}`, true))
          .finally(() => {
            currentUser = null;
            state = null;
            renderAuth("login");
          });
        return;
      }
      if (target.closest("#profile-button")) {
        toggleProfileMenu();
        return;
      }
      if (target.closest("#help-button")) {
        openHelp();
        return;
      }
      if (target.closest("[data-edit-settings]")) {
        openForm("Settings", state.settings);
        return;
      }
      if (target.closest("[data-reset-dashboard]")) {
        resetDashboard();
        return;
      }
      const navButton = target.closest("[data-page]");
      if (navButton) {
        setPage(navButton.dataset.page);
        return;
      }
      const addButton = target.closest("[data-add-page]");
      if (addButton) {
        const page = addButton.dataset.addPage;
        openForm(page);
        return;
      }
      const editButton = target.closest("[data-edit-page]");
      if (editButton) {
        const page = editButton.dataset.editPage;
        const record = allRecords(page).find((item) => item.id === editButton.dataset.recordId);
        if (record) openForm(page, record);
        else showToast("Record not found.", true);
        return;
      }
      const viewButton = target.closest("[data-view-page]");
      if (viewButton) {
        viewRecord(viewButton.dataset.viewPage, viewButton.dataset.recordId);
        return;
      }
      const deleteButton = target.closest("[data-delete-page]");
      if (deleteButton) {
        deleteRecord(deleteButton.dataset.deletePage, deleteButton.dataset.recordId);
        return;
      }
      const exportButton = target.closest("[data-export]");
      if (exportButton) {
        exportCsv(exportButton.dataset.export);
        return;
      }
      if (target.closest("[data-close-modal]") || target.matches("[data-backdrop]")) {
        closeModal();
        return;
      }
      if (target.closest("#menu-toggle")) {
        document.getElementById("sidebar").classList.add("open");
        document.getElementById("mobile-overlay").classList.add("visible");
        return;
      }
      if (target.closest("#sidebar-close, #mobile-overlay")) {
        closeSidebar();
        return;
      }
      if (!target.closest(".profile-menu-anchor")) closeProfileMenu();
    });

    document.addEventListener("submit", (event) => {
      if (event.target.matches("#auth-form")) {
        event.preventDefault();
        handleAuthSubmit(event.target);
        return;
      }
      if (event.target.matches("#record-form")) {
        event.preventDefault();
        handleSubmit(event.target);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
        closeSidebar();
        closeProfileMenu();
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target.matches("#table-search")) {
        const cursor = event.target.selectionStart;
        searchTerm = event.target.value.toLowerCase().trim();
        renderPage();
        const nextSearch = document.getElementById("table-search");
        nextSearch?.focus();
        nextSearch?.setSelectionRange(cursor, cursor);
      }
    });

    const branchSelect = document.getElementById("branch-select");
    const savedBranch = getStoredValue(BRANCH_KEY);
    if (savedBranch && [...branchSelect.options].some((option) => option.value === savedBranch)) branchSelect.value = savedBranch;
    branchSelect.addEventListener("change", () => {
      setStoredValue(BRANCH_KEY, branchSelect.value);
      renderPage();
    });
    document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    document.getElementById("footer-year").textContent = String(new Date().getFullYear());
  }

  function start() {
    bindEvents();
    renderAuth();
    if (storageMode === "local") {
      restoreLocalSession();
      return;
    }
    apiRequest("/api/auth/me")
      .then((result) => enterDashboard(result.user))
      .catch((error) => {
        if (error.status === 401) return;
        if (error.isNetworkError) {
          storageMode = "local";
          restoreLocalSession();
          return;
        }
        renderAuth("login", error.message || "Could not connect to the server.");
      });
  }

  start();
})();
