export interface CoreConfig {
  apiUrl: string;

  styleUrl: {
    light: string;
    dark: string;
  };

  mapbox: {
    accessToken: string;
  };
}