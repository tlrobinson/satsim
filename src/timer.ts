const getValue = (v) => (typeof v === "function" ? v() : v);

export function startTimer(
  callback,
  { start = Date.now(), multiplier = 1, interval = 15 } = {}
) {
  start = typeof start === "number" ? start : start.getTime();
  let current = start;
  let time = start;
  function update() {
    const now = Date.now();
    const elapsed = now - current;
    time += elapsed * getValue(multiplier);
    current = now;
    callback(new Date(time));
  }

  update();
  const timer = setInterval(update, interval);

  return () => clearInterval(timer);
}
