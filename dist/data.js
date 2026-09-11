const KitchenData = (() => {
  const units = ['g', 'kg', 'ml', 'l', 'Stk.', 'Packung'];
  const categories = ['Gemüse', 'Kühlung', 'Fleisch', 'Trockenwaren', 'Sonstiges'];
  function requireValue(condition, message) { if (!condition) throw new Error(message); }
  const text = (value, max = 300) => typeof value === 'string' && value.length <= max;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const portions = value => Number.isInteger(value) && value >= 1 && value <= 500;
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCDay() === 1;
  }
  function validateRecipe(r) {
    requireValue(object(r) && text(r.id) && r.id.trim() && text(r.name) && r.name.trim(), 'Bitte einen Rezeptnamen eingeben.');
    requireValue(text(r.side) && text(r.allergens) && portions(r.basePortions), 'Grundmenge: ganze Zahl von 1 bis 500.');
    requireValue(Array.isArray(r.ingredients) && r.ingredients.length <= 200, 'Maximal 200 Zutaten pro Rezept.');
    for (const x of r.ingredients) {
      requireValue(object(x) && text(x.name) && x.name.trim(), 'Bitte jede Zutat benennen.');
      requireValue(Number.isFinite(x.amount) && x.amount > 0 && x.amount <= 1000000, 'Jede Zutatenmenge muss größer als 0 und höchstens 1.000.000 sein.');
      requireValue(units.includes(x.unit) && categories.includes(x.category), 'Bitte gültige Einheiten und Kategorien auswählen.');
    }
    return r;
  }
  function validateState(state) {
    requireValue(object(state) && state.version === 2, 'Dieses Datenformat wird nicht unterstützt.');
    requireValue(validDate(state.weekStart) && Array.isArray(state.recipes) && state.recipes.length <= 5000, 'Ungültige Rezept- oder Wochenübersicht.');
    const ids = new Set();
    state.recipes.forEach(r => { validateRecipe(r); requireValue(!ids.has(r.id), 'Doppelte Rezept-ID in der Sicherung.'); ids.add(r.id); });
    requireValue(object(state.weeks) && Object.keys(state.weeks).length <= 5200, 'Ungültige Wochenübersicht.');
    for (const [date, w] of Object.entries(state.weeks)) {
      requireValue(validDate(date) && object(w), 'Ungültiges Wochendatum.');
      requireValue(Array.isArray(w.plan) && w.plan.length === 5 && w.plan.every(id => id === null || ids.has(id)), 'Ein Wochenplan verweist auf ein unbekanntes Rezept.');
      requireValue(w.noCooking === undefined || (Array.isArray(w.noCooking) && w.noCooking.length === 5 && w.noCooking.every(x => typeof x === "boolean")), "Ungültige Tage ohne Kochen.");
      requireValue(portions(w.portions) && Array.isArray(w.dayPortions) && w.dayPortions.length === 5 && w.dayPortions.every(portions), 'Ungültige Kinderzahl in einem Wochenplan.');
      requireValue(text(w.stockNotes, 20000) && Array.isArray(w.checked) && w.checked.length <= 1000 && w.checked.every(x => text(x, 2000)), 'Ungültige Einkaufsdaten.');
    }
    requireValue(Object.hasOwn(state.weeks, state.weekStart), 'Die ausgewählte Woche fehlt.');
    return JSON.parse(JSON.stringify(state));
  }
  function backup(state) { return JSON.stringify({ app: 'kuechenplan', backupVersion: 1, createdAt: new Date().toISOString(), data: validateState(state) }, null, 2); }
  function parseBackup(content) {
    requireValue(typeof content === 'string' && content.length <= 10 * 1024 * 1024, 'Die Sicherung ist zu groß (maximal 10 MB).');
    let parsed;
    try { parsed = JSON.parse(content); } catch { throw new Error('Die Datei enthält keine gültige JSON-Sicherung.'); }
    requireValue(parsed?.app === 'kuechenplan' && parsed.backupVersion === 1, 'Bitte eine Küchenplan-Sicherung auswählen.');
    return validateState(parsed.data);
  }
  function restore(storage, key, recoveryKey, state) {
    const validated = validateState(state);
    const previous = storage.getItem(key);
    if (previous !== null) storage.setItem(recoveryKey, previous);
    // A failed write leaves the current state untouched.
    storage.setItem(key, JSON.stringify(validated));
    return validated;
  }
  function duplicate(r, id) { return { ...JSON.parse(JSON.stringify(r)), id, name: `${r.name.slice(0, 290)} (Kopie)` }; }
  return { units, categories, validateRecipe, validateState, backup, parseBackup, restore, duplicate };
})();
if (typeof module !== 'undefined') module.exports = KitchenData;
