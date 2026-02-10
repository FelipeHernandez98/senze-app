import { applyDecorators, UseGuards } from "@nestjs/common";
import { RoleProtected } from "./role-protected.decorator";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "src/common/enums/roles.enum";


export function Auth(...roles: Roles[]){
     return applyDecorators(
        RoleProtected(...roles),
        UseGuards( AuthGuard(), RolesGuard )
     )
}