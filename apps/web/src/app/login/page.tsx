"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { saveSession, type AuthResponse } from "../../lib/session";

const hints = [
  "默认走账号 + 密码",
  "第一期不开放公开注册，先用邀请制",
  "登录成功后进入家庭工具台",
];

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const payload = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          account,
          password,
        }),
      });

      saveSession(payload);
      router.push("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "登录失败，请稍后重试。"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>登录</h1>
        <p>这一版已经接通真实 API，登录成功后会把会话存到本地浏览器。</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>账号</span>
            <input
              type="text"
              placeholder="例如：owner"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={pending}>
            {pending ? "登录中..." : "登录"}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}

        <ul className="hint-list">
          {hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
