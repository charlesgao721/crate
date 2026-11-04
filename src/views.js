function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function fieldError(errors, name) {
  if (!errors?.[name]) return "";
  return `<span class="field-error" id="${name}-error" role="alert">${escapeHtml(errors[name])}</span>`;
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

function authPage({
  mode,
  csrfToken,
  error = "",
  fieldErrors = {},
  email = "",
  displayName = "",
}) {
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
          <form method="post" action="/${mode}" class="auth-form"${isSignup ? " novalidate" : ""}>
            <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
            ${errorBlock}
            ${fields}
            <label class="field">
              <span>Email address</span>
              <input name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" value="${escapeHtml(email)}" required>
              ${fieldError(fieldErrors, "email")}
            </label>
            <label class="field">
              <span>Password</span>
              <input name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" minlength="${isSignup ? "8" : "1"}" maxlength="72" placeholder="${isSignup ? "At least 8 characters" : "Enter your password"}" required>
              ${fieldError(fieldErrors, "password")}
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

function appHeader({ displayName, csrfToken, activePage = "" }) {
  const collectionActive = activePage === "collection" ? " nav-link-active" : "";
  const artistsActive = activePage === "artists" ? " nav-link-active" : "";
  return `<header class="site-header">
    ${brand({ compact: true })}
    <nav class="main-nav" aria-label="Main navigation">
      <a class="nav-link${collectionActive}" href="/collection">My Collection</a>
      <a class="nav-link${artistsActive}" href="/artists">Artists</a>
    </nav>
    <div class="header-right">
      <span class="header-greeting">Hi, ${escapeHtml(displayName)}</span>
      <form method="post" action="/logout">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <button class="button button-quiet" type="submit">Log out <span aria-hidden="true">↗</span></button>
      </form>
    </div>
  </header>`;
}

function collectionPage({ displayName, csrfToken, records }) {
  const content = records.length
    ? `<div class="record-grid">
        ${records.map((record) => `<a class="record-card" href="/records/${escapeHtml(record.id)}">
          <span class="record-card-cover" aria-hidden="true">
            <span class="cover-sun"></span>
            <span class="cover-initial">${escapeHtml(record.title.trim().charAt(0).toUpperCase())}</span>
            <span class="cover-lines"></span>
          </span>
          <span class="record-card-copy">
            <span class="record-card-title">${escapeHtml(record.title)}</span>
            <span class="record-card-artist">${escapeHtml(record.artist_name)}</span>
            <span class="record-card-meta">${record.release_year ? escapeHtml(record.release_year) : "Year unknown"} <span aria-hidden="true">·</span> ${record.rating ? `${escapeHtml(record.rating)} / 5` : "Unrated"}</span>
          </span>
        </a>`).join("")}
      </div>`
    : `<section class="empty-state" aria-labelledby="empty-title">
        <div class="empty-record" aria-hidden="true"><span></span></div>
        <p class="eyebrow">THE FIRST GROOVE</p>
        <h2 id="empty-title">Your shelves are waiting.</h2>
        <p>Your collection is empty for now. Start with a record you love.</p>
      </section>`;

  return page({
    title: "My Collection",
    pageClass: "collection-page",
    body: `${appHeader({ displayName, csrfToken, activePage: "collection" })}
    <main class="collection-main">
      <div class="collection-heading">
        <div class="collection-title-group">
          <p class="eyebrow">YOUR RECORDS, ALL IN ONE PLACE</p>
          <h1>My Collection<span class="heading-period">.</span></h1>
          <p class="collection-intro">${records.length} ${records.length === 1 ? "record" : "records"} in your collection</p>
        </div>
        <a class="button button-primary add-record-button" href="/records/new">Add record <span aria-hidden="true">+</span></a>
      </div>
      ${content}
      <footer class="collection-footer">CRATE <span>·</span> A HOME FOR YOUR RECORDS</footer>
    </main>`,
  });
}

function recordFormPage({ mode, displayName, csrfToken, record = {}, errors = {} }) {
  const isEdit = mode === "edit";
  const action = isEdit ? `/records/${escapeHtml(record.id)}/edit` : "/records";
  const title = isEdit ? "Edit record" : "Add a record";
  const submit = isEdit ? "Save changes" : "Add to collection";
  const value = (camelCase, snakeCase) => record[camelCase] ?? record[snakeCase] ?? "";
  const year = value("releaseYear", "release_year");
  const price = value("pricePaid", "price_paid");
  const date = dateInputValue(value("purchaseDate", "purchase_date"));
  const rating = value("rating", "rating");
  const condition = record.condition ?? "";
  const artistName = value("artistName", "artist_name");
  const currentYear = new Date().getFullYear();
  const formatOptions = ["LP", "EP", "7-inch", "Box set"];
  const conditionOptions = ["Mint", "VG+", "VG", "G"];

  return page({
    title,
    pageClass: "record-form-page",
    body: `${appHeader({ displayName, csrfToken, activePage: "collection" })}
      <main class="record-form-main">
        <a class="back-link" href="/collection"><span aria-hidden="true">←</span> My Collection</a>
        <div class="record-form-heading">
          <p class="eyebrow">${isEdit ? "MAKE IT JUST RIGHT" : "A NEW ADDITION"}</p>
          <h1>${title}<span class="heading-period">.</span></h1>
          <p>${isEdit ? "Update the details of this record." : "Add a record to your collection."}</p>
        </div>
        <form class="record-form" method="post" action="${action}" novalidate data-record-form data-current-year="${currentYear}">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <label class="field">
            <span>Title <b aria-hidden="true">*</b></span>
            <input name="title" type="text" value="${escapeHtml(record.title ?? "")}" required>
            ${fieldError(errors, "title")}
          </label>
          <label class="field">
            <span>Artist <b aria-hidden="true">*</b></span>
            <input name="artistName" type="text" value="${escapeHtml(artistName)}" placeholder="Type an artist name" required>
            ${fieldError(errors, "artistName")}
          </label>
          <div class="form-row">
            <label class="field">
              <span>Release year</span>
              <input name="releaseYear" type="number" min="1900" max="${currentYear}" value="${escapeHtml(year)}">
              ${fieldError(errors, "releaseYear")}
            </label>
            <label class="field">
              <span>Format <b aria-hidden="true">*</b></span>
              <select name="format" required>
                <option value="">Choose a format</option>
                ${formatOptions.map((option) => `<option value="${option}"${record.format === option ? " selected" : ""}>${option}</option>`).join("")}
              </select>
              ${fieldError(errors, "format")}
            </label>
          </div>
          <div class="form-row">
            <label class="field">
              <span>Genre</span>
              <input name="genre" type="text" value="${escapeHtml(record.genre ?? "")}" placeholder="e.g. Jazz, Soul">
            </label>
            <label class="field">
              <span>Condition</span>
              <select name="condition">
                <option value="">Choose a condition</option>
                ${conditionOptions.map((option) => `<option value="${option}"${condition === option ? " selected" : ""}>${option}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="form-row">
            <label class="field">
              <span>Price paid</span>
              <input name="pricePaid" type="number" min="0" step="0.01" value="${escapeHtml(price)}" placeholder="0.00">
              ${fieldError(errors, "pricePaid")}
            </label>
            <label class="field">
              <span>Purchase date</span>
              <input name="purchaseDate" type="date" value="${escapeHtml(date)}">
            </label>
          </div>
          <label class="field field-rating">
            <span>Rating</span>
            <input name="rating" type="number" min="1" max="5" step="1" value="${escapeHtml(rating)}" placeholder="1 to 5">
              ${fieldError(errors, "rating")}
          </label>
          <label class="field">
            <span>Notes</span>
            <textarea name="notes" rows="4" placeholder="Anything you want to remember about this record">${escapeHtml(record.notes ?? "")}</textarea>
          </label>
          <div class="form-actions">
            <a class="button button-secondary" href="${isEdit ? `/records/${escapeHtml(record.id)}` : "/collection"}">Cancel</a>
            <button class="button button-primary" type="submit">${submit}<span aria-hidden="true">↗</span></button>
          </div>
        </form>
        <script src="/record-validation.js" defer></script>
      </main>`,
  });
}

function dateInputValue(value) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  const date = value instanceof Date
    ? value
    : new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? escapeHtml(String(value))
    : escapeHtml(date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }));
}

function detailValue(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : escapeHtml(value);
}

function recordDetailPage({ displayName, csrfToken, record }) {
  const price = record.price_paid === null || record.price_paid === undefined
    ? "—"
    : `$${Number(record.price_paid).toFixed(2)}`;
  const addedDate = record.created_at
    ? escapeHtml(new Date(record.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }))
    : "—";

  return page({
    title: record.title,
    pageClass: "record-detail-page",
    body: `${appHeader({ displayName, csrfToken, activePage: "collection" })}
      <main class="record-detail-main">
        <a class="back-link" href="/collection"><span aria-hidden="true">←</span> My Collection</a>
        <section class="record-detail-card">
          <div class="detail-cover" aria-hidden="true">
            <span class="detail-cover-sun"></span>
            <span class="detail-cover-initial">${escapeHtml(record.title.trim().charAt(0).toUpperCase())}</span>
            <span class="detail-cover-caption">CRATE COLLECTION</span>
          </div>
          <div class="record-detail-copy">
            <p class="eyebrow">IN YOUR COLLECTION</p>
            <h1>${escapeHtml(record.title)}<span class="heading-period">.</span></h1>
            <p class="detail-artist"><a href="/artists/${escapeHtml(record.artist_id)}">${escapeHtml(record.artist_name)}</a></p>
            <div class="detail-actions">
              <a class="button button-primary" href="/records/${escapeHtml(record.id)}/edit">Edit record</a>
              <a class="button button-danger" href="/records/${escapeHtml(record.id)}/delete">Delete</a>
            </div>
          </div>
        </section>
        <section class="record-fields" aria-label="Record details">
          <div class="record-field"><span>Title</span><p>${detailValue(record.title)}</p></div>
          <div class="record-field"><span>Artist</span><p><a href="/artists/${escapeHtml(record.artist_id)}">${escapeHtml(record.artist_name)}</a></p></div>
          <div class="record-field"><span>Release year</span><p>${detailValue(record.release_year)}</p></div>
          <div class="record-field"><span>Format</span><p>${detailValue(record.format)}</p></div>
          <div class="record-field"><span>Genre</span><p>${detailValue(record.genre)}</p></div>
          <div class="record-field"><span>Condition</span><p>${detailValue(record.condition)}</p></div>
          <div class="record-field"><span>Price paid</span><p>${price}</p></div>
          <div class="record-field"><span>Purchase date</span><p>${formatDate(record.purchase_date)}</p></div>
          <div class="record-field"><span>Rating</span><p>${record.rating ? `${detailValue(record.rating)} / 5` : "—"}</p></div>
          <div class="record-field record-field-wide"><span>Notes</span><p class="record-notes">${detailValue(record.notes)}</p></div>
          <div class="record-field record-field-wide"><span>Added to Crate</span><p>${addedDate}</p></div>
        </section>
      </main>`,
  });
}

function recordDeletePage({ displayName, csrfToken, record }) {
  return page({
    title: "Delete record",
    pageClass: "record-delete-page",
    body: `${appHeader({ displayName, csrfToken, activePage: "collection" })}
      <main class="delete-confirm-main">
        <div class="delete-confirm-card">
          <div class="delete-symbol" aria-hidden="true">×</div>
          <p class="eyebrow">REMOVE FROM YOUR SHELF</p>
          <h1>Are you sure you want to delete ${escapeHtml(record.title)}?</h1>
          <p>This will remove the record from your collection.</p>
          <div class="form-actions">
            <a class="button button-secondary" href="/records/${escapeHtml(record.id)}">Cancel</a>
            <form method="post" action="/records/${escapeHtml(record.id)}/delete">
              <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
              <button class="button button-danger" type="submit">Yes, delete record</button>
            </form>
          </div>
        </div>
      </main>`,
  });
}

function artistsPage({ displayName, csrfToken, artists }) {
  const content = artists.length
    ? `<div class="artist-grid">
        ${artists.map((artist) => `<a class="artist-card" href="/artists/${escapeHtml(artist.id)}">
          <span class="artist-avatar" aria-hidden="true">${escapeHtml(artist.name.trim().charAt(0).toUpperCase())}</span>
          <span class="artist-card-copy">
            <span class="artist-name">${escapeHtml(artist.name)}</span>
            <span class="artist-country">${artist.country ? escapeHtml(artist.country) : "Artist"}</span>
          </span>
          <span class="artist-arrow" aria-hidden="true">↗</span>
        </a>`).join("")}
      </div>`
    : `<section class="empty-state artists-empty" aria-labelledby="artists-empty-title">
        <div class="empty-record" aria-hidden="true"><span></span></div>
        <p class="eyebrow">YOUR ARTISTS</p>
        <h2 id="artists-empty-title">No artists yet.</h2>
        <p>Artists will show up here as your collection grows.</p>
      </section>`;

  return page({
    title: "Artists",
    pageClass: "artists-page",
    body: `${appHeader({ displayName, csrfToken, activePage: "artists" })}
      <main class="artists-main">
        <div class="artists-heading">
          <p class="eyebrow">THE PEOPLE BEHIND THE MUSIC</p>
          <h1>Your Artists<span class="heading-period">.</span></h1>
          <p>Browse the artists in your record collection.</p>
        </div>
        ${content}
        <footer class="collection-footer">CRATE <span>·</span> A HOME FOR YOUR RECORDS</footer>
      </main>`,
  });
}

function artistDetailPage({ displayName, csrfToken, artist, records }) {
  const countryLine = artist.country
    ? `<span class="detail-country">${escapeHtml(artist.country)}</span>`
    : "";
  const recordContent = records.length
    ? `<div class="record-list">
        ${records.map((record) => {
          const metadata = [
            record.release_year,
            record.format,
            record.genre,
            record.condition,
          ].filter(Boolean).map(escapeHtml).join(" <span aria-hidden=\"true\">·</span> ");
          return `<article class="record-row">
            <span class="record-row-mark" aria-hidden="true"><span></span></span>
            <span class="record-row-copy">
              <span class="record-title">${escapeHtml(record.title)}</span>
              <span class="record-meta">${metadata || "Record"}</span>
            </span>
          </article>`;
        }).join("")}
      </div>`
    : `<section class="empty-state detail-empty" aria-labelledby="records-empty-title">
        <div class="empty-record" aria-hidden="true"><span></span></div>
        <p class="eyebrow">IN THE GROOVE</p>
        <h2 id="records-empty-title">No records by this artist yet.</h2>
        <p>Albums and releases you collect by ${escapeHtml(artist.name)} will appear here.</p>
      </section>`;

  return page({
    title: artist.name,
    pageClass: "artist-detail-page",
    body: `${appHeader({ displayName, csrfToken, activePage: "artists" })}
      <main class="artist-detail-main">
        <a class="back-link" href="/artists"><span aria-hidden="true">←</span> All artists</a>
        <div class="artist-detail-heading">
          <p class="eyebrow">ARTIST</p>
          <h1>${escapeHtml(artist.name)}<span class="heading-period">.</span></h1>
          ${countryLine}
        </div>
        <section class="artist-records" aria-labelledby="records-heading">
          <div class="section-heading">
            <h2 id="records-heading">Records</h2>
            <span class="record-count">${records.length} ${records.length === 1 ? "record" : "records"}</span>
          </div>
          ${recordContent}
        </section>
        <footer class="collection-footer">CRATE <span>·</span> A HOME FOR YOUR RECORDS</footer>
      </main>`,
  });
}

module.exports = {
  authPage,
  collectionPage,
  artistsPage,
  artistDetailPage,
  recordFormPage,
  recordDetailPage,
  recordDeletePage,
};
