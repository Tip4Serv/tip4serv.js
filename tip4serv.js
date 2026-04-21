"use strict";
var Tip4ServModule = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/tip4serv.ts
  var tip4serv_exports = {};
  __export(tip4serv_exports, {
    Tip4Serv: () => Tip4Serv,
    default: () => tip4serv_default
  });

  // src/constants.ts
  var API_BASE = "https://api.tip4serv.com/v1";
  var AUTH_BASE = "https://auth.tip4serv.com";
  var POPUP_WIDTH = 500;
  var POPUP_HEIGHT = 700;
  var POPUP_TIMEOUT = 15 * 60 * 1e3;
  var MESSAGE_SOURCE = "tip4serv-checkout";
  var LOGO_URL = "https://js.tip4serv.com/assets/t4s_logo_gray.webp";
  var OAUTH_SCOPE = "payments:read subscriptions:read subscriptions:update";
  var OAUTH_ACTOR_TYPE = "user";
  var OAUTH_CLIENT_STORAGE_KEY = "tip4servjs-oauth-client";
  var OAUTH_STATE_STORAGE_KEY = "tip4servjs-oauth-state";
  var OAUTH_VERIFIER_STORAGE_KEY = "tip4servjs-oauth-verifier";
  var OAUTH_TOKEN_STORAGE_KEY = "tip4servjs-oauth-token";

  // src/utils.ts
  function parse_integer(value) {
    if (value === null || value === void 0 || value === "")
      return void 0;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || !Number.isInteger(parseFloat(value)))
      return void 0;
    return num;
  }
  function parse_float(value) {
    if (value === null || value === void 0 || value === "")
      return void 0;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0)
      return void 0;
    return num;
  }
  function parse_bool(value) {
    if (value === null || value === void 0 || value === "")
      return void 0;
    return value === "true" || value === "1";
  }
  function get_store_id_from_script() {
    const scripts = document.querySelectorAll("script[data-store-id]");
    for (let i = 0; i < scripts.length; i++) {
      const id = scripts[i].getAttribute("data-store-id");
      if (id) {
        const num = parseInt(id, 10);
        if (!isNaN(num))
          return num;
      }
    }
    return void 0;
  }
  function create_error(code, message) {
    return { code, message };
  }
  function log(message, type = "info") {
    const prefix = "[Tip4Serv]";
    switch (type) {
      case "error":
        console.error(`${prefix} ${message}`);
        break;
      case "warn":
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  // src/popup_manager.ts
  var PopupManager = class {
    constructor() {
      this.popup = null;
      this.timeout_id = null;
      this.message_handler = null;
      this.overlay = null;
      this.close_watcher_id = null;
      this.callbacks = {};
      this.redirect_urls = {};
    }
    open(url, callbacks, redirect_urls) {
      this.callbacks = callbacks;
      this.redirect_urls = redirect_urls;
      const left = Math.max(0, (window.innerWidth - POPUP_WIDTH) / 2 + window.screenX);
      const top = Math.max(0, (window.innerHeight - POPUP_HEIGHT) / 2 + window.screenY);
      const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes,resizable=yes`;
      this.popup = window.open(url, "tip4serv_checkout", features);
      if (!this.popup || this.popup.closed) {
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
    show_overlay() {
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
      const continue_btn = document.getElementById("tip4serv-continue-btn");
      if (continue_btn) {
        continue_btn.addEventListener("click", () => {
          if (this.popup && !this.popup.closed) {
            this.popup.focus();
          }
        });
      }
    }
    hide_overlay() {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      const style = document.getElementById("tip4serv-overlay-style");
      if (style) {
        style.remove();
      }
    }
    setup_message_listener() {
      this.message_handler = (event) => {
        if (!event.data || event.data.source !== MESSAGE_SOURCE)
          return;
        const { status, error } = event.data;
        switch (status) {
          case "success":
            if (this.redirect_urls.successUrl) {
              this.cleanup(true);
              window.location.href = this.redirect_urls.successUrl;
            } else {
              this.cleanup(false);
              this.callbacks.onSuccess?.();
            }
            break;
          case "pending":
            if (this.redirect_urls.pendingUrl) {
              this.cleanup(true);
              window.location.href = this.redirect_urls.pendingUrl;
            } else {
              this.cleanup(false);
              this.callbacks.onPending?.();
            }
            break;
          case "cancel":
            if (this.redirect_urls.cancelUrl) {
              this.cleanup(true);
              window.location.href = this.redirect_urls.cancelUrl;
            } else {
              this.cleanup(false);
              this.callbacks.onCancel?.();
            }
            break;
          case "fail":
            if (this.redirect_urls.failUrl) {
              this.cleanup(true);
              window.location.href = this.redirect_urls.failUrl;
            } else {
              this.cleanup(false);
              this.callbacks.onFail?.(create_error("PAYMENT_FAILED", error || "Payment failed"));
            }
            break;
          default:
            this.cleanup(false);
            this.callbacks.onFail?.(create_error("UNKNOWN_STATUS", `Unknown status: ${status}`));
        }
      };
      window.addEventListener("message", this.message_handler);
    }
    setup_timeout() {
      this.timeout_id = setTimeout(() => {
        if (this.popup && !this.popup.closed) {
          log("Checkout timeout", "warn");
          this.cleanup(true);
          this.callbacks.onFail?.(create_error("TIMEOUT", "Checkout session expired"));
        }
      }, POPUP_TIMEOUT);
    }
    setup_close_watcher() {
      this.close_watcher_id = setInterval(() => {
        if (this.popup && this.popup.closed) {
          if (this.close_watcher_id) {
            clearInterval(this.close_watcher_id);
            this.close_watcher_id = null;
          }
          setTimeout(() => {
            if (this.message_handler) {
              this.cleanup(true);
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
    cleanup(closePopup = true) {
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
      if (closePopup && this.popup && !this.popup.closed) {
        this.popup.close();
      }
      this.popup = null;
    }
  };

  // src/checkout.ts
  var Checkout = class {
    constructor() {
      this.popup_manager = new PopupManager();
    }
    async open(options) {
      const storeId = options.storeId ?? get_store_id_from_script();
      if (!storeId) {
        const error = create_error(
          "MISSING_STORE_ID",
          "storeId is required. Add data-store-id to your script tag or pass storeId in options."
        );
        log(error.message, "error");
        options.onFail?.(error);
        return;
      }
      if (!options.product && !options.products) {
        const error = create_error(
          "MISSING_PRODUCT",
          "At least one product is required. Use 'product' or 'products' option."
        );
        log(error.message, "error");
        options.onFail?.(error);
        return;
      }
      const payload = this.build_payload(options);
      if (options.successUrl) {
        payload.redirect_success_checkout = this.to_absolute_url(options.successUrl);
      }
      if (options.cancelUrl) {
        payload.redirect_canceled_checkout = this.to_absolute_url(options.cancelUrl);
      }
      if (options.pendingUrl) {
        payload.redirect_pending_checkout = this.to_absolute_url(options.pendingUrl);
      }
      try {
        const response = await this.call_api(storeId, payload);
        if (response.error) {
          const error = create_error("API_ERROR", response.error);
          log(error.message, "error");
          options.onFail?.(error);
          return;
        }
        if (!response.url) {
          const error = create_error("NO_URL", "API did not return a checkout URL");
          log(error.message, "error");
          options.onFail?.(error);
          return;
        }
        this.popup_manager.open(
          response.url,
          {
            onSuccess: options.onSuccess,
            onPending: options.onPending,
            onCancel: options.onCancel,
            onFail: options.onFail
          },
          {
            successUrl: options.successUrl,
            cancelUrl: options.cancelUrl,
            pendingUrl: options.pendingUrl,
            failUrl: options.failUrl
          }
        );
      } catch (err) {
        const error = create_error(
          "NETWORK_ERROR",
          err instanceof Error ? err.message : "Network request failed"
        );
        log(error.message, "error");
        options.onFail?.(error);
      }
    }
    build_payload(options) {
      const products = [];
      if (options.product) {
        products.push(this.build_product_payload({
          product: options.product,
          quantity: options.quantity,
          subscription: options.subscription,
          donationAmount: options.donationAmount,
          serverSelection: options.serverSelection,
          customFields: options.customFields
        }));
      } else if (options.products) {
        for (const item of options.products) {
          if (typeof item === "string" || typeof item === "number") {
            products.push(this.build_product_payload({ product: item }));
          } else {
            products.push(this.build_product_payload(item));
          }
        }
      }
      return { products };
    }
    build_product_payload(opts) {
      const product = {
        quantity: opts.quantity ?? 1
      };
      if (opts.subscription === false) {
        product.type = "addtocart";
      }
      if (typeof opts.product === "number") {
        product.product_id = opts.product;
      } else {
        const as_number = parseInt(opts.product, 10);
        if (!isNaN(as_number) && String(as_number) === opts.product) {
          product.product_id = as_number;
        } else {
          product.product_slug = opts.product;
        }
      }
      if (opts.donationAmount !== void 0) {
        product.donation_amount = opts.donationAmount;
      }
      if (opts.serverSelection !== void 0) {
        product.server_selection = opts.serverSelection;
      }
      if (opts.customFields !== void 0) {
        product.custom_fields = {};
        for (const [key, value] of Object.entries(opts.customFields)) {
          product.custom_fields[String(key)] = value;
        }
      }
      return product;
    }
    async call_api(store_id, payload) {
      const url = `${API_BASE}/store/checkout?store=${store_id}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    }
    to_absolute_url(url) {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      if (typeof window !== "undefined" && window.location) {
        return new URL(url, window.location.origin).href;
      }
      return url;
    }
  };

  // src/cart.ts
  var STORAGE_KEY = "tip4servjs-cart";
  var Cart = class {
    constructor(checkout) {
      this.checkout = checkout;
    }
    /**
     * Register a callback fired whenever the cart changes.
     */
    set_on_change(callback) {
      this.on_change = callback;
    }
    /**
     * Add a product to the cart.
     * Subscription rules:
     * - Adding a subscription clears the cart (subscriptions are always alone)
     * - Adding a one-time product when cart has a subscription clears the subscription
     * Duplicate rules:
     * - If an identical product exists (same fields), quantity is merged
     * - Otherwise a new entry is created
     */
    add(options) {
      if (!options.product) {
        log("Cart.Add: product is required", "error");
        return;
      }
      const item = {
        product: options.product,
        quantity: options.quantity ?? 1,
        subscription: options.subscription,
        donationAmount: options.donationAmount,
        serverSelection: options.serverSelection,
        customFields: options.customFields
      };
      const is_subscription = item.subscription !== false;
      let cart = this.get_items();
      if (is_subscription) {
        this.save_items([item]);
        return;
      }
      const has_subscription = cart.some((i) => i.subscription !== false);
      if (has_subscription) {
        cart = [];
      }
      const duplicate_index = cart.findIndex((i) => this.items_equal(i, item));
      if (duplicate_index !== -1) {
        cart[duplicate_index].quantity += item.quantity;
      } else {
        cart.push(item);
      }
      this.save_items(cart);
    }
    /**
     * Open the checkout with all items in the cart.
     * On success, the cart is automatically cleared.
     */
    async open(options = {}) {
      const cart = this.get_items();
      if (cart.length === 0) {
        log("Cart is empty", "warn");
        options.onFail?.({
          code: "EMPTY_CART",
          message: "Cart is empty. Add products before opening checkout."
        });
        return;
      }
      const original_on_success = options.onSuccess;
      const clear_cart = () => this.clear();
      const checkout_options = {
        storeId: options.storeId,
        products: cart.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          subscription: item.subscription,
          donationAmount: item.donationAmount,
          serverSelection: item.serverSelection,
          customFields: item.customFields
        })),
        onSuccess: () => {
          clear_cart();
          original_on_success?.();
        },
        onPending: options.onPending,
        onCancel: options.onCancel,
        onFail: options.onFail,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        pendingUrl: options.pendingUrl,
        failUrl: options.failUrl
      };
      if (options.successUrl) {
        this.clear();
      }
      await this.checkout.open(checkout_options);
    }
    /**
     * Clear all items from the cart.
     */
    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        this.on_change?.();
      } catch {
        log("Failed to clear cart from localStorage", "error");
      }
    }
    /**
     * Get all items currently in the cart.
     */
    get_items() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
          return [];
        return JSON.parse(raw);
      } catch {
        log("Failed to read cart from localStorage", "error");
        return [];
      }
    }
    save_items(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        this.on_change?.();
      } catch {
        log("Failed to save cart to localStorage", "error");
      }
    }
    /**
     * Compare two cart items for exact equality (ignoring quantity).
     * Same product + same options = identical.
     */
    items_equal(a, b) {
      if (String(a.product) !== String(b.product))
        return false;
      if (a.subscription !== b.subscription)
        return false;
      if (a.donationAmount !== b.donationAmount)
        return false;
      if (a.serverSelection !== b.serverSelection)
        return false;
      return this.custom_fields_equal(a.customFields, b.customFields);
    }
    custom_fields_equal(a, b) {
      if (!a && !b)
        return true;
      if (!a || !b)
        return false;
      const keys_a = Object.keys(a).sort();
      const keys_b = Object.keys(b).sort();
      if (keys_a.length !== keys_b.length)
        return false;
      for (let i = 0; i < keys_a.length; i++) {
        if (keys_a[i] !== keys_b[i])
          return false;
        if (a[keys_a[i]] !== b[keys_b[i]])
          return false;
      }
      return true;
    }
  };

  // src/html_adapter.ts
  var HTMLAdapter = class {
    constructor(checkout, cart) {
      this.checkout = checkout;
      this.cart = cart;
    }
    init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.bind_buttons());
      } else {
        this.bind_buttons();
      }
    }
    bind_buttons() {
      const buy_buttons = document.querySelectorAll(".tip4serv-buy-btn");
      buy_buttons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.handle_buy_click(button);
        });
      });
      const add_buttons = document.querySelectorAll(".tip4serv-add-cart-btn");
      add_buttons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.handle_cart_add_click(button);
        });
      });
      const open_buttons = document.querySelectorAll(".tip4serv-open-cart-btn");
      open_buttons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.handle_cart_open_click(button);
        });
      });
      this.cart.set_on_change(() => this.update_open_buttons_state());
      this.update_open_buttons_state();
    }
    handle_buy_click(button) {
      const product = button.dataset.product;
      if (!product) {
        log("Button missing data-product attribute", "error");
        return;
      }
      let subscription;
      if (button.dataset.subscription !== void 0) {
        subscription = parse_bool(button.dataset.subscription);
      }
      const options = {
        product,
        quantity: parse_integer(button.dataset.quantity),
        subscription,
        donationAmount: parse_float(button.dataset.donationAmount),
        serverSelection: parse_integer(button.dataset.serverSelection),
        successUrl: button.dataset.successUrl,
        cancelUrl: button.dataset.cancelUrl,
        pendingUrl: button.dataset.pendingUrl,
        failUrl: button.dataset.failUrl
      };
      this.checkout.open(options);
    }
    handle_cart_add_click(button) {
      const product = button.dataset.product;
      if (!product) {
        log("Cart button missing data-product attribute", "error");
        return;
      }
      let subscription;
      if (button.dataset.subscription !== void 0) {
        subscription = parse_bool(button.dataset.subscription);
      }
      const options = {
        product,
        quantity: parse_integer(button.dataset.quantity),
        subscription,
        donationAmount: parse_float(button.dataset.donationAmount),
        serverSelection: parse_integer(button.dataset.serverSelection),
        customFields: this.parse_custom_fields(button.dataset.customFields)
      };
      this.cart.add(options);
    }
    handle_cart_open_click(button) {
      const options = {
        successUrl: button.dataset.successUrl,
        cancelUrl: button.dataset.cancelUrl,
        pendingUrl: button.dataset.pendingUrl,
        failUrl: button.dataset.failUrl
      };
      this.cart.open(options);
    }
    /**
     * Enable or disable all .tip4serv-open-cart-btn buttons based on cart state.
     */
    update_open_buttons_state() {
      const has_items = this.cart.get_items().length > 0;
      const buttons = document.querySelectorAll(".tip4serv-open-cart-btn");
      buttons.forEach((btn) => {
        btn.disabled = !has_items;
      });
    }
    parse_custom_fields(raw) {
      if (!raw)
        return void 0;
      try {
        return JSON.parse(raw);
      } catch {
        log("Failed to parse data-custom-fields JSON", "error");
        return void 0;
      }
    }
  };

  // src/oauth.ts
  var OAuthManager = class {
    async connect(options) {
      this.assert_browser_api("Tip4Serv.OAuth.Connect() requires a browser environment.");
      const store_id = this.parse_store_id(options?.store_id);
      const return_url = this.parse_url(options?.return_url, "return_url");
      const client = await this.ensure_client(return_url);
      const verifier = this.random_string(64);
      const state = this.random_string(32);
      const challenge = await this.generate_code_challenge(verifier);
      window.sessionStorage.setItem(OAUTH_VERIFIER_STORAGE_KEY, verifier);
      window.sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: client.client_id,
        redirect_uri: return_url,
        scope: OAUTH_SCOPE,
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
        actor_type: OAUTH_ACTOR_TYPE,
        store: String(store_id)
      });
      window.location.assign(`${AUTH_BASE}/authorize?${params.toString()}`);
    }
    save(options) {
      this.assert_browser_api("Tip4Serv.OAuth.Save() requires a browser environment.");
      const token = this.parse_token(options?.token);
      this.verify_token(token);
      window.localStorage.setItem(OAUTH_TOKEN_STORAGE_KEY, token);
    }
    token() {
      this.assert_browser_api("Tip4Serv.OAuth.Token() requires a browser environment.");
      const token = window.localStorage.getItem(OAUTH_TOKEN_STORAGE_KEY);
      if (!token) {
        throw new Error("No OAuth token is currently stored.");
      }
      this.verify_token(token);
      return token;
    }
    disconnect() {
      this.assert_browser_api("Tip4Serv.OAuth.Disconnect() requires a browser environment.");
      window.localStorage.removeItem(OAUTH_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(OAUTH_CLIENT_STORAGE_KEY);
      window.sessionStorage.removeItem(OAUTH_VERIFIER_STORAGE_KEY);
      window.sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
    }
    assert_browser_api(message) {
      if (typeof window === "undefined" || typeof window.localStorage === "undefined" || typeof window.sessionStorage === "undefined" || typeof window.crypto === "undefined" || typeof window.fetch === "undefined") {
        throw new Error(message);
      }
    }
    parse_store_id(value) {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("store_id must be a positive integer.");
      }
      return value;
    }
    parse_url(value, field_name) {
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${field_name} must be a non-empty URL string.`);
      }
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error(`${field_name} must be a valid absolute URL.`);
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error(`${field_name} must use http or https.`);
      }
      return url.toString();
    }
    parse_token(value) {
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error("token must be a non-empty string.");
      }
      return value.trim();
    }
    async ensure_client(return_url) {
      const cached_client = this.load_client();
      if (cached_client?.client_id && cached_client.redirect_uris?.includes(return_url)) {
        return cached_client;
      }
      const response = await window.fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_name: "Tip4Serv.js",
          redirect_uris: [return_url],
          grant_types: ["authorization_code"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
          actor_type: OAUTH_ACTOR_TYPE
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.client_id) {
        throw new Error(data.error || data.message || "OAuth client registration failed.");
      }
      const client = {
        client_id: data.client_id,
        redirect_uris: Array.isArray(data.redirect_uris) ? data.redirect_uris : [return_url]
      };
      window.localStorage.setItem(OAUTH_CLIENT_STORAGE_KEY, JSON.stringify(client));
      return client;
    }
    load_client() {
      const raw_client = window.localStorage.getItem(OAUTH_CLIENT_STORAGE_KEY);
      if (!raw_client) {
        return null;
      }
      try {
        const parsed = JSON.parse(raw_client);
        if (!parsed?.client_id || typeof parsed.client_id !== "string") {
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    verify_token(token) {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("token must be a valid JWT access token.");
      }
      const header = this.decode_jwt_part(parts[0], "token header");
      const payload = this.decode_jwt_part(parts[1], "token payload");
      const now = Math.floor(Date.now() / 1e3);
      if (!header.alg || typeof header.alg !== "string") {
        throw new Error("token header is missing a valid algorithm.");
      }
      if (payload.nbf !== void 0 && (!Number.isFinite(payload.nbf) || payload.nbf > now)) {
        throw new Error("token is not active yet.");
      }
      if (payload.exp !== void 0 && (!Number.isFinite(payload.exp) || payload.exp <= now)) {
        throw new Error("token has expired.");
      }
      return payload;
    }
    decode_jwt_part(value, label) {
      try {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
        const decoded = window.atob(padded);
        return JSON.parse(decoded);
      } catch {
        throw new Error(`Could not decode ${label}.`);
      }
    }
    async generate_code_challenge(verifier) {
      const data = new TextEncoder().encode(verifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return this.base64_url_encode(new Uint8Array(digest));
    }
    base64_url_encode(bytes) {
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }
    random_string(length) {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      const values = new Uint8Array(length);
      window.crypto.getRandomValues(values);
      return Array.from(values, (value) => charset[value % charset.length]).join("");
    }
  };

  // src/tip4serv.ts
  var checkout_instance = new Checkout();
  var cart_instance = new Cart(checkout_instance);
  var html_adapter = new HTMLAdapter(checkout_instance, cart_instance);
  var oauth_instance = new OAuthManager();
  html_adapter.init();
  var Tip4Serv = {
    Checkout: {
      open: (options) => checkout_instance.open(options),
      Cart: {
        Add: (options) => cart_instance.add(options),
        Open: (options) => cart_instance.open(options),
        Clear: () => cart_instance.clear()
      }
    },
    OAuth: {
      Connect: (options) => oauth_instance.connect(options),
      Save: (options) => oauth_instance.save(options),
      Token: () => oauth_instance.token(),
      Disconnect: () => oauth_instance.disconnect()
    },
    version: "1.0.0"
  };
  if (typeof window !== "undefined") {
    window.Tip4Serv = Tip4Serv;
  }
  var tip4serv_default = Tip4Serv;
  return __toCommonJS(tip4serv_exports);
})();
if(typeof window!=='undefined'){window.Tip4Serv=Tip4ServModule.Tip4Serv||Tip4ServModule.default;}
//# sourceMappingURL=tip4serv.js.map
