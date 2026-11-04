function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function page({ title, body, pageClass = "" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#F5EFE6">
    <title>${escapeHtml(title)} · Crate</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="${pageClass}">
    ${body}
  </body>
</html>`;
}

function brand({ compact = false } = {}) {
  return `<a class="brand${compact ? " brand-compact" : ""}" href="/" aria-label="Crate home">
    <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
    <span>crate</span>
  </a>`;
}

function authPage({ mode, csrfToken, error = "", email = "", displayName = "" }) {
  const isSignup = mode === "signup";
  const title = isSignup ? "Start your collection" : "Welcome back";
  const intro = isSignup
    ? "Keep every record you own in one beautiful place."
    : "Your records are right where you left them.";
  const errorBlock = error
    ? `<p class="form-error" role="alert">${escapeHtml(error)}</p>`
    : "";
  const fields = isSignup
    ? `<label class="field">
        <span>Your name</span>
        <input name="displayName" type="text" autocomplete="name" maxlength="60" placeholder="How should we address you?" value="${escapeHtml(displayName)}" required>
      </label>`
    : "";
  const submitLabel = isSignup ? "Create your account" : "Log in to Crate";
  const switchLink = isSignup
    ? `Already have an account? <a href="/login">Log in</a>`
    : `New to Crate? <a href="/signup">Create an account</a>`;

  return page({
    title: isSignup ? "Create account" : "Log in",
    pageClass: "auth-page",
    body: `<main class="auth-shell">
      <section class="auth-art" aria-label="Crate record collection">
        ${brand()}
        <div class="art-copy">
          <p class="eyebrow">A home for the records you love</p>
          <h1>Every record<br>has a <em>place.</em></h1>
          <p class="art-description">A little less double-buying.<br>A lot more listening.</p>
        </div>
        <div class="vinyl-stack" aria-hidden="true">
          <div class="sleeve sleeve-back"><span class="sleeve-label">SIDE B</span></div>
          <div class="sleeve sleeve-mid"><span class="sleeve-label">GROOVE<br>NOTES</span></div>
          <div class="sleeve sleeve-front">
            <span class="sleeve-sun"></span>
            <span class="sleeve-title">good<br>things<br>spin</span>
            <span class="sleeve-caption">CRATE NO. 001</span>
          </div>
          <div class="record"><span class="record-label"></span></div>
        </div>
        <p class="art-note">YOUR COLLECTION, IN GOOD COMPANY</p>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="mobile-brand">${brand({ compact: true })}</div>
          <p class="eyebrow">${isSignup ? "MAKE YOURSELF AT HOME" : "BACK TO THE MUSIC"}</p>
          <h2>${title}</h2>
          <p class="auth-intro">${intro}</p>
          <form method="post" action="/${mode}" class="auth-form">
            <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
            ${errorBlock}
            ${fields}
            <label class="field">
              <span>Email address</span>
              <input name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" value="${escapeHtml(email)}" required>
            </label>
            <label class="field">
              <span>Password</span>
              <input name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" minlength="${isSignup ? "8" : "1"}" maxlength="72" placeholder="${isSignup ? "At least 8 characters" : "Enter your password"}" required>
            </label>
            <button class="button button-primary" type="submit">${submitLabel}<span aria-hidden="true">↗</span></button>
          </form>
          <p class="auth-switch">${switchLink}</p>
          <p class="auth-footnote">MADE FOR THE LOVE OF THE GROOVE</p>
        </div>
      </section>
    </main>`,
  });
}

function collectionPage({ displayName, csrfToken }) {
  return page({
    title: "My Collection",
    pageClass: "collection-page",
    body: `<header class="site-header">
      ${brand({ compact: true })}
      <div class="header-right">
        <span class="header-greeting">Hi, ${escapeHtml(displayName)}</span>
        <form method="post" action="/logout">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <button class="button button-quiet" type="submit">Log out <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </header>
    <main class="collection-main">
      <div class="collection-heading">
        <p class="eyebrow">YOUR RECORDS, ALL IN ONE PLACE</p>
        <h1>My Collection<span class="heading-period">.</span></h1>
        <p class="collection-intro">A good collection starts with one record.</p>
      </div>
      <section class="empty-state" aria-labelledby="empty-title">
        <div class="empty-record" aria-hidden="true"><span></span></div>
        <p class="eyebrow">THE FIRST GROOVE</p>
        <h2 id="empty-title">Your shelves are waiting.</h2>
        <p>Your collection is empty for now. When you're ready, the records you love will live here.</p>
      </section>
      <footer class="collection-footer">CRATE <span>·</span> A HOME FOR YOUR RECORDS</footer>
    </main>`,
  });
}

module.exports = { authPage, collectionPage };
