"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import { QRCodeSVG } from "qrcode.react"

type OrderStatus =
  | "En attente paiement"
  | "Payé"
  | "Livré"
  | "Refusé"
  | "Retourné"

type Order = {
  id: number
  client_name: string
  phone: string
  amount: number
  description: string | null
  payment_link: string | null
  status: OrderStatus
  created_at: string
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #ffffff 100%)",
    color: "#111827",
    fontFamily: "Arial, sans-serif",
  } as React.CSSProperties,

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "16px",
  } as React.CSSProperties,

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  } as React.CSSProperties,

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#ffffff",
  } as React.CSSProperties,

  button: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  } as React.CSSProperties,

  smallButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  } as React.CSSProperties,
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [filter, setFilter] = useState("all")

  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [paymentLink, setPaymentLink] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    setErrorMessage("")

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false })

    if (error) {
      console.log("Erreur lecture :", error.message)
      setErrorMessage(error.message)
      setOrders([])
    } else {
      setOrders((data as Order[]) || [])
    }

    setLoading(false)
  }

  async function handleAddOrder(e: React.FormEvent) {
    e.preventDefault()

    if (!clientName.trim() || !phone.trim() || !amount.trim()) {
      alert("Remplis le nom du client, le téléphone et le montant.")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    const { error } = await supabase.from("orders").insert([
      {
        client_name: clientName.trim(),
        phone: phone.trim(),
        amount: Number(amount),
        description: description.trim() || null,
        payment_link: paymentLink.trim() || null,
        status: "En attente paiement",
      },
    ])

    if (error) {
      console.log("Erreur ajout :", error.message)
      setErrorMessage(error.message)
      alert("Erreur lors de l'ajout de la commande.")
    } else {
      setClientName("")
      setPhone("")
      setAmount("")
      setDescription("")
      setPaymentLink("")
      await fetchOrders()
      alert("Commande ajoutée avec succès")
    }

    setSubmitting(false)
  }

  async function updateOrderStatus(id: number, newStatus: OrderStatus) {
    setErrorMessage("")

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id)

    if (error) {
      console.log("Erreur update status :", error.message)
      setErrorMessage(error.message)
      alert("Erreur lors du changement de statut.")
    } else {
      await fetchOrders()
    }
  }

  async function deleteOrder(id: number) {
    const confirmed = window.confirm("Supprimer cette commande ?")
    if (!confirmed) return

    const { error } = await supabase.from("orders").delete().eq("id", id)

    if (error) {
      console.log("Erreur suppression :", error.message)
      setErrorMessage(error.message)
      alert("Erreur lors de la suppression.")
    } else {
      await fetchOrders()
    }
  }

  async function copyPaymentLink(link: string | null) {
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      alert("Lien copié")
    } catch {
      alert("Impossible de copier le lien")
    }
  }

  function formatPhoneForWhatsApp(phone: string) {
    return phone.replace(/\D/g, "")
  }

  function openWhatsApp(order: Order) {
    const phone = formatPhoneForWhatsApp(order.phone)

    const message = `Bonjour ${order.client_name},

Votre commande Dhameni est prête.

Montant : ${order.amount} TND
Statut : ${order.status}
${order.payment_link ? `Lien de paiement : ${order.payment_link}` : ""}

Merci.`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  function getStatusBadgeStyle(status: OrderStatus): React.CSSProperties {
    const base: React.CSSProperties = {
      display: "inline-block",
      padding: "7px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
      marginTop: "8px",
    }

    switch (status) {
      case "Payé":
        return { ...base, backgroundColor: "#dcfce7", color: "#166534" }
      case "Livré":
        return { ...base, backgroundColor: "#dbeafe", color: "#1d4ed8" }
      case "Refusé":
        return { ...base, backgroundColor: "#fee2e2", color: "#b91c1c" }
      case "Retourné":
        return { ...base, backgroundColor: "#f3e8ff", color: "#7e22ce" }
      default:
        return { ...base, backgroundColor: "#fef3c7", color: "#92400e" }
    }
  }

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter)

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "En attente paiement").length,
      paid: orders.filter((o) => o.status === "Payé").length,
      delivered: orders.filter((o) => o.status === "Livré").length,
    }
  }, [orders])

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section
          style={{
            ...styles.card,
            padding: "22px",
            marginBottom: "18px",
            background:
              "linear-gradient(135deg, #111827 0%, #1f2937 55%, #065f46 100%)",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                V0 • Paiement • WhatsApp • Suivi
              </div>

              <h1
                style={{
                  fontSize: "34px",
                  margin: "0 0 10px 0",
                  lineHeight: 1.1,
                }}
              >
                Dhameni 🚀
              </h1>

              <p
                style={{
                  fontSize: "17px",
                  margin: "0 0 10px 0",
                  color: "#e5e7eb",
                  lineHeight: 1.5,
                }}
              >
                Sécurisez vos commandes, paiements et livraisons en toute simplicité.
              </p>

              <p
                style={{
                  fontSize: "14px",
                  margin: 0,
                  color: "#d1d5db",
                  lineHeight: 1.5,
                }}
              >
                Moins de refus. Plus de confiance. Plus simple.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "14px",
                  padding: "14px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#d1d5db" }}>
                  Ce que fait Dhameni
                </div>
                <div style={{ marginTop: "8px", fontWeight: 700 }}>
                  Créer une commande
                </div>
                <div style={{ marginTop: "4px", fontWeight: 700 }}>
                  Envoyer le lien paiement
                </div>
                <div style={{ marginTop: "4px", fontWeight: 700 }}>
                  Suivre le statut
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Total commandes</div>
            <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>
              {stats.total}
            </div>
          </div>

          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>En attente</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                marginTop: "6px",
                color: "#92400e",
              }}
            >
              {stats.pending}
            </div>
          </div>

          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Payées</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                marginTop: "6px",
                color: "#166534",
              }}
            >
              {stats.paid}
            </div>
          </div>

          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Livrées</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                marginTop: "6px",
                color: "#1d4ed8",
              }}
            >
              {stats.delivered}
            </div>
          </div>
        </section>

        <section
          style={{
            ...styles.card,
            padding: "18px",
            marginBottom: "18px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>
              Ajouter une commande
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: 1.5 }}>
              Remplissez les informations du client et ajoutez un lien de paiement
              si disponible.
            </p>
          </div>

          <form
            onSubmit={handleAddOrder}
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Nom du client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Téléphone (ex: +33758803359 ou 216758803359)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Montant en TND"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />

            <textarea
              placeholder="Description de la commande"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...styles.input, resize: "vertical" }}
            />

            <input
              type="text"
              placeholder="Lien de paiement (optionnel)"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              style={styles.input}
            />

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.button,
                backgroundColor: "#111827",
                color: "#ffffff",
                padding: "14px",
                width: "100%",
              }}
            >
              {submitting ? "Ajout..." : "Créer la commande"}
            </button>
          </form>
        </section>

        <section style={{ ...styles.card, padding: "18px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 6px 0", fontSize: "22px" }}>
                Liste des commandes
              </h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: 1.5 }}>
                Suivez les paiements, partagez via WhatsApp et gérez le statut.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#fff",
                  width: "100%",
                  maxWidth: "260px",
                }}
              >
                <option value="all">Tous</option>
                <option value="En attente paiement">En attente paiement</option>
                <option value="Payé">Payé</option>
                <option value="Livré">Livré</option>
                <option value="Refusé">Refusé</option>
                <option value="Retourné">Retourné</option>
              </select>

              <button
                onClick={fetchOrders}
                style={{
                  ...styles.button,
                  backgroundColor: "#e5e7eb",
                  color: "#111827",
                }}
              >
                Recharger
              </button>
            </div>
          </div>

          {errorMessage && (
            <p
              style={{
                color: "#b91c1c",
                backgroundColor: "#fee2e2",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "12px",
              }}
            >
              Erreur : {errorMessage}
            </p>
          )}

          {loading ? (
            <p>Chargement...</p>
          ) : filteredOrders.length === 0 ? (
            <div
              style={{
                padding: "24px",
                borderRadius: "14px",
                backgroundColor: "#f9fafb",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Aucune commande pour le moment.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px",
                    padding: "16px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <h3 style={{ margin: 0, fontSize: "21px", wordBreak: "break-word" }}>
                          {order.client_name}
                        </h3>
                        <div style={getStatusBadgeStyle(order.status)}>
                          {order.status}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "14px",
                          display: "grid",
                          gap: "8px",
                          color: "#374151",
                          fontSize: "15px",
                          wordBreak: "break-word",
                        }}
                      >
                        <div>
                          <strong>Téléphone :</strong> {order.phone}
                        </div>
                        <div>
                          <strong>Montant :</strong> {order.amount} TND
                        </div>
                        <div>
                          <strong>Description :</strong> {order.description || "-"}
                        </div>
                        <div>
                          <strong>Paiement :</strong>{" "}
                          {order.payment_link ? "Lien disponible" : "-"}
                        </div>
                      </div>

                      {order.payment_link && (
                        <div
                          style={{
                            marginTop: "16px",
                            padding: "14px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "14px",
                            backgroundColor: "#f9fafb",
                            display: "inline-block",
                          }}
                        >
                          <QRCodeSVG value={order.payment_link} size={120} />
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "16px",
                        }}
                      >
                        {order.payment_link && (
                          <>
                            <a
                              href={order.payment_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                textDecoration: "none",
                                ...styles.smallButton,
                                backgroundColor: "#dbeafe",
                                color: "#1d4ed8",
                                display: "inline-block",
                                border: "none",
                              }}
                            >
                              Ouvrir
                            </a>

                            <button
                              onClick={() => copyPaymentLink(order.payment_link)}
                              style={{
                                ...styles.smallButton,
                                backgroundColor: "#ffffff",
                                color: "#111827",
                                border: "1px solid #d1d5db",
                              }}
                            >
                              Copier
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => openWhatsApp(order)}
                          style={{
                            ...styles.smallButton,
                            backgroundColor: "#25D366",
                            color: "#ffffff",
                            border: "none",
                          }}
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => updateOrderStatus(order.id, "Payé")}
                        style={{
                          ...styles.button,
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                        }}
                      >
                        Marquer Payé
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, "Livré")}
                        style={{
                          ...styles.button,
                          backgroundColor: "#dbeafe",
                          color: "#1d4ed8",
                        }}
                      >
                        Marquer Livré
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, "Refusé")}
                        style={{
                          ...styles.button,
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                        }}
                      >
                        Marquer Refusé
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, "Retourné")}
                        style={{
                          ...styles.button,
                          backgroundColor: "#f3e8ff",
                          color: "#7e22ce",
                        }}
                      >
                        Marquer Retourné
                      </button>

                      <button
                        onClick={() => deleteOrder(order.id)}
                        style={{
                          ...styles.button,
                          backgroundColor: "#111827",
                          color: "#ffffff",
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}