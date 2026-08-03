import { User } from "@/lib/db/models";
import {
  buildEqualityFilter,
  buildSearchFilter,
  buildSort,
  getSkip,
} from "@/lib/utils/query";
import type { UserListQueryInput } from "@/lib/validators/user.validator";

const USER_SORT_MAP = {
  newest: { createdAt: -1 as const },
  oldest: { createdAt: 1 as const },
  name_asc: { name: 1 as const },
  name_desc: { name: -1 as const },
};

export class UserRepository {
  findAll(query: UserListQueryInput) {
    const filter = {
      ...buildEqualityFilter({
        role: query.role,
        isActive: query.isActive,
      }),
      ...buildSearchFilter(query.search, ["name", "email"]),
    };

    const sort = buildSort(query.sort, USER_SORT_MAP);
    const skip = getSkip(query.page, query.limit);

    return Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      User.countDocuments(filter),
    ]);
  }

  findById(id: string) {
    return User.findById(id).lean();
  }

  update(id: string, data: Record<string, unknown>) {
    return User.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}

export const userRepository = new UserRepository();
