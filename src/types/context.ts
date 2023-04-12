import { Helix } from '@adobe/helix-universal';

export type Environment = Record<string, string>;

export interface POSTData {

}

/**
 * Context
 */
export interface Context extends Helix.UniversalContext {
  env: Environment;
  data: POSTData | undefined;
  url: URL;
}