import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";


export class CustomExceptions {
    static UserNotFoundException(userId: string): NotFoundException {
        return new NotFoundException(`User with id ${userId} not found`);
    }

    static UserAlreadyExistsException(username: string): ConflictException {
        return new ConflictException(`User with username ${username} already exists`);
    }

    static InvalidCredentialsException(): UnauthorizedException {
        return new UnauthorizedException('Invalid username or password');
    }

    static ThereAreNoRecordsException(): NotFoundException {
        return new NotFoundException('There is no record');
    }
}