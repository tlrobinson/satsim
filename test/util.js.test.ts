import { greatCircleDistance, euclideanDistance } from "../src/util";

// new york
const p1 = {
  lat: 40.7128,
  lng: -74.006,
};
// londons
const p2 = {
  lat: 51.5074,
  lng: -0.1278,
};

describe("util.js", () => {
  describe("greatCircleDistance", () => {
    it("should be correct", () => {
      expect(greatCircleDistance(p1, p2)).toBe(5570.222179737958); // 5566 km
    });
  });
  describe("euclideanDistance", () => {
    it("should be correct at sea level", () => {
      expect(euclideanDistance(p1, p2)).toBe(1);
    });
    it("should be correct at 550 km altitude", () => {
      expect(
        euclideanDistance({ ...p1, height: 550 }, { ...p2, height: 550 })
      ).toBe(1);
    });
  });
});
