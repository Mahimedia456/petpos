import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_PET = {
  name: "",
  species: "dog",
  breed: "",
  gender: "",
  age_years: "",
  weight_kg: "",
  food_preference: "",
  allergies: "",
  medical_notes: "",
  vaccination_notes: "",
  next_vaccination_date: "",
  birthday: "",
};

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}

function StatusBadge({ value }) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    processing: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    ready: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    out_for_delivery: "bg-purple-50 text-purple-700 ring-purple-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [pets, setPets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [petForm, setPetForm] = useState(EMPTY_PET);
  const [editingPetId, setEditingPetId] = useState(null);
  const [savingPet, setSavingPet] = useState(false);
  const [message, setMessage] = useState("");

  const whatsappMessage = useMemo(() => {
    if (!customer) return "";

    return `Hello ${customer.name}, thank you for shopping with us. Let us know if you need pet food, grooming items, medicine, or accessories.`;
  }, [customer]);

  async function loadCustomer() {
    try {
      setLoading(true);

      const res = await apiFetch(`/admin/customers/${id}`);
      const json = await res.json();

      if (json?.ok) {
        setCustomer(json.data.customer);
        setPets(json.data.pets || []);
        setOrders(json.data.orders || []);
      }
    } catch (error) {
      console.error("[CustomerDetailPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [id]);

  function updatePetField(name, value) {
    setPetForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetPetForm() {
    setPetForm(EMPTY_PET);
    setEditingPetId(null);
  }

  function editPet(pet) {
    setEditingPetId(pet.id);
    setPetForm({
      name: pet.name || "",
      species: pet.species || "dog",
      breed: pet.breed || "",
      gender: pet.gender || "",
      age_years: pet.age_years ?? "",
      weight_kg: pet.weight_kg ?? "",
      food_preference: pet.food_preference || "",
      allergies: pet.allergies || "",
      medical_notes: pet.medical_notes || "",
      vaccination_notes: pet.vaccination_notes || "",
      next_vaccination_date: pet.next_vaccination_date
        ? String(pet.next_vaccination_date).slice(0, 10)
        : "",
      birthday: pet.birthday ? String(pet.birthday).slice(0, 10) : "",
    });
  }

  async function savePet(e) {
    e.preventDefault();

    try {
      setSavingPet(true);
      setMessage("");

      const endpoint = editingPetId
        ? `/admin/customers/${id}/pets/${editingPetId}`
        : `/admin/customers/${id}/pets`;

      const res = await apiFetch(endpoint, {
        method: editingPetId ? "PATCH" : "POST",
        body: JSON.stringify(petForm),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save pet.");
        return;
      }

      setMessage(editingPetId ? "Pet updated." : "Pet added.");
      resetPetForm();
      await loadCustomer();
    } catch (error) {
      console.error("[savePet]", error);
      setMessage("Something went wrong.");
    } finally {
      setSavingPet(false);
    }
  }

  async function deletePet(petId) {
    try {
      const res = await apiFetch(`/admin/customers/${id}/pets/${petId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to archive pet.");
        return;
      }

      setMessage("Pet archived.");
      await loadCustomer();
    } catch (error) {
      console.error("[deletePet]", error);
      setMessage("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading customer detail...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700 shadow-sm">
        Customer not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to="/customers"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to Customers
          </Link>

          <h1 className="mt-4 text-3xl font-black text-slate-950">
            {customer.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Customer profile, pet records, notes, and purchase history.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/customers/${customer.id}/edit`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Edit Customer
          </Link>

          <Link
            to="/pos"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
          >
            New POS Sale
          </Link>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Customer Information
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Phone" value={customer.phone} />
              <InfoCard label="Email" value={customer.email} />
              <InfoCard label="City" value={customer.city} />
              <InfoCard
                label="WhatsApp"
                value={customer.whatsapp_opt_in ? "Enabled" : "Disabled"}
              />
              <InfoCard label="Address" value={customer.address} />
              <InfoCard
                label="Customer Since"
                value={
                  customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString()
                    : "-"
                }
              />
            </div>

            {customer.notes ? (
              <div className="mt-4 rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  CRM Notes
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {customer.notes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Pet Profiles
            </h2>

            <div className="mt-5 grid gap-4">
              {pets.length ? (
                pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">
                          {pet.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-500">
                          {pet.species}
                          {pet.breed ? ` • ${pet.breed}` : ""}
                          {pet.gender ? ` • ${pet.gender}` : ""}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editPet(pet)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deletePet(pet.id)}
                          className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                        >
                          Archive
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <InfoCard label="Age" value={pet.age_years} />
                      <InfoCard label="Weight KG" value={pet.weight_kg} />
                      <InfoCard
                        label="Next Vaccination"
                        value={
                          pet.next_vaccination_date
                            ? new Date(
                                pet.next_vaccination_date
                              ).toLocaleDateString()
                            : "-"
                        }
                      />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoCard
                        label="Food Preference"
                        value={pet.food_preference}
                      />
                      <InfoCard label="Allergies" value={pet.allergies} />
                      <InfoCard
                        label="Medical Notes"
                        value={pet.medical_notes}
                      />
                      <InfoCard
                        label="Vaccination Notes"
                        value={pet.vaccination_notes}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  No pets added yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">
                Purchase History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.length ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-slate-950">
                          {order.order_number || `ORD-${String(order.id).slice(0, 8)}`}
                        </td>
                        <td className="px-6 py-4 font-semibold capitalize text-slate-600">
                          {labelize(order.channel)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge value={order.status} />
                        </td>
                        <td className="px-6 py-4 font-semibold capitalize text-slate-600">
                          {labelize(order.payment_status)}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-950">
                          {money(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/orders/${order.id}`}
                            className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center font-semibold text-slate-500"
                      >
                        No linked orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <form
            onSubmit={savePet}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-black text-slate-950">
              {editingPetId ? "Edit Pet" : "Add Pet"}
            </h2>

            <div className="mt-5 space-y-4">
              <input
                value={petForm.name}
                onChange={(e) => updatePetField("name", e.target.value)}
                required
                placeholder="Pet name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={petForm.species}
                  onChange={(e) => updatePetField("species", e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="fish">Fish</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>

                <input
                  value={petForm.breed}
                  onChange={(e) => updatePetField("breed", e.target.value)}
                  placeholder="Breed"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={petForm.gender}
                  onChange={(e) => updatePetField("gender", e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <input
                  type="number"
                  value={petForm.age_years}
                  onChange={(e) => updatePetField("age_years", e.target.value)}
                  placeholder="Age years"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
              </div>

              <input
                type="number"
                step="0.01"
                value={petForm.weight_kg}
                onChange={(e) => updatePetField("weight_kg", e.target.value)}
                placeholder="Weight KG"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <input
                type="date"
                value={petForm.next_vaccination_date}
                onChange={(e) =>
                  updatePetField("next_vaccination_date", e.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <input
                type="date"
                value={petForm.birthday}
                onChange={(e) => updatePetField("birthday", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <textarea
                value={petForm.food_preference}
                onChange={(e) =>
                  updatePetField("food_preference", e.target.value)
                }
                rows={2}
                placeholder="Food preference"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <textarea
                value={petForm.allergies}
                onChange={(e) => updatePetField("allergies", e.target.value)}
                rows={2}
                placeholder="Allergies"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <textarea
                value={petForm.medical_notes}
                onChange={(e) =>
                  updatePetField("medical_notes", e.target.value)
                }
                rows={2}
                placeholder="Medical notes"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <textarea
                value={petForm.vaccination_notes}
                onChange={(e) =>
                  updatePetField("vaccination_notes", e.target.value)
                }
                rows={2}
                placeholder="Vaccination notes"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingPet}
                  className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingPet ? "Saving..." : editingPetId ? "Update Pet" : "Add Pet"}
                </button>

                {editingPetId ? (
                  <button
                    type="button"
                    onClick={resetPetForm}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-black">WhatsApp Quick Message</h2>
            <p className="mt-2 text-sm text-slate-300">
              Manual message copy for now. WhatsApp API module mein direct send
              connect hoga.
            </p>

            <textarea
              readOnly
              value={whatsappMessage}
              className="mt-4 h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white outline-none"
            />

            {customer.phone ? (
              <a
                href={`https://wa.me/${String(customer.phone).replace(/\D/g, "")}?text=${encodeURIComponent(
                  whatsappMessage
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-2xl bg-green-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-green-600"
              >
                Open WhatsApp
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}