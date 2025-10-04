import { useQuery } from '@tanstack/react-query';
import { NASATemporalService, type NASATemporalRequest } from './nasa-api';

export const useNasaTemporalData = (request: NASATemporalRequest) => {
  return useQuery({
    queryKey: ['nasaTemporalData', request],
    queryFn: () => NASATemporalService.fetchTemporalData(request),
  });
};

export const useNominatimSearch = (locationName: string) => {
  return useQuery({
    queryKey: ['nominatimSearch', locationName],
    queryFn: async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      if (!response.ok) {
        throw new Error('Erro na busca');
      }
      return response.json();
    },
    enabled: !!locationName,
  });
};

export const useNasaPowerData = (request: { start: string, end: string, latitude: number, longitude: number }) => {
  return useQuery({
    queryKey: ['nasaPowerData', request],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: request.start,
        end: request.end,
        latitude: request.latitude.toString(),
        longitude: request.longitude.toString(),
        community: 'ag',
        parameters: 'T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M',
        format: 'json'
      });
      const response = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch NASA POWER data');
      }
      return response.json();
    },
    enabled: !!request.start && !!request.end,
  });
};