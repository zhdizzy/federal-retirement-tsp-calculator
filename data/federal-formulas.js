/* ============================================================
   Federal Retirement Formulas
   FERS pension, military buyback, TSP projection, combined picture
   Sources: 5 USC Ch. 84, 5 CFR 841, OPM FERS Handbook, TSP.gov
   ============================================================ */

// ── FERS Constants ──────────────────────────────────────────
const FERS_TYPES = {
    'fers':      { label: 'FERS',       contributionRate: 0.008,  hired: 'Before 2013' },
    'fers-rae':  { label: 'FERS-RAE',   contributionRate: 0.031,  hired: '2013' },
    'fers-frae': { label: 'FERS-FRAE',  contributionRate: 0.044,  hired: '2014 or later' }
};

// MRA by birth year — full OPM table with 2-month increments
const MRA_TABLE = [
    { minYear: 0,    maxYear: 1947, mra: 55 },
    { minYear: 1948, maxYear: 1948, mra: 55 + 2/12 },
    { minYear: 1949, maxYear: 1949, mra: 55 + 4/12 },
    { minYear: 1950, maxYear: 1950, mra: 55 + 6/12 },
    { minYear: 1951, maxYear: 1951, mra: 55 + 8/12 },
    { minYear: 1952, maxYear: 1952, mra: 55 + 10/12 },
    { minYear: 1953, maxYear: 1964, mra: 56 },
    { minYear: 1965, maxYear: 1965, mra: 56 + 2/12 },
    { minYear: 1966, maxYear: 1966, mra: 56 + 4/12 },
    { minYear: 1967, maxYear: 1967, mra: 56 + 6/12 },
    { minYear: 1968, maxYear: 1968, mra: 56 + 8/12 },
    { minYear: 1969, maxYear: 1969, mra: 56 + 10/12 },
    { minYear: 1970, maxYear: 9999, mra: 57 }
];

// TSP 2026 contribution limits (SECURE 2.0 Act)
const TSP_LIMIT_2026 = 24500;
const TSP_CATCHUP_2026 = 8000;          // standard catch-up (age 50+)
const TSP_SUPER_CATCHUP_2026 = 11250;   // age 60-63 super catch-up (SECURE 2.0 §109)
const TSP_TOTAL_LIMIT_50_PLUS = TSP_LIMIT_2026 + TSP_CATCHUP_2026;           // $32,500
const TSP_TOTAL_LIMIT_60_63 = TSP_LIMIT_2026 + TSP_SUPER_CATCHUP_2026;      // $35,750

// Buyback interest rate (Treasury rate, set annually)
const BUYBACK_INTEREST_RATE = 0.0425; // 2026 rate: 4.25%
const BUYBACK_DEPOSIT_RATE = 0.03;    // 3% of military base pay

// COLA estimates for projections
const FERS_COLA_ESTIMATE = 0.02;       // conservative average (FERS "diet COLA")
const MILITARY_PENSION_COLA = 0.025;   // full CPI for military pensions

// SRS earnings test threshold (2026)
const SRS_EARNINGS_LIMIT_2026 = 24480;

// ── FERS Type Detection ─────────────────────────────────────

function detectFERSType(hireDateStr) {
    if (!hireDateStr) return 'fers-frae';
    const d = new Date(hireDateStr);
    if (d < new Date('2013-01-01')) return 'fers';
    if (d < new Date('2014-01-01')) return 'fers-rae';
    return 'fers-frae';
}

function getFERSLabel(fersType) {
    return (FERS_TYPES[fersType] || FERS_TYPES['fers-frae']).label;
}

function getFERSContributionRate(fersType) {
    return (FERS_TYPES[fersType] || FERS_TYPES['fers-frae']).contributionRate;
}

// ── MRA & Retirement Eligibility ────────────────────────────

function getMRA(birthYear) {
    for (const row of MRA_TABLE) {
        if (birthYear >= row.minYear && birthYear <= row.maxYear) return row.mra;
    }
    return 57;
}

/** Format MRA for display (e.g. "56 and 6 months") */
function formatMRA(mra) {
    const years = Math.floor(mra);
    const months = Math.round((mra - years) * 12);
    if (months === 0) return `${years}`;
    return `${years} and ${months} months`;
}

/** Calculate years of federal service from hire date to a target date */
function calcYearsOfService(hireDateStr, targetDateStr) {
    if (!hireDateStr) return 0;
    const hire = new Date(hireDateStr);
    const target = targetDateStr ? new Date(targetDateStr) : new Date();
    const diffMs = target - hire;
    return Math.max(0, Math.round(diffMs / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10);
}

function checkRetirementEligibility(retirementAge, serviceYears, birthYear) {
    const mra = getMRA(birthYear);
    const mraDisplay = formatMRA(mra);
    const result = { eligible: false, type: '', penalty: 0, penaltyPct: 0, notes: '', mra, mraDisplay };

    // Immediate — full pension (check most generous first)
    if (retirementAge >= 62 && serviceYears >= 5) {
        result.eligible = true;
        result.type = 'immediate';
        result.notes = 'Age 62+ with 5+ years — full pension';
        return result;
    }
    if (retirementAge >= 60 && serviceYears >= 20) {
        result.eligible = true;
        result.type = 'immediate';
        result.notes = 'Age 60+ with 20+ years — full pension';
        return result;
    }
    if (retirementAge >= mra && serviceYears >= 30) {
        result.eligible = true;
        result.type = 'immediate';
        result.notes = `MRA (${mraDisplay}) with 30+ years — full pension`;
        return result;
    }

    // MRA + 10 — permanently reduced pension
    if (retirementAge >= mra && serviceYears >= 10) {
        const yearsUnder62 = Math.max(0, 62 - retirementAge);
        const penaltyPct = yearsUnder62 * 5; // 5% per year under 62
        result.eligible = true;
        result.type = 'early-reduced';
        result.penaltyPct = penaltyPct;
        result.penalty = penaltyPct / 100;
        result.notes = `MRA+10 — pension permanently reduced ${penaltyPct}% (5%/yr under age 62)`;
        return result;
    }

    // Deferred
    if (serviceYears >= 5) {
        result.eligible = true;
        result.type = 'deferred';
        result.notes = 'Deferred retirement — pension begins at age 62 (no reduction)';
        return result;
    }

    result.notes = 'Not eligible — need at least 5 years of creditable service';
    return result;
}

// ── FERS Pension Calculation ────────────────────────────────

/** Calculate FERS basic pension
 *  @param high3 - High-3 average salary
 *  @param serviceYears - Total creditable service years (including buyback + sick leave)
 *  @param retirementAge - Age at retirement
 *  @param birthYear - Birth year for MRA/eligibility */
function calcFERSPension(high3, serviceYears, retirementAge, birthYear) {
    if (!high3 || !serviceYears || serviceYears <= 0) {
        return { annual: 0, monthly: 0, multiplier: 0, formula: '', notes: '' };
    }

    const multiplier = (retirementAge >= 62 && serviceYears >= 20) ? 0.011 : 0.01;
    const multiplierPct = multiplier * 100;
    let annualPension = high3 * serviceYears * multiplier;

    const eligibility = checkRetirementEligibility(retirementAge, serviceYears, birthYear || 1970);
    let penaltyNote = '';
    if (eligibility.type === 'early-reduced' && eligibility.penalty > 0) {
        const reduction = annualPension * eligibility.penalty;
        annualPension -= reduction;
        penaltyNote = ` (reduced ${eligibility.penaltyPct}%: -$${Math.round(reduction).toLocaleString()}/yr)`;
    }

    // FERS pension cap: cannot exceed 80% of High-3 (rare, but technically applies at 80 years of service at 1%)
    annualPension = Math.min(annualPension, high3 * 0.80);

    const formula = `$${high3.toLocaleString()} x ${serviceYears} yrs x ${multiplierPct}%`;

    return {
        annual: Math.round(annualPension),
        monthly: Math.round(annualPension / 12),
        multiplier,
        multiplierPct,
        formula,
        eligibility,
        penaltyNote,
        notes: eligibility.notes + penaltyNote
    };
}

// ── Sick Leave Credit ───────────────────────────────────────

/** Convert unused sick leave hours to years of service credit
 *  Post-2014: 100% of unused sick leave counts toward pension computation
 *  Does NOT count for eligibility — only for the annuity calculation
 *  2,087 hours = 1 year; each 174 hours = 1 month */
function sickLeaveCredit(hours) {
    if (!hours || hours <= 0) return 0;
    // OPM: 2,087 hours = 1 year of service credit
    return Math.round((hours / 2087) * 100) / 100;
}

// ── FERS COLA Projection ────────────────────────────────────

/** Project FERS pension with COLA over time
 *  FERS COLA: under 62 = 0%, 62+ = "diet COLA" (capped per 5 CFR 841 Subpart G)
 *  SRS gets NO COLA */
function projectFERSWithCOLA(annualPension, retirementAge, targetAge) {
    let total = 0;
    let current = annualPension;
    const years = targetAge - retirementAge;
    const yearlyValues = [];

    for (let y = 0; y < years; y++) {
        const age = retirementAge + y;
        yearlyValues.push({ age, annual: Math.round(current) });
        total += current;
        if (age >= 62) current *= (1 + FERS_COLA_ESTIMATE);
    }
    return { lifetime: Math.round(total), yearlyValues };
}

// ── Special Retirement Supplement (SRS) ─────────────────────

/** Calculate FERS Special Retirement Supplement
 *  Bridges retirement to age 62 (approximates Social Security)
 *  Only for immediate unreduced retirees (MRA+30 or 60+20) — NOT MRA+10
 *  Formula: (FERS civilian service years / 40) x estimated SS at 62
 *  IMPORTANT: Military buyback years do NOT count toward SRS (per OPM)
 *  SRS receives NO COLA and is subject to an earnings test */
function calcSRS(fersCivilianYears, estimatedSS62, retirementAge, eligibilityType) {
    const empty = { monthly: 0, annual: 0, totalValue: 0, yearsReceived: 0, eligible: false, earningsLimit: SRS_EARNINGS_LIMIT_2026 };
    if (retirementAge >= 62) return empty;
    if (eligibilityType !== 'immediate') return empty;

    const ss62 = estimatedSS62 || 1900;
    const monthly = Math.round((fersCivilianYears / 40) * ss62);
    const yearsReceived = 62 - retirementAge;
    const totalValue = monthly * 12 * yearsReceived;

    return {
        monthly,
        annual: monthly * 12,
        totalValue,
        yearsReceived,
        eligible: true,
        earningsLimit: SRS_EARNINGS_LIMIT_2026
    };
}

// ── Military Buyback ────────────────────────────────────────

/** Calculate military service buyback cost and ROI
 *  Deposit = 3% of total military base pay
 *  Interest compounds annually after 2-year grace period from FERS coverage start
 *  Must be paid IN FULL before retirement or the option is lost forever */
function calcMilitaryBuyback(totalMilitaryPay, yearsSinceFedStart, militaryServiceYears,
                              high3, retirementAge, currentServiceYears) {
    if (!totalMilitaryPay || !militaryServiceYears) {
        return { cost: 0, interest: 0, totalCost: 0, eligible: false };
    }

    const baseDeposit = Math.round(totalMilitaryPay * BUYBACK_DEPOSIT_RATE);

    // Interest compounds annually after 2-year grace period
    // Cap at 40 years — no one has more than 40 years of federal service
    let interest = 0;
    let interestYears = 0;
    if (yearsSinceFedStart > 2) {
        interestYears = Math.min(yearsSinceFedStart - 2, 40);
        interest = Math.round(baseDeposit * (Math.pow(1 + BUYBACK_INTEREST_RATE, interestYears) - 1));
    }

    const totalCost = baseDeposit + interest;

    // Pension increase from buyback
    const totalYearsWithBuyback = currentServiceYears + militaryServiceYears;
    const multiplier = (retirementAge >= 62 && totalYearsWithBuyback >= 20) ? 0.011 : 0.01;
    const annualPensionIncrease = Math.round(high3 * militaryServiceYears * multiplier);

    // Breakeven
    const breakevenMonths = annualPensionIncrease > 0 ? Math.ceil((totalCost / annualPensionIncrease) * 12) : 0;
    const breakevenYears = (breakevenMonths / 12).toFixed(1);

    // Lifetime ROI (to age 87)
    const yearsInRetirement = Math.max(0, 87 - retirementAge);
    let lifetimeValue = 0;
    let annual = annualPensionIncrease;
    for (let y = 0; y < yearsInRetirement; y++) {
        lifetimeValue += annual;
        if ((retirementAge + y) >= 62) annual *= (1 + FERS_COLA_ESTIMATE);
    }
    lifetimeValue = Math.round(lifetimeValue);
    const roi = totalCost > 0 ? Math.round(((lifetimeValue - totalCost) / totalCost) * 100) : 0;

    // Cost of waiting projections
    const waitYears1 = Math.min(interestYears + 1, 41);
    const waitYears3 = Math.min(interestYears + 3, 43);
    const costIfWait1Year = Math.round(baseDeposit * (Math.pow(1 + BUYBACK_INTEREST_RATE, waitYears1) - 1)) + baseDeposit;
    const costIfWait3Years = Math.round(baseDeposit * (Math.pow(1 + BUYBACK_INTEREST_RATE, waitYears3) - 1)) + baseDeposit;

    return {
        eligible: true,
        baseDeposit,
        interest,
        interestYears,
        totalCost,
        annualPensionIncrease,
        monthlyPensionIncrease: Math.round(annualPensionIncrease / 12),
        breakevenMonths,
        breakevenYears,
        lifetimeValue,
        roi,
        costIfWait1Year,
        costIfWait3Years,
        multiplier,
        yearsInRetirement,
        pastInterestWindow: yearsSinceFedStart > 2
    };
}

// ── TSP Calculations ────────────────────────────────────────

/** TSP agency matching (5 USC 8432) */
function calcTSPMatching(employeeRate) {
    const auto = 1;
    let match = 0;
    if (employeeRate >= 5)      match = 4;
    else if (employeeRate >= 3) match = 3 + (employeeRate - 3) * 0.5;
    else                        match = employeeRate;
    return {
        autoPercent: auto,
        matchPercent: match,
        totalAgencyPercent: auto + match,
        employeePercent: employeeRate
    };
}

/** Get TSP contribution limit based on age
 *  Under 50: regular limit only
 *  50-59 or 64+: regular + standard catch-up
 *  60-63: regular + super catch-up (SECURE 2.0 §109) */
function getTSPLimit(age) {
    if (age >= 60 && age <= 63) return TSP_TOTAL_LIMIT_60_63;
    if (age >= 50) return TSP_TOTAL_LIMIT_50_PLUS;
    return TSP_LIMIT_2026;
}

/** Project TSP balance at retirement */
function calcTSPProjection(currentBalance, annualSalary, employeeRate, annualReturn,
                            yearsToRetirement, currentAge, salaryGrowth) {
    salaryGrowth = salaryGrowth || 0.025;
    if (yearsToRetirement <= 0) {
        return { projectedBalance: currentBalance || 0, totalEmployeeContributions: 0,
                 totalAgencyContributions: 0, totalGrowth: 0, yearByYear: [] };
    }

    let balance = currentBalance || 0;
    let salary = annualSalary || 0;
    let totalEmployee = 0;
    let totalAgency = 0;
    const yearByYear = [];
    const startBalance = balance;

    for (let y = 1; y <= yearsToRetirement; y++) {
        const age = (currentAge || 30) + y;
        const limit = getTSPLimit(age);

        let employeeContrib = salary * (employeeRate / 100);
        employeeContrib = Math.min(employeeContrib, limit);

        const matching = calcTSPMatching(employeeRate);
        const agencyContrib = salary * (matching.totalAgencyPercent / 100);

        const totalContrib = employeeContrib + agencyContrib;
        const growth = balance * annualReturn + totalContrib * (annualReturn / 2);

        balance += totalContrib + growth;
        totalEmployee += employeeContrib;
        totalAgency += agencyContrib;

        yearByYear.push({
            year: y, age, salary: Math.round(salary),
            employeeContrib: Math.round(employeeContrib),
            agencyContrib: Math.round(agencyContrib),
            growth: Math.round(growth),
            balance: Math.round(balance)
        });

        salary *= (1 + salaryGrowth);
    }

    return {
        projectedBalance: Math.round(balance),
        totalEmployeeContributions: Math.round(totalEmployee),
        totalAgencyContributions: Math.round(totalAgency),
        totalGrowth: Math.round(balance - startBalance - totalEmployee - totalAgency),
        yearByYear
    };
}

/** TSP monthly income in retirement (4% safe withdrawal rate) */
function calcTSPMonthlyIncome(balance, withdrawalRate) {
    withdrawalRate = withdrawalRate || 0.04;
    const annual = balance * withdrawalRate;
    return { monthly: Math.round(annual / 12), annual: Math.round(annual), withdrawalRate };
}

/** TSP contribution optimizer */
function calcTSPOptimizer(currentBalance, annualSalary, currentRate, annualReturn,
                           yearsToRetirement, currentAge) {
    const scenarios = [];
    const rates = [currentRate, currentRate + 1, currentRate + 2, currentRate + 3];

    const limit = getTSPLimit((currentAge || 30) + yearsToRetirement);
    const maxRate = Math.ceil(limit / annualSalary * 100);
    if (!rates.includes(maxRate) && maxRate > currentRate) rates.push(Math.min(maxRate, 100));
    if (currentRate < 5 && !rates.includes(5)) { rates.push(5); rates.sort((a, b) => a - b); }

    for (const rate of rates) {
        const proj = calcTSPProjection(currentBalance, annualSalary, rate, annualReturn,
                                        yearsToRetirement, currentAge);
        const income = calcTSPMonthlyIncome(proj.projectedBalance);
        const matching = calcTSPMatching(rate);
        scenarios.push({
            rate, projectedBalance: proj.projectedBalance, monthlyIncome: income.monthly,
            totalAgency: proj.totalAgencyContributions, agencyPercent: matching.totalAgencyPercent,
            isFullMatch: rate >= 5, isCurrent: rate === currentRate, additionalBalance: 0
        });
    }

    const currentBal = scenarios.find(s => s.isCurrent)?.projectedBalance || 0;
    for (const s of scenarios) s.additionalBalance = s.projectedBalance - currentBal;
    return scenarios;
}

// ── Traditional vs Roth TSP ─────────────────────────────────

function calcTraditionalVsRoth(projectedBalance, currentTaxRate, retirementTaxRate, traditionalPct) {
    traditionalPct = (traditionalPct != null) ? traditionalPct : 100;
    const tradBalance = projectedBalance * (traditionalPct / 100);
    const rothBalance = projectedBalance * ((100 - traditionalPct) / 100);

    const tradMonthly = Math.round((tradBalance * 0.04 * (1 - retirementTaxRate)) / 12);
    const rothMonthly = Math.round((rothBalance * 0.04) / 12);

    return {
        traditionalBalance: Math.round(tradBalance),
        rothBalance: Math.round(rothBalance),
        tradAfterTax: Math.round(tradBalance * (1 - retirementTaxRate)),
        rothAfterTax: Math.round(rothBalance),
        tradMonthly, rothMonthly,
        totalMonthly: tradMonthly + rothMonthly,
        effectiveTaxDrag: tradBalance > 0 ? Math.round(tradBalance * retirementTaxRate) : 0
    };
}

// ── VA Disability (simplified) ──────────────────────────────

const VA_BASIC_RATES_2026 = {
    0: 0, 10: 175, 20: 346, 30: 535, 40: 771, 50: 1097,
    60: 1389, 70: 1750, 80: 2035, 90: 2286, 100: 3806
};

function getVACompBasic(rating) { return VA_BASIC_RATES_2026[rating] || 0; }

// ── Social Security ─────────────────────────────────────────

function adjustSSForAge(monthlyAt67, claimAge) {
    if (!monthlyAt67) return 0;
    if (claimAge <= 62) return Math.round(monthlyAt67 * 0.70);
    if (claimAge <= 63) return Math.round(monthlyAt67 * 0.75);
    if (claimAge <= 64) return Math.round(monthlyAt67 * 0.80);
    if (claimAge <= 65) return Math.round(monthlyAt67 * 0.867);
    if (claimAge <= 66) return Math.round(monthlyAt67 * 0.933);
    if (claimAge <= 67) return Math.round(monthlyAt67);
    if (claimAge <= 68) return Math.round(monthlyAt67 * 1.08);
    if (claimAge <= 69) return Math.round(monthlyAt67 * 1.16);
    return Math.round(monthlyAt67 * 1.24);
}

// ── Combined Retirement Picture ─────────────────────────────

/** Calculate phase-based retirement income (pre-62 vs 62+)
 *  Income changes at 62: SRS drops off, SS kicks in, FERS COLA starts */
function calcCombinedRetirement(fersPension, tspMonthly, ssMonthly, vaMonthly,
                                 srsMonthly, milRetMonthly, retirementAge, ssClaimAge) {
    const targetAge = 87;
    const yearsInRetirement = Math.max(0, targetAge - retirementAge);
    ssClaimAge = ssClaimAge || 67;

    // Phase 1: retirement to 62 (SRS active, no SS, no FERS COLA)
    // Phase 2: 62+ (SRS stops, SS may start, FERS COLA begins)
    const phase1End = Math.min(62, targetAge);
    const phase1Years = Math.max(0, phase1End - retirementAge);
    const phase2Years = Math.max(0, targetAge - Math.max(retirementAge, 62));

    const fersMonthly = fersPension?.monthly || 0;
    const phase1Monthly = fersMonthly + (tspMonthly || 0) + (vaMonthly || 0) +
                           (srsMonthly || 0) + (milRetMonthly || 0);
    const ssAtClaim = retirementAge >= ssClaimAge ? (ssMonthly || 0) : 0;
    const phase2Monthly = fersMonthly + (tspMonthly || 0) + (vaMonthly || 0) +
                           (ssMonthly || 0) + (milRetMonthly || 0);

    // Lifetime projection
    let lifetimeFERS = 0, lifetimeTSP = 0, lifetimeSS = 0, lifetimeVA = 0;
    let lifetimeSRS = 0, lifetimeMilRet = 0;
    let fersAnnual = (fersPension?.annual || 0);
    const tspAnnual = (tspMonthly || 0) * 12;
    const ssAnnual = (ssMonthly || 0) * 12;
    let vaAnnual = (vaMonthly || 0) * 12;
    let milRetAnnual = (milRetMonthly || 0) * 12;
    const srsAnnual = (srsMonthly || 0) * 12;

    for (let y = 0; y < yearsInRetirement; y++) {
        const age = retirementAge + y;
        lifetimeFERS += fersAnnual;
        lifetimeTSP += tspAnnual;
        if (age >= ssClaimAge) lifetimeSS += ssAnnual;
        lifetimeVA += vaAnnual;
        if (age < 62 && srsAnnual > 0) lifetimeSRS += srsAnnual;
        lifetimeMilRet += milRetAnnual;

        // FERS COLA at 62+ only
        if (age >= 62) fersAnnual *= (1 + FERS_COLA_ESTIMATE);
        // VA + military pension get full COLA every year
        vaAnnual *= 1.025;
        milRetAnnual *= 1.025;
    }

    const lifetimeTotal = lifetimeFERS + lifetimeTSP + lifetimeSS + lifetimeVA + lifetimeSRS + lifetimeMilRet;

    return {
        phase1Monthly, phase2Monthly,
        phase1Years, phase2Years,
        lifetimeTotal: Math.round(lifetimeTotal),
        lifetimeFERS: Math.round(lifetimeFERS),
        lifetimeTSP: Math.round(lifetimeTSP),
        lifetimeSS: Math.round(lifetimeSS),
        lifetimeVA: Math.round(lifetimeVA),
        lifetimeSRS: Math.round(lifetimeSRS),
        lifetimeMilRet: Math.round(lifetimeMilRet),
        yearsInRetirement
    };
}

// ── FEHB in Retirement ──────────────────────────────────────

/** FEHB eligibility: 5 years continuous enrollment immediately before retirement
 *  Government pays ~72-75% of premium in retirement */
function checkFEHBEligibility(yearsEnrolled, hasDependents) {
    const selfOnlyValue = 7500;
    const familyValue = 18000;
    return {
        eligible: yearsEnrolled >= 5,
        yearsEnrolled,
        yearsNeeded: Math.max(0, 5 - yearsEnrolled),
        annualValue: hasDependents ? familyValue : selfOnlyValue
    };
}
