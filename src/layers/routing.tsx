import React from "react";
import {
  Setting,
  SettingCheckbox,
  SettingNumber,
} from "../components/settings";

import * as THREE from "three";

import { EARTH_RADIUS_KM } from "../constants";

export const DEFAULT_ROUTING_CONFIG = {
  use_laser_links: true,
  use_gateways: true,
  // new york
  pointA: {
    lat: 40.7128,
    lng: -74.006,
  },
  // london
  // pointB: {
  //   lat: 51.5074,
  //   lng: -0.1278,
  // },
  // san francisco
  pointB: {
    lat: 37.7749,
    lng: -122.4194,
  },
};

export default {
  key: "routing",
  name: "Routes",
  defaultConfig: DEFAULT_ROUTING_CONFIG,
  objects({ satellites, config }) {
    const pointA = config.layers.routing.pointA;
    const pointB = config.layers.routing.pointB;
    const path = [
      { ...pointA, height: 0 },
      { ...pointA, height: 550 },
      { ...pointB, height: 550 },
      { ...pointB, height: 0 },
    ];
    return [
      { type: "routing", sub_type: "pointA" },
      { type: "routing", sub_type: "pointB" },
      { type: "routing", sub_type: "path", path },
    ];
  },
  create(globe, d, globeRadius) {
    if (d.sub_type === "pointA" || d.sub_type === "pointB") {
      return new THREE.Mesh(
        new THREE.SphereBufferGeometry(1),
        new THREE.MeshPhongMaterial({ color: "blue" })
      );
    } else if (d.sub_type === "path") {
      return new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: "blue" })
      );
    }
  },
  update(globe, d, obj) {
    if (d.sub_type === "pointA" || d.sub_type === "pointB") {
      const point = globe.config.layers.routing[d.sub_type];
      Object.assign(obj.position, globe.getCoords(point.lat, point.lng, 0));
    } else if (d.sub_type === "path") {
      const pathPositions = globe.route ? globe.route.positions : [];
      const positions = new Float32Array(pathPositions.length * 3);

      let index = 0;
      for (const position of pathPositions) {
        const { x, y, z } = globe.getCoords(
          position.lat,
          position.lng,
          (position.height || 0) / EARTH_RADIUS_KM
        );
        positions[index++] = x;
        positions[index++] = y;
        positions[index++] = z;
      }

      obj.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
    }
  },

  renderSettings({ config, checkboxConfig, inputConfig }) {
    return (
      <div>
        {config.satellitesType === "generated" && (
          <Setting title="Laser Links">
            <SettingCheckbox
              {...checkboxConfig(["layers", "routing", "use_laser_links"])}
            />
          </Setting>
        )}
        <Setting title="Ground Stations">
          <SettingCheckbox
            {...checkboxConfig(["layers", "routing", "use_gateways"])}
          />
        </Setting>
        <Setting title="Start">
          <SettingLatLng
            direction="lat"
            {...inputConfig(["layers", "routing", "pointA", "lat"])}
          />
          <SettingLatLng
            direction="lng"
            {...inputConfig(["layers", "routing", "pointA", "lng"])}
          />
        </Setting>
        <Setting title="End">
          <SettingLatLng
            direction="lat"
            {...inputConfig(["layers", "routing", "pointB", "lat"])}
          />
          <SettingLatLng
            direction="lng"
            {...inputConfig(["layers", "routing", "pointB", "lng"])}
          />
        </Setting>
      </div>
    );
  },
};

function SettingLatLng({ direction, ...props }) {
  return (
    <span>
      <SettingNumber style={{ maxWidth: 100 }} className="ml-1" {...props} />
      <span className="ml-1 mr-1">
        °
        {direction === "lat"
          ? props.value < 0
            ? "S"
            : "N"
          : props.value < 0
          ? "W"
          : "E"}
      </span>
    </span>
  );
}
