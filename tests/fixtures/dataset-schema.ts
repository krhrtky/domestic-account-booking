import { z } from 'zod'

const BaseTestCaseSchema = z.object({
  id: z.string().regex(/^[A-Z]{3}-\d{3}$/),
  name: z.string().min(1),
  input: z.record(z.unknown()),
  expected: z.union([
    z.object({ error: z.string() }),
    z.record(z.unknown()),
  ]),
})

const TypicalCaseSchema = BaseTestCaseSchema

const BoundaryCaseSchema = BaseTestCaseSchema

const IncidentCaseSchema = BaseTestCaseSchema.extend({
  reference: z.string().regex(/^(Issue|PR) #\d+$/),
})

const GrayCaseSchema = BaseTestCaseSchema.extend({
  note: z.string().min(10),
})

const AttackCaseSchema = BaseTestCaseSchema

export const DatasetSchema = z.object({
  typical: z.array(TypicalCaseSchema).min(3),
  boundary: z.array(BoundaryCaseSchema).min(3),
  incident: z.array(IncidentCaseSchema).min(1),
  gray: z.array(GrayCaseSchema).min(1),
  attack: z.array(AttackCaseSchema).min(3),
})

export type DatasetType = z.infer<typeof DatasetSchema>
export type TypicalCase = z.infer<typeof TypicalCaseSchema>
export type BoundaryCase = z.infer<typeof BoundaryCaseSchema>
export type IncidentCase = z.infer<typeof IncidentCaseSchema>
export type GrayCase = z.infer<typeof GrayCaseSchema>
export type AttackCase = z.infer<typeof AttackCaseSchema>
