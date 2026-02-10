/**
 * Tip4Serv.js - Type definitions
 */

export interface ProductOptions {
  product: string | number;
  quantity?: number;
  subscription?: boolean;
  donationAmount?: number;
  serverSelection?: number;
  customFields?: Record<number | string, string | number | boolean>;
}

export interface CheckoutOptions {
  storeId?: number;
  product?: string | number;
  products?: (string | number | ProductOptions)[];
  quantity?: number;
  subscription?: boolean;
  donationAmount?: number;
  serverSelection?: number;
  customFields?: Record<number | string, string | number | boolean>;
  // Callbacks
  onSuccess?: () => void;
  onPending?: () => void;
  onCancel?: () => void;
  onFail?: (error: Tip4ServError) => void;
  // URLs (for HTML mode)
  successUrl?: string;
  cancelUrl?: string;
  pendingUrl?: string;
}

export interface Tip4ServError {
  code: string;
  message: string;
}

export interface APIProduct {
  product_id?: number;
  product_slug?: string;
  type?: string;
  quantity: number;
  donation_amount?: number;
  server_selection?: number;
  custom_fields?: Record<string, string | number | boolean>;
}

export interface APIPayload {
  products: APIProduct[];
  redirect_success_checkout?: string;
  redirect_canceled_checkout?: string;
  redirect_pending_checkout?: string;
}

export interface APIResponse {
  url?: string;
  error?: string;
}

export interface PopupCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onCancel?: () => void;
  onFail?: (error: Tip4ServError) => void;
}

export interface RedirectUrls {
  successUrl?: string;
  cancelUrl?: string;
  pendingUrl?: string;
}
