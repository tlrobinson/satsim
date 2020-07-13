import * as geokdbush from "geokdbush";

export function greatCircleDistance(p1, p2) {
  return geokdbush.distance(p1.lng, p1.lat, p2.lng, p2.lat);
}

export function euclideanDistance(p1, p2) {
  // FIXME: not correct
  return Math.sqrt(
    Math.pow(greatCircleDistance(p1, p2), 2) +
      Math.pow((p1.height || 0) - (p2.height || 0), 2)
  );
}
