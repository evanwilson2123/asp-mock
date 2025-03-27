import { Schema, Types, models, model } from 'mongoose';

export interface ITagFolder {
  _id: Types.ObjectId;
  name: string;
  tags: Types.ObjectId[];
}

const tagFolderSchema = new Schema<ITagFolder>({
  name: { type: String, required: true },
  tags: [{ type: Types.ObjectId, required: false }],
});

const TagFolder =
  models.TagFolder || model<ITagFolder>('TagFolder', tagFolderSchema);

export default TagFolder;
