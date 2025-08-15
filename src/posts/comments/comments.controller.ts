import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PaginateCommentDto } from './dto/paginate-comments.dto';
import { AccessTokenGurad } from 'src/auth/guard/bearer-token.guard';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { UpdateCommentsDto } from './dto/update-comments.dto';
import { isPublic } from 'src/common/decorator/is-public.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {
        /**
         * 1) Entity 생성
         * author -> 작성자
         * post -> 귀속되는 포스트
         * comment -> 실제댓글 내용
         * likeCount -> 좋아요 갯수
         *
         * id -> PrimaryGeneratedColumn
         * createdAt -> 생성일자
         * updatedAt -> 업데이트 일자
         *
         * 2) GET() pagination
         * 3) GET(':commentId') 특정 comment만 하나 가져오는 기능
         * 4) POST() 코멘트 생성하는 기능
         * 5) PATCH(':commentId') 특정 comment 업데이트 하는 기능
         * 6) DELETE(':commentId') 특정 comment 삭제하는 기능
         */
    }

    @Get()
    @isPublic()
    getComments(
        @Param('postId', ParseIntPipe) postId: number,
        @Query() query: PaginateCommentDto,
    ) {
        return this.commentsService.paginateComments(postId, query);
    }

    @Get(':commentId')
    @isPublic()
    getComment(@Param('commentId', ParseIntPipe) commentId: number) {
        return this.commentsService.getCommentById(commentId);
    }

    @Post()
    postComment(
        @Param('postId', ParseIntPipe) postId: number,
        @Body() body: CreateCommentsDto,
        @User() user: UsersModel,
    ) {
        return this.commentsService.createComment(body, postId, user);
    }

    @Patch(':commentId')
    patchComment(
        @Param('commentId', ParseIntPipe) commentId: number,
        @Body() body: UpdateCommentsDto,
    ) {
        return this.commentsService.updateComment(commentId, body);
    }

    @Delete(':commentId')
    deleteComment(@Param('commentId', ParseIntPipe) commentId: number) {
        return this.commentsService.deleteComment(commentId);
    }
}
