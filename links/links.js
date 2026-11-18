/*
 * Método STY · página /links/
 * Lê links.json (mesma pasta) e monta os cartões. Para editar os links, altere só o links.json.
 * Segurança: aceita apenas https:, mailto: e tel:; conteúdo inserido como texto (sem innerHTML);
 * links externos abrem em nova aba com rel="noopener noreferrer".
 * Cache: o JSON é sempre conferido com o servidor (cache: "no-cache"), para uma edição valer na hora.
 */
(function () {
  "use strict";

  var lista = document.querySelector(".js-links");
  var aviso = document.querySelector(".js-erro");
  document.querySelectorAll(".js-ano").forEach(function (s) { s.textContent = new Date().getFullYear(); });
  if (!lista) return;

  var DOMINIOS_DO_SITE = ["metodosty.com", "www.metodosty.com", location.hostname];
  var SVG = "http://www.w3.org/2000/svg";

  // Ícone do destino no lugar da seta (campo "icone" do links.json). Sem ícone: seta.
  var ICONES = {
    whatsapp: ["M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9", "M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"],
    instagram: ["M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z", "M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0", "M16.5 7.5v.01"],
    email: ["M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z", "M3 7l9 6l9 -6"]
  };

  function seta(nome) {
    var caminhos = ICONES[nome];
    if (!caminhos) {
      var s = el("span", "lk-link__seta", "\u2192");
      s.setAttribute("aria-hidden", "true");
      return s;
    }
    var svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "lk-link__seta lk-link__icone");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    caminhos.forEach(function (d) {
      var p = document.createElementNS(SVG, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }

  function urlSegura(valor) {
    if (typeof valor !== "string" || !valor.trim()) return null;
    try {
      var u = new URL(valor.trim(), location.href);
      return /^(https:|mailto:|tel:)$/.test(u.protocol) ? u : null;
    } catch (e) { return null; }
  }

  function imagemSegura(valor) {
    if (typeof valor !== "string" || !valor.trim()) return null;
    try {
      var u = new URL(valor.trim(), location.href);
      return /^https?:$/.test(u.protocol) ? u.href : null;
    } catch (e) { return null; }
  }

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto) n.textContent = texto;
    return n;
  }

  function cartao(item, i) {
    var url = urlSegura(item.url);
    var img = imagemSegura(item.imagem);
    var li = el("li", "lk-item" + (item.destaque ? " lk-item--destaque" : ""));
    li.style.setProperty("--d", 210 + Math.min(i, 8) * 70 + "ms");

    var a = el("a", "lk-link" + (img ? "" : " lk-link--sem-img"));
    a.href = url.href;
    var externo = url.protocol === "https:" && DOMINIOS_DO_SITE.indexOf(url.hostname) === -1;
    if (externo) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    if (img) {
      var im = el("img", "lk-link__img");
      im.src = img;
      im.alt = "";
      im.decoding = "async";
      if (item.destaque) { im.width = 640; im.height = 400; } else { im.width = 320; im.height = 320; im.loading = "lazy"; }
      a.appendChild(im);
    }

    var txt = el("span", "lk-link__txt");
    txt.appendChild(el("span", "lk-link__titulo", item.titulo.trim()));
    if (typeof item.descricao === "string" && item.descricao.trim()) {
      txt.appendChild(el("span", "lk-link__desc", item.descricao.trim()));
    }
    if (externo) txt.appendChild(el("span", "lk-sr", " (abre em nova aba)"));
    a.appendChild(txt);

    a.appendChild(seta(typeof item.icone === "string" ? item.icone.trim() : ""));

    li.appendChild(a);
    return li;
  }

  function falhou(motivo) {
    if (window.console) console.warn("[links] " + motivo);
    lista.removeAttribute("aria-busy");
    lista.hidden = true;
    if (aviso) aviso.hidden = false;
  }

  fetch("links.json", { credentials: "same-origin", cache: "no-cache" })
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
      validos.forEach(function (x, i) { frag.appendChild(cartao(x.item, i)); });
      lista.appendChild(frag);
      lista.removeAttribute("aria-busy");
    })
    .catch(function (e) { falhou(e.message); });
})();
