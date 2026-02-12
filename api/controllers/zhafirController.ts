import { queryDatabase } from '../utils/queryDatabase';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const ZHAFIR_SECTIONS = {
  inject: ['Inject1Press', 'Inject1To', 'Inject1Velo', 'Inject2Press', 'Inject2To', 'Inject2Velo', 'Inject3Press', 'Inject3To', 'Inject3Velo', 'Inject4Press', 'Inject4Velo', 'InjectScrewPosition', 'InjectTime', 'InjectionPressure', 'InjectSEPosition', 'InjectS1Speed', 'InjectSBPosition', 'InjectSBSpeed', 'InjectSBPressure'],
  holding: ['Hold1Press', 'Hold1To', 'Hold1Velo', 'Hold2Press', 'Hold2To', 'Hold2Velo', 'Hold3Press', 'Hold3To', 'Hold3Velo'],
  charging: ['Plasticise1To', 'Plasticise1Velo', 'Plasticise1Press', 'AfterPlasticisePress', 'AfterPlasticiseTime', 'AfterPlasticiseVelo', 'Plasticise1BackPress', 'Plasticise2To', 'Plasticise2Velo', 'Plasticise2Press', 'AfterPlasticisePosition', 'AfterPlasticiseSpeed', 'AfterPlasticiseBackPress'],
  clamp_mold: ['Close1Press', 'Close1To', 'Close1Velo', 'Close2Press', 'Close2To', 'Close2Velo', 'ProtectPress', 'ProtectTo', 'ProtectVelo', 'HiPressPress', 'HiPressVelo', 'MoldProtectionTime', 'Open1Press', 'Open1To', 'Open1Velo', 'Open2Press', 'Open2To', 'Open2Velo', 'Open3Press', 'Open3To', 'Open3Velo', 'Open4Press', 'Open4To', 'Open4Velo', 'Close0To', 'Close0Velo', 'CloseLPTo', 'CloseLPVelo', 'CloseHPTo', 'CloseHPVelo', 'CloseSETo', 'CloseSEVelo', 'OpenS5To', 'OpenS5Velo', 'OpenS4To', 'OpenS4Velo'],
  temperature: ['Nozzle', 'Barrel1', 'Barrel2', 'Barrel3', 'Barrel4', 'Barrel5', 'Barrel6', 'HopperReal', 'HopperSet'],
  ejector_core: ['EjectorMode', 'Forward1Press', 'Forward1To', 'Forward1Velo', 'Forward2Press', 'Forward2To', 'Forward2Velo', 'Backward1Press', 'Backward1To', 'Backward1Velo', 'Backward2Press', 'Backward2To', 'Backward2Velo'],
  cushion_vp: ['Thickness', 'CycleTime', 'Tonase', 'CoolingTime', 'Cavity'],
  air_blow: ['AirBlowStart', 'AirBlowDelay', 'AirBlowTime', 'AirBlowCount', 'AirBlowStarPost', 'AirBlowMaleFemale'],
  vp_text: ['VPPositionText', 'VPTimeText', 'VPPosnText'],
  berat_unit: Array.from({ length: 16 }, (_, i) => `BeratUnit${i + 1}`),
  heater_control: Array.from({ length: 14 }, (_, i) => `HeaterControl${i + 1}`),
} as const;

type ZhafirSectionKey = keyof typeof ZHAFIR_SECTIONS;

const ZHAFIR_META_FIELDS = ['MchID', 'MoldID'] as const;
const ZHAFIR_ALL_COLUMNS = Array.from(
  new Set([
    ...Object.values(ZHAFIR_SECTIONS).flat(),
    ...ZHAFIR_META_FIELDS,
  ]),
);

// INJECT table
const ACT_INJECT: Record<string, number> = {
  Inject1Press: 120.0, // Pressure S1
  Inject2Press: 145.0, // Pressure S2
  Inject3Press: 145.0, // Pressure S3
  Inject4Press: 0.0,   // Pressure SE
  Inject1To: 450.0,    // Position S1
  Inject2To: 350.0,    // Position S2
  Inject3To: 200.0,    // Position S3
  Inject1Velo: 18.0,   // Speed S1
  Inject2Velo: 55.0,   // Speed S2
  Inject3Velo: 45.0,   // Speed S3
  Inject4Velo: 15.0,   // Speed SE
  InjectScrewPosition: 15.0,
  InjectTime: 3.586,
  InjectionPressure: 95.0,
  InjectSEPosition: 0.0,
  InjectS1Speed: 0.0,
  InjectSBPosition: 0.0,
  InjectSBSpeed: 0.0,
  InjectSBPressure: 0.0,
};

// HOLDING table
const ACT_HOLDING: Record<string, number> = {
  Hold1Press: 62.0, // P1
  Hold2Press: 55.0, // P2
  Hold3Press: 10.0, // P3
  Hold1To: 1.3,     // Time P1
  Hold2To: 0.8,     // Time P2
  Hold3To: 3.0,     // Time P3
  Hold1Velo: 50.0,
  Hold2Velo: 45.0,
  Hold3Velo: 30.0,
};

// CHARGING table
const ACT_CHARGING: Record<string, number> = {
  Plasticise1To: 54.2,      // Position S1
  Plasticise1Velo: 18.0,    // Speed S1
  Plasticise1Press: 100.0,  // Pressure S1
  AfterPlasticisePress: 95.0,
  AfterPlasticiseTime: 2.895,
  AfterPlasticiseVelo: 50.0,
  Plasticise1BackPress: 90.0,
  Plasticise2To: 35.0,
  Plasticise2Velo: 12.0,
  Plasticise2Press: 80.0,
  AfterPlasticisePosition: 0.0,
  AfterPlasticiseSpeed: 0.0,
  AfterPlasticiseBackPress: 0.0,
};

// CLAMP / MOLD table
const ACT_CLAMP_MOLD: Record<string, number> = {
  Close1Press: 0.0,
  Close2Press: 0.0,
  ProtectPress: 0.0,
  HiPressPress: 0.0,
  Close1To: 5.0,        // Close Position S1
  Close2To: 185.0,      // Close Position S2
  ProtectTo: 169.99,    // Close Position S3
  Open1To: 1.0,         // Open Position S1
  Open2To: 20.0,        // Open Position S2
  Open3To: 29.0,        // Open Position S3
  Open4To: 40.0,        // Open Position SE
  Close1Velo: 10.0,
  Close2Velo: 60.0,
  ProtectVelo: 40.0,
  HiPressVelo: 43.0,
  Open1Velo: 17.0,
  Open2Velo: 25.0,
  Open3Velo: 25.0,
  Open4Velo: 25.0,
  Open1Press: 0.0,
  Open2Press: 0.0,
  Open3Press: 0.0,
  Open4Press: 0.0,
  MoldProtectionTime: 0.5,
  Close0To: 0.0,
  Close0Velo: 0.0,
  CloseLPTo: 0.0,
  CloseLPVelo: 0.0,
  CloseHPTo: 0.0,
  CloseHPVelo: 0.0,
  CloseSETo: 0.0,
  CloseSEVelo: 0.0,
  OpenS5To: 0.0,
  OpenS5Velo: 0.0,
  OpenS4To: 0.0,
  OpenS4Velo: 0.0,
};

// TEMPERATURE table
const ACT_TEMPERATURE: Record<string, number> = {
  Nozzle: 220.0,
  Barrel1: 220.0,
  Barrel2: 215.0,
  Barrel3: 210.0,
  Barrel4: 205.0,
  Barrel5: 200.0,
  Barrel6: 195.0,
  HopperReal: 80.0,
  HopperSet: 75.0,
};

// EJECTOR table (FWD + BWD + CORE mode)
const ACT_EJECTOR_CORE: Record<string, number> = {
  EjectorMode: 0.0,
  Forward1Press: 12.0,
  Forward2Press: 0.0,
  Forward1To: 20.0,
  Forward2To: 20.0,
  Forward1Velo: 65.0,
  Forward2Velo: 50.0,
  Backward1Press: 17.0,
  Backward2Press: 0.0,
  Backward1To: 20.0,
  Backward2To: 20.0,
  Backward1Velo: 50.0,
  Backward2Velo: 10.0,
};

// CUSSION / V-P / Cooling table
const ACT_CUSHION_VP: Record<string, number> = {
  Thickness: 7.146,   // Cussion
  CycleTime: 40.523,
  Tonase: 32.0,
  CoolingTime: 19.0,
  Cavity: 1,
};

const ACT_AIR_BLOW: Record<string, string | number> = {
  AirBlowStart: 'AUTO',
  AirBlowDelay: 4.0,
  AirBlowTime: 2.5,
  AirBlowCount: 1,
  AirBlowStarPost: 0,
  AirBlowMaleFemale: 'MALE',
};

const ACT_VP_TEXT: Record<string, string> = {
  VPPositionText: 'POS-A',
  VPTimeText: 'TIME-A',
  VPPosnText: 'POSN-A',
};

const ACT_BERAT_UNIT: Record<string, number> = Object.fromEntries(
  Array.from({ length: 16 }, (_, i) => [`BeratUnit${i + 1}`, 0]),
) as Record<string, number>;

const ACT_HEATER_CONTROL: Record<string, number> = Object.fromEntries(
  Array.from({ length: 14 }, (_, i) => [`HeaterControl${i + 1}`, 0]),
) as Record<string, number>;

const HARD_CODED_ACT_VALUES: Record<string, string | number> = {
  ...ACT_INJECT,
  ...ACT_HOLDING,
  ...ACT_CHARGING,
  ...ACT_CLAMP_MOLD,
  ...ACT_TEMPERATURE,
  ...ACT_EJECTOR_CORE,
  ...ACT_CUSHION_VP,
  ...ACT_AIR_BLOW,
  ...ACT_VP_TEXT,
  ...ACT_BERAT_UNIT,
  ...ACT_HEATER_CONTROL,
};

const STRING_VALUE_FIELDS = new Set([
  'AirBlowStart',
  'VPPositionText',
  'VPTimeText',
  'VPPosnText',
  'AirBlowMaleFemale',
]);

const ALLOWED_HARD_CODED_ACT_FIELDS = new Set(Object.keys(HARD_CODED_ACT_VALUES));
const HARD_CODED_STORE_PATH = path.join(process.cwd(), 'api', 'data', 'zhafir-hardcoded.json');
let hardCodedActRuntimeValues: Record<string, string | number> = { ...HARD_CODED_ACT_VALUES };
let hardCodedStdRuntimeValues: Record<string, string | number> = Object.fromEntries(
  Object.entries(HARD_CODED_ACT_VALUES).map(([key, value]) =>
    [key, typeof value === 'number' ? value - 3 : `${value}`],
  ),
);

function saveRuntimeValuesToFile() {
  const dir = path.dirname(HARD_CODED_STORE_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(
    HARD_CODED_STORE_PATH,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        std: hardCodedStdRuntimeValues,
        act: hardCodedActRuntimeValues,
      },
      null,
      2,
    ),
    'utf-8',
  );
}

function loadRuntimeValuesFromFile() {
  if (!existsSync(HARD_CODED_STORE_PATH)) return;
  try {
    const raw = readFileSync(HARD_CODED_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as {
      std?: Record<string, string | number>;
      act?: Record<string, string | number>;
    };
    if (parsed.act) {
      hardCodedActRuntimeValues = {
        ...hardCodedActRuntimeValues,
        ...parsed.act,
      };
    }
    if (parsed.std) {
      hardCodedStdRuntimeValues = {
        ...hardCodedStdRuntimeValues,
        ...parsed.std,
      };
    }
  } catch (error) {
    console.error('Failed to load zhafir hardcoded file:', error);
  }
}

loadRuntimeValuesFromFile();

function resolveColumns(section?: string): string[] {
  if (!section) return ZHAFIR_ALL_COLUMNS;
  if (!(section in ZHAFIR_SECTIONS)) {
    throw new Error(`Invalid section "${section}".`);
  }
  return [...ZHAFIR_SECTIONS[section as ZhafirSectionKey], ...ZHAFIR_META_FIELDS];
}

function normalizePayload(
  payload: Record<string, unknown>,
  allowedColumns: string[],
) {
  const result: Record<string, string | number | null> = {};

  for (const key of allowedColumns) {
    if (!(key in payload)) continue;

    const rawValue = payload[key];
    if (rawValue === '' || rawValue === null) {
      result[key] = null;
      continue;
    }

    if (rawValue === undefined) continue;

    if ((ZHAFIR_META_FIELDS as readonly string[]).includes(key)) {
      result[key] = String(rawValue);
      continue;
    }

    const asNumber = Number(rawValue);
    if (Number.isNaN(asNumber)) {
      throw new Error(`Field "${key}" must be numeric.`);
    }
    result[key] = asNumber;
  }

  return result;
}

function createStdActMap(stdRow: Record<string, any> | undefined, actualRow: Record<string, any> | undefined, section?: string) {
  const columns = resolveColumns(section);
  const fields = columns.filter((c) => !(ZHAFIR_META_FIELDS as readonly string[]).includes(c));

  const values: Record<string, { std: number | string | null; act: number | string | null }> = {};
  for (const field of fields) {
    values[field] = {
      std: stdRow?.[field] ?? null,
      act: actualRow?.[field] ?? null,
    };
  }

  return values;
}

export function getZhafirSections() {
  return Object.entries(ZHAFIR_SECTIONS).map(([section, columns]) => ({
    section,
    columns,
  }));
}

export function getZhafirQueryTemplates(section?: string) {
  const columns = resolveColumns(section);
  const queryColumns = columns.join(', ');

  return {
    selectStd: `SELECT TOP 1 ParaID, ParaDate, ${queryColumns} FROM IoT.dbo.ParaSetMST WHERE ParaID = @ParaID ORDER BY ParaDate DESC;`,
    selectActual: `SELECT TOP 1 ParaID, SettingDate, ${queryColumns} FROM IoT.dbo.ParaSetTRX WHERE ParaID = @ParaID ORDER BY SettingDate DESC;`,
    upsertStd: [
      'IF EXISTS (SELECT 1 FROM IoT.dbo.ParaSetMST WHERE ParaID = @ParaID)',
      'BEGIN',
      '  UPDATE IoT.dbo.ParaSetMST SET /* isi field */ ParaDate = GETDATE(), Active = 1 WHERE ParaID = @ParaID;',
      'END',
      'ELSE',
      'BEGIN',
      '  INSERT INTO IoT.dbo.ParaSetMST (ParaID, ParaDate, Active, /* field */)',
      '  VALUES (@ParaID, GETDATE(), 1, /* value */);',
      'END;',
    ].join('\n'),
    insertActual: `INSERT INTO IoT.dbo.ParaSetTRX (ParaID, SettingDate, Active, /* field */) VALUES (@ParaID, GETDATE(), 1, /* value */);`,
  };
}

export async function getZhafirStdActByParaId(paraId: string, section?: string) {
  // Temporary behavior:
  // - Hardcoded data is exposed as ACT values
  // - STD is editable runtime values (default initialized from ACT-3)
  const actual = hardCodedActRuntimeValues;
  const std = hardCodedStdRuntimeValues;

  return {
    paraId,
    section: section || 'all',
    stdDate: new Date().toISOString(),
    actualDate: new Date().toISOString(),
    meta: {
      MchID: 'ZE-3600',
      MoldID: 'MOLD-DUMMY',
    },
    values: createStdActMap(std, actual, section),
  };
}

export function updateHardcodedActField(field: string, value: number | string) {
  if (!ALLOWED_HARD_CODED_ACT_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not supported for manual ACT update.`);
  }

  const parsedValue = STRING_VALUE_FIELDS.has(field) ? String(value) : Number(value);
  if (!STRING_VALUE_FIELDS.has(field) && Number.isNaN(parsedValue)) {
    throw new Error(`Field "${field}" must be numeric.`);
  }

  hardCodedActRuntimeValues = {
    ...hardCodedActRuntimeValues,
    [field]: parsedValue,
  };
  saveRuntimeValuesToFile();

  return {
    field,
    value: hardCodedActRuntimeValues[field],
    message: 'Hardcoded ACT value updated',
  };
}

export function updateHardcodedStdField(field: string, value: number | string) {
  if (!ALLOWED_HARD_CODED_ACT_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not supported for manual STD update.`);
  }

  const parsedValue = STRING_VALUE_FIELDS.has(field) ? String(value) : Number(value);
  if (!STRING_VALUE_FIELDS.has(field) && Number.isNaN(parsedValue)) {
    throw new Error(`Field "${field}" must be numeric.`);
  }

  hardCodedStdRuntimeValues = {
    ...hardCodedStdRuntimeValues,
    [field]: parsedValue,
  };
  saveRuntimeValuesToFile();

  return {
    field,
    value: hardCodedStdRuntimeValues[field],
    message: 'Hardcoded STD value updated',
  };
}

export function updateHardcodedBulk(payload: {
  std?: Record<string, number | string>;
  act?: Record<string, number | string>;
}) {
  const stdEntries = Object.entries(payload.std || {});
  const actEntries = Object.entries(payload.act || {});

  for (const [field, valueRaw] of stdEntries) {
    const value = STRING_VALUE_FIELDS.has(field) ? String(valueRaw) : Number(valueRaw);
    updateHardcodedStdField(field, value);
  }

  for (const [field, valueRaw] of actEntries) {
    const value = STRING_VALUE_FIELDS.has(field) ? String(valueRaw) : Number(valueRaw);
    updateHardcodedActField(field, value);
  }
  saveRuntimeValuesToFile();

  return {
    message: 'Hardcoded STD/ACT bulk updated',
    updatedStdCount: stdEntries.length,
    updatedActCount: actEntries.length,
  };
}

export async function upsertZhafirStd(
  paraId: string,
  payload: Record<string, unknown>,
  section?: string,
) {
  const columns = resolveColumns(section);
  const allowedPayload = normalizePayload(payload, columns);
  const payloadKeys = Object.keys(allowedPayload);

  const setClauses = ['ParaDate = GETDATE()', 'Active = 1'];
  const insertColumns = ['ParaID', 'ParaDate', 'Active'];
  const insertValues = ['@ParaID', 'GETDATE()', '1'];

  for (const key of payloadKeys) {
    setClauses.push(`${key} = @${key}`);
    insertColumns.push(key);
    insertValues.push(`@${key}`);
  }

  const sqlQuery = `
    IF EXISTS (SELECT 1 FROM IoT.dbo.ParaSetMST WHERE ParaID = @ParaID)
    BEGIN
      UPDATE IoT.dbo.ParaSetMST
      SET ${setClauses.join(', ')}
      WHERE ParaID = @ParaID;
    END
    ELSE
    BEGIN
      INSERT INTO IoT.dbo.ParaSetMST (${insertColumns.join(', ')})
      VALUES (${insertValues.join(', ')});
    END
  `;

  await queryDatabase(sqlQuery, { ParaID: paraId, ...allowedPayload });
  return {
    message: 'STD parameters saved',
    paraId,
    section: section || 'all',
    savedColumns: payloadKeys,
  };
}

export async function insertZhafirActual(
  paraId: string,
  payload: Record<string, unknown>,
  section?: string,
) {
  const columns = resolveColumns(section);
  const allowedPayload = normalizePayload(payload, columns);
  const payloadKeys = Object.keys(allowedPayload);

  const insertColumns = ['ParaID', 'SettingDate', 'Active', ...payloadKeys];
  const insertValues = ['@ParaID', 'GETDATE()', '1', ...payloadKeys.map((key) => `@${key}`)];

  const sqlQuery = `
    INSERT INTO IoT.dbo.ParaSetTRX (${insertColumns.join(', ')})
    VALUES (${insertValues.join(', ')})
  `;

  await queryDatabase(sqlQuery, { ParaID: paraId, ...allowedPayload });
  return {
    message: 'ACT parameters saved',
    paraId,
    section: section || 'all',
    savedColumns: payloadKeys,
  };
}
