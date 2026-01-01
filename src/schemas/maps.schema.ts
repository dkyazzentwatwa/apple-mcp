import { z } from 'zod';

const SearchLocationsSchema = z.object({
  operation: z.literal('search'),
  query: z.string().min(1, 'query is required for search operation').describe('Search query for locations'),
  limit: z.number().positive().optional().describe('Maximum number of results to return')
});

const SaveLocationSchema = z.object({
  operation: z.literal('save'),
  name: z.string().min(1, 'name is required for save operation').describe('Name of the location'),
  address: z.string().min(1, 'address is required for save operation').describe('Address of the location')
});

const DirectionsSchema = z.object({
  operation: z.literal('directions'),
  fromAddress: z.string().min(1, 'fromAddress is required for directions operation').describe('Starting address for directions'),
  toAddress: z.string().min(1, 'toAddress is required for directions operation').describe('Destination address for directions'),
  transportType: z.enum(['driving', 'walking', 'transit']).optional().describe('Type of transport to use')
});

const PinLocationSchema = z.object({
  operation: z.literal('pin'),
  name: z.string().min(1, 'name is required for pin operation').describe('Name of the location'),
  address: z.string().min(1, 'address is required for pin operation').describe('Address of the location')
});

const ListGuidesSchema = z.object({
  operation: z.literal('listGuides')
});

const CreateGuideSchema = z.object({
  operation: z.literal('createGuide'),
  guideName: z.string().min(1, 'guideName is required for createGuide operation').describe('Name of the guide to create')
});

const AddToGuideSchema = z.object({
  operation: z.literal('addToGuide'),
  address: z.string().min(1, 'address is required for addToGuide operation').describe('Address of the location to add'),
  guideName: z.string().min(1, 'guideName is required for addToGuide operation').describe('Name of the guide to add to')
});

export const MapsArgsSchema = z.discriminatedUnion('operation', [
  SearchLocationsSchema,
  SaveLocationSchema,
  DirectionsSchema,
  PinLocationSchema,
  ListGuidesSchema,
  CreateGuideSchema,
  AddToGuideSchema
]);

export type MapsArgs = z.infer<typeof MapsArgsSchema>;
