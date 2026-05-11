import { queryDatabase } from '../utils/queryDatabase'

export async function getCiltMonitoring() {
  const sqlQuery = `
    WITH RankedData AS (
       SELECT 
           m.MchId,
           m.MchDesc AS machine_name,
           m.MchLoc,
           m.UAP,
           t.task_id,
           t.mold_id,
           t.mold_name,
           t.material_id,
           t.material_name,
           t.daily_shoot,
           t.sum_dailyshoot,
           t.statusCILT,
           t.CILTLvl,
           t.statuslight,
           t.created_at,
           t.note,
           ROW_NUMBER() OVER (PARTITION BY m.MchId ORDER BY m.MchId) as rn
       FROM [iot].[dbo].[DailymoldTRX] t
       INNER JOIN [iot].[dbo].[MachineMST] m ON t.machine_id = m.MchId
       WHERE CAST(t.created_at AS DATE) = CAST(GETDATE() AS DATE)
   )
   SELECT 
       MchId,
       machine_name,
       MchLoc,
       UAP,
       task_id,
       mold_id,
       mold_name,
       material_id,
       material_name,
       daily_shoot,
       sum_dailyshoot,
       statusCILT,
       CILTLvl,
       statuslight,
       created_at,
       note
   FROM RankedData
   WHERE rn = 1 
   ORDER BY created_at desc;
  `
  return await queryDatabase(sqlQuery)
}
// export async function getCiltMonitoring() {
//   const sqlQuery = `
//     SELECT 
//     m.MchId,
//     m.MchDesc AS machine_name,
//     m.MchLoc,
//     m.UAP,
//     t.task_id,
//     t.mold_id,
//     t.mold_name,
//     t.material_id,
//     t.material_name,
//     t.daily_shoot,
//     t.sum_dailyshoot,
//     t.statusCILT,
//     t.CILTLvl,
//     t.statuslight,
//     t.created_at,
//     t.note
// FROM [iot].[dbo].[DailymoldTRX] t
// INNER JOIN [iot].[dbo].[MachineMST] m ON t.machine_id = m.MchId
// WHERE CAST(t.created_at AS DATE) = CAST(GETDATE() AS DATE)
// ORDER BY m.MchId;
//   `
//   return await queryDatabase(sqlQuery)
// }
// export async function getCiltMonitoring() {
//   const sqlQuery = `
//     SELECT 
//     m.MchId,
//     m.MchDesc AS machine_name,
//     m.MchLoc,
//     m.UAP,
//     t.task_id,
//     t.mold_id,
//     t.mold_name,
//     t.material_id,
//     t.material_name,
//     t.daily_shoot,
//     t.sum_dailyshoot,
//     t.statusCILT,
//     t.CILTLvl,
//     t.statuslight,
//     t.created_at,
//     t.note
// FROM [iot].[dbo].[DailymoldTRX] t
// INNER JOIN [iot].[dbo].[MachineMST] m ON t.machine_id = m.MchId
// WHERE CAST(t.created_at AS DATE) = CAST(GETDATE() AS DATE)
// ORDER BY t.created_at DESC;
//   `
//   return await queryDatabase(sqlQuery)
// }
export async function getCiltTrx() {
  const sqlQuery = `
    SELECT 
    m.MchId,
    m.MchDesc AS machine_name,
    m.MchLoc,
    m.UAP,
    t.dailyID,
    t.mold_id,
    t.mold_name,
    t.material_id,
    t.material_name,
    t.daily_shoot,
    t.statusCILT,
    t.CILTLvl,
    t.created_at,
    t.note
FROM [iot].[dbo].[CILT_TRX] t
INNER JOIN [iot].[dbo].[MachineMST] m ON t.machine_id = m.MchId
;
  `
  return await queryDatabase(sqlQuery)
}
export async function updateCiltStatus(
  MchId: string,
  status: string,
  note: string,
  lvMold: string
) {
  const sqlQuery = `
    UPDATE [iot].[dbo].[DailymoldTRX]
    SET 
      statusCILT = '${status}',
      note = '${note}',
      CILTLvl = '${lvMold}'
    WHERE machine_id = '${MchId}' 
    AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
  `
  return await queryDatabase(sqlQuery)
}
export async function completeCiltStatus(MchId: string) {
  const archiveQuery = `
    INSERT INTO [iot].[dbo].[CILT_TRX] (
      dailyID, machine_id, mold_id, mold_name, 
      material_id, material_name, daily_shoot, 
      statusCILT, CILTLvl, note, created_at, updated_at
    )
    SELECT 
      id, machine_id, mold_id, mold_name, 
      material_id, material_name, daily_shoot, 
      statusCILT, CILTLvl, note, created_at, GETDATE()
    FROM [iot].[dbo].[DailymoldTRX]
    WHERE machine_id = '${MchId}' 
    AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
  `

  const resetQuery = `
    UPDATE [iot].[dbo].[DailymoldTRX]
    SET 
      sum_dailyshoot = ISNULL(sum_dailyshoot, 0) + ISNULL(daily_shoot, 0),
      daily_shoot = 0,
      statusCILT = NULL,
      CILTLvl = NULL,
      note = NULL
    WHERE machine_id = '${MchId}' 
    AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE);
  `

  // Jalankan keduanya
  await queryDatabase(archiveQuery)
  return await queryDatabase(resetQuery)
}
// export async function getCiltMonitoring() {
//   const sqlQuery = `
//     WITH LatestTaskPerMachine AS (
//         SELECT
//             m.MchId,
//             m.MchDesc,
//             m.MchLoc,
//             m.UAP,
//             lt.machine_name,
//             lt.po_name,
//             lt.created_at AS task_created_at
//         FROM [iot].[dbo].[MachineMST] m
//         OUTER APPLY (
//             SELECT TOP 1
//                 t.machine_name,
//                 t.po_name,
//                 t.created_at
//             FROM [IoT].[dbo].[countboard_tasks] t
//             WHERE (t.mchId = m.MchId OR t.machine_name = m.MchDesc) -- Kondisi OR dikembalikan agar data akurat
//             ORDER BY t.created_at DESC, t.id DESC
//         ) lt
//         WHERE m.Active = 1
//         AND (m.UAP IS NULL OR m.UAP <> 'UV')
//         AND m.MchLoc LIKE 'INJ%'
//     ),
//     CooisDetail AS (
//         -- Ambil hanya PO yang ada di LatestTaskPerMachine saja, jangan scan seluruh tabel COOIS
//         SELECT
//             c.po_name,
//             c.material_name,
//             ROW_NUMBER() OVER(PARTITION BY c.po_name ORDER BY c.id DESC) as rn
//         FROM [IoT].[dbo].[coois] c
//         WHERE EXISTS (SELECT 1 FROM LatestTaskPerMachine ltm WHERE ltm.po_name = c.po_name)
//     ),
//     MoldMapping AS (
//         -- Buat mapping unik material ke mold_name
//         SELECT
//             r.material_name,
//             mm.mold_name,
//             ROW_NUMBER() OVER(PARTITION BY r.material_name ORDER BY r.id DESC) as rn_mold
//         FROM [IoT].[dbo].[routing] r
//         INNER JOIN [IoT].[dbo].[MoldMST] mm ON r.mold_id = mm.mold_id
//     )
//     SELECT
//         ltm.MchId,
//         ltm.MchDesc AS master_machine_name, -- Tambahkan ini buat cross-check
//         ltm.machine_name,
//         ltm.MchLoc,
//         ltm.UAP,
//         ltm.po_name,
//         ltm.task_created_at,
//         cd.material_name,
//         mp.mold_name
//     FROM LatestTaskPerMachine ltm
//     LEFT JOIN CooisDetail cd ON ltm.po_name = cd.po_name AND cd.rn = 1
//     LEFT JOIN MoldMapping mp ON cd.material_name = mp.material_name AND mp.rn_mold = 1
//     ORDER BY ltm.MchDesc ASC;
//   `
//   return await queryDatabase(sqlQuery)
// }
// export async function getCiltMonitoring() {
//   const sqlQuery = `
// WITH LatestTaskPerMachine AS (
//     -- Tahap 1: Filter Mesin Aktif dan lokasi INJ
//     SELECT
//         m.MchId,
//         m.MchDesc,
//         m.MchLoc,
//         m.UAP,
//         lt.machine_name AS machine_name,
//         lt.po_name,
//         lt.created_at AS task_created_at
//     FROM [iot].[dbo].[MachineMST] m
//     OUTER APPLY (
//         SELECT TOP 1
//             t.machine_name,
//             t.po_name,
//             t.created_at
//         FROM [IoT].[dbo].[countboard_tasks] t
//         WHERE t.mchId = m.MchId
//            OR t.machine_name = m.MchDesc
//         ORDER BY t.created_at DESC, t.id DESC
//     ) lt
//     WHERE m.Active = 1
//       AND (m.UAP IS NULL OR m.UAP <> 'UV')
//       AND m.MchLoc LIKE 'INJ%'
// ),
// CooisDetail AS (
//     -- Tahap 2: Ambil material_name dari coois
//     SELECT
//         c.po_name,
//         c.material_name,
//         ROW_NUMBER() OVER(PARTITION BY c.po_name ORDER BY c.id DESC) as rn
//     FROM [IoT].[dbo].[coois] c
// ),
// MoldMapping AS (
//     -- Tahap 3: Hubungkan material ke routing lalu ke MoldMST
//     -- Menggunakan DISTINCT atau ROW_NUMBER jika satu material punya banyak routing
//     SELECT
//         r.material_name,
//         mm.mold_name
//     FROM [IoT].[dbo].[routing] r
//     INNER JOIN [IoT].[dbo].[MoldMST] mm ON r.mold_id = mm.mold_id
// )
// SELECT
//     ltm.MchId,
//     ltm.machine_name,
//     ltm.MchLoc,
//     ltm.UAP,
//     ltm.po_name,
//     ltm.task_created_at,
//     cd.material_name,
//     -- Mengambil Mold Name hasil join 3 tabel
//     mp.mold_name
// FROM LatestTaskPerMachine ltm
// LEFT JOIN CooisDetail cd ON ltm.po_name = cd.po_name AND cd.rn = 1
// LEFT JOIN MoldMapping mp ON cd.material_name = mp.material_name
// ORDER BY ltm.MchDesc ASC;
//   `

//   return await queryDatabase(sqlQuery)
// }
// export async function getCiltMonitoring() {
//   const sqlQuery = `
// WITH LatestTaskPerMachine AS (
//     -- Tahap 1: Filter Mesin Aktif, Bukan UV, dan WAJIB lokasi INJ
//     SELECT
//         m.MchId,
//         m.MchDesc,
//         m.MchLoc,
//         m.UAP,
//         lt.machine_name AS machine_name,
//         lt.po_name,
//         lt.created_at AS task_created_at
//     FROM [iot].[dbo].[MachineMST] m
//     OUTER APPLY (
//         -- Mengambil transaksi terbaru untuk setiap mesin
//         SELECT TOP 1
//             t.machine_name,
//             t.po_name,
//             t.created_at
//         FROM [IoT].[dbo].[countboard_tasks] t
//         WHERE t.mchId = m.MchId
//            OR t.machine_name = m.MchDesc
//         ORDER BY t.created_at DESC, t.id DESC
//     ) lt
//     WHERE m.Active = 1
//       AND (m.UAP IS NULL OR m.UAP <> 'UV')
//       AND m.MchLoc LIKE 'INJ%'
// ),
// CooisDetail AS (
//     -- Tahap 2: Ambil detail material dari coois
//     SELECT
//         c.po_name,
//         c.material_name,
//         c.id AS coois_id,
//         LTRIM(RTRIM(
//             REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.material_name, ''), ':', ' '), ';', ' '), '/', ' '), '|', ' ')
//         )) AS norm_material_name,
//         ROW_NUMBER() OVER(PARTITION BY c.po_name ORDER BY c.id DESC) as rn
//     FROM [IoT].[dbo].[coois] c
// )
// SELECT
//     ltm.MchId,
//     ltm.MchDesc AS master_machine_name,
//     ltm.machine_name,
//     ltm.MchLoc,
//     ltm.UAP,
//     ltm.po_name,
//     ltm.task_created_at,
//     cd.material_name,
//     -- Logika 3 kata pertama untuk Mold Name
//     CASE
//         WHEN cd.norm_material_name = '' THEN NULL
//         ELSE LEFT(
//             cd.norm_material_name,
//             CASE
//                 WHEN CHARINDEX(' ', cd.norm_material_name + ' ',
//                     CHARINDEX(' ', cd.norm_material_name + ' ',
//                         CHARINDEX(' ', cd.norm_material_name + ' ') + 1
//                     ) + 1
//                 ) > 0
//                 THEN CHARINDEX(' ', cd.norm_material_name + ' ',
//                     CHARINDEX(' ', cd.norm_material_name + ' ',
//                         CHARINDEX(' ', cd.norm_material_name + ' ') + 1
//                     ) + 1
//                 ) - 1
//                 ELSE LEN(cd.norm_material_name)
//             END
//         )
//     END AS mold_name_3_words
// FROM LatestTaskPerMachine ltm
// LEFT JOIN CooisDetail cd ON ltm.po_name = cd.po_name AND cd.rn = 1
// ORDER BY ltm.MchDesc ASC;
//   `

//   return await queryDatabase(sqlQuery)
// }
// export async function getCiltMonitoring() {
//   const sqlQuery = `
// WITH coois_data AS (
//     SELECT
//         c.po_name,
//         c.id,
//         c.material_name,
//         LTRIM(RTRIM(
//             REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.material_name, ''), ':', ' '), ';', ' '), '/', ' '), '|', ' ')
//         )) AS norm_material_name
//     FROM [IoT].[dbo].[coois] c
// ),
// coois_parsed AS (
//     SELECT
//         cd.po_name,
//         cd.id,
//         cd.material_name,
//         CASE
//             WHEN cd.norm_material_name = '' THEN NULL
//             ELSE LEFT(
//                 cd.norm_material_name,
//                 CASE
//                     WHEN CHARINDEX(' ', cd.norm_material_name + ' ',
//                         CHARINDEX(' ', cd.norm_material_name + ' ',
//                             CHARINDEX(' ', cd.norm_material_name + ' ') + 1
//                         ) + 1
//                     ) > 0
//                     THEN CHARINDEX(' ', cd.norm_material_name + ' ',
//                         CHARINDEX(' ', cd.norm_material_name + ' ',
//                             CHARINDEX(' ', cd.norm_material_name + ' ') + 1
//                         ) + 1
//                     ) - 1
//                     ELSE LEN(cd.norm_material_name)
//                 END
//             )
//         END AS mold_name_3_words
//     FROM coois_data cd
// )
// SELECT top 200
//     cp.po_name,
//     cp.id,
//     cp.material_name,
//     cp.mold_name_3_words,
//     latest_task.machine_name,
//     latest_task.mchId,
//     m.UAP,
//     m.MchLoc,
//     m.MchDesc,
//     latest_task.created_at AS latest_task_created_at
// FROM coois_parsed cp
// -- Menggunakan CROSS APPLY agar data yang tidak punya task/mchId otomatis terfilter
// CROSS APPLY (
//     SELECT TOP 1
//         t.machine_name,
//         t.mchId,
//         t.created_at,
//         t.id
//     FROM [IoT].[dbo].[countboard_tasks] t
//     WHERE t.po_name = cp.po_name
//       AND t.mchId IS NOT NULL -- Memastikan mchId tidak null sejak awal
//     ORDER BY t.created_at DESC, t.id DESC
// ) latest_task
// INNER JOIN [iot].[dbo].[MachineMST] m ON latest_task.mchId = m.MchId
// WHERE (m.UAP IS NULL OR m.UAP <> 'UV')
// ORDER BY cp.id DESC;
//   `

//   return await queryDatabase(sqlQuery)
// }

//  WITH coois_data AS (
//     SELECT
//         c.po_name,
//         c.id,
//         c.material_name,
//         LTRIM(RTRIM(
//             REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.material_name, ''), ':', ' '), ';', ' '), '/', ' '), '|', ' ')
//         )) AS norm_material_name
//     FROM [IoT].[dbo].[coois] c
// ),
// coois_parsed AS (
//     SELECT
//         cd.po_name,
//         cd.id,
//         cd.material_name,
//         CASE
//             WHEN cd.norm_material_name = '' THEN NULL
//             ELSE LEFT(
//                 cd.norm_material_name,
//                 CASE
//                     WHEN CHARINDEX(' ', cd.norm_material_name + ' ',
//                         CHARINDEX(' ', cd.norm_material_name + ' ',
//                             CHARINDEX(' ', cd.norm_material_name + ' ') + 1
//                         ) + 1
//                     ) > 0
//                     THEN CHARINDEX(' ', cd.norm_material_name + ' ',
//                         CHARINDEX(' ', cd.norm_material_name + ' ',
//                             CHARINDEX(' ', cd.norm_material_name + ' ') + 1
//                         ) + 1
//                     ) - 1
//                     ELSE LEN(cd.norm_material_name)
//                 END
//             )
//         END AS mold_name_3_words
//     FROM coois_data cd
// )
// SELECT
//     cp.po_name,
//     cp.id,
//     cp.material_name,
//     cp.mold_name_3_words,
//     latest_task.machine_name,
//     latest_task.mchId,
//     m.UAP,
//     m.MchLoc,
//     m.MchDesc,
//     latest_task.created_at AS latest_task_created_at
// FROM coois_parsed cp
// OUTER APPLY (
//     SELECT TOP 1
//         t.machine_name,
//         t.mchId,
//         t.created_at,
//         t.id
//     FROM [IoT].[dbo].[countboard_tasks] t
//     WHERE t.po_name = cp.po_name
//     ORDER BY t.created_at DESC, t.id DESC
// ) latest_task
// LEFT JOIN [iot].[dbo].[MachineMST] m ON latest_task.mchId = m.MchId
// WHERE (m.UAP IS NULL OR m.UAP <> 'UV')
// ORDER BY cp.id DESC;
