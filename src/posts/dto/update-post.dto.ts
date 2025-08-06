import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsOptional, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.messge';

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsString({
        message: stringValidationMessage,
    })
    @IsOptional()
    title?: string;

    @IsString({
        message: stringValidationMessage,
    })
    @IsOptional()
    content?: string;
}
