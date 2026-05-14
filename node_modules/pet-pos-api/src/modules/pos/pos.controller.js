import {
  createPosOrder,
  findPosProductByBarcode,
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

export async function scanPosBarcodeController(req, res) {
  const barcode = req.query.barcode || req.body?.barcode || "";

  if (!barcode) {
    return res.status(400).json({
      ok: false,
      message: "Barcode is required.",
    });
  }

  const product = await findPosProductByBarcode({
    barcode,
  });

  if (!product) {
    return res.status(404).json({
      ok: false,
      message: "No product found for this barcode.",
    });
  }

  if (Number(product.stock_qty || 0) <= 0) {
    return res.status(409).json({
      ok: false,
      message: "Product is out of stock.",
      data: product,
    });
  }

  return res.json({
    ok: true,
    message: "Product found.",
    data: product,
  });
}

export async function createPosOrderController(req, res) {
  const result = await createPosOrder(req.body, req.user);

  return res.status(result.status).json(result);
}