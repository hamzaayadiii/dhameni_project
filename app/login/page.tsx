"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"seller" | "driver">("seller")
  const [loading, setLoading] = useState(false)

  async function redirectByRole(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (data?.role === "driver") {
      router.push("/driver")
    } else {
      router.push("/")
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      alert("Entre ton email et ton mot de passe.")
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      await redirectByRole(data.user.id)
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

    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
            data: {
            role,
            },
        },
        })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    if (data.user) {
      await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email: email.trim(),
          role,
        },
      ])
    }

    setLoading(false)
    alert("Compte créé. Connecte-toi maintenant.")
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      alert("Entre ton email pour recevoir le lien.")
      return
    }

    const redirectTo = `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (error) alert(error.message)
    else alert("Email envoyé. Vérifie ta boîte mail.")
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
          Sécurisez vos commandes, livraisons et retours.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "seller" | "driver")}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #d1d5db",
          }}
        >
          <option value="seller">Je suis vendeur</option>
          <option value="driver">Je suis livreur</option>
        </select>

        <button
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
            marginBottom: 12,
          }}
        >
          Créer un compte
        </button>

        <button
          onClick={handleForgotPassword}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#065f46",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Mot de passe oublié ?
        </button>
      </div>
    </main>
  )
}