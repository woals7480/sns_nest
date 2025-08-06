import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(PostsModel)
        private readonly postsRepository: Repository<PostsModel>,
    ) {}

    async getAllPosts() {
        return this.postsRepository.find({
            relations: ['author'],
        });
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
