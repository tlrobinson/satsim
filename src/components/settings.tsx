import { classnames as c } from "tailwindcss-classnames";

export function SettingsSection({ children }) {
  return <div className="m-2 p-2 border border-white rounded">{children}</div>;
}

export function SettingsSectionHeader({ children }) {
  return <h3 className="m-2 text-white flex items-center">{children}</h3>;
}

export function Setting({ title, children }) {
  return (
    <SettingsRow className="my-1">
      {title && <span className="mr-1">{title}:</span>}
      <span className="flex-1"></span>
      <span>{children}</span>
    </SettingsRow>
  );
}

export function SettingsRow({ className = null, children }) {
  return <div className={c(className, "flex", "items-center")}>{children}</div>;
}

export function SettingCheckbox(props) {
  return <input type="checkbox" {...props}></input>;
}
export function SettingInput({ className, ...props }) {
  return (
    <input
      className={c(className, "rounded text-black px-2")}
      {...props}
    ></input>
  );
}
export function SettingNumber({ onChange, ...props }) {
  return (
    <SettingInput
      type="number"
      {...props}
      onChange={(e) =>
        onChange({ target: { value: parseFloat(e.target.value) } })
      }
    />
  );
}
export function SettingRange({ onChange, ...props }) {
  return (
    <input
      type="range"
      {...props}
      onChange={(e) =>
        onChange({ target: { value: parseFloat(e.target.value) } })
      }
    />
  );
}
export function SettingSelect({ className, ...props }) {
  return (
    <select
      className={c(className, "border", "border-white", "bg-black", "rounded")}
      {...props}
    />
  );
}

export function SettingsLayerSection({
  layer,
  config,
  setConfig,
  children = null,
}) {
  const enabled = config.layers[layer.key].enabled;
  return (
    <SettingsSection>
      <div
        className={
          enabled && children
            ? c("border-b", "border-white", "mb-2", "pb-1")
            : null
        }
      >
        <SettingCheckbox
          checked={config.layers[layer.key].enabled}
          onChange={(e) =>
            setConfig(["layers", layer.key, "enabled"], e.target.checked)
          }
        />{" "}
        <span>{layer.name}</span>
      </div>
      {enabled ? children : null}
    </SettingsSection>
  );
}

export function SettingsButton({ children, ...props }) {
  return (
    <button className="border border-white rounded ml-2 px-1" {...props}>
      {children}
    </button>
  );
}
