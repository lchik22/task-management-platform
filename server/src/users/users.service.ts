import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from './types/role.enum';

const BCRYPT_ROUNDS = 12;
const MONGO_DUPLICATE_KEY_ERROR = 11000;

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.userModel
      .exists({ email: email.toLowerCase() })
      .exec();
    return result !== null;
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    try {
      const created = await this.userModel.create({
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role ?? Role.USER,
      });
      return created;
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        (err as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR
      ) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }
}
