import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  createTodoSchema,
  updateTodoSchema,
  type CreateTodoInput,
  type Todo,
  type UpdateTodoInput,
} from '@todosday/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TodosService } from './todos.service';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest): Promise<Todo[]> {
    return this.todosService.findAll(req.user.userId);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createTodoSchema)) body: CreateTodoInput,
  ): Promise<Todo> {
    return this.todosService.create(req.user.userId, body);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTodoSchema)) body: UpdateTodoInput,
  ): Promise<Todo> {
    return this.todosService.update(req.user.userId, id, body);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<Todo> {
    return this.todosService.remove(req.user.userId, id);
  }
}
