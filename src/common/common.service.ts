import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from './dto/base-pagination.dto';
import {
    FindManyOptions,
    FindOptionsOrder,
    FindOptionsWhere,
    Repository,
} from 'typeorm';
import { BaseModel } from './entities/base.entity';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_POROTOCOL_KEY } from './const/env-keys.const';

@Injectable()
export class CommonService {
    constructor(private readonly configService: ConfigService) {}

    paginate<T extends BaseModel>(
        dto: BasePaginationDto,
        repository: Repository<T>,
        overrideFindOptions: FindManyOptions<T> = {},
        path: string,
    ) {
        if (dto.page) {
            return this.pagePaginate(dto, repository, overrideFindOptions);
        } else {
            return this.cursorPaginate(
                dto,
                repository,
                overrideFindOptions,
                path,
            );
        }
    }

    private async pagePaginate<T extends BaseModel>(
        dto: BasePaginationDto,
        repository: Repository<T>,
        overrideFindOptions: FindManyOptions<T> = {},
    ) {
        const findOptions = this.composeFindOptions<T>(dto);

        const [data, count] = await repository.findAndCount({
            ...findOptions,
            ...overrideFindOptions,
        });

        return {
            data,
            total: count,
        };
    }

    private async cursorPaginate<T extends BaseModel>(
        dto: BasePaginationDto,
        repository: Repository<T>,
        overrideFindOptions: FindManyOptions<T> = {},
        path: string,
    ) {
        const findOptions = this.composeFindOptions<T>(dto);

        const results = await repository.find({
            ...findOptions,
            ...overrideFindOptions,
        });

        const lastItem =
            results.length > 0 && results.length === dto.take
                ? results[results.length - 1]
                : null;
        const protocol = this.configService.get<string>(ENV_POROTOCOL_KEY);
        const host = this.configService.get<string>(ENV_HOST_KEY);
        const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`);

        if (nextUrl) {
            for (const key of Object.keys(dto)) {
                if (dto[key]) {
                    if (
                        key !== 'where__id__more_than' &&
                        key !== 'where__id__less_than'
                    ) {
                        nextUrl.searchParams.append(key, dto[key]);
                    }
                }
            }

            let key;

            if (dto.order__createdAt === 'ASC') {
                key = 'where__id__more_than';
            } else {
                key = 'where__id__less_than';
            }

            nextUrl.searchParams.append(key, lastItem.id.toString());
        }

        return {
            data: results,
            cursor: {
                after: lastItem?.id ?? null,
            },
            count: results.length,
            nextUrl: nextUrl?.toString(),
        };
    }

    private composeFindOptions<T extends BaseModel>(
        dto: BasePaginationDto,
    ): FindManyOptions<T> {
        let where: FindOptionsWhere<T> = {};
        let order: FindOptionsOrder<T> = {};

        for (const [key, value] of Object.entries(dto)) {
            if (value) {
                if (key.startsWith('where__')) {
                    where = {
                        ...where,
                        ...this.parseWhereFilter(key, value),
                    };
                } else if (key.startsWith('order__')) {
                    order = {
                        ...order,
                        ...this.parseWhereFilter(key, value),
                    };
                }
            }
        }

        return {
            where,
            order,
            take: dto.take,
            skip: dto.page && dto.take * (dto.page - 1),
        };
    }

    private parseWhereFilter<T extends BaseModel>(
        key: string,
        value: any,
    ): FindOptionsWhere<T> | FindOptionsOrder<T> {
        const options: FindOptionsWhere<T> = {};
        const split = key.split('__');

        if (split.length !== 2 && split.length !== 3) {
            throw new BadRequestException(
                `where 필터는 '__'로 split 했을때 길이가 2 또는 3이어야 합니다. - 문제되는 키값: ${key}`,
            );
        }
        /**
         * 길이가 2인 경우는
         * where__id = 3
         *
         * FindOptionsWhere로 풀어보면
         *
         * {
         * where: {
         *      id: 3,
         * }
         * }
         */
        if (split.length === 2) {
            const [_, field] = split;

            options[field] = value;
        } else {
            /**
             * 길이가 3일 경우에는 Typeorm 유틸리티 적용이 필요
             *
             * where__id__more_than의 경우
             * where는 버려도 되고 두번째 값은 필터할 키값이 되고
             * 세번째 값은 typeorm 유틸리티가 된다.
             *
             * FILTER_MAPPER에 미리 정의해둔 값들로
             * field 값에 FILTER_MAPPER에서 해당되는 utility를 가저온 후
             * 값에 적용 해준다.
             */
            const [_, field, operator] = split;

            // where__id__between = 3,4
            // const values = value.toString().split(',');
            // if (operator === 'between') {
            //     options[field] = FILTER_MAPPER[operator](values[0], values[1]);
            // } else {
            //     options[field] = FILTER_MAPPER[operator](value);
            // }
            if (operator === 'i_like') {
                options[field] = FILTER_MAPPER[operator](`%${value}%`);
            } else {
                options[field] = FILTER_MAPPER[operator](value);
            }
        }

        return options;
    }
}
