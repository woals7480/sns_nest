import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PaginateCommentDto } from './dto/paginate-comments.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentsModel } from './entities/comments.entity';
import { Repository } from 'typeorm';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UsersModel } from 'src/users/entities/users.entity';
import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comment-find-options.const';
import { UpdateCommentsDto } from './dto/update-comments.dto';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(CommentsModel)
        private readonly commentRepository: Repository<CommentsModel>,
        private readonly commonService: CommonService,
    ) {}

    paginateComments(postId: number, dto: PaginateCommentDto) {
        return this.commonService.paginate(
            dto,
            this.commentRepository,
            {
                ...DEFAULT_COMMENT_FIND_OPTIONS,
                where: {
                    post: {
                        id: postId,
                    },
                },
            },
            `posts/${postId}/comments`,
        );
    }

    async getCommentById(id: number) {
        const comment = await this.commentRepository.findOne({
            ...DEFAULT_COMMENT_FIND_OPTIONS,
            where: {
                id,
            },
        });

        if (!comment) {
            throw new BadRequestException(
                `id: ${id} Comment는 존재하지 않습니다.`,
            );
        }

        return comment;
    }

    async createComment(
        dto: CreateCommentsDto,
        postId: number,
        author: UsersModel,
    ) {
        return this.commentRepository.save({
            ...dto,
            post: {
                id: postId,
            },
            author: {
                id: author.id,
            },
        });
    }

    async updateComment(commentId: number, dto: UpdateCommentsDto) {
        const prevComment = await this.commentRepository.preload({
            id: commentId,
            ...dto,
        });

        if (!prevComment) {
            throw new BadRequestException('댓글이 존재하지 않습니다.');
        }

        const newComment = await this.commentRepository.save(prevComment);

        return newComment;
    }

    async deleteComment(commentId: number) {
        const comment = await this.commentRepository.findOne({
            where: {
                id: commentId,
            },
        });

        if (!comment) {
            throw new BadRequestException('존재하지 않는 댓글입니다.');
        }

        await this.commentRepository.delete(commentId);

        return commentId;
    }
}
