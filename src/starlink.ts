import axios from "axios";
import * as satellite from "satellite.js";
import * as _ from "lodash";

import { meanMotionRadPerMinute } from "./satellites";

const prototypeSatRec = satellite.twoline2satrec(
  `1 00001U 19029BR  20182.59692852  .00001103  00000-0  33518-4 0  9990`,
  `2 00001 53.00000   0.7036 0003481 299.7327   0.3331 15.05527065  1773`
);

export function generateStarlink(shells) {
  return shells
    .map((shell, index) => generateStarlinkShell(shell, index))
    .flat();
}

function generateStarlinkShell(
  {
    orbitalPlanes = 40,
    satellitesPerOrbitalPlane = 40,
    inclination = 53,
    altitude = 550,
  } = {},
  shell
) {
  const orbitalPlanespacing = (Math.PI * 2) / orbitalPlanes;
  const satelliteSpacing = (Math.PI * 2) / satellitesPerOrbitalPlane;
  const meanMotion = meanMotionRadPerMinute(altitude);

  const satellites = [];
  for (let plane = 0; plane < orbitalPlanes; plane++) {
    for (let sat = 0; sat < satellitesPerOrbitalPlane; sat++) {
      const satnum = plane * 1000 + sat;

      const satrec = {
        ...prototypeSatRec,
        satnum: satnum,
        inclo: inclination * (Math.PI / 180),
        nodeo: orbitalPlanespacing * plane,
        ecco: 0.000542,
        argpo: 5.156060402887908,
        mo: satelliteSpacing * sat,
        no: meanMotion,
      };

      satellites.push({
        name: "satellite" + satnum,
        shell: shell,
        plane: plane,
        index: sat,
        satrec: satrec,
      });
    }
  }

  return satellites;
}

export const loadStarlink = _.memoize(async function loadStarlink() {
  const starlink = await axios.get("/api/starlink");
  const lines = starlink.data.split("\n");
  const satellites = [];
  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i];
    const tle = [lines[i + 1], lines[i + 2]];
    if (name && tle[0] && tle[1]) {
      const satrec = satellite.twoline2satrec(...tle);
      satellites.push({ name, tle, satrec });
    }
  }
  return satellites;
});
