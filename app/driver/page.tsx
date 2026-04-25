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

const btn = {
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
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
    setLoading(true)

    const { data } = await supabase.auth.getSession()
    const user = data.session?.user

    if (!user) {
      router.push("/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role !== "driver") {
      router.push("/")
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

  async function uploadProof(orderId: number, file: File) {
  const fileName = `${orderId}-${Date.now()}.jpg`

  const { data, error } = await supabase.storage
    .from("proofs")
    .upload(fileName, file)

  if (error) {
    alert("Erreur upload")
    return
  }

  const { data: publicUrl } = supabase.storage
    .from("proofs")
    .getPublicUrl(fileName)

  await supabase
    .from("orders")
    .update({
      proof_image_url: publicUrl.publicUrl,
    })
    .eq("id", orderId)

  fetchOrders(driverId)
}

  async function takeOrder(orderId: number) {
  if (!driverId) return

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", driverId)
    .maybeSingle()

  const { error } = await supabase
    .from("orders")
    .update({
      assigned_driver_id: driverId,
      driver_phone: profile?.phone || null,
      delivery_status: "Pris en charge",
      driver_note: "Commande prise en charge par le livreur.",
    })
    .eq("id", orderId)
    .is("assigned_driver_id", null)

  if (error) alert(error.message)
  else await fetchOrders(driverId)
}

  async function updateDeliveryStatus(orderId: number, status: string) {
    if (!driverId) return

    let orderStatus = null

    if (status === "Livré") orderStatus = "Livré"
    if (status === "Refusé par client") orderStatus = "Refusé"

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
        : "Statut livraison mis à jour."

    const updateData: any = {
      delivery_status: status,
      driver_note: note,
    }

    if (orderStatus) {
      updateData.status = orderStatus
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .eq("assigned_driver_id", driverId)

    if (error) {
      alert(error.message)
    } else {
      await fetchOrders(driverId)
    }
  }

  function callClient(phone: string) {
    const cleaned = phone.replace(/\D/g, "")
    window.location.href = `tel:+${cleaned}`
  }

  function notifyClient(order: Order) {
  const phone = order.phone.replace(/\D/g, "")

  const message = `Bonjour ${order.client_name},

Notification Dhameni 🚚

Statut livraison : ${order.delivery_status || "Pris en charge"}

${order.driver_note ? `Info : ${order.driver_note}` : ""}

Merci de rester disponible pour faciliter la livraison.

Dhameni — commande sécurisée et suivie.`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
}

  function whatsappClient(order: Order) {
    const phone = order.phone.replace(/\D/g, "")

    const message = `Bonjour ${order.client_name},

Je suis le livreur de votre commande Dhameni.

Statut actuel : ${order.delivery_status || "Pris en charge"}

Merci de rester disponible pour la livraison.`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
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

          <p style={{ color: "#d1d5db" }}>Connecté : {driverEmail}</p>

          <p style={{ color: "#d1d5db", fontSize: 14 }}>
            Prenez une commande, contactez le client et mettez à jour la livraison.
          </p>

          <button
            onClick={logout}
            style={{
              ...btn,
              background: "white",
              color: "#111827",
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
                      <p><strong>Téléphone :</strong> {order.phone}</p>
                      <p><strong>Montant :</strong> {order.amount} TND</p>
                      <p><strong>Description :</strong> {order.description || "-"}</p>
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
                      border: "1px solid #e5e7eb",
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
                        ...btn,
                        width: "100%",
                        marginTop: 14,
                        background: "#111827",
                        color: "white",
                      }}
                    >
                      Prendre en charge
                    </button>
                  )}

                <label
                    style={{
                        display: "block",
                        marginTop: "14px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#111827",
                        color: "white",
                        textAlign: "center",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                    >
                    Ajouter preuve photo 📸
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: "none" }}
                        onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadProof(order.id, file)
                        }}
                    />
                    </label>

                  {isMine && (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: 8,
                          marginTop: 14,
                        }}
                      >
                        <button
                          onClick={() => callClient(order.phone)}
                          style={{
                            ...btn,
                            background: "#f3f4f6",
                            color: "#111827",
                            border: "1px solid #d1d5db",
                          }}
                        >
                          Appeler client
                        </button>

                        <button
                          onClick={() => whatsappClient(order)}
                          style={{
                            ...btn,
                            background: "#25D366",
                            color: "white",
                          }}
                        >
                          WhatsApp client
                        </button>
                      </div>

                      <h4 style={{ marginBottom: 8 }}>Changer statut livraison</h4>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => updateDeliveryStatus(order.id, "En route")}
                          style={{
                            ...btn,
                            background: "#dbeafe",
                            color: "#1d4ed8",
                          }}
                        >
                          En route
                        </button>

                        <button
                          onClick={() => updateDeliveryStatus(order.id, "Arrivé")}
                          style={{
                            ...btn,
                            background: "#e0e7ff",
                            color: "#3730a3",
                          }}
                        >
                          Arrivé
                        </button>

                        <button
                          onClick={() => updateDeliveryStatus(order.id, "Livré")}
                          style={{
                            ...btn,
                            background: "#dcfce7",
                            color: "#166534",
                          }}
                        >
                          Livré
                        </button>

                        <button
                          onClick={() => updateDeliveryStatus(order.id, "Client absent")}
                          style={{
                            ...btn,
                            background: "#fef3c7",
                            color: "#92400e",
                          }}
                        >
                          Client absent
                        </button>

                        <button
                          onClick={() => updateDeliveryStatus(order.id, "Refusé par client")}
                          style={{
                            ...btn,
                            background: "#fee2e2",
                            color: "#b91c1c",
                          }}
                        >
                          Refusé
                        </button>

                        <button
                            onClick={() => notifyClient(order)}
                            style={{
                                ...btn,
                                background: "#0ea5e9",
                                color: "white",
                            }}
                            >
                            Notifier client
                        </button>

                        <button
                          onClick={() => updateDeliveryStatus(order.id, "Report demandé")}
                          style={{
                            ...btn,
                            background: "#f3e8ff",
                            color: "#7e22ce",
                          }}
                        >
                          Report
                        </button>
                      </div>
                    </>
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