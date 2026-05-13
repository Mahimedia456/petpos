import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "./products.service.js";

export async function listProductsController(req, res) {
  const data = await listProducts({
    search: req.query.search || "",
    category_id: req.query.category_id || "",
    stock_filter: req.query.stock_filter || "",
  });

  return res.json({
    ok: true,
    data,
  });
}

export async function getProductController(req, res) {
  const data = await getProductById(req.params.id);

  if (!data) {
    return res.status(404).json({
      ok: false,
      message: "Product not found.",
    });
  }

  return res.json({
    ok: true,
    data,
  });
}

export async function createProductController(req, res) {
  const result = await createProduct(req.body, req.user);
  return res.status(result.status).json(result);
}

export async function updateProductController(req, res) {
  const result = await updateProduct(req.params.id, req.body);
  return res.status(result.status).json(result);
}

export async function deleteProductController(req, res) {
  const result = await deleteProduct(req.params.id);
  return res.status(result.status).json(result);
}