/**
 * Global project configuration.
 *
 * Single source of truth for values that may change per environment.
 * Update AEM_GRAPHQL_HOST here to point the leadership blocks' GraphQL calls
 * at a different AEM tier/host (leave empty '' to use relative same-origin,
 * e.g. when previewing on the AEM author origin).
 */

const RAW_GRAPHQL_HOST = 'https://publish-p55671-e392471.adobeaemcloud.com';

// Strip any trailing slash so URL building never produces a double slash.
// eslint-disable-next-line import/prefer-default-export
export const AEM_GRAPHQL_HOST = RAW_GRAPHQL_HOST.replace(/\/$/, '');
