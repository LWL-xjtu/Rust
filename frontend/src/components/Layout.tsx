import { PropsWithChildren } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="body">
        <Sidebar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
