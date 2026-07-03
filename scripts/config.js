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
