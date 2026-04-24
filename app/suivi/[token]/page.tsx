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
}

export default function SuiviCommandePage() {
  const params = useParams()
  const token = params.token as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [])

  async function fetchOrder() {
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

  if (loading) {
    return <main style={{ padding: 20 }}>Chargement...</main>
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
          <p><strong>Client :</strong> {order.client_name}</p>
          <p><strong>Montant :</strong> {order.amount} TND</p>
          <p><strong>Description :</strong> {order.description || "-"}</p>
          <p><strong>Statut :</strong> {order.status}</p>
        </div>

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
          ✔️ Statut visible <br />
          ✔️ Sécurité Dhameni
        </div>
      </div>
    </main>
  )
}