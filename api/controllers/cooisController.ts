import { queryDatabase } from "../utils/queryDatabase";

type CreateCooisPayload = {
  so_name: string
  po_name: string
  material_id: string
  material_name: string
  required_qty: number
  produced_qty: number
  scrap_qty: number
}

export async function createCoois(payload: CreateCooisPayload) {
  const { so_name, po_name, material_id, material_name, required_qty, produced_qty, scrap_qty } = payload

  if (!so_name || !po_name || !material_id || !material_name || required_qty === undefined || produced_qty === undefined || scrap_qty === undefined) {
    throw new Error("All required fields must be filled")
  }

  const query = `
    INSERT INTO iot.dbo.coois (
      so_name,
      po_name,
      material_id,
      material_name,
      required_qty,
      produced_qty,
      scrap_qty,
      uploaded_at
    )
    VALUES (
      @so_name,
      @po_name,
      @material_id,
      @material_name,
      @required_qty,
      @produced_qty,
      @scrap_qty,
      @uploaded_at
    )
  `

  await queryDatabase(query, { so_name, po_name, material_id, material_name, required_qty, produced_qty, scrap_qty, uploaded_at: new Date(), })

  return { message: "Coois data berhasil ditambahkan" }
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
