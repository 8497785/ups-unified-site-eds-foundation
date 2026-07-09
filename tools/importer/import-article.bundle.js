/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-article.js
  var import_article_exports = {};
  __export(import_article_exports, {
    default: () => import_article_default
  });

  // tools/importer/parsers/article.js
  function parse(element, { document }) {
    const cellComment = (name) => document.createComment(` field:${name} `);
    const eyebrowLink = element.querySelector(".upspr-two-column_eyebrow a.upspr-eyebrow-link, .upspr-two-column_eyebrow a");
    const eyebrowTextEl = element.querySelector(".upspr-two-column_eyebrow .upspr-eyebrow-text");
    const eyebrowText = eyebrowTextEl ? eyebrowTextEl.textContent.trim() : eyebrowLink ? eyebrowLink.textContent.trim() : "";
    const eyebrowCell = document.createDocumentFragment();
    eyebrowCell.appendChild(cellComment("eyebrow"));
    if (eyebrowText) eyebrowCell.appendChild(document.createTextNode(eyebrowText));
    const eyebrowLinkCell = document.createDocumentFragment();
    eyebrowLinkCell.appendChild(cellComment("eyebrowLink"));
    if (eyebrowLink && eyebrowLink.getAttribute("href")) {
      const a = document.createElement("a");
      a.href = eyebrowLink.getAttribute("href");
      a.textContent = eyebrowText || eyebrowLink.getAttribute("href");
      eyebrowLinkCell.appendChild(a);
    }
    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(cellComment("title"));
    const h1 = element.querySelector(".upspr-two-column_title h1, h1");
    if (h1) {
      const h = document.createElement("h1");
      h.textContent = h1.textContent.trim();
      titleCell.appendChild(h);
    }
    const descCell = document.createDocumentFragment();
    descCell.appendChild(cellComment("description"));
    const descEl = element.querySelector(".upspr-two-column_subtext");
    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = descEl.textContent.trim();
      descCell.appendChild(p);
    }
    const dateEl = element.querySelector(".upspr-byline .upspr-story-date, .upspr-story-date");
    const dateCell = document.createDocumentFragment();
    dateCell.appendChild(cellComment("articleDate"));
    if (dateEl) dateCell.appendChild(document.createTextNode(dateEl.textContent.trim()));
    const hideReadTimeCell = document.createDocumentFragment();
    hideReadTimeCell.appendChild(cellComment("hideReadTime"));
    hideReadTimeCell.appendChild(document.createTextNode("false"));
    const headerBlock = WebImporter.Blocks.createBlock(document, {
      name: "article-header",
      cells: [
        [eyebrowCell],
        [eyebrowLinkCell],
        [titleCell],
        [descCell],
        [dateCell],
        [hideReadTimeCell]
      ]
    });
    let heroPicture = null;
    const heroImg = element.querySelector(".upspr-heroimage img, img.upspr-heroimage_img");
    if (heroImg) {
      const src = heroImg.getAttribute("src") || heroImg.getAttribute("data-src");
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = heroImg.getAttribute("alt") || "";
        const p = document.createElement("p");
        p.appendChild(img);
        heroPicture = p;
      }
    }
    const bodyFrag = document.createElement("div");
    const body = element.querySelector(".cmp-text");
    if (body) {
      body.querySelectorAll(":scope > p, :scope > ul, :scope > ol, :scope > h2, :scope > h3").forEach((node) => {
        bodyFrag.appendChild(node.cloneNode(true));
      });
    }
    const leftCol = document.createElement("div");
    leftCol.appendChild(bodyFrag);
    const shareLabelCell = document.createDocumentFragment();
    shareLabelCell.appendChild(cellComment("label"));
    const socialBlock = WebImporter.Blocks.createBlock(document, {
      name: "social-share",
      cells: [[shareLabelCell]]
    });
    const rightCol = document.createElement("div");
    rightCol.appendChild(socialBlock);
    const gridBlock = WebImporter.Blocks.createBlock(document, {
      name: "Grid Layout Container (layout-8-4)",
      cells: [[leftCol, rightCol]]
    });
    const container = document.createElement("div");
    container.setAttribute("data-article-root", "true");
    container.appendChild(headerBlock);
    if (heroPicture) container.appendChild(heroPicture);
    container.appendChild(gridBlock);
    element.replaceWith(container);
  }

  // tools/importer/transformers/ups-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#upspr-language-selector-modal"]);
      WebImporter.DOMUtils.remove(element, ["#global-forms"]);
      WebImporter.DOMUtils.remove(element, [".upspr-overlay", ".upspr-overlay-global"]);
      WebImporter.DOMUtils.remove(element, ["#ZN_dpzhr48CPI7BKES"]);
      WebImporter.DOMUtils.remove(element, ['link[rel="preconnect"]', 'link[rel="preload"]']);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [".cmp-experiencefragment--upspr-header-fragment"]);
      WebImporter.DOMUtils.remove(element, [".cmp-experiencefragment--upspr-footer-fragment"]);
      WebImporter.DOMUtils.remove(element, ["header", "footer"]);
      WebImporter.DOMUtils.remove(element, ["#uspsr-navContainer"]);
      WebImporter.DOMUtils.remove(element, ["noscript", "iframe", "link"]);
      WebImporter.DOMUtils.remove(element, ["script"]);
      element.querySelectorAll("[data-link-name]").forEach((el) => {
        el.removeAttribute("data-link-name");
      });
      element.querySelectorAll("[data-link-type]").forEach((el) => {
        el.removeAttribute("data-link-type");
      });
      element.querySelectorAll("[data-toggle]").forEach((el) => {
        el.removeAttribute("data-toggle");
      });
      element.querySelectorAll("[data-target]").forEach((el) => {
        el.removeAttribute("data-target");
      });
      element.querySelectorAll("[data-attribute]").forEach((el) => {
        el.removeAttribute("data-attribute");
      });
    }
  }

  // tools/importer/import-article.js
  var parsers = {
    article: parse
  };
  var PAGE_TEMPLATE = {
    name: "article",
    description: "Press-release / article detail page: article-header, hero image, and a Grid Layout Container (8/4) with body rich text and a social-share block",
    urls: [
      "https://about.ups.com/us/en/newsroom/press-releases/customer-first/ups-extends-complex-healthcare-logistics-lead-with--48-million-i.html"
    ],
    blocks: [
      {
        name: "article",
        instances: ["div.upspr-two-column"]
      }
    ],
    sections: []
  };
  var transformers = [
    transform
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const articleRoot = main.querySelector('[data-article-root="true"]');
      if (articleRoot) {
        while (main.firstChild) main.removeChild(main.firstChild);
        main.appendChild(articleRoot);
      }
      try {
        document.title = "Article";
      } catch (e) {
      }
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      main.querySelectorAll("img[src]").forEach((img) => {
        const rewritten = img.getAttribute("src").replace(/^https?:\/\/[^/]*(\/content\/dam\/)/, "https://about.ups.com$1").replace(/^(\/content\/dam\/)/, "https://about.ups.com$1");
        img.setAttribute("src", rewritten);
      });
      const srcPath = new URL(params.originalURL).pathname.replace(/\.html$/, "").replace(/\/$/, "");
      const rest = srcPath.replace(/^\/us\/en\//, "");
      const path = WebImporter.FileUtils.sanitizePath(`/language-masters/en/${rest}`);
      return [{
        element: main,
        path,
        report: {
          title: "Article",
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_article_exports);
})();
