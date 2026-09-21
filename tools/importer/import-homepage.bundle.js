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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-featured.js
  function parse(element, { document }) {
    const picture = element.querySelector("picture");
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(" field:image "));
    if (picture) {
      imgFrag.appendChild(picture);
    }
    const textFrag = document.createDocumentFragment();
    const eyebrowLink = element.querySelector("a.upspr-eyebrow-link");
    if (eyebrowLink) {
      const cleanLink = document.createElement("a");
      cleanLink.href = eyebrowLink.href;
      const eyebrowText = element.querySelector(".upspr-eyebrow-text");
      cleanLink.textContent = eyebrowText ? eyebrowText.textContent.trim() : eyebrowLink.textContent.trim();
      const p = document.createElement("p");
      p.appendChild(cleanLink);
      textFrag.appendChild(p);
    }
    const heading = element.querySelector("h4.upspr-heroimage_msg--title, h3.upspr-heroimage_msg--title, h2.upspr-heroimage_msg--title");
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      textFrag.appendChild(h);
    }
    const description = element.querySelector(".upspr-heroimage_msg > p");
    if (description) {
      const p = document.createElement("p");
      p.textContent = description.textContent.trim();
      textFrag.appendChild(p);
    }
    const ctaLink = element.querySelector(".upspr-read-the-story a.btn, .upspr-read-the-story a");
    if (ctaLink) {
      const cleanCta = document.createElement("a");
      cleanCta.href = ctaLink.href;
      let ctaText = "";
      ctaLink.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          ctaText += node.textContent;
        }
      });
      cleanCta.textContent = ctaText.trim() || ctaLink.textContent.trim();
      const p = document.createElement("p");
      p.appendChild(cleanCta);
      textFrag.appendChild(p);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    textCell.appendChild(textFrag);
    const cells = [];
    cells.push([imgFrag]);
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-story.js
  function parse2(element, { document }) {
    const cardItems = element.querySelectorAll(".upspr-stories-list__item");
    const cells = [];
    cardItems.forEach((card) => {
      const img = card.querySelector(".upspr-content-tile__image img, img.upspr-tile-image");
      const imageCell = document.createDocumentFragment();
      if (img) {
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      let hasTextContent = false;
      const eyebrowLink = card.querySelector("a.upspr-eyebrow-link");
      if (eyebrowLink) {
        const cleanLink = document.createElement("a");
        cleanLink.href = eyebrowLink.href || eyebrowLink.getAttribute("href");
        cleanLink.textContent = (card.querySelector(".upspr-eyebrow-text") || eyebrowLink).textContent.trim();
        const tagP = document.createElement("p");
        tagP.appendChild(cleanLink);
        textCell.appendChild(document.createComment(" field:text "));
        textCell.appendChild(tagP);
        hasTextContent = true;
      }
      const heading = card.querySelector("h3");
      if (heading) {
        const headingLink = card.querySelector(".upspr-content-tile__details a.upspr-content-tile__link");
        const h3 = document.createElement("h3");
        if (headingLink) {
          const a = document.createElement("a");
          a.href = headingLink.href || headingLink.getAttribute("href");
          a.textContent = heading.textContent.trim();
          h3.appendChild(a);
        } else {
          h3.textContent = heading.textContent.trim();
        }
        if (!hasTextContent) {
          textCell.appendChild(document.createComment(" field:text "));
          hasTextContent = true;
        }
        textCell.appendChild(h3);
      }
      const description = card.querySelector(".upspr-description, span.upspr-description");
      if (description) {
        const descP = document.createElement("p");
        descP.textContent = description.textContent.trim();
        if (!hasTextContent) {
          textCell.appendChild(document.createComment(" field:text "));
          hasTextContent = true;
        }
        textCell.appendChild(descP);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-story", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-stats.js
  function parse3(element, { document }) {
    const picture = element.querySelector("picture");
    const imageContainer = document.createElement("div");
    imageContainer.appendChild(document.createComment(" field:image "));
    if (picture) {
      imageContainer.appendChild(picture.cloneNode(true));
    }
    const textContainer = document.createElement("div");
    let hasTextContent = false;
    const statItems = element.querySelectorAll("li.upspr-facts__content");
    statItems.forEach((item) => {
      const factEl = item.querySelector("h4.upspr-facts__content--fact, h4");
      const labelEl = item.querySelector("p.upspr-facts__content--label, p");
      if (factEl) {
        if (!hasTextContent) {
          textContainer.appendChild(document.createComment(" field:text "));
          hasTextContent = true;
        }
        const h4 = document.createElement("h4");
        h4.textContent = factEl.textContent.trim();
        textContainer.appendChild(h4);
      }
      if (labelEl) {
        if (!hasTextContent) {
          textContainer.appendChild(document.createComment(" field:text "));
          hasTextContent = true;
        }
        const p = document.createElement("p");
        p.textContent = labelEl.textContent.trim();
        textContainer.appendChild(p);
      }
    });
    const ctaLink = element.querySelector(".upspr-read-the-story a.btn, .upspr-read-the-story a");
    if (ctaLink) {
      if (!hasTextContent) {
        textContainer.appendChild(document.createComment(" field:text "));
        hasTextContent = true;
      }
      const cleanCta = document.createElement("a");
      cleanCta.href = ctaLink.getAttribute("href") || ctaLink.href;
      let ctaText = "";
      for (const node of ctaLink.childNodes) {
        if (node.nodeType === 3) {
          const t = node.textContent.trim();
          if (t) {
            ctaText = t;
            break;
          }
        }
      }
      cleanCta.textContent = ctaText || ctaLink.textContent.trim();
      const ctaPara = document.createElement("p");
      ctaPara.appendChild(cleanCta);
      textContainer.appendChild(ctaPara);
    }
    const cells = [
      [imageContainer],
      [textContainer]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse4(element, { document }) {
    const picture = element.querySelector(".col-lg-6:first-child picture");
    const img = element.querySelector(".col-lg-6:first-child img.upspr-xd-card_image, .col-lg-6:first-child img");
    const leftCell = [];
    if (picture) {
      leftCell.push(picture);
    } else if (img) {
      leftCell.push(img);
    }
    const rightCell = [];
    const eyebrowLink = element.querySelector("a.upspr-eyebrow-link");
    const eyebrowDiv = element.querySelector(".upspr-xd-card_eyebrow");
    if (eyebrowLink) {
      const cleanLink = document.createElement("a");
      cleanLink.href = eyebrowLink.href || eyebrowLink.getAttribute("href") || "";
      cleanLink.textContent = eyebrowDiv ? eyebrowDiv.textContent.trim() : eyebrowLink.textContent.trim();
      const eyebrowPara = document.createElement("p");
      eyebrowPara.appendChild(cleanLink);
      rightCell.push(eyebrowPara);
    } else if (eyebrowDiv) {
      const eyebrowPara = document.createElement("p");
      eyebrowPara.textContent = eyebrowDiv.textContent.trim();
      rightCell.push(eyebrowPara);
    }
    const heading = element.querySelector(".upspr-xd-card_content h2, .upspr-xd-card_container h2, h2");
    if (heading) {
      rightCell.push(heading);
    }
    const description = element.querySelector(".upspr-xd-card_content p, .upspr-xd-card_container p, p");
    if (description) {
      rightCell.push(description);
    }
    const cta = element.querySelector("a.btn.btn-secondary, .upspr-xd-card_content a.btn, a.btn");
    if (cta) {
      const cleanCta = document.createElement("a");
      cleanCta.href = cta.href || cta.getAttribute("href") || "";
      let ctaText = "";
      cta.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          ctaText += node.textContent;
        }
      });
      cleanCta.textContent = ctaText.trim() || cta.textContent.trim();
      const ctaPara = document.createElement("p");
      ctaPara.appendChild(cleanCta);
      rightCell.push(ctaPara);
    }
    const cells = [
      [leftCell, rightCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
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

  // tools/importer/transformers/ups-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const sections = payload && payload.template && payload.template.sections;
      if (!sections || !Array.isArray(sections) || sections.length < 2) {
        return;
      }
      const document = element.ownerDocument;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (!section || !section.selector) {
          continue;
        }
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) {
          continue;
        }
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          if (sectionEl.nextSibling) {
            sectionEl.parentNode.insertBefore(sectionMetadata, sectionEl.nextSibling);
          } else {
            sectionEl.parentNode.appendChild(sectionMetadata);
          }
        }
        if (i > 0) {
          const hr = document.createElement("hr");
          sectionEl.parentNode.insertBefore(hr, sectionEl);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-featured": parse,
    "cards-story": parse2,
    "hero-stats": parse3,
    "columns-media": parse4
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Main landing page with hero story, story cards grid, about us band, stats section, and impact media card",
    urls: [
      "https://about.ups.com/us/en/home.html"
    ],
    blocks: [
      {
        name: "hero-featured",
        instances: ["div.upspr-heroimage:not(.vertical-hero)"]
      },
      {
        name: "cards-story",
        instances: ["div.upspr-three-column-teaser"]
      },
      {
        name: "hero-stats",
        instances: ["div.upspr-heroimage.vertical-hero"]
      },
      {
        name: "columns-media",
        instances: ["div.upspr-xd-card.left"]
      }
    ],
    sections: [
      {
        id: "section-1-tagline",
        name: "Tagline",
        selector: "div.headline:has(h1)",
        style: null,
        blocks: [],
        defaultContent: ["div.upspr-headline h1"]
      },
      {
        id: "section-2-featured-story-hero",
        name: "Featured Story Hero",
        selector: "div.hero:has(.upspr-heroimage:not(.vertical-hero))",
        style: null,
        blocks: ["hero-featured"],
        defaultContent: []
      },
      {
        id: "section-3-story-cards",
        name: "Story Cards",
        selector: "div.pr04-threecolumnteaser",
        style: null,
        blocks: ["cards-story"],
        defaultContent: ["a.btn.btn-secondary[href*='all-stories']"]
      },
      {
        id: "section-4-about-us",
        name: "About Us Text Band",
        selector: "div.headline:has(h4:first-child)",
        style: null,
        blocks: [],
        defaultContent: ["div.upspr-headline h4", "div.upspr-headline h2", "div.headline-cta a.btn"]
      },
      {
        id: "section-5-stats",
        name: "Stats / Facts",
        selector: "div.hero:has(.upspr-heroimage.vertical-hero)",
        style: null,
        blocks: ["hero-stats"],
        defaultContent: []
      },
      {
        id: "section-6-impact",
        name: "Impact Media Card",
        selector: "div.sectioncard",
        style: null,
        blocks: ["columns-media"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
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
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
