/**
 * Tip4Serv.js - Popup Manager
 */

import type { Tip4ServError, PopupCallbacks, RedirectUrls } from "./types";
import { POPUP_WIDTH, POPUP_HEIGHT, POPUP_TIMEOUT, MESSAGE_SOURCE, LOGO_URL } from "./constants";
import { create_error, log } from "./utils";

export class PopupManager {
  private popup: Window | null = null;
  private timeout_id: ReturnType<typeof setTimeout> | null = null;
  private message_handler: ((event: MessageEvent) => void) | null = null;
  private overlay: HTMLDivElement | null = null;
  private close_watcher_id: ReturnType<typeof setInterval> | null = null;
  private callbacks: PopupCallbacks = {};
  private redirect_urls: RedirectUrls = {};

  open(url: string, callbacks: PopupCallbacks, redirect_urls: RedirectUrls): boolean {
    this.callbacks = callbacks;
    this.redirect_urls = redirect_urls;

    // Calculate popup position (center of screen)
    const left = Math.max(0, (window.innerWidth - POPUP_WIDTH) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - POPUP_HEIGHT) / 2 + window.screenY);

    const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes,resizable=yes`;

    this.popup = window.open(url, "tip4serv_checkout", features);

    if (!this.popup || this.popup.closed) {
      // Popup blocked - fallback to redirect
      log("Popup blocked, redirecting...", "warn");
      window.location.href = url;
      return false;
    }

    this.show_overlay();
    this.popup.focus();
    this.setup_message_listener();
    this.setup_timeout();
    this.setup_close_watcher();

    return true;
  }

  private show_overlay(): void {
    // Create overlay
    this.overlay = document.createElement("div");
    this.overlay.id = "tip4serv-overlay";
    this.overlay.innerHTML = `
      <div class="tip4serv-overlay-content">
        <img src="${LOGO_URL}" alt="Tip4Serv" class="tip4serv-overlay-logo" />
        <p class="tip4serv-overlay-text">
          Secure checkout window not visible?<br/>
          We'll help you reopen the window to complete your purchase.
        </p>
        <button class="tip4serv-overlay-btn" id="tip4serv-continue-btn">Continue</button>
      </div>
    `;

    // Add styles
    const style = document.createElement("style");
    style.id = "tip4serv-overlay-style";
    style.textContent = `
      #tip4serv-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 50%, rgba(0, 0, 0, 0.98) 100%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .tip4serv-overlay-content {
        text-align: center;
        color: white;
      }
      .tip4serv-overlay-logo {
        max-width: 180px;
        height: auto;
        margin-bottom: 24px;
      }
      .tip4serv-overlay-text {
        font-size: 16px;
        line-height: 1.5;
        margin: 0 0 24px 0;
        color: rgba(255, 255, 255, 0.9);
      }
      .tip4serv-overlay-btn {
        background: transparent;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        text-decoration: underline;
        padding: 8px 16px;
      }
      .tip4serv-overlay-btn:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.overlay);

    // Continue button - refocus popup
    const continue_btn = document.getElementById("tip4serv-continue-btn");
    if (continue_btn) {
      continue_btn.addEventListener("click", () => {
        if (this.popup && !this.popup.closed) {
          this.popup.focus();
        }
      });
    }
  }

  private hide_overlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    const style = document.getElementById("tip4serv-overlay-style");
    if (style) {
      style.remove();
    }
  }

  private setup_message_listener(): void {
    this.message_handler = (event: MessageEvent) => {
      // Validate message origin and source
      if (!event.data || event.data.source !== MESSAGE_SOURCE) return;

      const { status, error } = event.data;
      this.cleanup();

      switch (status) {
        case "success":
          if (this.redirect_urls.successUrl) {
            window.location.href = this.redirect_urls.successUrl;
          } else {
            this.callbacks.onSuccess?.();
          }
          break;
        case "pending":
          if (this.redirect_urls.pendingUrl) {
            window.location.href = this.redirect_urls.pendingUrl;
          } else {
            this.callbacks.onPending?.();
          }
          break;
        case "cancel":
          if (this.redirect_urls.cancelUrl) {
            window.location.href = this.redirect_urls.cancelUrl;
          } else {
            this.callbacks.onCancel?.();
          }
          break;
        case "fail":
          this.callbacks.onFail?.(create_error("PAYMENT_FAILED", error || "Payment failed"));
          break;
        default:
          this.callbacks.onFail?.(create_error("UNKNOWN_STATUS", `Unknown status: ${status}`));
      }
    };

    window.addEventListener("message", this.message_handler);
  }

  private setup_timeout(): void {
    this.timeout_id = setTimeout(() => {
      if (this.popup && !this.popup.closed) {
        log("Checkout timeout", "warn");
        this.cleanup();
        this.callbacks.onFail?.(create_error("TIMEOUT", "Checkout session expired"));
      }
    }, POPUP_TIMEOUT);
  }

  private setup_close_watcher(): void {
    this.close_watcher_id = setInterval(() => {
      if (this.popup && this.popup.closed) {
        if (this.close_watcher_id) {
          clearInterval(this.close_watcher_id);
          this.close_watcher_id = null;
        }
        // Small delay to allow postMessage to arrive first
        setTimeout(() => {
          if (this.message_handler) {
            // Popup was closed without completing - treat as cancel
            this.cleanup();
            if (this.redirect_urls.cancelUrl) {
              window.location.href = this.redirect_urls.cancelUrl;
            } else {
              this.callbacks.onCancel?.();
            }
          }
        }, 500);
      }
    }, 500);
  }

  private cleanup(): void {
    this.hide_overlay();
    if (this.message_handler) {
      window.removeEventListener("message", this.message_handler);
      this.message_handler = null;
    }
    if (this.timeout_id) {
      clearTimeout(this.timeout_id);
      this.timeout_id = null;
    }
    if (this.close_watcher_id) {
      clearInterval(this.close_watcher_id);
      this.close_watcher_id = null;
    }
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.popup = null;
  }
}
