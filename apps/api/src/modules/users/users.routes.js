import express from "express";
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getRolesPermissions,
  updateRolePermissions,
} from "./users.controller.js";

export default function usersRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/users", authMiddleware, getUsers(pool));
  router.post("/users", authMiddleware, createUser(pool));
  router.get("/users/:id", authMiddleware, getUserById(pool));
  router.patch("/users/:id", authMiddleware, updateUser(pool));
  router.delete("/users/:id", authMiddleware, deleteUser(pool));

  router.get("/roles-permissions", authMiddleware, getRolesPermissions(pool));
  router.patch(
    "/roles-permissions/:role",
    authMiddleware,
    updateRolePermissions(pool)
  );

  return router;
}