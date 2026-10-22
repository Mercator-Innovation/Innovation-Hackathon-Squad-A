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
    if (!this.state.homes) this.state.homes = this.startingHomes(); // demo saved before homes could be edited
    this.state.homes.forEach((home) => { // demo saved before sensor readings were added
      if (!("sensor" in home)) home.sensor = (DATA.homes.find((h) => h.id === home.id) || {}).sensor || null;
    });

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
      homes: this.startingHomes(),
      reports: JSON.parse(JSON.stringify(DATA.reports)),
      nextRef: 2045,
      promptAnswered: false
    };
  },

  // Homes live in the saved state so head office can add, change and delete them.
  startingHomes() {
    return DATA.homes.map((home) => ({
      ...JSON.parse(JSON.stringify(home)),
      tenant: TENANTS[home.id] ? { ...TENANTS[home.id] } : null
    }));
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
    if (!document.getElementById(`${name}-view`)) name = "tenant"; // a view saved in the demo that no longer exists
    this.state.view = name;
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.view === name));
    });
    document.querySelectorAll(".view").forEach((section) => {
      section.hidden = section.id !== `${name}-view`;
    });
    this.save();
  },

  render() {
    Object.values(this.views).forEach((view) => view.render());
  },

  home(id) {
    return this.state.homes.find((h) => h.id === id);
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

// Awaab's Law (Scotland), in force from 6 October 2026. For each report the
// landlord must investigate within 10 working days, send the tenant a written
// summary within 3 working days of that, start repairs within 5 working days
// of that, and finish them within 20 working days of starting.
// Source: gov.scot/publications/awaabs-law-guidance-landlords-scotland
// Working days here skip weekends but not bank holidays.
const Awaab = {
  startDate: "2026-10-06",
  days: { investigate: 10, summary: 3, startRepair: 5, finishRepair: 20 },

  covered(report) {
    return report.date >= this.startDate;
  },

  // Each step with its due date, whether it's done, and which one is next.
  steps(report) {
    const today = todayIso();
    const investigated = report.status === "repair" || report.status === "fixed" ||
      (report.status === "visit" && report.visitDate <= today);
    const repairStarted = report.status === "repair" || report.status === "fixed";
    const invDate = investigated ? report.visitDate : null;
    const startDate = repairStarted ? (report.repairStarted || report.visitDate) : null;

    const steps = [
      { key: "investigate", due: addWorkingDays(report.date, this.days.investigate), done: investigated, doneOn: invDate },
      { key: "summary", due: invDate && addWorkingDays(invDate, this.days.summary), done: investigated, doneOn: invDate },
      { key: "startRepair", due: invDate && addWorkingDays(invDate, this.days.startRepair), done: repairStarted, doneOn: startDate },
      { key: "finishRepair", due: startDate && addWorkingDays(startDate, this.days.finishRepair), done: report.status === "fixed" }
    ];
    // The written summary goes out with the visit in this demo, so the next step skips it.
    const next = steps.find((s) => !s.done && s.key !== "summary") || null;
    if (next) next.left = workingDaysBetween(today, next.due);
    return { steps, next };
  }
};

function addWorkingDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) n--;
  }
  return d.toISOString().slice(0, 10);
}

// Working days from one date to another: negative when the second is in the past.
function workingDaysBetween(fromIso, toIso) {
  const sign = toIso >= fromIso ? 1 : -1;
  const [a, b] = sign > 0 ? [fromIso, toIso] : [toIso, fromIso];
  let count = 0;
  const d = new Date(a + "T12:00:00");
  while (d.toISOString().slice(0, 10) < b) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return sign * count;
}

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
