(function () {
  var cfg = window.STY_CONFIG || {};
  var url = (cfg.CHECKOUT_URL || "").trim();
  // Só aceita link real de checkout da Kiwify (evita publicar link de teste ou digitado errado).
  var valido = /^https:\/\/pay\.kiwify\.com\.br\/[A-Za-z0-9_-]+\/?(\?[^\s]*)?$/.test(url);
  var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Checkout: o botão principal só aponta para a Kiwify com URL https válida.
  document.querySelectorAll(".js-checkout").forEach(function (a) {
    if (valido) {
      a.href = url;
      a.rel = "noopener";
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.classList.add("btn--off");
      a.textContent = "Inscrições em breve";
    }
  });
  document.querySelectorAll(".js-nota").forEach(function (n) { n.hidden = valido; });

  // Demais chamadas levam direto ao checkout quando ele existir; senão, à seção de inscrição.
  if (valido) {
    document.querySelectorAll(".js-cta:not(.js-checkout)").forEach(function (a) {
      a.href = url;
      a.rel = "noopener";
    });
  }

  var insta = (cfg.INSTAGRAM_URL || "").trim();
  if (/^https:\/\//.test(insta)) {
    document.querySelectorAll(".js-insta").forEach(function (p) {
      p.hidden = false;
      p.querySelector("a").href = insta;
    });
  }

  document.querySelectorAll(".js-ano").forEach(function (s) { s.textContent = new Date().getFullYear(); });

  // Certificado com o nome digitado (prévia local; nada é enviado).
  var campo = document.getElementById("cert-nome");
  var alvo = document.querySelector(".js-cert-nome");
  if (campo && alvo) {
    var exemplo = "Seu nome aqui";
    var poe = function () {
      var v = campo.value.replace(/\s+/g, " ").trim();
      alvo.textContent = v || exemplo;
      alvo.classList.toggle("vazio", !v);
    };
    campo.addEventListener("input", poe);
    poe();
  }

  // Vídeo em loop: só toca sem "reduzir movimento" e quando está na tela.
  var video = document.querySelector(".js-loop");
  if (video && !reduz && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else video.pause();
    }, { threshold: 0.25 }).observe(video);
  }

  // Entradas: cada parte da seção sobe com 70 ms de intervalo, uma vez.
  var itens = document.querySelectorAll(".rv, .hero__foto");
  if (reduz || !("IntersectionObserver" in window)) {
    itens.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var grupos = new Map();
  itens.forEach(function (el) {
    var sec = el.closest("section, footer") || document.body;
    var n = grupos.get(sec) || 0;
    el.style.setProperty("--d", Math.min(n, 8) * 70 + "ms");
    grupos.set(sec, n + 1);
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  itens.forEach(function (el) { io.observe(el); });
})();
