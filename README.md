# Tip4Serv.js — JavaScript E-commerce & Checkout SDK

**Add products, shopping cart, checkout and Tip4Serv authentication to any website with a few lines of HTML or JavaScript.**

Tip4Serv.js is the official browser SDK for **Tip4Serv**, designed for developers who want to build their own storefront while using Tip4Serv for the commerce infrastructure.

Add Tip4Serv to an existing HTML website, custom gaming store, digital product website or fully custom frontend — without rebuilding the entire checkout system yourself.

⚡ **30-second integration**
🛒 **Embedded checkout & shopping cart**
🔐 **OAuth authentication**
💳 **Tip4Serv commerce infrastructure**
🎨 **Keep complete control of your frontend**

🚀 **[Live Demo & Documentation](https://js.tip4serv.com/demo.html)**
🌐 **[Create a Tip4Serv Store](https://tip4serv.com/register)**
📚 **[Tip4Serv API Documentation](https://tip4serv.gitbook.io/tip4serv-api)**

---

# 🚀 Quick Start

Add one script to your website:

```html
<script
  src="https://js.tip4serv.com/tip4serv.min.js?v=1.0.19"
  data-store-id="YOUR_STORE_ID">
</script>
```

Then turn any HTML button into a checkout button:

```html
<button
  class="tip4serv-buy-btn"
  data-product="vip">
  Buy VIP
</button>
```

That's it.

Clicking the button opens the Tip4Serv checkout for that product.

No JavaScript knowledge is required for basic integrations.

👉 **[Try the Live Demo](https://js.tip4serv.com/demo.html)**

---

# 💡 Why Tip4Serv.js?

Normally, building a custom e-commerce frontend requires developers to create or integrate:

* Product checkout
* Shopping cart logic
* Payment flows
* Subscription handling
* Customer authentication
* Redirect handling
* Payment callbacks
* Server-side commerce logic

Tip4Serv.js lets you keep control of your **HTML, CSS, JavaScript and user experience** while connecting your website to Tip4Serv.

```text
Your Website
     │
     │  tip4serv.js
     ▼
Tip4Serv Checkout
     │
     ▼
Payment
     │
     ▼
Tip4Serv Commerce Infrastructure
```

Build the frontend you want.

Let Tip4Serv handle the commerce layer.

---

# ✨ Features

## ⚡ HTML Mode

Create checkout buttons using only HTML attributes.

Perfect for:

* Static websites
* Landing pages
* Existing websites
* Beginners
* No-code / low-code integrations

Example:

```html
<button
  class="tip4serv-buy-btn"
  data-product="vip">
  Buy VIP
</button>
```

---

## 🛒 JavaScript Checkout API

For dynamic websites, applications and SPAs, open the checkout directly from JavaScript:

```javascript
Tip4Serv.Checkout.open({
  product: "vip"
});
```

This gives developers full programmatic control over the checkout experience.

---

# 📦 Product Checkout

Products can be referenced using their **slug**:

```html
<button
  class="tip4serv-buy-btn"
  data-product="vip">
  Buy VIP
</button>
```

Or their numeric **Product ID**:

```html
<button
  class="tip4serv-buy-btn"
  data-product="14">
  Buy Product #14
</button>
```

---

# 🔢 Product Quantities

Allow customers to purchase multiple units:

```html
<button
  class="tip4serv-buy-btn"
  data-product="50-coins"
  data-quantity="5">
  Buy 50 Coins ×5
</button>
```

The same option can be used through JavaScript.

---

# 💰 Donations

Tip4Serv.js can also initiate checkout for donation products with a predefined amount.

```html
<button
  class="tip4serv-buy-btn"
  data-product="one-time-donation"
  data-donation-amount="10.5">
  Donate $10.50
</button>
```

This is useful for:

* Gaming communities
* Creator websites
* Community projects
* Donation pages
* Supporter websites

---

# 🔄 Subscriptions

Subscription products can be purchased normally or converted into a one-time purchase by disabling recurrence.

```javascript
Tip4Serv.Checkout.open({
  product: "vip",
  subscription: false
});
```

This allows your frontend to offer different purchase experiences while using the same Tip4Serv product.

---

# 🎮 Game Server Selection

Running multiple game servers?

You can pre-select which server should receive the purchase:

```html
<button
  class="tip4serv-buy-btn"
  data-product="bugatti"
  data-server-selection="615">
  Buy for Server #615
</button>
```

This is especially useful for custom stores serving multiple:

* Minecraft servers
* Rust servers
* ARK servers
* FiveM servers
* Palworld servers
* Other game communities supported by Tip4Serv

---

# 🛒 Shopping Cart

Tip4Serv.js includes a complete client-side cart system.

Add products to the cart:

```html
<button
  class="tip4serv-add-cart-btn"
  data-product="vip">
  Add VIP to Cart
</button>
```

Add another product:

```html
<button
  class="tip4serv-add-cart-btn"
  data-product="50-coins"
  data-quantity="5"
  data-subscription="false">
  Add 50 Coins ×5
</button>
```

Then open the cart checkout:

```html
<button class="tip4serv-open-cart-btn">
  Checkout
</button>
```

Products added multiple times automatically stack their quantities.

👉 **[Try the Cart Demo](https://js.tip4serv.com/demo-cart.html)**

---

# 🧑‍💻 JavaScript Cart API

Developers can manage the cart programmatically.

### Add a Product

```javascript
Tip4Serv.Checkout.Cart.Add({
  product: "vip"
});
```

### Add Product with Quantity

```javascript
Tip4Serv.Checkout.Cart.Add({
  product: "50-coins",
  quantity: 5,
  subscription: false
});
```

### Open Checkout

```javascript
Tip4Serv.Checkout.Cart.Open({
  onSuccess: () => console.log("Paid!"),
  onCancel: () => console.log("Cancelled")
});
```

### Clear Cart

```javascript
Tip4Serv.Checkout.Cart.Clear();
```

---

# 📦 Multi-Product Checkout

You don't have to use the persistent cart.

Multiple products can also be sent directly to checkout:

```javascript
Tip4Serv.Checkout.open({
  products: [
    "mystery-box-lvl-5",
    "mystery-box-lvl-10",
    "mystery-box-lvl-15"
  ]
});
```

For more advanced integrations, each product can have its own configuration:

```javascript
Tip4Serv.Checkout.open({
  products: [
    {
      product: "50-coins",
      quantity: 5
    },
    {
      product: "bugatti",
      quantity: 2,
      serverSelection: 615
    },
    {
      product: "one-time-donation",
      donationAmount: 10.5
    }
  ]
});
```

---

# 🎛️ Custom Fields

Tip4Serv custom fields can be passed directly through the SDK.

This allows developers to build their **own product configurator UI**.

For example, a configurable vehicle could allow customers to choose:

* Safety options
* Color
* Fuel quantity
* License plate
* Other custom product options

```javascript
Tip4Serv.Checkout.open({
  product: "luxor",

  customFields: {
    1: true,
    2: "2",
    3: 150,
    4: "ABC-1234"
  },

  onSuccess: () => console.log("Vehicle ordered!"),
  onFail: (err) => console.error(err)
});
```

Custom fields use the following structure:

```javascript
{
  FIELD_ID: VALUE
}
```

Each product inside a multi-product cart can also have its own custom fields.

This makes it possible to create sophisticated product configurators while keeping the entire frontend custom.

---

# ↪️ Success & Cancel Redirects

Send customers to your own pages after checkout.

```html
<button
  class="tip4serv-buy-btn"
  data-product="vip"
  data-success-url="https://example.com/thank-you"
  data-cancel-url="https://example.com/cancelled">
  Buy VIP
</button>
```

This allows Tip4Serv checkout to integrate naturally into an existing website flow.

---

# 📡 Checkout Callbacks

JavaScript applications can react directly to checkout events.

```javascript
Tip4Serv.Checkout.open({

  product: "vip",

  onSuccess: () => {
    console.log("Payment successful!");
  },

  onPending: () => {
    console.log("Payment pending...");
  },

  onCancel: () => {
    console.log("Payment cancelled");
  },

  onFail: (err) => {
    console.error(err);
  }

});
```

Available callbacks include:

* `onSuccess`
* `onPending`
* `onCancel`
* `onFail`

This is useful for SPAs and dynamic interfaces that need to update after checkout.

---

# 🏪 Explicit Store ID

Normally the Store ID is defined directly on the Tip4Serv.js script:

```html
<script
  src="https://js.tip4serv.com/tip4serv.min.js?v=1.0.19"
  data-store-id="YOUR_STORE_ID">
</script>
```

It can also be supplied directly when opening checkout:

```javascript
Tip4Serv.Checkout.open({
  storeId: 31,
  product: "vip",
  quantity: 1
});
```

---

# 🔐 Tip4Serv OAuth

Tip4Serv.js also provides browser-side OAuth helpers for connecting Tip4Serv users to your application.

This makes it possible to add **Log in with Tip4Serv** functionality to a custom website.

👉 **[OAuth Integration Demo](https://js.tip4serv.com/oauth-integration.html)**

---

## Connect

Start the Tip4Serv authorization flow:

```javascript
await Tip4Serv.OAuth.Connect({
  return_url: "https://example.com/oauth/callback"
});
```

The user is redirected to Tip4Serv to authorize your application.

---

## Save the Access Token

On your callback page:

```javascript
Tip4Serv.OAuth.Save();
```

If `tip4serv_access_token` is present in the URL query, Tip4Serv.js can retrieve and save it.

A token can also be supplied explicitly:

```javascript
Tip4Serv.OAuth.Save({
  token: accessToken
});
```

---

## Retrieve the Token

```javascript
const token = Tip4Serv.OAuth.Token();
```

The saved token is validated before being returned.

You can then use it with authorized Tip4Serv API routes.

Example:

```javascript
const token = Tip4Serv.OAuth.Token();

const response = await fetch(
  "https://api.tip4serv.com/v1/user/payments?page=1",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

---

## Disconnect

Remove the local OAuth session:

```javascript
Tip4Serv.OAuth.Disconnect();
```

---

# 🛡️ OAuth Security

`Tip4Serv.OAuth.Connect()` handles important parts of the browser authorization flow including:

* Store ID validation
* Callback URL validation
* Public OAuth client registration
* PKCE generation
* Local state storage
* CSRF state handling

`Tip4Serv.OAuth.Save()` validates the token format and lifetime before storing it.

`Tip4Serv.OAuth.Token()` validates the stored token again before returning it.

`Tip4Serv.OAuth.Disconnect()` removes local OAuth and session information.

> **Important:** `Tip4Serv.OAuth.Connect()` starts the OAuth flow. Your callback page must still exchange the authorization code for an access token before saving it.

---

# 🧩 Build Your Own Storefront

Tip4Serv.js is particularly useful when you don't want to use a standard hosted storefront.

You can build your own:

```text
Custom Website
      │
      ├── HTML / CSS
      ├── JavaScript
      ├── React
      ├── Vue
      ├── Next.js
      └── Any Web Frontend
             │
             ▼
        Tip4Serv.js
             │
      ┌──────┴──────┐
      ▼             ▼
    OAuth        Checkout
                    │
                    ▼
              Tip4Serv Commerce
```

You control the frontend.

Tip4Serv provides the commerce infrastructure behind it.

---

# 🤖 Build a Store with AI

Tip4Serv.js is intentionally simple enough to use with AI coding assistants.

Give the documentation to your AI coding tool and ask it to integrate Tip4Serv into your website.

For example:

```text
Add Tip4Serv checkout to my website.

My Store ID is 123.

Create three product cards with Add to Cart buttons,
a cart button in the navigation and open Tip4Serv checkout
when the customer is ready to pay.
```

Or:

```text
Build a custom gaming store using HTML, CSS and JavaScript.

Use Tip4Serv.js for the shopping cart and checkout.
```

This makes Tip4Serv.js useful for both experienced developers and people building websites with AI-assisted coding tools.

👉 **[Tip4Serv.js Documentation & Examples](https://js.tip4serv.com/demo.html)**

---

# 🧠 HTML vs JavaScript vs API

Tip4Serv provides different levels of integration depending on your project.

| Integration               | Best For                                  | Difficulty              |
| ------------------------- | ----------------------------------------- | ----------------------- |
| **Tip4Serv HTML Buttons** | Simple websites & landing pages           | Beginner                |
| **Tip4Serv.js**           | Custom storefronts & dynamic websites     | Beginner → Advanced     |
| **Tip4Serv API**          | Fully custom commerce integrations        | Advanced                |
| **Tip4Serv OAuth**        | User accounts & authenticated experiences | Intermediate → Advanced |

You can start with a single HTML button and progressively build a complete custom commerce experience.

---

# ⚡ Example: Build a Custom Store

A simple custom store could look like this:

```html
<!DOCTYPE html>

<html>

<head>
  <title>My Store</title>

  <script
    src="https://js.tip4serv.com/tip4serv.min.js?v=1.0.19"
    data-store-id="YOUR_STORE_ID">
  </script>
</head>

<body>

  <h1>My Store</h1>

  <div class="product">

    <h2>VIP</h2>

    <button
      class="tip4serv-add-cart-btn"
      data-product="vip">
      Add to Cart
    </button>

  </div>

  <div class="product">

    <h2>50 Coins</h2>

    <button
      class="tip4serv-add-cart-btn"
      data-product="50-coins"
      data-quantity="5">
      Add to Cart
    </button>

  </div>

  <button class="tip4serv-open-cart-btn">
    🛒 Checkout
  </button>

</body>

</html>
```

Tip4Serv.js handles the connection between your custom frontend and the Tip4Serv checkout.

---

# 🏗️ Tip4Serv Developer Ecosystem

There are several ways to build with Tip4Serv.

## Tip4Serv.js

**Add checkout and shopping cart functionality to an existing website.**

You are here.

---

## Tip4Serv API

Build a completely custom integration and interact directly with Tip4Serv.

📚 **[Tip4Serv API Documentation](https://tip4serv.gitbook.io/tip4serv-api)**

---

## Duster — Next.js Storefront

Don't want to start from scratch?

Use our open-source Next.js storefront as the foundation for your own custom store.

💻 **[Tip4Serv Next.js Storefront](https://github.com/Tip4Serv/tip4serv-nextjs-storefront)**

---

## Tip4Serv MCP Server

Connect Tip4Serv to compatible AI assistants and AI agents through the Model Context Protocol.

🤖 **[Tip4Serv MCP Server](https://github.com/Tip4Serv/Tip4Serv-MCP-Server)**

---

# 📚 Documentation

### Tip4Serv.js Checkout

https://js.tip4serv.com/demo.html

### Shopping Cart

https://js.tip4serv.com/demo-cart.html

### OAuth Integration

https://js.tip4serv.com/oauth-integration.html

### Tip4Serv API

https://tip4serv.gitbook.io/tip4serv-api

### Tip4Serv

https://tip4serv.com

---

# 🎯 Use Cases

Tip4Serv.js can be used to build:

* Custom gaming stores
* Game server webstores
* Digital product stores
* Membership websites
* VIP stores
* Donation websites
* Custom e-commerce storefronts
* Community stores
* Headless commerce frontends
* AI-generated storefronts
* Existing websites that need checkout functionality

You can start with a single checkout button or build an entire custom storefront around the Tip4Serv ecosystem.

---

# ⭐ Support the Project

If Tip4Serv.js helps you build your store, consider giving this repository a **GitHub Star ⭐**.

It helps other developers discover the project.

---

# 🌐 About Tip4Serv

**Tip4Serv is a commerce and monetization platform for gaming communities and digital products.**

Developers can use Tip4Serv.js, the Tip4Serv API or the Tip4Serv MCP server to build custom commerce experiences while using Tip4Serv for the underlying commerce infrastructure.

🌐 **[Tip4Serv](https://tip4serv.com)**
🚀 **[Create a Store](https://tip4serv.com/register)**
📚 **[API Documentation](https://tip4serv.gitbook.io/tip4serv-api)**
⚡ **[Tip4Serv.js Live Demo](https://js.tip4serv.com/demo.html)**

---

**Build your frontend. Connect Tip4Serv. Start selling.**
