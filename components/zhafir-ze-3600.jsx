import React from "react";

export default function ZhafirParameterForm() {
  return (
    <div className="p-6 text-sm">

      {/* ================= INJECTION ================= */}
      <Section title="INJECT">
        <Row labels={["SE", "S4", "S3", "S2", "S1", "SB"]} type="triple" />
      </Section>

      {/* ================= HOLDING ================= */}
      <Section title="HOLDING">
        <Row labels={["P3", "P2", "P1"]} type="triple" />
      </Section>

      {/* ================= CHARGING ================= */}
      <Section title="CHARGING">
        <Row labels={["S1", "S2", "SE"]} type="triple" />
      </Section>

      {/* ================= CLAMP / MOLD ================= */}
      <Section title="CLAMP / MOLD">
        <SubSection title="Close Mold">
          <Row labels={["S0", "S1", "S2", "S3", "LP", "SE"]} type="double" />
        </SubSection>

        <SubSection title="Open Mold">
          <Row labels={["SE", "S5", "S4", "S3", "S2", "S1"]} type="double" />
        </SubSection>
      </Section>

      {/* ================= TEMPERATURE ================= */}
      <Section title="TEMPERATURE">
        <div className="grid grid-cols-9 gap-2">
          {[
            "Zone 1",
            "Zone 2",
            "Zone 3",
            "Zone 4",
            "Zone 5",
            "Zone 6",
            "Hopper",
          ].map((z) => (
            <div key={z} className="border p-2">
              <div className="font-semibold">{z}</div>
              <Input label="Real" />
              <Input label="Set" />
            </div>
          ))}
        </div>
      </Section>

      {/* ================= EJECTOR ================= */}
      <Section title="EJECTOR FWD">
        <Row labels={["S1", "SE"]} type="triple" />
      </Section>

      <Section title="EJECTOR BWD">
        <Row labels={["SE", "S1"]} type="triple" />
      </Section>

      {/* ================= AIR BLOW ================= */}
      <Section title="AIR BLOW">
        <div className="grid grid-cols-6 gap-2">
          <Input label="Blow start" />
          <Input label="Blow delay" />
          <Input label="Blow time" />
          <Input label="Blow count" />
          <Input label="Star post" />
          <Input label="Male/Female" />
        </div>
      </Section>

      {/* ================= CORE ================= */}
      <Section title="CORE">
        <div className="grid grid-cols-6 gap-2">
          <Input label="Core Mode" />
          <Input label="Core Move" />
          <Input label="Mold pos" />
          <Input label="Delay Time" />
          <Input label="Press" />
          <Input label="Flow" />
        </div>
      </Section>

      {/* ================= CUSHION ================= */}
      <Section title="CUSHION">
        <Input label="Cushion" />
        <Input label="Act Inj Time" />
      </Section>

      {/* ================= BERAT UNIT ================= */}
      <Section title="BERAT UNIT">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <Input key={i} label={`${i + 1}`} />
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div className="border rounded-xl p-4 mb-4">
      <h2 className="font-bold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="border p-3 mb-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Row({ labels, type }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
      {labels.map((label) => (
        <div key={label} className="border p-2">
          <div className="font-semibold mb-1 text-center">{label}</div>
          {type === "triple" && (
            <>
              <Input label="Pos" />
              <Input label="Speed" />
              <Input label="Pressure" />
            </>
          )}
          {type === "double" && (
            <>
              <Input label="Position" />
              <Input label="Speed" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Input({ label }) {
  return (
    <div className="flex flex-col mb-1">
      <label className="text-xs">{label}</label>
      <input className="border px-1 py-0.5 rounded" />
    </div>
  );
}
