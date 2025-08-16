import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';
import { UserFollowersModel } from './entities/user-followers.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UsersModel)
        private readonly usersRepository: Repository<UsersModel>,
        @InjectRepository(UserFollowersModel)
        private readonly userFollowersRepository: Repository<UserFollowersModel>,
    ) {}

    async createUser(
        user: Pick<UsersModel, 'email' | 'nickname' | 'password'>,
    ) {
        const nicknameExists = await this.usersRepository.exists({
            where: {
                nickname: user.nickname,
            },
        });

        if (nicknameExists) {
            throw new BadRequestException('이미 존재하는 nickname 입니다.');
        }

        const emailExists = await this.usersRepository.exists({
            where: {
                email: user.email,
            },
        });

        if (emailExists) {
            throw new BadRequestException('이미 가입한 email 입니다.');
        }

        const userObject = this.usersRepository.create({
            nickname: user.nickname,
            email: user.email,
            password: user.password,
        });

        const newUser = await this.usersRepository.save(userObject);

        return newUser;
    }

    async getAllUsers() {
        return this.usersRepository.find();
    }

    async getUserByEmail(email: string) {
        return this.usersRepository.findOne({
            where: {
                email,
            },
        });
    }

    async followUser(followerId: number, followeeId: number) {
        const result = await this.userFollowersRepository.save({
            follower: {
                id: followerId,
            },
            followee: {
                id: followeeId,
            },
        });

        return result;
    }

    async getFollowers(userId: number, includeNotConfirmed: boolean) {
        const where = {
            followee: {
                id: userId,
            },
        };

        if (!includeNotConfirmed) {
            where['isConfirmed'] = true;
        }

        const result = await this.userFollowersRepository.find({
            where: {
                followee: {
                    id: userId,
                },
            },
            relations: {
                follower: true,
                followee: true,
            },
        });

        return result.map((v) => ({
            id: v.follower.id,
            nickname: v.follower.nickname,
            email: v.follower.email,
            isConfirmed: v.isConfirmed,
        }));
    }

    async confirmFollow(followerId: number, followeeId: number) {
        const existing = await this.userFollowersRepository.findOne({
            where: {
                follower: {
                    id: followerId,
                },
                followee: {
                    id: followeeId,
                },
            },
            relations: {
                followee: true,
                follower: true,
            },
        });

        if (!existing) {
            throw new BadRequestException('존재하지 않는 팔로우 요청입니다.');
        }

        await this.userFollowersRepository.save({
            ...existing,
            isConfirmed: true,
        });

        return true;
    }

    async deleteFollow(followId: number, followeeId: number) {
        await this.userFollowersRepository.delete({
            follower: {
                id: followId,
            },
            followee: {
                id: followeeId,
            },
        });

        return true;
    }
}
