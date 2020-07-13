import { computeShortestPath, findShortestPath } from "../src/routing";

import { DEFAULT_ROUTING_CONFIG } from "../src/layers/routing";

import { generateStarlink } from "../src/starlink";
import { getSatellitePositions } from "../src/satellites";
import { computeCoverageAtMoment } from "../src/coverage";

import { laserLinksForSatellites } from "../src/layers/laser";

describe("routing", () => {
  describe("findShortestPath", () => {
    it("should compute shortest path for simple case", () => {
      expect(
        findShortestPath(
          { a: ["b"], b: ["c", "d"], c: ["d"], d: [] },
          "a",
          "d",
          () => 1
        )
      ).toEqual({
        distance: 2,
        path: ["b", "d"],
      });
    });
  });

  describe("computeShortestPath", () => {
    it.only("should work", () => {
      const { pointA, pointB } = DEFAULT_ROUTING_CONFIG;
      const date = new Date(2020, 6);
      const satellites = generateStarlink();
      const positions = getSatellitePositions(satellites, date);
      const links = laserLinksForSatellites(satellites);
      const { satellitesByCell } = computeCoverageAtMoment({
        date,
        satellites,
      });
      const { distance, path } = computeShortestPath(
        pointA,
        pointB,
        positions,
        links,
        satellitesByCell
      );
      // expect(distance).toEqual(6207.707837701036);
      expect(path).toEqual([
        "start",
        "1235",
        "1236",
        "1237",
        "1238",
        "1239",
        "1279",
        "1319",
        "end",
      ]);
    });
  });
});
