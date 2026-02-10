/**
 * Tip4Serv.js - HTML Adapter
 */

import type { CheckoutOptions } from "./types";
import { parse_integer, parse_float, parse_bool, log } from "./utils";
import { Checkout } from "./checkout";

export class HTMLAdapter {
  private checkout: Checkout;

  constructor(checkout: Checkout) {
    this.checkout = checkout;
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
    const buttons = document.querySelectorAll<HTMLElement>(".tip4serv-buy-btn");

    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handle_button_click(button);
      });
    });
  }

  private handle_button_click(button: HTMLElement): void {
    const product = button.dataset.product;

    if (!product) {
      log("Button missing data-product attribute", "error");
      return;
    }

    // Parse subscription: data-subscription="false" means one-time payment
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
}
