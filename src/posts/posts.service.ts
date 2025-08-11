import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    FindOptionsWhere,
    LessThan,
    MoreThan,
    QueryRunner,
    Repository,
} from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import {
    ENV_HOST_KEY,
    ENV_POROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { ImageModel } from 'src/common/entities/image.entity';
import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(PostsModel)
        private readonly postsRepository: Repository<PostsModel>,
        @InjectRepository(ImageModel)
        private readonly imageRepository: Repository<ImageModel>,
        private readonly commonService: CommonService,
        private readonly configService: ConfigService,
    ) {}

    async getAllPosts() {
        return this.postsRepository.find({
            ...DEFAULT_POST_FIND_OPTIONS,
        });
    }

    async generatePosts(userId: number) {
        for (let i = 0; i < 100; i++) {
            await this.createPost(userId, {
                title: `제목 생성${i}`,
                content: `내용 생성${i}`,
                images: [],
            });
        }
    }

    async paginatePost(dto: PaginatePostDto) {
        return this.commonService.paginate(
            dto,
            this.postsRepository,
            {
                ...DEFAULT_POST_FIND_OPTIONS,
            },
            'posts',
        );
        // if (dto.page) {
        //     return this.pagePaginatePosts(dto);
        // } else {
        //     return this.cursorPaginatePosts(dto);
        // }
    }

    async pagePaginatePosts(dto: PaginatePostDto) {
        if (dto.page) {
            const [posts, count] = await this.postsRepository.findAndCount({
                skip: dto.take * (dto.page - 1),
                take: dto.take,
                order: {
                    createdAt: dto.order__createdAt,
                },
            });

            return {
                data: posts,
                total: count,
            };
        }
    }

    async cursorPaginatePosts(dto: PaginatePostDto) {
        const where: FindOptionsWhere<PostsModel> = {};

        if (dto.where__id__less_than) {
            where.id = LessThan(dto.where__id__less_than);
        } else if (dto.where__id__more_than) {
            where.id = MoreThan(dto.where__id__more_than);
        }

        const posts = await this.postsRepository.find({
            where,
            order: {
                createdAt: dto.order__createdAt,
            },
            take: dto.take,
        });

        const lastItem =
            posts.length > 0 && posts.length === dto.take
                ? posts[posts.length - 1]
                : null;
        const protocol = this.configService.get<string>(ENV_POROTOCOL_KEY);
        const host = this.configService.get<string>(ENV_HOST_KEY);
        const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);

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
            data: posts,
            cursor: {
                after: lastItem?.id ?? null,
            },
            count: posts.length,
            next: nextUrl?.toString(),
        };
    }
    async getPostById(id: number) {
        const post = await this.postsRepository.findOne({
            ...DEFAULT_POST_FIND_OPTIONS,
            where: {
                id,
            },
        });

        if (!post) {
            throw new NotFoundException();
        }

        return post;
    }

    getRepository(qr?: QueryRunner) {
        return qr
            ? qr.manager.getRepository<PostsModel>(PostsModel)
            : this.postsRepository;
    }

    async createPost(
        authorId: number,
        postDto: CreatePostDto,
        qr?: QueryRunner,
    ) {
        const repository = this.getRepository(qr);

        const post = repository.create({
            author: {
                id: authorId,
            },
            ...postDto,
            images: [],
            likeCount: 0,
            commentCount: 0,
        });

        const newPost = await repository.save(post);

        return newPost;
    }

    async updatePost(postId: number, postDto: UpdatePostDto) {
        // save 기능
        // 1) 데이터가 존재하지 않으면 새로 생성
        // 2) 데이터가 존재한다면 업데이트

        const { title, content } = postDto;

        const post = await this.postsRepository.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException();
        }

        if (title) {
            post.title = title;
        }

        if (content) {
            post.content = content;
        }

        const newPost = await this.postsRepository.save(post);

        return newPost;
    }

    async deletePost(postId: number) {
        const post = await this.postsRepository.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException();
        }

        await this.postsRepository.delete(postId);

        return postId;
    }
}
