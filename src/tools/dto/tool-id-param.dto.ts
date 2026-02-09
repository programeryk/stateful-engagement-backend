import { Matches } from 'class-validator';

export class ToolIdParamDto {
  @Matches(/^[a-z0-9_-]+$/i, {
    message: 'toolId must contain only letters, numbers, "_" or "-"',
  })
  toolId!: string;
}
