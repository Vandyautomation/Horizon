import { queryDatabase } from '../utils/queryDatabase';

const MDP_THRESHOLD_TABLE = 'IoT.dbo.mdp_temperature_threshold_master';

export async function getMdpPositions(mdpId: number) {
  // Placeholder: replace with actual table/view when ready
  const rows = await queryDatabase(
    `SELECT TOP 50 * FROM IoT.dbo.mdp_positions WHERE mdp_id = @mdpId ORDER BY id ASC;`,
    { mdpId },
  );
  return rows;
}

export async function getMdpHistory(params: {
  mdpId: number;
  date: string;
  shift?: string;
}) {
  // Return timestamp in stable SQL local format (no timezone suffix)
  const rows = await queryDatabase(
    `SELECT TOP 500
       id,
       mdp_id,
       CONVERT(VARCHAR(19), [timestamp], 120) AS [timestamp],
       json_value,
       CONVERT(VARCHAR(19), created_at, 120) AS created_at,
       CONVERT(VARCHAR(19), modified_at, 120) AS modified_at
     FROM IoT.dbo.mdp_temperature_history 
     WHERE mdp_id = @mdpId AND CAST([timestamp] AS date) = @date
     ORDER BY [timestamp] DESC;`,
    {
      mdpId: params.mdpId,
      date: params.date,
    },
  );
  return rows;
}

export async function getMdpSummary(params: {
  mdpId: number;
  date: string;
  shift?: string;
}) {
  // Placeholder summary. Replace with proper aggregation later.
  const daily = await queryDatabase(
    `SELECT COUNT(*) AS spike_count
     FROM IoT.dbo.mdp_temperature_history
     WHERE mdp_id = @mdpId AND CAST([timestamp] AS date) = @date;`,
    { mdpId: params.mdpId, date: params.date },
  );
  return {
    daily: daily?.[0] ?? { spike_count: 0 },
    monthly: { spike_count: 0 },
    yearly: { spike_count: 0 },
  };
}

function normalizeMasterText(value: unknown) {
  return String(value ?? '').trim();
}

export async function getMdpProblemMaster() {
  const rows = await queryDatabase(
    `SELECT id, name, is_active, created_at, modified_at
     FROM IoT.dbo.mdp_problem_master
     WHERE is_active = 1
     ORDER BY name ASC;`
  );
  return rows;
}

export async function createMdpProblemMaster(name: string) {
  const cleaned = normalizeMasterText(name);
  if (!cleaned) throw new Error('Problem name is required');

  await queryDatabase(
    `
    IF EXISTS (
      SELECT 1
      FROM IoT.dbo.mdp_problem_master
      WHERE UPPER(LTRIM(RTRIM(name))) = UPPER(@Name)
    )
    BEGIN
      UPDATE IoT.dbo.mdp_problem_master
      SET is_active = 1,
          modified_at = SYSUTCDATETIME()
      WHERE UPPER(LTRIM(RTRIM(name))) = UPPER(@Name);
    END
    ELSE
    BEGIN
      INSERT INTO IoT.dbo.mdp_problem_master (name, is_active, created_at)
      VALUES (@Name, 1, SYSUTCDATETIME());
    END
    `,
    { Name: cleaned }
  );

  const rows = await queryDatabase(
    `SELECT TOP 1 id, name, is_active, created_at, modified_at
     FROM IoT.dbo.mdp_problem_master
     WHERE UPPER(LTRIM(RTRIM(name))) = UPPER(@Name)
     ORDER BY id DESC;`,
    { Name: cleaned }
  );

  return rows?.[0] ?? null;
}

export async function getMdpActionMaster(params: { problemId?: number }) {
  const problemId =
    params.problemId === undefined || params.problemId === null
      ? undefined
      : Number(params.problemId);

  if (
    problemId !== undefined &&
    (!Number.isInteger(problemId) || Number.isNaN(problemId) || problemId <= 0)
  ) {
    throw new Error('problemId must be a positive integer');
  }

  const rows = await queryDatabase(
    `SELECT id, name, problem_id, is_active, created_at, modified_at
     FROM IoT.dbo.mdp_action_master
     WHERE is_active = 1
       AND (@ProblemId IS NULL OR problem_id = @ProblemId)
     ORDER BY name ASC;`,
    { ProblemId: problemId ?? null }
  );
  return rows;
}

export async function getMdpThresholdMaster() {
  const rows = await queryDatabase(
    `SELECT
       id,
       mdp_id,
       CONVERT(VARCHAR(19), [timestamp], 120) AS [timestamp],
       JSON_VALUE(json_value, '$.ThresholdUpperID1') AS ThresholdUpperID1,
       JSON_VALUE(json_value, '$.ThresholdLowerID1') AS ThresholdLowerID1,
       JSON_VALUE(json_value, '$.ThresholdUpperID2') AS ThresholdUpperID2,
       JSON_VALUE(json_value, '$.ThresholdLowerID2') AS ThresholdLowerID2,
       JSON_VALUE(json_value, '$.ThresholdUpperID3') AS ThresholdUpperID3,
       JSON_VALUE(json_value, '$.ThresholdLowerID3') AS ThresholdLowerID3
     FROM ${MDP_THRESHOLD_TABLE}
     WHERE ISJSON(json_value) = 1
     ORDER BY [timestamp] DESC, id DESC;`
  );
  return rows;
}

export async function createMdpThresholdMaster(params: {
  mdpId: number;
  ThresholdUpperID1?: number | null;
  ThresholdLowerID1?: number | null;
  ThresholdUpperID2?: number | null;
  ThresholdLowerID2?: number | null;
  ThresholdUpperID3?: number | null;
  ThresholdLowerID3?: number | null;
}) {
  const mdpId = Number(params.mdpId);
  if (!Number.isInteger(mdpId) || Number.isNaN(mdpId) || mdpId <= 0) {
    throw new Error('mdpId must be a positive integer');
  }

  const payload = {
    ThresholdUpperID1: params.ThresholdUpperID1 ?? null,
    ThresholdLowerID1: params.ThresholdLowerID1 ?? null,
    ThresholdUpperID2: params.ThresholdUpperID2 ?? null,
    ThresholdLowerID2: params.ThresholdLowerID2 ?? null,
    ThresholdUpperID3: params.ThresholdUpperID3 ?? null,
    ThresholdLowerID3: params.ThresholdLowerID3 ?? null,
  };

  await queryDatabase(
    `
    INSERT INTO ${MDP_THRESHOLD_TABLE} (mdp_id, [timestamp], json_value, created_at, modified_at)
    VALUES (
      @MdpId,
      CONVERT(DATETIME2(0), (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'SE Asia Standard Time'),
      @JsonValue,
      CONVERT(DATETIME2(0), (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'SE Asia Standard Time'),
      NULL
    );
    `,
    {
      MdpId: mdpId,
      JsonValue: JSON.stringify(payload),
    }
  );

  const rows = await queryDatabase(
    `
    SELECT TOP 1
      id,
      mdp_id,
      CONVERT(VARCHAR(19), [timestamp], 120) AS [timestamp],
      JSON_VALUE(json_value, '$.ThresholdUpperID1') AS ThresholdUpperID1,
      JSON_VALUE(json_value, '$.ThresholdLowerID1') AS ThresholdLowerID1,
      JSON_VALUE(json_value, '$.ThresholdUpperID2') AS ThresholdUpperID2,
      JSON_VALUE(json_value, '$.ThresholdLowerID2') AS ThresholdLowerID2,
      JSON_VALUE(json_value, '$.ThresholdUpperID3') AS ThresholdUpperID3,
      JSON_VALUE(json_value, '$.ThresholdLowerID3') AS ThresholdLowerID3
    FROM ${MDP_THRESHOLD_TABLE}
    WHERE mdp_id = @MdpId
      AND ISJSON(json_value) = 1
      AND JSON_VALUE(json_value, '$.ThresholdUpperID1') = @Upper1
      AND JSON_VALUE(json_value, '$.ThresholdLowerID1') = @Lower1
      AND JSON_VALUE(json_value, '$.ThresholdUpperID2') = @Upper2
      AND JSON_VALUE(json_value, '$.ThresholdLowerID2') = @Lower2
      AND JSON_VALUE(json_value, '$.ThresholdUpperID3') = @Upper3
      AND JSON_VALUE(json_value, '$.ThresholdLowerID3') = @Lower3
    ORDER BY id DESC;
    `,
    {
      MdpId: mdpId,
      Upper1: payload.ThresholdUpperID1 === null ? null : String(payload.ThresholdUpperID1),
      Lower1: payload.ThresholdLowerID1 === null ? null : String(payload.ThresholdLowerID1),
      Upper2: payload.ThresholdUpperID2 === null ? null : String(payload.ThresholdUpperID2),
      Lower2: payload.ThresholdLowerID2 === null ? null : String(payload.ThresholdLowerID2),
      Upper3: payload.ThresholdUpperID3 === null ? null : String(payload.ThresholdUpperID3),
      Lower3: payload.ThresholdLowerID3 === null ? null : String(payload.ThresholdLowerID3),
    }
  );

  return rows?.[0] ?? null;
}

export async function deleteMdpThresholdMaster(id: number) {
  const rowId = Number(id);
  if (!Number.isInteger(rowId) || Number.isNaN(rowId) || rowId <= 0) {
    throw new Error('id must be a positive integer');
  }

  await queryDatabase(
    `DELETE FROM ${MDP_THRESHOLD_TABLE} WHERE id = @Id;`,
    { Id: rowId }
  );

  return { id: rowId };
}

export async function updateMdpThresholdMaster(
  id: number,
  params: {
    mdpId: number;
    ThresholdUpperID1?: number | null;
    ThresholdLowerID1?: number | null;
    ThresholdUpperID2?: number | null;
    ThresholdLowerID2?: number | null;
    ThresholdUpperID3?: number | null;
    ThresholdLowerID3?: number | null;
  }
) {
  const rowId = Number(id);
  const mdpId = Number(params.mdpId);
  if (!Number.isInteger(rowId) || Number.isNaN(rowId) || rowId <= 0) {
    throw new Error('id must be a positive integer');
  }
  if (!Number.isInteger(mdpId) || Number.isNaN(mdpId) || mdpId <= 0) {
    throw new Error('mdpId must be a positive integer');
  }

  await queryDatabase(
    `
    UPDATE ${MDP_THRESHOLD_TABLE}
    SET
      mdp_id = @MdpId,
      json_value = JSON_MODIFY(
        JSON_MODIFY(
          JSON_MODIFY(
            JSON_MODIFY(
              JSON_MODIFY(
                JSON_MODIFY(COALESCE(json_value, '{}'), '$.ThresholdUpperID1', @Upper1),
                '$.ThresholdLowerID1', @Lower1
              ),
              '$.ThresholdUpperID2', @Upper2
            ),
            '$.ThresholdLowerID2', @Lower2
          ),
          '$.ThresholdUpperID3', @Upper3
        ),
        '$.ThresholdLowerID3', @Lower3
      ),
      modified_at = CONVERT(
        DATETIME2(0),
        (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'SE Asia Standard Time'
      )
    WHERE id = @Id;
    `,
    {
      Id: rowId,
      MdpId: mdpId,
      Upper1: params.ThresholdUpperID1 ?? null,
      Lower1: params.ThresholdLowerID1 ?? null,
      Upper2: params.ThresholdUpperID2 ?? null,
      Lower2: params.ThresholdLowerID2 ?? null,
      Upper3: params.ThresholdUpperID3 ?? null,
      Lower3: params.ThresholdLowerID3 ?? null,
    }
  );

  const rows = await queryDatabase(
    `
    SELECT TOP 1
      id,
      mdp_id,
      CONVERT(VARCHAR(19), [timestamp], 120) AS [timestamp],
      JSON_VALUE(json_value, '$.ThresholdUpperID1') AS ThresholdUpperID1,
      JSON_VALUE(json_value, '$.ThresholdLowerID1') AS ThresholdLowerID1,
      JSON_VALUE(json_value, '$.ThresholdUpperID2') AS ThresholdUpperID2,
      JSON_VALUE(json_value, '$.ThresholdLowerID2') AS ThresholdLowerID2,
      JSON_VALUE(json_value, '$.ThresholdUpperID3') AS ThresholdUpperID3,
      JSON_VALUE(json_value, '$.ThresholdLowerID3') AS ThresholdLowerID3
    FROM ${MDP_THRESHOLD_TABLE}
    WHERE id = @Id;
    `,
    { Id: rowId }
  );

  return rows?.[0] ?? null;
}

export async function createMdpActionMaster(params: {
  name: string;
  problemId?: number;
}) {
  const cleaned = normalizeMasterText(params.name);
  const problemId =
    params.problemId === undefined || params.problemId === null
      ? undefined
      : Number(params.problemId);

  if (!cleaned) throw new Error('Action name is required');
  if (
    problemId !== undefined &&
    (!Number.isInteger(problemId) || Number.isNaN(problemId) || problemId <= 0)
  ) {
    throw new Error('problemId must be a positive integer');
  }

  await queryDatabase(
    `
    IF EXISTS (
      SELECT 1
      FROM IoT.dbo.mdp_action_master
      WHERE UPPER(LTRIM(RTRIM(name))) = UPPER(@Name)
        AND ISNULL(problem_id, 0) = ISNULL(@ProblemId, 0)
    )
    BEGIN
      UPDATE IoT.dbo.mdp_action_master
      SET is_active = 1,
          modified_at = SYSUTCDATETIME()
      WHERE UPPER(LTRIM(RTRIM(name))) = UPPER(@Name)
        AND ISNULL(problem_id, 0) = ISNULL(@ProblemId, 0);
    END
    ELSE
    BEGIN
      INSERT INTO IoT.dbo.mdp_action_master (name, problem_id, is_active, created_at)
      VALUES (@Name, @ProblemId, 1, SYSUTCDATETIME());
    END
    `,
    { Name: cleaned, ProblemId: problemId ?? null }
  );

  const rows = await queryDatabase(
    `SELECT TOP 1 id, name, problem_id, is_active, created_at, modified_at
     FROM IoT.dbo.mdp_action_master
     WHERE UPPER(LTRIM(RTRIM(name))) = UPPER(@Name)
       AND ISNULL(problem_id, 0) = ISNULL(@ProblemId, 0)
     ORDER BY id DESC;`,
    { Name: cleaned, ProblemId: problemId ?? null }
  );

  return rows?.[0] ?? null;
}

export async function updateMdpHistoryCauseComment(params: {
  rowId?: number;
  timestamp?: string;
  historyId: 1 | 2 | 3;
  cause: string;
  comment: string;
  mdpId?: number;
}) {
  const rowId =
    params.rowId === undefined || params.rowId === null
      ? NaN
      : Number(params.rowId);
  const historyId = Number(params.historyId);
  const mdpId = params.mdpId !== undefined ? Number(params.mdpId) : undefined;
  const timestamp = (params.timestamp || '').trim();

  if (![1, 2, 3].includes(historyId)) {
    throw new Error('historyId must be 1, 2, or 3');
  }
  if (
    mdpId !== undefined &&
    (!Number.isInteger(mdpId) || Number.isNaN(mdpId) || mdpId <= 0)
  ) {
    throw new Error('mdpId must be a positive integer');
  }
  if (
    !Number.isInteger(rowId) &&
    !(mdpId !== undefined && timestamp.length > 0)
  ) {
    throw new Error(
      'Provide either rowId, or mdpId + timestamp (YYYY-MM-DD HH:mm:ss)'
    );
  }

  let targetRowId = rowId;
  if (!Number.isInteger(targetRowId)) {
    const matchRows = await queryDatabase(
      `
      SELECT TOP 1 id
      FROM IoT.dbo.mdp_temperature_history
      WHERE mdp_id = @MdpId
        AND [timestamp] = COALESCE(
          TRY_CONVERT(DATETIME2(0), @Timestamp, 120), -- YYYY-MM-DD HH:mm:ss
          TRY_CONVERT(DATETIME2(0), @Timestamp, 126), -- YYYY-MM-DDTHH:mm:ss
          TRY_CONVERT(DATETIME2(0), @Timestamp)       -- fallback
        )
      ORDER BY id DESC
      `,
      {
        MdpId: mdpId,
        Timestamp: timestamp,
      }
    );
    targetRowId = Number(matchRows?.[0]?.id);
    if (!Number.isInteger(targetRowId) || targetRowId <= 0) {
      throw new Error('Row not found for given mdpId and timestamp');
    }
  }

  const causePath = `$.CauseID${historyId}`;
  const commentPath = `$.CommentID${historyId}`;

  const updateQuery = `
    UPDATE IoT.dbo.mdp_temperature_history
    SET
      json_value = JSON_MODIFY(
                    JSON_MODIFY(json_value, '${causePath}', @Cause),
                    '${commentPath}', @Comment
                  ),
      modified_at = CONVERT(DATETIME2(0), (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'SE Asia Standard Time')
    WHERE id = @TargetRowId
      ${mdpId !== undefined ? 'AND mdp_id = @MdpId' : ''}
  `;

  await queryDatabase(updateQuery, {
    TargetRowId: targetRowId,
    MdpId: mdpId,
    Cause: params.cause ?? '',
    Comment: params.comment ?? '',
  });

  const selectQuery = `
    SELECT TOP 1 id, mdp_id, [timestamp], json_value, created_at, modified_at
    FROM IoT.dbo.mdp_temperature_history
    WHERE id = @TargetRowId
      ${mdpId !== undefined ? 'AND mdp_id = @MdpId' : ''}
  `;

  const rows = await queryDatabase(selectQuery, {
    TargetRowId: targetRowId,
    MdpId: mdpId,
  });

  if (!rows?.length) {
    throw new Error('Row not found or mdpId mismatch');
  }

  return {
    rowId: targetRowId,
    mdpId: rows[0]?.mdp_id ?? mdpId ?? null,
    timestamp: rows[0]?.timestamp ?? null,
    historyId,
    causeField: `CauseID${historyId}`,
    commentField: `CommentID${historyId}`,
    data: rows[0],
  };
}

export async function updateMdpHistoryLocation(params: {
  rowId?: number;
  timestamp?: string;
  historyId: 1 | 2 | 3;
  location: string;
  mdpId?: number;
}) {
  const rowId =
    params.rowId === undefined || params.rowId === null
      ? NaN
      : Number(params.rowId);
  const historyId = Number(params.historyId);
  const mdpId = params.mdpId !== undefined ? Number(params.mdpId) : undefined;
  const timestamp = (params.timestamp || '').trim();

  if (![1, 2, 3].includes(historyId)) {
    throw new Error('historyId must be 1, 2, or 3');
  }
  if (
    mdpId !== undefined &&
    (!Number.isInteger(mdpId) || Number.isNaN(mdpId) || mdpId <= 0)
  ) {
    throw new Error('mdpId must be a positive integer');
  }
  if (
    !Number.isInteger(rowId) &&
    !(mdpId !== undefined && timestamp.length > 0)
  ) {
    throw new Error(
      'Provide either rowId, or mdpId + timestamp (YYYY-MM-DD HH:mm:ss)'
    );
  }

  let targetRowId = rowId;
  if (!Number.isInteger(targetRowId)) {
    const matchRows = await queryDatabase(
      `
      SELECT TOP 1 id
      FROM IoT.dbo.mdp_temperature_history
      WHERE mdp_id = @MdpId
        AND [timestamp] = COALESCE(
          TRY_CONVERT(DATETIME2(0), @Timestamp, 120),
          TRY_CONVERT(DATETIME2(0), @Timestamp, 126),
          TRY_CONVERT(DATETIME2(0), @Timestamp)
        )
      ORDER BY id DESC
      `,
      {
        MdpId: mdpId,
        Timestamp: timestamp,
      }
    );
    targetRowId = Number(matchRows?.[0]?.id);
    if (!Number.isInteger(targetRowId) || targetRowId <= 0) {
      throw new Error('Row not found for given mdpId and timestamp');
    }
  }

  const locationPath = `$.LocationID${historyId}`;

  const updateQuery = `
    UPDATE IoT.dbo.mdp_temperature_history
    SET
      json_value = JSON_MODIFY(json_value, '${locationPath}', @Location),
      modified_at = CONVERT(DATETIME2(0), (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'SE Asia Standard Time')
    WHERE id = @TargetRowId
      ${mdpId !== undefined ? 'AND mdp_id = @MdpId' : ''}
  `;

  await queryDatabase(updateQuery, {
    TargetRowId: targetRowId,
    MdpId: mdpId,
    Location: params.location ?? '',
  });

  const rows = await queryDatabase(
    `
    SELECT TOP 1 id, mdp_id, [timestamp], json_value, created_at, modified_at
    FROM IoT.dbo.mdp_temperature_history
    WHERE id = @TargetRowId
      ${mdpId !== undefined ? 'AND mdp_id = @MdpId' : ''}
    `,
    {
      TargetRowId: targetRowId,
      MdpId: mdpId,
    }
  );

  if (!rows?.length) {
    throw new Error('Row not found or mdpId mismatch');
  }

  return {
    rowId: targetRowId,
    mdpId: rows[0]?.mdp_id ?? mdpId ?? null,
    timestamp: rows[0]?.timestamp ?? null,
    historyId,
    locationField: `LocationID${historyId}`,
    data: rows[0],
  };
}
