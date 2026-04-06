export interface CityConfig {
  name: string;
  weatherQuery: string;
  ticketmasterDMA: string;
  lat: number;
  lon: number;
  openDataEndpoint: string;
  timezoneTZ: string;
  mtaAlertsUrl: string;
}

export const CITY_CONFIG: Record<string, CityConfig> = {
  nyc: {
    name: "New York City",
    weatherQuery: "New York,US",
    ticketmasterDMA: "345",
    lat: 40.7128,
    lon: -74.006,
    openDataEndpoint:
      "https://data.cityofnewyork.us/resource/erm2-nwe9.json",
    timezoneTZ: "America/New_York",
    mtaAlertsUrl:
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts",
  },
};
