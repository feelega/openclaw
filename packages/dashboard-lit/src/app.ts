import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { icon } from "./components/icons.js";
import "./components/connection-status.js";
import {
  normalizeBasePath,
  pathForTab,
  tabFromPath,
  titleForTab,
  type Tab,
} from "./lib/navigation.js";
import "./components/gateway-provider.js";
import "./components/sidebar-nav.js";
import "./views/overview-view.js";
import "./views/chat-view.js";
import "./views/placeholder-view.js";

declare global {
  interface Window {
    __OPENCLAW_CONTROL_UI_BASE_PATH__?: string;
  }
}

type ThemeMode = "landingTheme" | "light" | "docsTheme";
const THEME_KEY = "openclaw.dashboard.theme";
const NAV_COLLAPSED_KEY = "openclaw.dashboard.navCollapsed";

function resolveBasePath(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const overrideBase = window.__OPENCLAW_CONTROL_UI_BASE_PATH__;
  if (overrideBase !== undefined && overrideBase !== null) {
    return normalizeBasePath(String(overrideBase));
  }
  const viteBase = String(import.meta.env?.BASE_URL ?? "").trim();
  if (!viteBase || viteBase === "/" || viteBase === "." || viteBase === "./") {
    return "";
  }
  return normalizeBasePath(viteBase);
}

@customElement("dashboard-app")
export class DashboardApp extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state() tab: Tab = "overview";
  @state() basePath = "";
  @state() theme: ThemeMode = "docsTheme";
  @state() navCollapsed = false;

  /* ── Lifecycle ───────────────────────────────────── */

  override connectedCallback(): void {
    super.connectedCallback();
    this.basePath = resolveBasePath();
    this.syncTabFromUrl();
    this.initTheme();
    this.navCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
    window.addEventListener("popstate", this.handlePopState);
    window.addEventListener("resize", this.handleResize);

    // Auto-collapse sidebar on narrow screens
    if (window.innerWidth < 768) {
      this.navCollapsed = true;
    }
  }

  override disconnectedCallback(): void {
    window.removeEventListener("popstate", this.handlePopState);
    window.removeEventListener("resize", this.handleResize);
    super.disconnectedCallback();
  }

  /* ── Routing ─────────────────────────────────────── */

  private handlePopState = (): void => {
    this.syncTabFromUrl();
  };

  private syncTabFromUrl(): void {
    const tab = tabFromPath(window.location.pathname, this.basePath);
    if (tab) {
      this.tab = tab;
    }
  }

  private setTab(tab: Tab): void {
    if (this.tab === tab) {
      return;
    }
    this.tab = tab;
    const path = pathForTab(tab, this.basePath);
    window.history.pushState({}, "", path);
  }

  private handleTabChange = (e: CustomEvent<Tab>): void => {
    this.setTab(e.detail);

    // On mobile, auto-collapse sidebar after tab selection
    if (window.innerWidth < 768 && !this.navCollapsed) {
      this.navCollapsed = true;
      localStorage.setItem(NAV_COLLAPSED_KEY, "true");
    }
  };

  /* ── Sidebar ─────────────────────────────────────── */

  private toggleNav(): void {
    this.navCollapsed = !this.navCollapsed;
    localStorage.setItem(NAV_COLLAPSED_KEY, String(this.navCollapsed));
  }

  private handleResize = (): void => {
    // Auto-collapse on narrow, auto-expand on wide (if not explicitly collapsed)
    if (window.innerWidth < 768 && !this.navCollapsed) {
      this.navCollapsed = true;
      localStorage.setItem(NAV_COLLAPSED_KEY, "true");
    }
  };

  /* ── Theme ───────────────────────────────────────── */

  private initTheme(): void {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "landingTheme" || saved === "light" || saved === "docsTheme") {
      this.theme = saved;
    } else {
      this.theme = "docsTheme";
    }
    this.applyTheme(this.theme);
  }

  private setTheme(next: ThemeMode): void {
    this.theme = next;
    localStorage.setItem(THEME_KEY, next);
    this.applyTheme(next);
  }

  private applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute("data-theme", theme);
  }

  /* ── View routing ────────────────────────────────── */

  private renderMainContent() {
    switch (this.tab) {
      case "overview":
        return html`
          <overview-view></overview-view>
        `;
      case "chat":
        return html`
          <chat-view></chat-view>
        `;
      default:
        return html`<placeholder-view .tab=${this.tab}></placeholder-view>`;
    }
  }

  /* ── Render ──────────────────────────────────────── */

  override render() {
    const isChat = this.tab === "chat";

    return html`
      <gateway-provider>
        <div class="shell ${this.navCollapsed ? "shell--nav-collapsed" : ""} ${isChat ? "shell--chat" : ""}">

          <!-- ─── Topbar ───────────────────────────── -->
          <header class="topbar">
            <div class="topbar-left">
              <div class="page-title">${titleForTab(this.tab)}</div>
            </div>
            <div class="topbar-status">
              <connection-status></connection-status>
              <div class="theme-toggle">
                <button
                  class="theme-btn ${this.theme === "landingTheme" ? "active" : ""}"
                  @click=${() => this.setTheme("landingTheme")}
                  aria-pressed=${this.theme === "landingTheme"}
                  title="Landing theme"
                >
                  ${icon("layoutGrid", { className: "icon-xs" })}
                </button>
                <button
                  class="theme-btn ${this.theme === "light" ? "active" : ""}"
                  @click=${() => this.setTheme("light")}
                  aria-pressed=${this.theme === "light"}
                  title="Light theme"
                >
                  ${icon("sun", { className: "icon-xs" })}
                </button>
                <button
                  class="theme-btn ${this.theme === "docsTheme" ? "active" : ""}"
                  @click=${() => this.setTheme("docsTheme")}
                  aria-pressed=${this.theme === "docsTheme"}
                  title="Docs theme"
                >
                  ${icon("moon", { className: "icon-xs" })}
                </button>
              </div>
            </div>
          </header>

          <!-- ─── Sidebar ──────────────────────────── -->
          <sidebar-nav
            .activeTab=${this.tab}
            .basePath=${this.basePath}
            .collapsed=${this.navCollapsed}

            @tab-change=${this.handleTabChange}
            @toggle-collapse=${() => this.toggleNav()}
          ></sidebar-nav>

          <!-- ─── Main Content ─────────────────────── -->
          <main class="content ${isChat ? "content--chat" : ""}">

            ${this.renderMainContent()}
          </main>
        </div>
      </gateway-provider>
    `;
  }
}
