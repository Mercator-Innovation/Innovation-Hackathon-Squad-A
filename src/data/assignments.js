// More synthetic reports, so every housing officer has some assignments in the demo.
// All made up. They're added to the example reports in homes.js.
DATA.reports.push(
  { ref: "DM-2036", homeId: "H-103", date: "2026-10-09", rooms: ["Hall", "Kitchen"], severity: "medium", health: "skip",
    note: "My daughter is reporting this for me.", status: "visit", officer: "Ewa Kowalska", visitDate: "2026-10-21", seen: true },
  { ref: "DM-2039", homeId: "H-111", date: "2026-10-16", rooms: ["Bedroom"], severity: "small", health: "skip",
    note: "", status: "visit", officer: "Jamie Rennie", visitDate: "2026-10-23", seen: true },
  { ref: "DM-2035", homeId: "H-102", date: "2026-10-07", rooms: ["Bedroom", "Living room"], severity: "medium", health: "no",
    note: "Windows run with water every morning.", status: "visit", officer: "Priya Nair", visitDate: "2026-10-15", seen: true,
    notes: [{ date: "2026-10-15", by: "Priya Nair", text: "Visited. Heavy condensation in both rooms. Need to check the trickle vents and fan before deciding on a repair." }] },
  { ref: "DM-2037", homeId: "H-107", date: "2026-10-12", rooms: ["Bathroom"], severity: "large", health: "skip",
    note: "", status: "visit", officer: "Callum Fraser", visitDate: "2026-10-20", seen: true }
);
