export function requireRole(allowedRoles = []) {
  return function roleMiddleware(req, res, next) {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        ok: false,
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
}