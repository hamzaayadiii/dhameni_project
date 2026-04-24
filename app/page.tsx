"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { supabase } from "../lib/supabase"

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
  user_id: string | null
  public_token: string | null
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
  const router = useRouter()

  const [userId, setUserId] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [authLoading, setAuthLoading] = useState(true)

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [filter, setFilter] = useState("all")

  const [clientName, setClientName] = useState("")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [paymentLink, setPaymentLink] = useState("")

  useEffect(() => {
    initAuth()
  }, [])

  async function initAuth() {
    setAuthLoading(true)

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log("AUTH ERROR:", error.message)
      router.push("/login")
      return
    }

    const user = data.session?.user

    if (!user) {
      router.push("/login")
      return
    }

    console.log("USER CONNECTÉ:", user.id)

    setUserId(user.id)
    setUserEmail(user.email || "")
    await fetchOrders(user.id)

    setAuthLoading(false)
  }

  async function fetchOrders(activeUserId?: string) {
    const id = activeUserId || userId

    if (!id) {
      console.log("PAS DE USER ID POUR FETCH")
      return
    }

    console.log("FETCH ORDERS POUR:", id)

    setOrdersLoading(true)
    setErrorMessage("")

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", id)
      .order("id", { ascending: false })

    console.log("ORDERS DATA:", data)
    console.log("ORDERS ERROR:", error)

    if (error) {
      setErrorMessage(error.message)
      setOrders([])
    } else {
      setOrders((data as Order[]) || [])
    }

    setOrdersLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  async function handleAddOrder(e: React.FormEvent) {
    e.preventDefault()

    if (!userId) {
      alert("Session non trouvée. Reconnecte-toi.")
      router.push("/login")
      return
    }

    if (!clientName.trim() || !phone.trim() || !amount.trim()) {
      alert("Remplis le nom du client, le téléphone et le montant.")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    const newOrder = {
      client_name: clientName.trim(),
      phone: phone.trim(),
      amount: Number(amount),
      description: description.trim() || null,
      payment_link: paymentLink.trim() || null,
      status: "En attente paiement" as OrderStatus,
      user_id: userId,
    }

    console.log("INSERT ORDER:", newOrder)

    const { data, error } = await supabase
      .from("orders")
      .insert([newOrder])
      .select()

    console.log("INSERT DATA:", data)
    console.log("INSERT ERROR:", error)

    if (error) {
      setErrorMessage(error.message)
      alert("Erreur ajout : " + error.message)
    } else {
      setClientName("")
      setPhone("")
      setAmount("")
      setDescription("")
      setPaymentLink("")
      await fetchOrders(userId)
      alert("Commande ajoutée avec succès")
    }

    setSubmitting(false)
  }

  async function updateOrderStatus(id: number, newStatus: OrderStatus) {
    if (!userId) return

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      setErrorMessage(error.message)
      alert("Erreur statut : " + error.message)
    } else {
      await fetchOrders(userId)
    }
  }

  async function deleteOrder(id: number) {
    if (!userId) return

    const confirmed = window.confirm("Supprimer cette commande ?")
    if (!confirmed) return

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      setErrorMessage(error.message)
      alert("Erreur suppression : " + error.message)
    } else {
      await fetchOrders(userId)
    }
  }

  async function copyPaymentLink(link: string | null) {
    if (!link) return
    await navigator.clipboard.writeText(link)
    alert("Lien copié")
  }

  function formatPhoneForWhatsApp(phone: string) {
    return phone.replace(/\D/g, "")
  }

  function openWhatsApp(order: Order) {
  const phone = formatPhoneForWhatsApp(order.phone)
  const suiviLink = `${window.location.origin}/suivi/${order.public_token}`

  let statusMessage = ""

  if (order.status === "En attente paiement") {
    statusMessage = `Votre commande est prête.

Pour éviter les annulations et garantir la livraison, merci de confirmer ou payer.`
  }

  if (order.status === "Payé") {
    statusMessage = `Paiement confirmé.

Votre commande est en cours de préparation pour livraison.`
  }

  if (order.status === "Livré") {
    statusMessage = `Commande livrée avec succès.

Merci pour votre confiance.`
  }

  if (order.status === "Refusé") {
    statusMessage = `Commande refusée.

Cette action est enregistrée dans le système Dhameni.`
  }

  if (order.status === "Retourné") {
    statusMessage = `Commande retournée.

Le retour est enregistré pour garantir la transparence.`
  }

  const message = `Bonjour ${order.client_name},

Votre commande est enregistrée via Dhameni.

Montant : ${order.amount} TND
Statut : ${order.status}

🔎 Suivre votre commande : ${suiviLink}

✔️ Commande sécurisée
✔️ Livraison suivie
✔️ Traçabilité en cas de refus ou retour

${order.payment_link ? `Lien de paiement : ${order.payment_link}` : ""}

Merci.`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
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
    filter === "all" ? orders : orders.filter((order) => order.status === filter)

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "En attente paiement").length,
      paid: orders.filter((o) => o.status === "Payé").length,
      delivered: orders.filter((o) => o.status === "Livré").length,
    }
  }, [orders])

  if (authLoading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <p>Chargement session...</p>
        </div>
      </main>
    )
  }

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
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
                V1 • Compte vendeur • Paiement • WhatsApp • Suivi
              </div>

              <h1 style={{ fontSize: "34px", margin: "0 0 10px 0" }}>
                Dhameni 🚀
              </h1>

              <p style={{ fontSize: "17px", margin: "0 0 10px 0", color: "#e5e7eb" }}>
                Sécurisez vos commandes, paiements et livraisons en toute simplicité.
              </p>

              <p style={{ fontSize: "14px", margin: 0, color: "#d1d5db" }}>
                Moins de refus. Plus de confiance. Plus simple.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#d1d5db" }}>
                Connecté : {userEmail}
              </div>
              <div style={{ fontSize: "12px", color: "#d1d5db", marginTop: "6px" }}>
                User ID : {userId}
              </div>

              <button
                onClick={handleLogout}
                style={{
                  ...styles.button,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  marginTop: "12px",
                }}
              >
                Se déconnecter
              </button>
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
            <div style={{ fontSize: "28px", fontWeight: 800 }}>{stats.total}</div>
          </div>

          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>En attente</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#92400e" }}>
              {stats.pending}
            </div>
          </div>

          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Payées</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#166534" }}>
              {stats.paid}
            </div>
          </div>

          <div style={{ ...styles.card, padding: "16px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>Livrées</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1d4ed8" }}>
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
          <h2>Ajouter une commande</h2>

          <form onSubmit={handleAddOrder} style={{ display: "grid", gap: "12px" }}>
            <input
              type="text"
              placeholder="Nom du client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Téléphone"
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
              placeholder="Lien de paiement optionnel"
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
              }}
            >
              {submitting ? "Ajout..." : "Créer la commande"}
            </button>
          </form>
        </section>

        <section style={{ ...styles.card, padding: "18px" }}>
          <h2>Liste des commandes</h2>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
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
              onClick={() => fetchOrders(userId)}
              style={{ ...styles.button, backgroundColor: "#e5e7eb" }}
            >
              Recharger
            </button>
          </div>

          {errorMessage && (
            <p style={{ color: "#b91c1c", backgroundColor: "#fee2e2", padding: "12px", borderRadius: "10px" }}>
              Erreur : {errorMessage}
            </p>
          )}

          {ordersLoading ? (
            <p>Chargement commandes...</p>
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
              Aucune commande pour ce compte.
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
                  <h3 style={{ margin: 0 }}>{order.client_name}</h3>
                  <div style={getStatusBadgeStyle(order.status)}>{order.status}</div>

                  <div style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
                    <div><strong>Téléphone :</strong> {order.phone}</div>
                    <div><strong>Montant :</strong> {order.amount} TND</div>
                    <div><strong>Description :</strong> {order.description || "-"}</div>
                    <div><strong>Paiement :</strong> {order.payment_link ? "Lien disponible" : "-"}</div>
                    <div><strong>User commande :</strong> {order.user_id}</div>
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

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
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

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "8px",
                      marginTop: "16px",
                    }}
                  >
                    <button onClick={() => updateOrderStatus(order.id, "Payé")} style={{ ...styles.button, backgroundColor: "#dcfce7", color: "#166534" }}>
                      Marquer Payé
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, "Livré")} style={{ ...styles.button, backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
                      Marquer Livré
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, "Refusé")} style={{ ...styles.button, backgroundColor: "#fee2e2", color: "#b91c1c" }}>
                      Marquer Refusé
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, "Retourné")} style={{ ...styles.button, backgroundColor: "#f3e8ff", color: "#7e22ce" }}>
                      Marquer Retourné
                    </button>
                    <button onClick={() => deleteOrder(order.id)} style={{ ...styles.button, backgroundColor: "#111827", color: "#ffffff" }}>
                      Supprimer
                    </button>
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