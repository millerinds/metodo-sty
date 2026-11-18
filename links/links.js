/*
 * Método STY · página /links/
 * Lê links.json (mesma pasta) e monta os cartões. Para editar os links, altere só o links.json.
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

    var seta = el("span", "lk-link__seta", "→");
    seta.setAttribute("aria-hidden", "true");
    a.appendChild(seta);

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
      validos.forEach(function (x, i) { frag.appendChild(cartao(x.item, i)); });
      lista.appendChild(frag);
      lista.removeAttribute("aria-busy");
    })
    .catch(function (e) { falhou(e.message); });
})();
