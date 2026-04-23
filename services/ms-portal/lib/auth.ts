import type { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID ?? 'labsis-portal',
      clientSecret: process.env.KEYCLOAK_SECRET ?? 'dev-portal-secret',
      issuer: process.env.KEYCLOAK_ISSUER ?? 'http://localhost:8080/realms/labsis'
    })
  ],
  session: { strategy: 'jwt' }
};
