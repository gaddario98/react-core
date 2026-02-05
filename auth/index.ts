export * from "./state";

export type AuthState = {
  id: string;
  accountVerified?: boolean;
  isLogged?: boolean;
  token?: string;
  phoneNumber?: string;
  email?: string;
};
