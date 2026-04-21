/**
 * Tip4Serv.js - OAuth helpers
 */

import {
  AUTH_BASE,
  OAUTH_ACTOR_TYPE,
  OAUTH_CLIENT_STORAGE_KEY,
  OAUTH_SCOPE,
  OAUTH_STATE_STORAGE_KEY,
  OAUTH_TOKEN_STORAGE_KEY,
  OAUTH_VERIFIER_STORAGE_KEY,
} from "./constants";
import type { OAuthConnectOptions, OAuthSaveOptions } from "./types";

interface OAuthClient {
  client_id: string;
  redirect_uris?: string[];
}

interface JwtHeader {
  alg?: string;
  typ?: string;
  [key: string]: unknown;
}

interface JwtPayload {
  exp?: number;
  nbf?: number;
  iat?: number;
  scope?: string;
  [key: string]: unknown;
}

export class OAuthManager {
  async connect(options: OAuthConnectOptions): Promise<void> {
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
      store: String(store_id),
    });

    window.location.assign(`${AUTH_BASE}/authorize?${params.toString()}`);
  }

  save(options: OAuthSaveOptions): void {
    this.assert_browser_api("Tip4Serv.OAuth.Save() requires a browser environment.");

    const token = this.parse_token(options?.token);
    this.verify_token(token);
    window.localStorage.setItem(OAUTH_TOKEN_STORAGE_KEY, token);
  }

  token(): string {
    this.assert_browser_api("Tip4Serv.OAuth.Token() requires a browser environment.");

    const token = window.localStorage.getItem(OAUTH_TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("No OAuth token is currently stored.");
    }

    this.verify_token(token);
    return token;
  }

  disconnect(): void {
    this.assert_browser_api("Tip4Serv.OAuth.Disconnect() requires a browser environment.");

    window.localStorage.removeItem(OAUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(OAUTH_CLIENT_STORAGE_KEY);
    window.sessionStorage.removeItem(OAUTH_VERIFIER_STORAGE_KEY);
    window.sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
  }

  private assert_browser_api(message: string): void {
    if (
      typeof window === "undefined" ||
      typeof window.localStorage === "undefined" ||
      typeof window.sessionStorage === "undefined" ||
      typeof window.crypto === "undefined" ||
      typeof window.fetch === "undefined"
    ) {
      throw new Error(message);
    }
  }

  private parse_store_id(value: number): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("store_id must be a positive integer.");
    }

    return value;
  }

  private parse_url(value: string, field_name: string): string {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${field_name} must be a non-empty URL string.`);
    }

    let url: URL;

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

  private parse_token(value: string): string {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error("token must be a non-empty string.");
    }

    return value.trim();
  }

  private async ensure_client(return_url: string): Promise<OAuthClient> {
    const cached_client = this.load_client();

    if (cached_client?.client_id && cached_client.redirect_uris?.includes(return_url)) {
      return cached_client;
    }

    const response = await window.fetch(`${AUTH_BASE}/register`, {
      method: "POST",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_name: "Tip4Serv.js",
        redirect_uris: [return_url],
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        actor_type: OAUTH_ACTOR_TYPE,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Partial<OAuthClient> & {
      error?: string;
      message?: string;
    };

    if (!response.ok || !data.client_id) {
      throw new Error(data.error || data.message || "OAuth client registration failed.");
    }

    const client: OAuthClient = {
      client_id: data.client_id,
      redirect_uris: Array.isArray(data.redirect_uris) ? data.redirect_uris : [return_url],
    };

    window.localStorage.setItem(OAUTH_CLIENT_STORAGE_KEY, JSON.stringify(client));
    return client;
  }

  private load_client(): OAuthClient | null {
    const raw_client = window.localStorage.getItem(OAUTH_CLIENT_STORAGE_KEY);
    if (!raw_client) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw_client) as OAuthClient;

      if (!parsed?.client_id || typeof parsed.client_id !== "string") {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private verify_token(token: string): JwtPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("token must be a valid JWT access token.");
    }

    const header = this.decode_jwt_part<JwtHeader>(parts[0], "token header");
    const payload = this.decode_jwt_part<JwtPayload>(parts[1], "token payload");
    const now = Math.floor(Date.now() / 1000);

    if (!header.alg || typeof header.alg !== "string") {
      throw new Error("token header is missing a valid algorithm.");
    }

    if (payload.nbf !== undefined && (!Number.isFinite(payload.nbf) || payload.nbf > now)) {
      throw new Error("token is not active yet.");
    }

    if (payload.exp !== undefined && (!Number.isFinite(payload.exp) || payload.exp <= now)) {
      throw new Error("token has expired.");
    }

    return payload;
  }

  private decode_jwt_part<T>(value: string, label: string): T {
    try {
      const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
      const decoded = window.atob(padded);
      return JSON.parse(decoded) as T;
    } catch {
      throw new Error(`Could not decode ${label}.`);
    }
  }

  private async generate_code_challenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return this.base64_url_encode(new Uint8Array(digest));
  }

  private base64_url_encode(bytes: Uint8Array): string {
    let binary = "";

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  private random_string(length: number): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);

    return Array.from(values, (value) => charset[value % charset.length]).join("");
  }
}