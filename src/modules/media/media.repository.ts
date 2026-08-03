import { Media, type IMedia, type MediaPurpose } from "@/lib/db/models/media.model";

export class MediaRepository {
  create(data: {
    filename: string;
    mimeType: string;
    size: number;
    path: string;
    url: string;
    purpose?: MediaPurpose;
  }) {
    return Media.create(data);
  }

  findById(id: string) {
    return Media.findById(id).lean();
  }

  /** Prefer disk path; include legacy `data` only when needed for old records. */
  findByIdForServe(id: string) {
    return Media.findById(id)
      .select("+data path url mimeType filename size")
      .lean<
        Pick<IMedia, "path" | "url" | "mimeType" | "filename" | "size" | "data"> & {
          _id: IMedia["_id"];
        }
      >();
  }

  deleteById(id: string) {
    return Media.findByIdAndDelete(id);
  }
}

export type MediaDoc = IMedia;
export const mediaRepository = new MediaRepository();
