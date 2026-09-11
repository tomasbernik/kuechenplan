# Pokračovanie na druhom PC

## Aktuálny stav

- Aplikácia: https://kuechenplan-kita.info680301.chatgpt.site
- GitHub: https://github.com/tomasbernik/kuechenplan
- Pracovná vetva: `main`.
- Statická aplikácia je priamo v `dist/`; nie je potrebný build ani npm install.
- Identita existujúceho Sites projektu je v `.openai/hosting.json`. Pri ďalšom publikovaní použiť tento projekt, nevytvárať nový.
- Prístup je verejný bez ChatGPT prihlásenia na výslovnú žiadosť používateľa.
- Supabase zatiaľ nepridávať. Údaje aplikácie sú v localStorage osobitne pre každý prehliadač. Git ich neprenáša; prenos cez Ausgabe → Datensicherung.

## Posledná dokončená zmena

Commit `b60e48f` doplnil tlačidlo Ansehen a detail receptu so surovinami, množstvami, prílohou a alergénmi bez editácie. Zmena bola publikovaná ako Sites verzia 3. Existujúce testy aj test prezerania prešli.

Používateľ však stále nevidel Ansehen. Príčina nie je overená. Podozrenie je na starú cache/service worker: `dist/sw.js` používa cache-first a nový worker čaká na zatvorenie starých kariet. Nepovažovať problém za vyriešený len preto, že publikovanie uspelo.

## Navrhnuté ďalšie kroky (zatiaľ neimplementované)

1. Overiť chýbajúce Ansehen a zabezpečiť spoľahlivú aktualizáciu aplikácie pri zachovaní offline režimu a uložených údajov.
2. Postup prípravy receptu.
3. Prepočet množstiev v detaile receptu podľa počtu detí.
4. Otvorenie receptu z týždenného plánu.
5. Kontrola hlavných tokov na mobile.

## Spustenie a kontrola

- Na existujúcej kópii najprv skontrolovať `git status`, potom `git pull --ff-only origin main`. Nezahadzovať lokálne zmeny.
- Nová kópia: `git clone https://github.com/tomasbernik/kuechenplan.git`.
- Testy: `node --test tests/*.test.cjs`.
- Lokálny náhľad s Pythonom: `python -m http.server 4173 --bind 127.0.0.1 --directory dist`, potom otvoriť http://127.0.0.1:4173.
- Pri práci so Sites načítať príslušné Sites skills. Publikovanie a GitHub push sú oddelené operácie; pri odovzdaní práce synchronizovať GitHub.
- `tmp/` je ignorovaný pomocný priečinok a nie je potrebný na pokračovanie.
