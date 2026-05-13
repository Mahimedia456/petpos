import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "./categories.service.js";

export async function listCategoriesController(req, res) {
  const data = await listCategories({
    search: req.query.search || "",
  });

  return res.json({
    ok: true,
    data,
  });
}

export async function getCategoryController(req, res) {
  const data = await getCategoryById(req.params.id);

  if (!data) {
    return res.status(404).json({
      ok: false,
      message: "Category not found.",
    });
  }

  return res.json({
    ok: true,
    data,
  });
}

export async function createCategoryController(req, res) {
  const result = await createCategory(req.body);
  return res.status(result.status).json(result);
}

export async function updateCategoryController(req, res) {
  const result = await updateCategory(req.params.id, req.body);
  return res.status(result.status).json(result);
}

export async function deleteCategoryController(req, res) {
  const result = await deleteCategory(req.params.id);
  return res.status(result.status).json(result);
}