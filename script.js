/* ============================================================
   Federal Retirement & TSP Calculator — Main Script
   ============================================================ */

// ── Formatting Helpers ──────────────────────────────────────

function fmt(n) {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtDec(n) {
    if (n == null || isNaN(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtK(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 999500) return '$1.0M'; // avoid "$1000K"
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return fmt(n);
}

function pct(n) { return (n * 100).toFixed(1) + '%'; }

// ── DOM References ──────────────────────────────────────────

const gsGradeSel = document.getElementById('gs-grade');
const gsStepSel = document.getElementById('gs-step');
const localitySel = document.getElementById('locality');
const salaryAutoDisplay = document.getElementById('salary-auto-display');
const salaryOverrideChk = document.getElementById('salary-override-check');
const salaryOverrideRow = document.getElementById('salary-override-row');
const salaryManualInp = document.getElementById('salary-manual');

const fedHireDateInp = document.getElementById('fed-hire-date');
const fersTypeBadge = document.getElementById('fers-type-badge');
const currentAgeInp = document.getElementById('current-age');
const mraBadge = document.getElementById('mra-badge');
const retirementAgeInp = document.getElementById('retirement-age');
const eligibilityBadge = document.getElementById('eligibility-badge');
const serviceYearsDisplay = document.getElementById('service-years-display');
const serviceYearsHint = document.getElementById('service-years-hint');
const serviceYearsOverrideChk = document.getElementById('service-years-override');
const serviceYearsManualRow = document.getElementById('service-years-manual-row');
const fedServiceYearsInp = document.getElementById('fed-service-years');
const sickLeaveInp = document.getElementById('sick-leave-hours');

const hasMilitaryChk = document.getElementById('has-military-service');
const buybackSection = document.getElementById('buyback-section');
const milYearsInp = document.getElementById('mil-years');
const milTotalPayInp = document.getElementById('mil-total-pay');
const estimatorToggle = document.getElementById('estimator-toggle');
const estimatorSection = document.getElementById('estimator-section');
const rankEntriesDiv = document.getElementById('rank-entries');
const addRankBtn = document.getElementById('add-rank-btn');
const estimatorResult = document.getElementById('estimator-result');
const estimatorTotal = document.getElementById('estimator-total');
const useEstimateBtn = document.getElementById('use-estimate-btn');
const buybackStatusSel = document.getElementById('buyback-status');
const buybackStatusHint = document.getElementById('buyback-status-hint');
const interestInfoRow = document.getElementById('interest-info-row');
const yearsSinceFedInp = document.getElementById('years-since-fed-start');
const isActiveDutyRetireeChk = document.getElementById('is-active-duty-retiree');
const waiverWarning = document.getElementById('waiver-warning');

const tspBalanceInp = document.getElementById('tsp-balance');
const tspContribRateInp = document.getElementById('tsp-contribution-rate');
const tspReturnSel = document.getElementById('tsp-return-rate');
const tspTradPctInp = document.getElementById('tsp-trad-pct');
const rothDisplay = document.getElementById('roth-display');
const tspCatchupChk = document.getElementById('tsp-catchup');
const currentTaxSel = document.getElementById('current-tax-rate');
const retirementTaxSel = document.getElementById('retirement-tax-rate');
const tspMatchingDisplay = document.getElementById('tsp-matching-display');

const vaRatingSel = document.getElementById('va-rating');
const smcSection = document.getElementById('smc-section');
const smcKCountSel = document.getElementById('smc-k-count');
const smcSChk = document.getElementById('smc-s');
const vaOverrideChk = document.getElementById('va-override-check');
const vaOverrideRow = document.getElementById('va-override-row');
const vaOverrideInp = document.getElementById('va-override-amount');
const ssEstimateInp = document.getElementById('ss-estimate');
const ssClaimAgeSel = document.getElementById('ss-claim-age');
const hasMilRetirementChk = document.getElementById('has-mil-retirement');
const milRetirementRow = document.getElementById('mil-retirement-row');
const milRetirementPayInp = document.getElementById('mil-retirement-pay');

const heroCard = document.getElementById('hero-card');

const buybackAnalysisSection = document.getElementById('buyback-analysis-section');
const buybackAnalysisContent = document.getElementById('buyback-analysis-content');
const tspProjectionSection = document.getElementById('tsp-projection-section');
const tspProjectionContent = document.getElementById('tsp-projection-content');
const tspOptimizerSection = document.getElementById('tsp-optimizer-section');
const tspOptimizerContent = document.getElementById('tsp-optimizer-content');
const summarySection = document.getElementById('summary-section');
const summaryContent = document.getElementById('summary-content');
const fehbSection = document.getElementById('fehb-section');
const fehbContent = document.getElementById('fehb-content');

const emailForm = document.getElementById('email-form');
const emailInput = document.getElementById('email-input');
const emailStatus = document.getElementById('email-status');
const printBtn = document.getElementById('print-btn');
const shareBtn = document.getElementById('share-btn');

// ── Initialization ──────────────────────────────────────────

function init() {
    populateLocality();
    initEstimator();
    attachListeners();
    loadFromUrl();
    recalculate();
}

function populateLocality() {
    let html = '';
    const sorted = Object.entries(LOCALITY_AREAS).sort((a, b) => {
        if (a[0] === 'RUS') return -1;
        if (b[0] === 'RUS') return 1;
        return a[1].name.localeCompare(b[1].name);
    });
    for (const [code, loc] of sorted) {
        const sel = code === 'RUS' ? ' selected' : '';
        html += `<option value="${code}"${sel}>${loc.name} (+${(loc.rate * 100).toFixed(1)}%)</option>`;
    }
    localitySel.innerHTML = html;
}

function buildRankOptions() {
    let html = '<option value="">Select rank...</option>';
    html += '<optgroup label="Enlisted">';
    for (const [key, data] of Object.entries(MILITARY_RANK_PAY)) {
        if (key === 'W-1') html += '</optgroup><optgroup label="Warrant Officer">';
        if (key === 'O-1') html += '</optgroup><optgroup label="Officer">';
        html += `<option value="${key}">${data.label}</option>`;
    }
    html += '</optgroup>';
    return html;
}

function addRankEntry(rank, years) {
    const row = document.createElement('div');
    row.className = 'rank-entry-row';
    row.innerHTML = `
        <select class="rank-sel">${buildRankOptions()}</select>
        <input type="number" class="rank-years" min="1" max="30" step="1" placeholder="Yrs" value="${years || ''}">
        <button type="button" class="remove-rank-btn" title="Remove">&times;</button>
    `;
    if (rank) row.querySelector('.rank-sel').value = rank;
    row.querySelector('.remove-rank-btn').addEventListener('click', () => {
        row.remove();
        updateEstimator();
    });
    row.querySelector('.rank-sel').addEventListener('change', updateEstimator);
    row.querySelector('.rank-years').addEventListener('input', updateEstimator);
    rankEntriesDiv.appendChild(row);
}

function updateEstimator() {
    const rows = rankEntriesDiv.querySelectorAll('.rank-entry-row');
    const entries = [];
    for (const row of rows) {
        const rank = row.querySelector('.rank-sel').value;
        const years = parseInt(row.querySelector('.rank-years').value) || 0;
        if (rank && years > 0) entries.push({ rank, years });
    }
    if (entries.length > 0) {
        const total = estimateMilitaryPayFromRanks(entries);
        estimatorTotal.textContent = fmt(total);
        estimatorResult.style.display = 'block';
    } else {
        estimatorResult.style.display = 'none';
    }
}

function initEstimator() {
    // Add labels row
    const labels = document.createElement('div');
    labels.className = 'rank-entry-labels';
    labels.innerHTML = '<span>Rank</span><span>Years</span><span></span>';
    rankEntriesDiv.before(labels);

    // Start with one empty row
    addRankEntry();
}

// ── Event Listeners ─────────────────────────────────────────

function attachListeners() {
    // Federal service inputs
    gsGradeSel.addEventListener('change', () => { updateSalaryEstimate(); recalculate(); });
    gsStepSel.addEventListener('change', () => { updateSalaryEstimate(); recalculate(); });
    localitySel.addEventListener('change', () => { updateSalaryEstimate(); recalculate(); });

    salaryOverrideChk.addEventListener('change', () => {
        salaryOverrideRow.style.display = salaryOverrideChk.checked ? 'block' : 'none';
        recalculate();
    });
    salaryManualInp.addEventListener('input', recalculate);

    fedHireDateInp.addEventListener('change', () => { updateFERSType(); updateAutoServiceYears(); recalculate(); });
    currentAgeInp.addEventListener('input', () => { updateMRABadge(); recalculate(); });
    retirementAgeInp.addEventListener('input', recalculate);
    serviceYearsOverrideChk.addEventListener('change', () => {
        serviceYearsManualRow.style.display = serviceYearsOverrideChk.checked ? 'block' : 'none';
        recalculate();
    });
    fedServiceYearsInp.addEventListener('input', recalculate);
    sickLeaveInp.addEventListener('input', recalculate);

    // Military buyback
    hasMilitaryChk.addEventListener('change', () => {
        buybackSection.style.display = hasMilitaryChk.checked ? 'block' : 'none';
        recalculate();
    });
    milYearsInp.addEventListener('input', recalculate);
    milTotalPayInp.addEventListener('input', recalculate);
    isActiveDutyRetireeChk.addEventListener('change', () => {
        waiverWarning.style.display = isActiveDutyRetireeChk.checked ? 'block' : 'none';
        recalculate();
    });
    estimatorToggle.addEventListener('click', () => {
        const open = estimatorSection.style.display === 'block';
        estimatorSection.style.display = open ? 'none' : 'block';
        estimatorToggle.textContent = open
            ? "I don't know my total base pay — help me estimate"
            : "Hide estimator";
    });
    addRankBtn.addEventListener('click', () => addRankEntry());
    useEstimateBtn.addEventListener('click', () => {
        const val = estimatorTotal.textContent.replace(/[^0-9]/g, '');
        milTotalPayInp.value = val;
        estimatorSection.style.display = 'none';
        estimatorToggle.textContent = "I don't know my total base pay — help me estimate";
        recalculate();
    });
    buybackStatusSel.addEventListener('change', () => { onBuybackStatusChange(); recalculate(); });
    yearsSinceFedInp.addEventListener('input', recalculate);

    // TSP
    tspBalanceInp.addEventListener('input', recalculate);
    tspContribRateInp.addEventListener('input', () => { updateTSPMatching(); recalculate(); });
    tspReturnSel.addEventListener('change', recalculate);
    tspTradPctInp.addEventListener('input', () => {
        const val = parseInt(tspTradPctInp.value) || 0;
        rothDisplay.textContent = `Roth TSP: ${100 - val}%`;
        recalculate();
    });
    tspCatchupChk.addEventListener('change', recalculate);
    currentTaxSel.addEventListener('change', recalculate);
    retirementTaxSel.addEventListener('change', recalculate);

    // Additional income
    vaRatingSel.addEventListener('change', () => {
        const rating = parseInt(vaRatingSel.value) || 0;
        smcSection.style.display = rating > 0 ? 'block' : 'none';
        recalculate();
    });
    smcKCountSel.addEventListener('change', recalculate);
    smcSChk.addEventListener('change', recalculate);
    vaOverrideChk.addEventListener('change', () => {
        vaOverrideRow.style.display = vaOverrideChk.checked ? 'block' : 'none';
        recalculate();
    });
    vaOverrideInp.addEventListener('input', recalculate);
    ssEstimateInp.addEventListener('input', recalculate);
    ssClaimAgeSel.addEventListener('change', recalculate);
    hasMilRetirementChk.addEventListener('change', () => {
        milRetirementRow.style.display = hasMilRetirementChk.checked ? 'block' : 'none';
        recalculate();
    });
    milRetirementPayInp.addEventListener('input', recalculate);

    // Email, print, share
    emailForm.addEventListener('submit', handleEmailSubmit);
    printBtn.addEventListener('click', () => window.print());
    shareBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(buildShareUrl()).then(() => {
            shareBtn.textContent = 'Link Copied!';
            setTimeout(() => { shareBtn.textContent = 'Copy Link to Share'; }, 2000);
        });
    });
}

// ── Input Helpers ───────────────────────────────────────────

function updateSalaryEstimate() {
    const grade = parseInt(gsGradeSel.value);
    const step = parseInt(gsStepSel.value);
    const locality = localitySel.value;
    if (!grade) {
        salaryAutoDisplay.textContent = '$0';
        return;
    }
    const pay = getLocalityPay(grade, step, locality);
    salaryAutoDisplay.textContent = pay ? fmt(pay) : '$0';
}

function getCurrentSalary() {
    if (salaryOverrideChk.checked && salaryManualInp.value) {
        return parseFloat(salaryManualInp.value) || 0;
    }
    const grade = parseInt(gsGradeSel.value);
    const step = parseInt(gsStepSel.value);
    const locality = localitySel.value;
    if (!grade) return 0;
    return getLocalityPay(grade, step, locality) || 0;
}

function updateFERSType() {
    const date = fedHireDateInp.value;
    if (!date) {
        fersTypeBadge.style.display = 'none';
        return;
    }
    const type = detectFERSType(date);
    const label = getFERSLabel(type);
    const rate = getFERSContributionRate(type);
    fersTypeBadge.style.display = 'inline-block';
    fersTypeBadge.textContent = `${label} detected — ${(rate * 100).toFixed(1)}% employee contribution`;
}

function updateAutoServiceYears() {
    const hireDate = fedHireDateInp.value;
    if (!hireDate) {
        serviceYearsDisplay.style.display = 'none';
        serviceYearsHint.textContent = 'Enter your hire date above to auto-calculate, or enter manually below.';
        return;
    }
    const years = calcYearsOfService(hireDate);
    serviceYearsDisplay.textContent = `${years.toFixed(1)} years of federal service`;
    serviceYearsDisplay.style.display = 'block';
    serviceYearsHint.textContent = 'Calculated from your hire date. Override below if needed.';

    // Also auto-fill years-since-fed-start for buyback interest calculation
    if (!yearsSinceFedInp.value) {
        yearsSinceFedInp.value = Math.floor(years);
    }
}

function updateMRABadge() {
    const age = parseInt(currentAgeInp.value) || 0;
    if (!age) { mraBadge.style.display = 'none'; return; }
    const birthYear = 2026 - age;
    const mra = getMRA(birthYear);
    const mraStr = formatMRA(mra);
    mraBadge.style.display = 'inline-block';
    mraBadge.textContent = `Your MRA: ${mraStr}`;
}

function getCurrentServiceYears() {
    if (serviceYearsOverrideChk.checked && fedServiceYearsInp.value) {
        return parseFloat(fedServiceYearsInp.value) || 0;
    }
    const hireDate = fedHireDateInp.value;
    if (hireDate) return calcYearsOfService(hireDate);
    return parseFloat(fedServiceYearsInp.value) || 0;
}

function getMilTotalPay() {
    return parseFloat(milTotalPayInp.value) || 0;
}

function onBuybackStatusChange() {
    const status = buybackStatusSel.value;
    if (status === 'completed') {
        buybackStatusHint.textContent = 'Great! Your military time already counts toward your FERS pension.';
        interestInfoRow.style.display = 'none';
    } else if (status === 'in-progress') {
        buybackStatusHint.textContent = 'Partial payments stop interest from accruing on the paid portion.';
        interestInfoRow.style.display = 'block';
    } else {
        buybackStatusHint.textContent = 'Start your buyback to increase your FERS pension — the ROI is almost always worth it.';
        interestInfoRow.style.display = 'block';
    }
}

function updateTSPMatching() {
    const rate = parseFloat(tspContribRateInp.value) || 0;
    if (rate <= 0) {
        tspMatchingDisplay.style.display = 'none';
        return;
    }
    const match = calcTSPMatching(rate);
    const salary = getCurrentSalary();
    const annualMatch = salary * (match.totalAgencyPercent / 100);

    let html = `<p class="info-title">Agency TSP Matching</p>`;
    html += `<div class="info-row"><span>Automatic (1%)</span><span class="val">${fmt(salary * 0.01)}/yr</span></div>`;
    html += `<div class="info-row"><span>Match (${match.matchPercent.toFixed(1)}%)</span><span class="val">${fmt(salary * match.matchPercent / 100)}/yr</span></div>`;
    html += `<div class="info-row" style="border-top:1px solid rgba(0,0,0,0.08);padding-top:4px;font-weight:700;"><span>Total Agency (${match.totalAgencyPercent.toFixed(1)}%)</span><span class="val">${fmt(annualMatch)}/yr</span></div>`;

    if (rate < 5) {
        const leftOnTable = salary * 0.05 - annualMatch;
        html += `<p style="margin-top:8px;color:var(--accent);font-weight:600;font-size:0.85em;">You're leaving ${fmt(leftOnTable)}/year in free agency matching on the table. Contribute at least 5% to get the full match.</p>`;
    } else {
        html += `<p style="margin-top:8px;color:var(--green);font-weight:600;font-size:0.85em;">You're getting the full agency match.</p>`;
    }

    tspMatchingDisplay.innerHTML = html;
    tspMatchingDisplay.style.display = 'block';
}

// ── Main Recalculation ──────────────────────────────────────

function recalculate() {
    // ─── 1. Gather inputs ───
    const salary = getCurrentSalary();
    const currentAge = parseInt(currentAgeInp.value) || 0;
    const retirementAge = parseInt(retirementAgeInp.value) || 0;
    const fedYears = getCurrentServiceYears();
    const yearsToRetirement = retirementAge > currentAge ? retirementAge - currentAge : 0;
    const totalFedYearsAtRetirement = fedYears + yearsToRetirement;

    // Sick leave credit (adds to computation, not eligibility)
    const sickLeaveHours = parseInt(sickLeaveInp.value) || 0;
    const sickLeaveYears = sickLeaveCredit(sickLeaveHours);

    const hasMilitary = hasMilitaryChk.checked;
    const milYears = hasMilitary ? (parseInt(milYearsInp.value) || 0) : 0;
    const buybackCompleted = buybackStatusSel.value === 'completed';
    const buybackNotStarted = buybackStatusSel.value === 'not-started';
    const yearsSinceFed = parseInt(yearsSinceFedInp.value) || Math.floor(fedYears);

    const tspBalance = parseFloat(tspBalanceInp.value) || 0;
    const tspRate = parseFloat(tspContribRateInp.value) || 0;
    const tspReturn = parseFloat(tspReturnSel.value) || 0.07;
    const tradPct = tspTradPctInp.value !== '' ? parseInt(tspTradPctInp.value) : 100;
    const currentTax = parseFloat(currentTaxSel.value) || 0.22;
    const retirementTax = parseFloat(retirementTaxSel.value) || 0.12;

    const vaRating = parseInt(vaRatingSel.value) || 0;
    const ssAt67 = parseFloat(ssEstimateInp.value) || 0;
    const ssClaimAge = parseInt(ssClaimAgeSel.value) || 67;
    const hasMilRetirement = hasMilRetirementChk.checked;
    const milRetirementPay = hasMilRetirement ? (parseFloat(milRetirementPayInp.value) || 0) : 0;

    const fersType = detectFERSType(fedHireDateInp.value);
    const birthYear = currentAge > 0 ? (2026 - currentAge) : 1970;

    // ─── 2. Validate ───
    if (!salary || !currentAge || !retirementAge || (!fedYears && !fedHireDateInp.value)) {
        renderHeroPlaceholder();
        buybackAnalysisSection.style.display = 'none';
        tspProjectionSection.style.display = 'none';
        tspOptimizerSection.style.display = 'none';
        summarySection.style.display = 'none';
        fehbSection.style.display = 'none';
        return;
    }

    // ─── 3. Calculate FERS Pension ───
    const high3 = estimateFederalHigh3(salary, yearsToRetirement);
    const buybackYears = (hasMilitary && (buybackCompleted || !buybackNotStarted)) ? milYears : 0;
    // Total service = federal years + buyback + sick leave credit
    const totalServiceYears = totalFedYearsAtRetirement + buybackYears + sickLeaveYears;
    // For eligibility check, sick leave doesn't count
    const eligibilityYears = totalFedYearsAtRetirement + buybackYears;
    const fers = calcFERSPension(high3, totalServiceYears, retirementAge, birthYear);
    const fersWithout = hasMilitary ? calcFERSPension(high3, totalFedYearsAtRetirement + sickLeaveYears, retirementAge, birthYear) : null;

    // Update eligibility badge
    const elig = checkRetirementEligibility(retirementAge, eligibilityYears, birthYear);
    if (retirementAge && eligibilityYears > 0) {
        eligibilityBadge.style.display = 'inline-block';
        eligibilityBadge.textContent = elig.notes;
        eligibilityBadge.style.color = elig.type === 'early-reduced' ? 'var(--accent)' : '';
    } else {
        eligibilityBadge.style.display = 'none';
    }

    // ─── 4. Calculate Buyback ROI ───
    let buyback = null;
    if (hasMilitary && milYears > 0 && !buybackCompleted) {
        const milPay = getMilTotalPay();
        buyback = calcMilitaryBuyback(milPay, yearsSinceFed, milYears, high3, retirementAge, totalFedYearsAtRetirement);
    }

    // ─── 5. Calculate SRS ───
    // SRS uses FERS civilian service years ONLY — military buyback does NOT count
    const eligType = fers.eligibility ? fers.eligibility.type : '';
    const srs = calcSRS(totalFedYearsAtRetirement, ssAt67 ? adjustSSForAge(ssAt67, 62) : 1900, retirementAge, eligType);

    // ─── 6. Calculate TSP ───
    const tspProj = calcTSPProjection(tspBalance, salary, tspRate, tspReturn, yearsToRetirement, currentAge);
    const tspIncome = calcTSPMonthlyIncome(tspProj.projectedBalance);
    const tradRoth = calcTraditionalVsRoth(tspProj.projectedBalance, currentTax, retirementTax, tradPct);

    // ─── 7. VA & SS ───
    const smcKCount = parseInt(smcKCountSel.value) || 0;
    const smcS = smcSChk.checked;
    const vaOverride = vaOverrideChk.checked ? (parseFloat(vaOverrideInp.value) || 0) : 0;
    const vaMonthly = getVACompWithSMC(vaRating, smcKCount, smcS, vaOverride);
    const ssMonthly = ssAt67 ? adjustSSForAge(ssAt67, ssClaimAge) : 0;

    // ─── 8. Combined picture ───
    const fersMonthlyAfterTax = Math.round(fers.monthly * (1 - retirementTax));
    const totalRetirementMonthly = fersMonthlyAfterTax +
        tradRoth.totalMonthly +
        (retirementAge >= ssClaimAge ? ssMonthly : 0) +
        vaMonthly +
        (retirementAge < 62 && srs.eligible ? srs.monthly : 0) +
        milRetirementPay;

    const combined = calcCombinedRetirement(fers, tradRoth.totalMonthly, ssMonthly, vaMonthly,
                                             srs.monthly, milRetirementPay, retirementAge, ssClaimAge);

    // ─── 9. Render everything ───
    renderHero(fers, tradRoth, ssMonthly, vaMonthly, srs, milRetirementPay, retirementAge, retirementTax, ssClaimAge, combined, high3, totalServiceYears);

    if (hasMilitary && milYears > 0 && !buybackCompleted && buyback) {
        renderBuybackAnalysis(buyback, milYears, fersWithout, fers);
    } else if (hasMilitary && buybackCompleted) {
        renderBuybackCompleted(milYears, fersWithout, fers);
    } else {
        buybackAnalysisSection.style.display = 'none';
    }

    if (tspRate > 0 || tspBalance > 0) {
        renderTSPProjection(tspProj, tspIncome, tradRoth, yearsToRetirement, salary, tspRate);
        if (salary > 0 && yearsToRetirement > 0) {
            const optimizer = calcTSPOptimizer(tspBalance, salary, tspRate, tspReturn, yearsToRetirement, currentAge);
            renderTSPOptimizer(optimizer, salary);
        } else {
            tspOptimizerSection.style.display = 'none';
        }
    } else {
        tspProjectionSection.style.display = 'none';
        tspOptimizerSection.style.display = 'none';
    }

    renderSummary(fers, tradRoth, ssMonthly, vaMonthly, srs, milRetirementPay, retirementAge, retirementTax, ssClaimAge, combined, high3, totalServiceYears);
    renderFEHB(fedYears);

    updateTSPMatching();
}

// ── Render Functions ────────────────────────────────────────

function renderHeroPlaceholder() {
    heroCard.className = 'hero-placeholder';
    heroCard.innerHTML = '<p class="hero-placeholder-text">Enter your federal service details above to see your retirement projection</p>';
}

function renderHero(fers, tradRoth, ssMonthly, vaMonthly, srs, milRetPay, retAge, retTax, ssClaimAge, combined, high3, totalYears) {
    const fersNet = Math.round(fers.monthly * (1 - retTax));
    const tspNet = tradRoth.totalMonthly;
    const ssDisplay = retAge >= ssClaimAge ? ssMonthly : 0;
    const srsDisplay = (retAge < 62 && srs.eligible) ? srs.monthly : 0;
    const totalMonthly = fersNet + tspNet + ssDisplay + vaMonthly + srsDisplay + milRetPay;

    let subCards = '';
    subCards += `<div class="hero-sub-card">
        <p class="hero-sub-label">FERS Pension</p>
        <p class="hero-sub-value">${fmtDec(fersNet)}</p>
        <p class="hero-sub-note">after tax</p>
    </div>`;
    subCards += `<div class="hero-sub-card">
        <p class="hero-sub-label">TSP Income</p>
        <p class="hero-sub-value">${fmtDec(tspNet)}</p>
        <p class="hero-sub-note">4% withdrawal</p>
    </div>`;
    const ssEntered = ssMonthly > 0;
    let ssCardValue, ssCardNote;
    if (ssDisplay > 0) {
        ssCardValue = fmtDec(ssDisplay);
        ssCardNote = `at ${ssClaimAge}`;
    } else if (srsDisplay > 0) {
        ssCardValue = fmtDec(srsDisplay);
        ssCardNote = 'SRS until 62';
    } else if (ssEntered && retAge < ssClaimAge) {
        ssCardValue = '$0';
        ssCardNote = `starts at ${ssClaimAge}`;
    } else {
        ssCardValue = '$0';
        ssCardNote = 'not entered';
    }
    subCards += `<div class="hero-sub-card">
        <p class="hero-sub-label">Social Security</p>
        <p class="hero-sub-value">${ssCardValue}</p>
        <p class="hero-sub-note">${ssCardNote}</p>
    </div>`;
    subCards += `<div class="hero-sub-card">
        <p class="hero-sub-label">VA Disability</p>
        <p class="hero-sub-value">${vaMonthly > 0 ? fmtDec(vaMonthly) : '$0'}</p>
        <p class="hero-sub-note">${vaMonthly > 0 ? 'tax-free' : 'not entered'}</p>
    </div>`;

    if (milRetPay > 0) {
        subCards += `<div class="hero-sub-card">
            <p class="hero-sub-label">Military Pension</p>
            <p class="hero-sub-value">${fmtDec(milRetPay)}</p>
            <p class="hero-sub-note">gross</p>
        </div>`;
    }

    const pensionNote = `${fers.formula} = ${fmtDec(fers.monthly)}/mo gross`;
    const multiplierNote = fers.multiplierPct === 1.1
        ? '1.1% multiplier (age 62+ with 20+ years)'
        : '1.0% multiplier';

    heroCard.className = 'hero-result';
    heroCard.innerHTML = `
        <p class="hero-label">Your Estimated Monthly Retirement Income</p>
        <p class="hero-amount">${fmtDec(totalMonthly)}/mo</p>
        <p class="hero-detail">${fmtDec(totalMonthly * 12)}/year &middot; High-3: ${fmtDec(high3)} &middot; ${Math.round(totalYears * 10) / 10} years creditable service</p>
        <p class="hero-detail" style="font-size:0.8em;opacity:0.7;">${multiplierNote} &middot; ${fers.eligibility?.notes || ''}</p>
        <p class="hero-lifetime">Estimated Lifetime Value (to age 87): ${fmtK(combined.lifetimeTotal)}</p>
        <div class="hero-sub-cards${milRetPay > 0 ? ' five-cols' : ''}">${subCards}</div>
    `;
}

function renderBuybackAnalysis(bb, milYears, fersWithout, fersWith) {
    let html = '';

    // ROI Cards
    html += `<div class="buyback-roi-grid">
        <div class="roi-card">
            <p class="roi-card-label">Buyback Deposit</p>
            <p class="roi-card-value">${fmt(bb.totalCost)}</p>
            <p class="roi-card-sub">${bb.interest > 0 ? fmt(bb.baseDeposit) + ' base + ' + fmt(bb.interest) + ' interest' : 'one-time payment'}</p>
        </div>
        <div class="roi-card">
            <p class="roi-card-label">Annual Pension Increase</p>
            <p class="roi-card-value positive">+${fmt(bb.annualPensionIncrease)}/yr</p>
            <p class="roi-card-sub">+${fmt(bb.monthlyPensionIncrease)}/mo for life</p>
        </div>
        <div class="roi-card">
            <p class="roi-card-label">Breakeven</p>
            <p class="roi-card-value highlight">${bb.breakevenMonths} months</p>
            <p class="roi-card-sub">${bb.breakevenYears} years to pay for itself</p>
        </div>
        <div class="roi-card">
            <p class="roi-card-label">Lifetime ROI</p>
            <p class="roi-card-value positive">${fmt(bb.lifetimeValue)}</p>
            <p class="roi-card-sub">${bb.roi.toLocaleString()}% return over ${bb.yearsInRetirement} years</p>
        </div>
    </div>`;

    // Pension comparison
    if (fersWithout) {
        html += `<div class="trad-roth-comparison">
            <div class="tr-card traditional">
                <p class="tr-card-label">Without Buyback</p>
                <p class="tr-card-amount">${fmt(fersWithout.monthly)}/mo</p>
                <p class="tr-card-detail">Federal service only</p>
            </div>
            <div class="tr-card roth">
                <p class="tr-card-label">With Buyback (+${milYears} years)</p>
                <p class="tr-card-amount">${fmt(fersWith.monthly)}/mo</p>
                <p class="tr-card-detail">+${fmt(bb.monthlyPensionIncrease)}/mo for life</p>
            </div>
        </div>`;
    }

    // Verdict
    html += `<div class="buyback-verdict">
        <p class="verdict-title">Verdict</p>
        <p class="verdict-line">Pay ${fmt(bb.totalCost)} once, get ${fmt(bb.annualPensionIncrease)}/year for life.</p>
        <p class="verdict-detail">Your deposit pays for itself in ${bb.breakevenYears} years and is worth ${fmtK(bb.lifetimeValue)} over your retirement. This is one of the best investments a federal employee can make.</p>
    </div>`;

    // Interest warning
    if (bb.pastInterestWindow) {
        html += `<div class="interest-warning">
            <p class="warn-title">Interest Is Accruing</p>
            <p>You're past the 2-year interest-free window. Your deposit has accrued ${fmt(bb.interest)} in interest (${bb.interestYears} years at ~${(BUYBACK_INTEREST_RATE * 100)}%). Every year you wait adds more:</p>
            <p style="margin-top:6px;"><strong>Cost if you wait 1 more year:</strong> ${fmt(bb.costIfWait1Year)}</p>
            <p><strong>Cost if you wait 3 more years:</strong> ${fmt(bb.costIfWait3Years)}</p>
            <p style="margin-top:8px;">File <strong>SF-3108</strong> (Application to Make Deposit) with your HR/payroll office to start the process.</p>
        </div>`;
    } else {
        html += `<div class="info-card" style="margin-top:14px;">
            <p class="info-title">No Interest Yet</p>
            <p>You're still within the 2-year interest-free window. Complete your deposit now to lock in the lowest cost. File <strong>SF-3108</strong> with your HR/payroll office.</p>
        </div>`;
    }

    buybackAnalysisContent.innerHTML = html;
    buybackAnalysisSection.style.display = 'block';
}

function renderBuybackCompleted(milYears, fersWithout, fersWith) {
    const diff = fersWith && fersWithout ? fersWith.monthly - fersWithout.monthly : 0;
    let html = `<div class="buyback-verdict" style="background: rgba(39,103,73,0.08);">
        <p class="verdict-title">Buyback Completed</p>
        <p class="verdict-line">Your ${milYears} years of military service count toward your FERS pension.</p>
        ${diff > 0 ? `<p class="verdict-detail">This adds approximately ${fmt(diff)}/mo (${fmt(diff * 12)}/yr) to your pension.</p>` : ''}
    </div>`;
    buybackAnalysisContent.innerHTML = html;
    buybackAnalysisSection.style.display = 'block';
}

function renderTSPProjection(proj, income, tradRoth, yearsToRet, salary, rate) {
    let html = '';

    // Bar chart with Y-axis and tooltips
    if (proj.yearByYear.length > 0 && proj.yearByYear.length <= 50) {
        const maxBal = proj.yearByYear[proj.yearByYear.length - 1].balance;

        // Build Y-axis labels (5 ticks from $0 to max, rounded to clean numbers)
        const tickCount = 5;
        const rawStep = maxBal / tickCount;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
        const niceMax = niceStep * tickCount;

        let yLabels = '';
        for (let i = tickCount; i >= 0; i--) {
            yLabels += `<span class="tsp-y-label">${fmtK(niceStep * i)}</span>`;
        }

        // Build grid lines
        let gridLines = '';
        for (let i = 0; i <= tickCount; i++) {
            gridLines += `<div class="tsp-grid-line"></div>`;
        }

        // Build bars with tooltips
        let bars = '';
        for (const yr of proj.yearByYear) {
            const heightPct = niceMax > 0 ? (yr.balance / niceMax * 100) : 0;
            const contribs = yr.employeeContrib + yr.agencyContrib;
            bars += `<div class="tsp-bar" style="height:${Math.max(heightPct, 0.5)}%">
                <div class="tsp-bar-tooltip">
                    Year ${yr.year}<br>
                    <strong>${fmtK(yr.balance)}</strong><br>
                    +${fmtK(contribs)} contributed &middot; +${fmtK(yr.growth)} growth
                </div>
            </div>`;
        }

        html += `<div class="tsp-chart-container">
            <div class="tsp-y-axis">${yLabels}</div>
            <div class="tsp-chart-wrapper">
                <div class="tsp-chart-area">
                    <div class="tsp-grid-lines">${gridLines}</div>
                    <div class="tsp-bar-chart">${bars}</div>
                </div>
                <div class="tsp-bar-labels">
                    <span>Year 1</span>
                    <span>Year ${Math.ceil(yearsToRet / 2)}</span>
                    <span>Year ${yearsToRet}</span>
                </div>
            </div>
        </div>`;
    }

    // Summary cards
    html += `<div class="tsp-summary-grid">
        <div class="summary-stat highlight">
            <p class="summary-stat-label">Projected TSP Balance</p>
            <p class="summary-stat-value">${fmtK(proj.projectedBalance)}</p>
            <p class="summary-stat-sub">at retirement</p>
        </div>
        <div class="summary-stat">
            <p class="summary-stat-label">Monthly TSP Income</p>
            <p class="summary-stat-value">${fmt(income.monthly)}/mo</p>
            <p class="summary-stat-sub">4% safe withdrawal</p>
        </div>
        <div class="summary-stat">
            <p class="summary-stat-label">Total Agency Match</p>
            <p class="summary-stat-value">${fmtK(proj.totalAgencyContributions)}</p>
            <p class="summary-stat-sub">free money over ${yearsToRet} years</p>
        </div>
    </div>`;

    // Growth breakdown
    html += `<div class="summary-breakdown">
        <div class="summary-row">
            <span class="summary-row-label">Starting balance</span>
            <span class="summary-row-value">${fmt(parseFloat(tspBalanceInp.value) || 0)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">Your contributions (${rate}%)</span>
            <span class="summary-row-value">${fmtK(proj.totalEmployeeContributions)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">Agency contributions</span>
            <span class="summary-row-value positive">${fmtK(proj.totalAgencyContributions)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">Investment growth</span>
            <span class="summary-row-value positive">${fmtK(proj.totalGrowth)}</span>
        </div>
        <div class="summary-row total-row">
            <span class="summary-row-label">Projected Balance at Retirement</span>
            <span class="summary-row-value">${fmtK(proj.projectedBalance)}</span>
        </div>
    </div>`;

    // Traditional vs Roth
    const tradPct = tspTradPctInp.value !== '' ? parseInt(tspTradPctInp.value) : 100;
    if (tradPct > 0 && tradPct < 100) {
        html += `<h3 style="margin-top:20px;">Traditional vs. Roth TSP at Retirement</h3>`;
        html += `<div class="trad-roth-comparison">
            <div class="tr-card traditional">
                <p class="tr-card-label">Traditional (${tradPct}%)</p>
                <p class="tr-card-amount">${fmt(tradRoth.tradMonthly)}/mo</p>
                <p class="tr-card-detail">after ${(parseFloat(retirementTaxSel.value) * 100).toFixed(0)}% retirement tax</p>
            </div>
            <div class="tr-card roth">
                <p class="tr-card-label">Roth (${100 - tradPct}%)</p>
                <p class="tr-card-amount">${fmt(tradRoth.rothMonthly)}/mo</p>
                <p class="tr-card-detail">tax-free withdrawals</p>
            </div>
        </div>`;
        if (tradRoth.effectiveTaxDrag > 0) {
            html += `<p class="input-hint" style="margin-top:10px;">Tax drag on Traditional TSP: ${fmtK(tradRoth.effectiveTaxDrag)} in retirement taxes over time. Consider increasing Roth contributions if you expect higher taxes in retirement.</p>`;
        }
    }

    tspProjectionContent.innerHTML = html;
    tspProjectionSection.style.display = 'block';
}

function renderTSPOptimizer(scenarios, salary) {
    let html = `<table class="optimizer-table">
        <thead>
            <tr>
                <th>Contribution Rate</th>
                <th>Monthly Cost</th>
                <th>Agency Match</th>
                <th>Projected Balance</th>
                <th>Monthly Income</th>
                <th>vs. Current</th>
            </tr>
        </thead>
        <tbody>`;

    for (const s of scenarios) {
        const monthlyCost = Math.round(salary * s.rate / 100 / 12);
        const rowClass = s.isCurrent ? 'current-row' : (s.isFullMatch && !s.isCurrent ? 'full-match-row' : '');
        const label = s.isCurrent ? `${s.rate}% (current)` :
                      (s.rate === 5 && !scenarios.find(x => x.isCurrent && x.rate >= 5)) ? `${s.rate}%` : `${s.rate}%`;
        const badge = (s.isFullMatch && s.rate === 5 && scenarios.find(x => x.isCurrent && x.rate < 5))
            ? '<span class="match-badge">Full Match</span>' : '';

        html += `<tr class="${rowClass}">
            <td>${label}${badge}</td>
            <td>${fmt(monthlyCost)}/mo</td>
            <td>${s.agencyPercent.toFixed(1)}%</td>
            <td>${fmtK(s.projectedBalance)}</td>
            <td>${fmt(s.monthlyIncome)}/mo</td>
            <td class="${s.additionalBalance > 0 ? 'additional' : ''}">${s.additionalBalance > 0 ? '+' + fmtK(s.additionalBalance) : '—'}</td>
        </tr>`;
    }

    html += `</tbody></table>`;
    tspOptimizerContent.innerHTML = html;
    tspOptimizerSection.style.display = 'block';
}

function renderSummary(fers, tradRoth, ssMonthly, vaMonthly, srs, milRetPay, retAge, retTax, ssClaimAge, combined, high3, totalYears) {
    const fersGross = fers.monthly;
    const fersNet = Math.round(fersGross * (1 - retTax));
    const tspNet = tradRoth.totalMonthly;
    const ssDisplay = retAge >= ssClaimAge ? ssMonthly : 0;
    const srsDisplay = (retAge < 62 && srs.eligible) ? srs.monthly : 0;
    const totalMonthly = fersNet + tspNet + ssDisplay + vaMonthly + srsDisplay + milRetPay;

    let html = '';

    // Stat cards
    html += `<div class="summary-grid">
        <div class="summary-stat highlight">
            <p class="summary-stat-label">Net Monthly Income</p>
            <p class="summary-stat-value">${fmt(totalMonthly)}/mo</p>
            <p class="summary-stat-sub">after federal tax</p>
        </div>
        <div class="summary-stat">
            <p class="summary-stat-label">Net Annual Income</p>
            <p class="summary-stat-value">${fmt(totalMonthly * 12)}/yr</p>
            <p class="summary-stat-sub">at retirement</p>
        </div>
        <div class="summary-stat">
            <p class="summary-stat-label">Lifetime Value (to 87)</p>
            <p class="summary-stat-value">${fmtK(combined.lifetimeTotal)}</p>
            <p class="summary-stat-sub">${combined.yearsInRetirement} years</p>
        </div>
    </div>`;

    // Breakdown
    html += `<div class="summary-breakdown">
        <div class="summary-row">
            <span class="summary-row-label">FERS Pension (gross)</span>
            <span class="summary-row-value taxable">${fmt(fersGross)}/mo</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">Federal tax (${(retTax * 100).toFixed(0)}%)</span>
            <span class="summary-row-value" style="color:var(--accent);">-${fmt(Math.round(fersGross * retTax))}/mo</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">FERS Pension (net)</span>
            <span class="summary-row-value">${fmt(fersNet)}/mo</span>
        </div>`;

    html += `<div class="summary-row">
        <span class="summary-row-label">TSP Income (after tax)</span>
        <span class="summary-row-value">${fmt(tspNet)}/mo</span>
    </div>`;

    if (srsDisplay > 0) {
        html += `<div class="summary-row">
            <span class="summary-row-label">FERS Special Retirement Supplement</span>
            <span class="summary-row-value positive">${fmt(srsDisplay)}/mo <span style="font-size:0.8em;color:var(--text-secondary);">(until age 62)</span></span>
        </div>`;
    }

    if (ssDisplay > 0) {
        html += `<div class="summary-row">
            <span class="summary-row-label">Social Security (at ${ssClaimAge})</span>
            <span class="summary-row-value">${fmt(ssDisplay)}/mo</span>
        </div>`;
    } else if (ssMonthly > 0 && retAge < ssClaimAge) {
        html += `<div class="summary-row" style="opacity:0.5;">
            <span class="summary-row-label">Social Security (starts at ${ssClaimAge})</span>
            <span class="summary-row-value">${fmt(ssMonthly)}/mo</span>
        </div>`;
    }

    if (vaMonthly > 0) {
        html += `<div class="summary-row">
            <span class="summary-row-label">VA Disability Compensation</span>
            <span class="summary-row-value tax-free">${fmt(vaMonthly)}/mo (tax-free)</span>
        </div>`;
    }

    if (milRetPay > 0) {
        html += `<div class="summary-row">
            <span class="summary-row-label">Military Retirement Pay</span>
            <span class="summary-row-value">${fmt(milRetPay)}/mo (gross)</span>
        </div>`;
    }

    html += `<div class="summary-row total-row">
        <span class="summary-row-label">Total Monthly Retirement Income</span>
        <span class="summary-row-value">${fmt(totalMonthly)}/mo</span>
    </div>`;

    html += `</div>`;

    // Lifetime breakdown
    html += `<h3 style="margin-top:20px;">Lifetime Income Breakdown (to age 87)</h3>`;
    html += `<div class="summary-breakdown" style="margin-top:8px;">`;
    if (combined.lifetimeFERS > 0) html += `<div class="summary-row"><span class="summary-row-label">FERS Pension</span><span class="summary-row-value">${fmtK(combined.lifetimeFERS)}</span></div>`;
    if (combined.lifetimeTSP > 0) html += `<div class="summary-row"><span class="summary-row-label">TSP Withdrawals</span><span class="summary-row-value">${fmtK(combined.lifetimeTSP)}</span></div>`;
    if (combined.lifetimeSS > 0) html += `<div class="summary-row"><span class="summary-row-label">Social Security</span><span class="summary-row-value">${fmtK(combined.lifetimeSS)}</span></div>`;
    if (combined.lifetimeVA > 0) html += `<div class="summary-row"><span class="summary-row-label">VA Disability</span><span class="summary-row-value tax-free">${fmtK(combined.lifetimeVA)}</span></div>`;
    if (combined.lifetimeSRS > 0) html += `<div class="summary-row"><span class="summary-row-label">Special Retirement Supplement</span><span class="summary-row-value">${fmtK(combined.lifetimeSRS)}</span></div>`;
    html += `<div class="summary-row total-row"><span class="summary-row-label">Estimated Lifetime Total</span><span class="summary-row-value">${fmtK(combined.lifetimeTotal)}</span></div>`;
    html += `</div>`;

    summaryContent.innerHTML = html;
    summarySection.style.display = 'block';
}

function renderFEHB(fedYears) {
    const fehb = checkFEHBEligibility(fedYears);
    const retAge = parseInt(retirementAgeInp.value) || 0;
    const curAge = parseInt(currentAgeInp.value) || 0;
    const yearsToRet = retAge > curAge ? retAge - curAge : 0;
    const yearsAtRetirement = fedYears + yearsToRet;
    let html = '';
    if (fehb.eligible) {
        html = `<p>You've been a federal employee for ${Math.round(fedYears)} years — you meet the 5-year FEHB enrollment requirement. You can keep your Federal Employee Health Benefits in retirement, with the government continuing to pay its share of the premium (roughly 72-75%).</p>
        <p style="margin-top:8px;font-weight:600;">Estimated annual value: ${fmt(fehb.annualValue)} in employer-subsidized health coverage.</p>`;
    } else if (yearsAtRetirement >= 5) {
        html = `<p>You currently have ${Math.round(fedYears)} years of federal service — you need 5 continuous years of FEHB enrollment before retirement. At your planned retirement age, you'll have ${Math.round(yearsAtRetirement)} years, so you'll be covered. Just make sure you stay enrolled in FEHB.</p>
        <p style="margin-top:8px;font-weight:600;">Estimated annual value at retirement: ${fmt(fehb.annualValue)} in employer-subsidized health coverage.</p>`;
    } else {
        html = `<p>You currently have ${Math.round(fedYears)} years of federal service and need 5 continuous years of FEHB enrollment before retirement to keep your health benefits. Make sure you stay enrolled — this is one of the most valuable federal retirement benefits.</p>`;
    }
    fehbContent.innerHTML = html;
    fehbSection.style.display = 'block';
}

// ── Email Handler ───────────────────────────────────────────

async function handleEmailSubmit(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    const submitBtn = document.getElementById('email-submit-btn');
    submitBtn.disabled = true;
    emailStatus.textContent = 'Sending...';

    try {
        const shareUrl = buildShareUrl();
        const resp = await fetch('/api/email-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                resultsUrl: shareUrl,
                source: 'federal-retirement'
            })
        });
        if (resp.ok) {
            emailStatus.textContent = '✓ Check your inbox — your results link is on its way.';
            emailStatus.style.color = 'var(--green)';
        } else {
            emailStatus.textContent = 'Something went wrong. Try again.';
            emailStatus.style.color = 'var(--accent)';
        }
    } catch {
        emailStatus.textContent = 'Something went wrong. Try again.';
        emailStatus.style.color = 'var(--accent)';
    } finally {
        submitBtn.disabled = false;
    }
}

// ── URL State Management ────────────────────────────────────

function buildShareUrl() {
    const p = new URLSearchParams();
    if (gsGradeSel.value) p.set('grade', gsGradeSel.value);
    if (gsStepSel.value) p.set('step', gsStepSel.value);
    if (localitySel.value) p.set('loc', localitySel.value);
    if (salaryOverrideChk.checked && salaryManualInp.value) p.set('sal', salaryManualInp.value);
    if (fedHireDateInp.value) p.set('hire', fedHireDateInp.value);
    if (currentAgeInp.value) p.set('age', currentAgeInp.value);
    if (retirementAgeInp.value) p.set('retage', retirementAgeInp.value);
    if (serviceYearsOverrideChk.checked && fedServiceYearsInp.value) p.set('fedyrs', fedServiceYearsInp.value);
    if (sickLeaveInp.value) p.set('sick', sickLeaveInp.value);

    p.set('mil', hasMilitaryChk.checked ? '1' : '0');
    if (hasMilitaryChk.checked) {
        if (milYearsInp.value) p.set('milyrs', milYearsInp.value);
        if (milTotalPayInp.value) p.set('milpay', milTotalPayInp.value);
        if (buybackStatusSel.value) p.set('bbstat', buybackStatusSel.value);
        if (yearsSinceFedInp.value) p.set('fedsince', yearsSinceFedInp.value);
    }

    if (tspBalanceInp.value) p.set('tspbal', tspBalanceInp.value);
    if (tspContribRateInp.value) p.set('tsprate', tspContribRateInp.value);
    if (tspReturnSel.value) p.set('tspret', tspReturnSel.value);
    if (tspTradPctInp.value !== '100') p.set('tsptrad', tspTradPctInp.value);
    if (tspCatchupChk.checked) p.set('catchup', '1');
    if (currentTaxSel.value) p.set('curtax', currentTaxSel.value);
    if (retirementTaxSel.value) p.set('rettax', retirementTaxSel.value);

    if (vaRatingSel.value !== '0') {
        p.set('va', vaRatingSel.value);
        if (smcKCountSel.value !== '0') p.set('smck', smcKCountSel.value);
        if (smcSChk.checked) p.set('smcs', '1');
        if (vaOverrideChk.checked && vaOverrideInp.value) p.set('vaamt', vaOverrideInp.value);
    }
    if (ssEstimateInp.value) p.set('ss', ssEstimateInp.value);
    if (ssClaimAgeSel.value !== '67') p.set('ssage', ssClaimAgeSel.value);
    if (hasMilRetirementChk.checked) {
        p.set('milret', '1');
        if (milRetirementPayInp.value) p.set('milretpay', milRetirementPayInp.value);
    }

    return window.location.origin + window.location.pathname + '?' + p.toString();
}

function loadFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (p.size === 0) return;

    if (p.has('grade')) gsGradeSel.value = p.get('grade');
    if (p.has('step')) gsStepSel.value = p.get('step');
    if (p.has('loc')) localitySel.value = p.get('loc');
    if (p.has('sal')) {
        salaryOverrideChk.checked = true;
        salaryOverrideRow.style.display = 'block';
        salaryManualInp.value = p.get('sal');
    }
    if (p.has('hire')) fedHireDateInp.value = p.get('hire');
    if (p.has('age')) currentAgeInp.value = p.get('age');
    if (p.has('retage')) retirementAgeInp.value = p.get('retage');
    if (p.has('fedyrs')) {
        serviceYearsOverrideChk.checked = true;
        serviceYearsManualRow.style.display = 'block';
        fedServiceYearsInp.value = p.get('fedyrs');
    }
    if (p.has('sick')) sickLeaveInp.value = p.get('sick');

    if (p.has('mil')) {
        const hasMil = p.get('mil') === '1';
        hasMilitaryChk.checked = hasMil;
        buybackSection.style.display = hasMil ? 'block' : 'none';
    }
    if (p.has('milyrs')) milYearsInp.value = p.get('milyrs');
    if (p.has('milpay')) milTotalPayInp.value = p.get('milpay');
    if (p.has('bbstat')) {
        buybackStatusSel.value = p.get('bbstat');
        onBuybackStatusChange();
    }
    if (p.has('fedsince')) yearsSinceFedInp.value = p.get('fedsince');

    if (p.has('tspbal')) tspBalanceInp.value = p.get('tspbal');
    if (p.has('tsprate')) tspContribRateInp.value = p.get('tsprate');
    if (p.has('tspret')) tspReturnSel.value = p.get('tspret');
    if (p.has('tsptrad')) tspTradPctInp.value = p.get('tsptrad');
    if (p.has('catchup')) tspCatchupChk.checked = true;
    if (p.has('curtax')) currentTaxSel.value = p.get('curtax');
    if (p.has('rettax')) retirementTaxSel.value = p.get('rettax');

    if (p.has('va')) {
        vaRatingSel.value = p.get('va');
        if (parseInt(p.get('va')) > 0) smcSection.style.display = 'block';
    }
    if (p.has('smck')) smcKCountSel.value = p.get('smck');
    if (p.has('smcs')) smcSChk.checked = true;
    if (p.has('vaamt')) {
        vaOverrideChk.checked = true;
        vaOverrideRow.style.display = 'block';
        vaOverrideInp.value = p.get('vaamt');
    }
    if (p.has('ss')) ssEstimateInp.value = p.get('ss');
    if (p.has('ssage')) ssClaimAgeSel.value = p.get('ssage');
    if (p.has('milret')) {
        hasMilRetirementChk.checked = true;
        milRetirementRow.style.display = 'block';
    }
    if (p.has('milretpay')) milRetirementPayInp.value = p.get('milretpay');

    // Update derived displays
    updateSalaryEstimate();
    updateFERSType();
    updateAutoServiceYears();
    updateMRABadge();
    const tradVal = parseInt(tspTradPctInp.value) || 0;
    rothDisplay.textContent = `Roth TSP: ${100 - tradVal}%`;
}

// ── Launch ──────────────────────────────────────────────────

init();
