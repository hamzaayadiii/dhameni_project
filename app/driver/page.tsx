"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

type Order = {
  id: number
  client_name: string
  phone: string
  amount: number
  description: string | null
  delivery_status: string | null
  driver_note: string | null
  assigned_driver_id: string | null
}

export default function DriverPage() {
  const router = useRouter()

  const [driverId, setDriverId] = useState("")
  const [driverEmail, setDriverEmail] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDriver()
  }, [])

  async function initDriver() {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user

    if (!user) {
      router.push("/login")
      return
    }

    setDriverId(user.id)
    setDriverEmail(user.email || "")
    await fetchOrders(user.id)
    setLoading(false)
  }

  async function fetchOrders(currentDriverId = driverId) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(`assigned_driver_id.is.null,assigned_driver_id.eq.${currentDriverId}`)
      .order("id", { ascending: false })

    if (error) {
      alert(error.message)
      setOrders([])
    } else {
      setOrders((data as Order[]) || [])
    }
  }

  async function takeOrder(orderId: number) {
    if (!driverId) return

    const { error } = await supabase
      .from("orders")
      .update({
        assigned_driver_id: driverId,
        delivery_status: "Pris en charge",
        driver_note: "Commande prise en charge par le livreur.",
      })
      .eq("id", orderId)
      .is("assigned_driver_id", null)

    if (error) {
      alert(error.message)
    } else {
      await fetchOrders(driverId)
    }
  }

  async function updateDeliveryStatus(orderId: number, status: string) {
    if (!driverId) return

    const note =
      status === "En route"
        ? "Le livreur est en route vers le client."
        : status === "Arrivé"
        ? "Le livreur est arrivé chez le client."
        : status === "Livré"
        ? "Commande livrée avec succès."
        : status === "Client absent"
        ? "Client absent lors de la tentative de livraison."
        : status === "Refusé par client"
        ? "Le client a refusé la commande."
        : status === "Report demandé"
        ? "Le client a demandé un autre créneau de livraison."
        : null

    const { error } = await supabase
      .from("orders")
      .update({
        delivery_status: status,
        driver_note: note,
      })
      .eq("id", orderId)
      .eq("assigned_driver_id", driverId)

    if (error) {
      alert(error.message)
    } else {
      await fetchOrders(driverId)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <main style={{ padding: 20 }}>Chargement livreur...</main>
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #111827, #065f46)",
            color: "white",
            padding: 20,
            borderRadius: 18,
            marginBottom: 18,
          }}
        >
          <h1 style={{ marginTop: 0 }}>Espace Livreur 🚚</h1>
          <p style={{ color: "#d1d5db" }}>
            Connecté : {driverEmail}
          </p>
          <p style={{ color: "#d1d5db", fontSize: 14 }}>
            Prenez une commande, mettez à jour la livraison et gardez une trace claire.
          </p>

          <button
            onClick={logout}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Se déconnecter
          </button>
        </section>

        {orders.length === 0 ? (
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 16,
              border: "1px solid #e5e7eb",
            }}
          >
            Aucune commande disponible.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {orders.map((order) => {
              const isMine = order.assigned_driver_id === driverId
              const isFree = !order.assigned_driver_id

              return (
                <article
                  key={order.id}
                  style={{
                    background: "white",
                    padding: 16,
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0 }}>{order.client_name}</h3>
                      <p>
                        <strong>Téléphone :</strong> {order.phone}
                      </p>
                      <p>
                        <strong>Montant :</strong> {order.amount} TND
                      </p>
                      <p>
                        <strong>Description :</strong> {order.description || "-"}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: isMine ? "#dcfce7" : "#fef3c7",
                        color: isMine ? "#166534" : "#92400e",
                        height: "fit-content",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {isMine ? "Ma commande" : "Disponible"}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "#f9fafb",
                    }}
                  >
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Livraison :</strong>{" "}
                      {order.delivery_status || "En attente livreur"}
                    </p>

                    {order.driver_note && (
                      <p style={{ margin: 0, color: "#1d4ed8" }}>
                        <strong>Note :</strong> {order.driver_note}
                      </p>
                    )}
                  </div>

                  {isFree && (
                    <button
                      onClick={() => takeOrder(order.id)}
                      style={{
                        width: "100%",
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 10,
                        border: "none",
                        background: "#111827",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Prendre en charge
                    </button>
                  )}

                  {isMine && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 8,
                        marginTop: 14,
                      }}
                    >
                      <button onClick={() => updateDeliveryStatus(order.id, "En route")}>
                        En route
                      </button>

                      <button onClick={() => updateDeliveryStatus(order.id, "Arrivé")}>
                        Arrivé
                      </button>

                      <button onClick={() => updateDeliveryStatus(order.id, "Livré")}>
                        Livré
                      </button>

                      <button onClick={() => updateDeliveryStatus(order.id, "Client absent")}>
                        Client absent
                      </button>

                      <button onClick={() => updateDeliveryStatus(order.id, "Refusé par client")}>
                        Refusé
                      </button>

                      <button onClick={() => updateDeliveryStatus(order.id, "Report demandé")}>
                        Report
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}