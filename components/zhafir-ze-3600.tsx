import React from "react";

type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

type RowProps = {
  labels: string[];
  type: "triple" | "double";
  fields?: string[];
};

type InputProps = {
  label?: string;
  pair?: boolean;
};

export default function ZhafirParameterForm() {
  return (
    <div className="p-6 text-sm">
      {/* ================= INJECTION ================= */}
      <Section title="INJECT">
        <Row labels={["SE", "S4", "S3", "S2", "S1", "SB"]} type="triple" />
      </Section>

      {/* ================= HOLDING ================= */}
      <Section title="HOLDING">
        <Row
          labels={["P3", "P2", "P1"]}
          type="triple"
          fields={["Pressure", "Time", "Hold Speed"]}
        />
      </Section>

      {/* ================= CHARGING ================= */}
      <Section title="CHARGING">
        <Row
          labels={["S1", "S2", "SE"]}
          type="triple"
          fields={["Position", "Speed", "Pressure", "Back Press"]}
        />
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
        <div className="grid grid-cols-3 gap-2">
          <Input label="Blow start" pair />
          <Input label="Blow delay" pair />
          <Input label="Blow time" pair />
          <Input label="Blow count" pair />
          <Input label="Star post" pair />
          <Input label="Male/Female" pair />
        </div>
      </Section>

      {/* ================= CORE ================= */}
      <Section title="CORE">
        <div className="grid grid-cols-3 gap-2">
          <Input label="Core Mode" pair />
          <Input label="Core Move" pair />
          <Input label="Mold pos" pair />
          <Input label="Delay Time" pair />
          <Input label="Press" pair />
          <Input label="Flow" pair />
        </div>
      </Section>

      {/* ================= CUSHION + V/P ================= */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="CUSSION" className="mb-0 h-full">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Cussion" />
            <Input label="Act Inj Time" />
          </div>
        </Section>
        <Section title="Cooling Time" className="mb-0 h-full">
          <div className="grid grid-cols-1 gap-2">
            <Input label="Cooling Time" />
          </div>
        </Section>
        <Section title="V/P" className="mb-0 h-full">
          <div className="grid grid-cols-2 gap-2">
            <Input label="V/P Position" />
            <Input label="V/P Time" />
            <Input label="V/P Posn" />
          </div>
        </Section>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Section title="Suckback Beg. Charg" className="mb-0 h-full">
          <div className="grid grid-cols-1 gap-2">
            <Input label="" pair />
            <Input label="" pair />
          </div>
        </Section>
        <Section title="Suckback Aft. Charg" className="mb-0 h-full">
          <div className="grid grid-cols-1 gap-2">
            <Input label="" pair />
            <Input label="" pair />
          </div>
        </Section>
      </div>

      {/* ================= BERAT UNIT ================= */}
      <Section title="BERAT UNIT">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <Input key={i} label={`${i + 1}`} />
          ))}
        </div>
      </Section>

      {/* ================= HEATER CONTROL ================= */}
      <Section title="HEATER CONTROL">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <Input key={i} label={`${i + 1}`} />
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function Section({ title, children, className }: SectionProps) {
  return (
    <div
      className={`border-2 border-gray-400 rounded-xl p-4 mb-4 bg-white shadow-sm ${className ?? ""}`}
    >
      <h2 className="font-bold mb-3 bg-gray-100 border border-gray-300 rounded-md px-3 py-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: SectionProps) {
  return (
    <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-3 mb-3">
      <h3 className="font-semibold mb-2 bg-white border border-gray-200 rounded-md px-2 py-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ labels, type, fields }: RowProps) {
  const tripleFields = fields ?? ["Position", "Speed", "Pressure"];
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}
    >
      {labels.map((label) => (
        <div key={label} className="border-2 border-gray-500 rounded-md p-2 bg-white">
          <div className="font-semibold mb-1 text-center">{label}</div>
          {type === "triple" && (
            <>
              {tripleFields.map((field) => (
                <Input key={field} label={field} pair />
              ))}
            </>
          )}
          {type === "double" && (
            <>
              <Input label="Position" pair />
              <Input label="Speed" pair />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Input({ label, pair }: InputProps) {
  const hasLabel = Boolean(label);
  return (
    <div className="flex flex-col mb-1">
      {!pair && hasLabel && <label className="text-xs">{label}</label>}
      {pair ? (
        <div className="grid grid-cols-2 gap-1">
          <div className="flex flex-col">
            <span className="text-[10px] leading-3">{hasLabel ? `${label} Std` : "Std"}</span>
            <input className="border px-1 py-0.5 rounded" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] leading-3">{hasLabel ? `${label} Act` : "Act"}</span>
            <input className="border px-1 py-0.5 rounded" />
          </div>
        </div>
      ) : (
        <input className="border px-1 py-0.5 rounded" />
      )}
    </div>
  );
}
