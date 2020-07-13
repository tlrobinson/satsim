import React from "react";

import {
  Setting,
  SettingCheckbox,
  SettingNumber,
} from "../components/settings";

import * as THREE from "three";

import { EARTH_RADIUS_KM } from "../constants";

import * as _ from "lodash";

export const DEFAULT_LASER_CONFIG = {
  link_forward: true,
  link_side: true,
  link_side_offset: 0,
};

const getPlanesIndex = _.memoize((satellites) => {
  const planes = [];
  for (let i = 0; i < satellites.length - 1; i++) {
    const sat = satellites[i];
    (planes[sat.plane] = planes[sat.plane] || [])[sat.index] = i;
  }
  return planes;
});

function neighborSatelliteIndex(
  satellites,
  satellite,
  satOffset = 0,
  planeOffset = 0
) {
  const planes = getPlanesIndex(satellites);
  const plane = planes[(satellite.plane + planeOffset) % planes.length];
  const nextIndex = plane[(satellite.index + satOffset) % plane.length];
  return nextIndex;
}

function laserLinksForSatellite(
  satellite,
  index,
  satellites,
  {
    link_forward = DEFAULT_LASER_CONFIG.link_forward,
    link_side = DEFAULT_LASER_CONFIG.link_side,
    link_side_offset = DEFAULT_LASER_CONFIG.link_side_offset,
  } = {}
) {
  let indexes = [];
  if (satellite.plane != null) {
    indexes = [];
    if (link_forward) {
      // NOTE: doesn't make sense to allow configuring of offset for links in same orbital plane
      indexes.push(neighborSatelliteIndex(satellites, satellite, 1, 0));
    }
    if (link_side) {
      const offset = link_side_offset;
      indexes.push(neighborSatelliteIndex(satellites, satellite, offset, 1));
    }
  }
  return indexes.map((other) => [index, other]);
}

export function laserLinksForSatellites(satellites, laserConfig = {}) {
  return satellites
    .map((sat, index) =>
      laserLinksForSatellite(sat, index, satellites, laserConfig)
    )
    .flat();
}

export default {
  key: "laser",
  name: "Laser Links",
  defaultConfig: DEFAULT_LASER_CONFIG,
  objects({ laserLinks }) {
    return laserLinks.map((satelliteIndexes) => ({
      type: "laser",
      satelliteIndexes: satelliteIndexes,
    }));
  },
  create(globe, d, globeRadius) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(2 * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    return new THREE.Line(geometry, material);
  },
  update(globe, d, obj) {
    var array = obj.geometry.attributes.position.array;
    let index = 0;
    for (const position of d.positions || []) {
      if (!position) {
        return;
      }
      const { x, y, z } = globe.getCoords(
        position.lat,
        position.lng,
        position.height / EARTH_RADIUS_KM
      );
      array[index++] = x;
      array[index++] = y;
      array[index++] = z;
    }
    obj.geometry.attributes.position.needsUpdate = true;
  },

  // settings
  canEnable(config) {
    return config.satellitesType === "generated";
  },
  renderSettings({ getConfig, checkboxConfig, inputConfig }) {
    return (
      <div>
        <Setting title="Forward Links">
          <SettingCheckbox
            {...checkboxConfig(["layers", "laser", "link_forward"])}
          />
        </Setting>
        <Setting title="Side Links">
          <SettingCheckbox
            {...checkboxConfig(["layers", "laser", "link_side"])}
          />
        </Setting>
        {getConfig(["layers", "laser", "link_side"]) && (
          <Setting title="Side Link Offset">
            <SettingNumber
              min={-5}
              max={5}
              {...inputConfig(["layers", "laser", "link_side_offset"])}
            />
          </Setting>
        )}
      </div>
    );
  },
};
