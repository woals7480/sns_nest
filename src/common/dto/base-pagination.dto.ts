import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class BasePaginationDto {
    @IsNumber()
    @IsOptional()
    page?: number;

    @IsNumber()
    @IsOptional()
    where__id__less_than?: number;

    // ID보다 높은 ID부터 값을 가져오기
    @IsNumber()
    @IsOptional()
    where__id__more_than?: number;

    // 정렬
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    order__createdAt: 'ASC' | 'DESC' = 'ASC';

    // 몇개의 데이터 응답으로 받을지
    @IsNumber()
    @IsOptional()
    take: number = 20;
}
