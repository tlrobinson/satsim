import { startUpdater } from "../satellites";

self.addEventListener("message", (event) => {
  if (event.data.type === "init") {
    startUpdater(
      event.data.sats,
      (positions) => {
        self.postMessage({
          type: "positions",
          positions: positions,
        });
      },
      event.data.options
    );
  }
});
