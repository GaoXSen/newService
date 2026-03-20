"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import {
  clearSession,
  readSession,
  saveSession,
  type AuthResponse,
  type AuthUser,
} from "../../lib/session";

type MeResponse = {
  user: AuthUser;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        const payload = await apiFetch<MeResponse>("/auth/me", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        setUser(payload.user);
      } catch {
        try {
          const nextSession = await apiFetch<AuthResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({
              refreshToken: session.refreshToken,
            }),
          });

          saveSession(nextSession);
          const payload = await apiFetch<MeResponse>("/auth/me", {
            headers: {
              Authorization: `Bearer ${nextSession.accessToken}`,
            },
          });
          setUser(payload.user);
        } catch {
          clearSession();
          setError("会话已失效，请重新登录。");
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  async function handleLogout() {
    const session = readSession();
    if (session) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch {
        // Ignore logout errors; local state still needs to be cleared.
      }
    }

    clearSession();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>加载中</h1>
          <p>正在校验当前会话。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="hero-tag">已登录</span>
        <h1>{user ? `${user.nickname}，欢迎回来` : "私人助理"}</h1>
        <p>
          这一页是登录成功后的第一版家庭工具台，后续会逐步加上备忘、提醒、常用入口和管理功能。
        </p>
        <div className="hero-actions">
          <button className="primary-action button-reset" onClick={handleLogout}>
            退出登录
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </main>
  );
}
