import {
  createPosOrder,
  listPosCategories,
  listPosProducts,
} from "./pos.service.js";

export async function getPosCategoriesController(req, res) {
  const data = await listPosCategories();

  return res.json({
    ok: true,
    data,
  });
}

export async function getPosProductsController(req, res) {
  const data = await listPosProducts({
    search: req.query.search || "",
    category_id: req.query.category_id || "",
  });

  return res.json({
    ok: true,
    data,
  });
}

export async function createPosOrderController(req, res) {
  const result = await createPosOrder(req.body, req.user);

  return res.status(result.status).json(result);
}