import RoleModel from "../models/roles-permission.model";
import { RolePermissions } from "./role-permission";

export const ensureDefaultRoles = async () => {
  for (const roleName in RolePermissions) {
    const role = roleName as keyof typeof RolePermissions;
    await RoleModel.updateOne(
      { name: role },
      {
        $set: {
          name: role,
          permissions: RolePermissions[role],
        },
      },
      { upsert: true }
    );
  }
};
