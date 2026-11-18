/*
 * Método STY · página /links/
 * Lê links.json (mesma pasta) e monta os botões. Para editar os links, altere só o links.json.
 * Segurança: aceita apenas https:, mailto: e tel:; conteúdo inserido como texto (sem innerHTML);
 * links externos abrem em nova aba com rel="noopener noreferrer".
 */
(function () {
  "use strict";

  var lista = document.querySelector(".js-links");
  var aviso = document.querySelector(".js-erro");
  document.querySelectorAll(".js-ano").forEach(function (s) { s.textContent = new Date().getFullYear(); });
  if (!lista) return;

  var DOMINIOS_DO_SITE = ["metodosty.com", "www.metodosty.com", location.hostname];
  var SVG = "http://www.w3.org/2000/svg";

  // Ícones em traço (24×24). Campo "icone" do links.json: sty, whatsapp, instagram, email, link.
  var ICONES = {
    sty: ["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0", "M3.6 9h16.8", "M3.6 15h16.8", "M11.5 3a17 17 0 0 0 0 18", "M12.5 3a17 17 0 0 1 0 18"],
    whatsapp: ["M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9", "M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"],
    instagram: ["M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z", "M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0", "M16.5 7.5v.01"],
    email: ["M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z", "M3 7l9 6l9 -6"],
    link: ["M9 15l6 -6", "M11 6l.46 -.54a5 5 0 0 1 7.07 7.07l-.53 .47", "M13 18l-.4 .53a5.07 5.07 0 0 1 -7.12 0a4.97 4.97 0 0 1 0 -7.07l.52 -.46"]
  };

  function urlSegura(valor) {
    if (typeof valor !== "string" || !valor.trim()) return null;
    try {
      var u = new URL(valor.trim(), location.href);
      return /^(https:|mailto:|tel:)$/.test(u.protocol) ? u : null;
    } catch (e) { return null; }
  }

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto) n.textContent = texto;
    return n;
  }

  function icone(nome) {
    var svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "lk-btn__icone");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    (ICONES[nome] || ICONES.link).forEach(function (d) {
      var p = document.createElementNS(SVG, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }

  function botao(item, i) {
    var url = urlSegura(item.url);
    var li = el("li");
    li.style.setProperty("--d", 210 + Math.min(i, 8) * 70 + "ms");

    var a = el("a", "btn lk-btn");
    a.href = url.href;
    var externo = url.protocol === "https:" && DOMINIOS_DO_SITE.indexOf(url.hostname) === -1;
    if (externo) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    a.appendChild(icone(typeof item.icone === "string" ? item.icone.trim() : ""));
    var txt = el("span", "lk-btn__txt", item.titulo.trim());
    if (typeof item.descricao === "string" && item.descricao.trim()) {
      txt.appendChild(el("span", "lk-btn__desc", item.descricao.trim()));
    }
    if (externo) txt.appendChild(el("span", "lk-sr", " (abre em nova aba)"));
    a.appendChild(txt);

    li.appendChild(a);
    return li;
  }

  function falhou(motivo) {
    if (window.console) console.warn("[links] " + motivo);
    lista.removeAttribute("aria-busy");
    lista.hidden = true;
    if (aviso) aviso.hidden = false;
  }

  fetch("links.json", { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("links.json respondeu " + r.status);
      return r.json();
    })
    .then(function (dados) {
      var itens = (dados && Array.isArray(dados.links)) ? dados.links : [];
      var validos = itens
        .map(function (item, pos) { return { item: item, pos: pos }; })
        .filter(function (x) {
          var it = x.item;
          if (!it || it.ativo !== true) return false;
          if (typeof it.titulo !== "string" || !it.titulo.trim()) { console.warn("[links] item sem título ignorado", it); return false; }
          if (!urlSegura(it.url)) { console.warn("[links] URL inválida ignorada (use https://, mailto: ou tel:):", it.titulo); return false; }
          return true;
        })
        .sort(function (a, b) {
          var oa = Number(a.item.ordem), ob = Number(b.item.ordem);
          oa = isFinite(oa) ? oa : 9999; ob = isFinite(ob) ? ob : 9999;
          return oa - ob || a.pos - b.pos;
        });

      if (!validos.length) return falhou("nenhum link ativo em links.json");
      var frag = document.createDocumentFragment();
      validos.forEach(function (x, i) { frag.appendChild(botao(x.item, i)); });
      lista.appendChild(frag);
      lista.removeAttribute("aria-busy");
    })
    .catch(function (e) { falhou(e.message); });
})();
