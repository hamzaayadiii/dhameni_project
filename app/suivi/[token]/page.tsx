"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../../lib/supabase"

type Order = {
  id: number
  client_name: string
  phone: string
  amount: number
  description: string | null
  payment_link: string | null
  status: string
  public_token: string
  return_requested: boolean | null
  return_reason: string | null
  delivery_status: string | null
  driver_note: string | null
  driver_phone: string | null
  proof_image_url: string | null
  proof_uploaded_at: string | null
  client_confirmed: boolean | null
  client_confirmed_at: string | null
}

export default function SuiviCommandePage() {
  const params = useParams()
  const token = params.token as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [])

  async function fetchOrder() {
    setLoading(true)

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("public_token", token)
      .single()

    if (error) {
      console.log(error.message)
      setOrder(null)
    } else {
      setOrder(data)
    }

    setLoading(false)
  }

  async function handleReturnRequest() {
    if (!reason.trim()) {
      alert("Merci d’indiquer la raison du retour.")
      return
    }

    setSending(true)

    const { error } = await supabase
      .from("orders")
      .update({
        return_requested: true,
        return_reason: reason.trim(),
        status: "Retourné",
      })
      .eq("public_token", token)

    setSending(false)

    if (error) {
      alert("Erreur lors de l’envoi de la demande.")
      console.log(error.message)
    } else {
      alert("Demande de retour envoyée.")
      setReason("")
      await fetchOrder()
    }
  }

  if (loading) {
    return <main style={{ padding: 20 }}>Chargement...</main>
  }

  async function handleClientConfirm() {
  const { error } = await supabase
    .from("orders")
    .update({
      client_confirmed: true,
      client_confirmed_at: new Date().toISOString(),
      status: "Livré",
      delivery_status: "Livré",
      driver_note: "Le client a confirmé la réception.",
    })
    .eq("public_token", token)

  if (error) {
    alert("Erreur confirmation : " + error.message)
    console.log("CONFIRM ERROR:", error)
  } else {
    alert("Réception confirmée. Merci.")
    await fetchOrder()
  }
}

  if (!order) {
    return <main style={{ padding: 20 }}>Commande introuvable.</main>
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
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          background: "white",
          borderRadius: "18px",
          padding: "22px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Dhameni 🚀</h1>

        <p style={{ color: "#6b7280" }}>
          Suivi sécurisé de votre commande.
        </p>

        <div
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: "#f9fafb",
            marginTop: "16px",
          }}
        >
          <p>
            <strong>Client :</strong> {order.client_name}
          </p>
          <p>
            <strong>Montant :</strong> {order.amount} TND
          </p>
          <p>
            <strong>Description :</strong> {order.description || "-"}
          </p>
          <p>
            <strong>Statut commande :</strong> {order.status}
          </p>
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            borderRadius: "14px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1d4ed8",
            fontSize: "14px",
          }}
        >
          <strong>Livraison :</strong>{" "}
          <div
  style={{
    marginTop: "18px",
    padding: "14px",
    borderRadius: "14px",
    background: "#ecfeff",
    border: "1px solid #a5f3fc",
  }}
>
  <h3 style={{ marginTop: 0 }}>Confirmation de réception</h3>

  {order.client_confirmed ? (
    <div style={{ color: "#065f46", fontSize: "14px" }}>
      ✔️ Vous avez confirmé la réception de la commande.
      <br />
      {order.client_confirmed_at && (
        <>Le : {new Date(order.client_confirmed_at).toLocaleString()}</>
      )}
    </div>
  ) : order.delivery_status === "Arrivé" || order.delivery_status === "Livré" ? (
    <button
      onClick={handleClientConfirm}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        backgroundColor: "#06b6d4",
        color: "white",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
      }}
    >
      Je confirme la réception
    </button>
  ) : (
    <p style={{ margin: 0, fontSize: "14px", color: "#0c4a6e" }}>
      La confirmation sera disponible lorsque le livreur sera arrivé.
    </p>
  )}
</div>
          {order.delivery_status || "En attente livreur"}

          {order.proof_image_url && (
                    <div style={{ marginTop: 18 }}>
                        <strong>Preuve de livraison :</strong>

                        <img
                        src={order.proof_image_url}
                        alt="preuve"
                        style={{
                            width: "100%",
                            marginTop: 10,
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                        }}
                        />
                    </div>
                    )}

                            {order.driver_note && (
            <>
              <br />
              <br />
              <strong>Info livreur :</strong> {order.driver_note}
            </>
          )}
        </div>

        {order.driver_phone && (
          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "14px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <strong>Livreur :</strong> {order.driver_phone}

            <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
              <a
                href={`tel:${order.driver_phone}`}
                style={{
                  display: "block",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#111827",
                  color: "white",
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Appeler le livreur
              </a>

              <a
                href={`https://wa.me/${order.driver_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#25D366",
                  color: "white",
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                WhatsApp livreur
              </a>
            </div>
          </div>
        )}

        {order.proof_uploaded_at && (
            <p style={{ fontSize: "13px", color: "#6b7280" }}>
                Preuve ajoutée le : {new Date(order.proof_uploaded_at).toLocaleString()}
            </p>
            )}

        {order.payment_link && (
          <a
            href={order.payment_link}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              marginTop: "18px",
              padding: "14px",
              borderRadius: "12px",
              background: "#111827",
              color: "white",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Ouvrir le lien de paiement
          </a>
        )}

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            borderRadius: "14px",
            background: "#ecfdf5",
            color: "#065f46",
            fontSize: "14px",
          }}
        >
          ✔️ Commande tracée <br />
          ✔️ Livraison suivie <br />
          ✔️ Statut visible <br />
          ✔️ Sécurité Dhameni
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            borderRadius: "14px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Demander un retour</h3>

          {order.return_requested ? (
            <div style={{ color: "#9a3412", fontSize: "14px" }}>
              <strong>Demande de retour envoyée.</strong>
              <br />
              Raison : {order.return_reason || "-"}
            </div>
          ) : (
            <>
              <textarea
                placeholder="Expliquez brièvement la raison du retour"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  marginBottom: "10px",
                  resize: "vertical",
                }}
              />

              <button
                onClick={handleReturnRequest}
                disabled={sending}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "#f97316",
                  color: "white",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {sending ? "Envoi..." : "Envoyer demande de retour"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}