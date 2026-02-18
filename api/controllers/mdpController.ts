import { queryDatabase } from '../utils/queryDatabase';

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
  intervalMinutes: number;
  shift?: string;
}) {
  // Placeholder query. Replace with actual historical table/view.
  const rows = await queryDatabase(
    `SELECT TOP 500 * 
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
