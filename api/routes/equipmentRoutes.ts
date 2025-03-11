import { Hono } from 'hono';

import { getTask } from '../controllers/scaleTaskController';
import { addEquipment, deleteEquipment, getEquipment, updateEquipment } from '../controllers/equipmentController';


const equipmentRoutes = new Hono();

equipmentRoutes.get('/', async (c) => {
  try {
    const data = await getEquipment();
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

equipmentRoutes.post('/', async (c) => {
  const { equipmentId, category, name, brand, energyBudget } = await c.req.json();
  try {
    await addEquipment(equipmentId, category, name, brand, energyBudget);
    return c.json({ message: 'Data added successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});
equipmentRoutes.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { equipmentId, category, name, brand, energyBudget } = await c.req.json();
  try {
    await updateEquipment(id, equipmentId, category, name, brand, energyBudget);
    return c.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

equipmentRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  try {
    await deleteEquipment(id);
    return c.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default equipmentRoutes;
