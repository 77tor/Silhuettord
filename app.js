let selectedAdvancedWords = []; // Midlertidig liste for avansert utvalg
// Database - Legg til dine egne symboler her


let activeWords = [];
let mode = 'bilder';

// Denne skal nå KUN åpne og tegne, ikke tømme listen
function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
    if(id === 'modal-avansert') {
        renderAvansert(); 
        oppdaterSideEstimat(); // Oppdaterer tallene med en gang modalen åpnes
    }
}

// Håndterer filvalg og visning av filnavn
document.getElementById('custom-image-input')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const word = document.getElementById('custom-word-input').value.trim();
    const nameDisplay = document.getElementById('file-name-display');

    if (!file) return;
    if (!word) {
        alert("Skriv inn ordet før du velger bilde!");
        e.target.value = ''; // Nullstill filfeltet
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        // Lag et nytt "objekt" som ligner på de i databasen
        const newEntry = {
            ord: word.toLowerCase(),
            symbol: event.target.result, // Dette er selve bilde-dataen
            isCustom: true // Markør så vi vet det ikke er en Twemoji
        };

        // Legg det øverst i databasen så det er lett å finne
        substantivDb.unshift(newEntry);
        
        // Marker det som valgt med en gang
        selectedAdvancedWords.push(newEntry);

        // Nullstill input-feltene
        document.getElementById('custom-word-input').value = '';
        nameDisplay.innerText = "";
        
        // Oppdater rutenettet
        renderAvansert();
        oppdaterSideEstimat(); // <--- LEGG TIL DENNE HER
    };
    reader.readAsDataURL(file);
});


function getBoxInfo(c) {
    c = c.toLowerCase();
    let shape = "stue", svg = "", extraClass = "", width = "w-normal";
    
    if ("bdfhklt".includes(c)) {
        shape = "stue-loft";
    } else if (c === 'i' || c === 'å') {
        shape = "medium-high"; // Bruker mellomhøyden fra din CSS
    } else if ("gjpqy".includes(c)) {
        shape = "stue-kjeller";
    }

    // SVG-stier med tallet 30 (som vi ble enige om)
    if ("bhk".includes(c)) {
        extraClass = "special-box";
        svg = `<svg viewBox="0 0 45 72" preserveAspectRatio="none"><path d="M1,1 L25,1 L25,30 L44,30 L44,71 L1,71 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (c === 'd') {
        extraClass = "special-box";
        svg = `<svg viewBox="0 0 45 72" preserveAspectRatio="none"><path d="M20,1 L44,1 L44,71 L1,71 L1,30 L20,30 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (c === 'p') {
        extraClass = "special-box";
        svg = `<svg viewBox="0 0 45 72" preserveAspectRatio="none"><path d="M1,1 L44,1 L44,42 L25,42 L25,71 L1,71 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
    }

    // Bredder
    if (c === 'i' || c === 'l') width = "w-v-narrow";
    else if ("fjtå".includes(c)) width = "w-narrow"; 

    return { class: `${shape} ${width} ${extraClass}`, svg: svg };
}
// Ny funksjon for å tømme utvalget manuelt inne i modalen
function nullstillAvansertValg() {
    // 1. Tøm listen over valgte ord
    selectedAdvancedWords = [];
    
    // 2. Tegn rutenettet på nytt (slik at blå rammer forsvinner)
    renderAvansert();
    
    // 3. Oppdater telleren og estimatene (slik at de nullstilles)
    oppdaterSideEstimat();
}

function closeModals() { 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); 
}


// OPPDATERT HYBRID BILDE-FUNKSJON
function getTwemojiUrl(item) {
    // 1. Sjekk om dette er et eget opplastet bilde (fra PC)
    if (item && typeof item === 'object' && item.isCustom) {
        return item.symbol; 
    }
    
    // 2. Finn ut hva symbolet er
    const symbol = typeof item === 'string' ? item : (item ? item.symbol : "");
    if (!symbol) return ""; 

    // --- NYTT: Spesialfiks for Ur og Ugle ---
    // Vi sjekker om symbolet inneholder ugle eller ur og returnerer riktig Twemoji-adresse direkte
    if (symbol.includes("🦉")) return "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f989.svg";
    if (symbol.includes("⌚")) return "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/231a.svg";
    // ----------------------------------------

    // 3. Vanlig Twemoji-logikk for resten
    const charCode = Array.from(symbol).map(c => c.codePointAt(0).toString(16)).filter(code => code !== "fe0f").join('-');
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${charCode}.svg`;
}


function renderAvansert() {
    const grid = document.getElementById('avansert-grid');
    grid.innerHTML = "";
    
    substantivDb.forEach(item => {
        const isSelected = selectedAdvancedWords.some(w => w.ord === item.ord);
        const div = document.createElement('div');
        
        div.style.cssText = `
            border: ${isSelected ? '3px solid #3498db' : '1px solid #eee'}; 
            background: ${isSelected ? '#ebf5fb' : 'white'};
            padding: 5px; cursor: pointer; text-align: center; border-radius: 8px; transition: all 0.2s;
        `;
        
        div.innerHTML = `<img src="${getTwemojiUrl(item)}" style="width:30px; height:30px; object-fit:contain;"><br><small>${item.ord}</small>`;
        
        div.onclick = () => {
            const index = selectedAdvancedWords.findIndex(w => w.ord === item.ord);
            if (index > -1) {
                selectedAdvancedWords.splice(index, 1); 
            } else {
                selectedAdvancedWords.push(item); 
            }
            renderAvansert(); 
            oppdaterSideEstimat(); // <--- LEGG TIL DENNE HER
        };
        grid.appendChild(div);
    });
}

function generer(type) {
    // 1. Skjul logoen og vis arket
    const placeholder = document.getElementById('placeholder-image');
    if (placeholder) placeholder.style.display = 'none';
    document.getElementById('paper-main').classList.remove('hidden');

    const withLines = document.getElementById('global-lines').checked;
    
    // Vi deklarerer disse her én gang
    let rawText = "";
    let limit = 16;
    let autoLineSetting = false; 

    if(type === 'tekst') {
        mode = 'tekst';
        const inputMed = document.getElementById('input-med-linjer').value.trim();
        const inputUten = document.getElementById('input-uten-linjer').value.trim();
        
        if (inputMed.length > 0) {
            rawText = inputMed;
            limit = 8;
            autoLineSetting = true;
        } else if (inputUten.length > 0) {
            rawText = inputUten;
            limit = 12;
            autoLineSetting = false;
        } else {
            alert("Vennligst skriv inn noen ord.");
            return;
        }

        let rawWords = rawText.split(',')
            .map(w => ({ord: w.trim()}))
            .filter(w => w.ord.length > 0);

        if(rawWords.length > limit) {
            alert(`For mange ord! Du har skrevet ${rawWords.length}. Maksgrense her er ${limit} ord.`);
            return;
        }

        document.getElementById('global-lines').checked = autoLineSetting;
        document.getElementById('global-ordbank-page').checked = true;
        activeWords = rawWords;

    } else if(type === 'auto') {
        mode = 'bilder';
        const lengthVal = document.getElementById('auto-length').value;
        const countVal = parseInt(document.getElementById('auto-count').value); 
        
        // --- FIKSEN ER HER: Fjernet "const" for å unngå kollisjon ---
        autoLineSetting = (countVal === 6);
        document.getElementById('global-lines').checked = autoLineSetting;
        
        let filteredDb = [...substantivDb];
        
        if (lengthVal === "2") {
            filteredDb = substantivDb.filter(item => item.ord.length === 2);
        } else if (lengthVal === "3") {
            filteredDb = substantivDb.filter(item => item.ord.length === 3);
        } else if (lengthVal === "4") {
            filteredDb = substantivDb.filter(item => item.ord.length === 4);
        } else if (lengthVal === "2-7") {
            filteredDb = substantivDb.filter(item => item.ord.length >= 2 && item.ord.length <= 7);
        }
        
        if (filteredDb.length < countVal) {
            alert(`Fant ikke nok ord (${filteredDb.length}) med denne lengden i databasen.`);
        }

        activeWords = filteredDb.sort(() => 0.5 - Math.random()).slice(0, countVal);

    } else if(type === 'avansert') {
        if (selectedAdvancedWords.length === 0) {
            alert("Vennligst velg minst ett bilde først.");
            return;
        }
        mode = 'bilder';
        activeWords = [...selectedAdvancedWords];
    }
    
    let beskrivelse = mode === 'tekst' ? "Hvilke ord passer i boksene?" : "Skriv ordene det er bilde av.";
    
    // Bruker den oppdaterte sjekkboksen for å bygge beskrivelsen
    if (document.getElementById('global-lines').checked) {
        beskrivelse += " Skriv ordene også riktig inn i linjesystemene.";
    }

    document.getElementById('task-desc').innerText = beskrivelse;
    
    renderAll();
    closeModals();
}

function renderAll() {
    const out = document.getElementById('output');
    const fas = document.getElementById('fasit-output');
    const bankPage = document.getElementById('on-page-ordbank');
    const bankSheet = document.getElementById('ordbank-sheet-output');

    // Tøm innholdet
    out.innerHTML = "";
    fas.innerHTML = "";
    bankPage.innerHTML = "";
    bankSheet.innerHTML = "";

    // Lag oppgaver og fasit i opprinnelig rekkefølge
    activeWords.forEach(item => {
        out.innerHTML += createWordHtml(item, false);
        fas.innerHTML += createWordHtml(item, true);
    });

    // Kopier ordene til ordbanken
    let bankWords = [...activeWords];

    // Stokk om ordbanken hvis bryteren er aktivert
    const shuffleToggle = document.getElementById('global-shuffle-ordbank');

    if (shuffleToggle && shuffleToggle.checked) {
        for (let i = bankWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [bankWords[i], bankWords[j]] =
                [bankWords[j], bankWords[i]];
        }
    }

    // Legg ordene inn i begge ordbankene
    bankWords.forEach(item => {
        const wordSpan = document.createElement('span');
        wordSpan.textContent = item.ord;

        bankPage.appendChild(wordSpan.cloneNode(true));
        bankSheet.appendChild(wordSpan.cloneNode(true));
    });

    // Oppdater synlighet
    updateVisibility();
    tilpassSilhuettLayout(out);
    tilpassSilhuettLayout(fas);
}

function tilpassSilhuettLayout(container) {
    if (!container) return;

    const ordEnheter = container.querySelectorAll('.word-unit');
    const tilgjengeligBredde = container.clientWidth;

    if (!tilgjengeligBredde) return;

    const stil = getComputedStyle(container);
    const kolonneGap = parseFloat(stil.columnGap) || 30;
    const sikkerhetsmargin = 12;
    const kolonneBredde = (tilgjengeligBredde - kolonneGap) / 2;

    ordEnheter.forEach(enhet => {
        const silhuett = enhet.querySelector('.shapes-wrapper');

        if (!silhuett) return;

        const bokser = [...silhuett.querySelectorAll('.box')];

        if (!bokser.length) return;

        // Nullstill tidligere tilpasning før vi måler.
        enhet.style.gridColumn = 'span 1';
        silhuett.style.setProperty('--word-scale', '1');

        // Mål samlet bredde på bokstavboksene.
        let ordBredde = 0;

        bokser.forEach(boks => {
            const boksStil = getComputedStyle(boks);

            ordBredde += boks.getBoundingClientRect().width;
            ordBredde += parseFloat(boksStil.marginLeft) || 0;
        });

        // Lange ord får hele raden.
const ekstraLuft = 35;

if (ordBredde > kolonneBredde - ekstraLuft) {
    enhet.style.gridColumn = '1 / -1';
}

        // Skaler bare dersom ordet er bredere enn hele raden.
        const maksBredde = tilgjengeligBredde - sikkerhetsmargin;

        if (ordBredde > maksBredde) {
            const skala = maksBredde / ordBredde;

            silhuett.style.setProperty(
                '--word-scale',
                String(Math.max(0.1, skala))
            );
        }
    });
}

function oppdaterSideEstimat() {
    const totaltValgte = (typeof selectedAdvancedWords !== 'undefined') ? selectedAdvancedWords.length : 0;
    
    const countElem = document.getElementById('count-total');
    const valUtenElem = document.getElementById('val-uten');
    const valMedElem = document.getElementById('val-med');

    if (!countElem || !valUtenElem || !valMedElem) return;

    // Oppdater antall
    countElem.innerText = totaltValgte;

    // Beregn sider uten skrivelinjer (10 per side)
    const siderUten = Math.ceil(totaltValgte / 10) || 1;
    valUtenElem.innerText = `${siderUten} side${siderUten > 1 ? 'r' : ''}`;

    // Beregn sider med skrivelinjer (6 per side)
    const siderMed = Math.ceil(totaltValgte / 6) || 1;
    valMedElem.innerText = `${siderMed} side${siderMed > 1 ? 'r' : ''}`;

    // Fargekode for å markere at det bikker over til flere sider
    valMedElem.style.color = siderMed > 1 ? '#ffcc00' : '#ffffff';
    valUtenElem.style.color = siderUten > 1 ? '#ffcc00' : '#ffffff';
}

function createWordHtml(item, isFasit) {
    const useCustom = document.getElementById('custom-silhouettes').checked;
    let imgHtml = mode === 'bilder' ? `<div class="image-box"><img src="${getTwemojiUrl(item)}"></div>` : "";
    
    const boxes = item.ord.split('').map(c => {
        if (useCustom) {
            // Bruk den avanserte logikken
            const info = getBoxInfo(c);
            return `<div class="box ${info.class}">${info.svg}<span>${isFasit ? c : ''}</span></div>`;
        } else {
            // Bruk den enkle standard-logikken (din nåværende)
            const cls = "bdfhklt".includes(c.toLowerCase()) ? "stue-loft" : ("gjpqy".includes(c.toLowerCase()) ? "stue-kjeller" : "stue");
            return `<div class="box ${cls}"><span>${isFasit ? c : ''}</span></div>`;
        }
    }).join('');

    const linesHtml = `<div class="lines-container printable-lines"><div class="l"></div><div class="l"></div><div class="l thick"></div><div class="l"></div></div>`;

    return `<div class="word-unit">${imgHtml}<div class="shapes-wrapper">${boxes}</div>${isFasit ? '' : linesHtml}</div>`;
}

function updateVisibility() {
    // 1. Håndter synlighet for ordbank og fasit som før
    document.getElementById('on-page-ordbank').classList.toggle('hidden', !document.getElementById('global-ordbank-page').checked);
    document.getElementById('paper-ordbank-sheet').classList.toggle('hidden', !document.getElementById('global-ordbank-sheet').checked);
    document.getElementById('paper-fasit').classList.toggle('hidden', !document.getElementById('global-fasit').checked);
    
    // 2. Håndter skrivelinjer
    const showLines = document.getElementById('global-lines').checked;
    document.querySelectorAll('.printable-lines').forEach(el => {
        el.classList.toggle('hidden', !showLines);
    });

    // 3. NYTT: Oppdater instruksjonsteksten dynamisk
    const taskDesc = document.getElementById('task-desc');
    const ekstraTekst = " Skriv ordene også riktig inn i linjesystemene.";
    
    // Vi fjerner først teksten (hvis den finnes) for å unngå at den legges til dobbelt
    let renTekst = taskDesc.innerText.replace(ekstraTekst, "");

    if (showLines) {
        taskDesc.innerText = renTekst + ekstraTekst;
    } else {
        taskDesc.innerText = renTekst;
    }
}

function toggleMenu() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Lukker menyen hvis man klikker utenfor den
window.onclick = function(event) {
    if (!event.target.closest('.menu-container')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
