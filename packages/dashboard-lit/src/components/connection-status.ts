import { consume } from "@lit/context";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { gatewayContext, type GatewayState } from "../context/gateway-context.js";

/**
 * Tiny component that lives inside <gateway-provider> and
 * renders the connection health pill.
 */
@customElement("connection-status")
export class ConnectionStatus extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @consume({ context: gatewayContext, subscribe: true })
  gateway!: GatewayState;

  override render() {
    const connected = this.gateway?.connected ?? false;
    return html`
      <div class="pill ${connected ? "" : "pill--danger"}">
        <span class="status-dot ${connected ? "status-dot--ok" : ""}"></span>
        <span>Health</span>
        <span class="mono">${connected ? "OK" : "Offline"}</span>
      </div>
    `;
  }
}
