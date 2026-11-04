const spinDateInput = document.querySelector("[data-spin-date]");
if (spinDateInput) {
  const now = new Date();
  const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
  spinDateInput.value = localToday;
}
