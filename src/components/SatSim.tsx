import React from "react";

import { loadStarlink, generateStarlink } from "../starlink";

import _ from "lodash";
import { assoc, assocIn, getIn } from "icepick";

import { startTimer } from "../timer";
import { getSatellitePositions } from "../satellites";
import {
  getCellsForResolution,
  computeCoverage,
  computeCoverageAtMoment,
  makeCoverage,
} from "../coverage";

import Globe from "globe.gl";

import {
  Setting,
  SettingNumber,
  SettingRange,
  SettingsSection,
  SettingsLayerSection,
  SettingsSectionHeader,
  SettingsButton,
  SettingsRow,
  SettingSelect,
} from "./settings";

import satelliteLayer from "../layers/satellite";
import laserLayer, { laserLinksForSatellites } from "../layers/laser";
import coverageLayer from "../layers/coverage";
import gatewayLayer, { getGateways, getGatewaysIndex } from "../layers/gateway";
import routingLayer from "../layers/routing";

import { computeShortestPath } from "../routing";

const layers = [
  satelliteLayer,
  coverageLayer,
  gatewayLayer,
  laserLayer,
  routingLayer,
];

const GENERATED_PRESETS = [
  {
    name: "Starlink - Original",
    value: [
      {
        orbitalPlanes: 32,
        satellitesPerOrbitalPlane: 50,
        altitude: 1100,
        inclination: 53,
      },
    ],
  },
  {
    name: "Starlink - Nov 2018",
    value: [
      {
        orbitalPlanes: 24,
        satellitesPerOrbitalPlane: 66,
        altitude: 550,
        inclination: 53,
      },
    ],
  },
  {
    name: "Starlink - Dec 2019",
    value: [
      {
        orbitalPlanes: 72,
        satellitesPerOrbitalPlane: 22,
        altitude: 550,
        inclination: 53,
      },
    ],
  },
];

const DEFAULT_CONFIG = {
  multiplier: 50,
  elevation: 40,
  satellitesType: "starlink",
  layers: {},
  generated: GENERATED_PRESETS[1].value,
};

// settings managed outside of config
let multiplier;
let elevation;

const LAYERS_MAP = {};
for (const layer of layers) {
  LAYERS_MAP[layer.key] = layer;
  DEFAULT_CONFIG.layers[layer.key] = { ...layer.defaultConfig };
}

function getConfigFromURL() {
  try {
    return JSON.parse(atob(window.location.hash.slice(1)));
  } catch (e) {
    return null;
  }
}
function setConfigInURL(config) {
  window.location.hash = "#" + btoa(JSON.stringify(config));
}

export default function SatSim() {
  const ref = React.useRef(null);
  const [globe, setGlobe] = React.useState(null);
  const [config, setConfigState] = React.useState(
    getConfigFromURL() || DEFAULT_CONFIG
  );
  const setConfig = (keyPath, value) => {
    const newConfig = assocIn(config, keyPath, value);
    setConfigState(newConfig);
    setConfigInURL(newConfig);
  };
  const getConfig = (keyPath) => getIn(config, keyPath);
  const inputConfig = (keyPath) => ({
    value: getConfig(keyPath),
    onChange: (e) => setConfig(keyPath, e.target.value),
  });
  const checkboxConfig = (keyPath) => ({
    checked: getConfig(keyPath),
    onChange: (e) => setConfig(keyPath, e.target.checked),
  });

  React.useEffect(() => {
    const globe = init(ref.current);
    setGlobe({ globe });
  }, []);

  const [computedConfig, setComputedConfig] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      let satellites = [];
      if (config.satellitesType === "starlink") {
        satellites = await loadStarlink();
      } else if (config.satellitesType === "generated") {
        satellites = generateStarlink(config.generated);
      }
      setComputedConfig({
        ...config,
        satellites,
      });
    })();
  }, [config]);

  React.useEffect(() => {
    if (globe && computedConfig) {
      globe.globe.config = computedConfig;
      return update(globe.globe);
    }
  }, [globe, computedConfig]);

  // these are stored separately for performance reasons
  const [multiplier_, setMultiplier] = React.useState(
    DEFAULT_CONFIG.multiplier
  );
  multiplier = multiplier_;
  const [elevation_, setElevation] = React.useState(DEFAULT_CONFIG.elevation);
  elevation = elevation_;

  const setRealTime = () => {
    setMultiplier(1);
    globe.date = null;
    setConfig(["nonce"], Date.now());
  };

  const [settingsVisible, setSettingsVisible] = React.useState(
    window.innerWidth > 1000
  );

  const settingsProps = {
    config,
    inputConfig,
    checkboxConfig,
    setConfig,
    getConfig,
  };
  return (
    <div>
      <div
        className="absolute top-0 left-0 bottom-0 right-0 flex flex-col items-center bg-black"
        ref={ref}
      ></div>
      <div className="absolute bottom-0 left-0 text-white p-2" id="time"></div>
      <div className="absolute bottom-0 right-0 text-white p-2" id="fps"></div>
      <div
        className="absolute bottom-0 right-0 left-0 text-white text-center p-2"
        id="route"
      ></div>
      <div className="absolute top-0 right-0 text-white">
        SatSim v1.0 <a href="https://github.com/tlrobinson/satsim">(src)</a>
      </div>
      {settingsVisible ? (
        <div className="absolute top-0 left-0 text-white">
          <SettingsSectionHeader>
            Satellites
            <span className="flex-1" />
            <SettingsButton onClick={() => setSettingsVisible(false)}>
              ×
            </SettingsButton>
          </SettingsSectionHeader>
          <SettingsSection>
            <SettingsRow>
              <SettingSelect {...inputConfig(["satellitesType"])}>
                <option value="starlink">Starlink (Live)</option>
                <option value="generated">Generated</option>
              </SettingSelect>
              {getConfig(["satellitesType"]) === "generated" && (
                <SettingSelect
                  className="ml-2"
                  value={_.findIndex(GENERATED_PRESETS, ({ value }) =>
                    _.isEqual(value, config.generated)
                  )}
                  onChange={(e) =>
                    setConfig(
                      ["generated"],
                      GENERATED_PRESETS[e.target.value].value
                    )
                  }
                >
                  <option disabled value={-1}>
                    Select a preset...
                  </option>
                  {GENERATED_PRESETS.map(({ name }, index) => (
                    <option value={index}>{name}</option>
                  ))}
                </SettingSelect>
              )}
            </SettingsRow>

            {getConfig(["satellitesType"]) === "generated" && (
              <div>
                {getConfig(["generated"]).map((shell, shellIndex, shells) => (
                  <div className="border-b border-white mt-1 mb-1 pb-1">
                    <div className="flex items-center">
                      <strong>Orbital Shell {shellIndex + 1}</strong>
                      <span>
                        {" – "}
                        {shell.orbitalPlanes *
                          shell.satellitesPerOrbitalPlane}{" "}
                        satellites
                      </span>
                      <span className="flex-1" />
                      {shells.length > 1 && (
                        <SettingsButton
                          onClick={() =>
                            setConfig(
                              ["generated"],
                              [
                                ...shells.slice(0, shellIndex),
                                ...shells.slice(shellIndex + 1),
                              ]
                            )
                          }
                        >
                          ×
                        </SettingsButton>
                      )}
                      {shellIndex === shells.length - 1 && (
                        <SettingsButton
                          onClick={() =>
                            setConfig(["generated"], [...shells, shell])
                          }
                        >
                          +
                        </SettingsButton>
                      )}
                    </div>
                    <Setting title="Orbital Planes">
                      <SettingNumber
                        min={1}
                        max={100}
                        {...inputConfig([
                          "generated",
                          shellIndex,
                          "orbitalPlanes",
                        ])}
                      />
                    </Setting>
                    <Setting title="Satellites per Plane">
                      <SettingNumber
                        min={1}
                        max={100}
                        {...inputConfig([
                          "generated",
                          shellIndex,
                          "satellitesPerOrbitalPlane",
                        ])}
                      />
                    </Setting>
                    <Setting title="Inclination">
                      <SettingNumber
                        min={0}
                        max={360}
                        {...inputConfig([
                          "generated",
                          shellIndex,
                          "inclination",
                        ])}
                      />
                    </Setting>
                    <Setting title="Altitude">
                      <SettingNumber
                        min={1}
                        max={1000}
                        {...inputConfig(["generated", shellIndex, "altitude"])}
                      />
                    </Setting>
                  </div>
                ))}
              </div>
            )}
            <Setting title="Min Elevation">
              <SettingRange
                min={0}
                max={90}
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
              />
              <span className="ml-1">{elevation}°</span>
            </Setting>
          </SettingsSection>
          <SettingsSectionHeader>Time</SettingsSectionHeader>
          <SettingsSection>
            <SettingsRow>
              <SettingRange
                min={-400}
                max={400}
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
              />
              <span className="ml-1">{multiplier}×</span>
              <span className="flex-1" />
              <SettingsButton onClick={setRealTime}>Real-time</SettingsButton>
            </SettingsRow>
          </SettingsSection>
          <SettingsSectionHeader>Layers</SettingsSectionHeader>
          {layers
            .filter(
              (layer) =>
                typeof layer.canEnable !== "function" || layer.canEnable(config)
            )
            .map((layer) => (
              <SettingsLayerSection
                layer={layer}
                config={config}
                setConfig={setConfig}
              >
                {typeof layer.renderSettings === "function" &&
                  layer.renderSettings(settingsProps)}
              </SettingsLayerSection>
            ))}
        </div>
      ) : (
        <div className="absolute top-0 left-0 text-white">
          <SettingsSectionHeader>
            <SettingsButton onClick={() => setSettingsVisible(true)}>
              Settings
            </SettingsButton>
          </SettingsSectionHeader>
        </div>
      )}
    </div>
  );
}

function init(element) {
  const globe = Globe();

  globe(element)
    .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
    // .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
    // .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
    .pointOfView({ lat: 38, lng: -100, altitude: 1.5 }, 1000)
    .customThreeObject((d, globeRadius) => {
      globe.radius = globeRadius;
      if (LAYERS_MAP[d.type]) {
        return LAYERS_MAP[d.type].create(globe, d, globeRadius);
      } else {
        console.warn("Unknown type", d.type);
      }
    })
    .customThreeObjectUpdate((obj, d, globeRadius) => {
      globe.radius = globeRadius;
      if (LAYERS_MAP[d.type]) {
        return LAYERS_MAP[d.type].update(globe, d, obj, globeRadius);
      }
    });

  return globe;
}

function update(globe) {
  const { config } = globe;
  const { satellites } = config;

  globe.satellites = satellites;

  const resolution = config.layers.coverage.resolution;

  const coverageAverageEnabled =
    config.layers.coverage.enabled && config.layers.coverage.type === "average";
  const routingEnabled = config.layers.routing.enabled;
  const routingLasersEnabled = config.layers.routing.use_laser_links;
  const laserEnabled = config.layers.laser.enabled;

  let coverageTotal;
  if (coverageAverageEnabled) {
    globe.cells = getCellsForResolution(resolution);
    globe.coverage = computeCoverage({ resolution, satellites });
    coverageTotal = makeCoverage(globe.cells);
  }

  globe.laserLinks = [];
  if (laserEnabled || (routingEnabled && routingLasersEnabled)) {
    globe.laserLinks = laserLinksForSatellites(satellites, config.layers.laser);
  }

  globe.gateways = getGateways(config.layers.gateway);
  globe.gatewaysIndex = getGatewaysIndex(globe.gateways);

  const enabledLayers = layers.filter(
    (layer) => config.layers[layer.key].enabled
  );

  const customLayerData = enabledLayers.flatMap((layer) =>
    layer.objects(globe)
  );

  globe.customLayerData(customLayerData);

  let ticks = 0;
  let last;
  let avgFps;
  let SMOOTHING = 0.95;
  function update(date) {
    ticks++;

    globe.config.elevation = elevation;

    const positions = getSatellitePositions(satellites, date, {
      elevation: globe.config.elevation,
    });

    globe.positions = positions;
    globe.date = date;

    let satellitesByCell, cellsBySatellite;
    if (coverageAverageEnabled || routingEnabled) {
      ({ satellitesByCell, cellsBySatellite } = computeCoverageAtMoment({
        elevation: globe.config.elevation,
        resolution,
        positions,
      }));
    }

    globe.coverage = {};
    if (coverageAverageEnabled) {
      for (const cell of Object.keys(coverageTotal)) {
        coverageTotal[cell] += satellitesByCell[cell] ? 1 : 0;
        globe.coverage[cell] = coverageTotal[cell] / ticks;
      }
    }

    globe.route = null;
    document.getElementById("route").textContent = "";
    if (routingEnabled) {
      const {
        pointA,
        pointB,
        use_laser_links,
        use_gateways,
      } = globe.config.layers.routing;
      let links = [];
      if (use_laser_links) {
        links.push(...globe.laserLinks);
      }
      let relays = [];
      if (use_gateways) {
        relays.push(...globe.gateways.map((g) => g.position));
      }

      try {
        globe.route = computeShortestPath(pointA, pointB, positions, {
          links,
          relays,
          satellitesByCell,
          resolution,
        });
        document.getElementById(
          "route"
        ).textContent = `Route distance: ${Math.round(
          globe.route.distance
        )} km. Route latency: ~${Math.round(globe.route.latency)} ms`;
      } catch (e) {
        document.getElementById("route").textContent = "Route: none";
      }
    }

    for (const data of customLayerData) {
      if (data.satelliteIndex != null) {
        data.position = positions[data.satelliteIndex];
      }
      if (data.satelliteIndexes) {
        data.positions = data.satelliteIndexes.map((index) => positions[index]);
      }
    }
    globe.customLayerData(customLayerData);

    const now = Date.now();
    if (last != null) {
      const fps = 1 / ((now - last) / 1000);
      avgFps = (avgFps || fps) * SMOOTHING + fps * (1.0 - SMOOTHING);
      document.getElementById("fps").textContent = avgFps.toFixed(0) + " FPS";
    }
    last = now;

    document.getElementById("time").textContent = String(date).replace(
      / \(.*/,
      ""
    );
  }

  return startTimer(update, {
    // start: globe.date ? globe.date.getTime() : Date.now(),
    multiplier: () => multiplier,
    interval: 20,
  });
}
