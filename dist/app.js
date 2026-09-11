const STORAGE_KEY = "kuechenplan-prototyp-v1";
const dayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
const dayShort = ["MO", "DI", "MI", "DO", "FR"];
const categories = ["Gemüse", "Kühlung", "Fleisch", "Trockenwaren", "Sonstiges"];
const sampleRecipes = [
  { id:"kartoffel", name:"Kartoffel-Spinat-Auflauf", side:"Apfel", allergens:"G", basePortions:10, ingredients:[{name:"Kartoffeln",amount:2.2,unit:"kg",category:"Gemüse"},{name:"Spinat",amount:1,unit:"kg",category:"Gemüse"},{name:"Sahne",amount:.5,unit:"l",category:"Kühlung"},{name:"Käse",amount:350,unit:"g",category:"Kühlung"},{name:"Äpfel",amount:10,unit:"Stk.",category:"Gemüse"}]},
  { id:"linsen", name:"Linseneintopf mit Spätzle", side:"Joghurt", allergens:"A1, C, G", basePortions:10, ingredients:[{name:"Linsen",amount:900,unit:"g",category:"Trockenwaren"},{name:"Suppengemüse",amount:1.2,unit:"kg",category:"Gemüse"},{name:"Spätzle",amount:1.1,unit:"kg",category:"Trockenwaren"},{name:"Joghurt",amount:10,unit:"Stk.",category:"Kühlung"}]},
  { id:"maultaschen", name:"Überbackene Maultaschen", side:"Tomatensoße und Gurkensalat", allergens:"A1, C, G", basePortions:10, ingredients:[{name:"Maultaschen",amount:2,unit:"kg",category:"Kühlung"},{name:"Tomatensoße",amount:1.5,unit:"l",category:"Trockenwaren"},{name:"Käse",amount:300,unit:"g",category:"Kühlung"},{name:"Gurken",amount:4,unit:"Stk.",category:"Gemüse"}]},
  { id:"pute", name:"Putengeschnetzeltes", side:"Reis und Salat", allergens:"G", basePortions:10, ingredients:[{name:"Putenfleisch",amount:1.4,unit:"kg",category:"Fleisch"},{name:"Reis",amount:800,unit:"g",category:"Trockenwaren"},{name:"Sahne",amount:.5,unit:"l",category:"Kühlung"},{name:"Blattsalat",amount:3,unit:"Stk.",category:"Gemüse"}]},
  { id:"kuerbis", name:"Kürbiscremesuppe", side:"Brot", allergens:"A1, G", basePortions:10, ingredients:[{name:"Hokkaido-Kürbis",amount:2.5,unit:"kg",category:"Gemüse"},{name:"Kartoffeln",amount:.8,unit:"kg",category:"Gemüse"},{name:"Sahne",amount:.4,unit:"l",category:"Kühlung"},{name:"Brot",amount:2,unit:"Packung",category:"Trockenwaren"}]},
  { id:"milchreis", name:"Milchreis", side:"Apfelmus", allergens:"G", basePortions:10, ingredients:[{name:"Milchreis",amount:750,unit:"g",category:"Trockenwaren"},{name:"Milch",amount:3.5,unit:"l",category:"Kühlung"},{name:"Apfelmus",amount:2,unit:"Packung",category:"Trockenwaren"}]},
  { id:"fisch", name:"Seelachsfilet", side:"Kartoffeln und Gemüse", allergens:"D, G", basePortions:10, ingredients:[{name:"Seelachsfilet",amount:1.4,unit:"kg",category:"Fleisch"},{name:"Kartoffeln",amount:2,unit:"kg",category:"Gemüse"},{name:"Mischgemüse",amount:1.2,unit:"kg",category:"Gemüse"}]},
  { id:"nudeln", name:"Nudeln mit Tomatensoße", side:"Rohkost", allergens:"A1", basePortions:10, ingredients:[{name:"Nudeln",amount:1.1,unit:"kg",category:"Trockenwaren"},{name:"Tomatensoße",amount:1.8,unit:"l",category:"Trockenwaren"},{name:"Karotten",amount:1.2,unit:"kg",category:"Gemüse"}]}
];
function defaultWeek(){return{plan:["kartoffel","linsen","maultaschen","pute","kuerbis"],checked:[],stockNotes:""};}
function initialState(){return{weekStart:"2026-09-14",portions:37,recipes:sampleRecipes,weeks:{"2026-09-14":defaultWeek()}};}
let storageBlocked=false;
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved===null)return Planning.migrate(initialState());if(!saved?.recipes)throw new Error("Ungültige gespeicherte Daten");if(!saved.weeks){saved.weeks={[saved.weekStart||"2026-09-14"]:{plan:saved.plan||defaultWeek().plan,checked:saved.checked||[],stockNotes:saved.stockNotes||""}};delete saved.plan;delete saved.checked;delete saved.stockNotes;}return KitchenData.validateState(Planning.migrate(saved));}catch{storageBlocked=true;return Planning.migrate(initialState());}}
let state=loadState(),selectedDay=null,editingRecipeId=null,deferredInstall; const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function save(){
  if(storageBlocked){showStorageError("Gespeicherte Daten konnten nicht gelesen werden. Bitte unter Ausgabe eine Sicherung wiederherstellen. Die ursprünglichen Daten bleiben erhalten.");return false;}
  Object.values(state.weeks).forEach(week=>Planning.reconcile(week,state.recipes));
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$("#storage-error").classList.add("hidden");return true;}
  catch{showStorageError("Änderungen sind nicht gespeichert. Bitte Speicherplatz prüfen oder unter Ausgabe eine Sicherung herunterladen.");return false;}
}
function showStorageError(message){$("#storage-error").textContent=message;$("#storage-error").classList.remove("hidden");}
function currentWeek(){if(!state.weeks[state.weekStart])state.weeks[state.weekStart]=Planning.emptyWeek();return state.weeks[state.weekStart];}
function dateAt(i){const d=new Date(state.weekStart+"T12:00:00");d.setDate(d.getDate()+i);return d;}
function dateShort(d){return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit"}).format(d);}
function weekText(){const a=dateAt(0),b=dateAt(4),year=b.getFullYear(),month=new Intl.DateTimeFormat("de-DE",{month:"long"}).format(b);return a.getMonth()===b.getMonth()?`${a.getDate()}. - ${b.getDate()}. ${month} ${year}`:`${dateShort(a)} - ${dateShort(b)} ${year}`;}
function recipe(id){return state.recipes.find(r=>r.id===id);} function formatAmount(n){return new Intl.NumberFormat("de-DE",{maximumFractionDigits:2}).format(Math.round(n*100)/100);}
function normalizeAmount(amount,unit){if(unit==="g"&&amount>=1000)return{amount:amount/1000,unit:"kg"};if(unit==="ml"&&amount>=1000)return{amount:amount/1000,unit:"l"};return{amount,unit};}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2200);}
function renderPlan(){const week=currentWeek();$("#week-label").textContent=weekText();$("#portions").value=week.portions;$("#copy-week").disabled=!state.weeks[previousWeekKey()];$("#day-list").innerHTML=dayNames.map((day,i)=>{const off=week.noCooking?.[i],r=off?null:recipe(week.plan[i]);return `<article class="day-card ${off?"no-cooking":""}"><div class="day-date"><strong>${dayShort[i]}</strong><span>${dateShort(dateAt(i))}</span></div><button class="meal-select" data-day="${i}"><span>${off?"Kein Kochen":r?escapeHtml(r.name):"Gericht auswählen"}</span><small>${off?"Dieser Tag zählt nicht zur Einkaufsliste":r?escapeHtml(r.side):"Noch nicht geplant"}</small>${r?`<small class="allergen-line">Allergene: ${escapeHtml(allergenText(r.allergens))}</small>`:""}</button><label class="day-portions">Kinder<input type="number" min="1" max="500" step="1" inputmode="numeric" data-day-portions="${i}" ${off?"disabled":""} aria-label="Anzahl der Kinder am ${day}" value="${week.dayPortions[i]}" required></label></article>`;}).join("");}
function renderRecipes(filter=""){const q=filter.trim().toLowerCase(),items=state.recipes.filter(r=>(r.name+" "+r.side).toLowerCase().includes(q));$("#recipe-list").innerHTML=items.length?items.map(r=>`<article class="recipe-card"><div class="recipe-letter">${escapeHtml(r.name[0])}</div><div><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.side||"Ohne Beilage")}</p><small>${r.ingredients.length} Zutaten · für ${r.basePortions} Kinder${r.allergens?` · ${escapeHtml(r.allergens)}`:""}</small></div><div class="recipe-actions"><button class="recipe-action recipe-view-button" data-view-recipe="${escapeHtml(r.id)}" aria-label="${escapeHtml(r.name)} ansehen">Ansehen</button><button class="recipe-action" data-edit-recipe="${escapeHtml(r.id)}" aria-label="${escapeHtml(r.name)} bearbeiten">Bearbeiten</button><button class="recipe-action" data-duplicate-recipe="${escapeHtml(r.id)}" aria-label="${escapeHtml(r.name)} duplizieren">Duplizieren</button></div></article>`).join(""):`<div class="empty-state"><strong>Kein Rezept gefunden</strong><span>Versuchen Sie einen anderen Suchbegriff.</span></div>`;}
function shoppingItems(){return Planning.items(currentWeek(),state.recipes).sort((a,b)=>categories.indexOf(a.category)-categories.indexOf(b.category)||a.name.localeCompare(b.name,"de"));}
function renderShopping(){const week=currentWeek(),items=shoppingItems();$("#shopping-week").textContent=weekText();$("#shopping-summary").innerHTML=`<div><strong>${items.length}</strong><span>Artikel</span></div><div><strong>${week.plan.reduce((total,id,i)=>total+(!week.noCooking?.[i]&&recipe(id)?week.dayPortions[i]:0),0)}</strong><span>Portionen gesamt</span></div><div><strong>${week.plan.filter((id,i)=>id&&!week.noCooking?.[i]).length}</strong><span>Gerichte</span></div>`;$("#shopping-list").innerHTML=categories.map(cat=>{const group=items.filter(x=>x.category===cat);if(!group.length)return"";return`<section class="shopping-group"><h3>${cat}</h3>${group.map(x=>{const key=x.token;return`<label class="shopping-row ${week.checked.includes(key)?"checked":""}"><input type="checkbox" data-item="${escapeHtml(key)}" ${week.checked.includes(key)?"checked":""}><span>${escapeHtml(x.name)}</span><strong>${formatAmount(x.amount)} ${x.unit}</strong></label>`;}).join("")}</section>`;}).join("")||`<p class="empty-state">Wählen Sie Gerichte im Wochenplan aus.</p>`;$("#stock-notes").value=week.stockNotes;}
function renderAll(){renderPlan();renderRecipes($("#recipe-search")?.value||"");renderShopping();renderOutputs();}
function navigate(name){$$(".screen").forEach(s=>s.classList.toggle("active",s.id===`screen-${name}`));$$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.screen===name));window.scrollTo({top:0,behavior:"smooth"});if(name==="shopping")renderShopping();if(name==="output")renderOutputs();}
function openMealDialog(day){const plan=currentWeek().plan;selectedDay=day;$("#meal-dialog-day").textContent=`${dayNames[day]}, ${dateShort(dateAt(day))}`;$("#meal-options").innerHTML=`<button class="meal-option" data-day-status="off"><strong>Kein Kochen</strong><small>Kein Einkauf für diesen Tag</small></button><button class="meal-option" data-day-status="empty"><strong>Noch nicht geplant</strong><small>Gericht entfernen</small></button>`+state.recipes.map(r=>`<button class="meal-option ${plan[day]===r.id?"selected":""}" data-recipe="${escapeHtml(r.id)}"><span><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.side||"Ohne Beilage")}${r.allergens?` · ${escapeHtml(r.allergens)}`:""}</small></span><b>${plan[day]===r.id?"✓":"›"}</b></button>`).join("");$("#meal-dialog").showModal();}
function openRecipeView(id){
  const r=recipe(id);if(!r)return;
  $("#recipe-view-title").textContent=r.name;
  $("#recipe-view-content").innerHTML=`<p>${escapeHtml(r.side||"Ohne Beilage")}</p><h3>Zutaten für ${r.basePortions} Kinder</h3><ul class="recipe-view-ingredients">${r.ingredients.map(x=>`<li><span>${escapeHtml(x.name)}</span><strong>${formatAmount(x.amount)} ${escapeHtml(x.unit)}</strong></li>`).join("")}</ul><h3>Allergene</h3><p class="recipe-view-allergens">${escapeHtml(allergenText(r.allergens))}</p>`;
  $("#recipe-view-dialog").showModal();
}
function openRecipeDialog(id=null, duplicate=false){
  const original=id?recipe(id):null,r=original?(duplicate?KitchenData.duplicate(original,crypto.randomUUID()):original):null;
  editingRecipeId=duplicate?null:id;
  const form=$("#recipe-form");form.reset();
  $("#recipe-dialog-eyebrow").textContent=duplicate?"Rezept duplizieren":r?"Rezept bearbeiten":"Neuer Eintrag";
  $("#recipe-dialog-title").textContent=duplicate?"Kopie anlegen":r?r.name:"Rezept anlegen";
  $("#delete-recipe").classList.toggle("hidden",!editingRecipeId);
  $("#recipe-error").textContent="";
  if(r){form.elements.name.value=r.name;form.elements.side.value=r.side||"";form.elements.basePortions.value=r.basePortions;form.elements.allergens.value=r.allergens||"";}
  $("#ingredient-rows").innerHTML="";
  (r?.ingredients.length?r.ingredients:[{}]).forEach(addIngredientRow);
  $("#recipe-dialog").showModal();
}
function addIngredientRow(x={}){
  const row=document.createElement("div");row.className="ingredient-row";
  const options=(values,selected)=>values.map(v=>`<option value="${escapeHtml(v)}" ${v===selected?"selected":""}>${escapeHtml(v)}</option>`).join("");
  row.innerHTML=`<label class="field ingredient-name">Zutat<input data-ingredient="name" maxlength="300" required value="${escapeHtml(x.name||"")}" placeholder="z. B. Kartoffeln"></label><label class="field">Menge<input data-ingredient="amount" type="number" min="0.000001" max="1000000" step="any" inputmode="decimal" required value="${x.amount??""}"></label><label class="field">Einheit<select data-ingredient="unit">${options(KitchenData.units,x.unit||"g")}</select></label><label class="field ingredient-category">Kategorie<select data-ingredient="category">${options(categories,x.category||"Sonstiges")}</select></label><button type="button" class="quiet-button remove-ingredient" aria-label="Zutat entfernen">Entfernen</button>`;
  row.querySelector(".remove-ingredient").addEventListener("click",()=>{row.remove();});
  $("#ingredient-rows").append(row);
  return row;
}
function planShareText(){const week=currentWeek();return `Essensplan ${weekText()}\n\n${dayNames.map((day,i)=>{const r=recipe(week.plan[i]);return `${day} (${dateShort(dateAt(i))}): ${week.noCooking?.[i]?"Kein Kochen":r?r.name+(r.side?", "+r.side:"")+" — Allergene: "+allergenText(r.allergens):"Noch nicht geplant"}`;}).join("\n")}`;}
function printView(type){if(!["plan","shopping"].includes(type))return;preparePrint(type);window.print();}
function preparePrint(type){document.body.dataset.print=type;document.title=(type==="plan"?"Essensplan ":"Einkaufsliste ")+weekText();$("#print-document").innerHTML=outputDocument(type);}
window.addEventListener("beforeprint",()=>preparePrint(document.body.dataset.print||($("#screen-shopping").classList.contains("active")?"shopping":"plan")));
window.addEventListener("afterprint",()=>{delete document.body.dataset.print;document.title="Küchenplan";});
document.addEventListener("click",e=>{const nav=e.target.closest("[data-screen]");if(nav)navigate(nav.dataset.screen);const meal=e.target.closest("[data-day]");if(meal)openMealDialog(Number(meal.dataset.day));const option=e.target.closest("[data-recipe]");if(option){currentWeek().plan[selectedDay]=option.dataset.recipe;if(currentWeek().noCooking)currentWeek().noCooking[selectedDay]=false;save();renderAll();$("#meal-dialog").close();toast("Gericht aktualisiert");}const view=e.target.closest("[data-view-recipe]");if(view)openRecipeView(view.dataset.viewRecipe);const edit=e.target.closest("[data-edit-recipe]");if(edit)openRecipeDialog(edit.dataset.editRecipe);const duplicate=e.target.closest("[data-duplicate-recipe]");if(duplicate)openRecipeDialog(duplicate.dataset.duplicateRecipe,true);const print=e.target.closest("[data-print]");if(print)printView(print.dataset.print);});
$("#portions").addEventListener("change",e=>{if(!e.target.checkValidity()){e.target.reportValidity();e.target.value=currentWeek().portions;return;}const week=currentWeek();week.portions=Planning.count(e.target.value,week.portions);week.dayPortions.fill(week.portions);save();renderAll();toast("Mengen neu berechnet");});
$("#previous-week").addEventListener("click",()=>{const d=dateAt(0);d.setDate(d.getDate()-7);state.weekStart=d.toISOString().slice(0,10);currentWeek();save();renderAll();});
$("#next-week").addEventListener("click",()=>{const d=dateAt(0);d.setDate(d.getDate()+7);state.weekStart=d.toISOString().slice(0,10);currentWeek();save();renderAll();});
$("#create-list").addEventListener("click",()=>navigate("shopping")); $("#recipe-search").addEventListener("input",e=>renderRecipes(e.target.value)); $("#add-recipe").addEventListener("click",()=>openRecipeDialog()); $("[data-close-recipe]").addEventListener("click",()=>$("#recipe-dialog").close());
$("#add-ingredient").addEventListener("click",()=>{if($$(".ingredient-row",$("#ingredient-rows")).length>=200){$("#recipe-error").textContent="Maximal 200 Zutaten pro Rezept.";return;}addIngredientRow().querySelector("input").focus();});
$("#recipe-form").addEventListener("submit",event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  try{
    const ingredients=$$(".ingredient-row",$("#ingredient-rows")).map(row=>({name:$("[data-ingredient=name]",row).value.trim(),amount:Number($("[data-ingredient=amount]",row).value),unit:$("[data-ingredient=unit]",row).value,category:$("[data-ingredient=category]",row).value}));
    if(!ingredients.length)throw new Error("Bitte mindestens eine Zutat hinzufügen.");
    const updated=KitchenData.validateRecipe({id:editingRecipeId||crypto.randomUUID(),name:form.elements.name.value.trim(),side:form.elements.side.value.trim(),basePortions:Number(form.elements.basePortions.value),allergens:form.elements.allergens.value.trim(),ingredients});
    const previous=JSON.parse(JSON.stringify(state));
    if(editingRecipeId)state.recipes[state.recipes.findIndex(r=>r.id===editingRecipeId)]=updated;else state.recipes.push(updated);
    if(!save()){state=previous;throw new Error("Rezept konnte nicht gespeichert werden. Bitte erneut versuchen.");}
    renderAll();$("#recipe-dialog").close();toast(editingRecipeId?"Rezept aktualisiert":"Rezept gespeichert");
  }catch(error){$("#recipe-error").textContent=error.message;}
});
$("#delete-recipe").addEventListener("click",()=>{
  const r=recipe(editingRecipeId);if(!r)return;
  const uses=Object.values(state.weeks).reduce((n,w)=>n+w.plan.filter(id=>id===r.id).length,0);
  if(!confirm(`Rezept „${r.name}“ löschen?${uses?` Es wird aus ${uses} geplanten Tagen entfernt.`:""}`))return;
  const previous=JSON.parse(JSON.stringify(state));state.recipes=state.recipes.filter(item=>item.id!==r.id);
  Object.values(state.weeks).forEach(week=>{week.plan=week.plan.map(id=>id===r.id?null:id);});
  if(!save()){state=previous;$("#recipe-error").textContent="Rezept konnte nicht gelöscht werden.";return;}
  renderAll();$("#recipe-dialog").close();toast("Rezept gelöscht");
});
$("#shopping-list").addEventListener("change",e=>{if(!e.target.dataset.item)return;const week=currentWeek();week.checked=e.target.checked?[...new Set([...week.checked,e.target.dataset.item])]:week.checked.filter(x=>x!==e.target.dataset.item);save();renderShopping();}); $("#stock-notes").addEventListener("input",e=>{currentWeek().stockNotes=e.target.value;save();}); $("#reset-checks").addEventListener("click",()=>{currentWeek().checked=[];save();renderShopping();});
$("#share-plan").addEventListener("click",async()=>{const data={title:"Essensplan",text:planShareText()};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.text);toast("Essensplan kopiert");}}catch(err){if(err.name!=="AbortError")toast("Teilen ist nicht verfügbar");}});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#install-button").classList.remove("hidden");}); $("#install-button").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#install-button").classList.add("hidden");});
function registerWebMcp(){const context=document.modelContext;if(!context?.registerTool)return;const controller=new AbortController();Promise.resolve(context.registerTool({name:"set_week_plan",title:"Wochenplan festlegen",description:"Legt Anzahl der Kinder und bis zu fünf Rezept-IDs für den sichtbaren Wochenplan fest.",inputSchema:{type:"object",properties:{portions:{type:"integer",minimum:1,maximum:500},recipeIds:{type:"array",items:{type:"string"},minItems:1,maxItems:5}},required:["portions","recipeIds"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!Number.isInteger(input?.portions)||input.portions<1||input.portions>500)throw new Error("Ungültige Kinderzahl");if(!Array.isArray(input.recipeIds)||!input.recipeIds.length||input.recipeIds.length>5||input.recipeIds.some(id=>!recipe(id)))throw new Error("Unbekannte Rezept-ID");const week=currentWeek();week.portions=input.portions;week.dayPortions.fill(input.portions);week.noCooking=week.noCooking||Array(5).fill(false);input.recipeIds.forEach((_,i)=>week.noCooking[i]=false);week.plan=[...input.recipeIds.slice(0,5),...week.plan.slice(input.recipeIds.length,5)];save();renderAll();return{portions:week.portions,recipeIds:week.plan};}},{signal:controller.signal})).catch(()=>{});}
save();renderAll();registerWebMcp();if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));


function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function previousWeekKey(){const d=dateAt(0);d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);}
$("#day-list").addEventListener("change",e=>{
  if(e.target.dataset.dayPortions===undefined)return;
  const day=Number(e.target.dataset.dayPortions),week=currentWeek();
  if(!e.target.checkValidity()){e.target.reportValidity();e.target.value=week.dayPortions[day];return;}
  week.dayPortions[day]=Planning.count(e.target.value,week.portions);save();renderShopping();toast("Mengen neu berechnet");
});
$("#copy-week").addEventListener("click",()=>{
  const source=state.weeks[previousWeekKey()];if(!source)return;
  const target=currentWeek();
  if((target.plan.some(Boolean)||target.noCooking?.some(Boolean)||target.checked.length||target.stockNotes||target.portions!==37||target.dayPortions.some(n=>n!==37))&&!confirm("Gerichte und Kinderzahlen dieser Woche durch die Vorwoche ersetzen? Einkaufsmarkierungen werden zurückgesetzt. Ihre Vorratsnotiz bleibt erhalten."))return;
  state.weeks[state.weekStart]={...Planning.copyWeek(source),stockNotes:target.stockNotes};save();renderAll();toast("Vorwoche übernommen");
});
const RECOVERY_KEY=STORAGE_KEY+'-before-restore';
let pendingRestore=null;
function downloadBackup(content,filename){
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function updateRecoveryButton(){try{$('#recover-backup').disabled=!localStorage.getItem(RECOVERY_KEY);}catch{$('#recover-backup').disabled=true;}}
$('#export-backup').addEventListener('click',()=>{
  try{downloadBackup(KitchenData.backup(state),`kuechenplan-${new Date().toISOString().slice(0,10)}.json`);$('#backup-status').textContent='Sicherung zum Herunterladen bereitgestellt.';}
  catch(error){$('#backup-status').textContent=error.message;}
});
function previewRestore(data){
  pendingRestore=data;
  const dates=Object.keys(data.weeks).sort();
  $('#restore-summary').textContent=`${data.recipes.length} Rezepte und ${dates.length} Wochen (${dates[0]} bis ${dates.at(-1)}).`;
  $('#restore-error').textContent='';$('#restore-dialog').showModal();
}
$('#import-backup').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>10*1024*1024)throw new Error('Die Sicherung ist zu groß (maximal 10 MB).');previewRestore(KitchenData.parseBackup(await file.text()));}
  catch(error){$('#backup-status').textContent=error.message;}
  finally{event.target.value='';}
});
$('#recover-backup').addEventListener('click',()=>{
  try{const raw=localStorage.getItem(RECOVERY_KEY);if(!raw)throw new Error('Kein früherer Stand vorhanden.');previewRestore(KitchenData.validateState(Planning.migrate(JSON.parse(raw))));}
  catch(error){$('#backup-status').textContent='Früherer Stand konnte nicht geladen werden: '+error.message;}
});
$('#cancel-restore').addEventListener('click',()=>{pendingRestore=null;$('#restore-dialog').close();});
$('#restore-dialog').addEventListener('cancel',()=>{pendingRestore=null;});
$('#confirm-restore').addEventListener('click',()=>{
  if(!pendingRestore)return;
  try{
    const restored=KitchenData.restore(localStorage,STORAGE_KEY,RECOVERY_KEY,pendingRestore);
    state=restored;pendingRestore=null;storageBlocked=false;
    $('#storage-error').classList.add('hidden');$('#recipe-search').value='';
    renderAll();updateRecoveryButton();$('#restore-dialog').close();$('#backup-status').textContent='Sicherung wiederhergestellt.';toast('Daten wiederhergestellt');
  }catch(error){$('#restore-error').textContent='Wiederherstellung fehlgeschlagen. Die aktuellen Daten bleiben erhalten. '+error.message;}
});
updateRecoveryButton();

function allergenText(value){
  const labels={A1:"Weizen (Gluten)",C:"Eier",D:"Fisch",G:"Milch (einschließlich Laktose)"};
  if(!String(value||"").trim())return "Nicht angegeben";
  return [...new Set(String(value).split(/[,;]+/).map(x=>x.trim()).filter(Boolean))].map(code=>Object.hasOwn(labels,code.toUpperCase())?code.toUpperCase()+" – "+labels[code.toUpperCase()]:code).join("; ");
}
function outputDocument(type){
  const week=currentWeek(),esc=escapeHtml;
  const header=`<header class="print-heading"><p>Kita-Küche</p><h1>${type==="plan"?"Essensplan":"Einkaufsliste"}</h1><p class="print-week">${esc(weekText())}</p></header>`;
  if(type==="plan"){
    const rows=dayNames.map((day,i)=>{const off=week.noCooking?.[i],r=off?null:recipe(week.plan[i]);return `<tr><th scope="row">${day}<small>${dateShort(dateAt(i))}</small></th><td><strong>${off?"Kein Kochen":r?esc(r.name):"Noch nicht geplant"}</strong>${r?.side?`<p>${esc(r.side)}</p>`:""}</td><td>${r?week.dayPortions[i]:"—"}</td><td>${r?esc(allergenText(r.allergens)):"—"}</td></tr>`;}).join("");
    return header+`<table class="print-table menu-table"><thead><tr><th>Tag</th><th>Gericht und Beilage</th><th>Kinder</th><th>Allergene</th></tr></thead><tbody>${rows}</tbody></table><p class="print-footnote">Allergenangaben aus den Rezepten. „Nicht angegeben“ bedeutet nicht „allergenfrei“. Weitere Angaben werden unverändert übernommen.</p>`;
  }
  const items=shoppingItems(),portions=week.plan.reduce((n,id,i)=>n+(!week.noCooking?.[i]&&recipe(id)?week.dayPortions[i]:0),0);
  const groups=categories.map(category=>{const group=items.filter(x=>x.category===category);if(!group.length)return "";return `<section class="print-shopping-group"><h2>${esc(category)}</h2><table class="print-table"><thead><tr><th class="check-column">Erledigt</th><th>Zutat</th><th class="amount-column">Menge</th></tr></thead><tbody>${group.map(x=>`<tr><td><span class="paper-checkbox">${week.checked.includes(x.token)?"✓":""}</span></td><td>${esc(x.name)}</td><td class="amount-column">${formatAmount(x.amount)} ${esc(x.unit)}</td></tr>`).join("")}</tbody></table></section>`;}).join("");
  return header+`<p>${items.length} Artikel · ${portions} Portionen gesamt</p>`+(groups||'<p>Keine Zutaten geplant.</p>')+`<section class="print-notes"><h2>Vorrat prüfen</h2><p>Salz, Pfeffer, Gewürze, Öl und Essig</p><p class="preserve-lines">${esc(week.stockNotes||"Keine zusätzlichen Notizen.")}</p></section>`;
}
function renderOutputs(){
  $("#output-week").textContent=weekText();
  $("#plan-preview").innerHTML=outputDocument("plan");
  $("#shopping-preview").innerHTML=outputDocument("shopping");
}
document.addEventListener("click",event=>{
  const button=event.target.closest("[data-day-status]");if(!button||selectedDay===null)return;
  const week=currentWeek(),previous=JSON.parse(JSON.stringify(week));
  week.noCooking=week.noCooking||Array(5).fill(false);
  week.noCooking[selectedDay]=button.dataset.dayStatus==="off";
  if(button.dataset.dayStatus==="empty")week.plan[selectedDay]=null;
  if(!save()){state.weeks[state.weekStart]=previous;return;}
  renderAll();$("#meal-dialog").close();toast(week.noCooking[selectedDay]?"Tag ohne Kochen gespeichert":"Tag zurückgesetzt");
});
