import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { getTeams, predict, PredictRequest } from '../api';

export const useTeams = () =>
  useQuery({ queryKey: ['teams'], queryFn: getTeams, staleTime: Infinity });

export const usePredict = () =>
  useMutation({ mutationFn: (req: PredictRequest) => predict(req) });
