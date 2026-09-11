/* Shared planning calculations; no browser state. */
const Planning = (() => {
  const count = (value, fallback = 37) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 500 ? Number(value) : fallback;
  const nameKey = name => String(name).trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
  function base(amount, unit) {
    return unit === 'kg' ? { amount: amount * 1000, unit: 'g' } : unit === 'l' ? { amount: amount * 1000, unit: 'ml' } : { amount, unit };
  }
  function items(week, recipes) {
    const map = new Map();
    week.plan.forEach((id, day) => {
      if (week.noCooking?.[day]) return;
      const recipe = recipes.find(r => r.id === id);
      if (!recipe || !Number.isFinite(recipe.basePortions) || recipe.basePortions <= 0) return;
      recipe.ingredients.forEach(ingredient => {
        if (!Number.isFinite(ingredient.amount) || ingredient.amount <= 0) return;
        const normalized = base(ingredient.amount, ingredient.unit);
        const key = JSON.stringify([nameKey(ingredient.name), normalized.unit]);
        const item = map.get(key) || { ...ingredient, name: ingredient.name.trim(), unit: normalized.unit, amount: 0, key };
        item.amount += normalized.amount * week.dayPortions[day] / recipe.basePortions;
        map.set(key, item);
      });
    });
    return [...map.values()].map(item => {
      const quantity = Math.round(item.amount * 1e6) / 1e6;
      const token = JSON.stringify([item.key, quantity]);
      return { ...item, token, amount: quantity >= 1000 && ['g', 'ml'].includes(item.unit) ? quantity / 1000 : quantity,
        unit: quantity >= 1000 && item.unit === 'g' ? 'kg' : quantity >= 1000 && item.unit === 'ml' ? 'l' : item.unit };
    });
  }
  function emptyWeek(portions = 37) {
    return { plan: Array(5).fill(null), noCooking: Array(5).fill(false), portions, dayPortions: Array(5).fill(portions), checked: [], stockNotes: '' };
  }
  function migrate(saved) {
    const result = JSON.parse(JSON.stringify(saved));
    const fallback = count(result.portions);
    if (!result.weeks) result.weeks = { [result.weekStart]: { plan: result.plan, checked: result.checked, stockNotes: result.stockNotes } };
    for (const week of Object.values(result.weeks)) {
      week.plan = Array.from({ length: 5 }, (_, i) => week.plan?.[i] || null);
      week.noCooking = week.noCooking || Array(5).fill(false);
      week.portions = count(week.portions, fallback);
      week.dayPortions = Array.from({ length: 5 }, (_, i) => count(week.dayPortions?.[i], week.portions));
      week.stockNotes = week.stockNotes || '';
      week.checked = Array.isArray(week.checked) ? week.checked : [];
      if (result.version !== 2) {
        // Old checks used displayed names and units. Preserve only fully checked merged groups.
        const groups = new Map();
        week.plan.forEach((id, day) => {
          const r = result.recipes.find(r => r.id === id);
          if (!r) return;
          r.ingredients.forEach(x => {
            const key = (x.name + '|' + x.unit).toLowerCase();
            const group = groups.get(key) || { ...x, amount: 0 };
            group.amount += x.amount * week.dayPortions[day] / r.basePortions;
            groups.set(key, group);
          });
        });
        week.checked = items(week, result.recipes).filter(item => [...groups.values()].filter(x => JSON.stringify([nameKey(x.name), base(x.amount, x.unit).unit]) === item.key).every(x => {
          const unit = x.amount >= 1000 && x.unit === 'g' ? 'kg' : x.amount >= 1000 && x.unit === 'ml' ? 'l' : x.unit;
          return week.checked.includes(x.name + '|' + unit);
        })).map(item => item.token);
      }
    }
    result.version = 2;
    delete result.portions; delete result.plan; delete result.checked; delete result.stockNotes;
    return result;
  }
  function reconcile(week, recipes) {
    const valid = new Set(items(week, recipes).map(item => item.token));
    week.checked = week.checked.filter(token => valid.has(token));
  }
  function copyWeek(source) {
    return { ...emptyWeek(source.portions), plan: [...source.plan], noCooking: [...(source.noCooking || Array(5).fill(false))], dayPortions: [...source.dayPortions] };
  }
  return { count, items, emptyWeek, migrate, reconcile, copyWeek };
})();
if (typeof module !== 'undefined') module.exports = Planning;
