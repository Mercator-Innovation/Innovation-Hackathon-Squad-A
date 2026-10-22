// Demo controls: quick ways to set up the tenant's phone for a demo.
// Everything here is made up. Dates are worked out from today so the deadlines make sense.

const Demo = {
  // Several reports for the tenant on the phone, one at each stage.
  severalReports() {
    const you = DATA.you;
    return [
      { ref: "DM-3104", homeId: you, date: todayIso(-1), rooms: ["Kitchen"], severity: "small", health: "skip",
        note: "", status: "received", seen: false, tenantSeen: "received" },
      { ref: "DM-3103", homeId: you, date: todayIso(-5), rooms: ["Bedroom", "Hall"], severity: "medium", health: "skip",
        note: "", status: "visit", officer: "Callum Fraser", visitDate: addWorkingDays(todayIso(), 2), seen: true, tenantSeen: "received" },
      { ref: "DM-3102", homeId: you, date: todayIso(-12), rooms: ["Bathroom"], severity: "medium", health: "skip",
        note: "Mould round the window.", status: "repair", officer: "Priya Nair", visitDate: todayIso(-8),
        summarySent: todayIso(-7), repairStarted: todayIso(-6), seen: true, tenantSeen: "visit" },
      { ref: "DM-1962", homeId: you, date: "2026-03-04", rooms: ["Bedroom"], severity: "small", health: "skip",
        note: "", status: "fixed", officer: "Ewa Kowalska", visitDate: "2026-03-10", fixedDate: "2026-03-27", seen: true, tenantSeen: "fixed" }
    ];
  },

  // Swap the tenant's reports for a new set, and start the phone at the home check.
  setReports(reports) {
    const s = App.state;
    const dropped = s.reports.filter((r) => r.homeId === DATA.you).map((r) => r.ref);
    s.removedRefs = [...new Set([...(s.removedRefs || []), ...dropped])].filter((ref) => !reports.some((r) => r.ref === ref));
    s.reports = s.reports.filter((r) => r.homeId !== DATA.you).concat(reports);
    s.promptAnswered = false;
    s.view = "tenant";
    App.showView("tenant");
    Tenant.go(s.tenantSignedIn ? "home" : "sms");
    this.say(CONTENT.demo[reports.length ? "doneSeveral" : "doneNone"]);
  },

  startFromText() {
    App.state.tenantSignedIn = false;
    App.state.promptAnswered = false;
    App.showView("tenant");
    Tenant.go("sms");
    this.say(CONTENT.demo.doneText);
  },

  say(message) {
    const status = document.getElementById("demo-status");
    if (status) status.textContent = message;
  },

  render() {
    const el = document.getElementById("demo-controls");
    if (!el || el.dataset.ready) return; // drawn once; the buttons don't change
    const d = CONTENT.demo;
    el.dataset.ready = "true";
    el.innerHTML = `
      <details class="demo-panel">
        <summary>${esc(d.title)}</summary>
        <p class="hint">${esc(d.intro)}</p>
        <div class="button-row">
          <button type="button" class="button secondary small" data-demo="none">${esc(d.none)}</button>
          <button type="button" class="button secondary small" data-demo="several">${esc(d.several)}</button>
          <button type="button" class="button secondary small" data-demo="text">${esc(d.text)}</button>
        </div>
        <p class="hint" id="demo-status" role="status"></p>
      </details>`;
    el.querySelector('[data-demo="none"]').addEventListener("click", () => this.setReports([]));
    el.querySelector('[data-demo="several"]').addEventListener("click", () => this.setReports(this.severalReports()));
    el.querySelector('[data-demo="text"]').addEventListener("click", () => this.startFromText());
  }
};

App.views.demo = Demo;
