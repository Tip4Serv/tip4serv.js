/**
 * Tip4Serv.js - Cart System
 * Stores products in localStorage and opens checkout with all cart items.
 */

import type { CartAddOptions, CartItem, CartOpenOptions, CheckoutOptions } from "./types";
import { log } from "./utils";
import { Checkout } from "./checkout";

const STORAGE_KEY = "tip4servjs-cart";

export class Cart {
  private checkout: Checkout;
  private on_change?: () => void;

  constructor(checkout: Checkout) {
    this.checkout = checkout;
  }

  /**
   * Register a callback fired whenever the cart changes.
   */
  set_on_change(callback: () => void): void {
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
  add(options: CartAddOptions): void {
    if (!options.product) {
      log("Cart.Add: product is required", "error");
      return;
    }

    const item: CartItem = {
      product: options.product,
      quantity: options.quantity ?? 1,
      subscription: options.subscription,
      donationAmount: options.donationAmount,
      serverSelection: options.serverSelection,
      customFields: options.customFields,
    };

    const is_subscription = item.subscription !== false;
    let cart = this.get_items();

    // Subscription rules
    if (is_subscription) {
      // Adding a subscription → clear everything, only keep this item
      this.save_items([item]);
      return;
    }

    // Adding a one-time product → check if cart has a subscription
    const has_subscription = cart.some((i) => i.subscription !== false);
    if (has_subscription) {
      // Clear subscriptions, keep only the new one-time item
      cart = [];
    }

    // Check for exact duplicate
    const duplicate_index = cart.findIndex((i) => this.items_equal(i, item));

    if (duplicate_index !== -1) {
      // Merge quantities
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
  async open(options: CartOpenOptions = {}): Promise<void> {
    const cart = this.get_items();

    if (cart.length === 0) {
      log("Cart is empty", "warn");
      options.onFail?.({
        code: "EMPTY_CART",
        message: "Cart is empty. Add products before opening checkout.",
      });
      return;
    }

    // Wrap onSuccess to clear cart on success
    const original_on_success = options.onSuccess;
    const clear_cart = () => this.clear();

    const checkout_options: CheckoutOptions = {
      storeId: options.storeId,
      products: cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        subscription: item.subscription,
        donationAmount: item.donationAmount,
        serverSelection: item.serverSelection,
        customFields: item.customFields,
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
      failUrl: options.failUrl,
    };

    // If successUrl is used, clear cart before redirect
    if (options.successUrl) {
      this.clear();
    }

    await this.checkout.open(checkout_options);
  }

  /**
   * Clear all items from the cart.
   */
  clear(): void {
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
  get_items(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      log("Failed to read cart from localStorage", "error");
      return [];
    }
  }

  private save_items(items: CartItem[]): void {
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
  private items_equal(a: CartItem, b: CartItem): boolean {
    if (String(a.product) !== String(b.product)) return false;
    if (a.subscription !== b.subscription) return false;
    if (a.donationAmount !== b.donationAmount) return false;
    if (a.serverSelection !== b.serverSelection) return false;
    return this.custom_fields_equal(a.customFields, b.customFields);
  }

  private custom_fields_equal(
    a?: Record<number | string, string | number | boolean>,
    b?: Record<number | string, string | number | boolean>
  ): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;

    const keys_a = Object.keys(a).sort();
    const keys_b = Object.keys(b).sort();

    if (keys_a.length !== keys_b.length) return false;

    for (let i = 0; i < keys_a.length; i++) {
      if (keys_a[i] !== keys_b[i]) return false;
      if (a[keys_a[i]] !== b[keys_b[i]]) return false;
    }

    return true;
  }
}
