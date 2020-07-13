import { orbitalPeriod, meanMotionRadPerMinute } from "../src/satellites";

const SECONDS_PER_DAY = 60 * 60 * 24;
describe("satellites", () => {
  // it("orbitalPeriod", () => {
  //   expect(SECONDS_PER_DAY / orbitalPeriod(550)).toBeCloseTo(15.72125391);
  // });
  it("meanMotionRadPerMinute", () => {
    expect(meanMotionRadPerMinute(550)).toBeCloseTo(0.06858914148, 2);
  });
});
