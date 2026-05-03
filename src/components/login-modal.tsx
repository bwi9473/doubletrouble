"use client";

import { useState } from "react";
import { useRoleStore } from "@/store/use-role-store";
import type { AuthUser } from "@/store/use-role-store";

export function LoginModal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useRoleStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", username);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.log("Error response:", data);
        setError(data.error || "Login mislukt");
        return;
      }

      const user: AuthUser = await response.json();
      console.log("Login successful, user:", user);
      setUser(user);
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error("Login error:", err);
      setError("Er is een fout opgetreden bij het inloggen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ui-modal-backdrop flex min-h-screen items-center justify-center px-4">
      <div className="ui-modal-shell w-full max-w-md rounded-3xl p-8 shadow-xl backdrop-blur">
        <div className="mb-8 text-center">
          <p className="text-app-accent text-xs uppercase tracking-[0.35em]">Welkom</p>
          <h1 className="mt-2 text-3xl font-semibold text-app-foreground">Padel Vriendenliga</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-app-foreground block text-sm font-medium">
              Gebruikersnaam
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="bert"
              className="ui-input mt-2 w-full rounded-2xl px-4 py-3 placeholder:text-app-muted"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-app-foreground block text-sm font-medium">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="ui-input mt-2 w-full rounded-2xl px-4 py-3 placeholder:text-app-muted"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="ui-danger-note rounded-2xl p-3 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="ui-button-primary w-full rounded-2xl py-3 font-medium disabled:opacity-50"
          >
            {isLoading ? "Bezig met inloggen..." : "Inloggen"}
          </button>
        </form>

        <div className="ui-note mt-6 rounded-2xl p-4 text-xs">
          <p className="text-app-foreground mb-2 font-medium">Demo gegevens:</p>
          <p>• admin / admin123 (Admin)</p>
          <p>• manager / manager123 (Wedstrijd)</p>
          <p className="text-app-muted mt-2">Spelers loggen in met hun naam als gebruikersnaam.</p>
        </div>
      </div>
    </div>
  );
}
