/**
 * Global project configuration.
 *
 * Single source of truth for values that may change per environment.
 * Update PUBLISH_GRAPHQL_HOST here to point the leadership blocks' GraphQL
 * calls at a different AEM publish tier/host in future.
 */

const PUBLISH_GRAPHQL_HOST = 'https://publish-p55671-e392471.adobeaemcloud.com';

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

// eslint-disable-next-line import/prefer-default-export
export const AEM_GRAPHQL_HOST = resolveGraphqlHost();
