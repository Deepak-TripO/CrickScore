import { processInningsDeliveries, DeliveryInput, formatOvers, calculateCRR, calculateRRR } from './engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('--- RUNNING BATSCORE SCORING ENGINE TESTS ---');

// Test 1: Format Overs
assert(formatOvers(0) === '0.0', '0 balls = 0.0');
assert(formatOvers(5) === '0.5', '5 balls = 0.5');
assert(formatOvers(6) === '1.0', '6 balls = 1.0');
assert(formatOvers(17) === '2.5', '17 balls = 2.5');
console.log('✓ Test 1: formatOvers passed');

// Test 2: CRR & RRR
assert(calculateCRR(30, 18) === 10.0, '30 runs in 3 overs = 10.0 CRR');
assert(calculateRRR(100, 40, 30, 20) === 4.0, '60 needed in 15 overs (90 balls) = 4.0 RRR');
console.log('✓ Test 2: CRR and RRR passed');

// Test 3: Standard 1-over delivery sequence & Strike Rotation
const deliveriesOver1: DeliveryInput[] = [
  { overNumber: 0, ballNumber: 1, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'bw1', runsBatter: 1, runsExtras: 0, extraType: 'NONE', wicket: false },
  { overNumber: 0, ballNumber: 2, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bw1', runsBatter: 4, runsExtras: 0, extraType: 'NONE', wicket: false },
  { overNumber: 0, ballNumber: 3, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bw1', runsBatter: 0, runsExtras: 0, extraType: 'NONE', wicket: false },
  { overNumber: 0, ballNumber: 4, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bw1', runsBatter: 6, runsExtras: 0, extraType: 'NONE', wicket: false },
  { overNumber: 0, ballNumber: 5, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bw1', runsBatter: 2, runsExtras: 0, extraType: 'NONE', wicket: false },
  { overNumber: 0, ballNumber: 6, strikerId: 'b2', nonStrikerId: 'b1', bowlerId: 'bw1', runsBatter: 3, runsExtras: 0, extraType: 'NONE', wicket: false }
];

const state1 = processInningsDeliveries(deliveriesOver1, 'b1', 'b2', 'bw1', 20);
assert(state1.totalRuns === 16, 'Total runs should be 16');
assert(state1.legalBalls === 6, 'Legal balls should be 6');
assert(state1.oversFormatted === '1.0', 'Overs should be 1.0');
assert(state1.batters['b1'].runs === 1, 'b1 should have 1 run');
assert(state1.batters['b2'].runs === 15, 'b2 should have 15 runs (4+0+6+2+3)');
assert(state1.bowlers['bw1'].runsConceded === 16, 'Bowler conceded 16');
// Over end swap + odd run swap: ball 6 was 3 runs (b2 -> b1 swap), over end (b1 -> b2 swap) => striker is b2
assert(state1.strikerId === 'b2', 'Striker at start of over 2 should be b2');
console.log('✓ Test 3: Standard over scoring & strike rotation passed');

// Test 4: Extras (Wide & No Ball)
const deliveriesExtras: DeliveryInput[] = [
  { overNumber: 0, ballNumber: 1, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'bw1', runsBatter: 0, runsExtras: 0, extraType: 'WIDE', wicket: false },
  { overNumber: 0, ballNumber: 1, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'bw1', runsBatter: 2, runsExtras: 0, extraType: 'NO_BALL', wicket: false }
];

const stateExtras = processInningsDeliveries(deliveriesExtras, 'b1', 'b2', 'bw1', 20);
assert(stateExtras.totalRuns === 4, '1 for wide + (1 no-ball + 2 runs off bat) = 4');
assert(stateExtras.legalBalls === 0, 'Wide and No-ball do not count as legal balls');
assert(stateExtras.extras.wides === 1, 'Wides extras = 1');
assert(stateExtras.extras.noBalls === 1, 'No ball extras = 1');
assert(stateExtras.batters['b1'].runs === 2, 'b1 scored 2 off no-ball');
console.log('✓ Test 4: Extras calculation passed');

// Test 5: Wickets & Bowler credit
const deliveriesWicket: DeliveryInput[] = [
  { overNumber: 0, ballNumber: 1, strikerId: 'b1', nonStrikerId: 'b2', bowlerId: 'bw1', runsBatter: 0, runsExtras: 0, extraType: 'NONE', wicket: true, wicketType: 'Bowled', dismissedPlayerId: 'b1' }
];
const stateWicket = processInningsDeliveries(deliveriesWicket, 'b1', 'b2', 'bw1', 20);
assert(stateWicket.totalWickets === 1, 'Total wickets = 1');
assert(stateWicket.batters['b1'].isOut === true, 'b1 is out');
assert(stateWicket.bowlers['bw1'].wickets === 1, 'Bowler credited with wicket');
console.log('✓ Test 5: Wicket processing passed');

// Test 6: Undo last ball simulation
const fullDeliveries = [...deliveriesOver1, ...deliveriesExtras];
const fullState = processInningsDeliveries(fullDeliveries, 'b1', 'b2', 'bw1', 20);
const undoneDeliveries = fullDeliveries.slice(0, fullDeliveries.length - 1);
const undoneState = processInningsDeliveries(undoneDeliveries, 'b1', 'b2', 'bw1', 20);

assert(fullState.totalRuns === 20, 'Full sequence total runs = 20');
assert(undoneState.totalRuns === 17, 'Undone sequence total runs = 17');
console.log('✓ Test 6: Undo last ball state reconstruction passed');

console.log('=== ALL BATSCORE SCORING ENGINE TESTS PASSED! ===');
