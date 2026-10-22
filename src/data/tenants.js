// Synthetic tenants. All names, ages and phone numbers are made up.
// age: the tenant's age in years, or null if we don't know it.
// sightLoss: true / false if the tenant chose to tell us they're blind or partially sighted, null if not.
// householdAges: how many people in the home are in each age range (0 to 5, 6 to 17, 18 to 64, 65 to 79, 80 or over).
//   The totals match the number of people in homes.js.
// appOptIn: whether the tenant has chosen to use the Healthier homes app.
window.TENANTS = {
  "H-101": { name: "Leanne Corrigan", age: 29, sightLoss: false, phone: "07700 900101", appOptIn: true, householdAges: { upTo5: 1, age18to64: 2 } },
  "H-102": { name: "Marek Nowak", age: 38, sightLoss: null, phone: "07700 900102", appOptIn: false, householdAges: { upTo5: 1, age6to17: 1, age18to64: 2 } },
  "H-103": { name: "Agnes Thomson", age: 81, sightLoss: true, phone: "", appOptIn: false, householdAges: { age80plus: 1 } },
  "H-104": { name: "Sam Docherty", age: 33, sightLoss: false, phone: "07700 900104", appOptIn: true, householdAges: { upTo5: 1, age18to64: 1 } },
  "H-105": { name: "Robert McLean", age: 74, sightLoss: false, phone: "07700 900105", appOptIn: true, householdAges: { age65to79: 2 } },
  "H-106": { name: "Isobel Grant", age: 79, sightLoss: null, phone: "07700 900106", appOptIn: true, householdAges: { age65to79: 1, age80plus: 1 } },
  "H-107": { name: "Kyle Ferguson", age: null, sightLoss: null, phone: "", appOptIn: false, householdAges: { age18to64: 1 } },
  "H-108": { name: "Amina Yusuf", age: 41, sightLoss: false, phone: "07700 900108", appOptIn: true, householdAges: { upTo5: 2, age6to17: 1, age18to64: 2 } },
  "H-109": { name: "Margaret Hughes", age: 83, sightLoss: true, phone: "07700 900109", appOptIn: false, householdAges: { age80plus: 1 } },
  "H-110": { name: "Darren Boyle", age: 52, sightLoss: false, phone: "07700 900110", appOptIn: true, householdAges: { age6to17: 1, age18to64: 2 } },
  "H-111": { name: "Elizabeth Kerr", age: 77, sightLoss: null, phone: "", appOptIn: false, householdAges: { age65to79: 2 } },
  "H-112": { name: "Tom Hendry", age: 45, sightLoss: false, phone: "07700 900112", appOptIn: true, householdAges: { age18to64: 2 } }
};
