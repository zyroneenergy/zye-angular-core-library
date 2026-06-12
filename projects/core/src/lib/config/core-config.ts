export interface CoreConfig {
  apiUrl: string;

  styleUrl: {
    light: string;
    dark: string;
  };

  mapbox: {
    accessToken: string;
  };

  auth: {
    layoutTitle: string;
    layoutSubtitle: string;
    loginTitle: string;
    loginSubtitle: string;
    footerText: string;
    logoUrl?: string;
  }
}