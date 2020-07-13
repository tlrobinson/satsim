import * as THREE from "three";

import chroma from "chroma-js";
import * as h3 from "h3-js";
import * as _ from "lodash";

import { Setting, SettingNumber } from "../components/settings";

const getCoverageObject = _.memoize((cell) => ({
  type: "coverage",
  cell: cell,
}));

export default {
  name: "Coverage (Average)",
  defaultConfig: {
    enabled: false,
    resolution: 2,
  },
  objects({ cells }) {
    return cells.map((cell) => getCoverageObject(cell));
  },
  create(globe, d, globeRadius) {
    const color = cellColor(globe, d.cell);
    const center = cellCenter(globe, d.cell);
    const corners = cellCorners(globe, d.cell);

    if (false) {
      const geometry = new THREE.BufferGeometry().setFromPoints(corners);
      const material = new THREE.LineBasicMaterial({ color });
      return new THREE.Line(geometry, material);
    } else {
      const geometry = new THREE.Geometry();
      geometry.vertices.push(center, ...corners);
      for (let i = 0; i < corners.length - 1; i++) {
        geometry.faces.push(new THREE.Face3(0, i + 1, i + 2));
      }
      geometry.computeFaceNormals();
      const material = new THREE.MeshBasicMaterial({
        color: color,
        opacity: 0.25,
        transparent: true,
      });
      return new THREE.Mesh(geometry, material);

      // const geometry = new THREE.Geometry();
      // addCoverageFace(geometry, globe, d.cell);
      // geometry.computeFaceNormals();
      // const material = new THREE.MeshPhongMaterial({
      //   opacity: 0.25,
      //   transparent: true,
      //   vertexColors: true,
      // });
      // return new THREE.Mesh(geometry, material);
    }
  },

  update(globe, d, obj) {
    obj.material.color.set(cellColor(globe, d.cell));
    // obj.material.color.set(Math.random() < 0.5 ? "red" : "green");
  },

  renderSettings({ inputConfig }) {
    return (
      <Setting title="Resolution">
        <SettingNumber
          min={1}
          max={3}
          {...inputConfig(["layers", "coverage", "resolution"])}
        />
      </Setting>
    );
  },
};

const colorScale = chroma.scale("RdYlBu").domain([0, 1]);

function positionToVector3(
  globe,
  [lng, lat]: [number, number],
  altitude = 0.01
) {
  const { x, y, z } = globe.getCoords(lat, lng, altitude);
  return new THREE.Vector3(x, y, z);
}

function cellCorners(globe, cell) {
  return h3
    .h3ToGeoBoundary(cell, true)
    .map((bound) => positionToVector3(globe, bound));
}
function cellCenter(globe, cell) {
  const centerCoords = globe.getCoords(...h3.h3ToGeo(cell), 0.01);
  return new THREE.Vector3(centerCoords.x, centerCoords.y, centerCoords.z);
}

function cellColor(globe, cell) {
  return new THREE.Color(colorScale(globe.coverage[cell]).hex());
}

function createCoverageMesh(globe, cells) {
  const geometry = new THREE.Geometry();
  for (const cell of cells) {
    addCoverageFace(geometry, globe, cell);
  }
  geometry.computeFaceNormals();
  const material = new THREE.MeshPhongMaterial({
    opacity: 0.25,
    transparent: true,
    vertexColors: true,
  });
  return new THREE.Mesh(geometry, material);
}

function addCoverageFace(geometry, globe, cell) {
  const color = cellColor(globe, cell);
  const center = cellCenter(globe, cell);
  const corners = cellCorners(globe, cell);
  const vertexOffset = geometry.vertices.length;
  geometry.vertices.push(center, ...corners);
  for (let i = 0; i < corners.length - 1; i++) {
    geometry.faces.push(
      new THREE.Face3(
        vertexOffset,
        vertexOffset + i + 1,
        vertexOffset + i + 2,
        null,
        color
      )
    );
  }
}
