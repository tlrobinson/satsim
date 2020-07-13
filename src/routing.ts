import { euclideanDistance } from "./util";
import { DEFAULT_COVERAGE_RESOLUTION } from "./constants";

import * as _ from "lodash";
import * as h3 from "h3-js";

import * as dijkstrajs from "dijkstrajs";

export function computeShortestPath(
  pointA,
  pointB,
  positions,
  {
    links = [],
    relays = [],
    satellitesByCell,
    resolution = DEFAULT_COVERAGE_RESOLUTION,
  }
) {
  function satellitesInRange(position) {
    return (
      satellitesByCell[h3.geoToH3(position.lat, position.lng, resolution)] || []
    );
  }

  positions = Object.create(positions);
  positions["start"] = { ...pointA, height: 0 };
  positions["end"] = { ...pointB, height: 0 };

  const graph = {};
  const addEdge = (a, b, cost = 1) => {
    graph[a] = graph[a] || {};
    graph[b] = graph[b] || {};
    graph[a][b] = cost;
  };

  // TODO: satellitesByCell only satellites covering the center point of the cell
  // to be more accurate we should check the actual distance (and expand to surrounding cells)
  for (const sat of satellitesInRange(positions["start"])) {
    const distance = euclideanDistance(positions["start"], positions[sat]);
    addEdge("start", sat, distance);
  }
  for (const sat of satellitesInRange(positions["end"])) {
    const distance = euclideanDistance(positions["end"], positions[sat]);
    addEdge(sat, "end", distance);
  }
  for (const [a, b] of links) {
    const distance = euclideanDistance(positions[a], positions[b]);
    addEdge(a, b, distance);
    addEdge(b, a, distance);
  }
  for (const [index, relay] of Object.entries(relays)) {
    positions[`relay-${index}`] = relay;
    for (const sat of satellitesInRange(relay)) {
      const distance = euclideanDistance(relay, positions[sat]);
      addEdge(`relay-${index}`, sat, distance);
      addEdge(sat, `relay-${index}`, distance);
    }
  }

  const path = dijkstrajs.find_path(graph, "start", "end");
  const pathPositions = [];
  let distance = 0;
  let prev = null;
  for (const id of path) {
    pathPositions.push(positions[id]);
    const index = pathPositions.length - 1;
    if (index > 0) {
      distance += euclideanDistance(
        pathPositions[index],
        pathPositions[index - 1]
      );
    }
  }
  return {
    path,
    positions: pathPositions,
    distance,
    latency: (distance / 300000) * 1000,
  };
}
