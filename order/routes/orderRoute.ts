import express from "express"
import { getOrders } from "../controllers/orderController"

const route = express.Router()

route.get("/", getOrders)

export default route