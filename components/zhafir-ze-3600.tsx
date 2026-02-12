"use client";

import React, { useEffect, useMemo, useState } from "react";

type StdActValue = {
  std: number | string | null;
  act: number | string | null;
};

type ApiResponse = {
  paraId: string;
  values: Record<string, StdActValue>;
};

type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

type RowProps = {
  labels: string[];
  type: "triple" | "double";
  fields?: string[];
  keyMap?: Record<string, Array<string | null>>;
  values: Record<string, StdActValue>;
};

type InputProps = {
  label?: string;
  pair?: boolean;
  fieldKey?: string | null;
  values: Record<string, StdActValue>;
  stdDraft?: Record<string, string>;
  actDraft?: Record<string, string>;
  onStdChange?: (fieldKey: string, value: string) => void;
  onStdSave?: (fieldKey: string) => Promise<void>;
  onActChange?: (fieldKey: string, value: string) => void;
  onActSave?: (fieldKey: string) => Promise<void>;
  savingKey?: string | null;
  savingField?: string | null;
};

const PARA_ID = "ZHF-STD-001";
const ENABLE_PER_FIELD_SAVE = false;
const STRING_FIELDS = new Set([
  "AirBlowStart",
  "VPPositionText",
  "VPTimeText",
  "VPPosnText",
  "AirBlowMaleFemale",
]);
const SINGLE_VALUE_FIELDS = new Set([
  ...Array.from({ length: 16 }, (_, i) => `BeratUnit${i + 1}`),
  ...Array.from({ length: 14 }, (_, i) => `HeaterControl${i + 1}`),
]);

function fmt(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return `${value}`;
}

export default function ZhafirParameterForm() {
  const [values, setValues] = useState<Record<string, StdActValue>>({});
  const [stdDraft, setStdDraft] = useState<Record<string, string>>({});
  const [actDraft, setActDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:9999",
    [],
  );

  useEffect(() => {
    let active = true;
    const REQUEST_TIMEOUT_MS = 5000;

    const buildCandidates = () => {
      const trimmed = (baseUrl || "").replace(/\/+$/, "");
      const normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
      const q = `?paraId=${encodeURIComponent(PARA_ID)}`;
      const unique = new Set<string>();
      if (normalized) unique.add(`${normalized}/api/zhafir-ze-3600${q}`);
      unique.add("http://localhost:9999/api/zhafir-ze-3600" + q);
      unique.add("http://127.0.0.1:9999/api/zhafir-ze-3600" + q);
      unique.add(`/api/zhafir-ze-3600${q}`);
      return Array.from(unique);
    };

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        return await fetch(url, { cache: "no-store", signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const candidates = buildCandidates();
        let data: ApiResponse | null = null;
        let lastStatus = "unknown";

        for (const url of candidates) {
          let res: Response;
          try {
            res = await fetchWithTimeout(url);
          } catch (e) {
            const name = (e as Error).name || "Error";
            lastStatus = `${name} @ ${url}`;
            continue;
          }
          lastStatus = `${res.status} @ ${url}`;
          if (!res.ok) continue;
          data = (await res.json()) as ApiResponse;
          break;
        }

        if (!data) throw new Error(`Failed to load data (${lastStatus})`);
        if (active) {
          const incoming = data.values || {};
          setValues(incoming);
          const stdDraftLocal: Record<string, string> = {};
          const draft: Record<string, string> = {};
          Object.entries(incoming).forEach(([key, pair]) => {
            stdDraftLocal[key] = fmt(pair?.std);
            draft[key] = fmt(pair?.act);
          });
          setStdDraft(stdDraftLocal);
          setActDraft(draft);
        }
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [baseUrl]);

  const resolveSaveCandidates = (kind: "actual" | "std") => {
    const trimmed = (baseUrl || "").replace(/\/+$/, "");
    const normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
    const endpoint = kind === "actual" ? "manual-actual" : "manual-std";
    const unique = new Set<string>();
    if (normalized) unique.add(`${normalized}/api/zhafir-ze-3600/${endpoint}`);
    unique.add(`http://localhost:9999/api/zhafir-ze-3600/${endpoint}`);
    unique.add(`http://127.0.0.1:9999/api/zhafir-ze-3600/${endpoint}`);
    unique.add(`/api/zhafir-ze-3600/${endpoint}`);
    return Array.from(unique);
  };

  const saveField = async (kind: "actual" | "std", fieldKey: string) => {
    const rawValue = kind === "actual" ? actDraft[fieldKey] : stdDraft[fieldKey];
    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) {
      setError(`Value untuk ${fieldKey} harus angka (${kind.toUpperCase()})`);
      return;
    }

    setSavingKey(`${kind}:${fieldKey}`);
    setError(null);
    let lastError = "unknown";

    try {
      const candidates = resolveSaveCandidates(kind);
      let saved = false;

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              field: fieldKey,
              value: numericValue,
            }),
          });
          if (!res.ok) {
            lastError = `${res.status} @ ${url}`;
            continue;
          }
          saved = true;
          break;
        } catch (e) {
          const name = (e as Error).name || "Error";
          lastError = `${name} @ ${url}`;
        }
      }

      if (!saved) {
        setError(`Gagal save (${lastError})`);
        return;
      }

      setValues((prev) => ({
        ...prev,
        [fieldKey]: {
          std: kind === "std" ? numericValue : (prev[fieldKey]?.std ?? null),
          act: kind === "actual" ? numericValue : (prev[fieldKey]?.act ?? null),
        },
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const saveActField = async (fieldKey: string) => saveField("actual", fieldKey);
  const saveStdField = async (fieldKey: string) => saveField("std", fieldKey);
  const handleStdChange = (fieldKey: string, value: string) =>
    setStdDraft((prev) => ({ ...prev, [fieldKey]: value }));
  const handleActChange = (fieldKey: string, value: string) =>
    setActDraft((prev) => ({ ...prev, [fieldKey]: value }));

  const resolveBulkSaveCandidates = () => {
    const trimmed = (baseUrl || "").replace(/\/+$/, "");
    const normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
    const unique = new Set<string>();
    if (normalized) unique.add(`${normalized}/api/zhafir-ze-3600/manual-bulk`);
    unique.add("http://localhost:9999/api/zhafir-ze-3600/manual-bulk");
    unique.add("http://127.0.0.1:9999/api/zhafir-ze-3600/manual-bulk");
    unique.add("/api/zhafir-ze-3600/manual-bulk");
    return Array.from(unique);
  };

  const saveAll = async () => {
    const confirmed = window.confirm("Apakah Anda sudah yakin semua data benar?");
    if (!confirmed) return;

    setError(null);
    setStatusMessage(null);
    setSavingKey("bulk");

    const stdPayload: Record<string, number | string> = {};
    const actPayload: Record<string, number | string> = {};

    for (const key of Object.keys(values)) {
      if (SINGLE_VALUE_FIELDS.has(key)) {
        const singleRaw = stdDraft[key] ?? actDraft[key];
        const singleNumber = Number(singleRaw);
        if (Number.isNaN(singleNumber)) {
          setSavingKey(null);
          setError(`Nilai untuk "${key}" harus angka`);
          return;
        }
        stdPayload[key] = singleNumber;
        actPayload[key] = singleNumber;
      } else if (STRING_FIELDS.has(key)) {
        stdPayload[key] = stdDraft[key] ?? "";
        actPayload[key] = actDraft[key] ?? "";
      } else {
        const stdNumber = Number(stdDraft[key]);
        const actNumber = Number(actDraft[key]);
        if (Number.isNaN(stdNumber) || Number.isNaN(actNumber)) {
          setSavingKey(null);
          setError(`Nilai STD/ACT untuk "${key}" harus angka`);
          return;
        }
        stdPayload[key] = stdNumber;
        actPayload[key] = actNumber;
      }
    }

    let lastError = "unknown";
    try {
      let saved = false;
      for (const url of resolveBulkSaveCandidates()) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ std: stdPayload, act: actPayload }),
          });
          if (!res.ok) {
            lastError = `${res.status} @ ${url}`;
            continue;
          }
          saved = true;
          break;
        } catch (e) {
          const name = (e as Error).name || "Error";
          lastError = `${name} @ ${url}`;
        }
      }

      if (!saved) {
        setError(`Gagal save all (${lastError})`);
        return;
      }

      setValues((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(prev)) {
          next[key] = {
            std: stdPayload[key] as any,
            act: actPayload[key] as any,
          };
        }
        return next;
      });
      setStatusMessage("Semua data STD/ACT berhasil disimpan.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-6 text-sm">
      <div className="mb-3 text-xs text-gray-600">
        ParaID: <span className="font-semibold">{PARA_ID}</span>
        {loading ? " | Loading..." : ""}
        {error ? ` | ${error}` : ""}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={saveAll}
          disabled={loading || savingKey === "bulk"}
          className="rounded border px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          {savingKey === "bulk" ? "Saving All..." : "Save All STD + ACT"}
        </button>
        {statusMessage && <span className="text-xs text-green-700">{statusMessage}</span>}
      </div>

      <Section title="INJECT">
        <Row
          labels={["SE", "S4", "S3", "S2", "S1", "SB"]}
          type="triple"
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={handleStdChange}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            SE: ["InjectSEPosition", "Inject4Velo", "Inject4Press"],
            S4: ["Inject3To", "Inject3Velo", "Inject3Press"],
            S3: ["Inject2To", "Inject2Velo", "Inject2Press"],
            S2: ["Inject1To", "Inject1Velo", "Inject1Press"],
            S1: ["InjectScrewPosition", "InjectS1Speed", "InjectionPressure"],
            SB: ["InjectSBPosition", "InjectSBSpeed", "InjectSBPressure"],
          }}
        />
      </Section>

      <Section title="HOLDING">
        <Row
          labels={["P3", "P2", "P1"]}
          type="triple"
          fields={["Pressure", "Time", "Hold Speed"]}
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={handleStdChange}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            P3: ["Hold3Press", "Hold3To", "Hold3Velo"],
            P2: ["Hold2Press", "Hold2To", "Hold2Velo"],
            P1: ["Hold1Press", "Hold1To", "Hold1Velo"],
          }}
        />
      </Section>

      <Section title="CHARGING">
        <Row
          labels={["S1", "S2", "SE"]}
          type="triple"
          fields={["Position", "Speed", "Pressure", "Back Press"]}
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={handleStdChange}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            S1: ["Plasticise1To", "Plasticise1Velo", "Plasticise1Press", "Plasticise1BackPress"],
            S2: ["Plasticise2To", "Plasticise2Velo", "Plasticise2Press", null],
            SE: ["AfterPlasticisePosition", "AfterPlasticiseSpeed", "AfterPlasticisePress", "AfterPlasticiseBackPress"],
          }}
        />
      </Section>

      <Section title="CLAMP / MOLD">
        <SubSection title="Close Mold">
          <Row
            labels={["S0", "S1", "S2", "S3", "LP", "HP", "SE"]}
            type="double"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={handleStdChange}
            onActChange={handleActChange}
            onStdSave={saveStdField}
            onActSave={saveActField}
            savingKey={savingKey}
            keyMap={{
              S0: ["Close0To", "Close0Velo"],
              S1: ["Close1To", "Close1Velo"],
              S2: ["Close2To", "Close2Velo"],
              S3: ["ProtectTo", "ProtectVelo"],
              LP: ["CloseLPTo", "CloseLPVelo"],
              HP: ["CloseHPTo", "CloseHPVelo"],
              SE: ["CloseSETo", "CloseSEVelo"],
            }}
          />
        </SubSection>

        <SubSection title="Open Mold">
          <Row
            labels={["SE", "S5", "S4", "S3", "S2", "S1"]}
            type="double"
            values={values}
            stdDraft={stdDraft}
            actDraft={actDraft}
            onStdChange={handleStdChange}
            onActChange={handleActChange}
            onStdSave={saveStdField}
            onActSave={saveActField}
            savingKey={savingKey}
            keyMap={{
              SE: ["Open4To", "Open4Velo"],
              S5: ["OpenS5To", "OpenS5Velo"],
              S4: ["OpenS4To", "OpenS4Velo"],
              S3: ["Open3To", "Open3Velo"],
              S2: ["Open2To", "Open2Velo"],
              S1: ["Open1To", "Open1Velo"],
            }}
          />
        </SubSection>
      </Section>

      <Section title="TEMPERATURE">
        <div className="grid grid-cols-9 gap-2">
          {[
            { zone: "Zone 1", real: "Barrel1", set: "Barrel1" },
            { zone: "Zone 2", real: "Barrel2", set: "Barrel2" },
            { zone: "Zone 3", real: "Barrel3", set: "Barrel3" },
            { zone: "Zone 4", real: "Barrel4", set: "Barrel4" },
            { zone: "Zone 5", real: "Barrel5", set: "Barrel5" },
            { zone: "Zone 6", real: "Barrel6", set: "Barrel6" },
            { zone: "Hopper", real: "HopperReal", set: "HopperSet" },
          ].map((z) => (
            <div key={z.zone} className="border p-2">
              <div className="font-semibold">{z.zone}</div>
              <Input
                label="Real"
                fieldKey={z.real}
                values={values}
                actDraft={actDraft}
                stdDraft={stdDraft}
                onStdChange={handleStdChange}
                onStdSave={saveStdField}
                onActChange={handleActChange}
                onActSave={saveActField}
                savingKey={savingKey}
              />
              <Input
                label="Set"
                fieldKey={z.set}
                values={values}
                stdDraft={stdDraft}
                actDraft={actDraft}
                onStdChange={handleStdChange}
                onStdSave={saveStdField}
                onActChange={handleActChange}
                onActSave={saveActField}
                savingKey={savingKey}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="EJECTOR FWD">
        <Row
          labels={["S1", "SE"]}
          type="triple"
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={handleStdChange}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            S1: ["Forward1To", "Forward1Velo", "Forward1Press"],
            SE: ["Forward2To", "Forward2Velo", "Forward2Press"],
          }}
        />
      </Section>

      <Section title="EJECTOR BWD">
        <Row
          labels={["SE", "S1"]}
          type="triple"
          values={values}
          stdDraft={stdDraft}
          actDraft={actDraft}
          onStdChange={handleStdChange}
          onActChange={handleActChange}
          onStdSave={saveStdField}
          onActSave={saveActField}
          savingKey={savingKey}
          keyMap={{
            SE: ["Backward2To", "Backward2Velo", "Backward2Press"],
            S1: ["Backward1To", "Backward1Velo", "Backward1Press"],
          }}
        />
      </Section>

      <Section title="AIR BLOW">
        <div className="grid grid-cols-3 gap-2">
          <Input label="Blow start" pair fieldKey="AirBlowStart" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onActChange={handleActChange} savingKey={savingKey} />
          <Input label="Blow delay" pair fieldKey="AirBlowDelay" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onActChange={handleActChange} savingKey={savingKey} />
          <Input label="Blow time" pair fieldKey="AirBlowTime" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onActChange={handleActChange} savingKey={savingKey} />
          <Input label="Blow count" pair fieldKey="AirBlowCount" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onActChange={handleActChange} savingKey={savingKey} />
          <Input label="Star post" pair fieldKey="AirBlowStarPost" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onActChange={handleActChange} savingKey={savingKey} />
          <Input label="Male/Female" pair fieldKey="AirBlowMaleFemale" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onActChange={handleActChange} savingKey={savingKey} />
        </div>
      </Section>

      <Section title="CORE">
        <div className="grid grid-cols-3 gap-2">
          <Input label="Core Mode" pair values={values} stdDraft={stdDraft} actDraft={actDraft} savingKey={savingKey} />
          <Input label="Core Move" pair values={values} stdDraft={stdDraft} actDraft={actDraft} savingKey={savingKey} />
          <Input label="Mold pos" pair values={values} stdDraft={stdDraft} actDraft={actDraft} savingKey={savingKey} />
          <Input label="Delay Time" pair values={values} stdDraft={stdDraft} actDraft={actDraft} savingKey={savingKey} />
          <Input label="Press" pair values={values} stdDraft={stdDraft} actDraft={actDraft} savingKey={savingKey} />
          <Input label="Flow" pair values={values} stdDraft={stdDraft} actDraft={actDraft} savingKey={savingKey} />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="CUSSION" className="mb-0 h-full">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Cussion" fieldKey="Thickness" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
            <Input label="Act Inj Time" fieldKey="InjectTime" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
          </div>
        </Section>
        <Section title="Cooling Time" className="mb-0 h-full">
          <div className="grid grid-cols-1 gap-2">
            <Input label="Cooling Time" fieldKey="CoolingTime" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
          </div>
        </Section>
        <Section title="V/P" className="mb-0 h-full">
          <div className="grid grid-cols-2 gap-2">
            <Input label="V/P Position" fieldKey="VPPositionText" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
            <Input label="V/P Time" fieldKey="VPTimeText" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
            <Input label="V/P Posn" fieldKey="VPPosnText" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
          </div>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Section title="Suckback Beg. Charg" className="mb-0 h-full">
          <div className="grid grid-cols-1 gap-2">
            <Input label="" pair fieldKey="Plasticise1Press" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
            <Input label="" pair fieldKey="Plasticise1Velo" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
          </div>
        </Section>
        <Section title="Suckback Aft. Charg" className="mb-0 h-full">
          <div className="grid grid-cols-1 gap-2">
            <Input label="" pair fieldKey="AfterPlasticisePress" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
            <Input label="" pair fieldKey="AfterPlasticiseVelo" values={values} stdDraft={stdDraft} actDraft={actDraft} onStdChange={handleStdChange} onStdSave={saveStdField} onActChange={handleActChange} onActSave={saveActField} savingKey={savingKey} />
          </div>
        </Section>
      </div>

      <Section title="BERAT UNIT">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <Input
              key={i}
              label={`${i + 1}`}
              pair={false}
              fieldKey={`BeratUnit${i + 1}`}
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={handleStdChange}
              onActChange={handleActChange}
              savingKey={savingKey}
            />
          ))}
        </div>
      </Section>

      <Section title="HEATER CONTROL">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <Input
              key={i}
              label={`${i + 1}`}
              pair={false}
              fieldKey={`HeaterControl${i + 1}`}
              values={values}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={handleStdChange}
              onActChange={handleActChange}
              savingKey={savingKey}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, className }: SectionProps) {
  return (
    <div className={`border-2 border-gray-400 rounded-xl p-4 mb-4 bg-white shadow-sm ${className ?? ""}`}>
      <h2 className="font-bold mb-3 bg-gray-100 border border-gray-300 rounded-md px-3 py-2">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: SectionProps) {
  return (
    <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-3 mb-3">
      <h3 className="font-semibold mb-2 bg-white border border-gray-200 rounded-md px-2 py-1">{title}</h3>
      {children}
    </div>
  );
}

function Row({
  labels,
  type,
  fields,
  keyMap,
  values,
  stdDraft,
  actDraft,
  onStdChange,
  onStdSave,
  onActChange,
  onActSave,
  savingKey,
  savingField,
}: RowProps & Pick<InputProps, "stdDraft" | "actDraft" | "onStdChange" | "onStdSave" | "onActChange" | "onActSave" | "savingKey" | "savingField">) {
  const tripleFields = fields ?? ["Position", "Speed", "Pressure"];
  const rowFields = type === "triple" ? tripleFields : ["Position", "Speed"];

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
      {labels.map((label) => (
        <div key={label} className="border-2 border-gray-500 rounded-md p-2 bg-white">
          <div className="font-semibold mb-1 text-center">{label}</div>
          {rowFields.map((field, idx) => (
            <Input
              key={`${label}-${field}`}
              label={field}
              pair
              values={values}
              fieldKey={keyMap?.[label]?.[idx] ?? null}
              stdDraft={stdDraft}
              actDraft={actDraft}
              onStdChange={onStdChange}
              onStdSave={onStdSave}
              onActChange={onActChange}
              onActSave={onActSave}
              savingKey={savingKey}
              savingField={savingField}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Input({
  label,
  pair,
  fieldKey,
  values,
  stdDraft,
  actDraft,
  onStdChange,
  onStdSave,
  onActChange,
  onActSave,
  savingKey,
  savingField,
}: InputProps) {
  const hasLabel = Boolean(label);
  const stdValue = fieldKey ? ((stdDraft?.[fieldKey]) ?? fmt(values[fieldKey]?.std)) : "";
  const actValue = fieldKey ? ((actDraft?.[fieldKey]) ?? fmt(values[fieldKey]?.act)) : "";
  const currentSavingKey = savingKey ?? savingField ?? null;
  const isSavingStd = fieldKey ? currentSavingKey === `std:${fieldKey}` : false;
  const isSavingAct = fieldKey ? currentSavingKey === `actual:${fieldKey}` || currentSavingKey === fieldKey : false;

  return (
    <div className="flex flex-col mb-1">
      {!pair && hasLabel && <label className="text-xs">{label}</label>}
      {pair ? (
        <div className="grid grid-cols-2 gap-1">
          <div className="flex flex-col">
            <span className="text-[10px] leading-3">{hasLabel ? `${label} Std` : "Std"}</span>
            <div className="flex gap-1">
              <input
                value={stdValue}
                onChange={(e) => {
                  if (!fieldKey || !onStdChange) return;
                  onStdChange(fieldKey, e.target.value);
                }}
                className="border px-1 py-0.5 rounded w-full bg-white"
              />
              {fieldKey && onStdSave && ENABLE_PER_FIELD_SAVE && (
                <button
                  type="button"
                  onClick={() => onStdSave(fieldKey)}
                  disabled={isSavingStd}
                  className="px-2 py-0.5 text-[10px] rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  {isSavingStd ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] leading-3">{hasLabel ? `${label} Act` : "Act"}</span>
            <div className="flex gap-1">
              <input
                value={actValue}
                onChange={(e) => {
                  if (!fieldKey || !onActChange) return;
                  onActChange(fieldKey, e.target.value);
                }}
                className="border px-1 py-0.5 rounded w-full"
              />
              {fieldKey && onActSave && ENABLE_PER_FIELD_SAVE && (
                <button
                  type="button"
                  onClick={() => onActSave(fieldKey)}
                  disabled={isSavingAct}
                  className="px-2 py-0.5 text-[10px] rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  {isSavingAct ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          <input
            value={stdValue}
            onChange={(e) => {
              if (!fieldKey || !onStdChange) return;
              onStdChange(fieldKey, e.target.value);
            }}
            className="border px-1 py-0.5 rounded w-full bg-white"
          />
          {fieldKey && onStdSave && ENABLE_PER_FIELD_SAVE && (
            <button
              type="button"
              onClick={() => onStdSave(fieldKey)}
              disabled={isSavingStd}
              className="px-2 py-0.5 text-[10px] rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              {isSavingStd ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
