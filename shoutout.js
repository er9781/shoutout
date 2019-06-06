require("process");

const args = {};
for (el of process.argv.slice(2)) {
  if (el.startsWith("--")) {
    [name, num] = el.split("=");
    args[name.slice(2)] = (num && parseInt(num)) || true;
  } else {
    args.list = [...(args.list || []), el];
  }
}

const DEFAULT_FIRST = "toot";
const DEFAULT_SECOND = "clapping";

let {
  rows = 5,
  cols = 5,
  size,
  help = false,
  nocenter = false,
  list: [first = DEFAULT_FIRST, second = DEFAULT_SECOND, center = first] = [],
  ...flags
} = args;

const prn = x => {
  console.log(x);
  return x;
};

// default to size if passed
[rows, cols] = (size && [size, size]) || [rows, cols];

const centerBounds = tot => [Math.floor((tot - 1) / 2), Math.floor(tot / 2)];

const distToCenter = (idx, tot) => {
  return Math.min(...centerBounds(tot).map(bound => Math.abs(idx - bound)));
};

const isCenter = (r, c) => {
  const isMiddle = (idx, tot) => {
    let bounds = centerBounds(tot);
    return bounds[0] <= idx && idx <= bounds[1];
  };
  return !nocenter && isMiddle(r, rows) && isMiddle(c, cols);
};

const maxDist = (r, c) =>
  Math.max(distToCenter(r, rows), distToCenter(c, cols));

const saneMod = (x, n) => ((x % n) + n) % n;

// hold supported patterns => function returning the token at r,c.
const patterns = {
  diag: (r, c) =>
    (isCenter(r, c) && center) ||
    (second && (r + c) % 2 !== 0 && second) ||
    first,
  square: (r, c) =>
    (isCenter(r, c) && center) || (maxDist(r, c) % 2 !== 0 && second) || first,
  lines: (r, c) =>
    (isCenter(r, c) && center) || (r % 2 === 0 && second) || first,
  cols: (r, c) =>
    (isCenter(r, c) && center) || (c % 2 === 0 && second) || first,
  ttt: (r, c) =>
    (isCenter(r, c) && center) ||
    ((r % 2 === 1 || c % 2 === 1) && first) ||
    second,
  diag2: (r, c) =>
    (isCenter(r, c) && center) ||
    (Math.floor(saneMod(c - r, 4) / 2) === 0 && second) ||
    first
};

if (help) {
  console.log(
    [
      "Usage: ",
      ...[
        `Pass a pattern (one of ${Object.keys(patterns)
          .map(p => `--${p}`)
          .join(", ")})`,
        "Any non-flag options are considered tokens to output. In order: primary, alternate, center",
        `The default tokens are: primary(${DEFAULT_FIRST}), alternate(${DEFAULT_SECOND}), center(${DEFAULT_FIRST})`,
        "You may set the size with --size=[int], or with --rows and --cols for individual control",
        `Pass --nocenter to disable center for all patterns.`
      ].map(e => "  - " + e)
    ].join("\n")
  );
  process.exit();
}

const pattern =
  Object.keys(patterns).filter(e => Object.keys(flags).includes(e))[0] ||
  "square";

const lines = [];
for (r of Array(rows).keys()) {
  const out = [];
  for (c of Array(cols).keys()) {
    out.push(patterns[pattern](r, c));
  }
  lines.push(out);
}

process.stdout.write(
  lines.map(row => row.map(el => `:${el}:`).join(" ")).join("\n")
);
