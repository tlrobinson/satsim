import * as satellite from "satellite.js";
import { getSatelliteCoverageRadius } from "./coverage";
import { EARTH_RADIUS_KM, EARTH_MASS_KG, EARTH_RADIUS_M, G } from "./constants";

export function getSatellitePosition(
  sat,
  time = new Date(),
  { elevation = null } = {}
) {
  const positionAndVelocity = satellite.propagate(sat.satrec, time);
  if (!positionAndVelocity.position) {
    return;
  }
  const positionGd = satellite.eciToGeodetic(
    positionAndVelocity.position,
    satellite.gstime(time)
  );
  const lng = (positionGd.longitude * 180) / Math.PI;
  const lat = (positionGd.latitude * 180) / Math.PI;
  const height = positionGd.height;
  const coverageRadius =
    elevation != null ? getSatelliteCoverageRadius(height, elevation) : null;

  return { sat, lng, lat, height, coverageRadius };
}

export function getSatellitePositions(
  sats,
  time = new Date(),
  { elevation = null } = {}
) {
  return sats
    .map((sat) => getSatellitePosition(sat, time, { elevation }))
    .filter((x) => x);
}

export function orbitalPeriod(height) {
  // https://www.physicsclassroom.com/class/circles/Lesson-4/Mathematics-of-Satellite-Motion
  const R = EARTH_RADIUS_M + height * 1000;
  return Math.sqrt(
    ((4 * Math.pow(Math.PI, 2)) / (G * EARTH_MASS_KG)) * Math.pow(R, 3)
  );
}

export function meanMotionRadPerMinute(height) {
  const seconds = orbitalPeriod(height);
  return (2 * Math.PI) / (seconds / 60);
}
