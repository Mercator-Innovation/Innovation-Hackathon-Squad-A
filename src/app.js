// Shared behaviour: the demo's data store, risk scoring and the view switch.
// tenant.js and office.js draw their own screens using what's here.

const STORE_KEY = "healthier-homes-demo";

const App = {
  state: null,
  views: {}, // tenant.js and office.js register a render() here

  start() {
    document.getElementById("product-name").textContent = CONTENT.productName;
    document.getElementById("prototype-banner").textContent = CONTENT.banner;

    this.state = this.load() || this.freshState();

    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => this.showView(btn.dataset.view));
    });
    document.getElementById("reset-demo").addEventListener("click", () => {
      this.state = this.freshState();
      this.save();
      location.reload(); // also clears what each screen has open
    });

    this.showView(this.state.view || "tenant");
  },

  freshState() {
    return {
      view: "tenant",
      reports: JSON.parse(JSON.stringify(DATA.reports)),
      nextRef: 2045,
      promptAnswered: false
    };
  },

  load() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  // Save and redraw. Call this after any change to App.state.
  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // Private window or blocked storage: the demo still works, it just won't remember.
    }
    this.render();
  },

  showView(name) {
    this.state.view = name;
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.view === name));
    });
    document.getElementById("tenant-view").hidden = name !== "tenant";
    document.getElementById("office-view").hidden = name !== "office";
    this.save();
  },

  render() {
    Object.values(this.views).forEach((view) => view.render());
  },

  home(id) {
    return DATA.homes.find((h) => h.id === id);
  },

  reportsFor(homeId) {
    return this.state.reports
      .filter((r) => r.homeId === homeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  openReport(homeId) {
    return this.reportsFor(homeId).find((r) => r.status !== "fixed");
  }
};

// Risk scoring. Each reason adds points, and we show every reason so a person
// can see why a home is ranked where it is. Change the points here.
const Risk = {
  score(home) {
    const reasons = [];
    const add = (points, text) => reasons.push({ points, text });

    // Score the worst open report, so a newer small report can't hide an older big one.
    const sizes = { small: 15, medium: 25, large: 35 };
    const open = App.reportsFor(home.id).filter((r) => r.status !== "fixed");
    const report = open.sort((a, b) => sizes[b.severity] - sizes[a.severity])[0];
    if (report) {
      add(sizes[report.severity], `Tenant reported ${report.severity === "large" ? "a lot of" : "some"} damp or mould`);
      if (open.some((r) => r.health === "yes")) add(15, "Tenant says someone has breathing problems");
    } else if (home.household.breathingCondition) {
      add(10, "Tenant has told us about breathing problems");
    }

    const epcPoints = { D: 8, E: 15, F: 20, G: 25 };
    if (epcPoints[home.epc]) add(epcPoints[home.epc], `Energy rating ${home.epc}: harder to keep warm`);
    if (home.dampRepairs > 0) add(Math.min(home.dampRepairs * 8, 24), `${home.dampRepairs} damp repair${home.dampRepairs > 1 ? "s" : ""} in the last 2 years`);
    const sensor = home.sensor;
    if (sensor && sensor.coldDays > 0) add(Math.round(20 * sensor.coldDays / sensor.days), `Sensor: below 18°C on ${sensor.coldDays} of the last ${sensor.days} days`);
    if (sensor && sensor.dampDays > 0) add(Math.round(20 * sensor.dampDays / sensor.days), `Sensor: humidity above 70% on ${sensor.dampDays} of the last ${sensor.days} days`);
    if (home.household.olderPerson) add(10, "Older person lives here");
    if (home.household.youngChild) add(10, "Young child lives here");
    if (home.lastContactDays > 365) add(10, `No contact for over a year`);

    reasons.sort((a, b) => b.points - a.points);
    const total = Math.min(100, reasons.reduce((sum, r) => sum + r.points, 0));
    const band = total >= 60 ? "high" : total >= 35 ? "medium" : "low";
    return { total, band, reasons };
  }
};

// Small helpers used by both views.
function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
