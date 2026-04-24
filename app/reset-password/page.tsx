"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleResetPassword() {
    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert("Mot de passe modifié avec succès.")
      router.push("/login")
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "linear-gradient(135deg, #111827, #065f46)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "18px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Nouveau mot de passe</h1>

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #d1d5db",
          }}
        />

        <button
          onClick={handleResetPassword}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "none",
            backgroundColor: "#111827",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </button>
      </div>
    </main>
  )
}