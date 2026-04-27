import {
  Activity,
  CheckCircle2,
  FolderSearch,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AccountProfile, AccountType, AppState, ProfileInput, ProviderId, QuotaStatus } from "../../shared/types";

const accountTypes: AccountType[] = ["unknown", "plus", "pro", "team", "business", "enterprise", "api"];

const emptyProfile: ProfileInput = {
  providerId: "codex",
  label: "",
  accountType: "api",
  usage: {
    used: 0,
    limit: 100,
    unit: "requests",
    updatedAt: new Date().toISOString()
  }
};

export function App() {
  const [state, setState] = useState<AppState>();
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("codex");
  const [draft, setDraft] = useState<ProfileInput>(emptyProfile);
  const [message, setMessage] = useState<string>("Loading local account context...");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const next = await window.codingPlanManager.getState();
    setState(next);
    setMessage("Local provider scan complete.");
  }

  async function rescan() {
    setMessage("Scanning local Codex and Claude paths...");
    const next = await window.codingPlanManager.rescan();
    setState(next);
    setMessage("Scan refreshed.");
  }

  async function saveProfile() {
    const saved = await window.codingPlanManager.saveProfile({ ...draft, providerId: selectedProvider });
    setDraft({
      ...emptyProfile,
      providerId: selectedProvider,
      usage: {
        used: 0,
        limit: 100,
        unit: "requests",
        updatedAt: new Date().toISOString()
      }
    });
    await refresh();
    setMessage(`Saved ${saved.label}.`);
  }

  async function activate(profile: AccountProfile) {
    const result = await window.codingPlanManager.activateProfile(profile.providerId, profile.id);
    await refresh();
    setMessage(`Activated ${profile.label}. Env file: ${result.active.envFile}`);
  }

  async function remove(profile: AccountProfile) {
    await window.codingPlanManager.deleteProfile(profile.id);
    await refresh();
    setMessage(`Deleted ${profile.label}.`);
  }

  const providers = state?.providers ?? [];
  const activeProvider = providers.find((provider) => provider.id === selectedProvider) ?? providers[0];
  const profiles = (state?.profiles ?? []).filter((profile) => profile.providerId === selectedProvider);
  const active = state?.activeProfiles.find((candidate) => candidate.providerId === selectedProvider);
  const discovery = state?.discoveries.find((candidate) => candidate.providerId === selectedProvider);
  const chartData = useMemo(
    () =>
      profiles.map((profile) => ({
        name: profile.label,
        used: profile.usage?.used ?? 0,
        available: Math.max((profile.usage?.limit ?? 0) - (profile.usage?.used ?? 0), 0),
        status: quotaStatus(profile)
      })),
    [profiles]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <h1>Coding Plan Manager</h1>
            <p>Local account and API routing</p>
          </div>
        </div>

        <nav className="provider-list" aria-label="Providers">
          {providers.map((provider) => (
            <button
              className={provider.id === selectedProvider ? "provider active" : "provider"}
              disabled={!provider.enabled && provider.id !== "hermes"}
              key={provider.id}
              onClick={() => {
                setSelectedProvider(provider.id);
                setDraft({ ...emptyProfile, providerId: provider.id });
              }}
              type="button"
            >
              <span>{provider.name}</span>
              <small>{provider.enabled ? "Ready" : "Next iteration"}</small>
            </button>
          ))}
        </nav>

        <div className="status-panel">
          <p>{message}</p>
          <button className="icon-text" onClick={rescan} type="button">
            <RefreshCw size={16} />
            Rescan
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeProvider?.description}</p>
            <h2>{activeProvider?.name ?? "Provider"} Dashboard</h2>
          </div>
          <button className="secondary" onClick={() => void window.codingPlanManager.openAppData()} type="button">
            <FolderSearch size={17} />
            App Data
          </button>
        </header>

        <section className="metrics-grid">
          <Metric icon={<KeyRound />} label="Profiles" value={profiles.length.toString()} />
          <Metric
            icon={<CheckCircle2 />}
            label="Active"
            value={profiles.find((profile) => profile.id === active?.profileId)?.label ?? "None"}
          />
          <Metric icon={<ShieldCheck />} label="Local Config" value={discovery?.exists ? "Found" : "Missing"} />
          <Metric icon={<Activity />} label="Tracked Usage" value={`${profiles.filter((profile) => profile.usage).length}`} />
        </section>

        <section className="content-grid">
          <div className="panel usage-panel">
            <div className="panel-header">
              <div>
                <h3>Usage Overview</h3>
                <p>Manual quota snapshots for quick switching decisions.</p>
              </div>
            </div>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="used" stackId="quota" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={barColor(entry.status)} />
                    ))}
                  </Bar>
                  <Bar dataKey="available" stackId="quota" fill="#d7d2c8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Add a profile to start tracking quota and availability.</div>
            )}
          </div>

          <div className="panel discovery-panel">
            <div className="panel-header">
              <div>
                <h3>Local Discovery</h3>
                <p>{discovery?.homePath}</p>
              </div>
            </div>
            <div className={discovery?.exists ? "path-state found" : "path-state"}>
              {discovery?.exists ? "Provider directory detected" : "Provider directory was not found"}
            </div>
            <ul className="file-list">
              {(discovery?.files ?? []).slice(0, 8).map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="profile-layout">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Profiles</h3>
                <p>Switch active API context for local tools.</p>
              </div>
            </div>
            <div className="profile-list">
              {profiles.map((profile) => (
                <ProfileRow
                  active={active?.profileId === profile.id}
                  key={profile.id}
                  onActivate={() => activate(profile)}
                  onDelete={() => remove(profile)}
                  profile={profile}
                />
              ))}
              {!profiles.length && <div className="empty-state compact">No profiles for this provider yet.</div>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Add Profile</h3>
                <p>Keys are stored locally in this app's private data file.</p>
              </div>
            </div>
            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                void saveProfile();
              }}
            >
              <Field label="Label" value={draft.label} onChange={(label) => setDraft({ ...draft, label })} required />
              <Field
                label="Email"
                value={draft.accountEmail ?? ""}
                onChange={(accountEmail) => setDraft({ ...draft, accountEmail })}
              />
              <Field
                label="Workspace"
                value={draft.workspace ?? ""}
                onChange={(workspace) => setDraft({ ...draft, workspace })}
              />
              <label className="field">
                <span>Account Type</span>
                <select
                  value={draft.accountType}
                  onChange={(event) => setDraft({ ...draft, accountType: event.target.value as AccountType })}
                >
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="API Key"
                type="password"
                value={draft.apiKey ?? ""}
                onChange={(apiKey) => setDraft({ ...draft, apiKey })}
              />
              <Field
                label="Org / Project"
                value={draft.organizationId ?? ""}
                onChange={(organizationId) => setDraft({ ...draft, organizationId })}
              />
              <div className="split-fields">
                <Field
                  label="Used"
                  type="number"
                  value={String(draft.usage?.used ?? 0)}
                  onChange={(used) =>
                    setDraft({
                      ...draft,
                      usage: { ...(draft.usage ?? emptyProfile.usage!), used: Number(used), updatedAt: new Date().toISOString() }
                    })
                  }
                />
                <Field
                  label="Limit"
                  type="number"
                  value={String(draft.usage?.limit ?? 100)}
                  onChange={(limit) =>
                    setDraft({
                      ...draft,
                      usage: { ...(draft.usage ?? emptyProfile.usage!), limit: Number(limit), updatedAt: new Date().toISOString() }
                    })
                  }
                />
              </div>
              <button className="primary" type="submit">
                <KeyRound size={17} />
                Save Profile
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({
  label,
  onChange,
  required,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ProfileRow({
  active,
  onActivate,
  onDelete,
  profile
}: {
  active: boolean;
  onActivate: () => void;
  onDelete: () => void;
  profile: AccountProfile;
}) {
  const usage = profile.usage;
  const status = quotaStatus(profile);
  return (
    <article className={active ? "profile-row active" : "profile-row"}>
      <div>
        <div className="profile-title">
          <strong>{profile.label}</strong>
          <span className={`badge ${status}`}>{status}</span>
          {active && <span className="badge active-badge">active</span>}
        </div>
        <p>
          {[profile.accountEmail, profile.workspace, profile.accountType].filter(Boolean).join(" · ")}
        </p>
        {usage && (
          <div className="usage-line">
            <span style={{ width: `${Math.min((usage.used / Math.max(usage.limit, 1)) * 100, 100)}%` }} />
          </div>
        )}
      </div>
      <div className="row-actions">
        <button className="secondary" onClick={onActivate} type="button">
          Switch
        </button>
        <button className="icon-only" onClick={onDelete} type="button" aria-label={`Delete ${profile.label}`}>
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}

function quotaStatus(profile: AccountProfile): QuotaStatus {
  if (!profile.usage || profile.usage.limit <= 0) {
    return "unknown";
  }
  const ratio = profile.usage.used / profile.usage.limit;
  if (ratio >= 1) {
    return "limited";
  }
  if (ratio >= 0.75) {
    return "watch";
  }
  return "healthy";
}

function barColor(status: QuotaStatus): string {
  return {
    healthy: "#2f7d59",
    watch: "#b7791f",
    limited: "#b42318",
    unknown: "#687076"
  }[status];
}
