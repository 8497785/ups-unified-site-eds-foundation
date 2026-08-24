/**
 * Global project configuration.
 *
 * Single source of truth for values that may change per environment.
 * Update PUBLISH_GRAPHQL_HOST here to point the leadership blocks' GraphQL
 * calls at a different AEM publish tier/host in future.
 */

const PUBLISH_GRAPHQL_HOST = 'https://publish-p55671-e392471.adobeaemcloud.com';
const GRAPHQL_PROJECT = 'ups-global';

/**
 * Use the absolute publish host ONLY on the EDS delivery tiers
 * (*.aem.page / *.aem.live). On every other origin — the AEM author/UE
 * environment, localhost, custom domains — return '' so GraphQL calls stay
 * relative same-origin.
 */
function resolveGraphqlHost() {
  const { hostname } = window.location;
  const isDeliveryTier = hostname.endsWith('.aem.page') || hostname.endsWith('.aem.live');
  return isDeliveryTier ? PUBLISH_GRAPHQL_HOST.replace(/\/$/, '') : '';
}

export const AEM_GRAPHQL_HOST = resolveGraphqlHost();

/**
 * Build an AEM GraphQL persisted-query URL for the project.
 *
 * Params are appended as RAW (unencoded) `;key=value` segments — the persisted
 * query parses the literal path/tag values, so encoding the slashes/colons
 * would break the query (the `tag` variable coerces to Null). Empty/undefined
 * values are skipped.
 *
 * @param {string} queryName persisted query name (e.g. 'leadership-list')
 * @param {Object} [params] ordered semicolon params (e.g. { rootPath, tag })
 * @returns {string} the full persisted-query URL
 */
export function getGraphQLUrl(queryName, params = {}) {
  let url = `${AEM_GRAPHQL_HOST}/graphql/execute.json/${GRAPHQL_PROJECT}/${queryName}`;
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url += `;${key}=${value}`;
    }
  });
  return url;
}

const DM_IMAGE_QUALITY = '85';

/**
 * Append Dynamic Media delivery params to a GraphQL headshot `_dynamicUrl`
 * (already in `/adobe/dynamicmedia/deliver/dm-aid--<uuid>/<file>.jpg` form),
 * mirroring the image block: quality=85&width=<w>&preferwebp=true.
 *
 * @param {string} dynamicUrl the headshot `_dynamicUrl` value
 * @param {Object} [opts]
 * @param {number} [opts.width=1280] target render width
 * @returns {string} the delivery URL with params, or '' when input is empty
 */
export function getDynamicMediaUrl(dynamicUrl, { width = 1280 } = {}) {
  if (!dynamicUrl) return '';
  const sep = dynamicUrl.includes('?') ? '&' : '?';
  return `${dynamicUrl}${sep}quality=${DM_IMAGE_QUALITY}&width=${width}&preferwebp=true`;
}

/**
 * Scene7 / Dynamic Media video configuration.
 *
 * Single source of truth for the values that the AEM HTL video component
 * resolves server-side (dynamicmedia_sly.js). Reproduced here so the EDS video
 * block can initialize Adobe's `s7viewers.VideoViewer` client-side.
 *
 * Confirmed from a rendered live instance:
 *   asset-path  : upsprod/UPS_Coco_..._Web_Mix-AVS
 *   asset-name  : UPS_Coco_..._Web_Mix.mp4
 *   viewer-path : https://ups.scene7.com/s7viewers/
 *   imageserver : https://ups.scene7.com/is/image/
 *   videoserver : https://ups.scene7.com/is/content/
 */
export const SCENE7 = {
  domain: 'https://ups.scene7.com',
  viewerScript: 'https://ups.scene7.com/s7viewers/html5/js/VideoViewer.js',
  serverurl: 'https://ups.scene7.com/is/image/',
  videoserverurl: 'https://ups.scene7.com/is/content/',
  contenturl: 'https://ups.scene7.com/is/content/',
  // Company / folder prefix on the Scene7 domain.
  companyPrefix: 'upsprod',
  // Adaptive Video Set suffix appended to the asset id. Change to '' if a
  // deployment serves single-rendition (non-AVS) DM videos.
  assetSuffix: '-AVS',
};

/**
 * Build the Scene7 VideoViewer config from an author-picked DAM path or file
 * name. Derives the asset id as `<companyPrefix>/<file-name-without-ext><suffix>`
 * (e.g. `UPS_Coco_..._Web_Mix.mp4` -> `upsprod/UPS_Coco_..._Web_Mix-AVS`),
 * matching the `data-asset-path` produced by the AEM component.
 *
 * @param {string} damPathOrName the DAM path (e.g. /content/dam/.../foo.mp4) or bare file name
 * @returns {{asset:string, serverurl:string, videoserverurl:string, contenturl:string}|null}
 */
export function getScene7VideoConfig(damPathOrName) {
  if (!damPathOrName) return null;
  const fileName = damPathOrName.split('?')[0].split('/').pop() || '';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  if (!baseName) return null;
  return {
    asset: `${SCENE7.companyPrefix}/${baseName}${SCENE7.assetSuffix}`,
    serverurl: SCENE7.serverurl,
    videoserverurl: SCENE7.videoserverurl,
    contenturl: SCENE7.contenturl,
  };
}
