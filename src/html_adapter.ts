/**
 * Tip4Serv.js - HTML Adapter
 */

import type { CheckoutOptions, CartAddOptions, CartOpenOptions } from "./types";
import { parse_integer, parse_float, parse_bool, log } from "./utils";
import { Checkout } from "./checkout";
import { Cart } from "./cart";

export class HTMLAdapter {
  private checkout: Checkout;
  private cart: Cart;

  constructor(checkout: Checkout, cart: Cart) {
    this.checkout = checkout;
    this.cart = cart;
  }

  init(): void {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bind_buttons());
    } else {
      this.bind_buttons();
    }
  }

  private bind_buttons(): void {
    // Buy buttons
    const buy_buttons = document.querySelectorAll<HTMLElement>(".tip4serv-buy-btn");
    buy_buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handle_buy_click(button);
      });
    });

    // Cart add buttons
    const add_buttons = document.querySelectorAll<HTMLElement>(".tip4serv-add-cart-btn");
    add_buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handle_cart_add_click(button);
      });
    });

    // Cart open buttons
    const open_buttons = document.querySelectorAll<HTMLElement>(".tip4serv-open-cart-btn");
    open_buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handle_cart_open_click(button);
      });
    });

    // Subscribe to cart changes to update open button disabled state
    this.cart.set_on_change(() => this.update_open_buttons_state());
    this.update_open_buttons_state();
  }

  private handle_buy_click(button: HTMLElement): void {
    const product = button.dataset.product;

    if (!product) {
      log("Button missing data-product attribute", "error");
      return;
    }

    let subscription: boolean | undefined;
    if (button.dataset.subscription !== undefined) {
      subscription = parse_bool(button.dataset.subscription);
    }

    const options: CheckoutOptions = {
      product,
      quantity: parse_integer(button.dataset.quantity),
      subscription,
      donationAmount: parse_float(button.dataset.donationAmount),
      serverSelection: parse_integer(button.dataset.serverSelection),
      successUrl: button.dataset.successUrl,
      cancelUrl: button.dataset.cancelUrl,
      pendingUrl: button.dataset.pendingUrl,
      failUrl: button.dataset.failUrl,
    };

    this.checkout.open(options);
  }

  private handle_cart_add_click(button: HTMLElement): void {
    const product = button.dataset.product;

    if (!product) {
      log("Cart button missing data-product attribute", "error");
      return;
    }

    let subscription: boolean | undefined;
    if (button.dataset.subscription !== undefined) {
      subscription = parse_bool(button.dataset.subscription);
    }

    const options: CartAddOptions = {
      product,
      quantity: parse_integer(button.dataset.quantity),
      subscription,
      donationAmount: parse_float(button.dataset.donationAmount),
      serverSelection: parse_integer(button.dataset.serverSelection),
      customFields: this.parse_custom_fields(button.dataset.customFields),
    };

    this.cart.add(options);
  }

  private handle_cart_open_click(button: HTMLElement): void {
    const options: CartOpenOptions = {
      successUrl: button.dataset.successUrl,
      cancelUrl: button.dataset.cancelUrl,
      pendingUrl: button.dataset.pendingUrl,
      failUrl: button.dataset.failUrl,
    };

    this.cart.open(options);
  }

  /**
   * Enable or disable all .tip4serv-open-cart-btn buttons based on cart state.
   */
  private update_open_buttons_state(): void {
    const has_items = this.cart.get_items().length > 0;
    const buttons = document.querySelectorAll<HTMLButtonElement>(".tip4serv-open-cart-btn");
    buttons.forEach((btn) => {
      btn.disabled = !has_items;
    });
  }

  private parse_custom_fields(
    raw?: string
  ): Record<string, string | number | boolean> | undefined {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      log("Failed to parse data-custom-fields JSON", "error");
      return undefined;
    }
  }
}
