import { Hono } from 'hono'

const zhafirCountboardRoutes = new Hono()

// Temporarily disabled:
// - GET /live (MQTT live + DB fallback)

export default zhafirCountboardRoutes
