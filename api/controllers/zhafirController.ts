import { queryDatabase } from '../utils/queryDatabase'
export async function getSettingPamzhafir() {
  const sqlQuery = `
    select * from dbo.MachineParameterSettingSTD
  `

  return await queryDatabase(sqlQuery)
}
export async function createSettingPamzhafir(data: {
  machineId: number
  material_Id: string
  material_name: string
  cavity: number
  paramset: any
}) {

  const sqlQuery = `
    INSERT INTO dbo.MachineParameterSettingSTD
    (machineId, material_Id, material_name, cavity, paramset)
    VALUES
    (@machineId, @material_Id, @material_name, @cavity, @paramset)
  `

  return await queryDatabase(sqlQuery, {
    machineId: data.machineId,
    material_Id: data.material_Id,
    material_name: data.material_name,
    cavity: data.cavity,

    // JSON disimpan sebagai string
    paramset: JSON.stringify(data.paramset)
  })
}

const ZHAFIR_SECTIONS = {
  inject: [
    'Inject1Press',
    'Inject1To',
    'Inject1Velo',
    'Inject2Press',
    'Inject2To',
    'Inject2Velo',
    'Inject3Press',
    'Inject3To',
    'Inject3Velo',
    'Inject4Press',
    'Inject4Velo',
    'InjectScrewPosition',
    'InjectTime',
    'InjectionPressure',
    'InjPeakPressure',
    'InjectSEPosition',
    'InjectS1Speed',
    'InjectSBPosition',
    'InjectSBSpeed',
    'InjectSBPressure',
  ],
  holding: [
    'Hold1Press',
    'Hold1To',
    'Hold1Velo',
    'Hold2Press',
    'Hold2To',
    'Hold2Velo',
    'Hold3Press',
    'Hold3To',
    'Hold3Velo',
  ],
  charging: [
    'Plasticise1To',
    'Plasticise1Velo',
    'Plasticise1Press',
    'AfterPlasticisePress',
    'AfterPlasticiseTime',
    'AfterPlasticiseVelo',
    'Plasticise1BackPress',
    'Plasticise2To',
    'Plasticise2Velo',
    'Plasticise2Press',
    'AfterPlasticisePosition',
    'AfterPlasticiseSpeed',
    'AfterPlasticiseBackPress',
  ],
  clamp_mold: [
    'Close1Press',
    'Close1To',
    'Close1Velo',
    'Close2Press',
    'Close2To',
    'Close2Velo',
    'ProtectPress',
    'ProtectTo',
    'ProtectVelo',
    'HiPressPress',
    'HiPressVelo',
    'MoldProtectionTime',
    'Open1Press',
    'Open1To',
    'Open1Velo',
    'Open2Press',
    'Open2To',
    'Open2Velo',
    'Open3Press',
    'Open3To',
    'Open3Velo',
    'Open4Press',
    'Open4To',
    'Open4Velo',
    'Close0To',
    'Close0Velo',
    'CloseLPTo',
    'CloseLPVelo',
    'CloseHPTo',
    'CloseHPVelo',
    'CloseSETo',
    'CloseSEVelo',
    'OpenS5To',
    'OpenS5Velo',
    'OpenS4To',
    'OpenS4Velo',
  ],
  temperature: [
    'Nozzle',
    'Barrel1',
    'Barrel2',
    'Barrel3',
    'Barrel4',
    'Barrel5',
    'Barrel6',
    'Temperature_Real_Zone1',
    'Temperature_Real_Zone2',
    'Temperature_Real_Zone3',
    'Temperature_Real_Zone4',
    'Temperature_Real_Zone5',
    'Temperature_Real_Zone6',
    'Temperature_Set_Zone1',
    'Temperature_Set_Zone2',
    'Temperature_Set_Zone3',
    'Temperature_Set_Zone4',
    'Temperature_Set_Zone5',
    'Temperature_Set_Zone6',
    'HopperReal',
    'HopperSet',
    'HopperMax',
    'HopperMin',
  ],
  ejector_core: [
    'EjectorMode',
    'Forward1Press',
    'Forward1To',
    'Forward1Velo',
    'Forward2Press',
    'Forward2To',
    'Forward2Velo',
    'Backward1Press',
    'Backward1To',
    'Backward1Velo',
    'Backward2Press',
    'Backward2To',
    'Backward2Velo',
  ],
  core_a: [
    'Core_In_Mode_A',
    'Core_Out_Mode_A',
    'Core_In_Mold_Position_A',
    'Core_Out_Mold_Position_A',
    'Core_In_Delay_Time_A',
    'Core_Out_Delay_Time_A',
    'Core_In_Time_A',
    'Core_Out_Time_A',
    'CoreA_In_Pressure',
    'CoreA_Out_Pressure',
    'CoreA_In_Flow',
    'CoreA_Out_Flow',
  ],
  core_b: [
    'Core_In_Mode_B',
    'Core_Out_Mode_B',
    'Core_In_Mold_Position_B',
    'Core_Out_Mold_Position_B',
    'Core_In_Delay_Time_B',
    'Core_Out_Delay_Time_B',
    'Core_In_Time_B',
    'Core_Out_Time_B',
    'CoreB_In_Pressure',
    'CoreB_Out_Pressure',
    'CoreB_In_Flow',
    'CoreB_Out_Flow',
  ],
  core_c: [
    'Core_In_Mode_C',
    'Core_Out_Mode_C',
    'Core_In_Mold_Position_C',
    'Core_Out_Mold_Position_C',
    'Core_In_Delay_Time_C',
    'Core_Out_Delay_Time_C',
    'Core_In_Time_C',
    'Core_Out_Time_C',
    'CoreC_In_Pressure',
    'CoreC_Out_Pressure',
    'CoreC_In_Flow',
    'CoreC_Out_Flow',
  ],
  core_d: [
    'Core_In_Mode_D',
    'Core_Out_Mode_D',
    'Core_In_Mold_Position_D',
    'Core_Out_Mold_Position_D',
    'Core_In_Delay_Time_D',
    'Core_Out_Delay_Time_D',
    'Core_In_Time_D',
    'Core_Out_Time_D',
    'CoreD_In_Pressure',
    'CoreD_Out_Pressure',
    'CoreD_In_Flow',
    'CoreD_Out_Flow',
  ],
  cushion_vp: ['Thickness', 'CycleTime', 'Tonase', 'CoolingTime', 'Cavity'],
  air_blow: [
    'AirBlowStart',
    'AirBlowDelay',
    'AirBlowTime',
    'AirBlowCount',
    'AirBlowStarPost',
    'AirBlowMaleFemale',
  ],
  vp_text: ['VPPositionText', 'VPTimeText', 'VPPosnText', 'CarriageBwd_SE'],
  berat_unit: Array.from({ length: 16 }, (_, i) => `BeratUnit${i + 1}`),
  heater_control: Array.from({ length: 14 }, (_, i) => `HeaterControl${i + 1}`),
} as const

type ZhafirSectionKey = keyof typeof ZHAFIR_SECTIONS

const ZHAFIR_META_FIELDS = ['MchID', 'MoldID'] as const
const ZHAFIR_ALL_COLUMNS = Array.from(
  new Set([...Object.values(ZHAFIR_SECTIONS).flat(), ...ZHAFIR_META_FIELDS])
)
const ZHAFIR_VALUE_FIELDS = ZHAFIR_ALL_COLUMNS.filter(
  (col) => !(ZHAFIR_META_FIELDS as readonly string[]).includes(col as any)
)

const STRING_VALUE_FIELDS = new Set([
  'AirBlowStart',
  'VPPositionText',
  'VPTimeText',
  'VPPosnText',
  'AirBlowMaleFemale',
])
const RANGE_TRACKED_FIELDS = new Set([
  'InjectScrewPosition',
  'InjPeakPressure',
  'VPTimeText',
  'VPPositionText',
  'Thickness',
  'CarriageBwd_SE',
])
const SUMMARY_RANGE_PARAMETER_MAP: Record<
  string,
  { minName: string; maxName: string }
> = {
  InjectScrewPosition: {
    minName: 'min_EndofPlast',
    maxName: 'max_EndofPlast',
  },
  InjPeakPressure: {
    minName: 'min_injpeakpress',
    maxName: 'max_injpeakpress',
  },
  VPTimeText: {
    minName: 'min_injTime',
    maxName: 'max_injTime',
  },
  VPPositionText: {
    minName: 'min_SwitchingPosition',
    maxName: 'max_SwitchingPosition',
  },
  Thickness: {
    minName: 'min_Cushion',
    maxName: 'max_Cushion',
  },
}

const ALLOWED_HARD_CODED_ACT_FIELDS = new Set(ZHAFIR_VALUE_FIELDS)
const MACHINE_STD_TABLE = 'IoT.dbo.MachineParameterSettingSTD'
const MACHINE_TRX_TABLE = 'IoT.dbo.MachineParameterSettingTRX'
const PARAMETER_SETTING_TABLE = 'IoT.dbo.parameter_setting'
const ZHAFIR_STYLE_PARAMETER_ID = 16
const ZHAFIR_STYLE_PARAMETER_NAME = 'colorParameter'
const PARASET_TRX_TABLE = 'ParaSetTRX'
let paraSetTrxColumnsCache: Set<string> | null = null
const zhafirManualChangeAt = new Map<string, number>()

function markZhafirManualChange(machineId?: string | null) {
  const key = (machineId || '').trim()
  if (!key) return
  zhafirManualChangeAt.set(key, Date.now())
}

function hasRecentManualChange(machineId: string, windowMs = 60 * 60 * 1000) {
  const ts = zhafirManualChangeAt.get(machineId)
  if (!ts) return false
  return Date.now() - ts < windowMs
}

export async function getZhafirMaterialContext(poName: string) {
  const trimmedPo = (poName || '').trim()
  if (!trimmedPo) {
    throw new Error('po is required')
  }

  const sqlQuery = `
    SELECT TOP 1 po_name, material_id, material_name, type
    FROM IoT.dbo.coois
    WHERE po_name = @PoName
    ORDER BY id DESC
  `
  const rows = await queryDatabase(sqlQuery, { PoName: trimmedPo })
  const row = rows?.[0] as Record<string, unknown> | undefined

  if (!row) {
    return {
      po: trimmedPo,
      materialId: null,
      materialName: null,
      materialType: null,
      found: false,
    }
  }

  const materialId = row.material_id ? String(row.material_id) : null
  const materialName = row.material_name ? String(row.material_name) : null
  const materialType = row.type ? String(row.type) : null

  return {
    po: trimmedPo,
    materialId,
    materialName,
    materialType,
    found: true,
  }
}

export async function getZhafirMaterialContextByMaterialId(materialId: string) {
  const trimmedMaterialId = (materialId || '').trim()
  if (!trimmedMaterialId) {
    throw new Error('material_id is required')
  }

  const routingRows = await queryDatabase(
    `
      SELECT TOP 1 material_id, material_name, materialtype
      FROM IoT.dbo.routing
      WHERE LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_id))) = @MaterialId
         OR (
           TRY_CONVERT(BIGINT, LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_id)))) IS NOT NULL
           AND TRY_CONVERT(BIGINT, @MaterialId) IS NOT NULL
           AND TRY_CONVERT(BIGINT, LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_id)))) = TRY_CONVERT(BIGINT, @MaterialId)
         )
      ORDER BY
        COALESCE(modified_at, created_at) DESC,
        id DESC
    `,
    { MaterialId: trimmedMaterialId }
  )
  const routingRow = routingRows?.[0] as Record<string, unknown> | undefined

  if (!routingRow) {
    return {
      po: null,
      materialId: trimmedMaterialId,
      materialName: null,
      materialType: null,
      found: false,
    }
  }

  const cooisRows = await queryDatabase(
    `
      SELECT TOP 1 po_name
      FROM IoT.dbo.coois
      WHERE LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_id))) = @MaterialId
         OR (
           TRY_CONVERT(BIGINT, LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_id)))) IS NOT NULL
           AND TRY_CONVERT(BIGINT, @MaterialId) IS NOT NULL
           AND TRY_CONVERT(BIGINT, LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_id)))) = TRY_CONVERT(BIGINT, @MaterialId)
         )
      ORDER BY
        COALESCE(modified_at, uploaded_at, created_at) DESC,
        id DESC
    `,
    { MaterialId: trimmedMaterialId }
  )
  const cooisRow = cooisRows?.[0] as Record<string, unknown> | undefined

  const po = cooisRow?.po_name ? String(cooisRow.po_name) : null
  const resolvedMaterialId = routingRow.material_id
    ? String(routingRow.material_id)
    : trimmedMaterialId
  const materialName = routingRow.material_name
    ? String(routingRow.material_name)
    : null
  const materialType = routingRow.materialtype
    ? String(routingRow.materialtype)
    : null

  return {
    po,
    materialId: resolvedMaterialId,
    materialName,
    materialType,
    found: true,
  }
}

export async function getZhafirSummaryRangeConfig(uom = 'HAITIAN') {
  const normalizedUom = (uom || 'HAITIAN').trim()
  const parameterNames = Array.from(
    new Set(
      Object.values(SUMMARY_RANGE_PARAMETER_MAP).flatMap((item) => [
        item.minName,
        item.maxName,
      ])
    )
  )

  const params: Record<string, unknown> = { Uom: normalizedUom }
  const placeholders = parameterNames.map((name, idx) => {
    const key = `Name${idx + 1}`
    params[key] = name
    return `@${key}`
  })

  const sqlQuery = `
    SELECT name, value
    FROM IoT.dbo.parameter_setting
    WHERE UPPER(LTRIM(RTRIM(uom))) = UPPER(@Uom)
      AND name IN (${placeholders.join(', ')})
  `
  const rows = await queryDatabase(sqlQuery, params)
  const valueMap: Record<string, number | null> = {}

  for (const row of rows || []) {
    const key = String((row as any).name || '')
      .trim()
      .toLowerCase()
    if (!key) continue
    const num = Number((row as any).value)
    valueMap[key] = Number.isFinite(num) ? num : null
  }

  const rules: Record<
    string,
    {
      min: number | null
      max: number | null
      minName: string
      maxName: string
    }
  > = {}

  Object.entries(SUMMARY_RANGE_PARAMETER_MAP).forEach(([fieldKey, names]) => {
    const minValue = valueMap[names.minName.toLowerCase()] ?? null
    const maxValue = valueMap[names.maxName.toLowerCase()] ?? null
    rules[fieldKey] = {
      min: minValue,
      max: maxValue,
      minName: names.minName,
      maxName: names.maxName,
    }
  })

  return {
    uom: normalizedUom,
    rules,
  }
}

export async function updateLatestTrxMaterialByMachine(
  machineId: string,
  materialType: string
) {
  const resolvedMachineId = (machineId || '').trim()
  const resolvedMaterial = (materialType || '').trim()

  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }
  if (!resolvedMaterial) {
    throw new Error('material type is required')
  }

  const latestRows = await queryDatabase(
    `
      SELECT TOP 1 id
      FROM IoT.dbo.MachineParameterSettingTRX
      WHERE machineId = @MachineID
      ORDER BY id DESC
    `,
    { MachineID: resolvedMachineId }
  )

  const latestId = latestRows?.[0]?.id
  if (!latestId) {
    return {
      machineId: resolvedMachineId,
      updated: false,
      message: 'No MachineParameterSettingTRX row found for this machine',
    }
  }

  await queryDatabase(
    `
      UPDATE IoT.dbo.MachineParameterSettingTRX
      SET material = @Material
      WHERE id = @Id
    `,
    { Id: latestId, Material: resolvedMaterial }
  )
  markZhafirManualChange(resolvedMachineId)

  return {
    machineId: resolvedMachineId,
    updated: true,
    id: latestId,
    material: resolvedMaterial,
    message: 'Material updated on latest trx row',
  }
}
export async function getZhafirMaterialTypeFromRouting(materialId: string) {
  const resolvedMaterialId = (materialId || '').trim()
  if (!resolvedMaterialId) {
    throw new Error('material_id is required')
  }

  const rows = await queryDatabase(
    `
      SELECT TOP 1 materialtype
      FROM IoT.dbo.routing
      WHERE material_id = @MaterialId
      ORDER BY created_at DESC, id DESC
    `,
    { MaterialId: resolvedMaterialId }
  )

  const row = rows?.[0] as Record<string, unknown> | undefined
  const materialType = row?.materialtype ? String(row.materialtype) : null

  return {
    materialId: resolvedMaterialId,
    materialType,
  }
}

export async function updateRoutingMaterialTypeByMaterialId(
  materialId: string,
  materialType: string
) {
  const resolvedMaterialId = (materialId || '').trim()
  const resolvedMaterialType = (materialType || '').trim()
  if (!resolvedMaterialId) {
    throw new Error('material_id is required')
  }
  if (!resolvedMaterialType) {
    throw new Error('materialType is required')
  }

  await queryDatabase(
    `
      UPDATE IoT.dbo.routing
      SET materialtype = @MaterialType,
          modified_at = GETDATE()
      WHERE material_id = @MaterialId
        AND (materialtype IS NULL OR LTRIM(RTRIM(materialtype)) = '')
    `,
    {
      MaterialId: resolvedMaterialId,
      MaterialType: resolvedMaterialType,
    }
  )

  return {
    materialId: resolvedMaterialId,
    materialType: resolvedMaterialType,
    updated: true,
  }
}
async function syncHourlyTrxMaterialFromLatestValue() {
  const machines = await queryDatabase(
    `
      SELECT DISTINCT machineId
      FROM ${MACHINE_TRX_TABLE}
      WHERE machineId IS NOT NULL AND LTRIM(RTRIM(machineId)) <> ''
    `
  )

  for (const row of machines || []) {
    const machineId = String((row as any).machineId || '').trim()
    if (!machineId) continue

    const latestCurrentHourRows = await queryDatabase(
      `
        SELECT TOP 1 id, created_at, material
        FROM ${MACHINE_TRX_TABLE}
        WHERE machineId = @MachineID
          AND created_at >= DATEADD(HOUR, DATEDIFF(HOUR, 0, GETDATE()), 0)
        ORDER BY created_at DESC, id DESC
      `,
      { MachineID: machineId }
    )
    const target = latestCurrentHourRows?.[0] as
      | Record<string, unknown>
      | undefined
    const targetId = target?.id ? Number(target.id) : null
    if (!targetId) continue

    const targetMaterial = target?.material
      ? String(target.material).trim()
      : ''
    if (targetMaterial) continue

    const targetCreatedAt = target?.created_at
      ? new Date(String(target.created_at)).getTime()
      : NaN
    if (!Number.isFinite(targetCreatedAt)) continue
    if (Date.now() - targetCreatedAt < 2 * 60 * 1000) continue

    const sourceRows = await queryDatabase(
      `
        SELECT TOP 1 material
        FROM ${MACHINE_TRX_TABLE}
        WHERE machineId = @MachineID
          AND id <> @TargetID
          AND material IS NOT NULL
          AND LTRIM(RTRIM(CONVERT(NVARCHAR(255), material))) <> ''
        ORDER BY created_at DESC, id DESC
      `,
      { MachineID: machineId, TargetID: targetId }
    )
    const sourceMaterial = sourceRows?.[0]?.material
      ? String(sourceRows[0].material).trim()
      : ''
    if (!sourceMaterial) continue

    await queryDatabase(
      `
        UPDATE ${MACHINE_TRX_TABLE}
        SET material = @Material
        WHERE id = @TargetID
      `,
      { TargetID: targetId, Material: sourceMaterial }
    )
  }
}

async function runZhafirHourlyCarryForward() {
  try {
    await syncHourlyTrxMaterialFromLatestValue()
  } catch (error) {
    console.error('Failed running zhafir material auto-sync:', error)
  }
}

let zhafirHourlyTimer: ReturnType<typeof setInterval> | null = null
export function startZhafirHourlyCarryForwardScheduler() {
  if (zhafirHourlyTimer) return
  runZhafirHourlyCarryForward()
  zhafirHourlyTimer = setInterval(runZhafirHourlyCarryForward, 60 * 1000)
}

async function getZhafirStyleParameterRow() {
  const rows = await queryDatabase(
    `
      SELECT TOP 1 id, value, uom, color, hexacolor
      FROM ${PARAMETER_SETTING_TABLE}
      WHERE id = @Id OR name = @Name
      ORDER BY CASE WHEN id = @Id THEN 0 ELSE 1 END, id ASC
    `,
    { Id: ZHAFIR_STYLE_PARAMETER_ID, Name: ZHAFIR_STYLE_PARAMETER_NAME }
  )
  return rows?.[0] as Record<string, unknown> | undefined
}

function resolveColorNameFromHex(hex: string) {
  const normalized = (hex || '').trim().toUpperCase()
  const known: Record<string, string> = {
    '#F3F4F6': 'gray',
    '#DBEAFE': 'blue',
    '#FEF3C7': 'amber',
    '#DCFCE7': 'green',
    '#FEE2E2': 'red',
    '#EDE9FE': 'violet',
    '#CFFAFE': 'cyan',
    '#FDECC8': 'beige',
    '#FDE2E4': 'pink',
    '#CCD5AE': 'olive',
    '#1F2937': 'slate',
    '#111827': 'charcoal',
    '#FFFFFF': 'white',
    '#000000': 'black',
  }
  return known[normalized] || 'custom'
}

export async function getZhafirSectionStyles(machineId: string) {
  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }
  const row = await getZhafirStyleParameterRow()
  if (!row) {
    return {
      machineId: resolvedMachineId,
      styles: [],
      source: {
        id: ZHAFIR_STYLE_PARAMETER_ID,
        name: ZHAFIR_STYLE_PARAMETER_NAME,
      },
    }
  }

  const hexRaw = row.hexacolor ? String(row.hexacolor).trim() : ''
  const fallbackHex = row.color ? String(row.color).trim() : ''
  const resolvedHex = /^#[0-9a-fA-F]{6}$/.test(hexRaw)
    ? hexRaw
    : /^#[0-9a-fA-F]{6}$/.test(fallbackHex)
      ? fallbackHex
      : ''
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(resolvedHex)
  const styles = isValidHex
    ? [
        {
          sectionKey: '__all__',
          headerBgColor: resolvedHex,
          actBgColor: resolvedHex,
          updatedAt: null,
        },
      ]
    : []

  return {
    machineId: resolvedMachineId,
    styles,
    source: {
      id: Number(row.id || ZHAFIR_STYLE_PARAMETER_ID),
      name: ZHAFIR_STYLE_PARAMETER_NAME,
      uom: row.uom ? String(row.uom) : null,
      colorName: row.color ? String(row.color) : null,
      hexacolor: row.hexacolor ? String(row.hexacolor) : null,
    },
  }
}

export async function upsertZhafirSectionStyle(
  machineId: string,
  sectionKey: string,
  headerBgColor: string,
  actBgColor: string
) {
  const resolvedMachineId = (machineId || '').trim()
  const resolvedSectionKey = (sectionKey || '').trim()
  const resolvedHeader = (headerBgColor || '').trim()
  const resolvedAct = (actBgColor || '').trim()

  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }
  if (!resolvedSectionKey) {
    throw new Error('sectionKey is required')
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(resolvedHeader)) {
    throw new Error('headerBgColor must be hex format #RRGGBB')
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(resolvedAct)) {
    throw new Error('actBgColor must be hex format #RRGGBB')
  }
  const resolvedColorName = resolveColorNameFromHex(resolvedHeader)

  const row = await getZhafirStyleParameterRow()
  if (!row) {
    throw new Error(
      `parameter_setting row id=${ZHAFIR_STYLE_PARAMETER_ID} (${ZHAFIR_STYLE_PARAMETER_NAME}) not found`
    )
  }
  const rowId = Number(row.id)
  if (!Number.isFinite(rowId)) {
    throw new Error('Invalid parameter_setting style row id')
  }

  await queryDatabase(
    `
      UPDATE ${PARAMETER_SETTING_TABLE}
      SET uom = @Uom,
          color = @Color,
          hexacolor = @HexaColor
      WHERE id = @Id
    `,
    {
      Id: rowId,
      Uom: resolvedMachineId,
      Color: resolvedColorName,
      HexaColor: resolvedHeader,
    }
  )

  return {
    machineId: resolvedMachineId,
    sectionKey: resolvedSectionKey,
    headerBgColor: resolvedHeader,
    actBgColor: resolvedAct,
    saved: true,
    source: {
      id: rowId,
      name: ZHAFIR_STYLE_PARAMETER_NAME,
    },
  }
}

async function getParaSetTrxColumns() {
  if (paraSetTrxColumnsCache) return paraSetTrxColumnsCache
  const rows = await queryDatabase(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @TableName
  `,
    { TableName: PARASET_TRX_TABLE }
  )
  paraSetTrxColumnsCache = new Set(
    (rows || []).map((r: any) => String(r.COLUMN_NAME || ''))
  )
  return paraSetTrxColumnsCache
}

function resolveColumns(section?: string): string[] {
  if (!section) return ZHAFIR_ALL_COLUMNS
  if (!(section in ZHAFIR_SECTIONS)) {
    throw new Error(`Invalid section "${section}".`)
  }
  return [
    ...ZHAFIR_SECTIONS[section as ZhafirSectionKey],
    ...ZHAFIR_META_FIELDS,
  ]
}

function normalizePayload(
  payload: Record<string, unknown>,
  allowedColumns: string[]
) {
  const result: Record<string, string | number | null> = {}

  for (const key of allowedColumns) {
    if (!(key in payload)) continue

    const rawValue = payload[key]
    if (rawValue === '' || rawValue === null) {
      result[key] = null
      continue
    }

    if (rawValue === undefined) continue

    if ((ZHAFIR_META_FIELDS as readonly string[]).includes(key)) {
      result[key] = String(rawValue)
      continue
    }

    if (STRING_VALUE_FIELDS.has(key)) {
      result[key] = String(rawValue)
      continue
    }

    const asNumber = Number(rawValue)
    if (Number.isNaN(asNumber)) {
      throw new Error(`Field "${key}" must be numeric.`)
    }
    result[key] = asNumber
  }

  return result
}

function createStdActMap(
  stdRow: Record<string, any> | undefined,
  actualRow: Record<string, any> | undefined,
  section?: string
) {
  const columns = resolveColumns(section)
  const fields = columns.filter(
    (c) => !(ZHAFIR_META_FIELDS as readonly string[]).includes(c)
  )

  const values: Record<
    string,
    { std: number | string | null; act: number | string | null }
  > = {}
  for (const field of fields) {
    values[field] = {
      std: stdRow?.[field] ?? null,
      act: actualRow?.[field] ?? null,
    }
  }

  return values
}

function isSupportedRangeKey(key: string) {
  if (!key) return false
  if (key.endsWith('_min')) {
    const base = key.slice(0, -4)
    return RANGE_TRACKED_FIELDS.has(base)
  }
  if (key.endsWith('_max')) {
    const base = key.slice(0, -4)
    return RANGE_TRACKED_FIELDS.has(base)
  }
  return false
}

function extractRangeValuesFromParamset(paramset: Record<string, unknown>) {
  const keyMap: Record<string, string> = {}
  Object.keys(paramset || {}).forEach((key) => {
    keyMap[key.toLowerCase()] = key
  })

  const ranges: Record<
    string,
    { min: string | number | null; max: string | number | null }
  > = {}

  RANGE_TRACKED_FIELDS.forEach((fieldKey) => {
    const minKey = keyMap[`${fieldKey}_min`.toLowerCase()]
    const maxKey = keyMap[`${fieldKey}_max`.toLowerCase()]
    const minValue = minKey
      ? (paramset[minKey] as string | number | null)
      : null
    const maxValue = maxKey
      ? (paramset[maxKey] as string | number | null)
      : null

    if (minValue !== null || maxValue !== null) {
      ranges[fieldKey] = {
        min: minValue ?? null,
        max: maxValue ?? null,
      }
    }
  })

  return ranges
}

function parseMaterialInput(
  materialRaw?: string,
  materialIdRaw?: string,
  materialNameRaw?: string
) {
  const explicitMaterialId = (materialIdRaw || '').trim()
  const explicitMaterialName = (materialNameRaw || '').trim()
  if (explicitMaterialId || explicitMaterialName) {
    return {
      materialId: explicitMaterialId || null,
      materialName: explicitMaterialName || null,
    }
  }

  const source = (materialRaw || '').trim()
  if (!source) {
    return {
      materialId: null as string | null,
      materialName: null as string | null,
    }
  }

  if (source.includes(' - ')) {
    const [left, ...rest] = source.split(' - ')
    return {
      materialId: left?.trim() || null,
      materialName: rest.join(' - ').trim() || null,
    }
  }

  return {
    materialId: source,
    materialName: source,
  }
}

function parseStdParamset(raw: unknown) {
  if (!raw) return {} as Record<string, string | number | null>
  if (typeof raw === 'object')
    return raw as Record<string, string | number | null>
  if (typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string | number | null>
    }
  } catch {
    // ignore malformed JSON and fallback to empty object
  }
  return {}
}

function getRowValue(row: Record<string, unknown> | undefined, keys: string[]) {
  if (!row) return undefined
  const keyMap: Record<string, string> = {}
  Object.keys(row).forEach((key) => {
    keyMap[key.toLowerCase()] = key
  })
  for (const key of keys) {
    const resolved = keyMap[key.toLowerCase()]
    if (resolved) return row[resolved]
  }
  return undefined
}

async function getNearestStdRowByMachine(machineId: string) {
  const machineColumns = ['machineId']
  let lastError: string | null = null

  for (const machineColumn of machineColumns) {
    const nearestSql = `
      SELECT TOP 1 *
      FROM ${MACHINE_STD_TABLE}
      WHERE ${machineColumn} = @MachineID
        AND CAST(created_at AS date) = CAST(GETDATE() AS date)
      ORDER BY ABS(DATEDIFF(SECOND, created_at, GETDATE())), id DESC
    `
    try {
      const nearestRows = await queryDatabase(nearestSql, {
        MachineID: machineId,
      })
      if (Array.isArray(nearestRows) && nearestRows.length > 0) {
        return nearestRows[0] as Record<string, unknown>
      }
    } catch (error) {
      lastError = (error as Error).message
    }

    const latestSql = `
      SELECT TOP 1 *
      FROM ${MACHINE_STD_TABLE}
      WHERE ${machineColumn} = @MachineID
      ORDER BY created_at DESC, id DESC
    `
    try {
      const latestRows = await queryDatabase(latestSql, {
        MachineID: machineId,
      })
      if (Array.isArray(latestRows) && latestRows.length > 0) {
        return latestRows[0] as Record<string, unknown>
      }
    } catch (error) {
      lastError = (error as Error).message
    }
  }

  if (lastError) {
    throw new Error(lastError)
  }
  return undefined
}

async function getLatestStdRowByMachine(machineId: string) {
  const machineColumns = ['machineId']
  let lastError: string | null = null

  for (const machineColumn of machineColumns) {
    const latestSql = `
      SELECT TOP 1 *
      FROM ${MACHINE_STD_TABLE}
      WHERE ${machineColumn} = @MachineID
      ORDER BY created_at DESC, id DESC
    `
    try {
      const latestRows = await queryDatabase(latestSql, {
        MachineID: machineId,
      })
      if (Array.isArray(latestRows) && latestRows.length > 0) {
        return latestRows[0] as Record<string, unknown>
      }
    } catch (error) {
      lastError = (error as Error).message
    }
  }

  if (lastError) {
    throw new Error(lastError)
  }
  return undefined
}

async function getLatestStdRowByMachineAndMaterialId(
  machineId: string,
  materialId: string
) {
  const resolvedMachineId = (machineId || '').trim()
  const resolvedMaterialId = (materialId || '').trim()
  if (!resolvedMachineId || !resolvedMaterialId) {
    return undefined
  }

  const machineColumns = ['machineId']
  let lastError: string | null = null

  for (const machineColumn of machineColumns) {
    const latestSql = `
      SELECT TOP 1 *
      FROM ${MACHINE_STD_TABLE}
      WHERE ${machineColumn} = @MachineID
        AND LTRIM(RTRIM(CONVERT(NVARCHAR(255), material_Id))) = @MaterialID
      ORDER BY created_at DESC, id DESC
    `
    try {
      const latestRows = await queryDatabase(latestSql, {
        MachineID: resolvedMachineId,
        MaterialID: resolvedMaterialId,
      })
      if (Array.isArray(latestRows) && latestRows.length > 0) {
        return latestRows[0] as Record<string, unknown>
      }
    } catch (error) {
      lastError = (error as Error).message
    }
  }

  if (lastError) {
    throw new Error(lastError)
  }
  return undefined
}

async function upsertStdParamsetByMachine(
  machineId: string,
  stdPayload: Record<string, unknown>,
  section?: string,
  materialRaw?: string,
  materialIdRaw?: string,
  materialNameRaw?: string
) {
  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required for STD save')
  }

  const columns = resolveColumns(section)
  const dynamicRangeColumns = Object.keys(stdPayload || {}).filter((key) =>
    isSupportedRangeKey(key)
  )
  const allowedPayload = normalizePayload(stdPayload, [
    ...columns,
    ...dynamicRangeColumns,
  ])
  const parsedMaterial = parseMaterialInput(
    materialRaw,
    materialIdRaw,
    materialNameRaw
  )
  const latestMachineRow = await getLatestStdRowByMachine(resolvedMachineId)
  const targetByCombination = parsedMaterial.materialId
    ? await getLatestStdRowByMachineAndMaterialId(
        resolvedMachineId,
        parsedMaterial.materialId
      )
    : undefined
  const targetRow = targetByCombination ?? latestMachineRow

  const currentParamset = parseStdParamset(getRowValue(targetRow, ['paramset']))
  const nextParamset = {
    ...currentParamset,
    ...allowedPayload,
  }

  const currentMaterialId = getRowValue(targetRow, [
    'material_id',
    'material_Id',
  ])
  const currentMaterialName = getRowValue(targetRow, [
    'material_name',
    'materialName',
  ])
  const currentCavity = getRowValue(targetRow, ['cavity'])
  const materialId =
    parsedMaterial.materialId ??
    (currentMaterialId ? String(currentMaterialId) : null)
  const materialName =
    parsedMaterial.materialName ??
    (currentMaterialName ? String(currentMaterialName) : null)
  const cavity = nextParamset.Cavity ?? currentCavity ?? null

  const shouldUseCombinationUpdate = Boolean(parsedMaterial.materialId)
  const updateTargetRow = shouldUseCombinationUpdate
    ? targetByCombination
    : targetRow
  const latestId = getRowValue(updateTargetRow, ['id'])
  if (latestId !== undefined && latestId !== null) {
    const updateSql = `
      UPDATE ${MACHINE_STD_TABLE}
      SET machineId = @MachineID,
          material_Id = @MaterialID,
          material_name = @MaterialName,
          cavity = @Cavity,
          paramset = @Paramset,
          created_at = GETDATE()
      WHERE id = @Id
    `
    await queryDatabase(updateSql, {
      Id: latestId,
      MachineID: resolvedMachineId,
      MaterialID: materialId,
      MaterialName: materialName,
      Cavity: cavity,
      Paramset: JSON.stringify(nextParamset),
    })

    return {
      action: 'update' as const,
      machineId: resolvedMachineId,
      savedColumns: Object.keys(allowedPayload),
      paramset: nextParamset,
      id: latestId,
    }
  }

  const insertSql = `
    INSERT INTO ${MACHINE_STD_TABLE} (machineId, material_Id, material_name, cavity, paramset, created_at)
    VALUES (@MachineID, @MaterialID, @MaterialName, @Cavity, @Paramset, GETDATE())
  `
  await queryDatabase(insertSql, {
    MachineID: resolvedMachineId,
    MaterialID: materialId,
    MaterialName: materialName,
    Cavity: cavity,
    Paramset: JSON.stringify(nextParamset),
  })

  return {
    action: 'insert' as const,
    machineId: resolvedMachineId,
    savedColumns: Object.keys(allowedPayload),
    paramset: nextParamset,
    id: null,
  }
}

export function getZhafirSections() {
  return Object.entries(ZHAFIR_SECTIONS).map(([section, columns]) => ({
    section,
    columns,
  }))
}

export function getZhafirQueryTemplates(section?: string) {
  const columns = resolveColumns(section)
  const queryColumns = columns.join(', ')

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
  }
}

export async function getZhafirStdActByParaId(
  paraId: string,
  section?: string,
  machineId?: string
) {
  if (!machineId || !machineId.trim()) {
    throw new Error('machine_id is required')
  }
  let std: Record<string, string | number | null> = {}
  let actual: Record<string, string | number | null> = {}
  let ranges: Record<
    string,
    { min: string | number | null; max: string | number | null }
  > = {}
  const resolvedMachineId = machineId.trim()
  let stdDate = new Date().toISOString()
  let actualDate = new Date().toISOString()

  const nearestStdRow = await getNearestStdRowByMachine(resolvedMachineId)
  if (nearestStdRow) {
    const paramsetRaw = parseStdParamset(
      getRowValue(nearestStdRow, ['paramset'])
    )
    const paramset = mapSourceToUiFields(paramsetRaw as Record<string, any>)
    ranges = extractRangeValuesFromParamset(
      paramsetRaw as Record<string, unknown>
    )
    std = {
      ...std,
      ...paramset,
    }
    const createdAt = getRowValue(nearestStdRow, ['created_at', 'createdAt'])
    if (createdAt) {
      stdDate = new Date(String(createdAt)).toISOString()
    }
  }

  const actualData = await getZhafirActualFromView(paraId, machineId)
  actual = (actualData?.values || {}) as Record<string, string | number | null>
  actualDate = actualData?.actualDate || actualDate
  const actualMeta = (actualData?.meta || {}) as {
    MchID?: string | null
    MoldID?: string | null
  }

  return {
    paraId,
    section: section || 'all',
    stdDate,
    actualDate,
    meta: {
      MchID: actualMeta.MchID || resolvedMachineId,
      MoldID: actualMeta.MoldID ?? null,
    },
    ranges,
    values: createStdActMap(std, actual, section),
  }
}

const ACT_VIEW_TO_FIELD_MAP: Record<string, string> = {
  // CHARGING
  Charge_Position_S1: 'Plasticise1To',
  Charge_Position_S2: 'Plasticise2To',
  Charge_Position_SE: 'AfterPlasticisePosition',
  Charge_Speed_S1: 'Plasticise1Velo',
  Charge_Speed_S2: 'Plasticise2Velo',
  Charge_Speed_S3: 'AfterPlasticiseSpeed',
  Charge_BackPress_S1: 'Plasticise1BackPress',
  Charge_BackPress_S2: 'AfterPlasticiseBackPress',
  Charge_BackPress_SE: 'AfterPlasticiseBackPress',
  Charge_Pressure_S1: 'Plasticise1Press',
  Charge_Pressure_S2: 'Plasticise2Press',
  Charge_Pressure_SE: 'AfterPlasticisePress',

  // COOLING / CUSSION / V-P
  Cooling_Time: 'CoolingTime',
  Note_Cushion: 'Thickness',
  Note_CycleTime: 'CycleTime',
  Note_ActInjtTime: 'InjectTime',
  Note_PlastTime: 'AfterPlasticiseTime',
  Note_InjStartPos: 'InjectScrewPosition',
  InjPeakPressure: 'InjPeakPressure',
  Tonnage_Set: 'Tonase',
  CarriageBWD_SE: 'CarriageBwd_SE',
  VP_Position: 'VPPositionText',
  Temperature_Max_Hopper: 'HopperMax',
  Temperature_Min_Hopper: 'HopperMin',
  Temperature_Real_Hopper: 'HopperReal',
  Temperature_Set_Hopper: 'HopperSet',
  SuckBackAfterCharge_mm: 'InjectSBPosition',
  SuckBackAfterCharge_pct: 'InjectSBSpeed',

  // EJECTOR
  EjectBWD_Pressure_S1: 'Backward1Press',
  EjectBWD_Pressure_SE: 'Backward2Press',
  EjectBWD_Post_S1: 'Backward1To',
  EjectBWD_Post_SE: 'Backward2To',
  EjectBWD_Speed_S1: 'Backward1Velo',
  EjectBWD_Speed_SE: 'Backward2Velo',
  EjectFWD_Pressure_S1: 'Forward1Press',
  EjectFWD_Pressure_SE: 'Forward2Press',
  EjectFWD_Post_S1: 'Forward1To',
  EjectFWD_Post_SE: 'Forward2To',
  EjectFWD_Speed_S1: 'Forward1Velo',
  EjectFWD_Speed_SE: 'Forward2Velo',

  // HOLDING
  Holding_Pressure_P1: 'Hold1Press',
  Holding_Pressure_P2: 'Hold2Press',
  Holding_Pressure_P3: 'Hold3Press',
  Holding_Time_P1: 'Hold1To',
  Holding_Time_P2: 'Hold2To',
  Holding_Time_P3: 'Hold3To',
  Holding_HoldSpeed_P1: 'Hold1Velo',

  // INJECT
  Inject_Pressure_S1: 'Inject1Press',
  Inject_Pressure_S3: 'Inject3Press',
  Inject_Pressure_SE: 'Inject4Press',
  Inject_Position_S1: 'Inject1To',
  Inject_Position_S2: 'Inject2To',
  Inject_Position_S3: 'Inject3To',
  Inject_Position_SE: 'Inject4Velo',
  Inject_Speed_S1: 'Inject1Velo',
  Inject_Speed_S2: 'Inject2Velo',
  Inject_Speed_S3: 'Inject3Velo',
  Inject_Speed_SE: 'Inject4Velo',

  // MOLD CLOSE
  CloseMold_Position_S1: 'Close1To',
  CloseMold_Position_S2: 'Close2To',
  CloseMold_Position_S3: 'ProtectTo',
  CloseMold_Position_LP: 'CloseLPTo',
  CloseMold_Position_HP: 'CloseHPTo',
  CloseMold_Position_SE: 'CloseSETo',
  CloseMold_Speed_S1: 'Close1Velo',
  CloseMold_Speed_S2: 'Close2Velo',
  CloseMold_Speed_S3: 'ProtectVelo',
  CloseMold_Speed_LP: 'CloseLPVelo',
  CloseMold_Speed_HP: 'CloseHPVelo',
  CloseMold_Speed_SE: 'CloseSEVelo',

  // MOLD OPEN
  OpenMold_Position_S1: 'Open1To',
  OpenMold_Position_S2: 'Open2To',
  OpenMold_Position_S3: 'Open3To',
  OpenMold_Position_S4: 'Open4To',
  OpenMold_Position_S5: 'OpenS5To',
  OpenMold_Position_SE: 'Open4To',
  OpenMold_Speed_S1: 'Open1Velo',
  OpenMold_Speed_S2: 'Open2Velo',
  OpenMold_Speed_S3: 'Open3Velo',
  OpenMold_Speed_S4: 'Open4Velo',
  OpenMold_Speed_S5: 'OpenS5Velo',
  OpenMold_Speed_SE: 'Open4Velo',

  // CORE A
  Core_DelayTime_AIn: 'Core_In_Delay_Time_A',
  Core_Mode_AIn: 'Core_In_Mode_A',
  Core_MoldPost_AIn: 'Core_In_Mold_Position_A',
  Core_Time_AIn: 'Core_In_Time_A',
  Core_DelayTime_AOut: 'Core_Out_Delay_Time_A',
  Core_Mode_AOut: 'Core_Out_Mode_A',
  Core_MoldPost_AOut: 'Core_Out_Mold_Position_A',
  Core_Time_AOut: 'Core_Out_Time_A',
  Core_Flow_AIn: 'CoreA_In_Flow',
  Core_Press_AIn: 'CoreA_In_Pressure',
  Core_Flow_AOut: 'CoreA_Out_Flow',
  Core_Press_AOut: 'CoreA_Out_Pressure',

  // TEMPERATURE aliases
  Temperature_Real_Zone1: 'Temperature_Real_Zone1',
  Temperature_Real_Zone2: 'Temperature_Real_Zone2',
  Temperature_Real_Zone3: 'Temperature_Real_Zone3',
  Temperature_Real_Zone4: 'Temperature_Real_Zone4',
  Temperature_Real_Zone5: 'Temperature_Real_Zone5',
  Temperature_Real_Zone6: 'Temperature_Real_Zone6',
  Temperature_Set_Zone1: 'Temperature_Set_Zone1',
  Temperature_Set_Zone2: 'Temperature_Set_Zone2',
  Temperature_Set_Zone3: 'Temperature_Set_Zone3',
  Temperature_Set_Zone4: 'Temperature_Set_Zone4',
  Temperature_Set_Zone5: 'Temperature_Set_Zone5',
  Temperature_Set_Zone6: 'Temperature_Set_Zone6',
}

function mapSourceToUiFields(source?: Record<string, any>) {
  const mapped: Record<string, string | number | null> = {}
  if (!source) return mapped

  const lowerKeyMap: Record<string, string> = {}
  Object.keys(source).forEach((key) => {
    lowerKeyMap[key.toLowerCase()] = key
  })

  Array.from(ALLOWED_HARD_CODED_ACT_FIELDS).forEach((fieldKey) => {
    const resolved = lowerKeyMap[fieldKey.toLowerCase()]
    if (!resolved) return
    const value = source[resolved]
    if (value !== undefined && value !== null && value !== '') {
      mapped[fieldKey] = value
    }
  })

  Object.entries(ACT_VIEW_TO_FIELD_MAP).forEach(([viewKey, fieldKey]) => {
    if (!ALLOWED_HARD_CODED_ACT_FIELDS.has(fieldKey)) return
    const value = source[viewKey]
    if (value !== undefined && value !== null && value !== '') {
      mapped[fieldKey] = value
    }
  })

  if (
    (mapped.VPPosnText === null ||
      mapped.VPPosnText === undefined ||
      mapped.VPPosnText === '') &&
    mapped.VPPositionText !== undefined
  ) {
    mapped.VPPosnText = mapped.VPPositionText
  }

  // Temperature compatibility:
  // - Prefer dedicated Real/Set keys when present.
  // - Fallback to BarrelN for legacy payloads.
  // - Keep BarrelN filled for backward compatibility consumers.
  for (let i = 1; i <= 6; i += 1) {
    const barrelKey = `Barrel${i}`
    const realKey = `Temperature_Real_Zone${i}`
    const setKey = `Temperature_Set_Zone${i}`

    if (
      (mapped[realKey] === null ||
        mapped[realKey] === undefined ||
        mapped[realKey] === '') &&
      mapped[barrelKey] !== undefined
    ) {
      mapped[realKey] = mapped[barrelKey]
    }
    if (
      (mapped[setKey] === null ||
        mapped[setKey] === undefined ||
        mapped[setKey] === '') &&
      mapped[barrelKey] !== undefined
    ) {
      mapped[setKey] = mapped[barrelKey]
    }
    if (
      mapped[barrelKey] === null ||
      mapped[barrelKey] === undefined ||
      mapped[barrelKey] === ''
    ) {
      if (
        mapped[setKey] !== undefined &&
        mapped[setKey] !== null &&
        mapped[setKey] !== ''
      ) {
        mapped[barrelKey] = mapped[setKey]
      } else if (
        mapped[realKey] !== undefined &&
        mapped[realKey] !== null &&
        mapped[realKey] !== ''
      ) {
        mapped[barrelKey] = mapped[realKey]
      }
    }
  }

  return mapped
}

function mapActualFromViewRow(row: Record<string, any> | undefined) {
  const actual: Record<string, string | number | null> = Object.fromEntries(
    Array.from(ALLOWED_HARD_CODED_ACT_FIELDS).map((key) => [key, null])
  )
  if (!row) return actual

  const rawParamset = getRowValue(row as Record<string, unknown>, ['paramset'])
  if (rawParamset) {
    const paramset = parseStdParamset(rawParamset) as Record<string, any>
    Object.assign(actual, mapSourceToUiFields(paramset))
  }
  Object.assign(actual, mapSourceToUiFields(row))

  return actual
}

function pickMetaFromRow(row?: Record<string, any>) {
  if (!row) {
    return { MchID: null, MoldID: null }
  }
  const keyMap: Record<string, string> = {}
  for (const key of Object.keys(row)) {
    keyMap[key.toLowerCase()] = key
  }
  const mchKey =
    keyMap['mchid'] ||
    keyMap['machine_id'] ||
    keyMap['machineid'] ||
    keyMap['machineid']
  const moldKey = keyMap['moldid'] || keyMap['mold_id']
  return {
    MchID: mchKey ? String(row[mchKey]) : null,
    MoldID: moldKey ? String(row[moldKey]) : null,
  }
}

export async function getZhafirActualFromView(
  paraId?: string,
  machineId?: string
) {
  const resolvedMachineId = (machineId || '').trim()
  const queries = resolvedMachineId
    ? [
        `
        SELECT TOP 1 *,
          JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.Note_ActInjtTime') AS VPTimeText
        FROM IoT.dbo.MachineParameterSettingTRX
        WHERE machineId = @MachineID
        ORDER BY created_at DESC, id DESC
      `,
      ]
    : [
        `
        SELECT TOP 1 *,
          JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.Note_ActInjtTime') AS VPTimeText
        FROM IoT.dbo.MachineParameterSettingTRX
        ORDER BY created_at DESC, id DESC
      `,
      ]

  let row: Record<string, any> | undefined
  let lastError: string | null = null

  for (const sqlQuery of queries) {
    try {
      const rows = resolvedMachineId
        ? await queryDatabase(sqlQuery, { MachineID: resolvedMachineId })
        : await queryDatabase(sqlQuery)
      row = rows?.[0] as Record<string, any> | undefined
      if (row) break
    } catch (error) {
      lastError = (error as Error).message
    }
  }

  if (!row && resolvedMachineId && lastError) {
    throw new Error(lastError)
  }

  const actual = mapActualFromViewRow(row)
  const meta = pickMetaFromRow(row)
  if (resolvedMachineId) {
    meta.MchID = resolvedMachineId
  }

  return {
    paraId: paraId || 'ZHF-STD-001',
    actualDate: new Date().toISOString(),
    meta,
    values: actual,
  }
}

export async function getZhafirActualFromViewByHour(
  paraId: string | undefined,
  machineId: string,
  date: string,
  hour: number
) {
  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }

  const sqlQuery = `
    SELECT TOP 1 *,
      JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.Note_ActInjtTime') AS VPTimeText
    FROM IoT.dbo.MachineParameterSettingTRX
    WHERE machineId = @MachineID
      AND CAST(created_at AS date) = CAST(@DateParam AS date)
      AND DATEPART(hour, created_at) = @HourParam
    ORDER BY created_at DESC, id DESC
  `
  const rows = await queryDatabase(sqlQuery, {
    MachineID: resolvedMachineId,
    DateParam: date,
    HourParam: hour,
  })
  const row = rows?.[0] as Record<string, any> | undefined
  const actual = mapActualFromViewRow(row)

  const meta = pickMetaFromRow(row)
  meta.MchID = resolvedMachineId

  return {
    paraId: paraId || 'ZHF-STD-001',
    actualDate: row?.created_at
      ? new Date(String(row.created_at)).toISOString()
      : new Date().toISOString(),
    meta,
    values: actual,
  }
}

export async function getZhafirAvailableHours(machineId: string, date: string) {
  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }

  const sqlQuery = `
    SELECT DISTINCT DATEPART(hour, created_at) AS hour_slot
    FROM IoT.dbo.MachineParameterSettingTRX
    WHERE machineId = @MachineID
      AND CAST(created_at AS date) = CAST(@DateParam AS date)
    ORDER BY hour_slot ASC
  `
  const rows = await queryDatabase(sqlQuery, {
    MachineID: resolvedMachineId,
    DateParam: date,
  })

  const hours = (rows || [])
    .map((r: any) => Number(r.hour_slot))
    .filter((v: number) => Number.isInteger(v) && v >= 0 && v <= 23)

  return {
    machineId: resolvedMachineId,
    date,
    hours,
  }
}

export async function getZhafirActiveMaterialByMachine(machineId: string) {
  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }

  const sqlQuery = `
    SELECT TOP 1 material
    FROM IoT.dbo.MachineParameterSettingTRX
    WHERE machineId = @MachineID
      AND material IS NOT NULL
      AND LTRIM(RTRIM(CONVERT(NVARCHAR(255), material))) <> ''
    ORDER BY created_at DESC, id DESC
  `
  const rows = await queryDatabase(sqlQuery, {
    MachineID: resolvedMachineId,
  })
  const materialIdRaw = rows?.[0]?.material
  let materialId = materialIdRaw ? String(materialIdRaw).trim() : null

  // Fallback: if TRX material is empty, use latest STD material_Id for this machine
  if (!materialId) {
    const stdRow = await getLatestStdRowByMachine(resolvedMachineId)
    const stdMaterialId = getRowValue(stdRow, ['material_Id', 'material_id'])
    materialId = stdMaterialId ? String(stdMaterialId).trim() : null
  }

  return {
    machineId: resolvedMachineId,
    materialId,
    found: Boolean(materialId),
  }
}

export async function getZhafirActualByHourWindow(
  machineId: string,
  options?: {
    paraId?: string
    endAt?: string
    date?: string
    hoursBack?: number
  }
) {
  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required')
  }

  const requestedHoursBack = Number(options?.hoursBack ?? 24)
  if (!Number.isInteger(requestedHoursBack) || requestedHoursBack < 1) {
    throw new Error('hoursBack must be integer >= 1')
  }

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const formatSqlDateTimeLocal = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    const ms = String(date.getMilliseconds()).padStart(3, '0')
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}.${ms}`
  }
  const formatHourLabel = (input: unknown) => {
    if (!input) return null
    if (input instanceof Date && !Number.isNaN(input.getTime())) {
      // Tedious commonly returns DATETIME as UTC Date. Use UTC hour to keep DB hour.
      const hh = String(input.getUTCHours()).padStart(2, '0')
      const mm = String(input.getUTCMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    }
    const text = String(input)
    const match = text.match(/(\d{2}):(\d{2})/)
    return match ? `${match[1]}:${match[2]}` : null
  }

  let endDate: Date
  if (options?.endAt) {
    endDate = new Date(options.endAt)
  } else if (options?.date) {
    const trimmedDate = options.date.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      throw new Error('date must be in YYYY-MM-DD format')
    }
    const now = new Date()
    const isToday = trimmedDate === formatLocalDate(now)
    endDate = isToday ? now : new Date(`${trimmedDate}T23:59:59.999`)
  } else {
    endDate = new Date()
  }
  if (Number.isNaN(endDate.getTime())) {
    throw new Error('endAt must be a valid datetime')
  }

  const sqlQuery = `
    ;WITH HourSlots AS (
      SELECT
        0 AS slot_index,
        DATEADD(hour, DATEDIFF(hour, 0, @EndAt), 0) AS slot_start
      UNION ALL
      SELECT
        slot_index + 1,
        DATEADD(hour, -1, slot_start)
      FROM HourSlots
      WHERE slot_index + 1 < @HoursBack
    ),
    LatestPerHour AS (
      SELECT
        DATEADD(hour, DATEDIFF(hour, 0, created_at), 0) AS slot_start,
        created_at,
        JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.Note_InjStartPos') AS InjectScrewPosition,
        JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.Note_ActInjtTime') AS VPTimeText,
        JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.VP_Position') AS VPPositionText,
        JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.InjPeakPressure') AS InjPeakPressure,
        JSON_VALUE(CONVERT(NVARCHAR(MAX), paramset), '$.Note_Cushion') AS Thickness,
        ROW_NUMBER() OVER (
          PARTITION BY DATEADD(hour, DATEDIFF(hour, 0, created_at), 0)
          ORDER BY created_at DESC, id DESC
        ) AS rn
      FROM IoT.dbo.MachineParameterSettingTRX
      WHERE machineId = @MachineID
        AND created_at >= DATEADD(
          hour,
          -(@HoursBack - 1),
          DATEADD(hour, DATEDIFF(hour, 0, @EndAt), 0)
        )
        AND created_at < DATEADD(
          hour,
          1,
          DATEADD(hour, DATEDIFF(hour, 0, @EndAt), 0)
        )
    )
    SELECT
      hs.slot_start,
      CONVERT(VARCHAR(5), hs.slot_start, 108) AS hour_label,
      lph.created_at,
      lph.InjectScrewPosition,
      lph.VPTimeText,
      lph.VPPositionText,
      lph.InjPeakPressure,
      lph.Thickness
    FROM HourSlots hs
    LEFT JOIN LatestPerHour lph
      ON lph.slot_start = hs.slot_start
      AND lph.rn = 1
    ORDER BY hs.slot_start ASC
    OPTION (MAXRECURSION 32767)
  `

  const rows = await queryDatabase(sqlQuery, {
    MachineID: resolvedMachineId,
    EndAt: formatSqlDateTimeLocal(endDate),
    HoursBack: requestedHoursBack,
  })

  let ranges: Record<
    string,
    { min: string | number | null; max: string | number | null }
  > = {}
  const nearestStdRow = await getNearestStdRowByMachine(resolvedMachineId)
  if (nearestStdRow) {
    const paramsetRaw = parseStdParamset(
      getRowValue(nearestStdRow, ['paramset'])
    )
    ranges = extractRangeValuesFromParamset(
      paramsetRaw as Record<string, unknown>
    )
  }

  const hours = (rows || []).map((row: any) => {
    const slotStart = row?.slot_start
      ? new Date(String(row.slot_start)).toISOString()
      : null
    const actualDate = row?.created_at
      ? new Date(String(row.created_at)).toISOString()
      : null
    const hasData = Boolean(row?.created_at)

    return {
      hourStart: slotStart,
      hourLabel:
        (row?.hour_label ? String(row.hour_label) : null) ||
        formatHourLabel(row?.slot_start),
      actualDate,
      hasData,
      values: hasData
        ? {
            InjectScrewPosition: row?.InjectScrewPosition ?? null,
            VPTimeText: row?.VPTimeText ?? null,
            VPPositionText: row?.VPPositionText ?? null,
            InjPeakPressure: row?.InjPeakPressure ?? null,
            Thickness: row?.Thickness ?? null,
          }
        : null,
    }
  })

  return {
    paraId: options?.paraId || 'ZHF-STD-001',
    machineId: resolvedMachineId,
    date: options?.date || null,
    endAt: endDate.toISOString(),
    hoursBack: requestedHoursBack,
    ranges: {
      InjectScrewPosition: ranges.InjectScrewPosition ?? { min: null, max: null },
      VPTimeText: ranges.VPTimeText ?? { min: null, max: null },
      VPPositionText: ranges.VPPositionText ?? { min: null, max: null },
      InjPeakPressure: ranges.InjPeakPressure ?? { min: null, max: null },
      Thickness: ranges.Thickness ?? { min: null, max: null },
    },
    hours,
  }
}

export async function checkZhafirParamsetExists(machineId: string) {
  const trxQueries = [
    `SELECT TOP 1 machineId FROM IoT.dbo.MachineParameterSettingTRX WHERE machineId = @MachineID`,
  ]
  const stdQueries = [
    `SELECT TOP 1 machineId FROM ${MACHINE_STD_TABLE} WHERE machineId = @MachineID`,
  ]
  const queries = [...trxQueries, ...stdQueries]

  let lastError: string | null = null
  let anySuccess = false
  for (const sqlQuery of queries) {
    try {
      const rows = await queryDatabase(sqlQuery, { MachineID: machineId })
      anySuccess = true
      if (Array.isArray(rows) && rows.length > 0) {
        return {
          machineId,
          exists: true,
        }
      }
    } catch (error) {
      lastError = (error as Error).message
    }
  }

  if (anySuccess) {
    return {
      machineId,
      exists: false,
    }
  }

  throw new Error(lastError || 'Failed to check machine id')
}

export async function updateHardcodedActField(
  field: string,
  value: number | string,
  machineId?: string
) {
  if (!ALLOWED_HARD_CODED_ACT_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not supported for manual ACT update.`)
  }

  const parsedValue = STRING_VALUE_FIELDS.has(field)
    ? String(value)
    : Number(value)
  if (!STRING_VALUE_FIELDS.has(field) && Number.isNaN(parsedValue)) {
    throw new Error(`Field "${field}" must be numeric.`)
  }

  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required for ACT save')
  }
  markZhafirManualChange(resolvedMachineId)

  const payload: Record<string, unknown> = {
    [field]: parsedValue,
  }
  const inserted = await insertZhafirActual('ZHF-STD-001', payload)
  const saved =
    Array.isArray((inserted as any).savedColumns) &&
    (inserted as any).savedColumns.length > 0

  return {
    machineId: resolvedMachineId,
    field,
    value: parsedValue,
    message: saved
      ? 'ACT value saved to database'
      : 'ACT field is not available in ParaSetTRX schema (skipped)',
  }
}

export async function updateHardcodedStdField(
  field: string,
  value: number | string,
  machineId?: string,
  materialRaw?: string,
  materialIdRaw?: string,
  materialNameRaw?: string
) {
  if (!ALLOWED_HARD_CODED_ACT_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not supported for manual STD update.`)
  }

  const parsedValue = STRING_VALUE_FIELDS.has(field)
    ? String(value)
    : Number(value)
  if (!STRING_VALUE_FIELDS.has(field) && Number.isNaN(parsedValue)) {
    throw new Error(`Field "${field}" must be numeric.`)
  }

  const resolvedMachineId = (machineId || '').trim()
  if (!resolvedMachineId) {
    throw new Error('machine_id is required for STD save')
  }
  markZhafirManualChange(resolvedMachineId)
  const saved = await upsertStdParamsetByMachine(
    resolvedMachineId,
    { [field]: parsedValue },
    undefined,
    materialRaw,
    materialIdRaw,
    materialNameRaw
  )
  return {
    machineId: resolvedMachineId,
    field,
    value: saved.paramset[field] ?? parsedValue,
    message: `STD value ${saved.action === 'insert' ? 'inserted' : 'updated'} on MachineParameterSettingSTD`,
  }
}

export async function updateHardcodedBulk(
  payload: {
    std?: Record<string, number | string>
    act?: Record<string, number | string>
  },
  machineId?: string,
  materialRaw?: string,
  materialIdRaw?: string,
  materialNameRaw?: string
) {
  const stdEntries = Object.entries(payload.std || {})
  const actEntries = Object.entries(payload.act || {})

  const resolvedMachineId = (machineId || '').trim()

  if (stdEntries.length > 0) {
    if (!resolvedMachineId) {
      throw new Error('machine_id is required for STD save')
    }
    markZhafirManualChange(resolvedMachineId)
    await upsertStdParamsetByMachine(
      resolvedMachineId,
      payload.std || {},
      undefined,
      materialRaw,
      materialIdRaw,
      materialNameRaw
    )
  }

  for (const [field, valueRaw] of actEntries) {
    const value = STRING_VALUE_FIELDS.has(field)
      ? String(valueRaw)
      : Number(valueRaw)
    await updateHardcodedActField(field, value, machineId)
  }

  return {
    machineId: resolvedMachineId || null,
    stdSavedTo: resolvedMachineId ? 'MachineParameterSettingSTD' : 'none',
    message: 'STD/ACT bulk updated',
    updatedStdCount: stdEntries.length,
    updatedActCount: actEntries.length,
  }
}

export async function upsertZhafirStd(
  paraId: string,
  payload: Record<string, unknown>,
  section?: string,
  machineId?: string,
  materialRaw?: string,
  materialIdRaw?: string,
  materialNameRaw?: string
) {
  if (!machineId || !machineId.trim()) {
    throw new Error('machine_id is required for STD save')
  }
  markZhafirManualChange(machineId.trim())

  const saved = await upsertStdParamsetByMachine(
    machineId.trim(),
    payload,
    section,
    materialRaw,
    materialIdRaw,
    materialNameRaw
  )

  return {
    message: `STD parameters ${saved.action === 'insert' ? 'inserted' : 'updated'}`,
    paraId,
    section: section || 'all',
    machineId: machineId.trim(),
    savedColumns: saved.savedColumns,
    stdTableAction: saved.action,
  }
}

export async function insertZhafirActual(
  paraId: string,
  payload: Record<string, unknown>,
  section?: string
) {
  const columns = resolveColumns(section)
  const allowedPayloadRaw = normalizePayload(payload, columns)
  const allowedPayloadNoMeta = Object.fromEntries(
    Object.entries(allowedPayloadRaw).filter(
      ([key]) => !(ZHAFIR_META_FIELDS as readonly string[]).includes(key)
    )
  ) as Record<string, string | number | null>
  const trxColumns = await getParaSetTrxColumns()
  const allowedPayload = Object.fromEntries(
    Object.entries(allowedPayloadNoMeta).filter(([key]) => trxColumns.has(key))
  ) as Record<string, string | number | null>
  const payloadKeys = Object.keys(allowedPayload)

  if (payloadKeys.length === 0) {
    return {
      message: 'ACT parameters skipped: no matching columns in ParaSetTRX',
      paraId,
      section: section || 'all',
      savedColumns: [],
      skippedColumns: Object.keys(allowedPayloadNoMeta),
    }
  }

  const insertColumns = ['ParaID', 'SettingDate', 'Active', ...payloadKeys]
  const insertValues = [
    '@ParaID',
    'GETDATE()',
    '1',
    ...payloadKeys.map((key) => `@${key}`),
  ]

  const sqlQuery = `
    INSERT INTO IoT.dbo.ParaSetTRX (${insertColumns.join(', ')})
    VALUES (${insertValues.join(', ')})
  `

  await queryDatabase(sqlQuery, { ParaID: paraId, ...allowedPayload })
  return {
    message: 'ACT parameters saved',
    paraId,
    section: section || 'all',
    savedColumns: payloadKeys,
  }
}