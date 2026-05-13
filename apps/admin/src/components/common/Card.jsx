export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-3xl border border-purple-100 bg-white shadow-sm " + className
      }
    >
      {children}
    </div>
  );
}