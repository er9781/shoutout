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
  square = false,
  size,
  list: [first = "toot", second = "clapping", center]
} = args;

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

const getToken = (r, c) => {
  if (isCenter(r, c)) {
    return center || first;
  } else if (
    (square && maxDist(r, c) % 2 !== 0) ||
    (!square && second && (r + c) % 2 !== 0)
  ) {
    return second;
  } else {
    return first;
  }
};

const lines = [];
for (r of Array(rows).keys()) {
  const out = [];
  for (c of Array(cols).keys()) {
    out.push(getToken(r, c));
  }
  lines.push(out);
}

process.stdout.write(
  lines.map(row => row.map(el => `:${el}:`).join(" ")).join("\n")
);
