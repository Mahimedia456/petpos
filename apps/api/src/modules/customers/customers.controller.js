function cleanText(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function toBool(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "false") return false;
  if (value === "true") return true;
  return fallback;
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(value) {
  const n = toNumberOrNull(value);
  return n === null ? null : Math.trunc(n);
}

function toDateOrNull(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

export function getCustomers(pool) {
  return async function (req, res) {
    try {
      const search = cleanText(req.query.search);
      const active = req.query.active;

      const params = [];
      const where = [];

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            c.name ilike $${params.length}
            or c.phone ilike $${params.length}
            or c.email ilike $${params.length}
            or c.city ilike $${params.length}
          )
        `);
      }

      if (active === "true" || active === "false") {
        params.push(active === "true");
        where.push(`c.is_active = $${params.length}`);
      }

      const whereSql = where.length ? `where ${where.join(" and ")}` : "";

      const result = await pool.query(
        `
        select
          c.id,
          c.name,
          c.phone,
          c.email,
          c.address,
          c.city,
          c.whatsapp_opt_in,
          c.notes,
          c.total_orders,
          c.total_spent,
          c.last_order_at,
          c.is_active,
          c.created_at,
          c.updated_at,
          coalesce(count(cp.id), 0)::int as pets_count
        from customers c
        left join customer_pets cp
          on cp.customer_id = c.id
          and cp.is_active = true
        ${whereSql}
        group by c.id
        order by c.created_at desc
        limit 300
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*)::int as total_customers,
          count(*) filter (where whatsapp_opt_in = true)::int as whatsapp_customers,
          coalesce(sum(total_orders), 0)::int as total_orders,
          coalesce(sum(total_spent), 0)::numeric as total_spent
        from customers
        where is_active = true
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          customers: result.rows,
        },
      });
    } catch (error) {
      console.error("[getCustomers]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load customers.",
      });
    }
  };
}

export function createCustomer(pool) {
  return async function (req, res) {
    try {
      const body = req.body || {};

      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Customer name is required.",
        });
      }

      const result = await pool.query(
        `
        insert into customers (
          name,
          phone,
          email,
          address,
          city,
          whatsapp_opt_in,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
        `,
        [
          name,
          nullableText(body.phone),
          nullableText(body.email),
          nullableText(body.address),
          nullableText(body.city),
          toBool(body.whatsapp_opt_in, true),
          nullableText(body.notes),
        ]
      );

      res.status(201).json({
        ok: true,
        message: "Customer created successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[createCustomer]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to create customer.",
      });
    }
  };
}

export function getCustomerById(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const customerResult = await pool.query(
        `
        select *
        from customers
        where id = $1
        limit 1
        `,
        [id]
      );

      if (!customerResult.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Customer not found.",
        });
      }

      const petsResult = await pool.query(
        `
        select *
        from customer_pets
        where customer_id = $1
          and is_active = true
        order by created_at desc
        `,
        [id]
      );

      const ordersResult = await pool.query(
        `
        select
          id,
          order_number,
          channel,
          status,
          payment_status,
          total_amount,
          created_at
        from orders
        where customer_id = $1
        order by created_at desc
        limit 50
        `,
        [id]
      );

      res.json({
        ok: true,
        data: {
          customer: customerResult.rows[0],
          pets: petsResult.rows,
          orders: ordersResult.rows,
        },
      });
    } catch (error) {
      console.error("[getCustomerById]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load customer detail.",
      });
    }
  };
}

export function updateCustomer(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};

      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Customer name is required.",
        });
      }

      const result = await pool.query(
        `
        update customers
        set
          name = $1,
          phone = $2,
          email = $3,
          address = $4,
          city = $5,
          whatsapp_opt_in = $6,
          notes = $7,
          updated_at = now()
        where id = $8
        returning *
        `,
        [
          name,
          nullableText(body.phone),
          nullableText(body.email),
          nullableText(body.address),
          nullableText(body.city),
          toBool(body.whatsapp_opt_in, true),
          nullableText(body.notes),
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Customer not found.",
        });
      }

      res.json({
        ok: true,
        message: "Customer updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateCustomer]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update customer.",
      });
    }
  };
}

export function deleteCustomer(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        update customers
        set is_active = false,
            updated_at = now()
        where id = $1
        returning id
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Customer not found.",
        });
      }

      res.json({
        ok: true,
        message: "Customer archived successfully.",
      });
    } catch (error) {
      console.error("[deleteCustomer]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to archive customer.",
      });
    }
  };
}

export function createCustomerPet(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};

      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Pet name is required.",
        });
      }

      const customerCheck = await pool.query(
        `select id from customers where id = $1 limit 1`,
        [id]
      );

      if (!customerCheck.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Customer not found.",
        });
      }

      const result = await pool.query(
        `
        insert into customer_pets (
          customer_id,
          name,
          species,
          breed,
          gender,
          age_years,
          weight_kg,
          food_preference,
          allergies,
          medical_notes,
          vaccination_notes,
          next_vaccination_date,
          birthday
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        returning *
        `,
        [
          id,
          name,
          nullableText(body.species) || "dog",
          nullableText(body.breed),
          nullableText(body.gender),
          toIntOrNull(body.age_years),
          toNumberOrNull(body.weight_kg),
          nullableText(body.food_preference),
          nullableText(body.allergies),
          nullableText(body.medical_notes),
          nullableText(body.vaccination_notes),
          toDateOrNull(body.next_vaccination_date),
          toDateOrNull(body.birthday),
        ]
      );

      res.status(201).json({
        ok: true,
        message: "Pet added successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[createCustomerPet]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to add pet.",
      });
    }
  };
}

export function updateCustomerPet(pool) {
  return async function (req, res) {
    try {
      const { id, petId } = req.params;
      const body = req.body || {};

      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Pet name is required.",
        });
      }

      const result = await pool.query(
        `
        update customer_pets
        set
          name = $1,
          species = $2,
          breed = $3,
          gender = $4,
          age_years = $5,
          weight_kg = $6,
          food_preference = $7,
          allergies = $8,
          medical_notes = $9,
          vaccination_notes = $10,
          next_vaccination_date = $11,
          birthday = $12,
          updated_at = now()
        where id = $13
          and customer_id = $14
        returning *
        `,
        [
          name,
          nullableText(body.species) || "dog",
          nullableText(body.breed),
          nullableText(body.gender),
          toIntOrNull(body.age_years),
          toNumberOrNull(body.weight_kg),
          nullableText(body.food_preference),
          nullableText(body.allergies),
          nullableText(body.medical_notes),
          nullableText(body.vaccination_notes),
          toDateOrNull(body.next_vaccination_date),
          toDateOrNull(body.birthday),
          petId,
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Pet not found.",
        });
      }

      res.json({
        ok: true,
        message: "Pet updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateCustomerPet]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update pet.",
      });
    }
  };
}

export function deleteCustomerPet(pool) {
  return async function (req, res) {
    try {
      const { id, petId } = req.params;

      const result = await pool.query(
        `
        update customer_pets
        set is_active = false,
            updated_at = now()
        where id = $1
          and customer_id = $2
        returning id
        `,
        [petId, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Pet not found.",
        });
      }

      res.json({
        ok: true,
        message: "Pet archived successfully.",
      });
    } catch (error) {
      console.error("[deleteCustomerPet]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to archive pet.",
      });
    }
  };
}