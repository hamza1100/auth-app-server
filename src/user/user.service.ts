import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    const { email, password } = createUserDto;
    this.logger.log(`[User Service] - Create => finding existing user`);
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    this.logger.log(`[User Service] - Create => Creating new user`);
    await newUser.save();
    const payload = { email: newUser.email, sub: newUser._id };
    const jwtSecret = this.configService.get<string>('jwtSecret');
    const token = this.jwtService.sign(payload, { secret: jwtSecret });
    return { token };
  }

  async login(loginUserDto: LoginUserDto): Promise<any> {
    const { email, password } = loginUserDto;
    this.logger.log(`[User Service] - login => finding user`);
    const user = await this.userModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { email: user.email, sub: user._id };
    const jwtSecret = this.configService.get<string>('jwtSecret');
    const token = this.jwtService.sign(payload, { secret: jwtSecret });
    return { token };
  }
}
