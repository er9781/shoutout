require('process');
const _ = require('lodash');
const assert = require('assert');

const args = {};
for (el of process.argv.slice(2)) {
  if (el.startsWith('--')) {
    [name, num] = el.split('=');
    args[name.slice(2)] = (num && parseInt(num)) || true;
  } else {
    args.list = [...(args.list || []), el];
  }
}

const DEFAULT_FIRST = 'toot';
const DEFAULT_SECOND = 'clapping';

let {
  rows = 5,
  cols = 5,
  size,
  help = false,
  nocenter = false,
  list = [],
  ...flags
} = args;

// default to size if passed
const [totRows, totCols] = (size && [size, size]) || [rows, cols];

// print & return
const prn = x => console.log(x) || x;

const partition = (arr, size) => arr.reduce((acc, el) => {
  if (acc.length === 0 || acc[acc.length - 1].length === size) {
    acc.push([el]);
  } else {
    acc[acc.length - 1].push(el);
  }
  return acc;
}, []);

const centerBounds = tot => [Math.floor((tot - 1) / 2), Math.floor(tot / 2)];

const distToCenter = (idx, tot) => {
  return Math.min(...centerBounds(tot).map(bound => Math.abs(idx - bound)));
};

const genIsCenter = (noCenter, rows, cols) => (r, c) => {
  const isMiddle = (idx, tot) => {
    let bounds = centerBounds(tot);
    return bounds[0] <= idx && idx <= bounds[1];
  };
  return !noCenter && isMiddle(r, rows) && isMiddle(c, cols);
};

const genMaxDist = (rows, cols) => (r, c) =>
    Math.max(distToCenter(r, rows), distToCenter(c, cols));

const saneMod = (x, n) => ((x % n) + n) % n;

// hold supported patterns => function returning the token at r,c.
// can parametrize what is considered first/second/center
const patterns = ({
  first = DEFAULT_FIRST,
  second = DEFAULT_SECOND,
  center = first,
  noCenter = false,
  rows = totRows,
  cols = totCols
} = {}) => {
  assert(
      first && second && center,
      'parametrized vals must be truthy to allow for boolean logic');
  const isCenter = genIsCenter(noCenter, rows, cols);
  const maxDist = genMaxDist(rows, cols);
  const ctr = f => (r, c) => (isCenter(r, c) && center) || f(r, c)
  return {
    diag: ctr((r, c) => ((r + c) % 2 !== 0 && second) || first),
    square: ctr((r, c) => (maxDist(r, c) % 2 !== 0 && second) || first),
    lines: ctr((r, c) => (r % 2 === 0 && second) || first),
    columns: ctr((r, c) => (c % 2 === 0 && second) || first),
    ttt: ctr((r, c) => ((r % 2 === 1 || c % 2 === 1) && first) || second),
    diag2: ctr(
        (r, c) => (Math.floor(saneMod(c - r, 4) / 2) === 0 && second) || first)
  };
};

const MACRO_SIZE = 2;

if (help) {
  console.log([
    'Usage: ',
    ...[`Pass a pattern (one of ${
            Object.keys(patterns()).map(p => `--${p}`).join(', ')})`,
        'Any non-flag options are considered tokens to output. In order: primary, alternate, center',
        `The default tokens are: primary(${DEFAULT_FIRST}), alternate(${
            DEFAULT_SECOND}), center(${DEFAULT_FIRST})`,
        'You may set the size with --size=[int], or with --rows and --cols for individual control',
        `Pass --nocenter to disable center for all patterns.`,
        `You may also pass a macro pattern. Macro patterns define blocks of size ${
            MACRO_SIZE} which alternate 
        between patterns you've passed. Macro patterns are the same as the primary patterns but prepeded with "macro".
        So you could pass --macrosquare --lines --columns which would alternate in blocks of 2x2 between lines and 
        columns patterns. The actual tokens used will be assumed to be passed in order for the patterns. So if
        you pass "t1 t2 t3 t4" with --nocenter, then t1 and t2 will be for --lines and t3, t4 will be for --columns.`]
        .map(e => '  - ' + e)
  ].join('\n'));
  process.exit();
}

// TODO validate flags to only patterns by here.
let {passedPatterns = ['square'], macroPatterns = []} = _.groupBy(
    Object.keys(flags),
    f => (f.startsWith('macro') ? 'macroPatterns' : 'passedPatterns'));
// repeat passedPatterns to fill second if only 1 passed :D, then drop the rest
// since only 2 supported
passedPatterns = [...passedPatterns, ...passedPatterns].slice(0, 2);
macroPatterns = macroPatterns.map(el => el.slice('macro'.length));

const macro = macroPatterns[0] || 'square';
const macroFinders = patterns({
  first: passedPatterns[0],
  second: passedPatterns[1],
  noCenter: true,
  rows: Math.floor(totRows / MACRO_SIZE),
  cols: Math.floor(totCols / MACRO_SIZE)
});

// Create a tokenFinder which is parametrized per pattern differently. A bit
// hacky.
const parts = partition(list, nocenter ? 2 : 3);
const tokenFinders = _.fromPairs(passedPatterns.map((passedPattern, idx) => {
  const [first = DEFAULT_FIRST, second = DEFAULT_SECOND, center = first] =
      parts[idx] || [];
  return [
    passedPattern,
    patterns({first, second, center, noCenter: nocenter})[passedPattern]
  ];
}));

const lines = [];
for (r of Array(totRows).keys()) {
  const out = [];
  for (c of Array(totCols).keys()) {
    const pattern = macroFinders[macro](
        // project coords onto macro sized patterns
        Math.floor(r / MACRO_SIZE), Math.floor(c / MACRO_SIZE));
    out.push(tokenFinders[pattern](r, c));
  }
  lines.push(out);
}

process.stdout.write(
    lines.map(row => row.map(el => `:${el}:`).join(' ')).join('\n'));
