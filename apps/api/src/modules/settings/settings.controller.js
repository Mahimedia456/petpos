function cleanText(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function toNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

async function ensureSettingsRow(pool) {
  const existing = await pool.query(`
    select *
    from store_settings
    order by created_at asc
    limit 1
  `);

  if (existing.rows.length) {
    return existing.rows[0];
  }

  const created = await pool.query(`
    insert into store_settings (
      store_name,
      store_email,
      store_city,
      currency_code,
      currency_symbol,
      receipt_header,
      receipt_footer,
      low_stock_default,
      expiry_alert_days,
      order_prefix,
      whatsapp_order_prefix,
      timezone
    )
    values (
      'Pet POS Store',
      'aamir@mahimediasolutions.com',
      'Karachi',
      'PKR',
      'Rs',
      'Thank you for shopping with us.',
      'Exchange allowed within store policy. Please keep this receipt.',
      5,
      30,
      'ORD',
      'WA',
      'Asia/Karachi'
    )
    returning *
  `);

  return created.rows[0];
}

export function getStoreSettings(pool) {
  return async function (req, res) {
    try {
      const settings = await ensureSettingsRow(pool);

      res.json({
        ok: true,
        data: settings,
      });
    } catch (error) {
      console.error("[getStoreSettings]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load store settings.",
      });
    }
  };
}

export function updateStoreSettings(pool) {
  return async function (req, res) {
    try {
      const current = await ensureSettingsRow(pool);
      const body = req.body || {};

      const storeName = cleanText(body.store_name);

      if (!storeName) {
        return res.status(400).json({
          ok: false,
          message: "Store name is required.",
        });
      }

      const result = await pool.query(
        `
        update store_settings
        set
          store_name = $1,
          store_phone = $2,
          store_email = $3,
          store_address = $4,
          store_city = $5,

          logo_url = $6,

          currency_code = $7,
          currency_symbol = $8,

          tax_enabled = $9,
          tax_rate = $10,

          receipt_header = $11,
          receipt_footer = $12,
          receipt_show_logo = $13,
          receipt_show_barcode = $14,

          whatsapp_number = $15,
          whatsapp_enabled = $16,

          low_stock_default = $17,
          expiry_alert_days = $18,

          delivery_enabled = $19,
          default_delivery_fee = $20,
          free_delivery_min_amount = $21,

          order_prefix = $22,
          whatsapp_order_prefix = $23,

          timezone = $24,

          updated_at = now()
        where id = $25
        returning *
        `,
        [
          storeName,
          nullableText(body.store_phone),
          nullableText(body.store_email),
          nullableText(body.store_address),
          nullableText(body.store_city),

          nullableText(body.logo_url),

          nullableText(body.currency_code) || "PKR",
          nullableText(body.currency_symbol) || "Rs",

          toBool(body.tax_enabled, false),
          toNumber(body.tax_rate, 0),

          nullableText(body.receipt_header),
          nullableText(body.receipt_footer),
          toBool(body.receipt_show_logo, true),
          toBool(body.receipt_show_barcode, true),

          nullableText(body.whatsapp_number),
          toBool(body.whatsapp_enabled, true),

          toInt(body.low_stock_default, 5),
          toInt(body.expiry_alert_days, 30),

          toBool(body.delivery_enabled, true),
          toNumber(body.default_delivery_fee, 0),
          body.free_delivery_min_amount === "" ||
          body.free_delivery_min_amount === null ||
          body.free_delivery_min_amount === undefined
            ? null
            : toNumber(body.free_delivery_min_amount, 0),

          nullableText(body.order_prefix) || "ORD",
          nullableText(body.whatsapp_order_prefix) || "WA",

          nullableText(body.timezone) || "Asia/Karachi",

          current.id,
        ]
      );

      res.json({
        ok: true,
        message: "Store settings updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateStoreSettings]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update store settings.",
      });
    }
  };
}