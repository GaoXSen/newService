"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { saveSession, type AuthResponse } from "../../lib/session";

export default function RegisterPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("FAMILY-ACCESS");
  const [account, setAccount] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const payload = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          inviteCode,
          account,
          nickname,
          password,
        }),
      });

      saveSession(payload);
      router.push("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "注册失败，请稍后重试。"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>邀请注册</h1>
        <p>第一期只允许邀请注册。默认开发邀请码已经预置成 `FAMILY-ACCESS`。</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>邀请口令</span>
            <input
              type="text"
              placeholder="输入邀请口令"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
            />
          </label>
          <label>
            <span>账号</span>
            <input
              type="text"
              placeholder="例如：mom"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            />
          </label>
          <label>
            <span>昵称</span>
            <input
              type="text"
              placeholder="例如：妈妈"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </label>
          <label>
            <span>设置密码</span>
            <input
              type="password"
              placeholder="至少 8 位"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={pending}>
            {pending ? "创建中..." : "创建账号"}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </main>
  );
}
