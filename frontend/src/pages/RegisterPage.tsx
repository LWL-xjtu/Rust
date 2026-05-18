import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import ApiError from "../components/ApiError";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authApi.register({ username, password, college: college || null });
      await authApi.login(username, password);
      nav("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h2>注册</h2>
      <form onSubmit={submit}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" required />
        <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="书院/学院（可选）" />
        <button type="submit">注册</button>
      </form>
      <ApiError error={error} />
      <p>已有账号？<Link to="/login">登录</Link></p>
    </div>
  );
}
