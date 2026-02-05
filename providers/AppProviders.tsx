import React from "react";
import type { PropsWithChildren, ReactNode } from "react";


export type ProviderConfig =
  | React.ComponentType<{ children: ReactNode }>
  | [React.ComponentType<any>, any];

export interface AppProvidersProps {
  providers?: Array<ProviderConfig>;
}

export const AppProviders: React.FC<PropsWithChildren<AppProvidersProps>> = ({
  children,
  providers = [],
}) => {
  return providers.reduceRight((acc, ProviderEntry) => {
    if (Array.isArray(ProviderEntry)) {
      const [Component, props] = ProviderEntry;
      return <Component {...props}>{acc}</Component>;
    }
    const Component = ProviderEntry;
    return <Component>{acc}</Component>;
  }, children);
};
