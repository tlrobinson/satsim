import * as THREE from "three";

import * as _ from "lodash";

import { EARTH_RADIUS_KM } from "../constants";

const objectForSatelliteIndex = _.memoize((index) => ({
  type: "satellite",
  satelliteIndex: index,
}));

export default {
  key: "satellite",
  name: "Satellites",
  defaultConfig: {
    enabled: true,
  },
  objects({ satellites }) {
    return satellites.map((satellite, index) => objectForSatelliteIndex(index));
  },
  create(globe, d) {
    return new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.25),
      new THREE.MeshBasicMaterial({ color: "grey" })
    );
  },
  update(globe, d, obj) {
    if (!d.position) {
      return;
    }
    let height = d.position.height / EARTH_RADIUS_KM;
    Object.assign(
      obj.position,
      globe.getCoords(d.position.lat, d.position.lng, height)
    );
  },
};
