import clsx from "clsx";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" &&
      "bg-brand-600 text-white shadow-lg shadow-purple-200 hover:bg-brand-700",
    variant === "light" &&
      "border border-purple-200 bg-white text-brand-700 hover:bg-purple-50",
    variant === "danger" &&
      "bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-red-700",
    className
  );

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}