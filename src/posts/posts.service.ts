import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
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
import { basename, join } from 'path';
import {
    POST_IMAGE_PATH,
    PUBLIC_FOLDER_PATH,
    TEMP_FOLDER_PATH,
} from 'src/common/const/path.const';
import { promises } from 'fs';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(PostsModel)
        private readonly postsRepository: Repository<PostsModel>,
        private readonly commonService: CommonService,
        private readonly configService: ConfigService,
    ) {}

    async getAllPosts() {
        return this.postsRepository.find({
            relations: ['author'],
        });
    }

    async generatePosts(userId: number) {
        for (let i = 0; i < 100; i++) {
            await this.createPost(userId, {
                title: `제목 생성${i}`,
                content: `내용 생성${i}`,
            });
        }
    }

    async paginatePost(dto: PaginatePostDto) {
        return this.commonService.paginate(
            dto,
            this.postsRepository,
            {
                relations: ['author'],
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
            where: {
                id,
            },
            relations: ['author'],
        });

        if (!post) {
            throw new NotFoundException();
        }

        return post;
    }
    async createPostImage(dto: CreatePostDto) {
        // dto의 이미지 이름을 기반으로 파일 경로를 생성.
        if (dto.image) {
            const tempFilePath = join(TEMP_FOLDER_PATH, dto.image);

            try {
                // 파일이 존재하는지 확인
                await promises.access(tempFilePath);
            } catch (e) {
                throw new BadRequestException('존재하지 않는 파일입니다.');
            }

            const filename = basename(tempFilePath);

            // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
            // {프로젝트 경로}/public/posts/asdf.jpg
            const newPath = join(POST_IMAGE_PATH, filename);

            await promises.rename(tempFilePath, newPath);

            return true;
        }
    }

    async createPost(authorId: number, postDto: CreatePostDto) {
        const post = this.postsRepository.create({
            author: {
                id: authorId,
            },
            ...postDto,
            likeCount: 0,
            commentCount: 0,
        });

        const newPost = await this.postsRepository.save(post);

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
