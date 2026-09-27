'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/stores/demo-store';

interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
}
interface WebMcpContext {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ) => unknown;
}

export function WebMcpTools() {
  const { state, createRequest } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMcpContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: WebMcpTool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => undefined);
      } catch {
        /* Browser sin soporte completo. */
      }
    };

    register({
      name: 'list_available_lendup_items',
      title: 'Listar objetos disponibles',
      description:
        'Devuelve los objetos activos disponibles en LendUp con su tarifa, garantía y campus.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () =>
        state.listings
          .filter((item) => item.status === 'ACTIVE')
          .map(
            ({ id, title, category, campus, dailyRate, guaranteeAmount }) => ({
              id,
              title,
              category,
              campus,
              dailyRate,
              guaranteeAmount,
            }),
          ),
    });

    register({
      name: 'start_lendup_loan_request',
      title: 'Iniciar solicitud de préstamo',
      description:
        'Abre el objeto indicado para que la persona revise reputación, disponibilidad y condiciones antes de solicitar.',
      inputSchema: {
        type: 'object',
        properties: { listingId: { type: 'string' } },
        required: ['listingId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const listingId =
          typeof input === 'object' && input !== null && 'listingId' in input
            ? String(input.listingId)
            : '';
        if (
          !state.listings.some(
            (item) => item.id === listingId && item.status === 'ACTIVE',
          )
        )
          throw new Error('El objeto no existe o no está disponible.');
        navigate(`/objects/${listingId}`);
        return { listingId, status: 'request_flow_opened' };
      },
    });

    register({
      name: 'create_lendup_loan_request',
      title: 'Crear solicitud de préstamo',
      description:
        'Crea una solicitud para un objeto disponible después de recibir fechas ISO explícitas.',
      inputSchema: {
        type: 'object',
        properties: {
          listingId: { type: 'string' },
          startAt: { type: 'string' },
          endAt: { type: 'string' },
        },
        required: ['listingId', 'startAt', 'endAt'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (
          typeof input !== 'object' ||
          input === null ||
          !('listingId' in input) ||
          !('startAt' in input) ||
          !('endAt' in input)
        )
          throw new Error('Faltan los datos requeridos.');
        const listingId = String(input.listingId);
        const startAt = String(input.startAt);
        const endAt = String(input.endAt);
        if (
          !state.listings.some(
            (item) => item.id === listingId && item.status === 'ACTIVE',
          )
        )
          throw new Error('El objeto no está disponible.');
        if (
          !Number.isFinite(Date.parse(startAt)) ||
          !Number.isFinite(Date.parse(endAt)) ||
          Date.parse(startAt) >= Date.parse(endAt)
        )
          throw new Error('Las fechas no son válidas.');
        const requestId = createRequest(listingId, startAt, endAt);
        navigate('/requests');
        return { requestId, status: 'pending' };
      },
    });
    return () => lifecycle.abort();
  }, [state.listings, createRequest, navigate]);
  return null;
}
