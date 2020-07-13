import * as THREE from "three";

import * as _ from "lodash";

import { EARTH_RADIUS_KM } from "../constants";
import { getSatelliteCoverageRadius } from "../coverage";
import { getGatewaysAround } from "./gateway";

const objectForSatelliteIndex = _.memoize((index) => ({
  type: "coverage",
  satelliteIndex: index,
}));

function computeRadius(globe, d) {
  return (
    (getSatelliteCoverageRadius(d.position.alt, globe.config.elevation) /
      EARTH_RADIUS_KM) *
    globe.radius
  );
}

function makeCircle(radius, segments = 32) {
  const vertices = new Float32Array((segments + 1) * 3);
  const angle = (2 * Math.PI) / segments;
  for (let i = 0; i < segments + 1; i++) {
    vertices[i * 3] = radius * Math.sin(i * angle);
    vertices[i * 3 + 1] = radius * Math.cos(i * angle);
    vertices[i * 3 + 2] = 0;
  }
  return vertices;
}

function makeRing(globe, radius) {
  // const mesh = new THREE.Mesh(
  //   new THREE.RingGeometry(radius - globe.radius / 400, radius, 32),
  //   new THREE.MeshBasicMaterial({
  //     color: "rgb(0,100,0)",
  //     side: THREE.DoubleSide,
  //   })
  // );
  // mesh._radius = radius;
  // return mesh;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(makeCircle(radius), 3)
  );
  const material = new THREE.LineBasicMaterial({ color: "blue" });
  const line = new THREE.Line(geometry, material);
  line._radius = radius;
  return line;
}

export default {
  name: "Coverage (Instantaneous)",
  defaultConfig: {},
  objects({ satellites }) {
    return satellites.map((satellite, index) => objectForSatelliteIndex(index));
  },
  create(globe, d) {
    if (!d.position) {
      return;
    }
    const radius = computeRadius(globe, d);
    return makeRing(globe, radius);
  },
  update(globe, d, obj) {
    if (!d.position) {
      return;
    }
    const radius = computeRadius(globe, d);
    if (obj._radius !== radius) {
      obj.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(makeCircle(radius), 3)
      );
      obj._radius = radius;
    }
    Object.assign(
      obj.position,
      globe.getCoords(d.position.lat, d.position.lng, 0)
    );

    const nearGateway =
      getGatewaysAround(
        globe.gatewaysIndex,
        d.position,
        d.position.coverageRadius
      ).length > 0;
    obj.material.color.set(
      nearGateway || !globe.config.layers.gateway.enabled
        ? "green"
        : "rgb(100,100,0)"
    );

    const globeCenter = globe.scene().localToWorld(new THREE.Vector3(0, 0, 0));
    obj.lookAt(globeCenter);
  },

  renderSettings() {
    return null;
  },
};
