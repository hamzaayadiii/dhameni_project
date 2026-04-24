"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      alert("Entre ton email et ton mot de passe.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      router.push("/")
    }
  }

  async function handleSignup() {
    if (!email.trim() || !password.trim()) {
      alert("Entre ton email et ton mot de passe.")
      return
    }

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert("Compte créé. Connecte-toi maintenant.")
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
        <h1 style={{ marginTop: 0 }}>Dhameni 🚀</h1>

        <p style={{ color: "#6b7280" }}>
          Connecte-toi pour gérer tes commandes sécurisées.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #d1d5db",
          }}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          autoComplete="current-password"
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
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "none",
            backgroundColor: "#111827",
            color: "white",
            fontWeight: 700,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          {loading ? "Chargement..." : "Se connecter"}
        </button>

        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Créer un compte
        </button>
      </div>
    </main>
  )
}