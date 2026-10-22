// The words people see. Edit freely: no code knowledge needed.
// Keep sentences short, use "you", and aim for a reading age of about 9.
window.CONTENT = {
  productName: "Healthier homes",
  banner: "This is a prototype. Everything in it is made up.",

  tenant: {
    greeting: "Hello",
    promptTitle: "Time for your monthly home check",
    promptText: "Have you seen any damp or mould at home this month? It only takes a minute to tell us.",
    promptYes: "Yes, I've seen some",
    promptNo: "No, all fine",
    promptThanks: "Thanks for checking. We'll ask again next month.",
    reportButton: "Tell us about damp or mould",
    yourReports: "Your reports",
    noReports: "You haven't told us about any damp or mould yet.",

    formTitle: "Tell us about damp or mould",
    roomsLabel: "Where have you seen it?",
    roomsHint: "Choose all that apply.",
    rooms: ["Bedroom", "Living room", "Kitchen", "Bathroom", "Hall", "Somewhere else"],
    severityLabel: "How bad is it?",
    severities: [
      { value: "small", label: "A small patch", hint: "Smaller than your hand" },
      { value: "medium", label: "A few patches", hint: "Or one bigger than a sheet of paper" },
      { value: "large", label: "A lot", hint: "It covers a big part of a wall or ceiling" }
    ],
    healthLabel: "Does anyone at home have breathing problems, like asthma?",
    healthHint: "This helps us decide who to visit first. You don't have to tell us.",
    healthOptions: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "skip", label: "I'd rather not say" }
    ],
    noteLabel: "Anything else you want to tell us? (optional)",
    submit: "Send to Cloch",
    back: "Back",
    errorRooms: "Choose where you've seen damp or mould",
    errorSeverity: "Choose how bad it is",
    errorSummary: "There is a problem",

    doneTitle: "Thanks, we've got your report",
    doneRef: "Your reference is",
    doneNext: "What happens next",
    doneSteps: [
      "We'll look at your report.",
      "We'll tell you when a housing officer can visit.",
      "We'll keep you updated here until it's fixed."
    ],
    doneButton: "Back to home",

    statusTitle: "Report",
    statusSteps: {
      received: "We got your report",
      visit: "Housing officer visit booked",
      repair: "Repair started",
      fixed: "Fixed"
    },
    visitText: "{officer} will visit on {date}.",
    viewReport: "See progress"
  },

  office: {
    alertsTitle: "New reports",
    noAlerts: "No new reports.",
    markSeen: "Mark as seen",
    listTitle: "Homes ranked by risk",
    listIntro: "Ranked by the things we know about each home. A person always decides what happens next.",
    filterLabel: "Show",
    filterAll: "All homes",
    filterHigh: "High risk only",
    cols: { rank: "Rank", home: "Home", risk: "Risk", why: "Why", status: "Status", action: "" },
    review: "Review",
    bands: { high: "High", medium: "Medium", low: "Low" },
    detailTitle: "Why this home is ranked",
    household: "Household",
    sensorTitle: "Sensor, last 14 days",
    sensorText: "Below 18°C on {cold} of {days} days (average {temp}°C). Humidity above 70% on {damp} of {days} days (average {humidity}%).",
    noSensor: "No sensor in this home. The ranking uses reports and what we know about the home.",
    reports: "Reports",
    assignTitle: "Send a housing officer",
    officerLabel: "Housing officer",
    dateLabel: "Visit date",
    dateError: "Choose a visit date from today onwards",
    assignButton: "Book visit",
    repairButton: "Mark repair started",
    fixedButton: "Mark as fixed",
    close: "Close",
    noStatus: "No open report",
    consentNote: "Health information is shown only if the tenant chose to share it."
  },

  properties: {
    intro: "Add, change or delete the homes Cloch manages, and the tenant in each one.",
    addButton: "Add a property",
    cols: { home: "Home", tenant: "Tenant", app: "App", edit: "" },
    empty: "Empty",
    optedIn: "Opted in",
    optedOut: "Opted out",
    edit: "Change",
    addTitle: "Add a property",
    editTitle: "Change property",
    homeSection: "The home",
    addressLabel: "Address",
    addressHint: "For example, 4 Union Street, Greenock",
    typeLabel: "Type of home",
    types: ["Flat", "House"],
    epcLabel: "Energy rating",
    epcHint: "From the home's energy performance certificate (EPC). A is best, G is worst.",
    repairsLabel: "Damp or mould repairs in the last 2 years",
    tenantSection: "The tenant",
    noTenant: "Nobody lives here at the moment.",
    nameLabel: "Tenant's name",
    nameHint: "Leave this empty if nobody lives here.",
    phoneLabel: "Phone number (optional)",
    peopleLabel: "How many people live here?",
    householdLabel: "Who lives here?",
    householdHint: "Choose all that apply.",
    olderPerson: "An older person",
    youngChild: "A young child",
    breathingLabel: "Has the tenant told us someone has breathing problems?",
    breathingOptions: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "They haven't told us" }
    ],
    appLabel: "Healthier homes app",
    appHint: "Only change this when the tenant asks. Opted-in tenants get monthly home checks and updates on their phone.",
    appOptions: [
      { value: "in", label: "Opted in" },
      { value: "out", label: "Opted out" }
    ],
    save: "Save",
    cancel: "Cancel",
    removeTenant: "Remove tenant (they've moved out)",
    removeTenantConfirm: "Remove {name} from {address}? The property will show as empty.",
    deleteProperty: "Delete property",
    deleteConfirm: "Delete {address}? This also deletes {count} damp and mould report(s). You can't undo this.",
    cantDelete: "You can't delete this home in the demo: it's the tenant on the phone.",
    errorSummary: "There is a problem",
    errorAddress: "Enter the address",
    errorPeople: "Enter how many people live here, as a number of 1 or more",
    added: "{address} added.",
    saved: "{address} saved.",
    removed: "Tenant removed from {address}.",
    deleted: "{address} deleted."
  }
};
