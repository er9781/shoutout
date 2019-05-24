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

let {
  rows = 5,
  cols = 5,
  size,
  help = false,
  list: [first = "toot", second = "clapping", center = first],
  ...flags
} = args;

console.log(center);

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
  return isMiddle(r, rows) && isMiddle(c, cols);
};

const maxDist = (r, c) =>
  Math.max(distToCenter(r, rows), distToCenter(c, cols));

// hold supported patterns => function returning the token at r,c.
const patterns = {
  diag: (r, c) => {
    if (isCenter(r, c)) {
      return center;
    } else if (second && (r + c) % 2 !== 0) {
      return second;
    } else {
      return first;
    }
  },
  square: (r, c) => {
    if (isCenter(r, c)) {
      return center;
    } else if (maxDist(r, c) % 2 !== 0) {
      return second;
    } else {
      return first;
    }
  },
  lines: (r, c) =>
    (isCenter(r, c) && center) || (r % 2 === 0 && second) || first,
  cols: (r, c) => (isCenter(r, c) && center) || (c % 2 === 0 && second) || first
};

if (help) {
  console.log(["Usage: ", ...[""].map(e => "  -" + e)].join("\n"));
  process.exit();
}

const pattern =
  Object.keys(patterns).filter(e => Object.keys(flags).indexOf(e) !== -1)[0] ||
  "diag";

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
