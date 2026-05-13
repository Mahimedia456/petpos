export function openPrintWindow({ title = "Print", html }) {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function money(value, symbol = "Rs") {
  return `${symbol} ${Number(value || 0).toLocaleString()}`;
}