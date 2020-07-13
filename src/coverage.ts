import { getSatellitePositions } from "./satellites";

import * as h3 from "h3-js";
import KDBush from "kdbush";
import * as geokdbush from "geokdbush";

import {
  DEFAULT_COVERAGE_RESOLUTION,
  DEFAULT_COVERAGE_ELEVATION,
} from "./constants";

// coverage radius

export function getSatelliteCoverageRadius(
  height = 550, // height of satellite
  elevation = DEFAULT_COVERAGE_ELEVATION // elevation from horizon
) {
  // http://www.phiphase.com/satellite_coverage.htm
  const phi = (90 + elevation) * (Math.PI / 180);
  const radiusEarth = 6372;

  // Math.sin(alpha) / radiusEarth = (Math.sin(phi) / (radiusEarth + height));
  // Math.sin(alpha) = (Math.sin(phi) / (radiusEarth + height)) * radiusEarth;
  const alpha = Math.asin(
    (Math.sin(phi) / (radiusEarth + height)) * radiusEarth
  );

  // theta + phi + alpha = Math.PI
  const theta = Math.PI - phi - alpha;

  // R = theta * radiusEarth
  return theta * radiusEarth;
}

// cells and cell indexes

export function getCellsForResolution(
  resolution = DEFAULT_COVERAGE_RESOLUTION
) {
  return h3
    .getRes0Indexes()
    .map((cell) => h3.h3ToChildren(cell, resolution))
    .flat();
}

function getCellIndexes({ cells, resolution = DEFAULT_COVERAGE_RESOLUTION }) {
  if (cells) {
    return getCellIndexesForCells(cells);
  } else {
    return getCellIndexesForResolution(resolution);
  }
}

function getCellIndexesForCells(cells) {
  const points = cells.map((cell) => {
    const [lat, lng] = h3.h3ToGeo(cell);
    return { cell, lat, lng };
  });
  const positionIndex = {};
  for (const point of points) {
    positionIndex[point.cell] = point;
  }
  const distanceIndex = new KDBush(
    points,
    (p) => p.lng,
    (p) => p.lat
  );
  return { cells, positionIndex, distanceIndex };
}

const indexesByResolution = {};
function getCellIndexesForResolution(resolution = DEFAULT_COVERAGE_RESOLUTION) {
  // memoized by resolution
  if (!indexesByResolution[resolution]) {
    const cells = getCellsForResolution(resolution);
    indexesByResolution[resolution] = getCellIndexesForCells(cells);
  }
  return indexesByResolution[resolution];
}

// coverage maps

export function makeCoverage(cells) {
  const coverage = {};
  for (const cell of cells) {
    coverage[cell] = 0;
  }
  return coverage;
}

export function computeCoverage({
  // "satellites" required
  satellites,
  // specify periods
  start = Date.now(),
  period = 1000 * 60, // 60 seconds
  periods = 60,
  // misc
  elevation = DEFAULT_COVERAGE_ELEVATION,
  // either "resolution" or "cells" is required
  resolution = DEFAULT_COVERAGE_RESOLUTION,
  cells = null,
  // optimizations
  indexes = getCellIndexes({ cells, resolution }),
  coverage = makeCoverage(indexes.cells),
}) {
  // console.time();
  for (let i = 0; i < periods; i++) {
    const date = new Date(start + period * i);
    const { satellitesByCell } = computeCoverageAtMoment({
      date,
      satellites,
      elevation,
      indexes,
    });
    for (const cell of Object.keys(satellitesByCell)) {
      coverage[cell]++;
    }
  }
  for (const cell of Object.keys(coverage)) {
    coverage[cell] /= periods;
  }
  // console.timeEnd();
  return coverage;
}

export const computeCoverageAtMoment = computeCoverageAtMomentKDBush;
//   const computeCoverageAtMoment = {
//   "#brute": computeCoverageAtDateBruteForce,
//   "#kdbush": computeCoverageAtMomentKDBush,
//   "#h3": computeCoverageAtDateH3KRing,
// }[window.location.hash];
// console.log(computeCoverageAtMoment.name);

function computeCoverageAtMomentKDBush({
  date = new Date(),
  // "positions" or "satellites" and "date" is required
  satellites = null,
  // misc
  elevation = DEFAULT_COVERAGE_ELEVATION,
  // either "resolution" or "cells" is required
  resolution = DEFAULT_COVERAGE_RESOLUTION,
  cells = null,
  // optimizations
  indexes = getCellIndexes({ cells, resolution }),
  positions = getSatellitePositions(satellites, date, { elevation }),
}) {
  const satellitesByCell = {};
  const cellsBySatellite = positions.map((position, index) => {
    const matches = geokdbush.around(
      indexes.distanceIndex,
      position.lng,
      position.lat,
      Infinity,
      position.coverageRadius
    );
    return matches.map(({ cell }) => {
      (satellitesByCell[cell] = satellitesByCell[cell] || []).push(index);
      return cell;
    });
  });
  return { satellitesByCell, cellsBySatellite };
}

// function computeCoverageAtDateBruteForce({
//   date = new Date(),
//   // "positions" or "satellites" and "date" is required
//   satellites = null,
//   // misc
//   elevation = DEFAULT_COVERAGE_ELEVATION,
//   // either "resolution" or "cells" is required
//   resolution = DEFAULT_COVERAGE_RESOLUTION,
//   cells = null,
//   // optimizations
//   indexes = getCellIndexes({ cells, resolution }),
//   coverage = makeCoverage(indexes.cells),
//   positions = getSatellitePositions(satellites, date, { elevation }),
// }) {
//   for (const [cell, cellPosition] of Object.entries(indexes.positionIndex)) {
//     for (const position of positions) {
//       if (arePointsNear(cellPosition, position, position.coverageRadius)) {
//         coverage[cell]++;
//         break;
//       }
//     }
//   }
// }

// function computeCoverageAtDateH3KRing({
//   date = new Date(),
//   // "positions" or "satellites" and "date" is required
//   satellites = null,
//   // misc
//   elevation = 40,
//   // either "resolution" or "cells" is required
//   resolution = DEFAULT_COVERAGE_RESOLUTION,
//   cells = null,
//   // optimizations
//   indexes = getCellIndexes({ cells, resolution }),
//   coverage = makeCoverage(indexes.cells),
//   positions = getSatellitePositions(satellites, date, { elevation }),
// }) {
//   const covered = {};
//   for (const position of positions) {
//     const checked = {};
//     const check = (cell, skipDistanceCheck = false) => {
//       if (checked[cell]) {
//         return;
//       }
//       checked[cell] = true;
//       if (
//         skipDistanceCheck ||
//         arePointsNear(
//           indexes.positionIndex[cell],
//           position,
//           position.coverageRadius
//         )
//       ) {
//         if (!covered[cell]) {
//           covered[cell] = true;
//           coverage[cell]++;
//         }
//         for (const neighbor of h3.kRing(cell, 1)) {
//           check(neighbor);
//         }
//       }
//     };
//     check(h3.geoToH3(position.lat, position.lng, 2), true);
//   }
// }
