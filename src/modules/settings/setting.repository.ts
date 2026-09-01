import { Setting, type ISetting } from "@/lib/db/models";

export class SettingRepository {
  async findByKey(key: string): Promise<ISetting | null> {
    return Setting.findOne({ key });
  }

  async findByKeys(keys: string[]): Promise<ISetting[]> {
    return Setting.find({ key: { $in: keys } });
  }

  async findByGroup(group: string): Promise<ISetting[]> {
    return Setting.find({ group }).sort({ key: 1 });
  }

  async findAll(): Promise<ISetting[]> {
    return Setting.find().sort({ group: 1, key: 1 });
  }

  async upsert(input: {
    key: string;
    value: unknown;
    group: string;
    description?: string;
  }): Promise<ISetting> {
    return Setting.findOneAndUpdate(
      { key: input.key },
      {
        $set: {
          value: input.value,
          group: input.group,
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
        },
        $setOnInsert: { key: input.key },
      },
      { upsert: true, new: true }
    ) as Promise<ISetting>;
  }

  async upsertMany(
    items: Array<{
      key: string;
      value: unknown;
      group: string;
      description?: string;
    }>
  ) {
    await Promise.all(items.map((item) => this.upsert(item)));
  }
}

export const settingRepository = new SettingRepository();
