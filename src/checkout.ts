/**
 * Tip4Serv.js - Checkout
 */

import type { CheckoutOptions, ProductOptions, APIProduct, APIPayload, APIResponse } from "./types";
import { API_BASE } from "./constants";
import { get_store_id_from_script, create_error, log } from "./utils";
import { PopupManager } from "./popup_manager";

export class Checkout {
  private popup_manager = new PopupManager();

  async open(options: CheckoutOptions): Promise<void> {
    // Resolve storeId
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

    // Validate products
    if (!options.product && !options.products) {
      const error = create_error(
        "MISSING_PRODUCT",
        "At least one product is required. Use 'product' or 'products' option."
      );
      log(error.message, "error");
      options.onFail?.(error);
      return;
    }

    // Build API payload
    const payload = this.build_payload(options);

    // Build redirect URLs for the API (convert relative to absolute)
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
      // Call API
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

      // Open popup
      this.popup_manager.open(
        response.url,
        {
          onSuccess: options.onSuccess,
          onPending: options.onPending,
          onCancel: options.onCancel,
          onFail: options.onFail,
        },
        {
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
          pendingUrl: options.pendingUrl,
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

  private build_payload(options: CheckoutOptions): APIPayload {
    const products: APIProduct[] = [];

    if (options.product) {
      // Single product mode
      products.push(this.build_product_payload({
        product: options.product,
        quantity: options.quantity,
        subscription: options.subscription,
        donationAmount: options.donationAmount,
        serverSelection: options.serverSelection,
        customFields: options.customFields,
      }));
    } else if (options.products) {
      // Multi-product mode
      for (const item of options.products) {
        if (typeof item === "string" || typeof item === "number") {
          // Simple format: just product id/slug
          products.push(this.build_product_payload({ product: item }));
        } else {
          // Full format: ProductOptions
          products.push(this.build_product_payload(item));
        }
      }
    }

    return { products };
  }

  private build_product_payload(opts: ProductOptions): APIProduct {
    const product: APIProduct = {
      quantity: opts.quantity ?? 1,
    };

    // If subscription is explicitly false, set type to addtocart (one-time payment)
    if (opts.subscription === false) {
      product.type = "addtocart";
    }

    // Handle product id vs slug
    if (typeof opts.product === "number") {
      product.product_id = opts.product;
    } else {
      // Try to parse as number, otherwise use as slug
      const as_number = parseInt(opts.product, 10);
      if (!isNaN(as_number) && String(as_number) === opts.product) {
        product.product_id = as_number;
      } else {
        product.product_slug = opts.product;
      }
    }

    // Optional fields
    if (opts.donationAmount !== undefined) {
      product.donation_amount = opts.donationAmount;
    }
    if (opts.serverSelection !== undefined) {
      product.server_selection = opts.serverSelection;
    }
    if (opts.customFields !== undefined) {
      // Convert numeric keys to strings for API compatibility
      product.custom_fields = {};
      for (const [key, value] of Object.entries(opts.customFields)) {
        product.custom_fields[String(key)] = value;
      }
    }

    return product;
  }

  private async call_api(store_id: number, payload: APIPayload): Promise<APIResponse> {
    const url = `${API_BASE}/store/checkout?store=${store_id}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  }

  private to_absolute_url(url: string): string {
    // Already absolute
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Convert relative to absolute using current origin
    if (typeof window !== "undefined" && window.location) {
      return new URL(url, window.location.origin).href;
    }
    return url;
  }
}
