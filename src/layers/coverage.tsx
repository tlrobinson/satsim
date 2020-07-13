import React from "react";
import { Setting, SettingSelect } from "../components/settings";

import coverageAverageLayer from "./coverage_average";
import coverageInstantaneousLayer from "./coverage_instantaneous";

const layer = (config) =>
  config.layers.coverage.type === "average"
    ? coverageAverageLayer
    : coverageInstantaneousLayer;

export default {
  name: "Coverage",
  key: "coverage",
  defaultConfig: {
    type: "instantaneous",
    ...coverageAverageLayer.defaultConfig,
    ...coverageInstantaneousLayer.defaultConfig,
  },
  objects(globe) {
    return layer(globe.config).objects(globe);
  },
  create(globe, d, globeRadius) {
    return layer(globe.config).create(globe, d, globeRadius);
  },
  update(globe, d, obj) {
    return layer(globe.config).update(globe, d, obj);
  },
  renderSettings(props) {
    const { config, inputConfig } = props;
    return (
      <div>
        <Setting title="Type">
          <SettingSelect {...inputConfig(["layers", "coverage", "type"])}>
            <option value="average">Average</option>
            <option value="instantaneous">Instantaneous</option>
          </SettingSelect>
        </Setting>
        {layer(config).renderSettings(props)}
      </div>
    );
  },
};
