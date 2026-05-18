import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import ApiError from "../components/ApiError";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authApi.login(username, password);
      nav("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h2>登录</h2>
      <form onSubmit={submit}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" required />
        <button type="submit">登录</button>
      </form>
      <ApiError error={error} />
      <p>没有账号？<Link to="/register">注册</Link></p>
    </div>
  );
}
