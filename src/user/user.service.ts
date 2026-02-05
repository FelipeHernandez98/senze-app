import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CustomExceptions } from 'src/common/exceptions/custom-exceptions';
import { StatesEnum } from 'src/common/enums/states.enum';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({ where: { username: createUserDto.username } });
    if (existingUser) {
      throw CustomExceptions.UserAlreadyExistsException(createUserDto.username);
    }
    const user = this.userRepository.create({
      ...createUserDto,
      stateId: StatesEnum.ACTIVE,
      createdAt: new Date(),
      roleId: 1
    });
    user.password = await bcrypt.hash(user.password, 10);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    if (users.length === 0) {
      throw CustomExceptions.ThereAreNoRecordsException();
    }
    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw CustomExceptions.UserNotFoundException(id);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, { ...updateUserDto });
    const updatedUser = await this.findOne(id);
    if (!updatedUser) {
      throw CustomExceptions.UserNotFoundException(id);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw CustomExceptions.UserNotFoundException(id);
    }
  }
}
