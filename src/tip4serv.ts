/**
 * Tip4Serv.js - Simple checkout integration for beginners
 * @version 1.0.0
 */

import type { CheckoutOptions } from "./types";
import { Checkout } from "./checkout";
import { HTMLAdapter } from "./html_adapter";

// ============================================================================
// INITIALIZATION
// ============================================================================

const checkout_instance = new Checkout();
const html_adapter = new HTMLAdapter(checkout_instance);

// Auto-init HTML adapter
html_adapter.init();

// ============================================================================
// EXPORT
// ============================================================================

const Tip4Serv = {
  Checkout: {
    open: (options: CheckoutOptions) => checkout_instance.open(options),
  },
  version: "1.0.0",
};

// Expose to window for UMD
if (typeof window !== "undefined") {
  (window as unknown as { Tip4Serv: typeof Tip4Serv }).Tip4Serv = Tip4Serv;
}

export { Tip4Serv };
export default Tip4Serv;
