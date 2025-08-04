import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
} from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    // 전체 posts
    @Get()
    getPosts() {
        return this.postsService.getAllPosts();
    }

    // 해당 posts
    @Get(':id')
    getPost(@Param('id', ParseIntPipe) id: number) {
        return this.postsService.getPostById(id);
    }

    // post 생성
    @Post()
    postPost(
        @Body('authorId') authorId: number,
        @Body('title') title: string,
        @Body('content') content: string,
    ) {
        return this.postsService.createPost(authorId, title, content);
    }

    // 해당 post 변경
    @Put(':id')
    putPost(
        @Param('id', ParseIntPipe) id: number,
        @Body('title') title?: string,
        @Body('content') content?: string,
    ) {
        return this.postsService.updatePost(id, title, content);
    }

    // post 삭제
    @Delete(':id')
    deletePost(@Param('id', ParseIntPipe) id: number) {
        return this.postsService.deletePost(id);
    }
}
