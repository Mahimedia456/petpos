import express from "express";
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createCustomerPet,
  updateCustomerPet,
  deleteCustomerPet,
} from "./customers.controller.js";

export default function customersRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/customers", authMiddleware, getCustomers(pool));
  router.post("/customers", authMiddleware, createCustomer(pool));

  router.get("/customers/:id", authMiddleware, getCustomerById(pool));
  router.patch("/customers/:id", authMiddleware, updateCustomer(pool));
  router.delete("/customers/:id", authMiddleware, deleteCustomer(pool));

  router.post("/customers/:id/pets", authMiddleware, createCustomerPet(pool));
  router.patch(
    "/customers/:id/pets/:petId",
    authMiddleware,
    updateCustomerPet(pool)
  );
  router.delete(
    "/customers/:id/pets/:petId",
    authMiddleware,
    deleteCustomerPet(pool)
  );

  return router;
}