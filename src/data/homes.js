// Synthetic data. All homes, streets and people are made up.
// epc: energy rating A (best) to G (worst).
// dampRepairs: damp or mould repairs in the last 2 years.
// lastContactDays: days since the tenant last got in touch with Cloch.
// humidity: reading from a pilot sensor (%), or null if there's no sensor.
// breathingCondition: true / false if the tenant chose to tell us, null if not.
window.DATA = {
  you: "H-104",

  homes: [
    { id: "H-101", address: "3 Larkfield Row, Greenock", type: "Flat", epc: "E", dampRepairs: 2, lastContactDays: 40, humidity: 78,
      household: { people: 3, olderPerson: false, youngChild: true, breathingCondition: true } },
    { id: "H-102", address: "17 Kelburn Terrace, Port Glasgow", type: "House", epc: "C", dampRepairs: 0, lastContactDays: 90, humidity: null,
      household: { people: 4, olderPerson: false, youngChild: true, breathingCondition: null } },
    { id: "H-103", address: "8 Ardgowan Court, Gourock", type: "Flat", epc: "F", dampRepairs: 1, lastContactDays: 520, humidity: null,
      household: { people: 1, olderPerson: true, youngChild: false, breathingCondition: null } },
    { id: "H-104", address: "22 Brachelston Way, Greenock", type: "Flat", epc: "D", dampRepairs: 1, lastContactDays: 120, humidity: null,
      household: { people: 2, olderPerson: false, youngChild: true, breathingCondition: null } },
    { id: "H-105", address: "5 Cowal View, Greenock", type: "House", epc: "B", dampRepairs: 0, lastContactDays: 30, humidity: 52,
      household: { people: 2, olderPerson: true, youngChild: false, breathingCondition: false } },
    { id: "H-106", address: "41 Bogston Lane, Port Glasgow", type: "Flat", epc: "E", dampRepairs: 3, lastContactDays: 15, humidity: 81,
      household: { people: 2, olderPerson: true, youngChild: false, breathingCondition: true } },
    { id: "H-107", address: "12 Lyle Gardens, Gourock", type: "Flat", epc: "D", dampRepairs: 0, lastContactDays: 400, humidity: null,
      household: { people: 1, olderPerson: false, youngChild: false, breathingCondition: null } },
    { id: "H-108", address: "9 Kilmacolm Close, Port Glasgow", type: "House", epc: "G", dampRepairs: 1, lastContactDays: 200, humidity: null,
      household: { people: 5, olderPerson: false, youngChild: true, breathingCondition: null } },
    { id: "H-109", address: "30 Esplanade Walk, Greenock", type: "Flat", epc: "C", dampRepairs: 0, lastContactDays: 60, humidity: 58,
      household: { people: 1, olderPerson: true, youngChild: false, breathingCondition: false } },
    { id: "H-110", address: "2 Whinhill Place, Greenock", type: "Flat", epc: "E", dampRepairs: 2, lastContactDays: 10, humidity: null,
      household: { people: 3, olderPerson: false, youngChild: false, breathingCondition: true } },
    { id: "H-111", address: "14 Clune Brae, Port Glasgow", type: "House", epc: "D", dampRepairs: 0, lastContactDays: 700, humidity: null,
      household: { people: 2, olderPerson: true, youngChild: false, breathingCondition: null } },
    { id: "H-112", address: "6 Moorfield Road, Gourock", type: "Flat", epc: "B", dampRepairs: 0, lastContactDays: 25, humidity: null,
      household: { people: 2, olderPerson: false, youngChild: false, breathingCondition: false } }
  ],

  // Reports already in the system when the demo starts.
  reports: [
    { ref: "DM-2041", homeId: "H-101", date: "2026-10-20", rooms: ["Bedroom", "Bathroom"], severity: "large", health: "yes",
      note: "Black mould behind the cot.", status: "received", seen: false },
    { ref: "DM-2038", homeId: "H-106", date: "2026-10-14", rooms: ["Kitchen"], severity: "medium", health: "yes",
      note: "", status: "visit", officer: "Jamie Rennie", visitDate: "2026-10-24", seen: true },
    { ref: "DM-2033", homeId: "H-110", date: "2026-10-02", rooms: ["Bathroom"], severity: "small", health: "yes",
      note: "Keeps coming back.", status: "repair", officer: "Priya Nair", visitDate: "2026-10-09", seen: true },
    { ref: "DM-2044", homeId: "H-108", date: "2026-10-21", rooms: ["Living room", "Hall"], severity: "medium", health: "skip",
      note: "", status: "received", seen: false }
  ],

  officers: ["Jamie Rennie", "Priya Nair", "Callum Fraser", "Ewa Kowalska"]
};
