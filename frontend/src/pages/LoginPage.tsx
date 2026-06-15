import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { authApi } from "../api/auth";
import ApiError from "../components/ApiError";

import "../styles/auth.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("请先勾选同意用户协议和隐私协议");
      return;
    }

    try {
      await authApi.login(username, password);
      nav("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-bg-grid" />
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-orb auth-orb-three" />
      <div className="auth-lines" />

      <section className="auth-card">
        <div className="auth-brand-panel">
          <div className="auth-logo-wrap">
            <div className="auth-logo">
              <span>XJTU</span>
              <img
                src="/xjtu-logo.png"
                alt="西安交通大学校徽"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>

          <h1>校园活动管理系统</h1>
          <p className="auth-subtitle">activity.console</p>

          <ul className="auth-feature-list">
            <li>统一管理校园活动流程</li>
            <li>实时跟踪场地与设备状态</li>
            <li>任务分工、审批与数据统计</li>
          </ul>
        </div>

        <div className="auth-form-panel">
          <div className="auth-tabs" aria-label="登录和注册切换">
            <Link className="auth-tab active" to="/login">
              登录
            </Link>
            <Link className="auth-tab" to="/register">
              注册
            </Link>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="login-username">用户名</label>
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v1.5c0 .28.22.5.5.5h15c.28 0 .5-.22.5-.5V18c0-2.66-5.33-4-8-4Z" />
                </svg>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">密码</label>
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17 9h-1V7c0-2.76-1.79-5-4-5S8 4.24 8 7v2H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2Zm-7-2c0-1.66.9-3 2-3s2 1.34 2 3v2h-4V7Z" />
                </svg>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="auth-options">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  同意{" "}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    用户协议
                  </a>{" "}
                  和{" "}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    隐私协议
                  </a>
                </span>
              </label>

              <button
                className="auth-link-button"
                type="button"
                onClick={() => setError("当前版本暂未接入找回密码功能")}
              >
                忘记密码？
              </button>
            </div>

            <div className="auth-error-wrap">
              <ApiError error={error} />
            </div>

            <button className="auth-submit" type="submit" disabled={!agreed}>
              登录
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
