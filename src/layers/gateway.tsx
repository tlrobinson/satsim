import * as THREE from "three";

import KDBush from "kdbush";
import * as geokdbush from "geokdbush";

import { Setting, SettingCheckbox } from "../components/settings";

let gateways = [];
fetch("/starlink_gateways.json")
  .then((res) => res.json())
  .then((g) => {
    gateways = g.map((gateway) => {
      const [lng, lat, height] = gateway.coordinates;
      return { ...gateway, position: { lat, lng, height } };
    });
  });

export function getGateways({ inactive }) {
  return gateways.filter((gateway) => gateway.active || inactive);
}

export function getGatewaysIndex(gateways) {
  return new KDBush(
    gateways,
    (g) => g.position.lng,
    (g) => g.position.lat
  );
}

export function getGatewaysAround(index, point, radius) {
  return geokdbush.around(index, point.lng, point.lat, Infinity, radius);
}

export default {
  key: "gateway",
  name: "Ground Stations",
  defaultConfig: {
    inactive: false,
  },
  objects({ satellites, config }) {
    return gateways
      .filter((gateway) => gateway.active || config.layers.gateway.inactive)
      .map((gateway) => ({ type: "gateway", gateway }));
  },
  create(globe, d) {
    return new THREE.Mesh(
      new THREE.SphereBufferGeometry(1),
      new THREE.MeshPhongMaterial({
        color: d.gateway.active ? "green" : "rgb(0,50,0)",
      })
    );
  },
  update(globe, d, obj) {
    const { gateway } = d;
    const { lng, lat } = gateway.position;
    Object.assign(obj.position, globe.getCoords(lat, lng, 0));
  },

  renderSettings({ checkboxConfig }) {
    return (
      <Setting title="Include Inactive">
        <SettingCheckbox
          {...checkboxConfig(["layers", "gateway", "inactive"])}
        />
      </Setting>
    );
  },
};
