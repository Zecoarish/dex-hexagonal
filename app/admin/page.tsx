"use client";

import { useEffect, useState } from "react";

type WaitlistUser = {
  id: number;
  email: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadWaitlist() {
    if (!key) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "/api/admin/waitlist",
        {
          headers: {
            "x-admin-key": key,
          },
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load waitlist."
        );
      }

      setUsers(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved =
      sessionStorage.getItem(
        "hexagonal_admin_key"
      );

    if (saved) {
      setKey(saved);
    }
  }, []);

  useEffect(() => {
    if (key) {
      sessionStorage.setItem(
        "hexagonal_admin_key",
        key
      );

      void loadWaitlist();
    }
  }, [key]);

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              HEXAGONAL Admin
            </h1>

            <p className="text-sm text-zinc-400 mt-1">
              Manage waitlist access
            </p>
          </div>

          <button
            onClick={loadWaitlist}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="bg-[#121820] border border-white/10 rounded-2xl p-5 mb-6">
          <label className="block text-sm text-zinc-400 mb-2">
            Admin Key
          </label>

          <input
            type="password"
            value={key}
            onChange={(e) =>
              setKey(e.target.value)
            }
            placeholder="Enter admin key"
            className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#121820] border border-white/10 rounded-2xl overflow-hidden">

          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold">
              Waitlist
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No waitlist requests yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">
                      {user.email}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      {user.created_at}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      user.status === "approved"
                        ? "bg-green-500/10 text-green-400"
                        : user.status === "rejected"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {user.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </main>
  );
      }
