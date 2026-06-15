import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { authApi } from "../api/auth";
import ApiError from "../components/ApiError";

import "../styles/auth.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const nav = useNavigate();

  const sendEmailCode = () => {
    setError("");

    if (!email) {
      setError("请先输入邮箱");
      return;
    }

    setNotice("当前版本暂未接入邮箱验证码接口，可继续完成注册。");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!agreed) {
      setError("请先勾选同意用户协议和隐私协议");
      return;
    }

    try {
      await authApi.register({
        username,
        email: email || null,
        password,
        college: null,
      });

      await authApi.login(username, password);
      nav("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
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
            <Link className="auth-tab" to="/login">
              登录
            </Link>
            <Link className="auth-tab active" to="/register">
              注册
            </Link>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="register-username">用户名</label>
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v1.5c0 .28.22.5.5.5h15c.28 0 .5-.22.5-.5V18c0-2.66-5.33-4-8-4Z" />
                </svg>
                <input
                  id="register-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="设置用户名"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">密码</label>
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17 9h-1V7c0-2.76-1.79-5-4-5S8 4.24 8 7v2H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2Zm-7-2c0-1.66.9-3 2-3s2 1.34 2 3v2h-4V7Z" />
                </svg>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 位"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">邮箱</label>
              <div className="auth-input-shell">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
                </svg>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="用于找回密码"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-code">邮箱验证码</label>
              <div className="auth-code-row">
                <div className="auth-input-shell">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 16.17-3.88-3.88L3.7 13.7 9 19 21 7l-1.41-1.41L9 16.17Z" />
                  </svg>
                  <input
                    id="register-code"
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="请输入邮箱验证码"
                  />
                </div>

                <button
                  className="auth-code-button"
                  type="button"
                  onClick={sendEmailCode}
                >
                  发送验证码
                </button>
              </div>
            </div>

            <label className="auth-check auth-register-check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                我已阅读并同意{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  用户协议
                </a>{" "}
                和{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  隐私协议
                </a>
              </span>
            </label>

            {notice ? <div className="auth-notice">{notice}</div> : null}

            <div className="auth-error-wrap">
              <ApiError error={error} />
            </div>

            <button className="auth-submit" type="submit" disabled={!agreed}>
              创建账号
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
