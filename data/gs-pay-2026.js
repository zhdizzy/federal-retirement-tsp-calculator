/* ============================================================
   GS Pay Table 2026 (projected: 2025 base + 2.0% raise)
   Source: OPM General Schedule base pay, locality adjustments
   ============================================================ */

// Base pay by grade (1-15), each array = steps 1-10
const GS_BASE_PAY_2026 = {
    1:  [22501, 23264, 24024, 24781, 25541, 26022, 26759, 27501, 27528, 28232],
    2:  [25298, 25907, 26737, 27446, 27700, 28520, 29340, 30160, 30980, 31803],
    3:  [27597, 28517, 29437, 30357, 31277, 32197, 33117, 34037, 34957, 35877],
    4:  [30973, 32006, 33039, 34072, 35105, 36138, 37171, 38204, 39237, 40261],
    5:  [34648, 35803, 36958, 38113, 39268, 40423, 41578, 42733, 43888, 45039],
    6:  [38619, 39907, 41195, 42483, 43771, 45059, 46347, 47635, 48923, 50203],
    7:  [42861, 44290, 45719, 47148, 48577, 50006, 51435, 52864, 54293, 55723],
    8:  [47450, 49019, 50588, 52157, 53726, 55295, 56864, 58433, 60002, 61686],
    9:  [52359, 54104, 55849, 57594, 59339, 61084, 62829, 64574, 66319, 68063],
    10: [57659, 59581, 61503, 63425, 65347, 67269, 69191, 71113, 73035, 74953],
    11: [63349, 65461, 67573, 69685, 71797, 73909, 76021, 78133, 80243, 82352],
    12: [75930, 78461, 80992, 83523, 86054, 88585, 91116, 93647, 96178, 98710],
    13: [90290, 93300, 96310, 99320, 102330, 105340, 108350, 111360, 114370, 117381],
    14: [106696, 110253, 113810, 117367, 120924, 124481, 128038, 131595, 135152, 138703],
    15: [125502, 129686, 133870, 138054, 142238, 146422, 150606, 154790, 158974, 163146]
};

// Major locality pay areas with percentage above base
const LOCALITY_AREAS = {
    'RUS':     { name: 'Rest of U.S.',                     rate: 0.1757 },
    'DCB':     { name: 'Washington, DC / Baltimore',       rate: 0.3339 },
    'SF':      { name: 'San Francisco / San Jose',         rate: 0.4415 },
    'NY':      { name: 'New York City',                    rate: 0.3616 },
    'LA':      { name: 'Los Angeles / Long Beach',         rate: 0.3433 },
    'HOU':     { name: 'Houston',                          rate: 0.3390 },
    'CHI':     { name: 'Chicago',                          rate: 0.3022 },
    'SEA':     { name: 'Seattle / Tacoma',                 rate: 0.3110 },
    'BOS':     { name: 'Boston / Worcester',               rate: 0.3124 },
    'SD':      { name: 'San Diego / Carlsbad',             rate: 0.3063 },
    'DEN':     { name: 'Denver / Aurora',                  rate: 0.2931 },
    'PHI':     { name: 'Philadelphia / Camden',            rate: 0.2820 },
    'DAL':     { name: 'Dallas / Fort Worth',              rate: 0.2718 },
    'ATL':     { name: 'Atlanta / Sandy Springs',          rate: 0.2490 },
    'MIA':     { name: 'Miami / Fort Lauderdale',          rate: 0.2653 },
    'DET':     { name: 'Detroit / Warren',                 rate: 0.2835 },
    'MIN':     { name: 'Minneapolis / St. Paul',           rate: 0.2674 },
    'SAC':     { name: 'Sacramento / Roseville',           rate: 0.2947 },
    'PHX':     { name: 'Phoenix / Mesa',                   rate: 0.2264 },
    'STL':     { name: 'St. Louis / O\'Fallon',            rate: 0.2182 },
    'HI':      { name: 'Hawaii',                           rate: 0.2055 },
    'AK':      { name: 'Alaska',                           rate: 0.2742 },
    'SA':      { name: 'San Antonio / New Braunfels',      rate: 0.2170 },
    'RAL':     { name: 'Raleigh / Durham',                 rate: 0.2469 },
    'COL':     { name: 'Columbus, OH',                     rate: 0.2273 },
    'CSRA':    { name: 'Augusta / Richmond County',        rate: 0.1882 },
    'HAR':     { name: 'Hartford / West Hartford',         rate: 0.3059 },
    'IND':     { name: 'Indianapolis / Carmel',            rate: 0.2067 },
    'KC':      { name: 'Kansas City / Overland Park',      rate: 0.2108 },
    'PIT':     { name: 'Pittsburgh',                       rate: 0.2243 },
    'TB':      { name: 'Tampa / St. Petersburg',           rate: 0.2096 },
    'CIN':     { name: 'Cincinnati / Hamilton',            rate: 0.2375 },
    'RIC':     { name: 'Richmond, VA',                     rate: 0.2542 },
    'HUNT':    { name: 'Huntsville / Decatur, AL',         rate: 0.2393 },
    'HAMPTON': { name: 'Virginia Beach / Norfolk',         rate: 0.2542 }
};

// Average annual base pay by individual rank (mid-career estimate for that rank)
// Used for buyback cost estimation when veteran doesn't know exact total
const MILITARY_RANK_PAY = {
    'E-1':  { label: 'E-1',  avgAnnual: 24100 },
    'E-2':  { label: 'E-2',  avgAnnual: 27000 },
    'E-3':  { label: 'E-3',  avgAnnual: 28400 },
    'E-4':  { label: 'E-4',  avgAnnual: 31400 },
    'E-5':  { label: 'E-5',  avgAnnual: 36200 },
    'E-6':  { label: 'E-6',  avgAnnual: 41500 },
    'E-7':  { label: 'E-7',  avgAnnual: 48200 },
    'E-8':  { label: 'E-8',  avgAnnual: 56000 },
    'E-9':  { label: 'E-9',  avgAnnual: 63500 },
    'W-1':  { label: 'W-1',  avgAnnual: 44000 },
    'W-2':  { label: 'W-2',  avgAnnual: 52500 },
    'W-3':  { label: 'W-3',  avgAnnual: 60000 },
    'W-4':  { label: 'W-4',  avgAnnual: 68000 },
    'W-5':  { label: 'W-5',  avgAnnual: 76000 },
    'O-1':  { label: 'O-1',  avgAnnual: 44500 },
    'O-2':  { label: 'O-2',  avgAnnual: 54000 },
    'O-3':  { label: 'O-3',  avgAnnual: 66000 },
    'O-4':  { label: 'O-4',  avgAnnual: 80000 },
    'O-5':  { label: 'O-5',  avgAnnual: 95000 },
    'O-6':  { label: 'O-6',  avgAnnual: 112000 }
};

/** Get GS base pay for a grade (1-15) and step (1-10) */
function getGSBasePay(grade, step) {
    const g = GS_BASE_PAY_2026[grade];
    if (!g) return null;
    return g[(step || 1) - 1] || null;
}

/** Get locality-adjusted annual salary */
function getLocalityPay(grade, step, localityCode) {
    const base = getGSBasePay(grade, step);
    if (!base) return null;
    const loc = LOCALITY_AREAS[localityCode] || LOCALITY_AREAS['RUS'];
    return Math.round(base * (1 + loc.rate));
}

/** Estimate High-3 average salary (highest 3 consecutive years)
 *  Projects current salary backward/forward with ~2.5% annual increase */
function estimateFederalHigh3(currentSalary, yearsToRetirement) {
    if (!currentSalary || yearsToRetirement < 0) return currentSalary || 0;
    const annualGrowth = 0.025; // average step + GS raise
    if (yearsToRetirement <= 0) {
        // Already at retirement — high-3 is average of last 3 years
        const y1 = currentSalary;
        const y2 = currentSalary / (1 + annualGrowth);
        const y3 = y2 / (1 + annualGrowth);
        return Math.round((y1 + y2 + y3) / 3);
    }
    // Project salary at retirement, then average 3 final years
    const salaryAtRetirement = currentSalary * Math.pow(1 + annualGrowth, yearsToRetirement);
    const y1 = salaryAtRetirement;
    const y2 = y1 / (1 + annualGrowth);
    const y3 = y2 / (1 + annualGrowth);
    return Math.round((y1 + y2 + y3) / 3);
}

/** Estimate total military base pay from a list of rank+years entries
 *  @param entries - Array of { rank: 'E-5', years: 4 } */
function estimateMilitaryPayFromRanks(entries) {
    let total = 0;
    for (const entry of entries) {
        const rankData = MILITARY_RANK_PAY[entry.rank];
        if (rankData && entry.years > 0) {
            total += rankData.avgAnnual * entry.years;
        }
    }
    return total;
}
