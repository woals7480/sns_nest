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
    Request,
    UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGurad } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';

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
    @UseGuards(AccessTokenGurad)
    postPost(
        @User('id') userId: number,
        @Body('title') title: string,
        @Body('content') content: string,
    ) {
        return this.postsService.createPost(userId, title, content);
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
