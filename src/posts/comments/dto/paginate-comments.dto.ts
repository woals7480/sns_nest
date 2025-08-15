import { IsNumber, IsOptional } from 'class-validator';
import { BasePaginationDto } from 'src/common/dto/base-pagination.dto';

export class PaginateCommentDto extends BasePaginationDto {
    @IsNumber()
    @IsOptional()
    where__likeCount__more_than: number;
}
