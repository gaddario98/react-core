import { useEffect } from "react";
import { useFormConfigState } from "../form";
import { useLocalizationConfigState, useTranslation } from "../localization";
import { usePageConfigState } from "../pages";
import { useApiConfigState } from "../queries";
import type { FormConfigProps } from "../form";
import type { LocalizationConfigProps } from "../localization";
import type { PageConfigProps } from "../pages";
import type { ApiConfig } from "../queries";
import { AuthState, useAuthValue } from "../auth";
import { useNotification } from "../notifications";

/**
 * Interfaccia che raccoglie tutte le configurazioni dei plugin di core
 */
export interface CoreConfig {
  form?: Partial<FormConfigProps>;
  localization?: LocalizationConfigProps;
  pages?: Partial<PageConfigProps>;
  apiConfig?: Partial<ApiConfig>;
}

/**
 * Hook per accedere a tutte le configurazioni dei plugin di core
 * Fornisce un'interfaccia centralizzata per le impostazioni dell'applicazione
 */
const isLogged = (authState: AuthState | null) =>
  !!authState?.id && !!authState.isLogged;

export const useCoreConfig = ({
  form,
  localization,
  pages,
  apiConfig,
}: CoreConfig) => {
  const auth = useAuthValue();
  const { t: translateText } = useTranslation();
  const { showNotification } = useNotification();
  const [currentFormConfig, setFormConfig] = useFormConfigState();
  const [currentLocalizationConfig, setLocalizationConfig] =
    useLocalizationConfigState();
  const [currentPageConfig, setPageConfig] = usePageConfigState();
  const [currentApiConfig, setApiConfig] = useApiConfigState();

  useEffect(() => {
    setFormConfig({
      translateText,
      showNotification,
      ...currentFormConfig,
      ...form,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translateText, showNotification, form]);

  useEffect(() => {
    setLocalizationConfig({ ...currentLocalizationConfig, ...localization });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(localization)]);

  useEffect(() => {
    setPageConfig({
      authValues: auth,
      ...currentPageConfig,
      ...pages,
      isLogged,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, JSON.stringify(auth)]);

  useEffect(() => {
    setApiConfig({
      defaultHeaders: {
        Authorization: auth?.token ? `Bearer ${auth.token}` : "",
      },
      showNotification,
      validateAuthFn: () => !!auth?.isLogged,
      ...currentApiConfig,
      ...apiConfig,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiConfig, auth?.isLogged, auth?.token, showNotification]);
};
