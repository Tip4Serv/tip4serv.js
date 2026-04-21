/**
 * Tip4Serv.js - Simple checkout integration for beginners
 * @version 1.0.0
 */

import type { CheckoutOptions, CartAddOptions, CartOpenOptions, OAuthConnectOptions, OAuthSaveOptions } from "./types";
import { Checkout } from "./checkout";
import { Cart } from "./cart";
import { HTMLAdapter } from "./html_adapter";
import { OAuthManager } from "./oauth";

// ============================================================================
// INITIALIZATION
// ============================================================================

const checkout_instance = new Checkout();
const cart_instance = new Cart(checkout_instance);
const html_adapter = new HTMLAdapter(checkout_instance, cart_instance);
const oauth_instance = new OAuthManager();

// Auto-init HTML adapter
html_adapter.init();

// ============================================================================
// EXPORT
// ============================================================================

const Tip4Serv = {
  Checkout: {
    open: (options: CheckoutOptions) => checkout_instance.open(options),
    Cart: {
      Add: (options: CartAddOptions) => cart_instance.add(options),
      Open: (options?: CartOpenOptions) => cart_instance.open(options),
      Clear: () => cart_instance.clear(),
    },
  },
  OAuth: {
    Connect: (options: OAuthConnectOptions) => oauth_instance.connect(options),
    Save: (options: OAuthSaveOptions) => oauth_instance.save(options),
    Token: () => oauth_instance.token(),
    Disconnect: () => oauth_instance.disconnect(),
  },
  version: "1.0.0",
};

// Expose to window for UMD
if (typeof window !== "undefined") {
  (window as unknown as { Tip4Serv: typeof Tip4Serv }).Tip4Serv = Tip4Serv;
}

export { Tip4Serv };
export default Tip4Serv;
