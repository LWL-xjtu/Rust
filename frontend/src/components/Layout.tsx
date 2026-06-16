import { PropsWithChildren } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-shell">
        <Navbar />

        <main className="content">
          <div className="content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
