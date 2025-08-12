import { PickType } from '@nestjs/mapped-types';
import { MessagesModel } from '../entities/messages.entity';
import { IsNumber } from 'class-validator';

export class CreateMessagesDto extends PickType(MessagesModel, ['message']) {
    @IsNumber()
    chatId: number;

    @IsNumber()
    authorId: number;
}
