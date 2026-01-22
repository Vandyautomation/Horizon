import { queryDatabase } from "../utils/queryDatabase";

// type CreateRoutingPayload = {
//   material_id: string;
//   material_name: string;
//   cvt: number;
//   ct: number;
//   scheduler?: string;
//   created_at?: string;
// }

type CreateRoutingPayload = {
  material_id: string
  material_name: string
  scheduler: "Injection" | "Coating"
  cvt: number
  ct?: number
}

export async function createRouting(payload: CreateRoutingPayload) {
  const { material_id, material_name, scheduler, cvt, ct } = payload

  if (!material_id || !material_name || !scheduler || !cvt || (scheduler === "Injection" && !ct)) {
    throw new Error("All required fields must be filled")
  }

  const query = `
    INSERT INTO iot.dbo.routing (
      material_id,
      material_name,
      scheduler,
      cvt,
      ct,
      created_at
    )
    VALUES (
      @material_id,
      @material_name,
      @scheduler,
      @cvt,
      @ct,
      @created_at
    )
  `

  await queryDatabase(query, { material_id, material_name, scheduler, cvt, ct: ct ?? 0 , created_at: new Date(),})

  return { message: "Routing data berhasil ditambahkan" }
}

// export async function createRouting(payload: CreateRoutingPayload) {
//   const {
//     material_id,
//     material_name,
//     cvt = 0,
//     ct = 0,
//     scheduler = '',
//     created_at = new Date().toISOString(),
//   } = payload;

//   if (!material_id || !material_name) {
//     throw new Error('material_id and material_name are required');
//   }

//   const query = `
//     INSERT INTO routing_data (material_id, material_name, cvt, ct, scheduler, created_at)
//     VALUES (@material_id, @material_name, @cvt, @ct, @scheduler, @created_at)
//   `;

//   const params = { material_id, material_name, cvt, ct, scheduler, created_at };
//   const result = await queryDatabase(query, params);
//   return result;
// }
