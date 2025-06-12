function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/`
  }
  
  function getCookie(name) {
    return document.cookie.split("; ").find(row => row.startsWith(name + "="))?.split("=")[1]
  }
  
  function showCookieBanner() {
    const consent = getCookie("cookie_consent")
    if (!consent) {
      document.getElementById("cookie-banner").style.display = "flex"
    }
  }
  
  function acceptCookies() {
    setCookie("cookie_consent", "accepted", 365)
    document.getElementById("cookie-banner").style.display = "none"
    // Optionally call any script loaders or tracking here
  }
  
  function rejectCookies() {
    setCookie("cookie_consent", "rejected", 365)
    document.getElementById("cookie-banner").style.display = "none"
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    showCookieBanner()
    document.getElementById("accept-cookies").addEventListener("click", acceptCookies)
    document.getElementById("reject-cookies").addEventListener("click", rejectCookies)
  })
  